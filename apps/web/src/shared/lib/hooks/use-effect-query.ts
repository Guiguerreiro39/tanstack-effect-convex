import { convexQuery } from "@convex-dev/react-query";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexError } from "convex/values";
import { Effect } from "effect";
import type { ErrorDescriptor } from "@/shared/model/errors";

export type UseEffectQueryResult<T, E> = UseQueryResult<T, Error> & {
  /**
   * Returns Effect with scoped error type.
   */
  toEffect: () => Effect.Effect<T, E>;
};

/**
 * Convex query hook with scoped Effect error types.
 *
 * @param funcRef - Convex query function reference
 * @param descriptor - Error descriptor from generated contracts (required)
 * @param args - Query arguments
 *
 * @example
 * ```tsx
 * import { api } from "@backend/_generated/api";
 * import { getAllDescriptor, type GetAllError } from "@backend/convex/lib/effect-contracts/todos/getAll";
 *
 * const todos = useEffectQuery(api.todos.getAll.getAll, getAllDescriptor, {});
 *
 * // Standard React Query pattern
 * if (todos.isPending) return <Loading />;
 * if (todos.error) return <Error error={todos.error} />;
 * return <List items={todos.data} />;
 *
 * // Or use Effect pattern with scoped error types
 * matchEffect(todos.toEffect(), {
 *   Pending: () => <Loading />,
 *   Failure: (err) => <Error error={err} />,
 *   Success: (data) => <List items={data} />,
 * });
 * ```
 */
export function useEffectQuery<F extends FunctionReference<"query">, E>(
  funcRef: F,
  descriptor: ErrorDescriptor<E>,
  args: FunctionArgs<F>
): UseEffectQueryResult<FunctionReturnType<F>, E> {
  const query = useQuery(convexQuery(funcRef, args));

  const toEffect = (): Effect.Effect<FunctionReturnType<F>, E> =>
    Effect.gen(function* () {
      if (query.isPending) {
        return yield* Effect.never;
      }

      if (query.error) {
        // Extract ConvexError data and decode with scoped decoder
        const convexErr = query.error;

        if (convexErr instanceof ConvexError) {
          const data = convexErr.data;
          const errorData =
            typeof data === "object" && data !== null && "error" in data
              ? data.error
              : data;
          const decoded = descriptor.decode(errorData);
          if (decoded) {
            return yield* Effect.fail(decoded);
          }
        }
        // If decode fails, throw - contract violation
        throw new Error(
          `Error contract violation in ${descriptor.path}: received undeclared error`
        );
      }

      return query.data;
    });

  return { ...query, toEffect };
}
