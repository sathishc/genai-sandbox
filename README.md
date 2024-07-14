# Chatbot application using Amazon Bedrock Agents and Amplify Gen2
This project lets you provision a ready-to-use fully serverless chatbot application using Amazon Bedrock Agents and Amplify Gen2. The infrastructure code is using the [AWS Cloud Development Kit(AWS CDK)](https://aws.amazon.com/cdk/) and implemented in both Typescript. The frontend is written using [React + Vite + Amplify](https://github.com/sathishc/genai-sandbox/tree/main/chatbot-client).

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

## Getting started

### Deploy the CDK stack

Switch to the infrastrcutre-ts folder, install the libraries and deploy the stacks

```
cd infrastructure-ts
npm install
cdk bootstrap
cdk deploy 
```
Please check the [readme](./infrastructure-ts/README.md) file in the infrastructure directory for more details.

### Building the frontend and middleware
- Change directory to where UI code lives.
```bash
    cd chat-client
```
- Restore NPM packages for the project
```bash
    npm install
```
- Deploy the Amplify middleware
```bash
    npx ampx sandbox
```
- Run the chat application
```bash
    npm run dev
```

### Cleanup
Run the following command in the relevant infrastructure directory to delete the cloudformation stacks:
```bash
    cdk destroy
```

## Found an issue? Anything to add?
See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
