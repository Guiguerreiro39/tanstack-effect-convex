import { expect, test } from "vitest";
import { moduleToPascalCase, toKebabCase } from "../utils";

test("moduleToPascalCase converts paths correctly", () => {
  expect(moduleToPascalCase("todos/create")).toBe("TodosCreate");
  expect(moduleToPascalCase("todos")).toBe("Todos");
  expect(moduleToPascalCase("users/auth/login")).toBe("UsersAuthLogin");
});

test("toKebabCase converts paths correctly", () => {
  expect(toKebabCase("TodosCreate")).toBe("todos-create");
  expect(toKebabCase("Todos")).toBe("todos");
  expect(toKebabCase("UsersAuthLogin")).toBe("users-auth-login");
});
