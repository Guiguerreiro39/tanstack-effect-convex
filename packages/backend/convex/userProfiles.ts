import { Effect, Option } from "effect";
import { dbEffect } from "@/lib/db-effect";
import { ConfectQueryCtx, query } from "./confect";
import {
  GetCurrentUserProfileArgs,
  GetCurrentUserProfileResult,
} from "./schemas/userProfiles";

export const getCurrentProfile = query({
  args: GetCurrentUserProfileArgs,
  returns: GetCurrentUserProfileResult,
  handler: ({ userId }) =>
    dbEffect(
      Effect.gen(function* () {
        const { db } = yield* ConfectQueryCtx;

        const userProfile = yield* db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();

        if (Option.isNone(userProfile)) {
          return null;
        }

        return userProfile.value;
      })
    ),
});
