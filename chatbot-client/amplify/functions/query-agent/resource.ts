import { defineFunction } from '@aws-amplify/backend';

export const queryAgent = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'query-agent',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.js',
  timeoutSeconds:28,
  memoryMB: 256,
  environment: {
    BEDROCK_AGENT_ID: "SWIEJQLBX2",
    BEDROCK_AGENT_ALIAS_ID: "PBHV9VNWCB",
  }
});