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

    // Check if already exists
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), args.localId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("messages", {
      clerkId: identity.subject,
      ...args,
    });
  },
});

// Batch sync messages
export const syncAll = mutation({
  args: {
    items: v.array(v.object({
      localId: v.string(),
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, { items }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("messages")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    const existingMap = new Map(existing.map(m => [m.localId, m]));

    for (const item of items) {
      if (!existingMap.has(item.localId)) {
        await ctx.db.insert("messages", {
          clerkId: identity.subject,
          ...item,
        });
      }
    }

    return { synced: items.length };
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
