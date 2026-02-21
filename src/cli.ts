#!/usr/bin/env node

import { readFileSync } from 'fs';
import { buildSchema } from 'graphql';
import { createPolicyEngine } from './engine.js';
import {
  noStringIds,
  mutationsHaveResultType,
  listFieldsHavePagination,
  deprecatedFieldsHaveReason,
  noNullableIdFields,
} from './rules/index.js';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: graphql-policies <schema.graphql>');
  process.exit(1);
}

let sdl: string;
try {
  sdl = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`Error: Could not read file "${filePath}"`);
  process.exit(1);
}

let schema;
try {
  schema = buildSchema(sdl);
} catch (err) {
  console.error(`Error: Invalid GraphQL schema — ${(err as Error).message}`);
  process.exit(1);
}

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

if (result.violations.length === 0) {
  console.log('All policies passed.');
  process.exit(0);
}

for (const v of result.violations) {
  const location = [v.typeName, v.fieldName].filter(Boolean).join('.');
  const prefix = v.severity === 'error' ? 'ERROR' : 'WARN';
  console.log(`[${prefix}] ${v.rule}: ${v.message}${location ? ` (${location})` : ''}`);
}

console.log(`\n${result.errorCount} error(s), ${result.warnCount} warning(s)`);
process.exit(result.passed ? 0 : 1);
