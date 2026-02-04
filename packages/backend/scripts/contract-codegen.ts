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

// -----------------------------------------------------------------------------
// Convex -> Effect Schema Type Mapping
// -----------------------------------------------------------------------------

interface ConvexFieldDef {
  name: string;
  type: string; // e.g., "v.string()", "v.optional(v.string())"
  optional: boolean;
}

const CONVEX_TO_EFFECT_MAP: Record<string, string> = {
  "v.string()": "Schema.String",
  "v.boolean()": "Schema.Boolean",
  "v.number()": "Schema.Number",
  "v.int64()": "Schema.BigInt",
  "v.float64()": "Schema.Number",
  "v.bytes()": "Schema.Uint8ArrayFromSelf",
  "v.null()": "Schema.Null",
  "v.any()": "Schema.Unknown",
};

const V_OPTIONAL_REGEX = /^v\.optional\((.+)\)$/;
const V_ARRAY_REGEX = /^v\.array\((.+)\)$/;
const V_UNION_REGEX = /^v\.union\((.+)\)$/;
const V_ID_REGEX = /^v\.id\(["'](\w+)["']\)$/;
const V_LITERAL_REGEX = /^v\.literal\((.+)\)$/;

function parseUnionArgs(argsStr: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of argsStr) {
    if (char === "(" || char === "[" || char === "{") {
      depth++;
      current += char;
    } else if (char === ")" || char === "]" || char === "}") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      results.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    results.push(current.trim());
  }

  return results;
}

function convexTypeToEffectSchema(convexType: string): string {
  // Handle v.optional(...)
  const optionalMatch = convexType.match(V_OPTIONAL_REGEX);
  if (optionalMatch) {
    const inner = convexTypeToEffectSchema(optionalMatch[1]);
    return `Schema.optional(${inner})`;
  }

  // Handle v.array(...)
  const arrayMatch = convexType.match(V_ARRAY_REGEX);
  if (arrayMatch) {
    const inner = convexTypeToEffectSchema(arrayMatch[1]);
    return `Schema.Array(${inner})`;
  }

  // Handle v.union(...)
  const unionMatch = convexType.match(V_UNION_REGEX);
  if (unionMatch) {
    const innerTypes = parseUnionArgs(unionMatch[1]);
    const mapped = innerTypes.map(convexTypeToEffectSchema);
    return `Schema.Union(${mapped.join(", ")})`;
  }

  // Handle v.id("tableName")
  const idMatch = convexType.match(V_ID_REGEX);
  if (idMatch) {
    return "Schema.String"; // Foreign refs stay as plain string
  }

  // Handle v.literal(...)
  const literalMatch = convexType.match(V_LITERAL_REGEX);
  if (literalMatch) {
    return `Schema.Literal(${literalMatch[1]})`;
  }

  // Direct mapping
  return CONVEX_TO_EFFECT_MAP[convexType] ?? "Schema.Unknown";
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
// Table Schema Extraction
// -----------------------------------------------------------------------------

interface TableSchemaDef {
  name: string;
  fields: ConvexFieldDef[];
}

/**
 * Extracts table shape definitions from schema.ts.
 * Looks for exported object literals like: export const Todo = { text: v.string(), ... }
 */
function extractTableSchemas(
  project: Project,
  schemaFilePath: string
): TableSchemaDef[] {
  const sourceFile = project.addSourceFileAtPath(schemaFilePath);
  const results: TableSchemaDef[] = [];

  const exported = sourceFile.getExportedDeclarations();
  for (const [name, decls] of exported) {
    if (name === "default" || name.endsWith("Schema")) {
      continue;
    }

    for (const decl of decls) {
      if (!Node.isVariableDeclaration(decl)) {
        continue;
      }

      const initializer = decl.getInitializer();
      if (!(initializer && Node.isObjectLiteralExpression(initializer))) {
        continue;
      }

      const fields: ConvexFieldDef[] = [];
      for (const prop of initializer.getProperties()) {
        if (!Node.isPropertyAssignment(prop)) {
          continue;
        }

        const propName = prop.getName();
        const valueTxt = prop.getInitializer()?.getText() ?? "v.any()";
        const optional = valueTxt.startsWith("v.optional");

        fields.push({
          name: propName,
          type: valueTxt,
          optional,
        });
      }

      if (fields.length > 0) {
        results.push({ name, fields });
      }
    }
  }

  return results;
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
 * Converts PascalCase to kebab-case for file names.
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Generates Effect.Schema code for a table definition.
 * Creates both a base schema (for input validation) and full schema (with system fields).
 */
function generateDataSchema(table: TableSchemaDef): string {
  const lines: string[] = [
    "// AUTO-GENERATED by contract-codegen - DO NOT EDIT",
    "",
    'import { Schema } from "effect";',
    "",
  ];

  // Generate branded ID type
  const idName = `${table.name}Id`;
  lines.push(
    `export const ${idName} = Schema.String.pipe(Schema.brand("${idName}"));`
  );
  lines.push(`export type ${idName} = typeof ${idName}.Type;`);
  lines.push("");

  // Generate base schema (without system fields)
  lines.push(`export const ${table.name}Base = Schema.Struct({`);
  for (const field of table.fields) {
    const effectType = convexTypeToEffectSchema(field.type);
    lines.push(`  ${field.name}: ${effectType},`);
  }
  lines.push("});");
  lines.push("");

  // Generate full schema (with system fields)
  lines.push(`export const ${table.name} = Schema.Struct({`);
  lines.push(`  _id: ${idName},`);
  lines.push("  _creationTime: Schema.Number,");
  for (const field of table.fields) {
    const effectType = convexTypeToEffectSchema(field.type);
    lines.push(`  ${field.name}: ${effectType},`);
  }
  lines.push("});");
  lines.push("");

  // Type exports
  lines.push(`export type ${table.name}Base = typeof ${table.name}Base.Type;`);
  lines.push(`export type ${table.name} = typeof ${table.name}.Type;`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Generates error contract code for a Convex function.
 * @param depth - How many directories deep from contracts/errors/ (e.g., "todos/create" = 1)
 */
export function generateErrorContract(
  input: ContractInput,
  depth: number
): string {
  const { modulePath, errors } = input;
  // Use full module path for unique type names (e.g., TodosCreateError)
  const pascalPrefix = moduleToPascalCase(modulePath);

  // Calculate relative path prefix: from errors/{depth}/ to contracts/
  // depth=1 means we're at errors/todos/fn.ts, so we need "../.." to get to contracts/
  const upDirs = "../".repeat(depth + 1); // +1 for "errors" dir
  const typesImport = `${upDirs}types`;
  const errorsImport = `${upDirs}../convex/schemas/errors`;

  const lines: string[] = [
    "// AUTO-GENERATED by contract-codegen - DO NOT EDIT",
    "",
  ];

  // Import ErrorDescriptor type for descriptor typing
  lines.push(`import type { ErrorDescriptor } from "${typesImport}";`);

  if (errors.length > 0) {
    const errorTags = [...new Set(errors.map((e) => e.tag))].sort();
    lines.push(`import { ${errorTags.join(", ")} } from "${errorsImport}";`);
  }
  lines.push("");

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
  lines.push(
    `export const ${camelDescriptorName}Descriptor: ErrorDescriptor<${pascalPrefix}Error> = {`
  );
  lines.push(`  path: "${modulePath}",`);
  lines.push("  allowedTags,");
  lines.push(`  decode: decode${pascalPrefix}Error,`);
  lines.push("};");
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
  return (
    name.startsWith("_") ||
    name === "lib" ||
    name === "schemas" ||
    name === "contracts"
  );
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
  const convexDir = path.resolve(__dirname, "../src/convex");
  const errorsFile = path.join(convexDir, "schemas/errors.ts");
  const schemaFile = path.join(convexDir, "schema.ts");
  const contractsDir = path.join(__dirname, "../src/contracts");
  const errorsOutputDir = path.join(contractsDir, "errors");
  const schemasOutputDir = path.join(contractsDir, "schemas");
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

  // Clean and recreate errors directory
  if (fs.existsSync(errorsOutputDir)) {
    fs.rmSync(errorsOutputDir, { recursive: true });
  }
  fs.mkdirSync(errorsOutputDir, { recursive: true });

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

      // Calculate depth: number of path segments in modulePath
      // e.g., "todos" = 1, "todos.subfolder" = 2
      const depth = modulePath.split(".").length;

      const code = generateErrorContract(
        {
          functionName: fn.functionName,
          modulePath: fullModulePath,
          errors,
        },
        depth
      );

      // Create output path: contracts/errors/{fileName}/{functionName}.ts
      const outDir = path.join(errorsOutputDir, modulePath);
      fs.mkdirSync(outDir, { recursive: true });

      const kebabFnName = toKebabCase(fn.functionName);
      const outFile = path.join(outDir, `${kebabFnName}.ts`);
      fs.writeFileSync(outFile, code);

      const relativeToOutput = path.relative(errorsOutputDir, outFile);
      console.log(
        `  Generated: errors/${relativeToOutput} [${fn.errorTags.join(", ") || "no errors"}]`
      );
      generated.push(relativeToOutput);
    }
  }

  // -------------------------------------------------------------------------
  // Generate data schemas
  // -------------------------------------------------------------------------
  console.log("\nGenerating data schemas from schema.ts...\n");

  const schemas = extractTableSchemas(project, schemaFile);

  // Clean and recreate schemas directory
  if (fs.existsSync(schemasOutputDir)) {
    fs.rmSync(schemasOutputDir, { recursive: true });
  }
  fs.mkdirSync(schemasOutputDir, { recursive: true });

  const generatedSchemas: string[] = [];

  for (const table of schemas) {
    const code = generateDataSchema(table);
    const fileName = `${toKebabCase(table.name)}.ts`;
    const outFile = path.join(schemasOutputDir, fileName);

    fs.writeFileSync(outFile, code);
    console.log(`  Generated: schemas/${fileName}`);
    generatedSchemas.push(fileName);
  }

  // -------------------------------------------------------------------------
  // Generate main contracts/index.ts (no intermediate barrel files)
  // -------------------------------------------------------------------------
  const mainIndexLines = [
    "// AUTO-GENERATED by contract-codegen - DO NOT EDIT",
    "// biome-ignore-all lint/performance/noBarrelFile: intentional for generated API",
    'export * from "./types";',
  ];

  // Add error contract exports
  for (const file of generated) {
    const importPath = `./errors/${file.replace(TS_EXT_REGEX, "").replace(BACKSLASH_REGEX, "/")}`;
    mainIndexLines.push(`export * from "${importPath}";`);
  }

  // Add schema exports
  for (const file of generatedSchemas) {
    const importPath = `./schemas/${file.replace(TS_EXT_REGEX, "")}`;
    mainIndexLines.push(`export * from "${importPath}";`);
  }

  mainIndexLines.push("");

  fs.writeFileSync(
    path.join(contractsDir, "index.ts"),
    mainIndexLines.join("\n")
  );
  console.log("\nGenerated: contracts/index.ts");

  console.log(
    `\nDone! Generated ${generated.length} error contracts and ${generatedSchemas.length} data schemas.`
  );
}

main();
