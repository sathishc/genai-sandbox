import React from 'react';

const MessageParser = ({ children, actions }) => {
  const parse = (message) => {
    if (message.toLowerCase() === 'hello' || message.toLowerCase() === 'hi') {
      actions.handleHello();
    } else if(message.lastIndexOf('/agent ',0) == 0) {
      actions.handleQueryAgent(message);
    } else {
      actions.handleQueryModel(message);
    }
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