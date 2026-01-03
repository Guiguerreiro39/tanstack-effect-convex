import { defineSchema, defineTable } from "@rjdellecese/confect/server";
import { Schema } from "effect";

export const UserId = Schema.String.pipe(Schema.brand("auth/UserId"));

export const UserProfileSchema = Schema.Struct({
  userId: UserId,
  name: Schema.optional(Schema.String),
  avatar: Schema.optional(Schema.String),
});

export const TodoSchema = Schema.Struct({
  text: Schema.String,
  completed: Schema.Boolean,
});

export const confectSchema = defineSchema({
  todos: defineTable(TodoSchema),
  userProfiles: defineTable(UserProfileSchema).index("by_userId", ["userId"]),
});

export const Todo = confectSchema.tableSchemas.todos.withSystemFields;
export const UserProfile =
  confectSchema.tableSchemas.userProfiles.withSystemFields;

export default confectSchema.convexSchemaDefinition;
