// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Logger } from '@aws-lambda-powertools/logger';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { v4 as uuidv4 } from 'uuid';
import { WebsocketBroadcaster } from '../../utils/websocket-broadcaster';
import { Payload } from '../../models/payload'
import { Message } from '../../models/message';

const { LOG_LEVEL, MESSAGES_TABLE_NAME, AGENTS_TABLE_NAME, AWS_REGION } = process.env;
const logger = new Logger({ serviceName: 'websocketMessagingService', logLevel: LOG_LEVEL });
const tracer = new Tracer({ serviceName: 'websocketMessagingService' });
const metrics = new Metrics({ namespace: 'websocket-chat'});
const AWS = tracer.captureAWS(require('aws-sdk'));
const ddb = tracer.captureAWSClient(new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION }));
const broadcaster = new WebsocketBroadcaster(AWS, metrics, ddb, logger);

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime"); // CommonJS import
const client = new BedrockAgentRuntimeClient({region:AWS_REGION});

class Lambda implements LambdaInterface {

  private _apiGatewayEndpoint!: string;

  @tracer.captureLambdaHandler()
  public async handler(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {

    let response: APIGatewayProxyResult = { statusCode: 200, body: "" };
    this._apiGatewayEndpoint = event.requestContext.domainName + '/' + event.requestContext.stage;
    logger.addContext(context);

    try {
      const postObject = JSON.parse(event.body || "").data as Payload;

      // Handle request based on the payload type.
      if (postObject.type == "Message") {
        await this.processMessagePayload(postObject as Message, this._apiGatewayEndpoint, event);

        await this.processAgentResponse(postObject as Message, this._apiGatewayEndpoint, event);

      } else  {
        logger.info("Unrecognised payload type - ignore processing.");
      }

      metrics.publishStoredMetrics();
    }
    catch (e: any) {
      response = { statusCode: 500, body: e.stack };
    }

    return response;
  }

  async processMessagePayload(payload: Message, apiGatewayEndpoint: string, event: APIGatewayProxyEvent) {
    payload.messageId = uuidv4();
    const messageParams = { TableName: MESSAGES_TABLE_NAME, Item: payload };
    logger.debug(`Inserting message details ${JSON.stringify(messageParams)}`);
    await ddb.put(messageParams).promise();
    logger.debug(`Broadcasting message details ${JSON.stringify(messageParams)}`);
    await broadcaster.broadcast(payload, apiGatewayEndpoint, event.requestContext.connectionId);
  }

  async processAgentResponse(payload: Message, apiGatewayEndpoint: string, event: APIGatewayProxyEvent) {
    
    const agentResponse = await this.sendAgentRequest(payload, event);
    console.log("agent response ", agentResponse);
    
    const response = {
      channelId: payload.channelId,
      type: payload.type,
      messageId: uuidv4(),
      sentAt: new Date().toISOString(),
      sender: "agent",
      text: agentResponse,
    };
    const messageParams = { TableName: MESSAGES_TABLE_NAME, Item: response };
    logger.debug(`Inserting response details ${JSON.stringify(messageParams)}`);

    try{
      await ddb.put(messageParams).promise();
    } catch(e: any){
      logger.error("Error inserting message into database", e);
      // throw e;  // Rethrow error to trigger the error handling in the API Gateway. 
    }
    

    logger.debug(`Broadcasting response details ${JSON.stringify(messageParams)}`);
    await broadcaster.broadcast(response, apiGatewayEndpoint, event.requestContext.connectionId);
  }

  async sendAgentRequest(payload: Message, event: APIGatewayProxyEvent) {

    const agentQueryParams = { TableName: AGENTS_TABLE_NAME, Key: {id: payload.channelId}};
    logger.debug(`Calling for agent details ${JSON.stringify(agentQueryParams)}`);
    const agentDetails = await ddb.get(agentQueryParams).promise();
    logger.debug(`agent details ${JSON.stringify(agentDetails)}`);  
    let connectionId = event.requestContext.connectionId;
    connectionId = connectionId?.substring(0,connectionId.length-1);
    const authenticatedCustomerId = event.requestContext.authorizer?.customerId;
    const sessionId = connectionId + authenticatedCustomerId;

    const input = { // InvokeAgentRequest
      agentId: agentDetails.Item.agentId, // required
      agentAliasId: agentDetails.Item.agentAliasId, // required
      sessionId: sessionId, //"STRING_VALUE", // required
      endSession: false,
      enableTrace: true,
      inputText: payload.text,
    };
    const command = new InvokeAgentCommand(input);

    // async/await.
    var data
    try {
      data = await client.send(command);
      // process data.
    } catch (error) {
      // error handling.
      console.log(error);
    } finally {
      // finally.
    }
    
    console.log("Data: ", data);
    let chunks = [];
      for await (const item of data.completion) {
          console.log("Item: ", item);
          if (typeof item.chunk !== "undefined") {
              chunks.push(item.chunk.bytes)
          }
      }

      const stringResult = Buffer.concat(chunks).toString('utf-8');
      console.log(stringResult)
      return stringResult;
  }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler;