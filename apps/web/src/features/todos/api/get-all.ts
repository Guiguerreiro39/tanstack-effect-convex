import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { useEffectQuery } from "@/shared/lib/hooks/use-effect-query";

export function useTodos() {
  return useEffectQuery(api.todos.getAll, {});
}
