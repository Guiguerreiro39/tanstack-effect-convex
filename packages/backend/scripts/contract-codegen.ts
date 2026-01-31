// packages/backend/scripts/contract-codegen.ts
// biome-ignore lint/performance/noNamespaceImport: node:fs requires namespace
import * as fs from "node:fs";
// biome-ignore lint/performance/noNamespaceImport: node:path requires namespace
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Node, Project, type Type } from "ts-morph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ErrorFieldDef {
  name: string;
  type: string;
  optional: boolean;
}

interface ErrorDef {
  tag: string;
  fields: ErrorFieldDef[];
}

interface ScannedFunction {
  functionName: string;
  errorTags: string[];
}

interface ScannedFile {
  functions: ScannedFunction[];
}

interface ContractInput {
  functionName: string;
  modulePath: string;
  errors: ErrorDef[];
}

/**
 * Extracts all Error Tag definitions from the schema.
 */
function extractAllErrorFields(
  project: Project,
  errorsFilePath: string
): Record<string, ErrorFieldDef[]> {
  const sourceFile = project.addSourceFileAtPath(errorsFilePath);
  const result: Record<string, ErrorFieldDef[]> = {};

  const exported = sourceFile.getExportedDeclarations();
  for (const [name, decls] of exported) {
    for (const decl of decls) {
      if (Node.isClassDeclaration(decl)) {
        const fields: ErrorFieldDef[] = [];
        const extendsExpr = decl.getExtends();
        if (extendsExpr) {
          const typeArgs = extendsExpr.getTypeArguments();
          if (typeArgs.length > 0) {
            const firstArg = typeArgs[0];
            if (firstArg) {
              const type = firstArg.getType();
              const props = type.getProperties();
              for (const prop of props) {
                const propName = prop.getName();
                const propType = prop.getTypeAtLocation(decl).getText();

                let cleanType = propType;
                if (cleanType.endsWith(" | undefined")) {
                  cleanType = cleanType.replace(" | undefined", "");
                }
                fields.push({
                  name: propName,
                  type: cleanType,
                  optional: prop.isOptional(),
                });
              }
            }
          }
        }
        result[name] = fields;
      }
    }
  }
  return result;
}

// -----------------------------------------------------------------------------
// Type-based Scanner using ts-morph
// -----------------------------------------------------------------------------

const TS_EXT_REGEX = /\.ts$/;
const BACKSLASH_REGEX = /\\/g;

/**
 * Extracts error tags from an Effect error type union.
 * Handles: UnknownError, UnknownError | NotFoundError, never
 */
function extractErrorTagsFromType(
  type: Type,
  errorFields: Record<string, ErrorFieldDef[]>
): string[] {
  const typeText = type.getText();

  // Handle 'never' - no errors
  if (typeText === "never") {
    return [];
  }

  const tags: string[] = [];

  // Check if it's a union type
  if (type.isUnion()) {
    for (const unionMember of type.getUnionTypes()) {
      const memberTags = extractErrorTagsFromType(unionMember, errorFields);
      tags.push(...memberTags);
    }
  } else {
    // Single type - extract the symbol name
    const symbol = type.getSymbol() ?? type.getAliasSymbol();
    if (symbol) {
      const name = symbol.getName();
      // Only include known error types
      if (errorFields[name] !== undefined) {
        tags.push(name);
      }
    }
  }

  return [...new Set(tags)]; // Deduplicate
}

/**
 * Finds the ancestor variable declaration for a node.
 */
function findParentVariableDeclaration(node: Node): Node | null {
  let current: Node | null = node;
  while (current) {
    if (Node.isVariableDeclaration(current)) {
      return current;
    }
    current = current.getParent() ?? null;
  }
  return null;
}

/**
 * Scans a Convex file using TypeScript compiler to extract all exported functions
 * and their error types from runWithEffect calls.
 */
export function scanConvexFile(
  project: Project,
  filePath: string,
  errorFields: Record<string, ErrorFieldDef[]>
): ScannedFile | null {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    return null;
  }

  const content = sourceFile.getFullText();
  if (!content.includes("runWithEffect")) {
    return null;
  }

  // Map: functionName -> errorTags[]
  const functionErrors = new Map<string, string[]>();

  sourceFile.forEachDescendant((node) => {
    // Look for call expressions
    if (!Node.isCallExpression(node)) {
      return;
    }

    const expression = node.getExpression();
    if (!Node.isIdentifier(expression)) {
      return;
    }

    if (expression.getText() !== "runWithEffect") {
      return;
    }

    // Find the parent variable declaration to get the function name
    const varDecl = findParentVariableDeclaration(node);
    if (!(varDecl && Node.isVariableDeclaration(varDecl))) {
      return;
    }

    const functionName = varDecl.getName();

    // Get the second argument (the Effect)
    const args = node.getArguments();
    if (args.length < 2) {
      return;
    }

    const effectArg = args[1];
    if (!effectArg) {
      return;
    }

    const effectType = effectArg.getType();

    // Effect.Effect<A, E, R> - we need E (second type argument)
    const typeArgs = effectType.getTypeArguments();
    if (typeArgs.length >= 2) {
      const errorType = typeArgs[1];
      if (errorType) {
        const tags = extractErrorTagsFromType(errorType, errorFields);
        const existing = functionErrors.get(functionName) ?? [];
        functionErrors.set(functionName, [...existing, ...tags]);
      }
    }
  });

  if (functionErrors.size === 0) {
    return null;
  }

  const functions: ScannedFunction[] = [];
  for (const [functionName, errorTags] of functionErrors) {
    functions.push({ functionName, errorTags: [...new Set(errorTags)] });
  }

  return { functions };
}

// -----------------------------------------------------------------------------
// Generator
// -----------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Converts a module path like "todos/create" to PascalCase "TodosCreate"
 */
function moduleToPascalCase(modulePath: string): string {
  return modulePath
    .split("/")
    .map((part) => capitalize(part))
    .join("");
}

/**
 * Generates error contract code for a Convex function.
 */
export function generateErrorContract(input: ContractInput): string {
  const { modulePath, errors } = input;
  // Use full module path for unique type names (e.g., TodosCreateError)
  const pascalPrefix = moduleToPascalCase(modulePath);

  const lines: string[] = [
    "// AUTO-GENERATED by contract-codegen - DO NOT EDIT",
    "",
  ];

  if (errors.length > 0) {
    const errorTags = [...new Set(errors.map((e) => e.tag))].sort();
    lines.push(`import { ${errorTags.join(", ")} } from "../schemas/errors";`);
    lines.push("");
  }

  // Generate union type
  if (errors.length === 0) {
    lines.push(`export type ${pascalPrefix}Error = never;`);
  } else {
    lines.push(`export type ${pascalPrefix}Error =`);
    for (const err of errors) {
      lines.push(`  | ${err.tag}`);
    }
    lines[lines.length - 1] += ";";
  }

  lines.push("");

  // Generate allowedTags
  const tagsList = errors.map((e) => `"${e.tag}"`).join(", ");
  lines.push(`const allowedTags = [${tagsList}] as const;`);
  lines.push("");

  // Generate decode function
  lines.push("/**");
  lines.push(` * Decodes raw error data to typed ${pascalPrefix}Error.`);
  lines.push(" * Returns undefined if error tag not in allowed set.");
  lines.push(" */");
  lines.push(`export const decode${pascalPrefix}Error = (`);
  lines.push("  e: unknown");
  lines.push(`): ${pascalPrefix}Error | undefined => {`);
  lines.push(`  if (typeof e !== "object" || e === null || !("_tag" in e)) {`);
  lines.push("    return undefined;");
  lines.push("  }");

  if (errors.length === 0) {
    lines.push("  return undefined;");
  } else {
    lines.push("  const err = e as");
    for (const err of errors) {
      const prefix = "    |";
      if (err.fields.length === 0) {
        lines.push(`${prefix} { _tag: "${err.tag}" }`);
      } else {
        const fields = err.fields
          .map((f) => `${f.name}${f.optional ? "?" : ""}: ${f.type}`)
          .join("; ");
        lines.push(`${prefix} { _tag: "${err.tag}"; ${fields} }`);
      }
    }
    lines[lines.length - 1] += ";";
    lines.push("");

    lines.push("  switch (err._tag) {");
    for (const err of errors) {
      lines.push(`    case "${err.tag}":`);
      lines.push(`      return new ${err.tag}(err);`);
    }
    lines.push("    default:");
    lines.push("      return undefined;");
    lines.push("  }");
  }
  lines.push("};");
  lines.push("");

  // Generate assert function
  lines.push("/**");
  lines.push(` * Asserts error is valid ${pascalPrefix}Error.`);
  lines.push(" * Throws if undeclared error escapes.");
  lines.push(" */");
  lines.push(`export const assert${pascalPrefix}Error = (`);
  lines.push("  e: unknown");
  lines.push(`): asserts e is ${pascalPrefix}Error => {`);
  lines.push(`  if (!decode${pascalPrefix}Error(e)) {`);
  lines.push(`    throw new Error('Illegal error thrown by ${modulePath}');`);
  lines.push("  }");
  lines.push("};");
  lines.push("");

  // Generate descriptor - use camelCase of full path to avoid conflicts
  const camelDescriptorName =
    pascalPrefix.charAt(0).toLowerCase() + pascalPrefix.slice(1);
  lines.push("/**");
  lines.push(` * Error descriptor for ${modulePath}.`);
  lines.push(" * Pass to useEffectMutation/useEffectQuery for typed errors.");
  lines.push(" */");
  lines.push(`export const ${camelDescriptorName}Descriptor = {`);
  lines.push(`  path: "${modulePath}" as const,`);
  lines.push("  allowedTags,");
  lines.push(`  decode: decode${pascalPrefix}Error,`);
  lines.push("} as const;");
  lines.push("");

  return lines.join("\n");
}

// -----------------------------------------------------------------------------
// CLI Runner
// -----------------------------------------------------------------------------

/** Checks if file should be skipped */
function shouldSkipFile(name: string): boolean {
  if (!name.endsWith(".ts")) {
    return true;
  }
  if (name === "convex.config.ts") {
    return true;
  }
  if (name === "schema.ts") {
    return true;
  }
  if (name === "http.ts") {
    return true;
  }
  if (name.includes(".config.")) {
    return true;
  }
  return false;
}

/** Checks if directory should be skipped */
function shouldSkipDir(name: string): boolean {
  return name.startsWith("_") || name === "lib" || name === "schemas";
}

function findConvexFiles(
  dir: string,
  basePath = ""
): { path: string; modulePath: string }[] {
  const results: { path: string; modulePath: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue;
      }
      const subModulePath = basePath ? `${basePath}.${entry.name}` : entry.name;
      results.push(...findConvexFiles(fullPath, subModulePath));
      continue;
    }

    if (shouldSkipFile(entry.name)) {
      continue;
    }

    const moduleName = path.basename(entry.name, ".ts");
    const modulePath = basePath ? `${basePath}.${moduleName}` : moduleName;

    results.push({ path: fullPath, modulePath });
  }

  return results;
}

function main() {
  const convexDir = path.resolve(__dirname, "../convex");
  const errorsFile = path.join(convexDir, "schemas/errors.ts");
  const outputDir = path.join(convexDir, "lib/contracts");
  const tsconfigPath = path.join(convexDir, "tsconfig.json");

  console.log("Scanning Convex functions for error contracts...\n");
  console.log(
    "Using TypeScript compiler to extract error types from runWithEffect calls.\n"
  );

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: tsconfigPath,
    skipAddingFilesFromTsConfig: true,
  });

  // Extract all error definitions dynamically
  console.log("  Extracting error definitions...");
  const errorFields = extractAllErrorFields(project, errorsFile);
  console.log(`  Found ${Object.keys(errorFields).length} error types.\n`);

  // Add source files
  const files = findConvexFiles(convexDir);
  for (const { path: filePath } of files) {
    project.addSourceFileAtPath(filePath);
  }

  // Clean output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const generated: string[] = [];

  for (const { path: filePath, modulePath } of files) {
    const scanned = scanConvexFile(project, filePath, errorFields);

    if (!scanned) {
      continue;
    }

    // Process each function in the file
    for (const fn of scanned.functions) {
      // Build error definitions
      const errors: ErrorDef[] = fn.errorTags.map((tag: string) => ({
        tag,
        fields: errorFields[tag] ?? [],
      }));

      // modulePath is the file name (e.g., "todos")
      // Full path is {fileName}/{functionName} (e.g., "todos/create")
      const fullModulePath = `${modulePath}/${fn.functionName}`;

      const code = generateErrorContract({
        functionName: fn.functionName,
        modulePath: fullModulePath,
        errors,
      });

      // Create output path: contracts/{fileName}/{functionName}.ts
      const outDir = path.join(outputDir, modulePath);
      fs.mkdirSync(outDir, { recursive: true });

      const outFile = path.join(outDir, `${fn.functionName}.ts`);
      fs.writeFileSync(outFile, code);

      const relativeToConvex = path.relative(convexDir, outFile);
      const relativeToOutput = path.relative(outputDir, outFile);
      console.log(
        `  Generated: ${relativeToConvex} [${fn.errorTags.join(", ") || "no errors"}]`
      );
      generated.push(relativeToOutput);
    }
  }

  // Generate index file (barrel file intentional for generated contracts)
  const indexLines = [
    "// AUTO-GENERATED by contract-codegen - DO NOT EDIT",
    "",
  ];

  if (generated.length > 0) {
    indexLines.push(
      "// biome-ignore lint/performance/noBarrelFile: intentional for generated API"
    );
  }

  for (const file of generated) {
    const importPath = `./${file.replace(TS_EXT_REGEX, "").replace(BACKSLASH_REGEX, "/")}`;
    indexLines.push(`export * from "${importPath}";`);
  }
  indexLines.push("");

  fs.writeFileSync(path.join(outputDir, "index.ts"), indexLines.join("\n"));
  console.log("\n  Generated: lib/contracts/index.ts");

  console.log(`\nDone! Generated ${generated.length} error contracts.`);
}

main();
