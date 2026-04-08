import { api } from "@tanstack-effect-convex/backend/api";
import { todosToggleDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useToggleTodo() {
  return useEffectMutation(api.todos.toggle, todosToggleDescriptor);
}
