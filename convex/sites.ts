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
        authMode: site.authMode || "authenticated", // Ensure authMode is always set
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
    authMode: v.optional(v.union(v.literal("public"), v.literal("authenticated"))),
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

    const siteId = await ctx.db.insert("sites", {
      name: args.name,
      slug: args.slug,
      ownerId: userId,
      isUploaded: false,
      lastUpdated: Date.now(),
      authMode: args.authMode || "authenticated", // Default to authenticated
    });

    // Automatically add owner as admin member
    await ctx.db.insert("siteMemberships", {
      siteId,
      userId,
      role: "admin",
      createdAt: Date.now(),
    });

    return siteId;
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
    if (!site) {
      throw new Error("Site not found");
    }

    // Check if user is owner or admin member
    const isOwner = site.ownerId === userId;
    const membership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", userId)
      )
      .first();
    
    const isAdmin = membership?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.siteId, {
      siteFilesId: args.siteFilesId,
      isUploaded: true,
      lastUpdated: Date.now(),
    });
  },
});

// Query to check if user can access a site (for use in HTTP routes)
export const checkSiteAccess = query({
  args: {
    siteId: v.id("sites"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      return false;
    }

    // Default to authenticated if not set (for backward compatibility)
    const authMode = site.authMode || "authenticated";
    
    // Public sites are accessible to everyone
    if (authMode === "public") {
      return true;
    }

    // Authenticated sites require a logged-in user
    if (!args.userId) {
      return false;
    }

    // Owner always has access
    if (site.ownerId === args.userId) {
      return true;
    }

    // Check membership
    const membership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", args.userId!)
      )
      .first();

    return !!membership;
  },
});

// Get site with access check
export const getSiteById = query({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const site = await ctx.db.get(args.siteId);
    
    if (!site) {
      return null;
    }

    // Default to authenticated if not set (for backward compatibility)
    const authMode = site.authMode || "authenticated";
    
    // Check access
    if (authMode === "authenticated" && !userId) {
      return null;
    }
    
    if (authMode === "authenticated" && userId) {
      const isOwner = site.ownerId === userId;
      if (!isOwner) {
        const membership = await ctx.db
          .query("siteMemberships")
          .withIndex("by_site_and_user", (q) => 
            q.eq("siteId", args.siteId).eq("userId", userId)
          )
          .first();
        if (!membership) {
          return null;
        }
      }
    }

    return site;
  },
});

// Update site auth mode (admin only)
export const updateSiteAuthMode = mutation({
  args: {
    siteId: v.id("sites"),
    authMode: v.union(v.literal("public"), v.literal("authenticated")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    // Check if user is owner or admin
    const isOwner = site.ownerId === userId;
    const membership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", userId)
      )
      .first();
    
    const isAdmin = membership?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.siteId, {
      authMode: args.authMode,
      lastUpdated: Date.now(),
    });
  },
});

// Membership operations - Get all members of a site
export const getSiteMemberships = query({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Return empty array instead of throwing
    }

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      return []; // Return empty array instead of throwing
    }

    // Check if user is owner or admin
    const isOwner = site.ownerId === userId;
    const membership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", userId)
      )
      .first();
    
    const isAdmin = membership?.role === "admin";
    
    // Only owners and admins can view memberships
    if (!isOwner && !isAdmin) {
      return []; // Return empty array instead of throwing
    }

    const memberships = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();

    // Get user details for each membership
    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          user: user ? {
            _id: user._id,
            email: user.email,
            name: user.name,
          } : null,
        };
      })
    );
  },
});

export const addSiteMembership = mutation({
  args: {
    siteId: v.id("sites"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    // Check if current user is owner or admin
    const isOwner = site.ownerId === currentUserId;
    const membership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", currentUserId)
      )
      .first();
    
    const isAdmin = membership?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Not authorized");
    }

    // Check if membership already exists
    const existing = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", args.siteId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      // Update existing membership
      await ctx.db.patch(existing._id, {
        role: args.role,
      });
      return existing._id;
    }

    // Create new membership
    return await ctx.db.insert("siteMemberships", {
      siteId: args.siteId,
      userId: args.userId,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const removeSiteMembership = mutation({
  args: {
    membershipId: v.id("siteMemberships"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const site = await ctx.db.get(membership.siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    // Check if current user is owner or admin
    const isOwner = site.ownerId === currentUserId;
    const currentMembership = await ctx.db
      .query("siteMemberships")
      .withIndex("by_site_and_user", (q) => 
        q.eq("siteId", membership.siteId).eq("userId", currentUserId)
      )
      .first();
    
    const isAdmin = currentMembership?.role === "admin";
    
    if (!isOwner && !isAdmin) {
      throw new Error("Not authorized");
    }

    // Don't allow removing the owner
    if (membership.userId === site.ownerId) {
      throw new Error("Cannot remove site owner");
    }

    await ctx.db.delete(args.membershipId);
  },
});
