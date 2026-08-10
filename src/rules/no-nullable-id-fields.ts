import {
  type GraphQLObjectType,
  type GraphQLSchema,
  isNonNullType,
  isObjectType,
} from "graphql";
import type { PolicyRule, Violation } from "../types.js";

export function noNullableIdFields(opts?: {
  severity?: "error" | "warn";
}): PolicyRule {
  const severity = opts?.severity ?? "error";

  return {
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

          if (!isNonNullType(field.type)) {
            violations.push({
              fieldName,
              message: `${typeName}.id is nullable — should be non-nullable (ID!)`,
              rule: "no-nullable-id-fields",
              severity,
              typeName,
            });
          }
        }
      }

      return violations;
    },
    description: 'Fields named "id" should be non-nullable (ID! not ID)',
    name: "no-nullable-id-fields",
    severity,
  };
}
