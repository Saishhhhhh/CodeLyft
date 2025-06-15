import React from 'react';
import { ChatbotProvider } from '../../context/ChatbotContext';
import Chatbot from './Chatbot';

// This component wraps the Chatbot with its context provider
// It can be imported and used directly in layouts or pages
const ChatbotContainer = () => {
  return (
    <ChatbotProvider>
      <Chatbot />
    </ChatbotProvider>
  );
};

export default ChatbotContainer; 