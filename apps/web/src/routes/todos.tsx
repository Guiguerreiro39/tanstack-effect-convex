import { createFileRoute } from "@tanstack/react-router";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCreateTodo } from "@/features/todos/api/create";
import { useDeleteTodo } from "@/features/todos/api/delete";
import { useTodos } from "@/features/todos/api/get-all";
import { useToggleTodo } from "@/features/todos/api/toggle";
import { matchEffect } from "@/shared/lib/hooks/match-effect";

export const Route = createFileRoute("/todos")({
  component: TodosRoute,
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState("");

  const todosQuery = useTodos();
  const createMutation = useCreateTodo();
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodoText.trim();

    if (text) {
      setNewTodoText("");
      await createMutation.mutateAsync({ text });
    }
  };

  const handleToggleTodo = async (id: Id<"todos">, completed: boolean) => {
    await toggleMutation.mutateAsync({ id, completed: !completed });
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    await deleteMutation.mutateAsync({ id });
  };

  return matchEffect(todosQuery.dataEffect, {
    onPending: () => (
      <div className="mx-auto w-full max-w-md py-10">Loading...</div>
    ),
    onFailure: (error) => (
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error._tag}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    ),
    onSuccess: (todos) => (
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Todo List (Convex)</CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="mb-6 flex items-center space-x-2"
              onSubmit={handleAddTodo}
            >
              <Input
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new task..."
                value={newTodoText}
              />
              <Button
                disabled={!newTodoText.trim() || createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </form>

            {todos.length === 0 ? (
              <p className="py-4 text-center">No todos yet. Add one above!</p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <li
                    className="flex items-center justify-between rounded-md border p-2"
                    key={todo._id}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={todo.completed}
                        id={`todo-${todo._id}`}
                        onCheckedChange={() =>
                          handleToggleTodo(todo._id, todo.completed)
                        }
                      />
                      <label
                        className={`${todo.completed ? "text-muted-foreground line-through" : ""}`}
                        htmlFor={`todo-${todo._id}`}
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      aria-label="Delete todo"
                      onClick={() => handleDeleteTodo(todo._id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    ),
  });
}
