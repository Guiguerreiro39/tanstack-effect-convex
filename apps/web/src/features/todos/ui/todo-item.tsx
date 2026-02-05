import type { Todo } from "@tanstack-effect-convex/backend/src/contracts";
import type { Id } from "@tanstack-effect-convex/backend/src/convex/_generated/dataModel";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { useDeleteTodo } from "../api/delete";
import { useToggleTodo } from "../api/toggle";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  // Cast to Id since our validated type uses string but Convex mutations expect Id
  const todoId = todo._id as Id<"todos">;

  const handleToggle = () => {
    toggleMutation.mutate({ id: todoId, completed: !todo.completed });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: todoId });
  };

  return (
    <li className="flex items-center justify-between rounded-md border p-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={todo.completed}
          id={`todo-${todo._id}`}
          onCheckedChange={handleToggle}
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
        onClick={handleDelete}
        size="icon"
        variant="ghost"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
