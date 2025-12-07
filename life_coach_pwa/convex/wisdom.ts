import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all wisdom for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("wisdom")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

// Upsert wisdom (by localId)
export const upsert = mutation({
  args: {
    localId: v.string(),
    title: v.string(),
    category: v.optional(v.string()),
    content: v.string(),
    guruId: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("wisdom")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), args.localId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("wisdom", {
        clerkId: identity.subject,
        ...args,
      });
    }
  },
});

// Delete wisdom
export const remove = mutation({
  args: { localId: v.string() },
  handler: async (ctx, { localId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("wisdom")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), localId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Batch sync wisdom
export const syncAll = mutation({
  args: {
    items: v.array(v.object({
      localId: v.string(),
      title: v.optional(v.string()),
      category: v.optional(v.string()),
      content: v.string(),
      guruId: v.optional(v.string()),
      favorite: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { items }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("wisdom")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    const existingMap = new Map(existing.map(w => [w.localId, w]));

    for (const item of items) {
      const ex = existingMap.get(item.localId);
      if (ex) {
        await ctx.db.patch(ex._id, item);
      } else {
        await ctx.db.insert("wisdom", {
          clerkId: identity.subject,
          ...item,
        });
      }
    }

    return { synced: items.length };
  },
});
