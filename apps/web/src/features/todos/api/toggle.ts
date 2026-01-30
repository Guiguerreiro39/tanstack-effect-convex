import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { toggleDescriptor } from "@tanstack-effect-convex/backend/convex/lib/effect-contracts/todos/toggle";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useToggleTodo() {
  return useEffectMutation(api.todos.toggle.toggle, toggleDescriptor);
}
