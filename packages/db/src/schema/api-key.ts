import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

/**
 * API Key - for programmatic access (CLI, CI/CD, webhooks)
 * Keys are hashed before storage for security
 */
export const apiKey = sqliteTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Store only the hash of the key, never the raw key
    keyHash: text("key_hash").notNull().unique(),
    // First 8 chars of the key for identification (e.g., "ph_abc123...")
    keyPrefix: text("key_prefix").notNull(),
    // Scopes: comma-separated list of allowed operations
    // e.g., "deploy,read" or "*" for all
    scopes: text("scopes").notNull().default("*"),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("api_key_user_idx").on(table.userId),
    index("api_key_hash_idx").on(table.keyHash),
  ]
);

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));
