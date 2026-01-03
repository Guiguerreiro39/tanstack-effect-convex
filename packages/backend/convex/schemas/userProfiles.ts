import { Schema } from "effect";
import { UserId, UserProfile } from "@/schema";

export const GetCurrentUserProfileArgs = Schema.Struct({
  userId: UserId,
});
export const GetCurrentUserProfileResult = Schema.Union(
  UserProfile,
  Schema.Null
);
