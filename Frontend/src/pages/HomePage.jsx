import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { validateAndGenerateQuestions } from '../services/groqService';

const HomePage = () => {
  const [learningTopic, setLearningTopic] = useState('');
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    try {
      // Start the timer
      const startTime = performance.now();
      
      const result = await validateAndGenerateQuestions(learningTopic);
      
      // End the timer and log the duration
      const endTime = performance.now();
      console.log(`Combined validation and question generation took ${(endTime - startTime).toFixed(2)} ms`);
      
      if (!result.validation.isValid) {
        setError({
          message: result.validation.reason,
          example: result.validation.example
        });
        setIsValidating(false);
        return;
      }

      // Store both the extracted learning topic and questions in localStorage
      localStorage.setItem('learningTopic', result.validation.extractedTopic);
      localStorage.setItem('preGeneratedQuestions', JSON.stringify(result.questions));
      
      // Navigate to the questions page
      navigate('/questions');
    } catch (error) {
      setError({
        message: 'Failed to validate your input. Please try again.',
        example: 'Try entering a specific technology like "React" or "Python"'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      {/* Animation Background */}
      <HeroAnimation />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-poppins" style={{
            background: 'linear-gradient(to right, #EA580C, #9333EA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Learn Anything for Free. Structured. Smart.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-10 font-mukta">
            Get personalized learning paths and the best YouTube resources based on what you want to learn.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-16">
            <div className="flex flex-col items-center">
              <textarea
                value={learningTopic}
                onChange={(e) => {
                  setLearningTopic(e.target.value);
                  setError(null);
                }}
                placeholder="What do you want to learn? (e.g., MERN stack, DevOps, React, or be more specific about your goals...)"
                className={`w-full p-6 rounded-xl border-2 focus:outline-none shadow-lg text-lg font-mukta resize-none mb-4 ${
                  error ? 'border-red-500' : 'border-orange-200 focus:border-orange-400'
                }`}
                rows={4}
                required
              />
              {error && (
                <div className="w-full mb-4 p-6 bg-red-50 border border-red-200 rounded-xl text-left">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800 font-poppins mb-2">
                        Invalid Learning Topic
                      </h3>
                      <p className="text-red-600 font-mukta mb-3">
                        {error.message}
                      </p>
                      <div className="bg-white p-4 rounded-lg border border-red-100">
                        <p className="text-gray-700 font-mukta mb-2">
                          <span className="font-semibold">Try this instead:</span>
                        </p>
                        <p className="text-gray-600 font-mukta">
                          {error.example}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isValidating}
                className={`text-white px-8 py-3 rounded-xl font-medium shadow-md text-lg ${
                  isValidating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                style={{
                  background: 'linear-gradient(to right, #F97316, #9333EA)',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  if (!isValidating) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #EA580C, #7E22CE)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #F97316, #9333EA)';
                }}
              >
                {isValidating ? 'Validating...' : 'Generate My Roadmap'}
              </button>
            </div>
          </form>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* First feature card */}
            <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#F97316">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center font-poppins">Personalized Roadmaps</h3>
              <p className="text-gray-600 text-center font-mukta">Custom learning paths tailored to your experience level and goals</p>
            </div>
            
            {/* Second feature card */}
            <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#9333EA">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center font-poppins">Curated YouTube Content</h3>
              <p className="text-gray-600 text-center font-mukta">The best free videos and playlists, organized for optimal learning</p>
            </div>
            
            {/* Third feature card */}
            <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#16A34A">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center font-poppins">Progress Tracking</h3>
              <p className="text-gray-600 text-center font-mukta">Track your learning journey with intuitive checklists and milestones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 