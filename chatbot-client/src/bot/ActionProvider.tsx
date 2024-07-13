import React from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import Loader from "./Loader.tsx"

import { useAuthenticator } from '@aws-amplify/ui-react';

const ActionProvider = ({ createChatBotMessage, setState, children }) => {

  const { user } = useAuthenticator((context) => [context.user]);
  const client = generateClient<Schema>({authMode:"userPool"});

  const loadMessages = () => {
    client.models.Message.list().then((messages) => {
      const mappedMessages = messages.data.map((item) => ({
        id: item.sentAt,
        message: item.message,
        loading: false,
        type: item.type,
      })).sort(function(a, b) {
        return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0)
      });
  
      setState((prev) => {
        const newPrevMsg = prev.messages[0]
        return { ...prev, messages: [newPrevMsg, ...mappedMessages], }
      });
    });
  }
  React.useEffect(() => {
    loadMessages()
  }, [])

  const saveMessage = async (message, type) => {
    console.log("saving message", message, type);
     await client.models.Message.create({
      message: message,
      type: type,
      sentAt: Date.now(),
      user: user.userId
    })
  }

  const handleHello = () => {
    const response = 'Hello. Nice to meet you.'
    // Add Loading before API call
    const botMessage = createChatBotMessage(response);

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
    return response
  };  

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

    return response.data
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
    return response.data
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: {
            handleHello,
            handleQueryAgent,
            handleQueryModel,
            saveMessage,
          },
        });
      })}
    </div>
  );
};

export default ActionProvider;