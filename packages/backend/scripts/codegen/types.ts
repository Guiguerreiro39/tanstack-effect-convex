export interface ErrorFieldDef {
  name: string;
  type: string;
  optional: boolean;
}

export interface ErrorDef {
  tag: string;
  fields: ErrorFieldDef[];
}

export interface ReturnTypeInfo {
  isArray: boolean;
  isNull: boolean;
  tableName: string | null;
}

export interface ScannedFunction {
  functionName: string;
  errorTags: string[];
  returnTypeInfo: ReturnTypeInfo;
}

export interface ScannedFile {
  functions: ScannedFunction[];
}

export interface ContractInput {
  functionName: string;
  modulePath: string;
  errors: ErrorDef[];
}

export interface ConvexFieldDef {
  name: string;
  type: string;
  optional: boolean;
}

export interface TableSchemaDef {
  name: string;
  tableName: string;
  fields: ConvexFieldDef[];
}
