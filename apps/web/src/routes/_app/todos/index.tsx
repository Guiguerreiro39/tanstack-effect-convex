import { createFileRoute } from "@tanstack/react-router";
import { TodoList } from "@/features/todos/ui/todo-list";

export const Route = createFileRoute("/_app/todos/")({
  component: TodosRoute,
});

function TodosRoute() {
  return <TodoList />;
}
