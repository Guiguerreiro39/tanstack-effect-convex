import { todosGetAllDescriptor } from "@tanstack-effect-convex/backend/src/contracts";
import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTodos } from "../get-all";

const mockUseEffectQuery = vi.fn();

vi.mock("@/shared/lib/hooks/use-effect-query", () => ({
  useEffectQuery: (...args: any[]) => mockUseEffectQuery(...args),
}));

describe("useTodos", () => {
  it("should call useEffectQuery with correct arguments", () => {
    renderHook(() => useTodos());

    expect(mockUseEffectQuery).toHaveBeenCalledWith(
      api.todos.getAll,
      todosGetAllDescriptor,
      {}
    );
  });
});
