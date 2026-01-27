---
trigger: glob
globs: "apps/web/**/*.{ts,tsx}"
---

# React & TanStack Patterns

## 1. Routing (TanStack Start)

- **Defined in**: `apps/web/src/routes/`
- **Rule**: Use `loaderDeps` for search params; never access search directly in loaders.
- **Rule**: Use `beforeLoad` for auth/redirects. Throw `redirect({...})` for control flow.

## 2. Forms (TanStack Form + Effect)

- **Validation**: Use `Schema.standardSchemaV1` for `validators`.
- **Logic**: Favor `form.Field` components over manual state sync.
- **Submit**: Handle `onSubmit` using `useEffectMutation`.

## 3. Data Fetching (Effect Hooks)

- **Queries**: Use `useEffectQuery(api.path.to.query, args)`.
- **Mutations**: Use `useEffectMutation(api.path.to.mutation)`.
- **Handling**: Use `.toEffect()` and `matchEffect` for type-safe UI branching.

```tsx
const { data, toEffect } = useEffectQuery(api.todos.get, { id });

return matchEffect(toEffect(), {
  Pending: () => <Loader />,
  Failure: (err) => <ErrorView error={err} />,
  Success: (todos) => <TodoList items={todos} />,
});
```

## 4. UI (shadcn/ui + Tailwind)

- **Location**: `apps/web/src/components/ui/` for primitives, `components/` for common widgets.
- **Rule**: Use `cn()` helper for class merging.
- **Rule**: Never hardcode colors; use CSS variables (e.g., `text-primary`, `bg-background`).
- **Rule**: Keep UI components "dumb". Move logic to `features/` or `model/`.

## 5. State (Effect Atom)

- **Local**: Use `Atom.make(initialState)` for feature-scoped state.
- **Hooks**: Use `useAtomValue` (read) or `useSetAtom` (write) to avoid unnecessary re-renders.
- **Global**: Only for truly app-wide state (e.g., Auth, Theme).
