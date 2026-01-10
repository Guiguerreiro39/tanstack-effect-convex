import { v } from "convex/values";
import { Effect } from "effect";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { Policies } from "./lib/policies";
import { runWithEffect } from "./lib/runtime";
import { UnknownError } from "./schemas/errors";

export const getAll = query({
  handler: (ctx): Promise<Doc<"todos">[]> =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        return yield* Effect.tryPromise({
          try: () => ctx.db.query("todos").collect(),
          catch: (error) => Effect.fail(new UnknownError({ error })),
        });
      })
    ),
});

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
          catch: (error) => Effect.fail(new UnknownError({ error })),
        });
      })
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
          catch: (error) => Effect.fail(new UnknownError({ error })),
        });

        return null;
      })
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
          catch: (error) =>
            Effect.fail(new UnknownError({ error, docId: args.id })),
        });

        return null;
      })
    ),
});
