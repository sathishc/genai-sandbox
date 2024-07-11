import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { queryAgent } from './functions/query-agent/resource';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";

export const backend = defineBackend({
  auth,
  data,
  queryAgent
});

const MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0";

const bedrockDataSource = backend.data.addHttpDataSource(
  "BedrockDataSource",
  "https://bedrock-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: Stack.of(backend.data).region,
      signingServiceName: "bedrock",
    },
  }
);

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:${Stack.of(backend.data).region}::foundation-model/${MODEL_ID}`,
    ],
  })
);

const queryAgentLambda = backend.queryAgent.resources.lambda
const bedrockAgentAccessPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ["bedrock:InvokeAgent"],
  resources: [
    `arn:aws:bedrock:us-east-1:332009426877:agent-alias/SWIEJQLBX2/*`,
  ],
});
queryAgentLambda.addToRolePolicy(bedrockAgentAccessPolicy)

/*
const agentDataSource = backend.data.addHttpDataSource(
  "AgentDataSource",
  "https://bedrock-agent-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: Stack.of(backend.data).region,
      signingServiceName: "bedrock",
    },
  }
);

agentDataSource.grantPrincipal.addToPrincipalPolicy(
  bedrockAgentAccessPolicy)
);*/

backend.data.resources.cfnResources.cfnGraphqlApi.environmentVariables = {
  MODEL_ID
}

