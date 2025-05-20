import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
 */
const NotesModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  note,
  onNoteChange,
  videoTitle,
  lastEdited
}) => {
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 500;

  useEffect(() => {
    setCharCount(note?.length || 0);
  }, [note]);

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    if (newNote.length <= MAX_CHARS) {
      onNoteChange(newNote);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {note ? 'Edit Notes' : 'Add Notes'}
                </h2>
                <p className="text-gray-600">
                  {videoTitle ? `Notes for: ${videoTitle}` : 'Add your notes for this video'}
                </p>
                {lastEdited && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last edited: {formatDate(lastEdited)}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <textarea
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Add your notes here... (e.g., key concepts, timestamps, or personal insights)"
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {charCount}/{MAX_CHARS} characters
                  </p>
                  {charCount > MAX_CHARS * 0.8 && (
                    <p className="text-sm text-orange-500">
                      {charCount > MAX_CHARS * 0.9 ? 'Almost full!' : 'Getting close to limit'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    onClick={onSave}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Save Notes
                  </button>
                  {note && (
                    <button
                      onClick={onDelete}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete Notes
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotesModal; 