import assert from "node:assert/strict";
import { it } from "node:test";
import { buildSchema } from "graphql";
import { deprecatedFieldsHaveReason } from "../dist/rules/deprecated-fields-have-reason.js";
import { listFieldsHavePagination } from "../dist/rules/list-fields-have-pagination.js";
import { noNullableIdFields } from "../dist/rules/no-nullable-id-fields.js";
import { noStringIds } from "../dist/rules/no-string-ids.js";

it("checks interface fields with the same field policies as object fields", () => {
  const schema = buildSchema(`
    type Query { item: Item }
    interface Item {
      id: String
      children: [Item]
      old: String @deprecated(reason: "")
    }
  `);
  for (const rule of [
    noStringIds(),
    noNullableIdFields(),
    listFieldsHavePagination(),
    deprecatedFieldsHaveReason(),
  ]) {
    const violations = rule.check(schema);
    assert.equal(violations.length, 1, rule.name);
    assert.equal(violations[0].typeName, "Item");
  }
});
