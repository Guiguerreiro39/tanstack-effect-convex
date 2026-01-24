import { Effect } from "effect";
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
export function matchEffect<T, E, Ok, Err>(
  effect: Effect.Effect<T, E> | null,
  handlers: {
    readonly onPending: () => Ok | Err;
    readonly onFailure: (error: E) => Err;
    readonly onSuccess: (data: T) => Ok;
  },
): Ok | Err {
  if (effect === null) {
    return handlers.onPending();
  }

  return RuntimeClient.runSync(
    Effect.match(effect, {
      onFailure: handlers.onFailure,
      onSuccess: handlers.onSuccess,
    }),
  );
}
