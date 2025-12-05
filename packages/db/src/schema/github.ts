import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { site } from "./site";

/**
 * GitHub Connection - links a user's GitHub account for OAuth
 */
export const githubConnection = sqliteTable(
  "github_connection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    // GitHub user info
    githubUserId: text("github_user_id").notNull().unique(),
    githubUsername: text("github_username").notNull(),
    githubAvatarUrl: text("github_avatar_url"),
    // OAuth tokens (encrypted in production)
    accessToken: text("access_token").notNull(),
    // Scopes granted by the user
    scopes: text("scopes").notNull().default("repo"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("github_connection_user_idx").on(table.userId),
    index("github_connection_github_user_idx").on(table.githubUserId),
  ]
);

/**
 * Site GitHub Config - links a site to a GitHub repository for auto-deploy
 */
export const siteGithubConfig = sqliteTable(
  "site_github_config",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .unique()
      .references(() => site.id, { onDelete: "cascade" }),
    // Repository info
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    repoBranch: text("repo_branch").notNull().default("main"),
    repoFullName: text("repo_full_name").notNull(), // owner/repo
    // Build configuration
    buildCommand: text("build_command"), // e.g., "npm run build"
    outputDirectory: text("output_directory").notNull().default("dist"),
    installCommand: text("install_command"), // e.g., "npm install"
    // Deployment settings
    autoDeploy: integer("auto_deploy", { mode: "boolean" })
      .notNull()
      .default(true),
    // Webhook secret for verifying GitHub payloads
    webhookSecret: text("webhook_secret").notNull(),
    // Last sync info
    lastDeployedCommit: text("last_deployed_commit"),
    lastDeployedAt: integer("last_deployed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("site_github_config_site_idx").on(table.siteId),
    index("site_github_config_repo_idx").on(table.repoFullName),
  ]
);

// Relations
export const githubConnectionRelations = relations(
  githubConnection,
  ({ one }) => ({
    user: one(user, {
      fields: [githubConnection.userId],
      references: [user.id],
    }),
  })
);

export const siteGithubConfigRelations = relations(
  siteGithubConfig,
  ({ one }) => ({
    site: one(site, {
      fields: [siteGithubConfig.siteId],
      references: [site.id],
    }),
  })
);
