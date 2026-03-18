import { expect, test } from "vitest";
import { generateDataSchema } from "../../generator/schemas";
import { generateFunctionContract } from "../../generator/contracts";

test("generateDataSchema generates valid typescript code", () => {
  const code = generateDataSchema({
    name: "Todo",
    tableName: "todos",
    fields: [
      { name: "text", type: "v.string()", optional: false },
      { name: "completed", type: "v.boolean()", optional: true },
    ],
  });

  expect(code).toContain("export const TodoBase = Schema.Struct({");
  expect(code).toContain("text: Schema.String");
  // The V_OPTIONAL_REGEX conversion logic should still reside in generator/schemas.ts
  expect(code).toContain("completed: Schema.Boolean"); 
});

test("generateFunctionContract generates valid typescript code with ReturnTypeInfo", () => {
  const code = generateFunctionContract(
    {
      functionName: "create",
      modulePath: "todos/create",
      errors: [],
      returnTypeInfo: {
        isArray: false,
        isNull: false,
        tableName: "todos",
      },
    },
    1,
    [
      { name: "Todo", tableName: "todos", fields: [] }
    ]
  );

  expect(code).toContain("export type TodosCreateError = never;");
  expect(code).toContain('import { Todo } from "../../schemas/todo";');
  expect(code).toContain("const dataSchema = Todo;");
  expect(code).toContain("export const todosCreateDescriptor");
});
