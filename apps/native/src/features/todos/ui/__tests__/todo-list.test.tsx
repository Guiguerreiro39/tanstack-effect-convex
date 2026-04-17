/** biome-ignore-all lint/performance/noNamespaceImport: false positive */
import type { Doc } from "@tanstack-effect-convex/backend/dataModel";
import { render, screen } from "@testing-library/react-native";
import { Effect } from "effect";
import { Text, View } from "react-native";
import { describe, expect, it, vi } from "vitest";
import * as UseTodos from "../../api/get-all";
import { TodoList } from "../todo-list";

// Mock the components used inside TodoList
vi.mock("../add-todo-form", () => ({
  AddTodoForm: () => <View testID="add-todo-form" />,
}));

vi.mock("../todo-item", () => ({
  TodoItem: ({ todo }: { todo: any }) => (
    <Text testID="todo-item">{todo.text}</Text>
  ),
}));

describe("TodoList", () => {
  it("shows empty state when no todos", async () => {
    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.succeed([]),
      isLoading: false,
      isRefetching: false,
    } as any);

    render(<TodoList />);

    // Wait for the effect to resolve
    expect(await screen.findByText("No todos yet.")).toBeTruthy();
    expect(screen.getByTestId("add-todo-form")).toBeTruthy();
  });

  it("renders list of todos", async () => {
    const mockTodos = [
      { _id: "1", text: "Buy milk", isCompleted: false, _creationTime: 123 },
      { _id: "2", text: "Walk dog", isCompleted: true, _creationTime: 124 },
    ] as unknown as Doc<"todos">[];

    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.succeed(mockTodos),
      isLoading: false,
      isRefetching: false,
    } as any);

    render(<TodoList />);

    const items = await screen.findAllByTestId("todo-item");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Buy milk")).toBeTruthy();
    expect(screen.getByText("Walk dog")).toBeTruthy();
  });

  it("displays error state", async () => {
    const error = { _tag: "UnknownError", message: "Failed to fetch" };
    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.fail(error as any),
      isLoading: false,
      isRefetching: false,
    } as any);

    render(<TodoList />);

    expect(await screen.findByText("Error")).toBeTruthy();
    expect(screen.getByText("Failed to fetch")).toBeTruthy();
  });
});
