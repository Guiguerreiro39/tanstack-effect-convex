import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { createDescriptor } from "@tanstack-effect-convex/backend/convex/lib/effect-contracts/todos/create";
import { useEffectMutation } from "@/shared/lib/hooks/use-effect-mutation";

export function useCreateTodo() {
  return useEffectMutation(api.todos.create.create, createDescriptor);
}
