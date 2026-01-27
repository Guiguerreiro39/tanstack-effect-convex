---
trigger: glob
globs: "apps/web/src/**/*.{ts,tsx}"
---

# Feature-Sliced Design (FSD) Rules

## 1. Structure

- `routes/` (**Pages**): Entry points for TanStack Start. High-level layout and data loading.
- `features/` (**Features**): Business-value interactions (e.g., `features/todos/`). Contains `api/`, `ui/`, `model/`.
- `components/` (**Widgets**): Large, self-contained UI blocks (e.g., `Header`, `SignInForm`).
- `shared/` (**Shared**): Infrastructure, UI primitives (`components/ui`), and common libs.

## 2. Dependency Rules (CRITICAL)

- **Hierarchy**: `routes` -> `features` -> `shared`.
- **Imports**: Higher layers can import from lower layers. **Lower layers CANNOT import from higher layers**.
- **Cross-Slice**: Slices in the same layer (e.g., `features/auth` and `features/todos`) **CANNOT** import each other. Extract common logic to `shared` or an entity (if added later).

## 3. Segment Patterns

- `ui/`: React components.
- `api/`: Convex query/mutation hooks (`useEffectQuery`, `useEffectMutation`).
- `model/`: Validation schemas (Effect Schema), state (Effect Atom), and other business types.

## 4. Best Practices

- **No Barrel Files**: Export from specific files or using explicit `index.ts` only for public API.
- **Dumb UI**: Logic belongs in `api/` or `model/`. Components in `ui/` should only render state and call handlers.
- **Naming**: Use business domains for folders (`todos`, `auth`), not technical roles (`hooks`, `components`).

## 5. Violations to Avoid

- ❌ Importing from `routes/` into `features/`.
- ❌ `features/a` importing from `features/b`.
- ❌ Placing Convex queries directly in `routes/` components; move to `features/*/api/`.
