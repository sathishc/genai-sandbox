import './App.css'
import Chatbot from 'react-chatbot-kit'
import config from './bot/config.tsx';
import MessageParser from './bot/MessageParser.tsx';
import ActionProvider from './bot/ActionProvider.js';
import 'react-chatbot-kit/build/main.css'

import "@cloudscape-design/global-styles/index.css"
import Container from "@cloudscape-design/components/container";
import TopNavigation from "@cloudscape-design/components/top-navigation";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);

function App() { 

  return (
    <Authenticator>
       {({ signOut, user }) => (
        <div className="App">
      <TopNavigation
        identity={{
          href: "#",
          title: "Chatbot with Amazon Bedrock and Amplify",
        }}
        utilities={[
          
          {
            type: "menu-dropdown",
            text: "",
            description: user?.signInDetails?.loginId,
            iconName: "user-profile",
            items: [
              { id: "signout", text: "Sign out"}
            ],
            onItemClick: (item) => {
              console.log(item);
              if (item.detail.id === "signout") {
                console.log("signing out", user);
                signOut();
              }
            }
          }
        ]}
      />
      <Container>
        <Chatbot
          config={config}
          messageParser={MessageParser}
          actionProvider={ActionProvider}
        />
      </Container>
      </div>
       )}
    </Authenticator>
  )
}

export default App
