import { createServerFn } from "@tanstack/react-start";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { fetchAuthMutation } from "@/lib/auth-server";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator(
    (data: unknown) => data as { id: Id<"todos">; completed: boolean }
  )
  .handler(
    withConvexErrorHandling(
      async (ctx: { data: { id: Id<"todos">; completed: boolean } }) => {
        return await fetchAuthMutation(api.todos.toggle, {
          id: ctx.data.id,
          completed: ctx.data.completed,
        });
      }
    )
  );
