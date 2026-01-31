import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const UserProfile = {
  userId: v.string(),
  name: v.optional(v.string()),
  avatar: v.optional(v.string()),
};

export const Todo = {
  text: v.string(),
  completed: v.boolean(),
};

export const confectSchema = defineSchema({
  todos: defineTable(Todo),
  userProfiles: defineTable(UserProfile).index("by_userId", ["userId"]),
});

export default confectSchema;
