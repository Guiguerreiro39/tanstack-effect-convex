import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { Context, Effect, Option } from "effect";
import type { DataModel } from "@/_generated/dataModel";
import type { UserSession } from "@/schemas/auth";

/**
 * Fetches the current user session from Convex auth.
 */
export const fetchCurrentSession = Effect.fn("fetchCurrentSession")(function* (
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>
) {
  const identityResult = yield* Effect.tryPromise({
    try: () => ctx.auth.getUserIdentity(),
    catch: () => Option.none(),
  });

  return identityResult;
});

/**
 * Effect Context tag for the current user session.
 */
export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  UserSession
>() {}
