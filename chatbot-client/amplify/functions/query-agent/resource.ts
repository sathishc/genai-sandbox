import { defineFunction } from '@aws-amplify/backend';

export const queryAgent = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'query-agent',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds:28,
  memoryMB: 256
});