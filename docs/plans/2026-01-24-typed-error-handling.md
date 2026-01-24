# Typed Error Handling Implementation Plan

> **For Agent:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Type-safe error handling from Convex backend through Tanstack Start server functions to React Query, preserving HTTP status codes and enabling Effect-based error handling in the frontend.

**Architecture:** Server functions wrap Convex calls, catching ConvexErrors and serializing them to typed `ApiResult<T>` responses. Frontend receives typed errors with `_tag` discriminant, which can be deserialized back to Effect errors. HTTP status codes are preserved via ConvexError's native handling.

**Tech Stack:** Effect.ts, Convex, Tanstack Start (server functions), React Query

---

## Task 1: Create Shared Error Types Package

**Files:**
- Create: `packages/backend/convex/schemas/serialized-errors.ts`

**Step 1: Define serialized error types**

```typescript
// packages/backend/convex/schemas/serialized-errors.ts
import type { Id, TableNames } from "@/_generated/dataModel";

/**
 * Serialized error format for network transport.
 * Preserves _tag for discriminated union matching.
 */
export type SerializedError =
  | { _tag: "NotFoundError"; docId?: Id<TableNames>; handle?: string }
  | { _tag: "ForbiddenError"; message?: string }
  | { _tag: "UnknownError"; message: string }
  | { _tag: "InvalidCtxError" }
  | { _tag: "GetUserIdentityError"; message: string };

/**
 * Maps error tags to HTTP status codes.
 */
export const ErrorStatusMap: Record<SerializedError["_tag"], number> = {
  NotFoundError: 404,
  ForbiddenError: 401,
  UnknownError: 500,
  InvalidCtxError: 500,
  GetUserIdentityError: 401,
};

/**
 * API result type for server function responses.
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: SerializedError };
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter @tanstack-effect-convex/backend`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/backend/convex/schemas/serialized-errors.ts
git commit -m "feat: add serialized error types for network transport"
```

---

## Task 2: Update Backend Runtime to Include Error Metadata in ConvexError

**Files:**
- Modify: `packages/backend/convex/lib/runtime.ts`

**Step 1: Update runWithEffect to include error metadata in ConvexError**

Replace the error catching section in `runWithEffect`:

```typescript
// packages/backend/convex/lib/runtime.ts
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect";

import type { DataModel } from "@/_generated/dataModel";
import { CurrentSession } from "@/lib/currentSession";
import type { ForbiddenError, NotFoundError } from "@/schemas/errors";
import { ErrorStatusMap, type SerializedError } from "@/schemas/serialized-errors";
import { parseCurrentConvexEnvironment } from "./constants";
import { fetchCurrentSession } from "./currentSession";

/**
 * Minimum log level based on environment.
 */
const MINIMUM_LOG_LEVEL = (() => {
  const environment = parseCurrentConvexEnvironment();

  if (environment === "test") {
    return LogLevel.None;
  }

  if (process.env.LOG_LEVEL === "DEBUG") {
    return LogLevel.Debug;
  }

  return LogLevel.Info;
})();

/**
 * Runtime for Convex queries and mutations.
 */
const RuntimeServer = (
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>
) =>
  ManagedRuntime.make(
    Layer.mergeAll(Layer.effect(CurrentSession, fetchCurrentSession(ctx)))
  );

/**
 * Serializes a tagged error to a ConvexError with metadata.
 */
const serializeToConvexError = (error: { _tag: string; [key: string]: unknown }) => {
  const tag = error._tag as SerializedError["_tag"];
  const status = ErrorStatusMap[tag] ?? 500;

  // Build serialized error based on tag
  let serialized: SerializedError;
  switch (tag) {
    case "NotFoundError":
      serialized = { _tag: tag, docId: error.docId as any, handle: error.handle as string | undefined };
      break;
    case "ForbiddenError":
      serialized = { _tag: tag, message: error.message as string | undefined };
      break;
    case "UnknownError":
      serialized = { _tag: tag, message: String(error.error ?? "Unknown error") };
      break;
    case "InvalidCtxError":
      serialized = { _tag: tag };
      break;
    case "GetUserIdentityError":
      serialized = { _tag: tag, message: String(error.error ?? "Auth error") };
      break;
    default:
      serialized = { _tag: "UnknownError", message: `Unhandled error: ${tag}` };
  }

  return new ConvexError({ status, error: serialized });
};

/**
 * Runs an Effect in a Convex query or mutation context.
 * Provides `CurrentSession` and converts tagged errors to ConvexErrors with metadata.
 *
 * @example
 * ```ts
 * export const get = query({
 *   args: { id: v.id("accounts") },
 *   handler: (ctx, args) =>
 *     runWithEffect(ctx, Effect.gen(function* () {
 *       const session = yield* Policies.orFail(Policies.requireSignedIn);
 *       return yield* getAccountById(ctx, args.id, session);
 *     })),
 * });
 * ```
 */
export const runWithEffect = <A, E extends { _tag: string }>(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  effect: Effect.Effect<A, E | ForbiddenError | NotFoundError, CurrentSession>
) =>
  RuntimeServer(ctx).runPromise(
    effect.pipe(
      Effect.catchAll((error) => Effect.die(serializeToConvexError(error))),
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );

/**
 * Runtime for internal queries and actions.
 */
const InternalRuntimeServer = ManagedRuntime.make(
  Layer.empty.pipe(Layer.merge(Logger.minimumLogLevel(MINIMUM_LOG_LEVEL)))
);

/**
 * Run an Effect in an internal query or action context.
 */
export const runInternalEffect = <A, E>(effect: Effect.Effect<A, E, never>) =>
  InternalRuntimeServer.runPromise(
    effect.pipe(
      Effect.tapError((error) => Effect.logError(error)),
      Logger.withMinimumLogLevel(MINIMUM_LOG_LEVEL)
    )
  );
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter @tanstack-effect-convex/backend`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/backend/convex/lib/runtime.ts
git commit -m "feat: include error metadata in ConvexError for serialization"
```

---

## Task 3: Create Server Function Error Handling Wrapper

**Files:**
- Create: `apps/web/src/shared/lib/server-fn/with-error-handling.ts`
- Create: `apps/web/src/shared/lib/server-fn/types.ts`

**Step 1: Create types file**

```typescript
// apps/web/src/shared/lib/server-fn/types.ts
import type { SerializedError } from "@tanstack-effect-convex/backend/convex/schemas/serialized-errors";

export type { SerializedError };

/**
 * API result type for server function responses.
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: SerializedError };

/**
 * Extract data type from ApiResult.
 */
export type ApiResultData<T> = T extends ApiResult<infer D> ? D : never;
```

**Step 2: Create error handling wrapper**

```typescript
// apps/web/src/shared/lib/server-fn/with-error-handling.ts
import { ConvexError } from "convex/values";
import type { ApiResult, SerializedError } from "./types";

/**
 * Extracts serialized error from a ConvexError.
 */
const extractConvexError = (error: unknown): { status: number; error: SerializedError } => {
  if (error instanceof ConvexError) {
    const data = error.data as { status?: number; error?: SerializedError };
    return {
      status: data.status ?? 500,
      error: data.error ?? { _tag: "UnknownError", message: error.message },
    };
  }

  return {
    status: 500,
    error: { _tag: "UnknownError", message: String(error) },
  };
};

/**
 * Wraps a handler function to catch ConvexErrors and return typed ApiResult.
 * Preserves HTTP status codes from ConvexError.
 *
 * @example
 * ```ts
 * const getPost = createServerFn({ method: "GET" })
 *   .validator((data) => data as { postId: string })
 *   .handler(
 *     withConvexErrorHandling(async ({ postId }) => {
 *       return await fetchQuery(api.posts.get, { id: postId });
 *     })
 *   );
 * ```
 */
export const withConvexErrorHandling = <Args, T>(
  handler: (args: Args) => Promise<T>
) => {
  return async (args: Args): Promise<ApiResult<T>> => {
    try {
      const data = await handler(args);
      return { success: true, data };
    } catch (error) {
      const { status, error: serializedError } = extractConvexError(error);
      return { success: false, status, error: serializedError };
    }
  };
};
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter web`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/shared/lib/server-fn/
git commit -m "feat: add server function error handling wrapper"
```

---

## Task 4: Create Frontend Error Deserializer

**Files:**
- Create: `apps/web/src/shared/lib/errors/deserialize.ts`
- Create: `apps/web/src/shared/lib/errors/types.ts`

**Step 1: Create frontend error types**

```typescript
// apps/web/src/shared/lib/errors/types.ts
import { Data } from "effect";

/**
 * Frontend error classes mirroring backend TaggedErrors.
 * These are reconstructed from serialized errors.
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  docId?: string;
  handle?: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message?: string;
}> {}

export class UnknownError extends Data.TaggedError("UnknownError")<{
  message: string;
}> {}

export class InvalidCtxError extends Data.TaggedError("InvalidCtxError")<{}> {}

export class GetUserIdentityError extends Data.TaggedError("GetUserIdentityError")<{
  message: string;
}> {}

/**
 * Union of all frontend error types.
 */
export type AppError =
  | NotFoundError
  | ForbiddenError
  | UnknownError
  | InvalidCtxError
  | GetUserIdentityError;
```

**Step 2: Create deserializer**

```typescript
// apps/web/src/shared/lib/errors/deserialize.ts
import type { SerializedError } from "@/shared/lib/server-fn/types";
import {
  type AppError,
  ForbiddenError,
  GetUserIdentityError,
  InvalidCtxError,
  NotFoundError,
  UnknownError,
} from "./types";

/**
 * Deserializes a serialized error back to an Effect TaggedError.
 * Use this to reconstruct Effect errors from API responses.
 *
 * @example
 * ```ts
 * const result = await getPost({ postId });
 * if (!result.success) {
 *   const error = deserializeError(result.error);
 *   // error is now a proper Effect TaggedError
 * }
 * ```
 */
export const deserializeError = (serialized: SerializedError): AppError => {
  switch (serialized._tag) {
    case "NotFoundError":
      return new NotFoundError({ docId: serialized.docId, handle: serialized.handle });
    case "ForbiddenError":
      return new ForbiddenError({ message: serialized.message });
    case "UnknownError":
      return new UnknownError({ message: serialized.message });
    case "InvalidCtxError":
      return new InvalidCtxError({});
    case "GetUserIdentityError":
      return new GetUserIdentityError({ message: serialized.message });
    default:
      return new UnknownError({ message: `Unknown error type: ${(serialized as any)._tag}` });
  }
};
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter web`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/shared/lib/errors/
git commit -m "feat: add frontend error deserializer for Effect errors"
```

---

## Task 5: Create Effect-Integrated React Query Hook

**Files:**
- Create: `apps/web/src/shared/lib/hooks/use-effect-query.ts`

**Step 1: Create the hook**

```typescript
// apps/web/src/shared/lib/hooks/use-effect-query.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { Effect } from "effect";
import type { ApiResult } from "@/shared/lib/server-fn/types";
import { deserializeError } from "@/shared/lib/errors/deserialize";
import type { AppError } from "@/shared/lib/errors/types";

/**
 * Options for useEffectQuery hook.
 */
type UseEffectQueryOptions<T> = Omit<
  UseQueryOptions<ApiResult<T>, Error, ApiResult<T>>,
  "queryFn"
> & {
  queryFn: () => Promise<ApiResult<T>>;
};

/**
 * Result type for useEffectQuery hook.
 */
type UseEffectQueryResult<T> = UseQueryResult<ApiResult<T>, Error> & {
  /**
   * Get the result as an Effect that fails with typed AppError.
   */
  toEffect: () => Effect.Effect<T, AppError>;
};

/**
 * React Query hook that integrates with Effect error handling.
 * Returns standard useQuery result plus a `toEffect()` method.
 *
 * @example
 * ```tsx
 * function PostComponent({ postId }: { postId: string }) {
 *   const query = useEffectQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => getPost({ postId }),
 *   });
 *
 *   // Option 1: Use React Query pattern
 *   if (query.data?.success) {
 *     return <Post post={query.data.data} />;
 *   }
 *
 *   // Option 2: Use Effect pattern
 *   const effect = query.toEffect().pipe(
 *     Effect.match({
 *       onFailure: (error) => <ErrorDisplay error={error} />,
 *       onSuccess: (post) => <Post post={post} />,
 *     })
 *   );
 * }
 * ```
 */
export function useEffectQuery<T>(
  options: UseEffectQueryOptions<T>
): UseEffectQueryResult<T> {
  const query = useQuery(options);

  const toEffect = (): Effect.Effect<T, AppError> => {
    return Effect.gen(function* () {
      if (query.isLoading || query.isPending) {
        // Return a never-resolving effect while loading
        return yield* Effect.never;
      }

      if (query.error) {
        return yield* Effect.fail(
          deserializeError({ _tag: "UnknownError", message: query.error.message })
        );
      }

      const result = query.data;
      if (!result) {
        return yield* Effect.fail(
          deserializeError({ _tag: "UnknownError", message: "No data" })
        );
      }

      if (!result.success) {
        return yield* Effect.fail(deserializeError(result.error));
      }

      return result.data;
    });
  };

  return {
    ...query,
    toEffect,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter web`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/shared/lib/hooks/use-effect-query.ts
git commit -m "feat: add useEffectQuery hook for Effect-integrated React Query"
```

---

## Task 6: Create Example Server Function and Update Todos Route

**Files:**
- Create: `apps/web/src/features/todos/api/get-all.ts`
- Modify: `apps/web/src/routes/todos.tsx`

**Step 1: Create server function for todos**

```typescript
// apps/web/src/features/todos/api/get-all.ts
import { createServerFn } from "@tanstack/react-start/server";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

/**
 * Server function to fetch all todos.
 * Wraps Convex query with typed error handling.
 */
export const getAllTodos = createServerFn({ method: "GET" }).handler(
  withConvexErrorHandling(async () => {
    return await fetchAuthQuery(api.todos.getAll);
  })
);
```

**Step 2: Update todos route to use server function**

```typescript
// apps/web/src/routes/todos.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
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
import { getAllTodos } from "@/features/todos/api/get-all";

export const Route = createFileRoute("/todos")({
  component: TodosRoute,
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState("");

  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: () => getAllTodos(),
  });

  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const removeTodo = useMutation(api.todos.deleteTodo);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodoText.trim();

    if (text) {
      setNewTodoText("");
      await createTodo({ text });
    }
  };

  const handleToggleTodo = async (id: Id<"todos">, completed: boolean) => {
    await toggleTodo({ id, completed: !completed });
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    await removeTodo({ id });
  };

  // Handle loading and error states
  if (todosQuery.isLoading) {
    return <div className="mx-auto w-full max-w-md py-10">Loading...</div>;
  }

  if (todosQuery.data && !todosQuery.data.success) {
    return (
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {todosQuery.data.error._tag}: {JSON.stringify(todosQuery.data.error)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const todos = todosQuery.data?.data ?? [];

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
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter web`
Expected: No errors

**Step 4: Test manually**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run dev`
Navigate to: `http://localhost:3001/todos`
Expected: Todos page loads, can add/toggle/delete todos

**Step 5: Commit**

```bash
git add apps/web/src/features/todos/api/get-all.ts apps/web/src/routes/todos.tsx
git commit -m "feat: migrate todos route to server function with typed errors"
```

---

## Task 7: Add Mutation Server Functions for Todos

**Files:**
- Create: `apps/web/src/features/todos/api/create.ts`
- Create: `apps/web/src/features/todos/api/toggle.ts`
- Create: `apps/web/src/features/todos/api/delete.ts`
- Modify: `apps/web/src/routes/todos.tsx`

**Step 1: Create mutation server functions**

```typescript
// apps/web/src/features/todos/api/create.ts
import { createServerFn } from "@tanstack/react-start/server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const createTodo = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { text: string })
  .handler(
    withConvexErrorHandling(async ({ text }) => {
      return await fetchAuthMutation(api.todos.create, { text });
    })
  );
```

```typescript
// apps/web/src/features/todos/api/toggle.ts
import { createServerFn } from "@tanstack/react-start/server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const toggleTodo = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: Id<"todos">; completed: boolean })
  .handler(
    withConvexErrorHandling(async ({ id, completed }) => {
      return await fetchAuthMutation(api.todos.toggle, { id, completed });
    })
  );
```

```typescript
// apps/web/src/features/todos/api/delete.ts
import { createServerFn } from "@tanstack/react-start/server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import type { Id } from "@tanstack-effect-convex/backend/convex/_generated/dataModel";
import { withConvexErrorHandling } from "@/shared/lib/server-fn/with-error-handling";

export const deleteTodo = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { id: Id<"todos"> })
  .handler(
    withConvexErrorHandling(async ({ id }) => {
      return await fetchAuthMutation(api.todos.deleteTodo, { id });
    })
  );
```

**Step 2: Update todos route to use mutation server functions**

Replace the mutation hooks in `apps/web/src/routes/todos.tsx`:

```typescript
// apps/web/src/routes/todos.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { createTodo } from "@/features/todos/api/create";
import { deleteTodo } from "@/features/todos/api/delete";
import { getAllTodos } from "@/features/todos/api/get-all";
import { toggleTodo } from "@/features/todos/api/toggle";

export const Route = createFileRoute("/todos")({
  component: TodosRoute,
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState("");
  const queryClient = useQueryClient();

  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: () => getAllTodos(),
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

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

  // Handle loading and error states
  if (todosQuery.isLoading) {
    return <div className="mx-auto w-full max-w-md py-10">Loading...</div>;
  }

  if (todosQuery.data && !todosQuery.data.success) {
    return (
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {todosQuery.data.error._tag}: {JSON.stringify(todosQuery.data.error)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const todos = todosQuery.data?.data ?? [];

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
            <Button disabled={!newTodoText.trim() || createMutation.isPending} type="submit">
              {createMutation.isPending ? "Adding..." : "Add"}
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
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run check-types --filter web`
Expected: No errors

**Step 4: Test manually**

Run: `cd /Users/guilhermeguerreiro/Documents/Git/tanstack-effect-convex && pnpm run dev`
Navigate to: `http://localhost:3001/todos`
Test: Add, toggle, delete todos
Expected: All operations work with typed errors

**Step 5: Commit**

```bash
git add apps/web/src/features/todos/api/ apps/web/src/routes/todos.tsx
git commit -m "feat: migrate todo mutations to server functions with typed errors"
```

---

## Summary

This plan implements:
1. **Serialized error types** shared between backend and frontend
2. **Backend runtime updates** to include error metadata in ConvexError
3. **Server function wrapper** that catches ConvexErrors and returns typed ApiResult
4. **Frontend error deserializer** to reconstruct Effect errors
5. **useEffectQuery hook** for Effect-integrated React Query
6. **Example migration** of todos route to new pattern

**Post-implementation:**
- All server functions return typed `ApiResult<T>`
- HTTP status codes preserved via ConvexError
- Frontend can use React Query pattern or Effect pattern
- Errors are fully typed from backend to frontend
