import { ConvexError } from "convex/values";
import type { ApiResult, SerializedError } from "./types";

/**
 * Extracts serialized error from a ConvexError.
 */
const extractConvexError = (
  error: unknown
): { status: number; error: SerializedError } => {
  if (error instanceof ConvexError) {
    const data = error.data as { status?: number; error?: SerializedError };
    return {
      status: data.status ?? 500,
      error: data.error ?? { _tag: "UnknownError", message: error.message },
    };
  }

  return {
    status: 500,
    error: { _tag: "UnknownError", message: String(error) },
  };
};

/**
 * Wraps a handler function to catch ConvexErrors and return typed ApiResult.
 * Preserves HTTP status codes from ConvexError.
 *
 * @example
 * ```ts
 * // Without inputValidator
 * const getPosts = createServerFn({ method: "GET" }).handler(
 *   withConvexErrorHandling(async () => {
 *     return await fetchQuery(api.posts.getAll);
 *   })
 * );
 *
 * // With inputValidator - handler receives ctx with { data }
 * const getPost = createServerFn({ method: "GET" })
 *   .inputValidator((data) => data as { postId: string })
 *   .handler(
 *     withConvexErrorHandling(async (ctx: { data: { postId: string } }) => {
 *       return await fetchQuery(api.posts.get, { id: ctx.data.postId });
 *     })
 *   );
 *
 * // Caller passes { data: { ... } }
 * await getPost({ data: { postId: "123" } });
 * ```
 */
export const withConvexErrorHandling = <Args, T>(
  handler: (args: Args) => Promise<T>
) => {
  return async (args: Args): Promise<ApiResult<T>> => {
    try {
      const data = await handler(args);
      return { success: true, data };
    } catch (error) {
      const { status, error: serializedError } = extractConvexError(error);
      return { success: false, status, error: serializedError };
    }
  };
};
