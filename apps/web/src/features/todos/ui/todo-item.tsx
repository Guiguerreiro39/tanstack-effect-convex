import type { Todo } from "@tanstack-effect-convex/backend/contracts";
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

  const handleToggle = () => {
    toggleMutation.mutate({ id: todo._id, completed: !todo.completed });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: todo._id });
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
