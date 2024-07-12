import React from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';

const ActionProvider = ({ createChatBotMessage, setState, children }) => {


  const handleHello = () => {
    const botMessage = createChatBotMessage('Hello. Nice to meet you.');

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const client = generateClient<Schema>();

  const  handleQueryAgent = async (prompt) => {

    const response = await client.queries.queryAgent({prompt: prompt})

    console.log(response);

    const botMessage = createChatBotMessage(response.data);

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: {
            handleHello,
            handleQueryAgent
          },
        });
      })}
    </div>
  );
};

export default ActionProvider;