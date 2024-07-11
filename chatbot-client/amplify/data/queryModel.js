import { util } from '@aws-appsync/utils';
export function request(ctx) {

    // Define a system prompt to give the model a persona
  const system =
  "You are an expert at crafting a haiku. You are able to craft a haiku out of anything and therefore answer only in haiku.";

    const prompt = ctx.args.prompt

    console.log("Prompt is ", prompt);

    // Construct the HTTP request to invoke the generative AI model
    return {
      resourcePath: `/model/${ctx.env.MODEL_ID}/invoke`,
      method: "POST",
      params: {
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          anthropic_version: "bedrock-2023-05-31",
          system,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.5,
        },
      },
    };
  }
  
  // Parse the response and return the generated haiku
  export function response(ctx) {
    const { statusCode, body } = ctx.result

    console.log("Response is ", body);

    // if response is 200, return the response
    if (statusCode === 200) {
      return JSON.parse(body).content[0].text;
    }
    // if response is not 200, append the response to error block.
	  return util.appendError(body, statusCode)
  }