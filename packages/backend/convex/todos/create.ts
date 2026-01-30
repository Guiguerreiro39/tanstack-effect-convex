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
      })
    ),
});
