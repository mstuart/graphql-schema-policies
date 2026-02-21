import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchema } from 'graphql';
import { PolicyEngine, createPolicyEngine } from '../dist/engine.js';
import { noStringIds } from '../dist/rules/no-string-ids.js';
import { mutationsHaveResultType } from '../dist/rules/mutations-have-result-type.js';
import { noNullableIdFields } from '../dist/rules/no-nullable-id-fields.js';

describe('PolicyEngine', () => {
  it('aggregates violations from multiple rules', () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type User {
        id: String
        name: String
      }
    `);

    const engine = createPolicyEngine({
      rules: [noStringIds(), noNullableIdFields()],
    });

    const result = engine.check(schema);
    assert.equal(result.violations.length, 2);
    assert.equal(result.errorCount, 2);
    assert.equal(result.passed, false);
  });

  it('returns passed=true when no error-severity violations', () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type User {
        id: ID!
        name: String
      }
    `);

    const engine = createPolicyEngine({
      rules: [noStringIds(), noNullableIdFields()],
    });

    const result = engine.check(schema);
    assert.equal(result.violations.length, 0);
    assert.equal(result.passed, true);
  });

  it('passed is false when any error-severity violation exists', () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type Mutation {
        deleteUser: Boolean
      }
      type User {
        id: ID!
        name: String
      }
    `);

    const engine = new PolicyEngine({
      rules: [mutationsHaveResultType()],
    });

    const result = engine.check(schema);
    assert.equal(result.passed, false);
    assert.ok(result.errorCount > 0);
  });

  it('passed is true when only warn-severity violations exist', () => {
    const schema = buildSchema(`
      type Query {
        users: [User]
      }
      type User {
        id: ID!
        name: String
      }
    `);

    const engine = createPolicyEngine({
      rules: [
        {
          name: 'test-warn',
          description: 'always warns',
          severity: 'warn',
          check: () => [{
            rule: 'test-warn',
            message: 'just a warning',
            severity: 'warn' as const,
          }],
        },
      ],
    });

    const result = engine.check(schema);
    assert.equal(result.passed, true);
    assert.equal(result.warnCount, 1);
    assert.equal(result.errorCount, 0);
  });
});
