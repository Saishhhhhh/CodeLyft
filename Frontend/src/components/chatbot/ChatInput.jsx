import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ChatInput = ({ onSendMessage, isLoading, placeholder = "Type a message...", theme, isMobile }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { darkMode } = useTheme();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, isMobile ? 80 : 100)}px`;
    }
  }, [message, isMobile]);

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

  // Default theme if not provided
  const defaultTheme = {
    accent: darkMode ? '#8B5CF6' : '#6366F1',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#E5E7EB' : '#111827',
    textMuted: darkMode ? '#9CA3AF' : '#6B7280',
    border: darkMode ? '#374151' : '#E5E7EB',
    shadow: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    inputBg: darkMode ? '#111827' : '#F3F4F6',
  };

  // Use provided theme or default
  const inputTheme = theme || defaultTheme;

  return (
    <form onSubmit={handleSubmit} className="flex items-end w-full">
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base resize-none min-h-[36px] sm:min-h-[40px] max-h-[80px] sm:max-h-[100px] focus:outline-none transition-colors ${darkMode ? 'placeholder:text-slate-400' : 'placeholder:text-slate-500'}`}
          style={{
            backgroundColor: inputTheme.inputBg || (darkMode ? '#111827' : '#F3F4F6'),
            color: inputTheme.text,
            border: `1px solid ${inputTheme.border}`,
            boxShadow: `0 1px 2px ${inputTheme.shadow}`,
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
            style={{ color: inputTheme.textMuted }}
          >
            <div className="animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={`ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center touch-manipulation ${
          !message.trim() || isLoading ? 'opacity-60' : 'hover:opacity-90'
        }`}
        style={{
          backgroundColor: !message.trim() || isLoading 
            ? `${inputTheme.accent}80` 
            : inputTheme.accent,
          color: '#FFFFFF',
          cursor: !message.trim() || isLoading ? 'not-allowed' : 'pointer',
          minWidth: '36px',
          minHeight: '36px',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
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