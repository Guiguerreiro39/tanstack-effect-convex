import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useDeleteTodo() {
  return useEffectMutation(api.todos.deleteTodo);
}
