import { GraphQLSchema } from 'graphql';
import { PolicyRule, PolicyResult } from './types.js';

export interface PolicyEngineOptions {
  rules: PolicyRule[];
}

export class PolicyEngine {
  private rules: PolicyRule[];

  constructor(opts: PolicyEngineOptions) {
    this.rules = opts.rules;
  }

  check(schema: GraphQLSchema): PolicyResult {
    const violations = this.rules.flatMap(rule => rule.check(schema));
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warnCount = violations.filter(v => v.severity === 'warn').length;

    return {
      passed: errorCount === 0,
      violations,
      errorCount,
      warnCount,
    };
  }
}

export function createPolicyEngine(opts: PolicyEngineOptions): PolicyEngine {
  return new PolicyEngine(opts);
}
