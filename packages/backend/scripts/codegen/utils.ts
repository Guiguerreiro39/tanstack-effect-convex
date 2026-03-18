export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Converts a module path like "todos/create" to PascalCase "TodosCreate"
 */
export function moduleToPascalCase(modulePath: string): string {
  return modulePath
    .split("/")
    .map((part) => capitalize(part))
    .join("");
}

/**
 * Converts PascalCase to kebab-case for file names.
 */
export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
