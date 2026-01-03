import { ConvexError } from "convex/values";
import { Effect, Layer, Logger, LogLevel } from "effect";
import { CurrentSession, fetchCurrentSession } from "@/lib/current-session";
import type { ForbiddenError, NotFoundError } from "@/schemas/errors";
import { parseCurrentConvexEnvironment } from "./constants";

const MINIMUM_LOG_LEVEL = (() => {
  const environment = parseCurrentConvexEnvironment();

  if (environment === "test") {
    return LogLevel.None;
  }

  if (process.env.LOG_LEVEL === "DEBUG") {
    return LogLevel.Debug;
  }

  return LogLevel.Info;
})();

export const dbEffect = <A, E, R>(
  effect: Effect.Effect<A, E | ForbiddenError | NotFoundError, R>
) =>
  effect.pipe(
    Effect.provide(
      Layer.effect(
        CurrentSession,
        fetchCurrentSession().pipe(
          Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
        )
      )
    ),
    Effect.catchTag("ForbiddenError", () =>
      Effect.die(new ConvexError({ kind: "authorization", status: 401 }))
    ),
    Effect.catchTag("NotFoundError", () =>
      Effect.die(new ConvexError({ kind: "not-found", status: 404 }))
    ),
    // Log unknown error for visibility
    Effect.tapError((error) => Effect.logError(error)),
    Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
  );
