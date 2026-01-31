/**
 * Determines the current Convex environment based on env vars.
 * @returns `"test"` | `"development"` | `"production"`
 */
export function parseCurrentConvexEnvironment() {
  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  if (process.env.CONVEX_ENV !== "production") {
    return "development";
  }

  return "production";
}
