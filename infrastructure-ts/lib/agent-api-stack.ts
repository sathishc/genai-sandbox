// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps } from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { AuthorizationType, CognitoUserPoolsAuthorizer, IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { WebSocketApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';
import { join } from 'path';
import * as path from 'path';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

export interface AgentApiProps extends StackProps {
  messagesTable: Table;
  agentsTable: Table;
  connectionsTable: Table;
  cognitoUserPoolId: string;
  webSocketApi: WebSocketApi;
  logLevel: string;
}

export class AgentApiStack extends Stack {

  public apiGatewayEndpoint: string;
  public restApi: RestApi;

  constructor(scope: Construct, id: string, props?: AgentApiProps) {
    super(scope, id, props);

    /* ================================
    API Schema
    -----------
    [GET]    /config
    [GET]    /users
    [GET]    /agents
    [GET]    /agents/{ID}
    [POST]   /agents/
    [GET]    /agents/{ID}/messages
    ==================================== */

    const sharedLambdaProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
        ],
        nodeModules: [
          '@aws-lambda-powertools/logger', 
          '@aws-lambda-powertools/tracer',
          'aws-jwt-verify'
        ],
      },
      depsLockFilePath: join(__dirname, '../resources/', 'package-lock.json'),
      environment: {
        AGENTS_TABLE_NAME: props?.agentsTable.tableName!,
        MESSAGES_TABLE_NAME: props?.messagesTable.tableName!,
        COGNITO_USER_POOL_ID: props?.cognitoUserPoolId!,
        WEBSOCKET_API_URL: `${props?.webSocketApi.apiEndpoint!}/wss`,
        LOG_LEVEL: props?.logLevel!
      },
      runtime: Runtime.NODEJS_20_X,
    }

    const getConfigHandler = new NodejsFunction(this, 'getConfigHandler', {
      entry: path.join(__dirname, `/../resources/handlers/rest/get-config.ts`),
      ...sharedLambdaProps,
    });
    getConfigHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        resources: [
          `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/prod/cognito/signinurl`,
          `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/prod/websocket/url`,
        ],
      })
    )

    const getAgentsHandler = new NodejsFunction(this, 'getAgentsHandler', {
      entry: path.join(__dirname, `/../resources/handlers/agent/get-agents.ts`),
      ...sharedLambdaProps,
    });

    const postAgentsHandler = new NodejsFunction(this, 'postAgentsHandler', {
      entry: path.join(__dirname, `/../resources/handlers/agent/post-agents.ts`),
      ...sharedLambdaProps,
    });

    const getAgentHandler = new NodejsFunction(this, 'getAgentHandler', {
      entry: path.join(__dirname, `/../resources/handlers/agent/get-agent.ts`),
      ...sharedLambdaProps,
    });

    const getAgentMessagesHandler = new NodejsFunction(this, 'getAgentMessagesHandler', {
      entry: path.join(__dirname, `/../resources/handlers/agent/get-agent-messages.ts`),
      ...sharedLambdaProps,
    });

    // Grant the Lambda functions read/write access to the DynamoDB tables
    props?.agentsTable.grantReadWriteData(getAgentsHandler);
    props?.agentsTable.grantReadData(getAgentsHandler);
    props?.agentsTable.grantReadWriteData(postAgentsHandler);
    props?.agentsTable.grantReadData(getAgentHandler);
    props?.messagesTable.grantReadData(getAgentMessagesHandler);

    // Integrate the Lambda functions with the API Gateway resource
    const getConfigIntegration = new LambdaIntegration(getConfigHandler);
    const getAgentsIntegration = new LambdaIntegration(getAgentsHandler);
    const postAgentsIntegration = new LambdaIntegration(postAgentsHandler);
    const getAgentIntegration = new LambdaIntegration(getAgentHandler);
    const getAgentMessagesIntegration = new LambdaIntegration(getAgentMessagesHandler);

    this.restApi = new RestApi(this, 'AgentChatbotRestApi', {
      restApiName: 'Agent Chatbot REST API'
    });

    this.apiGatewayEndpoint = this.restApi.url;

    const userPool = UserPool.fromUserPoolId(this, "UserPool", props?.cognitoUserPoolId!);
    const auth = new CognitoUserPoolsAuthorizer(this, 'websocketChatUsersAuthorizer', {
      cognitoUserPools: [userPool]
    });
    const authMethodOptions = { authorizer: auth, authorizationType: AuthorizationType.COGNITO };

    const api = this.restApi.root.addResource('api');

    const config = api.addResource('config');
    /* [GET]  /config - Retrieve all users with online/offline status */
    config.addMethod('GET', getConfigIntegration);
    
    const agents = api.addResource('agents');
    /* [GET]  /agents/all/{username} - Retrieve all agents for a user */
    const all = agents.addResource('all');
    const userName = all.addResource('{username}');
    userName.addMethod('GET', getAgentsIntegration, authMethodOptions);

    /* [POST] /agents - Creates a new agent */
    agents.addMethod('POST', postAgentsIntegration, authMethodOptions);

    /* [ANY] /agents/agent/{id} - retrieves agent with specific name */
    const agent = agents.addResource('agent');
    const agentId = agent.addResource('{id}');
    agentId.addMethod('GET', getAgentIntegration, authMethodOptions);
    
    /* [GET]  /agents/messages/{id} - Retrieve top 100 messages for a specific agent */
    const messages = agents.addResource('messages');
    const messagesId = messages.addResource('{id}');
    messagesId.addMethod('GET', getAgentMessagesIntegration, authMethodOptions);

    addCorsOptions(config);
    addCorsOptions(agents);
    addCorsOptions(all);
    addCorsOptions(agent);
    addCorsOptions(messages);
  }
};

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}