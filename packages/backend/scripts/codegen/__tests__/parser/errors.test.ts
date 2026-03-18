import { Project } from "ts-morph";
import { expect, test } from "vitest";
import { extractAllErrorFields } from "../../parser/errors";

test("extracts error fields from AST using TaggedError without arguments", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(
    "errors.ts",
    `
    import { Data } from "effect";
    export class SimpleError extends Data.TaggedError("SimpleError") {}
  `
  );
  
  const result = extractAllErrorFields(project, "errors.ts");
  expect(result["SimpleError"]).toBeDefined();
  expect(result["SimpleError"]).toEqual([]);
});

test("extracts error fields from AST using TaggedError with arguments", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(
    "errors.ts",
    `
    import { Data } from "effect";
    export class NotFoundError extends Data.TaggedError("NotFoundError")<{
      readonly id: string;
      readonly optionalField?: number;
    }> {}
  `
  );
  
  const result = extractAllErrorFields(project, "errors.ts");
  expect(result["NotFoundError"]).toBeDefined();
  
  // Notice: 'readonly optionalField?' should show up as optional: true
  expect(result["NotFoundError"]).toEqual([
    { name: "id", type: "string", optional: false },
    { name: "optionalField", type: "number", optional: true }
  ]);
});

test("ignores non-class exports or non-TaggedError classes", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(
    "errors.ts",
    `
    export const SomeVar = 123;
    export class NormalClass {
      constructor(public id: string) {}
    }
  `
  );
  
  const result = extractAllErrorFields(project, "errors.ts");
  expect(result).toEqual({});
});
