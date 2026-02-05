/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as UseDeleteTodo from "../../api/delete";
import * as UseToggleTodo from "../../api/toggle";
import { TodoItem } from "../todo-item";

describe("TodoItem", () => {
  const mockTodo = {
    _id: "todo1",
    text: "Buy milk",
    completed: false,
    _creationTime: 123,
    userId: "user1",
  };

  it("renders todo text", () => {
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<TodoItem todo={mockTodo} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("toggles completion status", () => {
    const mutateToggle = vi.fn();
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: mutateToggle,
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<TodoItem todo={mockTodo} />);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(mutateToggle).toHaveBeenCalledWith({
      id: mockTodo._id,
      completed: true,
    });
  });

  it("deletes todo", () => {
    const mutateDelete = vi.fn();
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: mutateDelete,
    } as any);

    render(<TodoItem todo={mockTodo} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete todo" }));

    expect(mutateDelete).toHaveBeenCalledWith({ id: mockTodo._id });
  });

  it("renders completed state correctly", () => {
    vi.spyOn(UseToggleTodo, "useToggleTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);
    vi.spyOn(UseDeleteTodo, "useDeleteTodo").mockReturnValue({
      mutate: vi.fn(),
    } as any);

    render(<TodoItem todo={{ ...mockTodo, completed: true }} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    expect(screen.getByText("Buy milk")).toHaveClass("line-through");
  });
});
