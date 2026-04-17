import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useCreateTodo } from "../api/create";

export function AddTodoForm() {
  const [newTodoText, setNewTodoText] = useState("");
  const createMutation = useCreateTodo();

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodoText.trim();

    if (text) {
      setNewTodoText("");
      await createMutation.mutateAsync({ text });
    }
  };

  return (
    <form className="mb-6 flex items-center space-x-2" onSubmit={handleAddTodo}>
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
  );
}
