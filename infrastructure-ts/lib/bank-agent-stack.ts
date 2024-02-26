import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import * as path from 'path';


export class BankAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // The code that defines your stack goes here
    const region = process.env.CDK_DEFAULT_REGION // this.region
    const account_id = process.env.CDK_DEFAULT_ACCOUNT //this.account

    const suffix = `${region}-${account_id}`
    const agent_name = "bank-agent"
    const agent_alias_name = "bank-agent-alias"
    const schema_name = 'bank_transactions_api.json'
    const lambda_role_name = `${agent_name}-lambda-role-${suffix}`
    const lambda_name = `${agent_name}-lambda-${suffix}`

    const bank_transactions_bucket_name = agent_name + "-" + suffix
    const csv_file_name = "bank_transactions.csv";

    

    const transaction_s3_bucket = new cdk.aws_s3.Bucket(this, bank_transactions_bucket_name, {
      bucketName: bank_transactions_bucket_name,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    })

    // create an s3 deployment for the kb files
    const csv_path = `../assets/dataset/bank`;
    new cdk.aws_s3_deployment.BucketDeployment(this, `${transaction_s3_bucket}-deployment`, {
      sources: [cdk.aws_s3_deployment.Source.asset(csv_path)],
      destinationBucket: transaction_s3_bucket,
    });

    // create a dynamodb table with the above csv

    
    const bankTable = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'CustomerID',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey:{
        name: 'TransactionDate',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "bankTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production use
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: false, // set to "true" to enable PITR
      importSource: {
        // compressionType: dynamodb.InputCompressionType.GZIP,
        inputFormat: dynamodb.InputFormat.csv({
          delimiter: ',',
          headerList: ['TransactionID','CustomerID','CustomerDOB','CustGender','CustLocation','CustAccountBalance','TransactionDate','TransactionTime','TransactionAmount (INR)'],
        }),
        bucket:transaction_s3_bucket,
        keyPrefix: csv_file_name
      },
    });
    
    
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

    const sharedLambdaProps: NodejsFunctionProps = {
      environment: {
        BANK_TABLE_NAME: bankTable.tableName
      },
      runtime: Runtime.NODEJS_20_X,
    }
    const lambda_function = new NodejsFunction(this, lambda_name, {
      entry: path.join(__dirname, `../../assets/lambda/bank/transactions.js`),
      ...sharedLambdaProps,
      timeout:cdk.Duration.minutes(3)
    });
    bankTable.grantReadData(lambda_function);

    
    const agent = new bedrock.Agent(this, 'Agent', {
      foundationModel: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_INSTANT_V1_2,
      instruction: `
        You are an agent that can handle various tasks related to bank transactions, such as including looking up transactions 
        details, finding list of transactions for a customer, get the account balance for a customer, finding transactions within a certain location, finding transactions within certain dates, etc.  If an user asks about your functionality, provide guidance in natural language 
        and do not include function names in the output.`,
      aliasName:agent_alias_name,
    });

    agent.role.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'))
    lambda_function.addPermission('AllowExecutionFromBedrock', {
      action: 'lambda:InvokeFunction',
      principal: new cdk.aws_iam.ServicePrincipal('bedrock.amazonaws.com'),
    })

    agent.addActionGroup({
      actionGroupName: agent_name,
      description: 'Use these functions to get information about the transations and account balances for customers.',
      actionGroupExecutor: lambda_function,
      actionGroupState: "ENABLED",
      apiSchema: bedrock.ApiSchema.fromAsset(path.join(__dirname, `../../assets/schema/${schema_name}`)),
    });
    
  }
}
