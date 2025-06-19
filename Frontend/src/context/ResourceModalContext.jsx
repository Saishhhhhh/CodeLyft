import React, { createContext, useContext, useState, useEffect } from 'react';

const ResourceModalContext = createContext();

export const useResourceModal = () => {
  const context = useContext(ResourceModalContext);
  if (!context) {
    throw new Error('useResourceModal must be used within a ResourceModalProvider');
  }
  return context;
};

export const ResourceModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    isMinimized: false,
    isProcessing: false,
    currentTopic: '',
    progressPercent: 0,
    foundResources: [],
    estimatedTimeRemaining: '',
    currentPlaylist: '',
    currentVideo: '',
    totalTopics: 0,
    processedTopics: 0
  });

  // Check for persistent minimized state on mount
  useEffect(() => {
    const persistedMinimized = localStorage.getItem('resourceModalMinimized');
    const persistedProcessing = localStorage.getItem('resourceModalProcessing');
    if (persistedMinimized === 'true' && persistedProcessing === 'true') {
      setModalState(prev => ({ ...prev, isMinimized: true, isProcessing: true }));
    }
  }, []);

  const openModal = (data = {}) => {
    setModalState(prev => ({ 
      ...prev, 
      isOpen: true, 
      isMinimized: false, 
      isProcessing: true,
      ...data 
    }));
    localStorage.removeItem('resourceModalMinimized');
    localStorage.setItem('resourceModalProcessing', 'true');
  };

  const closeModal = () => {
    setModalState(prev => ({ 
      ...prev, 
      isOpen: false, 
      isMinimized: false,
      isProcessing: false
    }));
    localStorage.removeItem('resourceModalMinimized');
    localStorage.removeItem('resourceModalProcessing');
  };

  const minimizeModal = () => {
    setModalState(prev => ({ 
      ...prev, 
      isOpen: false, 
      isMinimized: true,
      isProcessing: true
    }));
    localStorage.setItem('resourceModalMinimized', 'true');
    localStorage.setItem('resourceModalProcessing', 'true');
  };

  const expandModal = () => {
    setModalState(prev => ({ 
      ...prev, 
      isOpen: true, 
      isMinimized: false,
      isProcessing: true
    }));
    localStorage.removeItem('resourceModalMinimized');
    localStorage.setItem('resourceModalProcessing', 'true');
  };

  const updateModalData = (data) => {
    setModalState(prev => ({ 
      ...prev, 
      ...data,
      // Ensure foundResources is always an array
      foundResources: data.foundResources !== undefined 
        ? (Array.isArray(data.foundResources) ? data.foundResources : [])
        : prev.foundResources
    }));
  };

  const cancelProcessing = () => {
    setModalState(prev => ({ 
      ...prev, 
      isOpen: false, 
      isMinimized: false,
      isProcessing: false,
      currentTopic: '',
      progressPercent: 0,
      foundResources: [],
      estimatedTimeRemaining: '',
      currentPlaylist: '',
      currentVideo: '',
      totalTopics: 0,
      processedTopics: 0
    }));
    localStorage.removeItem('resourceModalMinimized');
    localStorage.removeItem('resourceModalProcessing');
  };

  const value = {
    ...modalState,
    openModal,
    closeModal,
    minimizeModal,
    expandModal,
    updateModalData,
    cancelProcessing
  };

  return (
    <ResourceModalContext.Provider value={value}>
      {children}
    </ResourceModalContext.Provider>
  );
}; 