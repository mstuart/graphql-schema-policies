import {
  type GraphQLObjectType,
  type GraphQLSchema,
  isObjectType,
} from "graphql";
import type { PolicyRule, Violation } from "../types.js";

export function deprecatedFieldsHaveReason(opts?: {
  severity?: "error" | "warn";
}): PolicyRule {
  const severity = opts?.severity ?? "warn";

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
          if (
            !field.deprecationReason &&
            field.deprecationReason !== undefined
          ) {
            // deprecationReason is set but empty string or null
            violations.push({
              fieldName,
              message: `${typeName}.${fieldName} is deprecated but has no reason`,
              rule: "deprecated-fields-have-reason",
              severity,
              typeName,
            });
          }

          // Also check via astNode for more precise detection
          if (field.astNode) {
            const deprecatedDirective = field.astNode.directives?.find(
              (d) => d.name.value === "deprecated"
            );
            if (deprecatedDirective) {
              const reasonArg = deprecatedDirective.arguments?.find(
                (a) => a.name.value === "reason"
              );
              if (
                !reasonArg ||
                ("value" in reasonArg.value &&
                  !(reasonArg.value as { value: string }).value.trim())
              ) {
                // Avoid duplicate if already caught above
                const alreadyReported = violations.some(
                  (v) => v.typeName === typeName && v.fieldName === fieldName
                );
                if (!alreadyReported) {
                  violations.push({
                    fieldName,
                    message: `${typeName}.${fieldName} is deprecated but has no reason`,
                    rule: "deprecated-fields-have-reason",
                    severity,
                    typeName,
                  });
                }
              }
            }
          }
        }
      }

      return violations;
    },
    description:
      "Fields with @deprecated directive must include a non-empty reason",
    name: "deprecated-fields-have-reason",
    severity,
  };
}
