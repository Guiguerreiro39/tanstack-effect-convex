import { api } from "@tanstack-effect-convex/backend/api";
import { todosGetAllDescriptor } from "@tanstack-effect-convex/backend/contracts";
import { useEffectQuery } from "@tanstack-effect-convex/effect-convex";

export function useTodos() {
  return useEffectQuery(api.todos.getAll, todosGetAllDescriptor);
}
