import { Project } from "ts-morph";
import { expect, test } from "vitest";
import { extractTableSchemas } from "../../parser/schemas";

test("extracts table schemas correctly", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(
    "schema.ts",
    `
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export const Todo = {
      text: v.string(),
      completed: v.boolean(),
      user: v.optional(v.id("users")),
    };

    export default defineSchema({
      todos: defineTable(Todo).index("by_user", ["user"]),
    });
  `
  );

  const result = extractTableSchemas(project, "schema.ts");
  
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe("Todo");
  expect(result[0].tableName).toBe("todos");
  expect(result[0].fields).toEqual([
    { name: "text", type: "v.string()", optional: false },
    { name: "completed", type: "v.boolean()", optional: false },
    { name: "user", type: 'v.optional(v.id("users"))', optional: true },
  ]);
});
