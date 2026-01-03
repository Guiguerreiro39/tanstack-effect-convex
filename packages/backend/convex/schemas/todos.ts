import { Id } from "@rjdellecese/confect/server";
import { Schema } from "effect";
import { Todo } from "@/schema";

export const DeleteTodoArgs = Schema.Struct({
  id: Id.Id("todos"),
});
export const DeleteTodoResult = Schema.Null;

export const ToggleTodoArgs = Schema.Struct({
  id: Id.Id("todos"),
  completed: Schema.Boolean,
});
export const ToggleTodoResult = Schema.Null;

export const CreateTodoArgs = Schema.Struct({
  text: Schema.String,
});
export const CreateTodoResult = Id.Id("todos");

export const GetAllTodosArgs = Schema.Struct({});
export const GetAllTodosResult = Schema.Array(Todo);
