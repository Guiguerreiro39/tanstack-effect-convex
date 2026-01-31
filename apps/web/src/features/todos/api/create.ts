import { todosCreateDescriptor } from "@tanstack-effect-convex/backend/src/contracts/todos/create";
import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useCreateTodo() {
  return useEffectMutation(api.todos.create, todosCreateDescriptor);
}
