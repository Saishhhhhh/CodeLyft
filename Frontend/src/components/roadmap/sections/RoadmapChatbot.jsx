import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatbot } from '../../../context/ChatbotContext';
import ChatMessage from '../../chatbot/ChatMessage';
import ChatInput from '../../chatbot/ChatInput';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const RoadmapChatbot = ({ roadmap, currentVideo, theme }) => {
  const { 
    isLoading: globalIsLoading,
    error: globalError,
    sendMessage: globalSendMessage
  } = useChatbot();
  
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  // Generate a unique ID for this roadmap
  const roadmapId = useMemo(() => {
    // Use multiple identifiers to ensure uniqueness
    const id = roadmap?._id || roadmap?.id;
    const title = roadmap?.title ? encodeURIComponent(roadmap.title.replace(/\s+/g, '-').toLowerCase()) : 'unknown';
    
    // Use a stable identifier that won't change on re-renders
    return id ? `roadmap-${id}` : `roadmap-${title}`;
  }, [roadmap?._id, roadmap?.id, roadmap?.title]);
  
  const storageKey = `roadmap-chat-${roadmapId}`;
  
  console.log('Using storage key:', storageKey, 'for roadmap:', roadmap?.title);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
        console.log('Loaded messages from storage key:', storageKey);
      } catch (e) {
        console.error('Failed to parse saved roadmap chat history:', e);
        localStorage.removeItem(storageKey);
      }
    } else {
      console.log('No saved messages found for storage key:', storageKey);
    }
  }, [storageKey]);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
      console.log('Saved messages to storage key:', storageKey);
    }
  }, [messages, storageKey]);

  // Scroll to bottom of messages when new messages are added
  const scrollToBottom = () => {
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  // Call scrollToBottom after messages update
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Handle message submission
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const newUserMessage = { role: 'user', content: message };
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);
      
      // Prepare context for the AI
      const contextString = getContextString();
      
      // Prepare system message with context
      const systemMessage = {
        role: 'system',
        content: `You are a specialized AI assistant for the MuftCode learning platform, specifically helping with roadmap "${roadmap?.title || 'this roadmap'}".
        Focus on providing technical explanations, code examples, and learning guidance related to the current topic.
        Be concise, helpful, and focus on practical advice related to programming and technology learning.
        ${contextString}`
      };
      
      // Call the API through the global context but don't update its messages
      const apiMessages = [systemMessage, ...updatedMessages];
      
      // Use the global sendMessage function but capture the response directly
      const response = await new Promise((resolve) => {
        globalSendMessage(message, apiMessages, (response) => {
          resolve(response);
        }, true); // true means don't update global chat history
      });
      
      // Add assistant message to our local chat
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        setMessages([...updatedMessages, response.choices[0].message]);
      } else {
        throw new Error('Invalid response from API');
      }
      
    } catch (err) {
      console.error('Error sending message to roadmap chatbot:', err);
      setError(err.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current context as a string to add to API calls
  const getContextString = () => {
    const contextParts = [];
    
    if (roadmap) {
      contextParts.push(`Current roadmap: ${JSON.stringify({
        title: roadmap.title,
        description: roadmap.description,
        isCustom: roadmap.isCustom || false
      })}`);
    }
    
    if (currentVideo) {
      contextParts.push(`Current video: ${JSON.stringify({
        title: currentVideo.title,
        url: currentVideo.url,
        channel: currentVideo.channel
      })}`);
    }
    
    if (contextParts.length === 0) return '';
    
    return `
    Current learning context:
    ${contextParts.join('\n')}
    
    Use this context to provide relevant technical explanations, code examples, and learning guidance.
    `;
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  // Generate a contextual prompt based on current video and roadmap
  const generateContextualPrompt = () => {
    if (!roadmap && !currentVideo) return "How can I help with your learning?";
    
    const prompts = [
      `How does ${currentVideo?.title || 'this topic'} fit into the bigger picture?`,
      `What should I learn next after ${currentVideo?.title || 'this topic'}?`,
      `Explain ${currentVideo?.title || 'this concept'} in simple terms`,
      `What are some project ideas using ${currentVideo?.title || 'this technology'}?`,
      `How does ${currentVideo?.title || 'this'} compare to other technologies?`,
      `What are common challenges when learning ${currentVideo?.title || 'this topic'}?`
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  return (
    <motion.div 
      className="flex flex-col h-full" 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Header with current video info */}
      {currentVideo && (
        <motion.div 
          className="rounded-t-lg"
          variants={itemVariants} 
          style={{ 
            background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})`,
            color: theme.buttonText,
            padding: '0.75rem'
          }}
        >
          <h3 className="font-medium text-sm">Currently Watching:</h3>
          <p className="truncate text-sm opacity-90">{currentVideo.title}</p>
        </motion.div>
      )}
      
      {/* Messages container - Responsive height with internal scrolling */}
      <motion.div 
        className="flex-1 p-4 overflow-y-auto custom-scrollbar" 
        variants={itemVariants}
        id="chatMessagesContainer"
        style={{ 
          backgroundColor: theme.cardBg,
          height: '300px', // Reduced height for better mobile experience
          maxHeight: '50vh', // Use viewport height for responsiveness
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain', // Prevent scroll chaining
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="mb-4 p-3 rounded-full" style={{ backgroundColor: `${theme.accent}20` }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={theme.accent}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.text }}>
              Ask questions about this roadmap
            </h3>
            <p className="text-sm opacity-75 mb-4" style={{ color: theme.textMuted }}>
              Get help understanding concepts, finding resources, or planning your learning journey
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {[1, 2, 3].map((_, i) => (
                <button
                  key={i}
                  className="text-sm text-left p-2 rounded-lg transition-all duration-200 hover:scale-102"
                  style={{
                    backgroundColor: `${theme.accent}10`,
                    border: `1px solid ${theme.accent}30`,
                    color: theme.text
                  }}
                  onClick={() => handleSendMessage(generateContextualPrompt())}
                >
                  {generateContextualPrompt()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}`}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <ChatMessage
                  message={message.content}
                  isUser={message.role === 'user'}
                  theme={theme}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="rounded-md overflow-hidden my-2">
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
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
                            backgroundColor: theme.codeBg,
                            color: theme.codeText,
                            fontSize: '0.875em'
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2 p-3 rounded-lg max-w-[85%]"
            style={{
              backgroundColor: `${theme.accent}20`,
              marginLeft: '0',
              marginTop: '8px'
            }}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        )}
        
        {error && (
          <div className="p-3 rounded-lg text-sm mt-2" style={{ backgroundColor: `${theme.error}20`, color: theme.error }}>
            <p>Error: {error}</p>
            <button
              className="text-xs mt-1 underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </motion.div>
      
      {/* Input area */}
      <motion.div 
        className="p-2 border-t" 
        variants={itemVariants}
        style={{ 
          borderColor: theme.border,
          backgroundColor: theme.cardBg
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <button
            className="text-xs flex items-center gap-1 px-2 py-1 rounded"
            style={{ color: theme.textMuted }}
            onClick={clearChat}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear chat
          </button>
        </div>
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          placeholder={`Ask about ${currentVideo?.title || roadmap?.title || 'this roadmap'}...`}
          theme={theme}
        />
      </motion.div>
    </motion.div>
  );
};

export default RoadmapChatbot; 