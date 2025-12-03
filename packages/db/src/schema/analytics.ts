import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { site } from "./site";

/**
 * Page view analytics - aggregated daily stats
 */
export const siteAnalytics = sqliteTable(
  "site_analytics",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    // Date in YYYY-MM-DD format
    date: text("date").notNull(),
    // Page path
    path: text("path").notNull(),
    // Aggregated counts
    views: integer("views").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
    // Bandwidth in bytes
    bandwidth: integer("bandwidth").notNull().default(0),
  },
  (table) => [
    index("analytics_site_date_idx").on(table.siteId, table.date),
    index("analytics_site_path_idx").on(table.siteId, table.path),
  ]
);

/**
 * Domain verification records
 */
export const domainVerification = sqliteTable(
  "domain_verification",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    domain: text("domain").notNull().unique(),
    // Verification token (TXT record value)
    verificationToken: text("verification_token").notNull(),
    // Status: pending, verified, failed
    status: text("status", { enum: ["pending", "verified", "failed"] })
      .notNull()
      .default("pending"),
    // Last verification attempt
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("domain_site_idx").on(table.siteId),
    index("domain_status_idx").on(table.status),
  ]
);

export type SiteAnalytics = typeof siteAnalytics.$inferSelect;
export type DomainVerification = typeof domainVerification.$inferSelect;
