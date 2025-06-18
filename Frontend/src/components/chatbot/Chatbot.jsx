import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const Chatbot = () => {
  const { 
    messages, 
    isOpen, 
    isLoading, 
    error, 
    toggleChatbot, 
    sendMessage, 
    clearChat 
  } = useChatbot();
  
  const messagesEndRef = useRef(null);
  const [minimized, setMinimized] = useState(false);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (isOpen && !minimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, minimized]);

  // Toggle between minimized and expanded states
  const toggleMinimized = () => {
    setMinimized(prev => !prev);
  };

  // Handle message submission
  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  // If chatbot is closed, just show the toggle button
  if (!isOpen) {
    return (
      <button 
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-all z-50"
        aria-label="Open chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  // Render the full chatbot or minimized version
  return (
    <div className={`fixed bottom-6 right-6 bg-gray-800 rounded-lg shadow-xl z-50 transition-all duration-300 ${minimized ? 'w-64' : 'w-80 sm:w-96'}`}>
      {/* Chatbot header */}
      <div className="flex items-center justify-between bg-purple-600 p-3 rounded-t-lg">
        <h3 className="text-white font-medium">CodeLyft Assistant</h3>
        <div className="flex space-x-2">
          {/* Minimize/Expand button */}
          <button 
            onClick={toggleMinimized} 
            className="text-white hover:bg-purple-700 rounded p-1"
            aria-label={minimized ? "Expand chatbot" : "Minimize chatbot"}
          >
            {minimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>
          
          {/* Close button */}
          <button 
            onClick={toggleChatbot} 
            className="text-white hover:bg-purple-700 rounded p-1"
            aria-label="Close chatbot"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chatbot body - only show if not minimized */}
      {!minimized && (
        <>
          {/* Messages container */}
          <div className="p-3 h-80 overflow-y-auto bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-center">How can I help with your learning journey today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 p-2 rounded my-2 text-sm">
                Error: {error}
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 p-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animation-delay-400"></div>
                </div>
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="border-t border-gray-700 p-3">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            
            {/* Clear chat button */}
            {messages.length > 0 && (
              <button 
                onClick={clearChat}
                className="text-xs text-gray-400 hover:text-white mt-2"
                disabled={isLoading}
              >
                Clear conversation
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot; 