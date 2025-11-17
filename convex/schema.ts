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
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),
  
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
