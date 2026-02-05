---
trigger: glob
globs: "**/*.{ts,tsx}"
---

# SOLID Principles

Apply SOLID when designing modules, services, and components.

## S — Single Responsibility

- One reason to change per module/class/function
- Split large files by concern (e.g., `todos.queries.ts`, `todos.mutations.ts`)
- Convex: separate queries, mutations, actions into distinct files when complex

## O — Open/Closed

- Extend via composition, not modification
- Use Effect layers/services for swappable implementations
- Prefer config objects over hardcoded behavior

## L — Liskov Substitution

- Subtypes must honor parent contracts
- Effect: tagged errors must extend `Data.TaggedError` correctly
- React: wrapper components must accept all props of wrapped component

## I — Interface Segregation

- Small, focused interfaces > fat interfaces
- Split large schemas into composable pieces
- React: pass only needed props, not entire objects

## D — Dependency Inversion

- Depend on abstractions (Effect services, interfaces)
- Inject deps via Effect layers, not direct imports
- React: use context/hooks for shared deps, not prop drilling

## Project Patterns

| Concern        | Pattern                                       |
| -------------- | --------------------------------------------- |
| Backend logic  | Effect services + layers                      |
| Error handling | TaggedErrors in `schemas/errors.ts`           |
| Validation     | Effect Schema (single source of truth)        |
| React state    | Custom hooks extracting logic from components |
| API calls      | `useEffectQuery`/`useEffectMutation` hooks    |

## Quick Checks

Before committing, verify:

1. Can this module change for only one reason?
2. Can I extend behavior without modifying existing code?
3. Are dependencies injected, not hardcoded?
