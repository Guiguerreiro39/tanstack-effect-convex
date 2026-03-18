import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

describe("todos", () => {
  const modules = import.meta.glob("../**/*.*s");

  it("should create a todo", async () => {
    const t = convexTest(schema, modules);

    // Create a user context
    const userId = "user-id" as any;
    const tWithAuth = t.withIdentity({ subject: userId });

    await tWithAuth.mutation(api.todos.create, { text: "Buy milk" });

    const todos = await t.query(api.todos.getAll);
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ text: "Buy milk", completed: false });
  });

  it("should fail to create a todo if not signed in", async () => {
    const t = convexTest(schema, modules);

    // No identity
    await expect(
      t.mutation(api.todos.create, { text: "Buy milk" })
    ).rejects.toThrow();
  });

  it("should get all todos", async () => {
    const t = convexTest(schema, modules);
    const tWithAuth = t.withIdentity({ subject: "user-id" });

    await tWithAuth.mutation(api.todos.create, { text: "First" });
    await tWithAuth.mutation(api.todos.create, { text: "Second" });

    const todos = await t.query(api.todos.getAll);
    expect(todos).toHaveLength(2);
  });

  it("should toggle a todo", async () => {
    const t = convexTest(schema, modules);
    const tWithAuth = t.withIdentity({ subject: "user-id" });

    await tWithAuth.mutation(api.todos.create, { text: "Buy milk" });
    const todosBefore = await t.query(api.todos.getAll);
    const id = todosBefore[0]._id;

    await tWithAuth.mutation(api.todos.toggle, { id, completed: true });

    const todosAfter = await t.query(api.todos.getAll);
    expect(todosAfter[0].completed).toBe(true);
  });

  it("should delete a todo", async () => {
    const t = convexTest(schema, modules);
    const tWithAuth = t.withIdentity({ subject: "user-id" });

    await tWithAuth.mutation(api.todos.create, { text: "Buy milk" });
    const todosBefore = await t.query(api.todos.getAll);
    const id = todosBefore[0]._id;

    await tWithAuth.mutation(api.todos.deleteTodo, { id });

    const todosAfter = await t.query(api.todos.getAll);
    expect(todosAfter).toHaveLength(0);
  });
});
