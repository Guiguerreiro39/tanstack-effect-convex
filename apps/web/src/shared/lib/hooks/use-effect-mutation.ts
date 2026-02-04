import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import type { ErrorDescriptor } from "@tanstack-effect-convex/backend/src/contracts";
import { useConvex } from "convex/react";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexError } from "convex/values";
import { Effect } from "effect";

type UseEffectMutationResult<
  F extends FunctionReference<"mutation">,
  E,
> = UseMutationResult<FunctionReturnType<F>, Error, FunctionArgs<F>> & {
  /**
   * Returns Effect with scoped error type.
   */
  toEffect: () => Effect.Effect<FunctionReturnType<F>, E>;
};

type Options<F extends FunctionReference<"mutation">> = Omit<
  UseMutationOptions<FunctionReturnType<F>, Error, FunctionArgs<F>>,
  "mutationFn"
>;

/**
 * Convex mutation hook with scoped Effect error types.
 *
 * @param funcRef - Convex mutation function reference
 * @param descriptor - Error descriptor from generated contracts (required)
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * import { api } from "@backend/_generated/api";
 * import { createDescriptor, type CreateError } from "@backend/convex/lib/effect-contracts/todos/create";
 *
 * const createTodo = useEffectMutation(api.todos.create.create, createDescriptor);
 *
 * // Error is typed as CreateError (ForbiddenError | UnknownError)
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
export function useEffectMutation<F extends FunctionReference<"mutation">, E>(
  funcRef: F,
  descriptor: ErrorDescriptor<E>,
  options?: Options<F>
): UseEffectMutationResult<F, E> {
  const convex = useConvex();

  const mutation = useMutation({
    mutationFn: (args: FunctionArgs<F>) =>
      convex.mutation(funcRef, args) as Promise<FunctionReturnType<F>>,
    ...options,
  });

  const toEffect = (): Effect.Effect<FunctionReturnType<F>, E> =>
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

      return mutation.data;
    });

  return { ...mutation, toEffect };
}
