<div align="center">
  <img src="docs/assets/logo.svg" alt="graphql-schema-policies — Semantic GraphQL schema design policy enforcement for CI pipelines" width="720">
</div>

<p align="center"><strong>Semantic GraphQL schema design policy enforcement for CI pipelines</strong></p>

<p align="center">
  <a href="https://github.com/mstuart/graphql-schema-policies/actions/workflows/ci.yml"><img src="https://github.com/mstuart/graphql-schema-policies/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/graphql-schema-policies"><img src="https://img.shields.io/npm/v/graphql-schema-policies?label=npm" alt="npm"></a>
</p>

---
Semantic GraphQL schema design policy enforcement for CI pipelines. Goes beyond syntax linting to enforce design rules like "every mutation must return a result type" and "no String IDs."

## Problem

GraphQL linters check syntax and formatting, but they don't enforce **design policies** — the conventions your team agrees on to keep schemas consistent, safe, and evolvable. This library fills that gap.

## Install

```bash
npm install graphql-schema-policies graphql
```

## Quick Start

```typescript
import { buildSchema } from 'graphql';
import {
  createPolicyEngine,
  noStringIds,
  mutationsHaveResultType,
  listFieldsHavePagination,
  deprecatedFieldsHaveReason,
  noNullableIdFields,
} from 'graphql-schema-policies';

const schema = buildSchema(`
  type Query {
    users: [User]
  }
  type User {
    id: String
    name: String
  }
`);

const engine = createPolicyEngine({
  rules: [
    noStringIds(),
    mutationsHaveResultType(),
    listFieldsHavePagination(),
    deprecatedFieldsHaveReason(),
    noNullableIdFields(),
  ],
});

const result = engine.check(schema);

console.log(result.passed);      // false
console.log(result.errorCount);  // 2
console.log(result.violations);  // [{ rule: 'no-string-ids', ... }, ...]
```

## Built-in Rules

| Rule | Default Severity | Description |
|------|-----------------|-------------|
| `noStringIds()` | error | Fields named `id` must use the `ID` scalar, not `String` |
| `mutationsHaveResultType()` | error | Mutation fields must return a named object type, not a scalar |
| `listFieldsHavePagination()` | warn | List fields should have `first`/`after` or `limit`/`offset` args |
| `deprecatedFieldsHaveReason()` | warn | `@deprecated` fields must include a non-empty `reason` |
| `noNullableIdFields()` | error | Fields named `id` must be non-nullable (`ID!`) |

All rules accept an optional `{ severity: 'error' | 'warn' }` override:

```typescript
noStringIds({ severity: 'warn' })
```

## Custom Rules

```typescript
import { PolicyRule, Violation } from 'graphql-schema-policies';
import { GraphQLSchema, isObjectType } from 'graphql';

function noFieldNamedData(): PolicyRule {
  return {
    name: 'no-field-named-data',
    description: 'Fields should not be named "data"',
    severity: 'warn',
    check(schema: GraphQLSchema): Violation[] {
      const violations: Violation[] = [];
      const typeMap = schema.getTypeMap();

      for (const [typeName, type] of Object.entries(typeMap)) {
        if (typeName.startsWith('__') || !isObjectType(type)) continue;
        const fields = type.getFields();
        if (fields['data']) {
          violations.push({
            rule: 'no-field-named-data',
            typeName,
            fieldName: 'data',
            message: `${typeName}.data — avoid generic field name "data"`,
            severity: 'warn',
          });
        }
      }

      return violations;
    },
  };
}
```

## CLI Usage

```bash
npx graphql-policies schema.graphql
```

Exits with code 1 if any error-severity violations are found.

## CI Integration

```yaml
# GitHub Actions
- name: Check schema policies
  run: npx graphql-policies schema.graphql
```

```yaml
# GitLab CI
schema-policies:
  script:
    - npx graphql-policies schema.graphql
```

## API

### `createPolicyEngine(opts)`

Creates a new `PolicyEngine` instance.

- `opts.rules` — Array of `PolicyRule` objects to enforce

### `engine.check(schema)`

Runs all rules against the provided `GraphQLSchema` and returns a `PolicyResult`:

- `passed` — `true` if no error-severity violations
- `violations` — Array of `Violation` objects
- `errorCount` — Number of error-severity violations
- `warnCount` — Number of warn-severity violations

## License

MIT
