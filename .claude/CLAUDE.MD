---
trigger: glob
globs: **/*.{ts,tsx,js,jsx,json,jsonc,html,vue,svelte,astro,css,yaml,yml,graphql,gql,md,mdx,grit}
---

# Project Rules

This is a typescript project that uses tanstack start, convex and effect.

## Project Structure

This is a monorepo with the following structure:

- **`apps/web/`** - Tanstack start frontend application

- **`packages/backend/`** - Convex backend functions with confect to seamingly integrate convex with effect.

## Available Scripts

- `pnpm run dev` - Start all apps in development mode
- `pnpm run dev:web` - Start only the web app
- `pnpm run dev:server` - Start only the backend
- `pnpm run format` - Format documents

## Authentication

Authentication is enabled in this project. Use convex authentication functions in the frontend and policies inside `packages/backend/convex/lib/policies.ts` for the backend.

## Forms, validation and types

- Avoid using anything other than **Effect Schema** for validation and typing.
- This project uses tanstack forms. When dealing with forms, use `Schema.standardSchemaV1` before defining the main form schema for compability.

## Key Points

- This is a Turborepo monorepo using pnpm workspaces
- Each app has its own `package.json` and dependencies
- Run commands from the root to execute across all workspaces
- Run workspace-specific commands with `pnpm run command-name`
- Turborepo handles build caching and parallel execution
- Use pnpm instead of npm for commands

## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Topics include: services and layers, data modeling, error handling, configuration, testing, HTTP clients, CLIs, observability, and project structure.

**Effect Source Reference:** `~/.local/share/effect`
Search here to explore APIs, find usage examples, and understand implementation details when the documentation isn't enough.

## Documentation

- Use context7 mcp for up to date documentation.

## Testing

- Use playwright mcp for testing the UI.

## Frontend

- Use shadcn/ui for UI components
- Use TailwindCSS for styling
- Use Effect Atom for global state management

## Backend

- Use Convex for the database
- Use Better-auth with convex for authentication
