import { createServerFn } from "@tanstack/react-start";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { fetchAuthMutation } from "@/lib/auth-server";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { id: Id<"todos"> })
  .handler(
    withConvexErrorHandling(async (ctx: { data: { id: Id<"todos"> } }) => {
      return await fetchAuthMutation(api.todos.deleteTodo, { id: ctx.data.id });
    })
  );
