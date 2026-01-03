import { Effect } from "effect";
import { dbEffect } from "@/lib/db-effect";
import { Policies } from "@/lib/policies";
import {
  ConfectMutationCtx,
  ConfectQueryCtx,
  mutation,
  query,
} from "./confect";
import {
  CreateTodoArgs,
  CreateTodoResult,
  DeleteTodoArgs,
  DeleteTodoResult,
  GetAllTodosArgs,
  GetAllTodosResult,
  ToggleTodoArgs,
  ToggleTodoResult,
} from "./schemas/todos";

export const getAll = query({
  args: GetAllTodosArgs,
  returns: GetAllTodosResult,
  handler: () =>
    dbEffect(
      Effect.gen(function* () {
        const { db } = yield* ConfectQueryCtx;
        return yield* db.query("todos").collect();
      })
    ),
});

export const create = mutation({
  args: CreateTodoArgs,
  returns: CreateTodoResult,
  handler: ({ text }) =>
    dbEffect(
      Effect.gen(function* () {
        const { db } = yield* ConfectMutationCtx;
        yield* Policies.orFail(Policies.requireSignedIn);

        return yield* db.insert("todos", {
          text,
          completed: false,
        });
      })
    ),
});

export const toggle = mutation({
  args: ToggleTodoArgs,
  returns: ToggleTodoResult,
  handler: ({ id, completed }) =>
    dbEffect(
      Effect.gen(function* () {
        const { db } = yield* ConfectMutationCtx;
        yield* Policies.orFail(Policies.requireSignedIn);

        yield* db.patch(id, { completed });

        return null;
      })
    ),
});

export const deleteTodo = mutation({
  args: DeleteTodoArgs,
  returns: DeleteTodoResult,
  handler: ({ id }) =>
    dbEffect(
      Effect.gen(function* () {
        const { db } = yield* ConfectMutationCtx;
        yield* Policies.orFail(Policies.requireSignedIn);

        yield* db.delete(id);

        return null;
      })
    ),
});
