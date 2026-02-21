import { GraphQLSchema, GraphQLObjectType, isObjectType, isNonNullType, GraphQLNamedType } from 'graphql';
import { PolicyRule, Violation } from '../types.js';

export function noStringIds(opts?: { severity?: 'error' | 'warn' }): PolicyRule {
  const severity = opts?.severity ?? 'error';

  return {
    name: 'no-string-ids',
    description: 'Fields named "id" must use the ID scalar, not String',
    severity,
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const typeMap = schema.getTypeMap();

      for (const [typeName, type] of Object.entries(typeMap)) {
        if (typeName.startsWith('__') || !isObjectType(type)) continue;

        const fields = (type as GraphQLObjectType).getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
          if (fieldName !== 'id') continue;

          let innerType = field.type;
          if (isNonNullType(innerType)) {
            innerType = innerType.ofType;
          }

          const namedType = innerType as GraphQLNamedType;
          if ('name' in namedType && namedType.name === 'String') {
            violations.push({
              rule: 'no-string-ids',
              typeName,
              fieldName,
              message: `${typeName}.id uses String instead of ID scalar`,
              severity,
            });
          }
        }
      }

      return violations;
    },
  };
}
