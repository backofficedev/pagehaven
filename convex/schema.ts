import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  sites: defineTable({
    userId: v.string(), // WorkOS user ID
    slug: v.string(),
    name: v.string(),
    screenshotId: v.optional(v.id('_storage')),
    uploaded: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_slug', ['slug']),
});
