import { Effect, Schema } from "effect";
import { query } from "@/confect";
import { CurrentSession } from "@/lib/current-session";
import { dbEffect } from "@/lib/db-effect";

export const get = query({
  args: Schema.Struct({}),
  returns: Schema.Struct({
    message: Schema.String,
  }),
  handler: () =>
    dbEffect(
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
