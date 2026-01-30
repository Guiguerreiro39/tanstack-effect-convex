import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { getAllDescriptor } from "@tanstack-effect-convex/backend/convex/lib/effect-contracts/todos/getAll";
import { useEffectQuery } from "@/shared/lib/hooks/use-effect-query";

export function useTodos() {
  return useEffectQuery(api.todos.getAll.getAll, getAllDescriptor, {});
}
