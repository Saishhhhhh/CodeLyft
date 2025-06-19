import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import { useTheme } from '../../context/ThemeContext';
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
  
  const { darkMode, isMobile } = useTheme();
  const messagesEndRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (isOpen && !minimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, minimized]);

  // Toggle between minimized and expanded states
  const toggleMinimized = () => {
    setMinimized(prev => !prev);
    if (expanded) setExpanded(false);
  };

  // Toggle between normal and expanded states
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
    // If expanding from minimized state, also un-minimize
    if (minimized && !expanded) {
      setMinimized(false);
    }
  };

  // Handle message submission
  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  // Theme colors based on dark mode
  const theme = {
    bg: darkMode ? '#1E293B' : '#FFFFFF',
    header: darkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-indigo-500 to-purple-500',
    text: darkMode ? '#E5E7EB' : '#111827',
    textMuted: darkMode ? '#9CA3AF' : '#6B7280',
    border: darkMode ? '#374151' : '#E5E7EB',
    cardBg: darkMode ? '#111827' : '#F9FAFB',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    accent: darkMode ? '#8B5CF6' : '#6366F1',
    accentHover: darkMode ? '#7C3AED' : '#4F46E5',
  };

  // If chatbot is closed, just show the toggle button
  if (!isOpen) {
    return (
      <button 
        onClick={toggleChatbot}
        className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} ${theme.header} text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-opacity-90 transition-all z-50`}
        aria-label="Open chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  // Determine width based on state (minimized, normal, expanded)
  const getWidthClass = () => {
    if (minimized) return 'w-16 sm:w-64';
    if (expanded) {
      if (isMobile) return 'w-full h-full';
      return 'w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-4xl';
    }
    return 'w-[85vw] sm:w-80 md:w-96';
  };

  // Determine height based on state
  const getHeightClass = () => {
    if (minimized) return '';
    if (expanded) {
      if (isMobile) return 'h-[100vh]';
      return 'h-[80vh]';
    }
    return isMobile ? 'h-[70vh]' : '';
  };

  // Determine position based on state
  const getPositionClass = () => {
    if (expanded && isMobile) {
      return 'top-0 left-0 right-0 bottom-0 m-0 rounded-none';
    }
    if (expanded) {
      return 'bottom-0 right-0 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6';
    }
    return isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6';
  };

  // Render the full chatbot or minimized version
  return (
    <div 
      className={`fixed ${getPositionClass()} ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl z-50 transition-all duration-300 ${getWidthClass()} ${getHeightClass()} flex flex-col`}
      style={{ border: `1px solid ${theme.border}` }}
    >
      {/* Chatbot header */}
      <div className={`flex items-center justify-between ${theme.header} p-2 sm:p-3 rounded-t-lg ${expanded && isMobile ? 'rounded-t-none' : ''}`}>
        <h3 className="text-white font-medium text-sm sm:text-base truncate">
          {minimized && isMobile ? '' : 'CodeLyft Assistant'}
        </h3>
        <div className="flex space-x-1 sm:space-x-2 ml-auto">
          {/* Expand/Collapse button */}
          <button 
            onClick={toggleExpanded} 
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
            aria-label={expanded ? "Collapse chatbot" : "Expand chatbot"}
          >
            {expanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
          
          {/* Minimize/Expand button */}
          <button 
            onClick={toggleMinimized} 
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
            aria-label={minimized ? "Expand chatbot" : "Minimize chatbot"}
          >
            {minimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          {/* Close button */}
          <button 
            onClick={toggleChatbot} 
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
            aria-label="Close chatbot"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chatbot body - only show if not minimized */}
      {!minimized && (
        <>
          {/* Messages container */}
          <div className={`p-2 sm:p-3 ${expanded ? 'flex-grow' : 'h-[50vh] sm:h-80'} overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: theme.textMuted }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-center text-sm sm:text-base">How can I help with your learning journey today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage 
                  key={index} 
                  message={msg.content} 
                  isUser={msg.role === 'user'} 
                  theme={{
                    accent: theme.accent,
                    cardBg: theme.cardBg,
                    text: theme.text,
                    textMuted: theme.textMuted,
                    border: theme.border,
                    codeBg: darkMode ? '#1E293B' : '#F3F4F6',
                    codeText: darkMode ? '#8B5CF6' : '#4F46E5',
                  }}
                />
              ))
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 p-2 rounded my-2 text-xs sm:text-sm">
                Error: {error}
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 p-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-purple-500 rounded-full"></div>
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-purple-500 rounded-full animation-delay-200"></div>
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-purple-500 rounded-full animation-delay-400"></div>
                </div>
                <span className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Thinking...</span>
              </div>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className={`border-t p-2 sm:p-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              theme={{
                accent: theme.accent,
                cardBg: theme.cardBg,
                text: theme.text,
                textMuted: theme.textMuted,
                border: theme.border,
                shadow: theme.shadow,
              }}
              isMobile={isMobile}
            />
            
            {/* Clear chat button */}
            {messages.length > 0 && (
              <div className="flex justify-between mt-2">
              <button 
                onClick={clearChat}
                  className="text-[10px] sm:text-xs hover:underline"
                  style={{ color: theme.textMuted }}
                disabled={isLoading}
              >
                Clear conversation
              </button>
                
                {expanded && (
                  <button
                    onClick={toggleExpanded}
                    className="text-[10px] sm:text-xs hover:underline"
                    style={{ color: theme.textMuted }}
                  >
                    {isMobile ? 'Exit fullscreen' : 'Collapse window'}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot; 