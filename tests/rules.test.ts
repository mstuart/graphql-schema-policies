import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSchema } from "graphql";
import { deprecatedFieldsHaveReason } from "../dist/rules/deprecated-fields-have-reason.js";
import { listFieldsHavePagination } from "../dist/rules/list-fields-have-pagination.js";
import { mutationsHaveResultType } from "../dist/rules/mutations-have-result-type.js";
import { noNullableIdFields } from "../dist/rules/no-nullable-id-fields.js";
import { noStringIds } from "../dist/rules/no-string-ids.js";

describe("noStringIds", () => {
  it("catches String id fields", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User {
        id: String
        name: String
      }
    `);
    const rule = noStringIds();
    const violations = rule.check(schema);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].typeName, "User");
    assert.equal(violations[0].fieldName, "id");
    assert.ok(violations[0].message.includes("String"));
  });

  it("passes on ID! fields", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = noStringIds();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });

  it("catches String! id fields (non-null String)", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User {
        id: String!
        name: String
      }
    `);
    const rule = noStringIds();
    const violations = rule.check(schema);
    assert.equal(violations.length, 1);
  });

  it("respects severity option", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User { id: String }
    `);
    const rule = noStringIds({ severity: "warn" });
    const violations = rule.check(schema);
    assert.equal(violations[0].severity, "warn");
  });
});

describe("mutationsHaveResultType", () => {
  it("catches scalar return mutations", () => {
    const schema = buildSchema(`
      type Query { hello: String }
      type Mutation {
        deleteUser: Boolean
        updateName: String
      }
    `);
    const rule = mutationsHaveResultType();
    const violations = rule.check(schema);
    assert.equal(violations.length, 2);
    assert.ok(violations.every((v) => v.typeName === "Mutation"));
  });

  it("passes when mutations return object types", () => {
    const schema = buildSchema(`
      type Query { hello: String }
      type Mutation {
        createUser: CreateUserResult
      }
      type CreateUserResult {
        user: User
      }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = mutationsHaveResultType();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });

  it("returns empty when no mutation type exists", () => {
    const schema = buildSchema(`
      type Query { hello: String }
    `);
    const rule = mutationsHaveResultType();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });
});

describe("listFieldsHavePagination", () => {
  it("catches unannotated list fields", () => {
    const schema = buildSchema(`
      type Query {
        users: [User]
      }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = listFieldsHavePagination();
    const violations = rule.check(schema);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].typeName, "Query");
    assert.equal(violations[0].fieldName, "users");
  });

  it("passes with first/after pagination", () => {
    const schema = buildSchema(`
      type Query {
        users(first: Int, after: String): [User]
      }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = listFieldsHavePagination();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });

  it("passes with limit/offset pagination", () => {
    const schema = buildSchema(`
      type Query {
        users(limit: Int, offset: Int): [User]
      }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = listFieldsHavePagination();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });

  it("does not flag non-list fields", () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = listFieldsHavePagination();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });
});

describe("deprecatedFieldsHaveReason", () => {
  it("catches @deprecated without reason", () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type User {
        id: ID!
        name: String
        oldField: String @deprecated
      }
    `);
    const rule = deprecatedFieldsHaveReason();
    const violations = rule.check(schema);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].fieldName, "oldField");
  });

  it("passes when @deprecated has a reason", () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }
      type User {
        id: ID!
        name: String
        oldField: String @deprecated(reason: "Use newField instead")
      }
    `);
    const rule = deprecatedFieldsHaveReason();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });
});

describe("noNullableIdFields", () => {
  it("catches nullable id fields", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User {
        id: ID
        name: String
      }
    `);
    const rule = noNullableIdFields();
    const violations = rule.check(schema);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].typeName, "User");
    assert.ok(violations[0].message.includes("nullable"));
  });

  it("passes on non-nullable id fields", () => {
    const schema = buildSchema(`
      type Query { user: User }
      type User {
        id: ID!
        name: String
      }
    `);
    const rule = noNullableIdFields();
    const violations = rule.check(schema);
    assert.equal(violations.length, 0);
  });
});
