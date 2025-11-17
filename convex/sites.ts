import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listUserSites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return Promise.all(
      sites.map(async (site) => ({
        ...site,
        screenshotUrl: site.screenshotId 
          ? await ctx.storage.getUrl(site.screenshotId)
          : null,
      }))
    );
  },
});

export const getSiteBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db
      .query("sites")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    return site;
  },
});

export const createSite = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if slug already exists
    const existingSite = await ctx.db
      .query("sites")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingSite) {
      throw new Error("Site slug already exists");
    }

    return await ctx.db.insert("sites", {
      name: args.name,
      slug: args.slug,
      ownerId: userId,
      isUploaded: false,
      lastUpdated: Date.now(),
    });
  },
});

export const deleteSite = mutation({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const site = await ctx.db.get(args.siteId);
    if (!site || site.ownerId !== userId) {
      throw new Error("Site not found or not authorized");
    }

    await ctx.db.delete(args.siteId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateSiteFiles = mutation({
  args: {
    siteId: v.id("sites"),
    siteFilesId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const site = await ctx.db.get(args.siteId);
    if (!site || site.ownerId !== userId) {
      throw new Error("Site not found or not authorized");
    }

    await ctx.db.patch(args.siteId, {
      siteFilesId: args.siteFilesId,
      isUploaded: true,
      lastUpdated: Date.now(),
    });
  },
});
