import { Effect, Schema } from "effect";
import { dbEffect } from "@/lib/db-effect";
import { query } from "./confect";

export const get = query({
  args: Schema.Struct({}),
  returns: Schema.String,
  handler: () =>
    dbEffect(
      Effect.gen(function* () {
        return yield* Effect.succeed("OK");
      })
    ),
});
