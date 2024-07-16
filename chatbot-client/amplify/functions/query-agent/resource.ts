import { defineFunction } from '@aws-amplify/backend';
import { Fn, Stack } from 'aws-cdk-lib';
export const queryAgent = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'query-agent',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.js',
  timeoutSeconds:28,
  memoryMB: 256,
  environment: {
    BEDROCK_AGENT_ID: Fn.importValue('LoanAgent-AgentId'),
    BEDROCK_AGENT_ALIAS_ID: Fn.importValue('LoanAgent-AgentAliasId'), 
  }
});