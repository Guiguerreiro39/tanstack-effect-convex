import { api } from "@tanstack-effect-convex/backend/api";
import { todosCreateDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@tanstack-effect-convex/effect-convex";

export function useCreateTodo() {
  return useEffectMutation(api.todos.create, todosCreateDescriptor);
}
