import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const panchangValidator = v.object({
  tithi: v.optional(v.string()),
  nakshatra: v.optional(v.string()),
  yoga: v.optional(v.string()),
  day_lord: v.optional(v.string()),
});

// Get all check-ins for current user
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

// Upsert a check-in by calendar date (one per user per day)
export const upsertByDate = mutation({
  args: {
    date: v.string(),
    panchang: v.optional(panchangValidator),
    seedsWatered: v.optional(v.number()),
    seedsTotal: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("checkins")
      .withIndex("by_clerk_and_date", (q) =>
        q.eq("clerkId", identity.subject).eq("date", args.date)
      )
      .first();

    const payload = {
      date: args.date,
      panchang: args.panchang,
      seedsWatered: args.seedsWatered,
      seedsTotal: args.seedsTotal,
      notes: args.notes,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("checkins", {
      clerkId: identity.subject,
      localId: args.date, // stable id for the day
      ...payload,
    });
  },
});
