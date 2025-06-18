import React, { useState, useRef, useEffect } from 'react';

const ChatInput = ({ onSendMessage, isLoading, placeholder = "Type a message...", theme }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height after sending
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current.style.height = 'auto';
        }, 10);
      }
    }
  };

  // Handle keyboard shortcuts (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end w-full">
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2 resize-none min-h-[40px] max-h-[100px] focus:outline-none transition-colors"
          style={{
            backgroundColor: theme ? (theme.cardBg === '#FFFFFF' ? '#F3F4F6' : '#1E293B') : 'bg-gray-700',
            color: theme ? theme.text : '#FFFFFF',
            border: `1px solid ${theme ? theme.border : '#4B5563'}`,
            boxShadow: `0 1px 2px ${theme ? theme.shadow : 'rgba(0, 0, 0, 0.05)'}`,
            outline: 'none',
            WebkitAppearance: 'none',
          }}
          disabled={isLoading}
          rows={1}
          aria-label="Message input"
        />
        {isLoading && (
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
            style={{ color: theme?.textMuted || '#9CA3AF' }}
          >
            <div className="animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="ml-2 p-2 rounded-lg transition-colors flex items-center justify-center touch-manipulation"
        style={{
          backgroundColor: !message.trim() || isLoading 
            ? (theme ? `${theme.accent}50` : '#4B5563') 
            : theme ? theme.accent : '#8B5CF6',
          color: !message.trim() || isLoading 
            ? (theme ? `${theme.textMuted}` : '#9CA3AF') 
            : '#FFFFFF',
          cursor: !message.trim() || isLoading ? 'not-allowed' : 'pointer',
          minWidth: '40px',
          minHeight: '40px',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput; 