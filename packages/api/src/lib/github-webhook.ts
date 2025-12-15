import { db } from "@pagehaven/db";
import {
  githubConnection,
  siteGithubConfig,
} from "@pagehaven/db/schema/github";
import { deployment, site } from "@pagehaven/db/schema/site";
import { getContentType } from "@pagehaven/utils/mime-types";
import { eq } from "drizzle-orm";
import { githubFetch } from "./github-api";
import { uploadFile } from "./storage";

/**
 * Safely convert a Buffer or ArrayBufferLike to a proper ArrayBuffer
 * This handles both Node.js Buffer and browser ArrayBuffer scenarios
 */
function convertBufferToArrayBuffer(buffer: ArrayBufferLike): ArrayBuffer {
  // Create a Uint8Array view of the buffer to handle all types uniformly
  const uint8Array = new Uint8Array(buffer);

  // Extract the actual ArrayBuffer portion, ensuring we get a regular ArrayBuffer
  const sourceBuffer = uint8Array.buffer;

  // If it's already a regular ArrayBuffer, slice the relevant portion
  if (!(sourceBuffer instanceof SharedArrayBuffer)) {
    return sourceBuffer.slice(
      uint8Array.byteOffset,
      uint8Array.byteOffset + uint8Array.byteLength
    );
  }

  // For SharedArrayBuffer, create a new ArrayBuffer with the data
  const tempArray = new Uint8Array(uint8Array.byteLength);
  tempArray.set(uint8Array);
  return tempArray.buffer;
}

// GitHub webhook event types
type GitHubPushEvent = {
  ref: string;
  after: string;
  repository: {
    full_name: string;
    default_branch: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  } | null;
  sender: {
    id: number;
    login: string;
  };
};

type GitHubTreeItem = {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

type GitHubBlob = {
  content: string;
  encoding: "base64" | "utf-8";
  size: number;
};

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Verify GitHub webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `sha256=${expectedSignature}` === signature;
}

/**
 * Get file content from GitHub
 */
async function getFileContent(
  owner: string,
  repo: string,
  sha: string,
  accessToken: string
): Promise<Buffer> {
  const blob = await githubFetch<GitHubBlob>(
    `/repos/${owner}/${repo}/git/blobs/${sha}`,
    accessToken
  );

  if (blob.encoding === "base64") {
    // Decode base64 to buffer
    const binaryString = atob(blob.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Buffer.from(bytes);
  }

  return Buffer.from(blob.content, "utf-8");
}

type DeploymentContext = {
  config: typeof siteGithubConfig.$inferSelect;
  siteInfo: typeof site.$inferSelect;
  connection: typeof githubConnection.$inferSelect;
  commitHash: string;
  commitMessage: string;
  branch: string;
};

/**
 * Validate push event and get deployment context
 */
async function getDeploymentContext(
  event: GitHubPushEvent
): Promise<{ context: DeploymentContext } | { error: string; skip?: boolean }> {
  const repoFullName = event.repository.full_name;
  const branch = event.ref.replace("refs/heads/", "");

  const config = await db
    .select()
    .from(siteGithubConfig)
    .where(eq(siteGithubConfig.repoFullName, repoFullName))
    .get();

  if (!config) {
    return { error: "No site configured for this repository" };
  }

  if (config.repoBranch !== branch || !config.autoDeploy) {
    return { error: "Skipped", skip: true };
  }

  const siteInfo = await db
    .select()
    .from(site)
    .where(eq(site.id, config.siteId))
    .get();

  if (!siteInfo) {
    return { error: "Site not found" };
  }

  const connection = await db
    .select()
    .from(githubConnection)
    .where(eq(githubConnection.userId, siteInfo.createdBy))
    .get();

  if (!connection) {
    return { error: "GitHub connection not found" };
  }

  return {
    context: {
      config,
      siteInfo,
      connection,
      commitHash: event.after,
      commitMessage: event.head_commit?.message ?? `Deploy from ${branch}`,
      branch,
    },
  };
}

/**
 * Get files to upload from GitHub tree
 */
function getFilesToUpload(
  tree: GitHubTreeItem[],
  outputDir: string
): GitHubTreeItem[] {
  const normalizedDir = outputDir.replace(/^\/|\/$/g, "");
  let files = tree.filter(
    (item) =>
      item.type === "blob" &&
      (normalizedDir === "" || item.path.startsWith(`${normalizedDir}/`))
  );

  if (files.length === 0) {
    files = tree.filter((item) => item.type === "blob");
  }

  return files;
}

/**
 * Process a GitHub push event and trigger deployment
 */
export async function processGitHubPush(
  event: GitHubPushEvent
): Promise<{ success: boolean; deploymentId?: string; error?: string }> {
  const result = await getDeploymentContext(event);

  if ("error" in result) {
    if (result.skip) {
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  const { config, siteInfo, connection, commitHash, commitMessage } =
    result.context;

  const deploymentId = generateId();
  const storagePath = `sites/${config.siteId}/deployments/${deploymentId}/`;

  await db.insert(deployment).values({
    id: deploymentId,
    siteId: config.siteId,
    storagePath,
    status: "processing",
    commitHash,
    commitMessage: commitMessage.slice(0, 500),
    deployedBy: siteInfo.createdBy,
  });

  try {
    const tree = await githubFetch<{ tree: GitHubTreeItem[] }>(
      `/repos/${config.repoOwner}/${config.repoName}/git/trees/${commitHash}?recursive=1`,
      connection.accessToken
    );

    const filesToUpload = getFilesToUpload(tree.tree, config.outputDirectory);

    if (filesToUpload.length === 0) {
      throw new Error("No files found to deploy");
    }

    let totalSize = 0;
    let fileCount = 0;
    const outputDir = config.outputDirectory.replace(/^\/|\/$/g, "");

    // Upload each file
    for (const file of filesToUpload) {
      // Remove output directory prefix from path
      let filePath = file.path;
      if (outputDir && filePath.startsWith(`${outputDir}/`)) {
        filePath = filePath.slice(outputDir.length + 1);
      }

      const content = await getFileContent(
        config.repoOwner,
        config.repoName,
        file.sha,
        connection.accessToken
      );

      const key = `${storagePath}${filePath}`;
      const contentType = getContentType(filePath);

      // Convert Buffer to ArrayBuffer safely
      const arrayBuffer = convertBufferToArrayBuffer(content.buffer);

      await uploadFile(key, arrayBuffer, contentType);

      totalSize += content.length;
      fileCount += 1;
    }

    // Finalize deployment
    await db.batch([
      db
        .update(deployment)
        .set({
          status: "live",
          fileCount,
          totalSize,
          finishedAt: new Date(),
        })
        .where(eq(deployment.id, deploymentId)),
      db
        .update(site)
        .set({ activeDeploymentId: deploymentId })
        .where(eq(site.id, config.siteId)),
      db
        .update(siteGithubConfig)
        .set({
          lastDeployedCommit: commitHash,
          lastDeployedAt: new Date(),
        })
        .where(eq(siteGithubConfig.id, config.id)),
    ]);

    return { success: true, deploymentId };
  } catch (error) {
    // Mark deployment as failed
    await db
      .update(deployment)
      .set({
        status: "failed",
        finishedAt: new Date(),
      })
      .where(eq(deployment.id, deploymentId));

    return {
      success: false,
      error: error instanceof Error ? error.message : "Deployment failed",
    };
  }
}
