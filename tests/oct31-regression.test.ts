import assert from "node:assert/strict";
import { it } from "node:test";
import {
  buildClientSchema,
  buildSchema,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  introspectionFromSchema,
} from "graphql";
import { deprecatedFieldsHaveReason } from "../dist/rules/deprecated-fields-have-reason.js";
import { mutationsHaveResultType } from "../dist/rules/mutations-have-result-type.js";

it("does not flag non-deprecated introspected fields", () => {
  const schema = buildClientSchema(
    introspectionFromSchema(buildSchema("type Query { hello: String }"))
  );
  assert.deepEqual(deprecatedFieldsHaveReason().check(schema), []);
});

it("flags whitespace-only programmatic deprecation reasons", () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      fields: { old: { deprecationReason: "   ", type: GraphQLString } },
      name: "Query",
    }),
  });
  assert.equal(deprecatedFieldsHaveReason().check(schema).length, 1);
});

it("reports the actual custom mutation root", () => {
  const schema = buildSchema(
    "schema { query: Query mutation: Commands } type Query { hello: String } type Commands { remove: Boolean }"
  );
  const [issue] = mutationsHaveResultType().check(schema);
  assert.equal(issue.typeName, "Commands");
  assert.ok(issue.message.includes("Commands.remove"));
});
