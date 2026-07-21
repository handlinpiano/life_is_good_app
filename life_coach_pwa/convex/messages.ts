import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

// Add a message
export const add = mutation({
  args: {
    localId: v.string(),
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("messages")
      .withIndex("by_clerk_and_local", (q) =>
        q.eq("clerkId", identity.subject).eq("localId", args.localId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("messages", {
      clerkId: identity.subject,
      ...args,
    });
  },
});

// Clear all messages
export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});
