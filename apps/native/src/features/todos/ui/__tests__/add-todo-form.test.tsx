/** biome-ignore-all lint/performance/noNamespaceImport: false positive */

import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";
import * as UseCreateTodo from "../../api/create";
import { AddTodoForm } from "../add-todo-form";

describe("AddTodoForm", () => {
  it("submits the form with text", () => {
    const mutate = vi.fn();
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    render(<AddTodoForm />);

    const input = screen.getByPlaceholderText("Add a new todo...");
    const button = screen.getByText("Add");

    fireEvent.changeText(input, "New todo");
    fireEvent.press(button);

    expect(mutate).toHaveBeenCalledWith({ text: "New todo" });
    expect(input.props.value).toBe("");
  });

  it("does not submit empty text", () => {
    const mutate = vi.fn();
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    render(<AddTodoForm />);

    const button = screen.getByText("Add");
    fireEvent.press(button);

    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    vi.spyOn(UseCreateTodo, "useCreateTodo").mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<AddTodoForm />);

    expect(screen.getByTestId("ActivityIndicator")).toBeTruthy();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
