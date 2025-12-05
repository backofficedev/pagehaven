import { env } from "cloudflare:workers";
import { db } from "@pagehaven/db";
import {
  githubConnection,
  siteGithubConfig,
} from "@pagehaven/db/schema/github";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { requireSitePermissionFromContext } from "../lib/check-site-permission";

function generateId(): string {
  return crypto.randomUUID();
}

function generateWebhookSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// GitHub API types
type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
};

type GitHubBranch = {
  name: string;
  commit: {
    sha: string;
  };
};

/**
 * Gets the GitHub connection for a user, throwing if not connected
 */
async function getGithubConnectionOrThrow(userId: string) {
  const connection = await db
    .select()
    .from(githubConnection)
    .where(eq(githubConnection.userId, userId))
    .get();

  if (!connection) {
    throw new Error("GitHub not connected");
  }

  return connection;
}

// GitHub API helper
async function githubFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PageHaven",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

export const githubRouter = {
  // Get OAuth authorization URL
  getAuthUrl: protectedProcedure.handler(() => {
    const clientId = env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error("GitHub OAuth not configured");
    }

    const state = crypto.randomUUID();
    const redirectUri = `${env.BETTER_AUTH_URL}/api/github/callback`;
    const scopes = "repo,read:user";

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);

    return {
      url: url.toString(),
      state,
    };
  }),

  // Exchange OAuth code for access token and save connection
  handleCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
        userId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;

      if (!(clientId && clientSecret)) {
        throw new Error("GitHub OAuth not configured");
      }

      // Exchange code for access token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: input.code,
          }),
        }
      );

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        error?: string;
        scope?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        throw new Error(tokenData.error ?? "Failed to get access token");
      }

      // Get GitHub user info
      const githubUser = await githubFetch<GitHubUser>(
        "/user",
        tokenData.access_token
      );

      // Check if connection already exists
      const existing = await db
        .select()
        .from(githubConnection)
        .where(eq(githubConnection.userId, input.userId))
        .get();

      if (existing) {
        // Update existing connection
        await db
          .update(githubConnection)
          .set({
            githubUserId: String(githubUser.id),
            githubUsername: githubUser.login,
            githubAvatarUrl: githubUser.avatar_url,
            accessToken: tokenData.access_token,
            scopes: tokenData.scope ?? "repo",
          })
          .where(eq(githubConnection.id, existing.id));
      } else {
        // Create new connection
        await db.insert(githubConnection).values({
          id: generateId(),
          userId: input.userId,
          githubUserId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAvatarUrl: githubUser.avatar_url,
          accessToken: tokenData.access_token,
          scopes: tokenData.scope ?? "repo",
        });
      }

      return {
        success: true,
        username: githubUser.login,
      };
    }),

  // Get current user's GitHub connection status
  getConnection: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const connection = await db
      .select({
        id: githubConnection.id,
        githubUsername: githubConnection.githubUsername,
        githubAvatarUrl: githubConnection.githubAvatarUrl,
        scopes: githubConnection.scopes,
        createdAt: githubConnection.createdAt,
      })
      .from(githubConnection)
      .where(eq(githubConnection.userId, userId))
      .get();

    return connection ?? null;
  }),

  // Disconnect GitHub account
  disconnect: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    await db
      .delete(githubConnection)
      .where(eq(githubConnection.userId, userId));

    return { success: true };
  }),

  // List user's GitHub repositories
  listRepos: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(30),
      })
    )
    .handler(async ({ input, context }) => {
      const connection = await getGithubConnectionOrThrow(
        context.session.user.id
      );

      const repos = await githubFetch<GitHubRepo[]>(
        `/user/repos?page=${input.page}&per_page=${input.perPage}&sort=updated&affiliation=owner,collaborator`,
        connection.accessToken
      );

      return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
      }));
    }),

  // Get branches for a repository
  listBranches: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const connection = await getGithubConnectionOrThrow(
        context.session.user.id
      );

      const branches = await githubFetch<GitHubBranch[]>(
        `/repos/${input.owner}/${input.repo}/branches`,
        connection.accessToken
      );

      return branches.map((branch) => ({
        name: branch.name,
        sha: branch.commit.sha,
      }));
    }),

  // Link a site to a GitHub repository
  linkRepo: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        repoOwner: z.string(),
        repoName: z.string(),
        branch: z.string().default("main"),
        buildCommand: z.string().optional(),
        outputDirectory: z.string().default("dist"),
        installCommand: z.string().optional(),
        autoDeploy: z.boolean().default(true),
      })
    )
    .handler(async ({ input, context }) => {
      // Check permission (admin+ can link repos)
      await requireSitePermissionFromContext(context, input.siteId, "admin");

      // Verify GitHub connection exists
      await getGithubConnectionOrThrow(context.session.user.id);

      // Check if already linked
      const existing = await db
        .select()
        .from(siteGithubConfig)
        .where(eq(siteGithubConfig.siteId, input.siteId))
        .get();

      const webhookSecret = generateWebhookSecret();
      const repoFullName = `${input.repoOwner}/${input.repoName}`;

      if (existing) {
        // Update existing config
        await db
          .update(siteGithubConfig)
          .set({
            repoOwner: input.repoOwner,
            repoName: input.repoName,
            repoBranch: input.branch,
            repoFullName,
            buildCommand: input.buildCommand,
            outputDirectory: input.outputDirectory,
            installCommand: input.installCommand,
            autoDeploy: input.autoDeploy,
          })
          .where(eq(siteGithubConfig.id, existing.id));

        return { id: existing.id, webhookSecret: existing.webhookSecret };
      }

      // Create new config
      const id = generateId();
      await db.insert(siteGithubConfig).values({
        id,
        siteId: input.siteId,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        repoBranch: input.branch,
        repoFullName,
        buildCommand: input.buildCommand,
        outputDirectory: input.outputDirectory,
        installCommand: input.installCommand,
        autoDeploy: input.autoDeploy,
        webhookSecret,
      });

      return { id, webhookSecret };
    }),

  // Get site's GitHub config
  getSiteConfig: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      // Check permission (viewer+ can see config)
      await requireSitePermissionFromContext(context, input.siteId, "viewer");

      const config = await db
        .select({
          id: siteGithubConfig.id,
          repoOwner: siteGithubConfig.repoOwner,
          repoName: siteGithubConfig.repoName,
          repoBranch: siteGithubConfig.repoBranch,
          repoFullName: siteGithubConfig.repoFullName,
          buildCommand: siteGithubConfig.buildCommand,
          outputDirectory: siteGithubConfig.outputDirectory,
          installCommand: siteGithubConfig.installCommand,
          autoDeploy: siteGithubConfig.autoDeploy,
          lastDeployedCommit: siteGithubConfig.lastDeployedCommit,
          lastDeployedAt: siteGithubConfig.lastDeployedAt,
        })
        .from(siteGithubConfig)
        .where(eq(siteGithubConfig.siteId, input.siteId))
        .get();

      return config ?? null;
    }),

  // Unlink a site from GitHub
  unlinkRepo: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      // Check permission (admin+ can unlink repos)
      await requireSitePermissionFromContext(context, input.siteId, "admin");

      await db
        .delete(siteGithubConfig)
        .where(eq(siteGithubConfig.siteId, input.siteId));

      return { success: true };
    }),

  // Update site's GitHub config
  updateSiteConfig: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        branch: z.string().optional(),
        buildCommand: z.string().nullable().optional(),
        outputDirectory: z.string().optional(),
        installCommand: z.string().nullable().optional(),
        autoDeploy: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Check permission (admin+ can update config)
      await requireSitePermissionFromContext(context, input.siteId, "admin");

      const updates: Partial<typeof siteGithubConfig.$inferInsert> = {};

      if (input.branch !== undefined) {
        updates.repoBranch = input.branch;
      }
      if (input.buildCommand !== undefined) {
        updates.buildCommand = input.buildCommand;
      }
      if (input.outputDirectory !== undefined) {
        updates.outputDirectory = input.outputDirectory;
      }
      if (input.installCommand !== undefined) {
        updates.installCommand = input.installCommand;
      }
      if (input.autoDeploy !== undefined) {
        updates.autoDeploy = input.autoDeploy;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("No updates provided");
      }

      await db
        .update(siteGithubConfig)
        .set(updates)
        .where(eq(siteGithubConfig.siteId, input.siteId));

      return { success: true };
    }),
};
