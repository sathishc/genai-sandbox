import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
var path = require('path');


export class ClaimsAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // The code that defines your stack goes here
    const region = process.env.CDK_DEFAULT_REGION // this.region
    const account_id = process.env.CDK_DEFAULT_ACCOUNT //this.account

    const suffix = `${region}-${account_id}`
    const agent_name = "insurance-claims-agent-kb"
    const agent_alias_name = "workshop-alias"
    const schema_name = 'insurance_claims_api.json'
    const lambda_role_name = `${agent_name}-lambda-role-${suffix}`
    const lambda_name = `${agent_name}-lambda-${suffix}`
    const kb_name = `insurance-claims-kb-${suffix}`
    const data_source_name = `insurance-claims-kb-docs-${suffix}`
    const kb_key = 'kb_documents'
    
    // setup lambda function for agent group
    // create an IAM role for the lambda function with lambda_role_name
    const lambda_role = new cdk.aws_iam.Role(this, lambda_role_name, {
      roleName: lambda_role_name,
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ]
    })

    // create a lambda function with the lambda_role and lambda_code_path
    const lambda_function = new cdk.aws_lambda.Function(this, lambda_name, {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_12,
      handler: 'lambda_function.lambda_handler',
      role: lambda_role,
      code: cdk.aws_lambda.Code.fromAsset(`../assets/lambda/claims`)
    });

    // create a Bedrock knowledgebase
    const kb = new bedrock.KnowledgeBase(this, 'KnowledgeBase', {
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
      instruction: 'KB that contains information about documents requirements for insurance claims',
    });

    const kb_s3_bucket = new cdk.aws_s3.Bucket(this, kb_name, {
      bucketName: kb_name,
      versioned: true,
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true
    })

    // create an s3 deployment for the kb files
    const kb_path = `../assets/kb_documents/`;
    new cdk.aws_s3_deployment.BucketDeployment(this, 's3-kb-deployment', {
      sources: [cdk.aws_s3_deployment.Source.asset(kb_path)],
      destinationBucket: kb_s3_bucket,
      destinationKeyPrefix: kb_key
    });

    // create a data source for the knowledge base
    const data_source = new bedrock.S3DataSource(this, 'DataSource', {
      dataSourceName: data_source_name,
      bucket: kb_s3_bucket,
      knowledgeBase: kb,
      chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
      maxTokens: 500,
      overlapPercentage: 20,
    });

    const agent = new bedrock.Agent(this, 'Agent', {
      foundationModel: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_INSTANT_V1_2,
      instruction: `
        You are an agent that can handle various tasks related to insurance claims, including looking up claim 
        details, finding what paperwork is outstanding, and sending reminders. Only send reminders if you have been 
        explicitly requested to do so. If an user asks about your functionality, provide guidance in natural language 
        and do not include function names on the output.`,
      knowledgeBases: [kb],
      aliasName:agent_alias_name
    });

    agent.role.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'))
    lambda_function.addPermission('AllowExecutionFromBedrock', {
      action: 'lambda:InvokeFunction',
      principal: new cdk.aws_iam.ServicePrincipal('bedrock.amazonaws.com'),
    })

    const schemaString = path.join(__dirname, `../../assets/schema/${schema_name}`)

    const actionGroup = new bedrock.AgentActionGroup(this,'MyActionGroup',{
      actionGroupName: 'insurance-claims',
      description: 'Use these functions to get information about the claims.',
      actionGroupExecutor: {
        lambda: lambda_function,
      },
      actionGroupState: "ENABLED",
      apiSchema: bedrock.ApiSchema.fromAsset(schemaString),
    });
    agent.addActionGroup(actionGroup);
    // output the bedrock agent arn
    new cdk.CfnOutput(this, 'BedrockAgentArn', {
      value: agent.agentArn,
    });  
  }
}
