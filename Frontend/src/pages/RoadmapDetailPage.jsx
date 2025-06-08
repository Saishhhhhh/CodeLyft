import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoadmap } from '../services/roadmapService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaArrowLeft } from 'react-icons/fa';

const RoadmapDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        const response = await getRoadmap(id);
        
        // Instead of displaying the roadmap, redirect to the appropriate page
        // Check if this roadmap has any resources
        const hasResources = response.data.topics && 
                             response.data.topics.some(topic => topic.hasGeneratedResources);
        
        if (hasResources) {
          // Redirect to the resources page
          navigate(`/roadmaps/${id}/resources`, { replace: true });
        } else {
          // Redirect to the view page
          navigate(`/roadmaps/${id}/view`, { replace: true });
        }
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError('Failed to load the roadmap. Please try again later.');
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
          <button 
            onClick={() => navigate('/my-roadmaps')} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to My Roadmaps
          </button>
        </div>
      </div>
    );
  }

  // This component should never render anything beyond the loading or error states
  // as it will always redirect to a specific page
  return null;
};

export default RoadmapDetailPage; 