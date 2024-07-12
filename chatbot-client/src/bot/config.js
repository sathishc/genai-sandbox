import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: "Loan Bot",
  initialMessages: [createChatBotMessage(`Hi, I am a Loan Bot `)],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#376B7E',
    },
    chatButton: {
      backgroundColor: '#008000',
    },
  },
};

export default config;