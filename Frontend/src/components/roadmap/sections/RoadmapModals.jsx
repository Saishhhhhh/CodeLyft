import React from 'react';
import VideoPlayerModal from '../modals/VideoPlayerModal';
import NotesModal from '../modals/NotesModal';
import CelebrationModal from '../modals/CelebrationModal';

const RoadmapModals = ({
  // Video Player Modal Props
  videoModalOpen,
  currentVideo,
  completedVideos,
  videoNotes,
  onCloseVideoModal,
  onToggleVideoComplete,
  onAddNote,
  
  // Notes Modal Props
  noteModalOpen,
  currentNote,
  editingNote,
  noteTimestamps,
  onCloseNoteModal,
  onSaveNote,
  onDeleteNote,
  onNoteChange,
  
  // Celebration Modal Props
  showCelebration,
  onCloseCelebration
}) => {
  return (
    <>
      {/* Video Player Modal */}
      {videoModalOpen && currentVideo && (
        <VideoPlayerModal
          video={currentVideo}
          isOpen={true}
          onClose={onCloseVideoModal}
          onToggleComplete={onToggleVideoComplete}
          isCompleted={currentVideo ? completedVideos[currentVideo.id] : false}
          onAddNote={onAddNote}
          hasNote={currentVideo ? !!videoNotes[currentVideo.id] : false}
        />
      )}

      {/* Notes Modal */}
      <NotesModal
        isOpen={noteModalOpen}
        onClose={onCloseNoteModal}
        onSave={onSaveNote}
        onDelete={onDeleteNote}
        note={currentNote}
        onNoteChange={onNoteChange}
        videoTitle={currentVideo?.title}
        lastEdited={editingNote ? noteTimestamps[editingNote] : null}
      />
      
      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={onCloseCelebration} 
      />
    </>
  );
};

export default RoadmapModals; 