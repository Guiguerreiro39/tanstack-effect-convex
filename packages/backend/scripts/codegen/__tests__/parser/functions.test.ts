import { Project } from "ts-morph";
import { expect, test } from "vitest";
import { scanConvexFile } from "../../parser/functions";

test("scans convex files and extracts functions, error tags, and proper return type logic", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  const errorFields = {
    NotFoundError: [{ name: "id", type: "string", optional: false }],
  };

  project.createSourceFile(
    "convex/server.ts",
    `export function runWithEffect<A, E>(ctx: any, eff: import("effect").Effect<A, E, never>): any { return eff; }`
  );
  
  project.createSourceFile(
    "convex/values.ts",
    `export type Id<T extends string> = string & { __tableName: T };`
  );

  project.createSourceFile(
    "node_modules/effect/index.d.ts",
    `
    export declare namespace Effect {
      export interface Effect<A, E, R = never> {}
      export function succeed<A>(a: A): Effect<A, never, never>;
      export function fail<E>(e: E): Effect<never, E, never>;
    }
    `
  );

  project.createSourceFile(
    "schemas/errors.ts",
    `
    export class NotFoundError {
      readonly _tag = "NotFoundError";
      constructor(public data: { id: string }) {}
    }
    `
  );

  project.createSourceFile(
    "todos.ts",
    `
    import { runWithEffect } from "./convex/server";
    import { Effect } from "effect";
    import { NotFoundError } from "./schemas/errors";
    import type { Id } from "./convex/values";

    export const create = runWithEffect(
      {},
      Effect.succeed([{ _id: "123" as Id<"todos">, text: "hello" }])
    );

    export const get = runWithEffect(
      {},
      Effect.fail(new NotFoundError({ id: "123" }))
    );
  `
  );

  const result = scanConvexFile(project, "todos.ts", errorFields);

  expect(result).not.toBeNull();
  expect(result?.functions).toHaveLength(2);
  
  const createFn = result?.functions.find((f) => f.functionName === "create");
  expect(createFn).toBeDefined();
  expect(createFn?.errorTags).toEqual([]);
  expect(createFn?.returnTypeInfo).toEqual({
    isArray: true,
    isNull: false,
    tableName: "todos",
  });
  
  const getFn = result?.functions.find((f) => f.functionName === "get");
  expect(getFn).toBeDefined();
  expect(getFn?.errorTags).toEqual(["NotFoundError"]);
  // If effect fails, A is never
  expect(getFn?.returnTypeInfo.isNull).toBe(true);
});
