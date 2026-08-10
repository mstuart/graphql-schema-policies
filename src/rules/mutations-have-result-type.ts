import {
  type GraphQLSchema,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "graphql";
import type { PolicyRule, Violation } from "../types.js";

export function mutationsHaveResultType(opts?: {
  severity?: "error" | "warn";
}): PolicyRule {
  const severity = opts?.severity ?? "error";

  return {
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const mutationType = schema.getMutationType();

      if (!mutationType) {
        return violations;
      }

      const fields = mutationType.getFields();
      for (const [fieldName, field] of Object.entries(fields)) {
        let returnType = field.type;
        if (isNonNullType(returnType)) {
          returnType = returnType.ofType;
        }

        if (!isObjectType(returnType)) {
          const typeName = isScalarType(returnType)
            ? returnType.name
            : String(returnType);
          violations.push({
            fieldName,
            message: `Mutation.${fieldName} returns ${typeName} instead of an object type`,
            rule: "mutations-have-result-type",
            severity,
            typeName: "Mutation",
          });
        }
      }

      return violations;
    },
    description:
      "Every mutation field must return a named object type, not a scalar",
    name: "mutations-have-result-type",
    severity,
  };
}
