import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaSave, FaMarkdown, FaEye, FaKeyboard, FaExpand, FaCompress } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * NotesModal component for adding and editing video notes
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.currentNote - Current note content
 * @param {Function} props.onNoteChange - Function to handle note content changes
 * @param {Function} props.onSave - Function to save the note
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onDelete - Function to delete the note
 * @param {string} props.videoTitle - Title of the video
 * @param {string} props.lastEdited - Timestamp of the last edit
 * @param {Object} props.theme - Theme object
 */
const NotesModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  note,
  onNoteChange,
  videoTitle,
  lastEdited,
  theme
}) => {
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const MAX_CHARS = 10000;
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCharCount(note?.length || 0);
    // Calculate word count
    const words = note?.trim() ? note.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [note]);

  // Add keyboard shortcut for toggling preview and fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen) {
        // Toggle preview mode with Ctrl+P or Cmd+P
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault(); // Prevent browser print dialog
          setIsPreview(prev => !prev);
        }
        
        // Toggle fullscreen with F11 or Ctrl+F
        if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.key === 'f')) {
          e.preventDefault();
          setIsFullscreen(prev => !prev);
        }
        
        // Exit fullscreen with Escape
        if (e.key === 'Escape' && isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  const handleNoteChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      onNoteChange(value);
      setCharCount(value.length);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;
  
  const formattedDate = lastEdited ? new Date(lastEdited).toLocaleString() : 'Never';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex min-h-screen items-center justify-center p-4 w-full">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => isFullscreen ? setIsFullscreen(false) : onClose()}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative bg-white shadow-xl ${isFullscreen ? 'w-[95%] h-[95%] m-auto' : 'max-w-4xl w-full'} p-6`}
              style={{
                backgroundColor: theme.modalBg,
                color: theme.text,
                minHeight: isFullscreen ? '90vh' : '70vh',
                maxHeight: isFullscreen ? '90vh' : '85vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '0.75rem',
                overflow: 'hidden'
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>
                  {videoTitle ? `Notes for: ${videoTitle}` : 'Add your notes for this video'}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Mode toggle buttons */}
                  <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: theme.border }}>
                    {/* Edit button */}
                    <button
                      onClick={() => setIsPreview(false)}
                      className="px-3 py-2 transition-colors flex items-center gap-1"
                      style={{
                        backgroundColor: !isPreview ? theme.buttonPrimary : theme.cardBg,
                        color: !isPreview ? theme.buttonText : theme.text,
                        fontWeight: !isPreview ? 'bold' : 'normal',
                        borderRight: `1px solid ${theme.border}`
                      }}
                      title="Edit mode (Ctrl+P)"
                    >
                      <FaEdit className={`${!isPreview ? 'text-sm' : 'text-xs'}`} />
                      <span className="text-sm">Edit</span>
                    </button>
                    
                    {/* Preview button */}
                    <button
                      onClick={() => setIsPreview(true)}
                      className="px-3 py-2 transition-colors flex items-center gap-1"
                      style={{
                        backgroundColor: isPreview ? theme.buttonPrimary : theme.cardBg,
                        color: isPreview ? theme.buttonText : theme.text,
                        fontWeight: isPreview ? 'bold' : 'normal'
                      }}
                      title="Preview markdown (Ctrl+P)"
                    >
                      <FaEye className={`${isPreview ? 'text-sm' : 'text-xs'}`} />
                      <span className="text-sm">Preview</span>
                    </button>
                  </div>
                  
                  {/* Toggle fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                    style={{
                      backgroundColor: isFullscreen ? theme.buttonSecondary : theme.cardBg,
                      color: isFullscreen ? theme.buttonText : theme.text,
                      border: `1px solid ${theme.border}`,
                      fontWeight: isFullscreen ? 'bold' : 'normal'
                    }}
                    title={isFullscreen ? "Exit fullscreen (F11)" : "Fullscreen mode (F11)"}
                  >
                    {isFullscreen ? (
                      <>
                        <FaCompress className="text-sm" />
                        <span className="text-sm">Exit</span>
                      </>
                    ) : (
                      <>
                        <FaExpand className="text-sm" />
                        <span className="text-sm">Fullscreen</span>
                      </>
                    )}
                  </button>
                  
                  {!isFullscreen && (
                    <button 
                      onClick={onClose} 
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                {lastEdited && (
                  <div className="text-sm" style={{ color: theme.textMuted }}>
                    Last edited: {formattedDate}
                  </div>
                )}
                
                {!isPreview && (
                  <div className="flex justify-end text-sm" style={{ color: theme.textMuted }}>
                    <span className={charCount > MAX_CHARS * 0.9 ? 'text-orange-500' : ''}>
                      {charCount} / {MAX_CHARS} characters
                    </span>
                    <span className="ml-4">{wordCount} words</span>
                  </div>
                )}
              </div>

              <div className="flex-grow flex flex-col overflow-hidden">
                {isPreview ? (
                  <div 
                    className="border rounded-lg p-4 overflow-y-auto markdown-content flex-grow"
                    style={{ 
                      backgroundColor: theme.cardBg === '#FFFFFF' ? '#F3F4F6' : '#1E293B',
                      borderColor: theme.border
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {note || ''}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Add your notes here... (Markdown supported)"
                    className="w-full p-4 border rounded-lg resize-none flex-grow"
                    style={{ 
                      backgroundColor: theme.cardBg === '#FFFFFF' ? '#F3F4F6' : '#1E293B',
                      color: theme.text,
                      borderColor: theme.border,
                      fontFamily: 'monospace'
                    }}
                  />
                )}
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div className="flex space-x-3">
                  <button
                    onClick={onSave}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    style={{ 
                      backgroundColor: theme.buttonPrimary,
                      color: theme.buttonText
                    }}
                  >
                    <FaSave />
                    <span>Save Notes</span>
                  </button>
                  {note && (
                    <button
                      onClick={onDelete}
                      className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      style={{ 
                        backgroundColor: theme.error,
                        color: '#FFFFFF'
                      }}
                    >
                      <FaTrash />
                      <span>Delete Notes</span>
                    </button>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex flex-col items-end text-sm" style={{ color: theme.textMuted }}>
                    <div className="flex items-center mb-1">
                      <FaMarkdown className="mr-1" />
                      <span>Markdown supported</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ 
                        backgroundColor: theme.isDark ? '#374151' : '#E5E7EB',
                        color: theme.text
                      }}>Ctrl+P</span>
                      <span>Toggle Edit/Preview</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ 
                        backgroundColor: theme.isDark ? '#374151' : '#E5E7EB',
                        color: theme.text
                      }}>F11</span>
                      <span>Toggle Fullscreen</span>
                    </div>
                  </div>
                </div>
                <div className="md:hidden flex items-center">
                  <FaMarkdown className="mr-1" style={{ color: theme.textMuted }} />
                  <span className="text-sm" style={{ color: theme.textMuted }}>Markdown</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotesModal; 