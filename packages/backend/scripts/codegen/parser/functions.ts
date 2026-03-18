import { Node, type Project, type Type } from "ts-morph";
import type { ErrorFieldDef, ReturnTypeInfo, ScannedFile, ScannedFunction } from "../types";

/**
 * Extracts error tags from an Effect error type union.
 */
export function extractErrorTagsFromType(
  type: Type,
  errorFields: Record<string, ErrorFieldDef[]>
): string[] {
  const typeText = type.getText();

  if (typeText === "never") {
    return [];
  }

  const tags: string[] = [];

  if (type.isUnion()) {
    for (const unionMember of type.getUnionTypes()) {
      const memberTags = extractErrorTagsFromType(unionMember, errorFields);
      tags.push(...memberTags);
    }
  } else {
    const symbol = type.getSymbol() ?? type.getAliasSymbol();
    if (symbol) {
      const name = symbol.getName();
      if (errorFields[name] !== undefined) {
        tags.push(name);
      }
    }
  }

  return [...new Set(tags)];
}

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

function parseReturnType(node: Node, type: Type): ReturnTypeInfo {
  const info: ReturnTypeInfo = {
    isArray: false,
    isNull: false,
    tableName: null,
  };

  const typeText = type.getText();
  if (type.isNull() || typeText === "void" || typeText === "null" || type.isNever()) {
    info.isNull = true;
    return info;
  }

  let innerType = type;
  if (type.isArray()) {
    info.isArray = true;
    const elemType = type.getArrayElementType();
    if (elemType) {
      innerType = elemType;
    }
  }

  const idProp = innerType.getProperty("_id");
  if (idProp) {
    const idType = idProp.getTypeAtLocation(node);
    if (idType) {
      const idText = idType.getText();
      const match = /Id<["']([^"']+)["']>/.exec(idText);
      if (match) {
        info.tableName = match[1];
      }
    }
  }

  return info;
}

/**
 * Scans a Convex file using TypeScript compiler to extract exported functions
 * and their error types from runWithEffect calls.
 */
export function scanConvexFile(
  project: Project,
  filePath: string,
  errorFields: Record<string, ErrorFieldDef[]>
): ScannedFile | null {
  const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);

  const content = sourceFile.getFullText();
  if (!content.includes("runWithEffect")) {
    return null;
  }

  const functionErrors = new Map<
    string,
    { errorTags: string[]; returnTypeInfo: ReturnTypeInfo }
  >();

  sourceFile.forEachDescendant((node) => {
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

    const varDecl = findParentVariableDeclaration(node);
    if (!(varDecl && Node.isVariableDeclaration(varDecl))) {
      return;
    }

    const functionName = varDecl.getName();

    const args = node.getArguments();
    if (args.length < 2) {
      return;
    }

    const effectArg = args[1];
    if (!effectArg) {
      return;
    }

    const effectType = effectArg.getType();
    const typeArgs = effectType.getTypeArguments();
    
    let returnTypeInfo: ReturnTypeInfo = { isArray: false, isNull: true, tableName: null };

    if (typeArgs.length >= 1) {
      const successType = typeArgs[0];
      if (successType) {
        returnTypeInfo = parseReturnType(node, successType);
      }
    }

    if (typeArgs.length >= 2) {
      const errorType = typeArgs[1];
      if (errorType) {
        const tags = extractErrorTagsFromType(errorType, errorFields);
        const existing = functionErrors.get(functionName) ?? {
          errorTags: [],
          returnTypeInfo,
        };
        functionErrors.set(functionName, {
          errorTags: [...existing.errorTags, ...tags],
          returnTypeInfo: existing.returnTypeInfo,
        });
      }
    }
  });

  if (functionErrors.size === 0) {
    return null;
  }

  const functions: ScannedFunction[] = [];
  for (const [functionName, data] of functionErrors) {
    functions.push({
      functionName,
      errorTags: [...new Set(data.errorTags)],
      returnTypeInfo: data.returnTypeInfo,
    });
  }

  return { functions };
}
