import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// Site roles for authorization
export const siteRoles = ["owner", "admin", "editor", "viewer"] as const;
export type SiteRole = (typeof siteRoles)[number];

// Access types for site visibility
export const accessTypes = [
  "public",
  "password",
  "private",
  "owner_only",
] as const;
export type AccessType = (typeof accessTypes)[number];

// Deployment status
export const deploymentStatuses = [
  "pending",
  "processing",
  "live",
  "failed",
] as const;
export type DeploymentStatus = (typeof deploymentStatuses)[number];

/**
 * Site - represents a hosted static website
 */
export const site = sqliteTable(
  "site",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    subdomain: text("subdomain").notNull().unique(),
    customDomain: text("custom_domain").unique(),
    description: text("description"),
    // Current live deployment
    activeDeploymentId: text("active_deployment_id"),
    // Audit fields
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("site_subdomain_idx").on(table.subdomain),
    index("site_custom_domain_idx").on(table.customDomain),
    index("site_created_by_idx").on(table.createdBy),
  ]
);

/**
 * SiteMember - join table for multi-owner/role support
 */
export const siteMember = sqliteTable(
  "site_member",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: siteRoles }).notNull().default("viewer"),
    invitedBy: text("invited_by").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("site_member_site_idx").on(table.siteId),
    index("site_member_user_idx").on(table.userId),
    index("site_member_site_user_idx").on(table.siteId, table.userId),
  ]
);

/**
 * SiteAccess - controls who can view the hosted site
 */
export const siteAccess = sqliteTable(
  "site_access",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .unique()
      .references(() => site.id, { onDelete: "cascade" }),
    accessType: text("access_type", { enum: accessTypes })
      .notNull()
      .default("public"),
    // For password-protected sites
    passwordHash: text("password_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("site_access_site_idx").on(table.siteId)]
);

/**
 * SiteInvite - invited users for private sites (visitor access, not team members)
 */
export const siteInvite = sqliteTable(
  "site_invite",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    // Optional: link to user if they have an account
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("site_invite_site_idx").on(table.siteId),
    index("site_invite_email_idx").on(table.email),
    index("site_invite_site_email_idx").on(table.siteId, table.email),
  ]
);

/**
 * Deployment - tracks each deployment of a site
 */
export const deployment = sqliteTable(
  "deployment",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    // R2 storage path for this deployment's files
    storagePath: text("storage_path").notNull(),
    // Deployment metadata
    status: text("status", { enum: deploymentStatuses })
      .notNull()
      .default("pending"),
    // File stats
    fileCount: integer("file_count").default(0),
    totalSize: integer("total_size").default(0), // bytes
    // Optional commit/version info
    commitHash: text("commit_hash"),
    commitMessage: text("commit_message"),
    // Who deployed
    deployedBy: text("deployed_by")
      .notNull()
      .references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("deployment_site_idx").on(table.siteId),
    index("deployment_status_idx").on(table.status),
    index("deployment_site_created_idx").on(table.siteId, table.createdAt),
  ]
);

// ============ Relations ============

export const siteRelations = relations(site, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [site.createdBy],
    references: [user.id],
  }),
  activeDeployment: one(deployment, {
    fields: [site.activeDeploymentId],
    references: [deployment.id],
  }),
  members: many(siteMember),
  access: one(siteAccess),
  invites: many(siteInvite),
  deployments: many(deployment),
}));

export const siteMemberRelations = relations(siteMember, ({ one }) => ({
  site: one(site, {
    fields: [siteMember.siteId],
    references: [site.id],
  }),
  user: one(user, {
    fields: [siteMember.userId],
    references: [user.id],
  }),
  invitedByUser: one(user, {
    fields: [siteMember.invitedBy],
    references: [user.id],
  }),
}));

export const siteAccessRelations = relations(siteAccess, ({ one }) => ({
  site: one(site, {
    fields: [siteAccess.siteId],
    references: [site.id],
  }),
}));

export const siteInviteRelations = relations(siteInvite, ({ one }) => ({
  site: one(site, {
    fields: [siteInvite.siteId],
    references: [site.id],
  }),
  user: one(user, {
    fields: [siteInvite.userId],
    references: [user.id],
  }),
  invitedByUser: one(user, {
    fields: [siteInvite.invitedBy],
    references: [user.id],
  }),
}));

export const deploymentRelations = relations(deployment, ({ one }) => ({
  site: one(site, {
    fields: [deployment.siteId],
    references: [site.id],
  }),
  deployedByUser: one(user, {
    fields: [deployment.deployedBy],
    references: [user.id],
  }),
}));
