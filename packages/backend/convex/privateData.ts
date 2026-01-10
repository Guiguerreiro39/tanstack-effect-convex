import { Effect } from "effect";
import { query } from "./_generated/server";
import { CurrentSession } from "./lib/currentSession";
import { runWithEffect } from "./lib/runtime";

export const get = query({
  handler: (ctx) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        const session = yield* CurrentSession;

        if (!session) {
          return {
            message: "Not authenticated",
          };
        }

        return {
          message: "This is private",
        };
      })
    ),
});
