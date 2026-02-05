import { todosDeleteTodoDescriptor } from "@tanstack-effect-convex/backend/src/contracts";
import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeleteTodo } from "../delete";

const mockUseEffectMutation = vi.fn();

vi.mock("@/shared/lib/hooks/use-effect-mutation", () => ({
  useEffectMutation: (...args: any[]) => mockUseEffectMutation(...args),
}));

describe("useDeleteTodo", () => {
  it("should call useEffectMutation with correct arguments", () => {
    renderHook(() => useDeleteTodo());

    expect(mockUseEffectMutation).toHaveBeenCalledWith(
      api.todos.deleteTodo,
      todosDeleteTodoDescriptor
    );
  });
});
