import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      profile: profile ? {
        ...profile,
        avatarUrl: profile.avatarId 
          ? await ctx.storage.getUrl(profile.avatarId)
          : null,
      } : null,
    };
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...(args.firstName !== undefined && { firstName: args.firstName }),
        ...(args.lastName !== undefined && { lastName: args.lastName }),
        ...(args.avatarId !== undefined && { avatarId: args.avatarId }),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        firstName: args.firstName,
        lastName: args.lastName,
        avatarId: args.avatarId,
      });
    }
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
