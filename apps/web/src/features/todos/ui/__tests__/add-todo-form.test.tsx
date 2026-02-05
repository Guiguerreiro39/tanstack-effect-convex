/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as UseCreateTodo from "../../api/create";
import { AddTodoForm } from "../add-todo-form";

describe("AddTodoForm", () => {
  it("renders input and button", () => {
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<AddTodoForm />);

    expect(
      screen.getByPlaceholderText("Add a new task...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("handles input change", () => {
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<AddTodoForm />);
    const input = screen.getByPlaceholderText("Add a new task...");

    fireEvent.change(input, { target: { value: "Buy milk" } });
    expect(input).toHaveValue("Buy milk");
  });

  it("submits form with valid data", () => {
    const mutateAsync = vi.fn();
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    render(<AddTodoForm />);

    fireEvent.change(screen.getByPlaceholderText("Add a new task..."), {
      target: { value: "Buy milk" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mutateAsync).toHaveBeenCalledWith({ text: "Buy milk" });
    expect(screen.getByPlaceholderText("Add a new task...")).toHaveValue("");
  });

  it("disables button when empty", () => {
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<AddTodoForm />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("shows loading state", () => {
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    render(<AddTodoForm />);
    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
  });
});
