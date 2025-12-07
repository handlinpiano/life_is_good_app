import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles - one per authenticated user
  profiles: defineTable({
    clerkId: v.string(),
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
  }).index("by_clerk_id", ["clerkId"]),

  // Seeds (habits/practices to cultivate)
  seeds: defineTable({
    clerkId: v.string(),
    localId: v.string(),
    title: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    streak: v.number(),
    lastCompleted: v.optional(v.union(v.string(), v.null())),
    completedDates: v.array(v.string()),
    active: v.boolean(),
  }).index("by_clerk_id", ["clerkId"]),

  // Wisdom notes
  wisdom: defineTable({
    clerkId: v.string(),
    localId: v.string(),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.string(),
    guruId: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
    // Legacy fields (for backwards compatibility with existing data)
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_clerk_id", ["clerkId"]),

  // Chat messages
  messages: defineTable({
    clerkId: v.string(),
    localId: v.string(),
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Daily check-ins
  checkins: defineTable({
    clerkId: v.string(),
    localId: v.string(),
    date: v.string(),
    mood: v.optional(v.number()),
    energy: v.optional(v.number()),
    focus: v.optional(v.number()),
    gratitude: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),
});
