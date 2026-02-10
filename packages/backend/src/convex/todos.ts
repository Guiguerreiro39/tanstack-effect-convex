import { v } from "convex/values";
import { Effect } from "effect";
import { mutation, query } from "./_generated/server";
import { Policies } from "./lib/policies";
import { runWithEffect } from "./lib/runtime";
import { UnknownError } from "./schemas/errors";

export const create = mutation({
  args: { text: v.string() },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        yield* Policies.orFail(Policies.requireSignedIn);

        return yield* Effect.tryPromise({
          try: () =>
            ctx.db.insert("todos", {
              text: args.text,
              completed: false,
            }),
          catch: (error) => new UnknownError({ message: String(error) }),
        });
      }),
      "todos.create",
      { text: args.text }
    ),
});

export const deleteTodo = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        yield* Policies.orFail(Policies.requireSignedIn);

        yield* Effect.tryPromise({
          try: () => ctx.db.delete(args.id),
          catch: (error) => new UnknownError({ message: String(error) }),
        });

        return null;
      }),
      "todos.deleteTodo",
      { id: args.id }
    ),
});

export const getAll = query({
  handler: (ctx) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        return yield* Effect.tryPromise({
          try: () => ctx.db.query("todos").collect(),
          catch: (error) => new UnknownError({ message: String(error) }),
        });
      }),
      "todos.getAll"
    ),
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
    completed: v.boolean(),
  },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        yield* Policies.orFail(Policies.requireSignedIn);

        yield* Effect.tryPromise({
          try: () => ctx.db.patch(args.id, { completed: args.completed }),
          catch: (error) => new UnknownError({ message: String(error) }),
        });

        return null;
      }),
      "todos.toggle",
      { id: args.id, completed: args.completed }
    ),
});
