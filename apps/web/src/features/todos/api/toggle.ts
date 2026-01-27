import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useToggleTodo() {
  return useEffectMutation(api.todos.toggle);
}
