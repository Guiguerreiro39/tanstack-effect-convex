import { api } from "@tanstack-effect-convex/backend/api";
import { todosToggleDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@tanstack-effect-convex/effect-convex";

export function useToggleTodo() {
  return useEffectMutation(api.todos.toggle, todosToggleDescriptor);
}
