import { Effect, Option } from "effect";
import { ConfectMutationCtx, ConfectQueryCtx } from "@/confect";
import { InvalidCtxError } from "@/schemas/errors";

export const getCtxWithQueries = Effect.gen(function* () {
  const queryCtx = yield* Effect.serviceOption(ConfectQueryCtx);
  const mutationCtx = yield* Effect.serviceOption(ConfectMutationCtx);

  let ctx: ConfectQueryCtx | ConfectMutationCtx | null = null;

  if (Option.isSome(queryCtx)) {
    ctx = queryCtx.value;
  } else if (Option.isSome(mutationCtx)) {
    ctx = mutationCtx.value;
  }

  if (!ctx) {
    return yield* Effect.fail(new InvalidCtxError());
  }

  return ctx;
});
