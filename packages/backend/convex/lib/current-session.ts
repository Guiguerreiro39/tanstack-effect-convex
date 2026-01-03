import { Context, Effect, Option } from "effect";
import { getCtxWithQueries } from "@/lib/get-ctx-with-queries";
import type { UserSession } from "@/schemas/auth";

export const fetchCurrentSession = Effect.fn("fetchCurrentSession")(
  function* () {
    const { auth } = yield* getCtxWithQueries;

    const identityResult = yield* auth.getUserIdentity();

    if (Option.isNone(identityResult)) {
      return null;
    }

    return identityResult.value;
  }
);

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  UserSession
>() {}
