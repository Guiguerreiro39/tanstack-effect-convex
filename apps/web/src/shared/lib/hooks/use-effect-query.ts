import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { Effect } from "effect";
import { deserializeError } from "@/shared/lib/errors/deserialize";
import type { AppError } from "@/shared/lib/errors/types";
import type { ApiResult } from "@/shared/lib/server-fn/types";

/**
 * Options for useEffectQuery hook.
 */
type UseEffectQueryOptions<T> = Omit<
  UseQueryOptions<ApiResult<T>, Error, ApiResult<T>>,
  "queryFn"
> & {
  queryFn: () => Promise<ApiResult<T>>;
};

/**
 * Result type for useEffectQuery hook.
 */
type UseEffectQueryResult<T> = UseQueryResult<ApiResult<T>, Error> & {
  /**
   * Get the result as an Effect that fails with typed AppError.
   */
  toEffect: () => Effect.Effect<T, AppError>;
};

/**
 * React Query hook that integrates with Effect error handling.
 * Returns standard useQuery result plus a `toEffect()` method.
 *
 * @example
 * ```tsx
 * function PostComponent({ postId }: { postId: string }) {
 *   const query = useEffectQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => getPost({ postId }),
 *   });
 *
 *   // Option 1: Use React Query pattern
 *   if (query.data?.success) {
 *     return <Post post={query.data.data} />;
 *   }
 *
 *   // Option 2: Use Effect pattern
 *   const effect = query.toEffect().pipe(
 *     Effect.match({
 *       onFailure: (error) => <ErrorDisplay error={error} />,
 *       onSuccess: (post) => <Post post={post} />,
 *     })
 *   );
 * }
 * ```
 */
export function useEffectQuery<T>(
  options: UseEffectQueryOptions<T>
): UseEffectQueryResult<T> {
  const query = useQuery(options);

  const toEffect = (): Effect.Effect<T, AppError> => {
    return Effect.gen(function* () {
      if (query.isLoading || query.isPending) {
        return yield* Effect.never;
      }

      if (query.error) {
        return yield* Effect.fail(
          deserializeError({
            _tag: "UnknownError",
            message: query.error.message,
          })
        );
      }

      const result = query.data;
      if (!result) {
        return yield* Effect.fail(
          deserializeError({ _tag: "UnknownError", message: "No data" })
        );
      }

      if (!result.success) {
        return yield* Effect.fail(deserializeError(result.error));
      }

      return result.data;
    });
  };

  return {
    ...query,
    toEffect,
  };
}
