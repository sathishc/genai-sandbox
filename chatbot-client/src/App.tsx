import './App.css'
import Chatbot from 'react-chatbot-kit'
import config from './bot/config.tsx';
import MessageParser from './bot/MessageParser.tsx';
import ActionProvider from './bot/ActionProvider.js';
import 'react-chatbot-kit/build/main.css'
import "@cloudscape-design/global-styles/index.css"
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";


import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

function App() { 

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="The chatbot demonstrates integration with Amazon Bedrock and Bedrock Agents"
        >
          Amazon Bedrock Chatbot
        </Header>
      }
    >
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />
    </Container>
    
  )
}

export default App
