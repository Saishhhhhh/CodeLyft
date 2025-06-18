import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Component to display a single chat message
const ChatMessage = ({ message, isUser, theme, components }) => {
  // Use provided components for markdown rendering or use default
  const markdownComponents = components || {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="rounded-md overflow-hidden my-2">
          <SyntaxHighlighter
            language={match[1] || 'javascript'}
            style={atomDark}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code 
          className="px-1 py-0.5 rounded-sm"
          style={{
            backgroundColor: theme?.codeBg || '#1E293B',
            color: theme?.codeText || '#4F46E5',
            fontSize: '0.875em'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    // Customize other markdown elements as needed
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="hover:underline"
        style={{ color: theme?.accent || '#4F46E5' }}
      >
        {children}
      </a>
    ),
  };

  // Default theme if not provided
  const defaultTheme = {
    primary: '#4F46E5',
    accent: '#8B5CF6',
    cardBg: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    codeBg: '#F3F4F6',
    codeText: '#4F46E5',
  };

  // Use provided theme or default
  const messageTheme = theme || defaultTheme;

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-[85%] ${
          isUser
            ? 'rounded-br-none'
            : 'rounded-bl-none'
        }`}
        style={{
          backgroundColor: isUser 
            ? messageTheme.accent 
            : messageTheme.cardBg === '#FFFFFF' ? '#F3F4F6' : '#1E293B',
          color: isUser ? '#FFFFFF' : messageTheme.text,
          border: isUser ? 'none' : `1px solid ${messageTheme.border || '#E5E7EB'}`,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message}</p>
        ) : (
          <div className="text-sm markdown-content">
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