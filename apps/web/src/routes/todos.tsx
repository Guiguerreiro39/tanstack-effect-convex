import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "@rjdellecese/confect/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import {
  CreateTodoArgs,
  CreateTodoResult,
  DeleteTodoArgs,
  DeleteTodoResult,
  ToggleTodoArgs,
  ToggleTodoResult,
} from "@tanstack-effect-convex/backend/convex/schemas/todos";
import { Effect } from "effect";
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

export const Route = createFileRoute("/todos")({
  component: TodosRoute,
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState("");

  const todosQuery = useSuspenseQuery(convexQuery(api.todos.getAll, {}));
  const todos = todosQuery.data;

  const createTodo = useMutation({
    mutation: api.todos.create,
    args: CreateTodoArgs,
    returns: CreateTodoResult,
  });

  const toggleTodo = useMutation({
    mutation: api.todos.toggle,
    args: ToggleTodoArgs,
    returns: ToggleTodoResult,
  });

  const removeTodo = useMutation({
    mutation: api.todos.deleteTodo,
    args: DeleteTodoArgs,
    returns: DeleteTodoResult,
  });

  const handleAddTodo = Effect.fn((e: React.FormEvent) =>
    Effect.gen(function* () {
      e.preventDefault();
      const text = newTodoText.trim();

      if (text) {
        setNewTodoText("");
        yield* createTodo({ text });
      }
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.error("Failed to add todo:", cause);
        setNewTodoText(newTodoText);

        return Effect.fail("Failed to add todo");
      })
    )
  );

  const handleToggleTodo = Effect.fn((id: Id<"todos">, completed: boolean) =>
    Effect.gen(function* () {
      yield* toggleTodo({ id, completed: !completed });
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.error("Failed to toggle todo:", cause);
        return Effect.fail("Failed to toggle todo");
      })
    )
  );

  const handleDeleteTodo = Effect.fn((id: Id<"todos">) =>
    Effect.gen(function* () {
      yield* removeTodo({ id });
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.error("Failed to delete todo:", cause);
        return Effect.fail("Failed to delete todo");
      })
    )
  );

  return (
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
            <Button disabled={!newTodoText.trim()} type="submit">
              Add
            </Button>
          </form>

          {todos?.length === 0 ? (
            <p className="py-4 text-center">No todos yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {todos?.map((todo) => (
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
  );
}
