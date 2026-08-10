import type { GraphQLSchema } from "graphql";
import type { PolicyResult, PolicyRule } from "./types.js";

export interface PolicyEngineOptions {
  rules: PolicyRule[];
}

export class PolicyEngine {
  private readonly rules: PolicyRule[];

  constructor(opts: PolicyEngineOptions) {
    this.rules = opts.rules;
  }

  check(schema: GraphQLSchema): PolicyResult {
    const violations = this.rules.flatMap((rule) => rule.check(schema));
    const errorCount = violations.filter((v) => v.severity === "error").length;
    const warnCount = violations.filter((v) => v.severity === "warn").length;

    return {
      errorCount,
      passed: errorCount === 0,
      violations,
      warnCount,
    };
  }
}

export function createPolicyEngine(opts: PolicyEngineOptions): PolicyEngine {
  return new PolicyEngine(opts);
}
