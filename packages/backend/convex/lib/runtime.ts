import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect";

import type { DataModel } from "@/_generated/dataModel";
import { CurrentSession } from "@/lib/currentSession";
import type { ForbiddenError, NotFoundError } from "@/schemas/errors";
import { parseCurrentConvexEnvironment } from "./constants";
import { fetchCurrentSession } from "./currentSession";

/**
 * Minimum log level based on environment.
 * - `test`: `LogLevel.None`
 * - `development`: `LogLevel.Debug`
 * - `production`: `LogLevel.Info`
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
 * Provides `CurrentSession` and converts tagged errors to ConvexErrors.
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
      Effect.catchTag("ForbiddenError", () =>
        Effect.die(new ConvexError({ kind: "authorization", status: 401 }))
      ),
      Effect.catchTag("NotFoundError", () =>
        Effect.die(new ConvexError({ kind: "not-found", status: 404 }))
      ),
      // Log unknown error for visibility
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );

/**
 * Runtime for internal queries and actions.
 * Internal functions don't have user session context, so we use a minimal runtime
 * that only provides logging. Each internal function gets its own runtime instance
 * since Convex doesn't allow sharing runtimes across function invocations.
 */
const InternalRuntimeServer = ManagedRuntime.make(
  Layer.empty.pipe(Layer.merge(Logger.minimumLogLevel(MINIMUM_LOG_LEVEL)))
);

/**
 * Run an Effect in an internal query or action context.
 * Use this for internalQuery, internalMutation, and internalAction.
 *
 * @example
 * ```ts
 * export const syncPrices = internalAction({
 *   args: { symbols: v.array(v.string()) },
 *   handler: async (ctx, args) =>
 *     runInternalEffect(
 *       Effect.gen(function* () {
 *         const prices = yield* fetchPricesFromAPI(args.symbols);
 *         for (const price of prices) {
 *           yield* Effect.promise(() =>
 *             ctx.runMutation(internal.stockPrices.upsertPrice, price)
 *           );
 *         }
 *         return prices.length;
 *       })
 *     ),
 * });
 * ```
 */
export const runInternalEffect = <A, E>(effect: Effect.Effect<A, E, never>) =>
  InternalRuntimeServer.runPromise(
    effect.pipe(
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );
