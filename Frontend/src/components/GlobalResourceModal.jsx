import React from 'react';
import { useResourceModal } from '../context/ResourceModalContext';
import ResourceLoadingModal from './roadmap/modals/ResourceLoadingModal';

const GlobalResourceModal = () => {
  const {
    isOpen,
    isMinimized,
    isProcessing,
    currentTopic,
    progressPercent,
    foundResources,
    estimatedTimeRemaining,
    currentPlaylist,
    currentVideo,
    totalTopics,
    processedTopics,
    closeModal,
    minimizeModal,
    expandModal,
    cancelProcessing
  } = useResourceModal();

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }

  // Don't render anything if neither open nor minimized
  if (!isOpen && !isMinimized) {
    return null;
  }

  return (
    <ResourceLoadingModal
      isOpen={isOpen}
      onClose={closeModal}
      onCancel={cancelProcessing}
      currentTopic={currentTopic}
      progressPercent={progressPercent}
      foundResources={Array.isArray(foundResources) ? foundResources : []}
      estimatedTimeRemaining={estimatedTimeRemaining}
      currentPlaylist={currentPlaylist}
      currentVideo={currentVideo}
      totalTopics={totalTopics}
      processedTopics={processedTopics}
      isMinimized={isMinimized}
      onMinimize={minimizeModal}
      onExpand={expandModal}
    />
  );
};

export default GlobalResourceModal; 