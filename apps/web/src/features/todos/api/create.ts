import { api } from "@tanstack-effect-convex/backend/api";
import { todosCreateDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useCreateTodo() {
  return useEffectMutation(api.todos.create, todosCreateDescriptor);
}
