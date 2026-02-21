import { GraphQLSchema } from 'graphql';

export interface PolicyRule {
  name: string;
  description: string;
  severity: 'error' | 'warn';
  check(schema: GraphQLSchema): Violation[];
}

export interface Violation {
  rule: string;
  typeName?: string;
  fieldName?: string;
  message: string;
  severity: 'error' | 'warn';
}

export interface PolicyResult {
  passed: boolean;
  violations: Violation[];
  errorCount: number;
  warnCount: number;
}
