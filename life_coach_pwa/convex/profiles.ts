import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current user's profile
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return profile;
  },
});

// Upsert profile (create or update)
export const upsert = mutation({
  args: {
    name: v.optional(v.string()),
    gender: v.optional(v.string()),
    profession: v.optional(v.string()),
    relationshipStatus: v.optional(v.string()),
    birthPlace: v.optional(v.string()),
    birthData: v.optional(v.object({
      date: v.string(),
      time: v.string(),
      latitude: v.number(),
      longitude: v.number(),
    })),
    chartData: v.optional(v.any()),
    dashaData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        clerkId: identity.subject,
        ...args,
      });
    }
  },
});
