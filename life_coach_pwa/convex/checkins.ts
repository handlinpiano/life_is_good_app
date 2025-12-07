import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all checkins for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("checkins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

// Upsert checkin (by localId)
export const upsert = mutation({
  args: {
    localId: v.string(),
    date: v.string(),
    mood: v.optional(v.number()),
    energy: v.optional(v.number()),
    focus: v.optional(v.number()),
    gratitude: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("checkins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), args.localId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("checkins", {
        clerkId: identity.subject,
        ...args,
      });
    }
  },
});

// Batch sync checkins
export const syncAll = mutation({
  args: {
    items: v.array(v.object({
      localId: v.string(),
      date: v.string(),
      mood: v.optional(v.number()),
      energy: v.optional(v.number()),
      focus: v.optional(v.number()),
      gratitude: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { items }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("checkins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    const existingMap = new Map(existing.map(c => [c.localId, c]));

    for (const item of items) {
      const ex = existingMap.get(item.localId);
      if (ex) {
        await ctx.db.patch(ex._id, item);
      } else {
        await ctx.db.insert("checkins", {
          clerkId: identity.subject,
          ...item,
        });
      }
    }

    return { synced: items.length };
  },
});
