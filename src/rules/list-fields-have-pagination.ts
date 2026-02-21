import { GraphQLSchema, isObjectType, isNonNullType, isListType, GraphQLObjectType } from 'graphql';
import { PolicyRule, Violation } from '../types.js';

export function listFieldsHavePagination(opts?: { severity?: 'error' | 'warn' }): PolicyRule {
  const severity = opts?.severity ?? 'warn';

  return {
    name: 'list-fields-have-pagination',
    description: 'Fields returning a List type should have pagination arguments (first/after or limit/offset)',
    severity,
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const typeMap = schema.getTypeMap();

      for (const [typeName, type] of Object.entries(typeMap)) {
        if (typeName.startsWith('__') || !isObjectType(type)) continue;

        const fields = (type as GraphQLObjectType).getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
          let fieldType = field.type;
          if (isNonNullType(fieldType)) {
            fieldType = fieldType.ofType;
          }

          if (!isListType(fieldType)) continue;

          const argNames = field.args.map(a => a.name);
          const hasCursorPagination = argNames.includes('first') && argNames.includes('after');
          const hasOffsetPagination = argNames.includes('limit') && argNames.includes('offset');

          if (!hasCursorPagination && !hasOffsetPagination) {
            violations.push({
              rule: 'list-fields-have-pagination',
              typeName,
              fieldName,
              message: `${typeName}.${fieldName} returns a list but has no pagination arguments (first/after or limit/offset)`,
              severity,
            });
          }
        }
      }

      return violations;
    },
  };
}
