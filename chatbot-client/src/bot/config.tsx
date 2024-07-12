import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: "Loan Bot",
  initialMessages: [createChatBotMessage(`Hi, I am an Insurance Bot. I can help you with understanding the status of your claims. To get these details, start your queries with /agent. I can also provide you with random general knowledge - for this just type your query without starting with the /agent in the space provided `)],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#376B7E',
    },
    chatButton: {
      backgroundColor: '#008000',
    },
  },
  customComponents: {
    // Replaces the default header
   header: () => <div style={{ backgroundColor: '#008000', color:'white', padding: "5px", borderRadius: "3px" }}>Insurance Bot</div>
 },
};

export default config;