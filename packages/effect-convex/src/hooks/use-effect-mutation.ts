import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import {
  type FunctionDescriptor,
  SchemaDecodeError,
} from "@tanstack-effect-convex/backend/contracts";
import { useConvex } from "convex/react";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexError } from "convex/values";
import { Effect, Schema } from "effect";

type UseEffectMutationResult<
  F extends FunctionReference<"mutation">,
  A,
  E,
> = UseMutationResult<FunctionReturnType<F>, Error, FunctionArgs<F>> & {
  /**
   * Returns Effect with scoped error type.
   * Will fail with E for declared errors, or SchemaDecodeError if data validation fails.
   */
  toEffect: () => Effect.Effect<A, E | SchemaDecodeError>;
};

type UseEffectMutationOptions<F extends FunctionReference<"mutation">> = Omit<
  UseMutationOptions<FunctionReturnType<F>, Error, FunctionArgs<F>>,
  "mutationFn"
>;

/**
 * Convex mutation hook with scoped Effect error types and data validation.
 *
 * @param funcRef - Convex mutation function reference
 * @param descriptor - Function descriptor from generated contracts (required)
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * import { api } from "@tanstack-effect-convex/backend/api";
 * import { todosCreateDescriptor, type TodosCreateError } from "@tanstack-effect-convex/backend/contracts";
 *
 * const createTodo = useEffectMutation(api.todos.create, todosCreateDescriptor);
 *
 * // Error is typed as TodosCreateError | SchemaDecodeError
 * matchEffect(createTodo.toEffect(), {
 *   Pending: () => <Spinner />,
 *   Failure: (err) => {
 *     if (err._tag === "ForbiddenError") return <SignIn />;
 *     return <ErrorView error={err} />;
 *   },
 *   Success: (id) => <Done id={id} />,
 * });
 * ```
 */
export function useEffectMutation<
  F extends FunctionReference<"mutation">,
  A,
  E,
  I,
>(
  funcRef: F,
  descriptor: FunctionDescriptor<A, E, I>,
  options?: UseEffectMutationOptions<F>
): UseEffectMutationResult<F, A, E> {
  const convex = useConvex();

  const mutation = useMutation({
    mutationFn: (args: FunctionArgs<F>) =>
      convex.mutation(funcRef, args) as Promise<FunctionReturnType<F>>,
    ...options,
  });

  const toEffect = (): Effect.Effect<A, E | SchemaDecodeError> =>
    Effect.gen(function* () {
      if (mutation.isPending || mutation.isIdle) {
        return yield* Effect.never;
      }

      if (mutation.error) {
        // Extract ConvexError data and decode with scoped decoder
        const convexErr = mutation.error;
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
        mutation.data
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

  return { ...mutation, toEffect } as UseEffectMutationResult<F, A, E>;
}
