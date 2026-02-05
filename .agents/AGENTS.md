# Project Essentials

**Stack**: Monorepo (Turborepo + pnpm) | Effect.ts | Convex | Tanstack Start

## Commands

- `pnpm run dev` — Start all
- `pnpm run dev:web` — Web only
- `pnpm run dev:server` — Backend only
- `pnpm run format` — Format code
- `pnpm dlx ultracite fix` — Lint fix

## Critical Rules

1. **Validation**: Effect Schema only (no Zod/Valibot)
2. **Errors**: Never `throw`; use `Effect.fail` with TaggedErrors
3. **Logging**: Use `Console` from Effect, not native `console`
4. **Docs**: Use `context7` MCP for documentation lookups

## Project Structure

- **Web**: `apps/web/` (Tanstack Start + shadcn/ui)
- **Backend**: `packages/backend/` (Convex + Effect)
- **Dev URL**: `http://localhost:3001`

## Related Rules

- **fsd.md** — Design patterns to follow
- **convex.md** — Backend & auth
- **react-tanstack.md** — React & forms
- **code-style.md** — Coding standards
- **solid.md** — SOLID principles

## Skills

- **brainstorming** — Use before creative work (features, components, behavior changes). Explores intent & requirements first.
- **writing-plans** — Use with specs/requirements before touching code. Creates bite-sized implementation plans.
- **executing-plans** — Use to execute written plans with batch execution & review checkpoints.
- **test-driven-development** — Use before implementing any feature/bugfix. Red-green-refactor cycle.
- **frontend-design** — Use for web components, pages, dashboards. Creates distinctive, production-grade UI.
- **web-design-guidelines** — Use for UI reviews, accessibility audits, UX checks against guidelines.
- **vercel-react-best-practices** — Use with all React code for performance patterns.

## Reference Locations

- Search `~/.local/share/effect` for Effect API usage
- Search `~/.local/share/effect-atom` for Effect-Atom patterns (React state with Effect)
- Project errors: `packages/backend/convex/schemas/errors.ts`

## Effect-ts

- Run `effect-solutions list` before implementing new Effect features
