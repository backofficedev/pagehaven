import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sites: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    isUploaded: v.boolean(),
    lastUpdated: v.number(),
    screenshotId: v.optional(v.id("_storage")),
    siteFilesId: v.optional(v.id("_storage")), // ZIP file containing the site
    authMode: v.optional(v.union(v.literal("public"), v.literal("authenticated"))), // Access control
    customDomain: v.optional(v.string()), // For future custom domain support
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),
  
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),

  siteMemberships: defineTable({
    siteId: v.id("sites"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("viewer")),
    createdAt: v.number(),
  })
    .index("by_site", ["siteId"])
    .index("by_user", ["userId"])
    .index("by_site_and_user", ["siteId", "userId"]),

  siteDomains: defineTable({
    siteId: v.id("sites"),
    domain: v.string(), // e.g., "example.com" or "site.myapp.com"
    isPrimary: v.boolean(),
  })
    .index("by_site", ["siteId"])
    .index("by_domain", ["domain"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
