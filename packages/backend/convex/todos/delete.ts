import { v } from "convex/values";
import { Effect } from "effect";
import { mutation } from "../_generated/server";
import { Policies } from "../lib/policies";
import { runWithEffect } from "../lib/runtime";
import { ForbiddenError, UnknownError } from "../schemas/errors";

/**
 * Errors this mutation may throw.
 */
export const errors = [ForbiddenError, UnknownError] as const;

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
      })
    ),
});
