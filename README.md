# Amazon Bedrock Agent application using ApiGateway Websockets
This project lets you provision a ready-to-use fully serverless Amazon Bedrock Agent chatbot application using Amazon ApiGateway Websockets. The infrastructure code is using the [AWS Cloud Development Kit(AWS CDK)](https://aws.amazon.com/cdk/) and implemented in both Typescript. The frontend is written using [Angular 17](https://angular.io/).

![](assets/chat_UI.png)


## Solution Architecture
![Solution Architecture](assets/agent-reference-architecture.png)


## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) installed and configured with the aws account you want to use.
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) installed and configured with the aws account you want to use.
- [docker](https://docs.docker.com/get-docker/) installed and is up and running locally (required for the lambda function builds).
- [node-js 18](https://nodejs.org/en/download) installed. If using nvm, run `nvm use 18`

## Security considerations
For the sake of this demo, **not all security features are enabled** to save cost and effort of setting up a working PoC. 

Below you can find a list of security recommendations in case you would like to deploy the infrastructure in a production environment:
- Currently **all registered users can immediately access** the application without second factor authentication or account confirmation. This is not suitable for production use. Please change the Cognito configuration to enable e-mail/sms verification and MFA. In a future release this will be addressed with a feature flag to toggle between different authentication modes.
- The DynamoDB tables have no backups configured by default. Please enable PITR (point-in-time recovery) and table backups. The tables will be removed on cloudformation stack deletion.
- Logging for the APIGateway API/stage and for the Cloudfront distribution are disabled. Please enable these additional logs in production environments for audit and troubleshooting purposes.
- The Cloudfront distribution uses the default cloudfront domain and viewer certificate. The default viewer certificate defaults to the TLSv1 protocol. In order to enforce newer protocols, please use a custom domain with a custom certificate and set the MinimumProtocolVersion to TLSv1.2.

## Getting started
### Deployment

:warning: WARNING :warning: The domain prefix for the Cognito Userpool needs to be *globally unique*. Before deployment, please make sure to configure your unique domain prefix at the FrontendStack declaration.

You need to update the code in the [./infrastructure-ts/bin/serverless-chat.ts](./infrastructure-ts/bin/serverless-chat.ts) file to a specific unique domain



### Building the frontend
- Change directory to where UI code lives.
```bash
    cd UI
```
- Restore NPM packages for the project
```bash
    npm install
```
- Build the frontend application
```bash
    ng build --prod
```
### Deploy the CDK stack

Switch to the infrastrcutre-ts folder, install the libraries and deploy the stacks

```
cd ..\infrastrcutre-ts
npm install
cdk deploy --all
```
Please check the [readme](./infrastructure-ts/README.md) file in the infrastructure directory for more details.

### Opening the chat application
The chat application's URL will be found at the Frontend stack's output. Open the Cloudfront Distribution's URL in your browser, where you'll be redirected to the Cognito login/signup page. 

### Cleanup
Run the following command in the relevant infrastructure directory to delete the cloudformation stacks:
```bash
    cdk destroy --all
```

## API Handler documentation
You can find a more detailed description of what the API handler functions are doing [here](/infrastructure-ts/resources/handlers/README.md).

## Found an issue? Anything to add?
See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Credits

This source base is forked from https://github.com/aws-samples/websocket-chat-application