import React from 'react';

const MessageParser = ({ children, actions }) => {
  const parse = async (message) => {

    // first save the message fro user to persistent db
    actions.saveMessage(message, "user");

    var response = ""
    // handle the message
    if (message.toLowerCase() === 'hello' || message.toLowerCase() === 'hi') {
      response = await actions.handleHello();
    } else if(message.lastIndexOf('/agent ',0) == 0) {
      response = await actions.handleQueryAgent(message);
    } else {
      response = await actions.handleQueryModel(message);
    }
    // save the response from the bot
    actions.saveMessage(response, "bot");
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          parse: parse,
          actions,
        });
      })}
    </div>
  );
};

export default MessageParser;