---
trigger: glob
globs: "apps/web/**/*.{ts,tsx}"
---

# React & Tanstack

## Stack

- **UI**: shadcn/ui + Radix
- **State**: Effect Atom
- **Routing**: Tanstack Start
- **Forms**: Tanstack Form + Effect Schema

---

## Tanstack Start

### File-Based Routing

Routes live in `src/routes/`. File naming = URL structure:

- `index.tsx` → `/`
- `dashboard.tsx` → `/dashboard`
- `posts.$postId.tsx` → `/posts/:postId`
- `_authenticated/` → Layout route (no URL segment)
- `__root.tsx` → Root layout

### Route Definition Pattern

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  validateSearch: (search) => search as { tab?: string },
  beforeLoad: async ({ context, params }) => {
    // Auth checks, redirects, inject context
    if (!context.isAuthenticated) throw redirect({ to: "/login" });
  },
  loaderDeps: ({ search }) => ({ tab: search.tab }), // Declare search param deps
  loader: async ({ params, deps, context }) => {
    return fetchPost(params.postId, deps.tab);
  },
  pendingComponent: () => <Loader />,
  errorComponent: ({ error }) => <ErrorDisplay error={error} />,
  component: PostPage,
});
```

### Best Practices

1. **Use `beforeLoad` for auth/redirects** — runs before loader, can redirect or inject context
2. **Use `loaderDeps` for search params** — never access search directly in loader (breaks caching)
3. **Use `createRootRouteWithContext`** — type-safe context injection (queryClient, auth, etc.)
4. **Use `defaultPreload: "intent"`** — preload on hover for snappy navigation
5. **Set `pendingMs` wisely** — default 1s, adjust to avoid flash

### Mistakes to Avoid

- ❌ Direct `search` access in loader — use `loaderDeps` instead
- ❌ Throwing errors for control flow — use `redirect()` helper
- ❌ Heavy computations in `beforeLoad` — runs serially, blocks navigation
- ❌ Forgetting abort signals — pass `abortController.signal` to fetch calls

### Server Functions

```typescript
import { createServerFn } from "@tanstack/react-start";

// GET — for data fetching
const getData = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchData();
});

// POST — for mutations
const submitData = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as FormData)
  .handler(async ({ data }) => {
    return await saveData(data);
  });
```

---

## Tanstack Forms + Effect Schema

Wrap schemas in `Schema.standardSchemaV1` for Tanstack Forms:

```typescript
import { Schema } from "effect";
import { useForm } from "@tanstack/react-form";

const formSchema = Schema.standardSchemaV1(
  Schema.Struct({
    email: Schema.String.pipe(Schema.nonEmptyString()),
    amount: Schema.Number.pipe(Schema.positive()),
  }),
);

const form = useForm({
  defaultValues: { email: "", amount: 0 },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
    /* handle */
  },
});
```

### Form Pattern

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
>
  <form.Field name="email">
    {(field) => (
      <>
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
        />
        {field.state.meta.errors.map((err) => (
          <p className="text-destructive text-sm">{err?.message}</p>
        ))}
      </>
    )}
  </form.Field>

  <form.Subscribe>
    {(state) => (
      <Button disabled={!state.canSubmit || state.isSubmitting}>
        {state.isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    )}
  </form.Subscribe>
</form>
```

---

## Effect Atom (State Management)

Effect Atom = reactive state with Effect integration. Lighter than Jotai with Effect-native patterns.

### Basic Usage

```typescript
import { Atom } from "effect";

// Create atom
const countAtom = Atom.make(0);

// Read
const count = Atom.get(countAtom);

// Write
Atom.set(countAtom, 10);

// Update
Atom.update(countAtom, (n) => n + 1);

// Derived/computed atom
const doubleAtom = Atom.map(countAtom, (n) => n * 2);
```

### With React

```typescript
import { useAtom, useAtomValue, useSetAtom } from "effect/Atom";

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  // or readonly: useAtomValue(countAtom)
  // or write-only: useSetAtom(countAtom)

  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### Async Atoms

```typescript
const userAtom = Atom.async(
  Effect.gen(function* () {
    const response = yield* fetchUser();
    return response;
  }),
);
```

---

## shadcn/ui

### Installation

```bash
npx shadcn@latest add button card input
```

Components install to `src/components/ui/`. They are **copy-paste** — customize freely.

### Key Principles

1. **Composable primitives** — assemble complex UI from small pieces
2. **Variant-based styling** — use `class-variance-authority` for variants
3. **Accessible by default** — built on Radix UI primitives
4. **Themeable** — CSS variables in `:root` and `.dark`

### Component Pattern (CVA)

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### Theming (CSS Variables)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --destructive: 0 84.2% 60.2%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

Use: `bg-background`, `text-foreground`, `border-border`, etc.

### Best Practices

1. **Prefer semantic color vars** — `--primary`, `--destructive` over raw colors
2. **Use `cn()` helper** — merge classes safely with clsx + tailwind-merge
3. **Keep UI components dumb** — no business logic in `components/ui`
4. **Extend via composition** — wrap shadcn components, don't fork

### Mistakes to Avoid

- ❌ Modifying shadcn source directly without reason — makes updates hard
- ❌ Inline styles over CSS vars — breaks theming
- ❌ Complex logic in UI primitives — keep in feature components
- ❌ Ignoring accessibility props — Radix provides them, use them
