import { Node, type Project } from "ts-morph";
import type { ConvexFieldDef, TableSchemaDef } from "../types";

/**
 * Extracts table shape definitions from schema.ts.
 */
export function extractTableSchemas(
  project: Project,
  schemaFilePath: string
): TableSchemaDef[] {
  const sourceFile = project.getSourceFile(schemaFilePath) || project.addSourceFileAtPath(schemaFilePath);
  const results: TableSchemaDef[] = [];

  const schemaNameToTableName: Record<string, string> = {};

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) {
      return;
    }

    const expr = node.getExpression();
    if (!Node.isIdentifier(expr) || expr.getText() !== "defineSchema") {
      return;
    }

    const args = node.getArguments();
    if (args.length === 0) {
      return;
    }

    const schemaObj = args[0];
    if (!(schemaObj && Node.isObjectLiteralExpression(schemaObj))) {
      return;
    }

    for (const prop of schemaObj.getProperties()) {
      if (!Node.isPropertyAssignment(prop)) {
        continue;
      }

      const tableName = prop.getName();
      let value = prop.getInitializer();

      if (!value) {
        continue;
      }

      if (Node.isCallExpression(value)) {
        const callExpr = value.getExpression();
        if (Node.isPropertyAccessExpression(callExpr)) {
          const baseExpr = callExpr.getExpression();
          if (Node.isCallExpression(baseExpr)) {
            value = baseExpr;
          }
        }
      }

      if (Node.isCallExpression(value)) {
        const finalExpr = value.getExpression();
        if (
          Node.isIdentifier(finalExpr) &&
          finalExpr.getText() === "defineTable"
        ) {
          const tableArgs = value.getArguments();
          if (tableArgs.length > 0 && tableArgs[0]) {
            const firstArg = tableArgs[0];
            if (Node.isIdentifier(firstArg)) {
              const schemaName = firstArg.getText();
              schemaNameToTableName[schemaName] = tableName;
            }
          }
        }
      }
    }
  });

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
        results.push({
          name,
          tableName: schemaNameToTableName[name] ?? name.toLowerCase(),
          fields,
        });
      }
    }
  }

  return results;
}
