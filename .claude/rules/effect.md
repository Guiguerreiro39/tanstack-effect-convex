## Errors

- Check the TaggedErrors in /packages/backend/convex/schemas/errors.ts for the possible errors.
- Never throw inside an effect, always Effect.fail with the appropriate error.
- When using Convex, always check for errors and handle them gracefully.
