import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { queryAgent } from "../functions/query-agent/resource";

const schema = a.schema({
  queryAgent: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(
      a.handler.function(queryAgent)
    ),
  queryModel: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: "BedrockDataSource",
        entry: "./queryModel.js",
      })
    )  
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});