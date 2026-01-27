import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect";

import type { DataModel } from "../_generated/dataModel";
import type { ForbiddenError, NotFoundError } from "../schemas/errors";
import {
  ErrorStatusMap,
  type SerializedError,
} from "../schemas/serializedErrors";
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
 * Serializes a tagged error to a ConvexError with metadata.
 */
const serializeToConvexError = (error: unknown) => {
  const e = error as { _tag?: string; [key: string]: unknown };
  const tag = (e._tag ?? "UnknownError") as SerializedError["_tag"];
  const status = ErrorStatusMap[tag] ?? 500;

  // Build serialized error based on tag
  let serialized: SerializedError;
  switch (tag) {
    case "NotFoundError":
      serialized = {
        _tag: tag,
        docId: e.docId as undefined,
        handle: e.handle as string | undefined,
      };
      break;
    case "ForbiddenError":
      serialized = { _tag: tag, message: e.message as string | undefined };
      break;
    case "UnknownError":
      serialized = {
        _tag: tag,
        message: String(e.error ?? "Unknown error"),
      };
      break;
    case "InvalidCtxError":
      serialized = { _tag: tag };
      break;
    case "GetUserIdentityError":
      serialized = { _tag: tag, message: String(e.error ?? "Auth error") };
      break;
    default:
      serialized = { _tag: "UnknownError", message: `Unhandled error: ${tag}` };
  }

  return new ConvexError({ status, error: serialized });
};

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
 *       return yield* getAccountById(ctx, args.id, session);
 *     })),
 * });
 * ```
 */
export const runWithEffect = <A, E>(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  effect: Effect.Effect<A, E | ForbiddenError | NotFoundError, CurrentSession>
) =>
  RuntimeServer(ctx).runPromise(
    effect.pipe(
      Effect.catchAll((error) => Effect.die(serializeToConvexError(error))),
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );

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
