import { todosDeleteTodoDescriptor } from "@tanstack-effect-convex/backend/src/contracts/todos/deleteTodo";
import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useDeleteTodo() {
  return useEffectMutation(api.todos.deleteTodo, todosDeleteTodoDescriptor);
}
