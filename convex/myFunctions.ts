import { ConvexError, v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { api } from './_generated/api';

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    // // Read the database as many times as you need here.
    // // See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query('numbers')
      // Ordered by _creationTime, return most recent
      .order('desc')
      .take(args.count);
    return {
      viewer: user?.subject ?? 'Anonymous',
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    // // Insert or modify documents in the database here.
    // // Mutations can also read from the database like queries.
    // // See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert('numbers', { value: args.value });

    console.log('Added new document with id:', id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    // // Use the browser-like `fetch` API to send HTTP requests.
    // // See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    // // Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    // // Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// Site management functions
export const listSites = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('sites'),
      _creationTime: v.number(),
      userId: v.string(),
      slug: v.string(),
      name: v.string(),
      screenshotId: v.optional(v.id('_storage')),
      uploaded: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return [];
    }

    const sites = await ctx.db
      .query('sites')
      .withIndex('by_user', (q) => q.eq('userId', user.subject))
      .order('desc')
      .collect();

    return sites;
  },
});

export const createSite = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
  },
  returns: v.id('sites'),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError('Not authenticated');
    }

    // Check if slug already exists
    const existing = await ctx.db
      .query('sites')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existing) {
      throw new ConvexError('Slug already exists');
    }

    const id = await ctx.db.insert('sites', {
      userId: user.subject,
      slug: args.slug,
      name: args.name,
      uploaded: false,
    });

    return id;
  },
});

export const deleteSite = mutation({
  args: {
    siteId: v.id('sites'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError('Not authenticated');
    }

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError('Site not found');
    }

    if (site.userId !== user.subject) {
      throw new ConvexError('Not authorized');
    }

    // Delete screenshot if exists
    if (site.screenshotId) {
      await ctx.storage.delete(site.screenshotId);
    }

    await ctx.db.delete(args.siteId);
    return null;
  },
});
