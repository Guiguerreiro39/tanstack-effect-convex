import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError, type Value } from "convex/values";
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect";
import type { DataModel } from "../_generated/dataModel";
import type { AllErrors } from "../schemas/errors";
import { parseCurrentConvexEnvironment } from "./constants";
import { CurrentSession, fetchCurrentSession } from "./currentSession";
import { TracingLive } from "./tracing";

/**
 * Minimum log level based on environment.
 */
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

/**
 * Global Runtime for Convex.
 * Initializes long-lived services like OpenTelemetry and Logger.
 * This should be reused across function invocations in the same isolate.
 */
const GlobalRuntime = ManagedRuntime.make(
  Layer.mergeAll(Logger.minimumLogLevel(MINIMUM_LOG_LEVEL), TracingLive)
);

/**
 * Runs an Effect in a Convex query or mutation context.
 * Provides `CurrentSession` and converts tagged errors to ConvexErrors with metadata.
 *
 * @example
 * ```ts
 * export const get = query({
 *   args: { id: v.id("accounts") },
 *     runWithEffect(ctx, "accounts.get", Effect.gen(function* () {
 *       const session = yield* Policies.orFail(Policies.requireSignedIn);
 * ```
 */
export const runWithEffect = <
  A,
  E extends InstanceType<(typeof AllErrors)[keyof typeof AllErrors]>,
>(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  effect: Effect.Effect<A, E, CurrentSession>,
  spanName: string,
  spanAttributes?: Record<string, unknown>
) =>
  GlobalRuntime.runPromise(
    effect.pipe(
      Effect.withSpan(spanName, { attributes: spanAttributes }),
      Effect.provideServiceEffect(CurrentSession, fetchCurrentSession(ctx)),
      Effect.tapError((error) => Effect.logError(error)),
      Effect.either
    )
  ).then((result) => {
    if (result._tag === "Left") {
      throw new ConvexError(result.left.toJSON() as Record<string, Value>);
    }
    return result.right;
  });

/**
 * Run an Effect in an internal query or action context.
 */
export const runInternalEffect = <A, E>(effect: Effect.Effect<A, E, never>) =>
  GlobalRuntime.runPromise(
    effect.pipe(Effect.tapError((error) => Effect.logError(error)))
  );
