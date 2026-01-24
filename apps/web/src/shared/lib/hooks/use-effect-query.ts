import { convexQuery } from "@convex-dev/react-query";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { Effect } from "effect";
import { extractConvexError } from "@/shared/lib/errors/extract-convex-error";
import type { AppError } from "@/shared/lib/errors/types";

type UseEffectQueryResult<T> = UseQueryResult<T, Error> & {
  dataEffect: Effect.Effect<T, AppError> | null;
  toEffect: () => Effect.Effect<T, AppError>;
};

/**
 * Convex query hook with Effect integration.
 * Wraps convexQuery and provides toEffect() for typed error handling.
 *
 * @example
 * ```tsx
 * const todos = useEffectQuery(api.todos.getAll, {});
 *
 * // Standard React Query pattern
 * if (todos.isPending) return <Loading />;
 * if (todos.error) return <Error error={todos.error} />;
 * return <List items={todos.data} />;
 *
 * // Or use Effect pattern
 * const effect = todos.toEffect().pipe(
 *   Effect.match({
 *     onFailure: (error) => <Error error={error} />,
 *     onSuccess: (data) => <List items={data} />,
 *   })
 * );
 * ```
 */
export function useEffectQuery<F extends FunctionReference<"query">>(
  funcRef: F,
  args: FunctionArgs<F>
): UseEffectQueryResult<FunctionReturnType<F>> {
  const query = useQuery(convexQuery(funcRef, args));

  const dataEffect = query.isPending
    ? null
    : query.error
      ? Effect.fail(extractConvexError(query.error))
      : Effect.succeed(query.data as FunctionReturnType<F>);

  const toEffect = (): Effect.Effect<FunctionReturnType<F>, AppError> =>
    Effect.gen(function* () {
      if (query.isPending) {
        return yield* Effect.never;
      }

      if (query.error) {
        return yield* Effect.fail(extractConvexError(query.error));
      }

      return query.data as FunctionReturnType<F>;
    });

  return { ...query, dataEffect, toEffect };
}
