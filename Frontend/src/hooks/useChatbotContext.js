import { useEffect } from 'react';
import { useChatbot } from '../context/ChatbotContext';

/**
 * Hook to update the chatbot context with current roadmap information
 * 
 * @param {Object} contextData - Data to update the chatbot context
 * @param {Object} contextData.roadmap - Current roadmap data
 * @param {Object} contextData.topic - Current topic being viewed
 * @param {Object} contextData.progress - User's progress data
 * @param {Array} dependencies - Dependencies to trigger context update
 */
const useChatbotContext = (contextData, dependencies = []) => {
  const { updateContext } = useChatbot();
  
  useEffect(() => {
    if (contextData) {
      updateContext(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);
};

export default useChatbotContext; 