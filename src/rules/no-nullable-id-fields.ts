import { GraphQLSchema, isObjectType, isNonNullType, GraphQLObjectType } from 'graphql';
import { PolicyRule, Violation } from '../types.js';

export function noNullableIdFields(opts?: { severity?: 'error' | 'warn' }): PolicyRule {
  const severity = opts?.severity ?? 'error';

  return {
    name: 'no-nullable-id-fields',
    description: 'Fields named "id" should be non-nullable (ID! not ID)',
    severity,
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const typeMap = schema.getTypeMap();

      for (const [typeName, type] of Object.entries(typeMap)) {
        if (typeName.startsWith('__') || !isObjectType(type)) continue;

        const fields = (type as GraphQLObjectType).getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
          if (fieldName !== 'id') continue;

          if (!isNonNullType(field.type)) {
            violations.push({
              rule: 'no-nullable-id-fields',
              typeName,
              fieldName,
              message: `${typeName}.id is nullable — should be non-nullable (ID!)`,
              severity,
            });
          }
        }
      }

      return violations;
    },
  };
}
