import { convexQuery } from "@convex-dev/react-query";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  type FunctionDescriptor,
  SchemaDecodeError,
} from "@tanstack-effect-convex/backend/contracts";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { ConvexError } from "convex/values";
import { Effect, Schema } from "effect";

export type UseEffectQueryResult<T, E> = UseQueryResult<T, Error> & {
  /**
   * Returns Effect with scoped error type.
   * Will fail with E for declared errors, or SchemaDecodeError if data validation fails.
   */
  toEffect: () => Effect.Effect<T, E | SchemaDecodeError>;
};

/**
 * Convex query hook with scoped Effect error types and data validation.
 *
 * @param funcRef - Convex query function reference
 * @param descriptor - Function descriptor from generated contracts (required)
 * @param args - Query arguments
 *
 * @example
 * ```tsx
 * import { api } from "@backend/_generated/api";
 * import { todosGetAllDescriptor, type TodosGetAllError } from "@backend/contracts";
 *
 * const todos = useEffectQuery(api.todos.getAll, todosGetAllDescriptor, {});
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
export function useEffectQuery<F extends FunctionReference<"query">, A, E, I>(
  funcRef: F,
  descriptor: FunctionDescriptor<A, E, I>,
  args: FunctionArgs<F>
): UseEffectQueryResult<A, E> {
  const query = useQuery(convexQuery(funcRef, args));

  const toEffect = (): Effect.Effect<A, E | SchemaDecodeError> =>
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
          const decoded = descriptor.decodeError(errorData);
          if (decoded) {
            return yield* Effect.fail(decoded);
          }
        }
        // If decode fails, throw - contract violation
        throw new Error(
          `Error contract violation in ${descriptor.path}: received undeclared error`
        );
      }

      // Validate data against schema
      const parseResult = Schema.decodeUnknownEither(descriptor.dataSchema)(
        query.data
      );

      if (parseResult._tag === "Left") {
        return yield* Effect.fail(
          new SchemaDecodeError({
            path: descriptor.path,
            cause: parseResult.left,
          })
        );
      }

      return parseResult.right;
    });

  return { ...query, toEffect } as UseEffectQueryResult<A, E>;
}
