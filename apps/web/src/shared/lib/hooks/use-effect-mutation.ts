import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { useConvex } from "convex/react";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { Effect } from "effect";
import { extractConvexError } from "@/shared/lib/errors/extract-convex-error";
import type { AppError } from "@/shared/lib/models/errors";

type UseEffectMutationResult<F extends FunctionReference<"mutation">> =
  UseMutationResult<FunctionReturnType<F>, Error, FunctionArgs<F>> & {
    toEffect: Effect.Effect<FunctionReturnType<F>, AppError>;
  };

type Options<F extends FunctionReference<"mutation">> = Omit<
  UseMutationOptions<FunctionReturnType<F>, Error, FunctionArgs<F>>,
  "mutationFn"
>;

/**
 * Convex mutation hook with Effect integration.
 * Uses direct Convex client call (no server function round-trip).
 *
 * @example
 * ```tsx
 * const createTodo = useEffectMutation(api.todos.create, {
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["convexQuery"] }),
 * });
 *
 * // Mutate directly
 * await createTodo.mutateAsync({ text: "Buy milk" });
 *
 * // Or use Effect pattern
 * const effect = createTodo.toEffect().pipe(
 *   Effect.match({
 *     onFailure: (error) => console.error(error._tag),
 *     onSuccess: (data) => console.log("Created:", data),
 *   })
 * );
 * ```
 */
export function useEffectMutation<F extends FunctionReference<"mutation">>(
  funcRef: F,
  options?: Options<F>
): UseEffectMutationResult<F> {
  const convex = useConvex();

  const mutation = useMutation({
    mutationFn: (args: FunctionArgs<F>) =>
      convex.mutation(funcRef, args) as Promise<FunctionReturnType<F>>,
    ...options,
  });

  const toEffect = Effect.gen(function* () {
    if (mutation.isPending || mutation.isIdle) {
      return yield* Effect.never;
    }

    if (mutation.error) {
      return yield* Effect.fail(extractConvexError(mutation.error));
    }

    return mutation.data;
  });

  return { ...mutation, toEffect };
}
