import { createServerFn } from "@tanstack/react-start";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

/**
 * Server function to fetch all todos.
 * Wraps Convex query with typed error handling.
 */
export const getAllTodos = createServerFn({ method: "GET" }).handler(
  withConvexErrorHandling(async () => {
    return await fetchAuthQuery(api.todos.getAll);
  })
);
