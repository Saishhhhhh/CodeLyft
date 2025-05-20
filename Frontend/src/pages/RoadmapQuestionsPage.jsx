import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { generateLearningQuestions } from '../services/groqService';

const RoadmapQuestionsPage = () => {
  const [learningTopic, setLearningTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0); // 0, 1, 2
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const formSubmitted = useRef(false);
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: ''
  });

  useEffect(() => {
    // Get the learning topic from localStorage
    const storedTopic = localStorage.getItem('learningTopic');
    if (!storedTopic) {
      // If there's no topic, redirect back to the home page
      navigate('/');
      return;
    }
    setLearningTopic(storedTopic);
    
    // Generate questions based on the topic
    const generateQuestions = async () => {
      setLoading(true);
      try {
        const result = await generateLearningQuestions(storedTopic);
        setQuestions(result.questions);
      } catch (error) {
        console.error('Failed to generate questions:', error);
        // Fallback to default questions if generation fails
        setQuestions([
          `What's your current experience level with ${storedTopic}?`,
          `What's your main goal for learning ${storedTopic}?`,
          `How much time can you dedicate each week to learning ${storedTopic}?`
        ]);
      } finally {
        setLoading(false);
      }
    };

    generateQuestions();
  }, [navigate]);

  const handleTextChange = (e) => {
    const questionKey = `question${currentQuestion + 1}`;
    setAnswers(prev => ({
      ...prev,
      [questionKey]: e.target.value
    }));
  };

  const goToNextQuestion = () => {
    // Make sure we have an answer for the current question
    const currentAnswer = answers[`question${currentQuestion + 1}`];
    if (!currentAnswer || !currentAnswer.trim()) {
      return; // Don't proceed if no answer
    }
    
    // If on the last question, proceed directly to roadmap generation
    if (currentQuestion === 2) {
      // Store answers in localStorage for the next page
      localStorage.setItem('questionAnswers', JSON.stringify(answers));
      localStorage.setItem('questionsTopic', learningTopic);
      
      // Prepare data for roadmap generation
      const roadmapData = {
        topic: learningTopic,
        experienceLevel: answers.question1,
        learningGoal: answers.question2,
        timeCommitment: answers.question3
      };
      
      // Store for the results page
      localStorage.setItem('roadmapData', JSON.stringify(roadmapData));
      
      // Navigate directly to the roadmap results page
      navigate('/roadmap');
      return;
    }
    
    // Move to next question
    setCurrentQuestion(currentQuestion + 1);
  };

  const goToPrevQuestion = () => {
    setCurrentQuestion(currentQuestion - 1);
  };

  // Render the current text question
  const renderQuestion = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600 font-mukta">Generating personalized questions...</p>
        </div>
      );
    }

    if (questions.length > 0) {
      return (
        <div className="space-y-4">
          <label 
            htmlFor={`question-${currentQuestion + 1}`}
            className="block text-2xl font-semibold font-poppins"
          >
            {questions[currentQuestion]}
          </label>
          <textarea
            id={`question-${currentQuestion + 1}`}
            value={answers[`question${currentQuestion + 1}`] || ''}
            onChange={handleTextChange}
            placeholder="Type your answer here..."
            className="w-full p-6 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none shadow-lg text-lg font-mukta resize-none"
            rows={4}
            aria-label={questions[currentQuestion]}
          />
        </div>
      );
    }
    
    return null;
  };

  // Get progress indicator text
  const getProgressText = () => {
    return `Step ${currentQuestion + 1} of 3: Tell Us About Your Learning Goals`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      <HeroAnimation />
      
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-8 text-center font-poppins" style={{
            background: 'linear-gradient(to right, #EA580C, #9333EA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Let's Personalize Your {learningTopic} Roadmap
          </h1>
          
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[0, 1, 2].map((step) => (
                <div 
                  key={step} 
                  className={`h-1.5 rounded-full mx-1 transition-all duration-500 ${step === currentQuestion ? 'w-full bg-orange-500' : 'w-full bg-gray-200'}`}
                  role="progressbar"
                  aria-valuenow={step}
                  aria-valuemin="0"
                  aria-valuemax={2}
                />
              ))}
            </div>
            <p className="text-center text-gray-500 font-mukta mt-3">
              {getProgressText()}
            </p>
          </div>
          
          <div>
            {renderQuestion()}
            
            <div className="flex justify-between mt-10">
              {currentQuestion > 0 && (
                <button
                  type="button"
                  onClick={goToPrevQuestion}
                  className="text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium shadow-sm text-base hover:bg-gray-50"
                  aria-label="Go to previous question"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={goToNextQuestion}
                disabled={!answers[`question${currentQuestion + 1}`]?.trim()}
                className="text-white px-6 py-3 rounded-xl font-medium shadow-md text-base ml-auto"
                style={{
                  background: 'linear-gradient(to right, #F97316, #9333EA)',
                  transition: 'all 0.3s ease',
                  opacity: !answers[`question${currentQuestion + 1}`]?.trim() ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (answers[`question${currentQuestion + 1}`]?.trim()) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #EA580C, #7E22CE)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #F97316, #9333EA)';
                }}
                aria-label={currentQuestion === 2 ? "Generate your personalized roadmap" : "Go to next question"}
              >
                {currentQuestion === 2 ? "Generate My Roadmap" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapQuestionsPage; 