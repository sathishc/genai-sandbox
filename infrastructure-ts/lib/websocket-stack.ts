// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { WebSocketApi, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { join } from 'path';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface WebsocketProps extends StackProps {
  messagesTable: Table;
  agentsTable: Table;
  connectionsTable: Table;
  cognitoUserPoolId: string;
  logLevel: string;
}

export class WebsocketStack extends Stack {

  public webSocketApi: WebSocketApi;

  constructor(scope: Construct, id: string, props?: WebsocketProps) {
    super(scope, id, props);

    // SQS queue for user status updates
    const statusQueue = new sqs.Queue(this, 'user-status-queue', {
      visibilityTimeout: Duration.seconds(150),      // default,
      receiveMessageWaitTime: Duration.seconds(20), // default
      encryption: sqs.QueueEncryption.KMS_MANAGED
    });
    // Enforce TLS calls from any services
    statusQueue.addToResourcePolicy(new PolicyStatement({
      effect: Effect.DENY,
      principals: [
          new AnyPrincipal(),
      ],
      actions: [
          "sqs:*"
      ],
      resources: [statusQueue.queueArn],
      conditions: {
          "Bool": {"aws:SecureTransport": "false"},
      },
    }));
    NagSuppressions.addResourceSuppressions(
      statusQueue,
      [
        {
          id: 'AwsSolutions-SQS3',
          reason:
            "Supress warning about missing DLQ. DLQ is not mission-critical here, a missing status update won't cause service disruptuion.",
        },
      ],
      true
    );

    var ssmPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      resources: [
        `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/prod/cognito/clientid`,
      ],
    })

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
        ],
        nodeModules: [
          '@aws-lambda-powertools/logger', 
          '@aws-lambda-powertools/tracer',
          'aws-jwt-verify',
          '@aws-lambda-powertools/metrics'
        ],
      },
      depsLockFilePath: join(__dirname, '../resources/', 'package-lock.json'),
      environment: {
        CONNECTIONS_TABLE_NAME: props?.connectionsTable.tableName!,
        MESSAGES_TABLE_NAME: props?.messagesTable.tableName!,
        AGENTS_TABLE_NAME: props?.agentsTable.tableName!,
        STATUS_QUEUE_URL: statusQueue.queueUrl,
        COGNITO_USER_POOL_ID: props?.cognitoUserPoolId!,
        LOG_LEVEL: props?.logLevel!
      },
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(120),
    }

    const authorizerHandler = new NodejsFunction(this, "AuthorizerHandler", {
      entry: path.join(__dirname, `/../resources/handlers/websocket/authorizer.ts`),
      ...nodeJsFunctionProps
    });
    authorizerHandler.addToRolePolicy(ssmPolicyStatement);

    const onConnectHandler = new NodejsFunction(this, "OnConnectHandler", {
      entry: path.join(__dirname, `/../resources/handlers/websocket/onconnect.ts`),
      ...nodeJsFunctionProps
    });
    props?.connectionsTable.grantReadWriteData(onConnectHandler);
    statusQueue.grantSendMessages(onConnectHandler);

    const onDisconnectHandler = new NodejsFunction(this, "OnDisconnectHandler", {
      entry: path.join(__dirname, `/../resources/handlers/websocket/ondisconnect.ts`),
      ...nodeJsFunctionProps
    });
    props?.connectionsTable.grantReadWriteData(onDisconnectHandler);
    statusQueue.grantSendMessages(onDisconnectHandler);

    const onMessageHandler = new NodejsFunction(this, "OnMessageHandler", {
      entry: path.join(__dirname, `/../resources/handlers/websocket/onmessage.ts`),
      ...nodeJsFunctionProps
    });
    onMessageHandler.addToRolePolicy(ssmPolicyStatement);
    props?.connectionsTable.grantReadWriteData(onMessageHandler);
    props?.messagesTable.grantReadWriteData(onMessageHandler);
    props?.agentsTable.grantReadWriteData(onMessageHandler);

    // add bedrock permissions
    onMessageHandler.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['bedrock:invokeAgent'],
      resources: ['*']
    }))


    const authorizer = new WebSocketLambdaAuthorizer('Authorizer', authorizerHandler, { identitySource: ['route.request.header.Cookie'] });
    this.webSocketApi = new WebSocketApi(this, 'ServerlessChatWebsocketApi', {
      apiName: 'Serverless Chat Websocket API',
      connectRouteOptions: { integration: new WebSocketLambdaIntegration("ConnectIntegration", onConnectHandler), authorizer },
      disconnectRouteOptions: { integration: new WebSocketLambdaIntegration("DisconnectIntegration", onDisconnectHandler) },
      defaultRouteOptions: { integration: new WebSocketLambdaIntegration("DefaultIntegration", onMessageHandler) },
    });

    const prodStage = new WebSocketStage(this, 'Prod', {
      webSocketApi: this.webSocketApi,
      stageName: 'wss',
      autoDeploy: true,
    });

    this.webSocketApi.grantManageConnections(onMessageHandler);
    
  }
}
