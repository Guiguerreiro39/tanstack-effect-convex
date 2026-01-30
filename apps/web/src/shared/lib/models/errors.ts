// apps/web/src/shared/lib/models/errors.ts
// biome-ignore lint/performance/noBarrelFile: Re-export from shared for convenience
export {
  ForbiddenError,
  GetUserIdentityError,
  InvalidCtxError,
  NotAuthorizedError,
  NotFoundError,
  type SerializedError,
  UnauthenticatedError,
  UnknownError,
} from "@repo/shared/errors";

/**
 * Union of all frontend error types.
 * @deprecated Use scoped error types from generated contracts instead.
 */
export type AppError =
  | import("@repo/shared/errors").UnauthenticatedError
  | import("@repo/shared/errors").NotAuthorizedError
  | import("@repo/shared/errors").NotFoundError
  | import("@repo/shared/errors").ForbiddenError
  | import("@repo/shared/errors").UnknownError
  | import("@repo/shared/errors").InvalidCtxError
  | import("@repo/shared/errors").GetUserIdentityError;
