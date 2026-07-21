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
    difficulty: v.optional(v.string()),
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
      .withIndex("by_clerk_and_local", (q) =>
        q.eq("clerkId", identity.subject).eq("localId", args.localId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("seeds", {
      clerkId: identity.subject,
      ...args,
    });
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
      .withIndex("by_clerk_and_local", (q) =>
        q.eq("clerkId", identity.subject).eq("localId", localId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
