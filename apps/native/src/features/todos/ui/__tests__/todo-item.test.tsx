/** biome-ignore-all lint/performance/noNamespaceImport: false positive */

import type { Id } from "@tanstack-effect-convex/backend/dataModel";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";
import * as UseDeleteTodo from "../../api/delete";
import * as UseToggleTodo from "../../api/toggle";
import { TodoItem } from "../todo-item";

describe("TodoItem", () => {
  const mockTodo = {
    _id: "todo1" as Id<"todos">,
    text: "Buy milk",
    completed: false,
    _creationTime: 123,
    userId: "user1",
  };

  it("renders todo text", () => {
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<TodoItem todo={mockTodo} />);
    expect(screen.getByText("Buy milk")).toBeTruthy();
  });

  it("toggles completion status", () => {
    const mutateToggle = vi.fn();
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: mutateToggle,
      isPending: false,
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<TodoItem todo={mockTodo} />);

    fireEvent.press(screen.getByText("Buy milk"));

    expect(mutateToggle).toHaveBeenCalledWith({
      id: mockTodo._id,
      completed: true,
    });
  });

  it("deletes todo", () => {
    const mutateDelete = vi.fn();
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: mutateDelete,
      isPending: false,
    } as any);

    render(<TodoItem todo={mockTodo} />);

    fireEvent.press(screen.getByText("Delete"));

    expect(mutateDelete).toHaveBeenCalledWith({ id: mockTodo._id });
  });

  it("renders completed state correctly", () => {
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<TodoItem todo={{ ...mockTodo, completed: true }} />);

    expect(screen.getByText("Buy milk")).toBeTruthy();
    // In native tests, checking styles is harder with Tailwind/NativeWind,
    // but we can at least check if it renders.
  });
});
