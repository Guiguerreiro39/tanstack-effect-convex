import { api } from "@tanstack-effect-convex/backend/api";
import { todosGetAllDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectQuery } from "@/shared/lib/hooks/use-effect-query";

export function useTodos() {
  return useEffectQuery(api.todos.getAll, todosGetAllDescriptor, {});
}
