import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { queryAgent } from "../functions/query-agent/resource";

const schema = a.schema({
  Message: a.model({
    id: a.id().required(),
    message: a.string(),
    type: a.string(),
    user: a.string().required(),
    sentAt: a.timestamp().required(),
  })
  .identifier(['user','id'])
  .authorization(allow => [allow.owner()]),
  queryAgent: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(
      a.handler.function(queryAgent)
    ),
  queryModel: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
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
    defaultAuthorizationMode: "userPool"
  },
});