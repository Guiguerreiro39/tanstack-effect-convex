import type { Id, TableNames } from "@/_generated/dataModel";

/**
 * Serialized error format for network transport.
 * Preserves _tag for discriminated union matching.
 */
export type SerializedError =
  | { _tag: "NotFoundError"; docId?: Id<TableNames>; handle?: string }
  | { _tag: "ForbiddenError"; message?: string }
  | { _tag: "UnknownError"; message: string }
  | { _tag: "InvalidCtxError" }
  | { _tag: "GetUserIdentityError"; message: string };

/**
 * Maps error tags to HTTP status codes.
 */
export const ErrorStatusMap: Record<SerializedError["_tag"], number> = {
  NotFoundError: 404,
  ForbiddenError: 401,
  UnknownError: 500,
  InvalidCtxError: 500,
  GetUserIdentityError: 401,
};

/**
 * API result type for server function responses.
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: SerializedError };
