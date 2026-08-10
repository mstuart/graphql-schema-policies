import {
  type GraphQLNamedType,
  type GraphQLObjectType,
  type GraphQLSchema,
  isNonNullType,
  isObjectType,
} from "graphql";
import type { PolicyRule, Violation } from "../types.js";

export function noStringIds(opts?: {
  severity?: "error" | "warn";
}): PolicyRule {
  const severity = opts?.severity ?? "error";

  return {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: GraphQL schema traversal follows the nested schema structure.
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const typeMap = schema.getTypeMap();

      for (const [typeName, type] of Object.entries(typeMap)) {
        if (typeName.startsWith("__") || !isObjectType(type)) {
          continue;
        }

        const fields = (type as GraphQLObjectType).getFields();
        for (const [fieldName, field] of Object.entries(fields)) {
          if (fieldName !== "id") {
            continue;
          }

          let innerType = field.type;
          if (isNonNullType(innerType)) {
            innerType = innerType.ofType;
          }

          const namedType = innerType as GraphQLNamedType;
          if ("name" in namedType && namedType.name === "String") {
            violations.push({
              fieldName,
              message: `${typeName}.id uses String instead of ID scalar`,
              rule: "no-string-ids",
              severity,
              typeName,
            });
          }
        }
      }

      return violations;
    },
    description: 'Fields named "id" must use the ID scalar, not String',
    name: "no-string-ids",
    severity,
  };
}
