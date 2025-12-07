import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all seeds for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

// Upsert a seed (by localId)
export const upsert = mutation({
  args: {
    localId: v.string(),
    title: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    streak: v.number(),
    lastCompleted: v.optional(v.union(v.string(), v.null())),
    completedDates: v.array(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), args.localId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("seeds", {
        clerkId: identity.subject,
        ...args,
      });
    }
  },
});

// Batch sync seeds
export const syncAll = mutation({
  args: {
    seeds: v.array(v.object({
      localId: v.string(),
      title: v.string(),
      category: v.optional(v.string()),
      description: v.optional(v.string()),
      streak: v.number(),
      lastCompleted: v.optional(v.union(v.string(), v.null())),
      completedDates: v.array(v.string()),
      active: v.boolean(),
    })),
  },
  handler: async (ctx, { seeds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get existing seeds
    const existing = await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    const existingMap = new Map(existing.map(s => [s.localId, s]));

    // Upsert each seed
    for (const seed of seeds) {
      const ex = existingMap.get(seed.localId);
      if (ex) {
        await ctx.db.patch(ex._id, seed);
      } else {
        await ctx.db.insert("seeds", {
          clerkId: identity.subject,
          ...seed,
        });
      }
    }

    return { synced: seeds.length };
  },
});

// Delete a seed
export const remove = mutation({
  args: { localId: v.string() },
  handler: async (ctx, { localId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), localId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
