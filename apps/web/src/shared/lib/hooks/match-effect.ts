import { Effect } from "effect";
import type { UseEffectQueryResult } from "@/shared/lib/hooks/use-effect-query";
import type { AppError } from "@/shared/lib/models/errors";
import { RuntimeClient } from "@/shared/lib/runtime-client";

/**
 * Pattern match on an Effect for pending, failure, and success states.
 * Useful for rendering React components based on Effect state.
 *
 * @example
 * ```tsx
 * const { dataEffect } = useEffectQuery(api.todos.getAll, {});
 *
 * return matchEffect(dataEffect, {
 *   onPending: () => <Spinner />,
 *   onFailure: (error) => <Error error={error} />,
 *   onSuccess: (todos) => <TodoList items={todos} />,
 * });
 * ```
 */
export function matchEffect<T, Ok, Err>(
  effectQuery: UseEffectQueryResult<T>,
  handlers: {
    readonly onPending: () => Ok | Err;
    readonly onFailure: (error: AppError) => Err;
    readonly onSuccess: (data: T) => Ok;
  }
): Ok | Err {
  if (effectQuery.isLoading || effectQuery.isRefetching) {
    return handlers.onPending();
  }

  return RuntimeClient.runSync(
    Effect.match(effectQuery.toEffect, {
      onFailure: handlers.onFailure,
      onSuccess: handlers.onSuccess,
    })
  );
}
