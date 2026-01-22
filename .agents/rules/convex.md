---
trigger: glob
globs: "packages/backend/**/*.ts"
---

# Convex Backend

## Structure

- Backend code: `packages/backend/`
- Auth policies: `packages/backend/convex/lib/policies.ts`
- Error schemas: `packages/backend/convex/schemas/errors.ts`
- Effect runtime: `packages/backend/convex/lib/runtime.ts`

## Auth

- **Frontend**: Use Convex Auth
- **Backend**: Update policies in `packages/backend/convex/lib/policies.ts`

---

## Effect Integration

Use `runWithEffect` for queries/mutations (provides `CurrentSession`):

```ts
export const get = query({
  args: { id: v.id("todos") },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        yield* Policies.orFail(Policies.requireSignedIn);
        return yield* Effect.tryPromise({
          try: () => ctx.db.get(args.id),
          catch: (error) => new UnknownError({ error }),
        });
      }),
    ),
});
```

Use `runInternalEffect` for internal functions (no session context):

```ts
export const syncData = internalAction({
  handler: (ctx, args) =>
    runInternalEffect(
      Effect.gen(function* () {
        // internal logic here
      }),
    ),
});
```

---

## Best Practices

### 1. Wrap Promises with `Effect.tryPromise`

All Convex db operations return promises. Wrap them properly:

```ts
// ❌ Floating promise, no error handling
ctx.db.patch(id, { status: "done" });

// ✅ Wrapped and yielded
yield *
  Effect.tryPromise({
    try: () => ctx.db.patch(id, { status: "done" }),
    catch: (error) => new UnknownError({ error }),
  });
```

### 2. Always Use Argument Validators

```ts
// ❌ No validation - clients can pass anything
export const update = mutation({
  handler: (ctx, { id, data }: { id: Id<"todos">; data: any }) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        /* ... */
      }),
    ),
});

// ✅ Validated - type-safe at runtime
export const update = mutation({
  args: {
    id: v.id("todos"),
    data: v.object({ text: v.string(), completed: v.boolean() }),
  },
  handler: (ctx, { id, data }) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        /* ... */
      }),
    ),
});
```

### 3. Always Use Access Control

Every public function must check authorization unless specified otherwise:

```ts
export const create = mutation({
  args: { text: v.string() },
  handler: (ctx, args) =>
    runWithEffect(
      ctx,
      Effect.gen(function* () {
        // ✅ Check auth before any operation
        yield* Policies.orFail(Policies.requireSignedIn);

        return yield* Effect.tryPromise({
          try: () =>
            ctx.db.insert("todos", { text: args.text, completed: false }),
          catch: (error) => new UnknownError({ error }),
        });
      }),
    ),
});
```

### 4. Use Indexes, Avoid `.filter()`

```ts
// ❌ Slow - scans all docs
yield *
  Effect.tryPromise({
    try: () =>
      ctx.db
        .query("todos")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect(),
    catch: (error) => new UnknownError({ error }),
  });

// ✅ Fast - uses index
yield *
  Effect.tryPromise({
    try: () =>
      ctx.db
        .query("todos")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    catch: (error) => new UnknownError({ error }),
  });
```

### 5. Limit `.collect()` Results

```ts
// ❌ Unbounded - loads all docs
yield *
  Effect.tryPromise({
    try: () => ctx.db.query("posts").collect(),
    catch: (error) => new UnknownError({ error }),
  });

// ✅ Bounded with limit
yield *
  Effect.tryPromise({
    try: () =>
      ctx.db.query("posts").withIndex("by_createdAt").order("desc").take(50),
    catch: (error) => new UnknownError({ error }),
  });
```

### 6. Use `internal` for Scheduled/Cron Functions

```ts
// ❌ Public function called from scheduler
yield *
  Effect.tryPromise({
    try: () => ctx.scheduler.runAfter(0, api.emails.send, { to: "..." }),
    catch: (error) => new UnknownError({ error }),
  });

// ✅ Internal function (can't be called externally)
yield *
  Effect.tryPromise({
    try: () => ctx.scheduler.runAfter(0, internal.emails.send, { to: "..." }),
    catch: (error) => new UnknownError({ error }),
  });
```

### 7. Don't Use `Date.now()` in Queries

```ts
// ❌ Breaks caching, can return stale results
yield *
  Effect.tryPromise({
    try: () =>
      ctx.db
        .query("posts")
        .withIndex("by_expiresAt", (q) => q.gt("expiresAt", Date.now()))
        .collect(),
    catch: (error) => new UnknownError({ error }),
  });

// ✅ Use scheduled function to set boolean flag
yield *
  Effect.tryPromise({
    try: () =>
      ctx.db
        .query("posts")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect(),
    catch: (error) => new UnknownError({ error }),
  });
```

### 8. Batch DB Operations in Actions

When using actions, combine related queries into single internal functions:

```ts
// ❌ Sequential calls - inconsistent data possible
export const sendReminder = internalAction({
  args: { teamId: v.id("teams") },
  handler: (ctx, { teamId }) =>
    runInternalEffect(
      Effect.gen(function* () {
        const team = yield* Effect.promise(() =>
          ctx.runQuery(internal.teams.get, { teamId }),
        );
        const owner = yield* Effect.promise(() =>
          ctx.runQuery(internal.users.get, { userId: team.ownerId }),
        );
      }),
    ),
});

// ✅ Single call - atomic read
export const sendReminder = internalAction({
  args: { teamId: v.id("teams") },
  handler: (ctx, { teamId }) =>
    runInternalEffect(
      Effect.gen(function* () {
        const { team, owner } = yield* Effect.promise(() =>
          ctx.runQuery(internal.teams.getWithOwner, { teamId }),
        );
      }),
    ),
});
```

---

## Common Errors to Avoid

| Error                             | Fix                                        |
| --------------------------------- | ------------------------------------------ |
| Floating promises                 | Wrap with `Effect.tryPromise` and `yield*` |
| Missing arg validators            | Add `args: {}` with `v.*` validators       |
| Using `.filter()` on large tables | Add index, use `.withIndex()`              |
| Unbounded `.collect()`            | Add `.take(N)` or use pagination           |
| `Date.now()` in queries           | Use scheduled fn to set flags              |
| Calling `api.*` from scheduler    | Use `internal.*` instead                   |
| Sequential `runQuery` in actions  | Combine into single query                  |
| No auth checks                    | Use `Policies.orFail()`                    |
| `throw` for errors                | Use `Effect.fail(new TaggedError())`       |
| Using `async/await` directly      | Use `Effect.gen` with `yield*`             |

---

## Function Types Reference

| Type               | Use For              | DB Access                  | Side Effects |
| ------------------ | -------------------- | -------------------------- | ------------ |
| `query`            | Read data            | ✅ Read                    | ❌           |
| `mutation`         | Write data           | ✅ Read/Write              | ❌           |
| `action`           | External APIs        | via `runQuery/runMutation` | ✅           |
| `internalQuery`    | Internal reads       | ✅ Read                    | ❌           |
| `internalMutation` | Internal writes      | ✅ Read/Write              | ❌           |
| `internalAction`   | Scheduled/cron tasks | via `runQuery/runMutation` | ✅           |
