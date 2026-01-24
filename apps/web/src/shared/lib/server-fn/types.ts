/**
 * Serialized error format for network transport.
 * Mirrors backend SerializedError type.
 */
export type SerializedError =
  | { _tag: "NotFoundError"; docId?: string; handle?: string }
  | { _tag: "ForbiddenError"; message?: string }
  | { _tag: "UnknownError"; message: string }
  | { _tag: "InvalidCtxError" }
  | { _tag: "GetUserIdentityError"; message: string };

/**
 * API result type for server function responses.
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: SerializedError };

/**
 * Extract data type from ApiResult.
 */
export type ApiResultData<T> = T extends ApiResult<infer D> ? D : never;
