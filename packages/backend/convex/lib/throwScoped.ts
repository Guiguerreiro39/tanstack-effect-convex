import { ConvexError } from "convex/values";
import type { SerializedError } from "../schemas/serializedErrors";

/**
 * Throws an error after validating it's in the allowed set.
 * Use this to enforce error contracts at runtime.
 *
 * @example
 * ```ts
 * import { errors } from "./todos/create";
 * import { Forbidden } from "../schemas/errors";
 *
 * // Get allowed tags from error classes
 * const allowedTags = errors.map((E) => new E({} as never)._tag);
 *
 * // Throws ConvexError if tag is allowed, Error if not
 * throwScoped(Forbidden({ message: "No access" }), allowedTags);
 * ```
 */
export function throwScoped(
  error: { _tag: string; [key: string]: unknown },
  allowed: readonly string[]
): never {
  if (!allowed.includes(error._tag)) {
    throw new Error(
      `Illegal error "${error._tag}" thrown. Allowed: [${allowed.join(", ")}]`
    );
  }
  // Cast is safe: runtime check ensures error tag is in allowed set
  throw new ConvexError(error as SerializedError);
}

/**
 * Extracts allowed tags from error class array.
 *
 * @example
 * ```ts
 * const errors = [ForbiddenError, UnknownError] as const;
 * const tags = getAllowedTags(errors); // ["ForbiddenError", "UnknownError"]
 * ```
 */
export function getAllowedTags<
  T extends readonly (new (
    ...args: never[]
  ) => { _tag: string })[],
>(errors: T): string[] {
  return errors.map((E) => {
    // Create instance to get _tag (TaggedError stores tag on prototype)
    const instance = Object.create(E.prototype);
    return instance._tag;
  });
}
