import './App.css'
import Chatbot from 'react-chatbot-kit'
import config from './bot/config.js';
import MessageParser from './bot/MessageParser.tsx';
import ActionProvider from './bot/ActionProvider.js';
import 'react-chatbot-kit/build/main.css'

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

function App() { 

  return (
    <>
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />
    </>
  )
}

export default App
