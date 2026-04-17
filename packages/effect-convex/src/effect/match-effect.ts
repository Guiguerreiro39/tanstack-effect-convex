import type { SchemaDecodeError } from "@tanstack-effect-convex/backend/contracts";
import { Effect } from "effect";
import type { UseEffectQueryResult } from "../hooks/use-effect-query";
import { RuntimeClient } from "./runtime-client";

/**
 * Pattern match on an Effect for pending, failure, and success states.
 * Useful for rendering React components based on Effect state.
 *
 * @example
 * ```tsx
 * import { todosGetAllDescriptor } from "@tanstack-effect-convex/backend/contracts";
 *
 * const todos = useEffectQuery(api.todos.getAll, todosGetAllDescriptor, {});
 *
 * return matchEffect(todos, {
 *   onPending: () => <Spinner />,
 *   onFailure: (error) => <Error error={error} />,
 *   onSuccess: (todos) => <TodoList items={todos} />,
 * });
 * ```
 */
export function matchEffect<T, E, Ok, Err>(
  effectQuery: UseEffectQueryResult<T, E>,
  handlers: {
    readonly onPending: () => Ok | Err;
    readonly onFailure: (error: E | SchemaDecodeError) => Err;
    readonly onSuccess: (data: T) => Ok;
  }
): Ok | Err {
  if (effectQuery.isLoading || effectQuery.isRefetching) {
    return handlers.onPending();
  }

  return RuntimeClient.runSync(
    Effect.match(effectQuery.toEffect(), {
      onFailure: handlers.onFailure,
      onSuccess: handlers.onSuccess,
    })
  );
}
