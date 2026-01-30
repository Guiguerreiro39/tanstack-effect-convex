// Re-exports from @repo/shared for backward compatibility
// biome-ignore lint/performance/noBarrelFile: intentional re-export from shared
export {
  Forbidden,
  ForbiddenError,
  GetUserIdentityError,
  InvalidCtxError,
  NotAuthorized,
  NotAuthorizedError,
  NotFound,
  NotFoundError,
  // Factories
  Unauthenticated,
  UnauthenticatedError,
  Unknown,
  UnknownError,
} from "@repo/shared/errors";
