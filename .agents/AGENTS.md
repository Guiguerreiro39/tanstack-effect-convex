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

- [effect.md](file:///.agent/rules/effect.md) — Effect patterns
- [fsd.md](file:///.agent/rules/fsd.md) — Design patterns to follow
- [convex.md](file:///.agent/rules/convex.md) — Backend & auth
- [react-tanstack.md](file:///.agent/rules/react-tanstack.md) — React & forms
- [code-style.md](file:///.agent/rules/code-style.md) — Coding standards

## Skills

- [brainstorming](file:///.agent/skills/brainstorm/SKILL.md) — Use before creative work (features, components, behavior changes). Explores intent & requirements first.
- [writing-plans](file:///.agent/skills/writing-plans/SKILL.md) — Use with specs/requirements before touching code. Creates bite-sized implementation plans.
- [executing-plans](file:///.agent/skills/executing-plan/SKILL.md) — Use to execute written plans with batch execution & review checkpoints.
- [test-driven-development](file:///.agent/skills/test-driven-development/SKILL.md) — Use before implementing any feature/bugfix. Red-green-refactor cycle.
- [frontend-design](file:///.agent/skills/frontend-design/SKILL.md) — Use for web components, pages, dashboards. Creates distinctive, production-grade UI.
- [web-design-guidelines](file:///.agent/skills/web-design-guidelines/SKILL.md) — Use for UI reviews, accessibility audits, UX checks against guidelines.
- [vercel-react-best-practices](file:///.agent/skills/vercel-react-best-practices/SKILL.md) — Use with all React code for performance patterns.

## Reference Locations

- Search `~/.local/share/effect` for Effect API usage
- Search `~/.local/share/effect-atom` for Effect-Atom patterns (React state with Effect)
