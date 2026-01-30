import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { deleteTodoDescriptor } from "@tanstack-effect-convex/backend/convex/lib/effect-contracts/todos/deleteTodo";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useDeleteTodo() {
  return useEffectMutation(api.todos.delete.deleteTodo, deleteTodoDescriptor);
}
