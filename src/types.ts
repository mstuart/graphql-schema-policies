import type { GraphQLSchema } from "graphql";

export interface PolicyRule {
  check: (schema: GraphQLSchema) => Violation[];
  description: string;
  name: string;
  severity: "error" | "warn";
}

export interface Violation {
  fieldName?: string;
  message: string;
  rule: string;
  severity: "error" | "warn";
  typeName?: string;
}

export interface PolicyResult {
  errorCount: number;
  passed: boolean;
  violations: Violation[];
  warnCount: number;
}
