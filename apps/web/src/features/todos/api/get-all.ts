import { todosGetAllDescriptor } from "@tanstack-effect-convex/backend/src/contracts";
import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { useEffectQuery } from "@/shared/lib/hooks/use-effect-query";

export function useTodos() {
  return useEffectQuery(api.todos.getAll, todosGetAllDescriptor, {});
}
