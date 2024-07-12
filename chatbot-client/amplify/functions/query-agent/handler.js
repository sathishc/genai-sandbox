// import type { Schema } from "../../data/resource"
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime"); // CommonJS import
const client = new BedrockAgentRuntimeClient({region: "us-east-1"});
import { env } from '$amplify/env/query-agent'; 

export const handler = async (event) => {
  
  const  sessionId = event.identity?.sub
  const { prompt } = event.arguments

  const input = { // InvokeAgentRequest
    agentId: env.BEDROCK_AGENT_ID, // required
    agentAliasId: env.BEDROCK_AGENT_ALIAS_ID, // required
    sessionId: sessionId, //"STRING_VALUE", // required
    endSession: false,
    enableTrace: true,
    inputText: prompt,
  };
  const command = new InvokeAgentCommand(input);

   // async/await.
   var data = [];
   try {
     data = await client.send(command);
     // process data.
   } catch (error) {
     // error handling.
     console.log(error);
   } finally {
     // finally.
   }

   // console.log("Data: ", data);
   let chunks = [];
   for await (const item of data.completion) {
        if (typeof item.chunk !== "undefined") {
            chunks.push(item.chunk.bytes)
        }
    }

    const stringResult = Buffer.concat(chunks).toString('utf-8');
    console.log(stringResult)
    return stringResult;
}

/*

npx --no-install esbuild --bundle "/Users/sathari/workspace/hackathon/github/genai-sandbox/chatbot-client/amplify/functions/query-agent/handler.ts" --target=node18 --platform=node --format=esm --outfile="/Users/sathari/workspace/hackathon/github/genai-sandbox/chatbot-client/.amplify/artifacts/cdk.out/bundling-temp-827391024ef5f380f3d3477a61541092e58d6c9ec73128544159b42f714ed450/index.mjs" --minify --sourcemap --loader:.node=file --banner:js="/**"

*/