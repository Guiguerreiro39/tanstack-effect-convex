import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError, type Value } from "convex/values";
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect";
import type { DataModel } from "../_generated/dataModel";
import type { AllErrors } from "../schemas/errors";
import { parseCurrentConvexEnvironment } from "./constants";
import { CurrentSession, fetchCurrentSession } from "./currentSession";

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
 * Runtime for Convex queries and mutations.
 */
const RuntimeServer = (
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>
) =>
  ManagedRuntime.make(
    Layer.mergeAll(Layer.effect(CurrentSession, fetchCurrentSession(ctx)))
  );

/**
 * Runs an Effect in a Convex query or mutation context.
 * Provides `CurrentSession` and converts tagged errors to ConvexErrors with metadata.
 *
 * @example
 * ```ts
 * export const get = query({
 *   args: { id: v.id("accounts") },
 *   handler: (ctx, args) =>
 *     runWithEffect(ctx, Effect.gen(function* () {
 *       const session = yield* Policies.orFail(Policies.requireSignedIn);
 */
export const runWithEffect = <
  A,
  E extends InstanceType<(typeof AllErrors)[keyof typeof AllErrors]>,
>(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  effect: Effect.Effect<A, E, CurrentSession>
) =>
  RuntimeServer(ctx)
    .runPromise(
      effect.pipe(
        Effect.tapError((error) => Effect.logError(error)),
        Effect.either,
        Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
      )
    )
    .then((result) => {
      if (result._tag === "Left") {
        throw new ConvexError(result.left.toJSON() as Record<string, Value>);
      }
      return result.right;
    });

/**
 * Runtime for internal queries and actions.
 */
const InternalRuntimeServer = ManagedRuntime.make(
  Layer.empty.pipe(Layer.merge(Logger.minimumLogLevel(MINIMUM_LOG_LEVEL)))
);

/**
 * Run an Effect in an internal query or action context.
 */
export const runInternalEffect = <A, E>(effect: Effect.Effect<A, E, never>) =>
  InternalRuntimeServer.runPromise(
    effect.pipe(
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );
