import { createServerFn } from "@tanstack/react-start";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { fetchAuthMutation } from "@/lib/auth-server";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { text: string })
  .handler(
    withConvexErrorHandling(async (ctx: { data: { text: string } }) => {
      return await fetchAuthMutation(api.todos.create, { text: ctx.data.text });
    })
  );
