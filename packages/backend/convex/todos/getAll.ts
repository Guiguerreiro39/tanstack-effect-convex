import { Effect } from "effect";
import type { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { runWithEffect } from "../lib/runtime";
import { UnknownError } from "../schemas/errors";

/**
 * Errors this query may throw.
 */
export const errors = [UnknownError] as const;

export const getAll = query({
  handler: (ctx): Promise<Doc<"todos">[]> =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        return yield* Effect.tryPromise({
          try: () => ctx.db.query("todos").collect(),
          catch: (error) => new UnknownError({ message: String(error) }),
        });
      })
    ),
});
