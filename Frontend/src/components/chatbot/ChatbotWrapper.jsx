import React from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import Chatbot from './Chatbot';

/**
 * A simple wrapper component that renders the Chatbot
 * This can be added to pages that don't use MainLayout
 */
const ChatbotWrapper = () => {
  // We don't need to do anything special here, just render the Chatbot
  return <Chatbot />;
};

export default ChatbotWrapper; 