import React from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import Loader from "./Loader.tsx"

const ActionProvider = ({ createChatBotMessage, setState, children }) => {


  const handleHello = () => {
    const botMessage = createChatBotMessage('Hello. Nice to meet you.');

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const client = generateClient<Schema>({authMode:"userPool"});

  const  handleQueryAgent = async (prompt) => {
    // Add Loading before API call
    const loading = createChatBotMessage(<Loader />)
    setState((prev) => ({ ...prev, messages: [...prev.messages, loading], }))

    const response = await client.queries.queryAgent({prompt: prompt})
    console.log(response);

    const botMessage = createChatBotMessage(response.data);
    setState((prev) => {
      const newPrevMsg = prev.messages.slice(0, -1)
      return { ...prev, messages: [...newPrevMsg, botMessage], }
    });
  };

  const  handleQueryModel = async (prompt) => {
    // Add Loading before API call
    const loading = createChatBotMessage(<Loader />)
    setState((prev) => ({ ...prev, messages: [...prev.messages, loading], }))

    const response = await client.queries.queryModel({prompt: prompt})
    console.log(response);
    const botMessage = createChatBotMessage(response.data);
    setState((prev) => {
      const newPrevMsg = prev.messages.slice(0, -1)
      return { ...prev, messages: [...newPrevMsg, botMessage], }
    });
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: {
            handleHello,
            handleQueryAgent,
            handleQueryModel,
          },
        });
      })}
    </div>
  );
};

export default ActionProvider;