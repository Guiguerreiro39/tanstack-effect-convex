import { v } from "convex/values";
import { Effect } from "effect";
import { query } from "./_generated/server";
import { runWithEffect } from "./lib/runtime";
import { UnknownError } from "./schemas/errors";

export const getCurrentProfile = query({
  args: {
    userId: v.string(),
  },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        const userProfile = yield* Effect.tryPromise({
          try: () =>
            ctx.db
              .query("userProfiles")
              .withIndex("by_userId", (q) => q.eq("userId", args.userId))
              .unique(),
          catch: () => new UnknownError({ message: "User not found" }),
        });

        return userProfile;
      }),
      "userProfiles.getCurrentProfile",
      { userId: args.userId }
    ),
});
