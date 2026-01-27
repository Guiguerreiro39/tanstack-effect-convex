import { Data } from "effect";

/**
 * Frontend error classes mirroring backend TaggedErrors.
 * These are reconstructed from serialized errors.
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  docId?: string;
  handle?: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message?: string;
}> {}

export class UnknownError extends Data.TaggedError("UnknownError")<{
  message: string;
}> {}

export class InvalidCtxError extends Data.TaggedError("InvalidCtxError") {}

export class GetUserIdentityError extends Data.TaggedError(
  "GetUserIdentityError"
)<{
  message: string;
}> {}

/**
 * Union of all frontend error types.
 */
export type AppError =
  | NotFoundError
  | ForbiddenError
  | UnknownError
  | InvalidCtxError
  | GetUserIdentityError;
