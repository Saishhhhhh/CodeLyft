import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../context/ThemeContext';

// Component to display a single chat message
const ChatMessage = ({ message, isUser, theme, components }) => {
  const { darkMode, isMobile } = useTheme();

  // Use provided components for markdown rendering or use default
  const markdownComponents = components || {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="rounded-md overflow-hidden my-2">
          <SyntaxHighlighter
            language={match[1] || 'javascript'}
            style={darkMode ? atomDark : oneLight}
            PreTag="div"
            customStyle={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '0.75rem' : '1rem',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code 
          className="px-1 py-0.5 rounded-sm"
          style={{
            backgroundColor: theme?.codeBg || (darkMode ? '#1E293B' : '#F3F4F6'),
            color: theme?.codeText || (darkMode ? '#8B5CF6' : '#4F46E5'),
            fontSize: isMobile ? '0.75em' : '0.875em'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    // Customize other markdown elements as needed
    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm sm:text-base">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm sm:text-base">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm sm:text-base">{children}</ol>,
    li: ({ children }) => <li className="mb-1 text-sm sm:text-base">{children}</li>,
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="hover:underline text-sm sm:text-base"
        style={{ color: theme?.accent || (darkMode ? '#8B5CF6' : '#6366F1') }}
      >
        {children}
      </a>
    ),
    h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base sm:text-lg font-semibold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm sm:text-base font-medium mb-1">{children}</h3>,
  };

  // Default theme if not provided
  const defaultTheme = {
    primary: darkMode ? '#6366F1' : '#4F46E5',
    accent: darkMode ? '#8B5CF6' : '#6366F1',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#E5E7EB' : '#111827',
    textMuted: darkMode ? '#9CA3AF' : '#6B7280',
    codeBg: darkMode ? '#111827' : '#F3F4F6',
    codeText: darkMode ? '#A5B4FC' : '#4F46E5',
    border: darkMode ? '#374151' : '#E5E7EB',
  };

  // Use provided theme or default
  const messageTheme = theme || defaultTheme;

  return (
    <div className={`flex mb-2 sm:mb-3 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg max-w-[90%] sm:max-w-[85%] ${
          isUser
            ? 'rounded-br-none'
            : 'rounded-bl-none'
        } transition-colors`}
        style={{
          backgroundColor: isUser 
            ? messageTheme.accent 
            : messageTheme.cardBg,
          color: isUser ? '#FFFFFF' : messageTheme.text,
          border: isUser ? 'none' : `1px solid ${messageTheme.border || '#E5E7EB'}`,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          boxShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-xs sm:text-sm">{message}</p>
        ) : (
          <div className="text-xs sm:text-sm markdown-content">
            <ReactMarkdown components={markdownComponents}>
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 