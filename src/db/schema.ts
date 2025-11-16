import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Demo table (can be removed later)
export const todos = sqliteTable("todos", {
	id: integer("id", { mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	title: text("title").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

// Multi-tenant schema
export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	workosUserId: text("workos_user_id").unique(),
	email: text("email").notNull(),
	name: text("name"),
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const tenants = sqliteTable("tenants", {
	id: text("id").primaryKey(),
	slug: text("slug").unique().notNull(),
	name: text("name").notNull(),
	r2Prefix: text("r2_prefix").notNull(),
	authMode: text("auth_mode", { enum: ["public", "workos"] })
		.notNull()
		.default("public"),
	workosOrgId: text("workos_org_id"),
	version: integer("version").notNull().default(1),
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const tenantDomains = sqliteTable("tenant_domains", {
	id: text("id").primaryKey(),
	tenantId: text("tenant_id")
		.notNull()
		.references(() => tenants.id),
	domain: text("domain").unique().notNull(),
});

export const tenantMemberships = sqliteTable("tenant_memberships", {
	id: text("id").primaryKey(),
	tenantId: text("tenant_id")
		.notNull()
		.references(() => tenants.id),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	role: text("role", { enum: ["admin", "viewer"] }).notNull(),
	status: text("status").notNull().default("active"),
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
