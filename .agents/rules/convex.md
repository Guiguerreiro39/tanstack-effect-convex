---
trigger: glob
globs: "packages/backend/**/*.ts"
---

# Convex & Effect Patterns

## 1. Core Runtime

- **Public Functions**: Use `runWithEffect(ctx, effect)` for `query` and `mutation`.
- **Internal Functions**: Use `runInternalEffect(effect)` for `internalAction` or where no session context is needed.
- **Policies**: Every function **MUST** start by checking policies.

## 2. DB Operations (Effect Wrapper)

All Convex DB methods return promises. Wrap them using `Effect.tryPromise`:

```ts
yield *
  Effect.tryPromise({
    try: () => ctx.db.get(args.id),
    catch: (error) => new UnknownError({ error }),
  });
```

## 3. Best Practices

- **Validators**: **ALWAYS** define `args` using `v` validators. No raw types.
- **Performance**: Use `.withIndex()` instead of `.filter()`. Never use unbounded `.collect()`; use `.take(n)` or pagination.
- **Side Effects**: Only use `action` or `internalAction` for external API calls or scheduling.
- **Scheduled Tasks**: Use `internal.path.to.fn` for `ctx.scheduler` targets.

## 4. Error Handling

- **Never `throw`**: Use `yield* Effect.fail(new SpecificError())`.
- **Tagged Errors**: Define domain errors in `packages/backend/convex/schemas/errors.ts`.

## 5. Coding Standards

- **No `async/await`**: Use `Effect.gen` and `yield*`.
- **Atomic Reads**: In actions, use a single `internalQuery` instead of multiple `ctx.runQuery` calls to ensure consistency.
- **No `Date.now()`**: Avoid in queries to preserve caching. Use flags or scheduled updates.
