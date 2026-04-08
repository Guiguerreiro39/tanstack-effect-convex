/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */

import type { TodosGetAllError } from "@tanstack-effect-convex/backend/contracts";
import type { Doc } from "@tanstack-effect-convex/backend/dataModel";
import { render, screen } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import type { UseEffectQueryResult } from "@/shared/lib/hooks/use-effect-query";
import * as UseTodos from "../../api/get-all";
import { TodoList } from "../todo-list";

// Mock the components used inside TodoList
vi.mock("../add-todo-form", () => ({
  AddTodoForm: () => <div data-testid="add-todo-form">Add Todo Form</div>,
}));

vi.mock("../todo-item", () => ({
  TodoItem: ({ todo }: { todo: Doc<"todos"> }) => (
    <li data-testid="todo-item">{todo.text}</li>
  ),
}));

describe("TodoList", () => {
  it("shows loading state initially", () => {
    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.never,
      isLoading: true,
      isRefetching: false,
    } as unknown as UseEffectQueryResult<Doc<"todos">[], TodosGetAllError>);
    render(<TodoList />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no todos", async () => {
    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.succeed([]),
      isLoading: false,
      isRefetching: false,
    } as unknown as UseEffectQueryResult<Doc<"todos">[], TodosGetAllError>);
    render(<TodoList />);

    // Wait for the effect to resolve
    expect(
      await screen.findByText("No todos yet. Add one above!")
    ).toBeInTheDocument();
    expect(screen.getByTestId("add-todo-form")).toBeInTheDocument();
  });

  it("renders list of todos", async () => {
    const mockTodos = [
      { _id: "1", text: "Buy milk", isCompleted: false, _creationTime: 123 },
      { _id: "2", text: "Walk dog", isCompleted: true, _creationTime: 124 },
    ] as unknown as Doc<"todos">[]; // Cast mock data as Doc<"todos">[] since strict type matching for _id/creationTime might effectively be opaque

    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.succeed(mockTodos),
      isLoading: false,
      isRefetching: false,
    } as unknown as UseEffectQueryResult<Doc<"todos">[], TodosGetAllError>);

    render(<TodoList />);

    const items = await screen.findAllByTestId("todo-item");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk dog")).toBeInTheDocument();
  });

  it("displays error state", async () => {
    const error = { _tag: "UnknownError", message: "Failed to fetch" };
    vi.spyOn(UseTodos, "useTodos").mockReturnValue({
      toEffect: () => Effect.fail(error as unknown as TodosGetAllError),
      isLoading: false,
      isRefetching: false,
    } as unknown as UseEffectQueryResult<Doc<"todos">[], TodosGetAllError>);

    render(<TodoList />);

    expect(await screen.findByText("Error")).toBeInTheDocument();
    expect(screen.getByText("UnknownError")).toBeInTheDocument();
  });
});
