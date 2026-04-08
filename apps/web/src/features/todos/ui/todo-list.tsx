import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tanstack-effect-convex/ui/components/card";
import { matchEffect } from "@/shared/lib/effect/match-effect";
import { useTodos } from "../api/get-all";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";

export function TodoList() {
  const todosQuery = useTodos();

  return matchEffect(todosQuery, {
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
            <AddTodoForm />
            {todos.length === 0 ? (
              <p className="py-4 text-center">No todos yet. Add one above!</p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <TodoItem key={todo._id} todo={todo} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    ),
  });
}
