import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import togetherService from '../services/togetherService';

// Create the context
const ChatbotContext = createContext();

// Custom hook to use the chatbot context
export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

// Initial system message to define chatbot behavior
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are CodeLyft Assistant, an AI helper for the CodeLyft learning platform. 
  Your purpose is to help users navigate their learning journey, understand technologies, 
  and make the most of the platform's features. Be concise, helpful, and focus on 
  providing practical advice related to programming, technology learning paths, 
  and the CodeLyft platform itself. Avoid long explanations unless specifically asked.
  
  You have the following specialized capabilities:
  
  1. Roadmap Navigation & Explanation
     - Provide detailed explanations of tools/technologies in roadmaps
     - Make intelligent "next step" recommendations based on user progress
     - Compare technologies to help users make informed decisions
  
  2. Personalized Learning Path Optimization
     - Suggest modifications to standard roadmaps based on user goals/experience
     - Help users prioritize sections based on their career objectives
     - Identify which topics can be skipped based on prior knowledge
  
  3. Project Ideation & Planning
     - Generate relevant project ideas that apply multiple learned technologies
     - Break complex projects into achievable milestones
     - Match project suggestions to user's current skill level
  
  4. Technology Comparison & Clarification
     - Provide clear comparisons between similar technologies
     - Explain when/why to use specific tools in different contexts
     - Clarify complex technical concepts in simple terms
  
  5. Custom Roadmap Creation Assistance
     - Help users design tailored learning paths for specific goals
     - Suggest technologies to include based on career objectives
     - Ensure logical progression and dependencies in custom roadmaps
  
  When users ask about technologies, roadmaps, or learning paths, provide specific, actionable advice.
  For technology comparisons, focus on practical differences, use cases, and tradeoffs.
  When suggesting projects, ensure they match the user's current skill level and learning goals.`
};

export const ChatbotProvider = ({ children }) => {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Context awareness state
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [userProgress, setUserProgress] = useState(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse saved chat history:', e);
        localStorage.removeItem('chatHistory');
      }
    }
  }, []);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Toggle chatbot visibility
  const toggleChatbot = () => setIsOpen(prev => !prev);

  // Update context awareness with useCallback to prevent infinite loops
  const updateContext = useCallback((contextData) => {
    if (contextData.roadmap) setCurrentRoadmap(contextData.roadmap);
    if (contextData.topic) setCurrentTopic(contextData.topic);
    if (contextData.progress) setUserProgress(contextData.progress);
  }, []);

  // Get current context as a string to add to API calls
  const getContextString = useCallback(() => {
    const contextParts = [];
    
    if (currentRoadmap) {
      contextParts.push(`Current roadmap: ${JSON.stringify(currentRoadmap)}`);
    }
    
    if (currentTopic) {
      contextParts.push(`Current topic: ${JSON.stringify(currentTopic)}`);
    }
    
    if (userProgress) {
      contextParts.push(`User progress: ${JSON.stringify(userProgress)}`);
    }
    
    if (contextParts.length === 0) return '';
    
    return `
    Current user context:
    ${contextParts.join('\n')}
    
    Use this context to provide more relevant answers when appropriate.
    `;
  }, [currentRoadmap, currentTopic, userProgress]);

  // Send a message to the chatbot
  const sendMessage = async (userMessage, customMessages = null, callback = null, skipUpdatingGlobalChat = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If not using custom messages, use the global chat history
      if (!customMessages) {
        // Add user message to the chat
        const newUserMessage = { role: 'user', content: userMessage };
        const updatedMessages = [...messages, newUserMessage];
        
        // Only update global messages if not skipping
        if (!skipUpdatingGlobalChat) {
          setMessages(updatedMessages);
        }
        
        // Prepare messages for API call (include system message and context)
        const contextString = getContextString();
        const systemMessageWithContext = {
          ...SYSTEM_MESSAGE,
          content: contextString ? `${SYSTEM_MESSAGE.content}\n\n${contextString}` : SYSTEM_MESSAGE.content
        };
        
        customMessages = [systemMessageWithContext, ...updatedMessages];
      }
      
      // Call the API
      const response = await togetherService.createChatCompletion(customMessages);
      
      // Extract the assistant's response
      const assistantMessage = response.choices[0].message;
      
      // Add assistant message to chat if not skipping global updates
      if (!skipUpdatingGlobalChat) {
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // If callback provided, call it with the response
      if (callback && typeof callback === 'function') {
        callback(response);
      }
      
      return response;
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to get response');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  // Context value
  const value = {
    messages,
    isOpen,
    isLoading,
    error,
    toggleChatbot,
    sendMessage,
    clearChat,
    updateContext,
    currentRoadmap,
    currentTopic,
    userProgress
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export default ChatbotContext; 