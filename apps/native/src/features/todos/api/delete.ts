import { api } from "@tanstack-effect-convex/backend/api";
import { todosDeleteTodoDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@tanstack-effect-convex/effect-convex";

export function useDeleteTodo() {
  return useEffectMutation(api.todos.deleteTodo, todosDeleteTodoDescriptor);
}
