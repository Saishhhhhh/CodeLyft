import React, { useState, useEffect } from 'react';
import UserResourceInput from './UserResourceInput';
import UserResourceDisplay from './UserResourceDisplay';
import { formatResourceForStorage } from '../services/userResourceService';

/**
 * Component for managing user resources for topics before adding YouTube videos
 */
const UserResourceManager = ({ roadmap, onComplete, onCancel }) => {
  const [currentRoadmap, setCurrentRoadmap] = useState(roadmap);
  const [userResources, setUserResources] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Initialize user resources map
  useEffect(() => {
    if (roadmap) {
      const initialResources = {};
      roadmap.sections.forEach((section, sectionIndex) => {
        section.topics.forEach((topic, topicIndex) => {
          const key = `${sectionIndex}-${topicIndex}`;
          initialResources[key] = null;
        });
      });
      setUserResources(initialResources);
    }
  }, [roadmap]);
  
  // Get current section and topic
  const currentSection = currentRoadmap?.sections?.[currentSectionIndex];
  const currentTopic = currentSection?.topics?.[currentTopicIndex];
  
  // Handle resource added
  const handleResourceAdded = (resource) => {
    const key = `${currentSectionIndex}-${currentTopicIndex}`;
    
    // Format the resource for storage
    const formattedResource = formatResourceForStorage(resource);
    
    // Update user resources
    setUserResources(prev => ({
      ...prev,
      [key]: formattedResource
    }));
    
    // Update current roadmap
    const updatedRoadmap = { ...currentRoadmap };
    updatedRoadmap.sections[currentSectionIndex].topics[currentTopicIndex].video = formattedResource;
    updatedRoadmap.sections[currentSectionIndex].topics[currentTopicIndex].hasUserResource = true;
    setCurrentRoadmap(updatedRoadmap);
    
    // Move to next topic
    moveToNextTopic();
  };
  
  // Handle resource removed
  const handleResourceRemoved = () => {
    const key = `${currentSectionIndex}-${currentTopicIndex}`;
    
    // Update user resources
    setUserResources(prev => ({
      ...prev,
      [key]: null
    }));
    
    // Update current roadmap
    const updatedRoadmap = { ...currentRoadmap };
    delete updatedRoadmap.sections[currentSectionIndex].topics[currentTopicIndex].video;
    updatedRoadmap.sections[currentSectionIndex].topics[currentTopicIndex].hasUserResource = false;
    setCurrentRoadmap(updatedRoadmap);
  };
  
  // Move to next topic
  const moveToNextTopic = () => {
    const sections = currentRoadmap.sections;
    
    // Check if there are more topics in the current section
    if (currentTopicIndex < sections[currentSectionIndex].topics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
    }
    // Check if there are more sections
    else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentTopicIndex(0);
    }
    // If we've gone through all topics in all sections
    else {
      setIsCompleted(true);
      onComplete(currentRoadmap);
    }
  };
  
  // Move to previous topic
  const moveToPrevTopic = () => {
    // Check if there are previous topics in the current section
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(currentTopicIndex - 1);
    }
    // Check if there are previous sections
    else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentTopicIndex(currentRoadmap.sections[currentSectionIndex - 1].topics.length - 1);
    }
  };
  
  // Skip current topic
  const handleSkipTopic = () => {
    moveToNextTopic();
  };
  
  // Complete the process
  const handleComplete = () => {
    onComplete(currentRoadmap);
  };
  
  // If completed, show completion message
  if (isCompleted) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">All Topics Processed</h2>
        <p className="text-gray-600 mb-6 text-center">
          You've added resources to all topics you wanted. We'll now find resources for any remaining topics.
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Continue to Resource Generation
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate progress
  const totalTopics = currentRoadmap.sections.reduce((total, section) => total + section.topics.length, 0);
  const currentTopicNumber = currentRoadmap.sections.slice(0, currentSectionIndex).reduce(
    (count, section) => count + section.topics.length, 0
  ) + currentTopicIndex + 1;
  const progress = Math.round((currentTopicNumber / totalTopics) * 100);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">Add Your Own Resources</h2>
      <p className="text-gray-600 mb-6 text-center">
        Add your preferred YouTube videos or playlists for each topic, or skip to use our recommendations.
      </p>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          Topic {currentTopicNumber} of {totalTopics}
        </p>
      </div>
      
      {/* Current topic */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          {currentSection?.title}: {currentTopic?.title}
        </h3>
        <p className="text-sm text-gray-600">{currentTopic?.description}</p>
      </div>
      
      {/* User resource display if exists */}
      {userResources[`${currentSectionIndex}-${currentTopicIndex}`] && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Your Selected Resource:</h4>
          <UserResourceDisplay
            resource={userResources[`${currentSectionIndex}-${currentTopicIndex}`]}
            onRemove={handleResourceRemoved}
          />
        </div>
      )}
      
      {/* User resource input if no resource exists */}
      {!userResources[`${currentSectionIndex}-${currentTopicIndex}`] && (
        <UserResourceInput
          onResourceAdded={handleResourceAdded}
          topicTitle={currentTopic?.title}
        />
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={moveToPrevTopic}
          disabled={currentSectionIndex === 0 && currentTopicIndex === 0}
          className={`px-4 py-2 rounded-md text-sm ${
            currentSectionIndex === 0 && currentTopicIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous Topic
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            Skip All
          </button>
          
          {!userResources[`${currentSectionIndex}-${currentTopicIndex}`] && (
            <button
              onClick={handleSkipTopic}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              Skip This Topic
            </button>
          )}
          
          {userResources[`${currentSectionIndex}-${currentTopicIndex}`] && (
            <button
              onClick={moveToNextTopic}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              Next Topic
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserResourceManager; 