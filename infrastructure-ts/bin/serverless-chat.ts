#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { ClaimsAgentStack } from '../lib/claims-agent-stack';

/* If you don't specify 'env', this stack will be environment-agnostic.
 * Account/Region-dependent features and context lookups will not work,
 * but a single synthesized template can be deployed anywhere. */

/* Uncomment the next line to specialize this stack for the AWS Account
 * and Region that are implied by the current CLI configuration. */
// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

/* Uncomment the next line if you know exactly what Account and Region you
 * want to deploy the stack to. */
// env: { account: '123456789012', region: 'us-east-1' },

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const app = new cdk.App();

// CDK-NAG security checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

// Sets the log level for the lambda functions
// Allowed values:
// DEBUG | INFO | WARN | ERROR
const LOG_LEVEL = "DEBUG"; 

// const authStack = new AuthenticationStack(app, 'AuthenticationStack', {});

// const databaseStack = new DatabaseStack(app, 'DatabaseStack', {});

const claimsAgentStack = new ClaimsAgentStack(app, 'ClaimsAgentStack', {});



// CDK-NAG rule supressions

NagSuppressions.addStackSuppressions(claimsAgentStack, [
  { id: 'AwsSolutions-S1', reason: 'Server access logging disabled for sample' },
  { id: 'AwsSolutions-S10', reason: 'Not enforcing SSL for a sample' },
  { id: 'AwsSolutions-IAM4', reason: 'LambdaBasicExecutionRole has access to create and append to any CW log groups. Although this is not ideal, it does not pose a security risk for the sample.' },
  { id: 'AwsSolutions-IAM5', reason: 'SMS MFA is not enabled on the Userpool.' },
  { id: 'AwsSolutions-L1', reason: 'Latest Agent Runtime suppressed for Sample' },
]);
