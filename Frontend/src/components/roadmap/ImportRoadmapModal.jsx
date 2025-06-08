import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { importRoadmap } from '../../services/roadmapService';
import { FaFileImport, FaSpinner, FaInfoCircle, FaDownload } from 'react-icons/fa';

const ImportRoadmapModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [includeResources, setIncludeResources] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorMessage('');
      
      // Try to read the file to check if it has resources
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          const hasResources = parsedData.sections?.some(section => 
            section.resources && section.resources.length > 0
          );
          
          if (hasResources) {
            setIncludeResources(true);
            toast.info('Resources detected in roadmap. "Include resources" option has been enabled.');
          }
        } catch (error) {
          // Just ignore errors here, validation will happen during import
          console.log('Error pre-parsing file:', error);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const validateRoadmapFile = (data) => {
    if (!data.title) {
      throw new Error('Invalid roadmap file: Missing title');
    }
    if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
      throw new Error('Invalid roadmap file: Missing or empty sections');
    }
    return true;
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMessage('Please select a file to import');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const roadmapData = JSON.parse(event.target.result);
          
          // Validate the file structure
          validateRoadmapFile(roadmapData);
          
          // Import the roadmap
          const result = await importRoadmap(roadmapData, includeResources);
          
          toast.success('Roadmap imported successfully!');
          setFile(null);
          onSuccess(result.data);
          onClose();
        } catch (error) {
          console.error('Error parsing or importing roadmap:', error);
          setErrorMessage(error.message || 'Failed to import roadmap. Please check the file format.');
          toast.error('Failed to import roadmap');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setErrorMessage('Error reading file');
        setIsLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing roadmap:', error);
      setErrorMessage('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const downloadSampleRoadmap = () => {
    const sampleRoadmap = {
      title: "Sample React Learning Roadmap",
      description: "A comprehensive roadmap to learn React from beginner to advanced level",
      category: "Web Development",
      difficulty: "Intermediate",
      sections: [
        {
          title: "JavaScript Fundamentals",
          description: "Master the core JavaScript concepts needed for React development",
          resources: [
            {
              title: "JavaScript Crash Course",
              url: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
              type: "video",
              description: "Learn JavaScript fundamentals in 1 hour",
              thumbnailUrl: "https://i.ytimg.com/vi/hdI2bqOjy3c/hqdefault.jpg",
              source: "YouTube",
              duration: 3600,
              isRequired: true
            }
          ]
        },
        {
          title: "React Basics",
          description: "Learn the fundamentals of React including components, props, and state",
          resources: []
        }
      ],
      advancedTopics: [
        {
          title: "React Performance Optimization",
          description: "Advanced techniques to optimize React application performance"
        }
      ],
      projects: [
        {
          title: "Todo Application",
          description: "Build a simple todo application with React",
          difficulty: "beginner"
        }
      ]
    };
    
    const jsonData = JSON.stringify(sampleRoadmap, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_roadmap.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Sample roadmap downloaded');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Import Roadmap</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Roadmap JSON File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaFileImport className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JSON files only</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={includeResources}
                onChange={() => setIncludeResources(!includeResources)}
              />
              <span className="ml-2 text-gray-700">Include resources (if available)</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              If checked, resources from the imported roadmap will be included. Otherwise, only the roadmap structure will be imported.
            </p>
          </div>
          
          <div className="mb-6">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FaInfoCircle className="mr-1" /> 
              {showHelp ? 'Hide format information' : 'How to format your roadmap JSON'}
            </button>
            
            {showHelp && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-gray-700">
                <p className="mb-2">Your roadmap JSON file should include:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                  <li><strong>title</strong>: The name of your roadmap</li>
                  <li><strong>description</strong>: A brief description</li>
                  <li><strong>sections</strong>: An array of learning topics</li>
                  <li><strong>advancedTopics</strong> (optional): Advanced concepts</li>
                  <li><strong>projects</strong> (optional): Practice projects</li>
                </ul>
                <button
                  onClick={downloadSampleRoadmap}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <FaDownload className="mr-1" /> Download sample roadmap JSON
                </button>
              </div>
            )}
          </div>
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                'Import Roadmap'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportRoadmapModal; 