---
trigger: glob
globs: "**/*.{ts,tsx,js,jsx}"
---

# Code Style (Ultracite)

This project uses **Ultracite** (Biome preset) for formatting and linting.

## Commands

- `pnpm dlx ultracite fix` — Auto-fix issues
- `pnpm dlx ultracite check` — Check for issues

## Project-Specific Rules

These override Ultracite defaults:

- **No `throw`** — Use `Effect.fail` (see [effect.md](file:///.agent/rules/effect.md))
- **No barrel files** — Import directly from files
- **No `console.*`** — Use `Console` from Effect

## React & JSX

- Use semantic HTML and ARIA attributes
- Use `key` prop with unique IDs (not array indices)
- Don't define components inside other components
- Don't use nested ternaries in JSX

## Security

- Add `rel="noopener"` with `target="_blank"`
- Avoid `dangerouslySetInnerHTML`

## Performance

- Avoid spread in loop accumulators
- Prefer specific imports over namespace imports
- Use Next.js `<Image>` over `<img>`

## JSDoc Comments

Use JSDoc (`/** */`) on all **exported** functions, types, and constants in shared lib files:

- `packages/backend/convex/lib/*`
- `apps/web/src/shared/*`

Include:

- Brief description
- `@example` for non-trivial usage
- `@param` / `@returns` when types aren't self-documenting
