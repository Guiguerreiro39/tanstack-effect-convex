// packages/shared/src/errors.ts
import { Data } from "effect";

/**
 * Error thrown when user is not authenticated.
 */
export class UnauthenticatedError extends Data.TaggedError(
  "UnauthenticatedError"
) {}

/**
 * Error thrown when user lacks permission for a resource.
 */
export class NotAuthorizedError extends Data.TaggedError("NotAuthorizedError")<{
  resource: string;
}> {}

/**
 * Error thrown when a document is not found.
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  id?: string;
  handle?: string;
}> {}

/**
 * Error thrown for forbidden actions.
 */
export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message?: string;
}> {}

/**
 * Catch-all for unexpected errors.
 */
export class UnknownError extends Data.TaggedError("UnknownError")<{
  message: string;
}> {}

/**
 * Error thrown when context is invalid.
 */
export class InvalidCtxError extends Data.TaggedError("InvalidCtxError") {}

/**
 * Error thrown when getting user identity fails.
 */
export class GetUserIdentityError extends Data.TaggedError(
  "GetUserIdentityError"
)<{
  message: string;
}> {}

/**
 * All error constructors for codegen introspection.
 */
export const AllErrors = {
  UnauthenticatedError,
  NotAuthorizedError,
  NotFoundError,
  ForbiddenError,
  UnknownError,
  InvalidCtxError,
  GetUserIdentityError,
} as const;

/**
 * Error tag literal union.
 */
export type ErrorTag = keyof typeof AllErrors;
