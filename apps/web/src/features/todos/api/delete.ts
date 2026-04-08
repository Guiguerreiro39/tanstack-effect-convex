import { api } from "@tanstack-effect-convex/backend/api";
import { todosDeleteTodoDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useDeleteTodo() {
  return useEffectMutation(api.todos.deleteTodo, todosDeleteTodoDescriptor);
}
