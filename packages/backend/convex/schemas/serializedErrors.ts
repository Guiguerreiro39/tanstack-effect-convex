// Re-exports from @repo/shared for backward compatibility
export type { SerializedError } from "@repo/shared/errors";
// biome-ignore lint/performance/noBarrelFile: intentional re-export from shared
export { ErrorStatusMap } from "@repo/shared/errors";

// Keep ApiResult here as it's backend-specific
import type { SerializedError } from "@repo/shared/errors";

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: SerializedError };
