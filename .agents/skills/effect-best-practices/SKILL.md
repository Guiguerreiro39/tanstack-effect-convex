---
name: effect-best-practices
description: Use when you are implementing features using Effect.ts
---

# Effect.ts Patterns

## Core Principles

### Effect Type Signature

```typescript
Effect<Success, Error, Requirements>;
//     ┬       ┬      ┬
//     │       │      └─ Services/context needed (R)
//     │       └─────── Error type (E)
//     └─────────────── Success value type (A)
```

### Never Use `throw`

Always use `Effect.fail` with TaggedErrors. Native exceptions become "defects" (unrecoverable).

```typescript
// ❌ Bad
throw new Error("User not found");

// ✅ Good
Effect.fail(new UserNotFoundError({ userId }));
```

TaggedErrors should be defined using `Data.TaggedError`:

```typescript
import { Data } from "effect";

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  resourceId: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}
```

## Generator Syntax (Effect.gen)

Prefer `Effect.gen` with generator functions for imperative-style code:

```typescript
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const user = yield* getUser(userId);
  const profile = yield* getProfile(user.profileId);
  return { user, profile };
});
```

**Key Rules:**

- Use `yield*` (not `yield`) to unwrap Effects
- The function must be a generator (`function*`)
- Return value becomes the Effect's success value

## Error Handling

### Tagged Errors Pattern

```typescript
import { Data, Effect } from "effect";

class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause: unknown;
}> {}

// Catch specific error types
const program = Effect.gen(function* () {
  const user = yield* getUser(userId);
}).pipe(
  Effect.catchTag(
    "UserNotFoundError",
    (error) => Effect.succeed(null), // Recover from specific error
  ),
);

// Catch multiple error types
Effect.catchTags(effect, {
  UserNotFoundError: (e) => Effect.succeed(null),
  DatabaseError: (e) => Effect.fail(new ServiceError({ cause: e })),
});
```

### Error Mapping

```typescript
// Map error to a different type
Effect.mapError(effect, (error) => new WrapperError({ cause: error }));

// Convert all errors to defects (unrecoverable)
Effect.orDie(effect);

// Provide fallback value
Effect.orElseSucceed(effect, () => defaultValue);
```

## Logging

Use `Console` from Effect instead of native `console`:

```typescript
import { Console, Effect } from "effect";

Effect.gen(function* () {
  yield* Console.log("Processing user:", userId);
  yield* Console.warn("Deprecated method called");
  yield* Console.error("Failed to process");
});
```

## Services and Dependency Injection

### Defining Services with Context.Tag

```typescript
import { Context, Effect, Layer } from "effect";

// Method 1: Using Context.Tag
class UserService extends Context.Tag("UserService")<
  UserService,
  {
    readonly findById: (id: string) => Effect.Effect<User, NotFoundError>;
    readonly create: (
      data: CreateUserInput,
    ) => Effect.Effect<User, ValidationError>;
  }
>() {}

// Method 2: Using Effect.Service (recommended for complex services)
class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    const findById = (id: string) =>
      Effect.gen(function* () {
        const user = yield* db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (!user) return yield* Effect.fail(new NotFoundError({ id }));
        return user;
      });

    return { findById } as const;
  }),
}) {}
```

### Creating Layers

```typescript
import { Layer } from "effect";

// Simple value layer
const ConfigLive = Layer.succeed(Config, { apiUrl: "https://api.example.com" });

// Layer from effect
const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const db = yield* Database;
    return {
      findById: (id) => db.find("users", id),
    };
  }),
);

// Scoped layer (with resource cleanup)
const ConnectionLive = Layer.scoped(
  Connection,
  Effect.acquireRelease(
    Effect.promise(() => createConnection()),
    (conn) => Effect.sync(() => conn.close()),
  ),
);

// Compose layers
const AppLive = Layer.mergeAll(
  ConfigLive,
  UserServiceLive.pipe(Layer.provide(DatabaseLive)),
);
```

## Schema Validation

Use `Schema` from Effect for validation (not Zod):

```typescript
import { Schema } from "effect";

// Define schemas
const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String.pipe(Schema.nonEmptyString()),
  age: Schema.Number.pipe(Schema.int(), Schema.positive()),
  role: Schema.Literal("admin", "user"),
});

type User = Schema.Schema.Type<typeof User>;

// Decode unknown data
const parseUser = Schema.decodeUnknown(User);
const result = parseUser(data); // Either<User, ParseError>

// In Effect context
Effect.gen(function* () {
  const user = yield* Schema.decode(User)(rawData);
});

// Transform schemas
const UserFromJSON = Schema.transform(Schema.String, User, {
  decode: (s) => JSON.parse(s),
  encode: (u) => JSON.stringify(u),
});
```

## Common Patterns

### Running Effects

```typescript
// Synchronous (throws on failure)
Effect.runSync(effect);

// Promise-based
await Effect.runPromise(effect);

// Get Exit (never throws)
const exit = Effect.runSyncExit(effect);
const exit = await Effect.runPromiseExit(effect);
```

### Effect Constructors

```typescript
// Success
Effect.succeed(value);

// Failure
Effect.fail(new MyError());

// From sync function (catches exceptions as defects)
Effect.sync(() => computeValue());

// From sync that might throw
Effect.try({
  try: () => JSON.parse(str),
  catch: (error) => new ParseError({ cause: error }),
});

// From promise
Effect.promise(() => fetch(url));

// From async with error handling
Effect.tryPromise({
  try: () => fetch(url),
  catch: (error) => new NetworkError({ cause: error }),
});
```

### Combining Effects

```typescript
// Sequential (tuple result)
const [a, b] = yield * Effect.all([effectA, effectB]);

// Sequential (struct result)
const { user, profile } =
  yield *
  Effect.all({
    user: getUser(id),
    profile: getProfile(id),
  });

// Parallel execution
Effect.all([effectA, effectB], { concurrency: "unbounded" });

// First success wins
Effect.race([effect1, effect2]);

// Continue despite failures
Effect.all(effects, { mode: "either" }); // Returns Either[]
```

### Transformations

```typescript
// Map success value
Effect.map(effect, (a) => a * 2);

// Chain effects (flatMap)
Effect.flatMap(effect, (a) => getNextEffect(a));

// Tap (side effect without changing value)
Effect.tap(effect, (a) => Console.log("Got:", a));

// Provide context
effect.pipe(Effect.provideService(MyService, implementation));
```

### Resource Management

```typescript
// Bracket pattern
Effect.acquireUseRelease(
  Effect.sync(() => openFile(path)), // Acquire
  (file) => Effect.sync(() => readFile(file)), // Use
  (file) => Effect.sync(() => closeFile(file)), // Release (always runs)
);

// Scoped resources
Effect.scoped(
  Effect.gen(function* () {
    const file = yield* Effect.acquireRelease(openFile(path), (f) =>
      closeFile(f),
    );
    return yield* readFile(file);
  }),
);
```

### Retries

```typescript
import { Schedule } from "effect";

// Simple retry
Effect.retry(effect, Schedule.recurs(3));

// Exponential backoff
Effect.retry(
  effect,
  Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(5))),
);

// Retry only specific errors
Effect.retry(effect, {
  schedule: Schedule.recurs(3),
  while: (error) => error._tag === "NetworkError",
});
```

### Timeouts

```typescript
import { Duration } from "effect";

// Add timeout
Effect.timeout(effect, "5 seconds");

// With fallback on timeout
Effect.timeoutTo(effect, {
  duration: "5 seconds",
  onTimeout: Effect.succeed(defaultValue),
});
```

## Testing with Effect

```typescript
import { it } from "@effect/vitest";

// Effect-aware tests
it.effect("should create user", () =>
  Effect.gen(function* () {
    const result = yield* createUser(input);
    expect(result.id).toBeDefined();
  }),
);

// With layer provision
it.effect("should work with services", () =>
  Effect.gen(function* () {
    const service = yield* MyService;
    const result = yield* service.doSomething();
    expect(result).toBe(expected);
  }).pipe(Effect.provide(TestLayer)),
);
```

## Anti-Patterns to Avoid

```typescript
// ❌ Using native console
console.log("debug");

// ✅ Use Effect Console
yield * Console.log("debug");

// ❌ Throwing errors
if (!user) throw new Error("User not found");

// ✅ Fail with tagged error
if (!user) return yield * Effect.fail(new UserNotFoundError({ id }));

// ❌ Using try/catch
try {
  await doSomething();
} catch (e) {
  handleError(e);
}

// ✅ Use Effect error handling
Effect.tryPromise({
  try: () => doSomething(),
  catch: (e) => new MyError({ cause: e }),
}).pipe(Effect.catchTag("MyError", handleError));

// ❌ Mixing async/await with Effect
async function bad() {
  const result = await Effect.runPromise(effect);
  return result;
}

// ✅ Stay in Effect land
const good = Effect.gen(function* () {
  const result = yield* effect;
  return result;
});

// ❌ Creating services inside effects
Effect.gen(function* () {
  const service = { method: () => Effect.succeed(1) }; // Bad
});

// ✅ Use Layers for services
const ServiceLive = Layer.succeed(Service, { method: () => Effect.succeed(1) });
```
