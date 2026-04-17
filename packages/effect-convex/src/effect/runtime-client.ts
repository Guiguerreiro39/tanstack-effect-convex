import { Layer, ManagedRuntime } from "effect";

const MainLayer = Layer.empty;

/**
 * Client-side Effect runtime for synchronous operations.
 * Used for pattern matching on Effects in React components.
 *
 * @example
 * ```typescript
 * import { RuntimeClient } from "@tanstack-effect-convex/effect-convex/effect";
 *
 * const result = RuntimeClient.runSync(
 *   Effect.succeed("value")
 * );
 * ```
 */
export const RuntimeClient = ManagedRuntime.make(MainLayer);
