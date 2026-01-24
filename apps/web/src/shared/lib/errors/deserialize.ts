import type { SerializedError } from "@/shared/lib/server-fn/types";
import {
  type AppError,
  ForbiddenError,
  GetUserIdentityError,
  InvalidCtxError,
  NotFoundError,
  UnknownError,
} from "./types";

/**
 * Deserializes a serialized error back to an Effect TaggedError.
 * Use this to reconstruct Effect errors from API responses.
 *
 * @example
 * ```ts
 * const result = await getPost({ postId });
 * if (!result.success) {
 *   const error = deserializeError(result.error);
 *   // error is now a proper Effect TaggedError
 * }
 * ```
 */
export const deserializeError = (serialized: SerializedError): AppError => {
  switch (serialized._tag) {
    case "NotFoundError":
      return new NotFoundError({
        docId: serialized.docId,
        handle: serialized.handle,
      });
    case "ForbiddenError":
      return new ForbiddenError({ message: serialized.message });
    case "UnknownError":
      return new UnknownError({ message: serialized.message });
    case "InvalidCtxError":
      return new InvalidCtxError();
    case "GetUserIdentityError":
      return new GetUserIdentityError({ message: serialized.message });
    default:
      return new UnknownError({
        message: `Unknown error type: ${(serialized as { _tag: string })._tag}`,
      });
  }
};
