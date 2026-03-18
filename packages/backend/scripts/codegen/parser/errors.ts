import { Node, type Project } from "ts-morph";
import type { ErrorFieldDef } from "../types";

/**
 * Extracts all Error Tag definitions from a target file.
 */
export function extractAllErrorFields(
  project: Project,
  errorsFilePath: string
): Record<string, ErrorFieldDef[]> {
  const sourceFile = project.getSourceFile(errorsFilePath) || project.addSourceFileAtPath(errorsFilePath);
  const result: Record<string, ErrorFieldDef[]> = {};

  const exported = sourceFile.getExportedDeclarations();
  for (const [name, decls] of exported) {
    for (const decl of decls) {
      if (Node.isClassDeclaration(decl)) {
        const extendsExpr = decl.getExtends();
        // Check if class extends a TaggedError, it might not have type arguments 
        // but it will be an instantiation expression like `Data.TaggedError(...)`
        // We'll just assume if it has extends, it is what we need based on original script, 
        // but we can be more robust:
        if (!extendsExpr) {
          continue;
        }
        
        const expressionText = extendsExpr.getExpression().getText();
        if (!expressionText.includes("TaggedError")) {
          continue;
        }

        const fields: ErrorFieldDef[] = [];
        
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
        result[name] = fields;
      }
    }
  }
  return result;
}
