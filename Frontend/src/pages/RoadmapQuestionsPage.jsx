import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroAnimation from '../components/HeroAnimation';
import { generateLearningQuestions, validateAndGenerateQuestions } from '../services/groqService';
import { hasPendingPrompt, validatePendingPrompt, clearPendingPrompt, storePromptForValidation } from '../utils/authRedirectUtils';
import { useTheme } from '../context/ThemeContext';
import LoadingAnimation from '../components/common/LoadingAnimation';

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
  const { darkMode } = useTheme();

  // Define colors based on theme - Using the provided color palette from HomePage
  const colors = {
    // Primary and accent colors
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    codeBg: darkMode ? '#0F172A' : '#F3F4F6', // Dark blue-black / Light gray
    codeText: darkMode ? '#4F46E5' : '#4F46E5', // Indigo for consistency
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  useEffect(() => {
    // Check if we have a pending learning topic from before login
    if (hasPendingPrompt()) {
      // Process the pending topic
      const processPendingTopic = async () => {
        setLoading(true);
        try {
          const validationResult = await validatePendingPrompt();
          
          if (validationResult.success && validationResult.isValid) {
            // Store extracted topic and questions
            localStorage.setItem('learningTopic', validationResult.result.validation.extractedTopic);
            setLearningTopic(validationResult.result.validation.extractedTopic);
            setQuestions(validationResult.result.questions);
          } else if (validationResult.success && !validationResult.isValid) {
            // If validation fails, redirect back to home but preserve the prompt
            // Store the prompt again so it's available on the home page
            if (validationResult.prompt) {
              storePromptForValidation(validationResult.prompt);
            }
            
            // Navigate to home with error state
            navigate('/', { 
              state: { 
                validationError: validationResult.result.validation.reason,
                prompt: validationResult.prompt,
                preservePrompt: true
              }
            });
            return;
          } else {
            // If there was an error, use the raw input as fallback
            if (validationResult.prompt) {
              localStorage.setItem('learningTopic', validationResult.prompt);
              setLearningTopic(validationResult.prompt);
              
              // Generate fallback questions
              const result = await generateLearningQuestions(validationResult.prompt);
              setQuestions(result.questions);
            } else {
              // If no prompt is available, redirect to home
              navigate('/');
              return;
            }
          }
        } catch (error) {
          console.error('Error processing pending topic:', error);
          
          // If there was an error but we still have the prompt, preserve it
          const pendingPrompt = localStorage.getItem('pendingPromptValidation');
          if (pendingPrompt) {
            storePromptForValidation(pendingPrompt);
          }
          
          navigate('/');
          return;
        } finally {
          // Only clear pending prompt if validation was successful
          // Otherwise keep it for the home page
          if (!navigate.state?.preservePrompt) {
            clearPendingPrompt();
          }
          setLoading(false);
        }
      };
      
      processPendingTopic();
      return;
    }
    
    // If no pending topic, continue with normal flow
    // Get the learning topic from localStorage
    const storedTopic = localStorage.getItem('learningTopic');
    if (!storedTopic) {
      // If there's no topic, redirect back to the home page
      navigate('/');
      return;
    }
    setLearningTopic(storedTopic);
    
    // Check for pre-generated questions first
    const preGeneratedQuestions = localStorage.getItem('preGeneratedQuestions');
    if (preGeneratedQuestions) {
      try {
        const parsedQuestions = JSON.parse(preGeneratedQuestions);
        if (Array.isArray(parsedQuestions) && parsedQuestions.length === 3) {
          setQuestions(parsedQuestions);
          setLoading(false);
          // Clear the pre-generated questions so they're not used again
          localStorage.removeItem('preGeneratedQuestions');
          return;
        }
      } catch (error) {
        console.error('Error parsing pre-generated questions:', error);
      }
    }
    
    // If no pre-generated questions, generate them now
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
          `How much content would you like included in your ${storedTopic} roadmap? (e.g., just essentials, balanced approach, or comprehensive coverage)`
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
        contentAmount: answers.question3
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
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <LoadingAnimation 
            type="inline" 
            variant="roadmap" 
            message="Generating personalized questions..." 
            size="small"
          />
        </div>
      );
    }

    if (questions.length > 0) {
      return (
        <div className="space-y-4">
          <label 
            htmlFor={`question-${currentQuestion + 1}`}
            className="block text-xl sm:text-2xl font-semibold font-poppins"
            style={{ color: colors.text }}
          >
            {questions[currentQuestion]}
          </label>
          <textarea
            id={`question-${currentQuestion + 1}`}
            value={answers[`question${currentQuestion + 1}`] || ''}
            onChange={handleTextChange}
            placeholder="Type your answer here..."
            className="w-full p-4 sm:p-6 rounded-xl shadow-lg text-base sm:text-lg font-mukta resize-none"
            style={{ 
              color: colors.text, 
              backgroundColor: colors.cardBg,
              borderWidth: '2px',
              borderColor: darkMode ? colors.border : colors.primary + '40',
              borderStyle: 'solid'
            }}
            rows={4}
            aria-label={questions[currentQuestion]}
          />
          
          {/* ProTip for the third question */}
          {currentQuestion === 2 && (
            <div className="mt-4 p-3 sm:p-4 rounded-lg bg-opacity-20 flex items-start gap-2 sm:gap-3"
                 style={{ 
                   backgroundColor: darkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.1)',
                   borderLeft: '3px solid rgb(79, 70, 229)'
                 }}>
              <div className="shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="rgb(79, 70, 229)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base" style={{ color: colors.text }}>ProTip</p>
                <p className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>
                  For the best learning experience, consider choosing "comprehensive coverage" 
                  which provides a more complete roadmap with in-depth resources.
                </p>
              </div>
            </div>
          )}
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
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300" 
      style={{ 
        background: darkMode 
          ? `linear-gradient(to bottom, ${colors.background}, #0F172A)` 
          : `linear-gradient(to bottom, #FFF7ED, #FFFFFF)` 
      }}>
      <HeroAnimation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-16">
        <div className="rounded-xl shadow-lg p-4 sm:p-6 md:p-8 transition-colors duration-300"
             style={{ 
               backgroundColor: colors.cardBg,
               boxShadow: `0 10px 25px -5px ${colors.shadow}`
             }}>
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center font-poppins bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent"
            style={{
              '--primary': 'rgb(79, 70, 229)',
              '--accent': 'rgb(139, 92, 246)',
            }}
          >
            Let's Personalize Your {learningTopic} Roadmap
          </h1>
          
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between mb-2">
              {[0, 1, 2].map((step) => (
                <div 
                  key={step} 
                  className={`h-1.5 rounded-full mx-1 transition-all duration-500 ${step === currentQuestion ? 'w-full' : 'w-full'}`}
                  style={{ 
                    backgroundColor: step === currentQuestion 
                      ? colors.primary 
                      : darkMode ? colors.border : '#E5E7EB'
                  }}
                  role="progressbar"
                  aria-valuenow={step}
                  aria-valuemin="0"
                  aria-valuemax={2}
                />
              ))}
            </div>
            <p className="text-center mt-3 font-mukta text-sm sm:text-base"
               style={{ color: colors.textMuted }}>
              {getProgressText()}
            </p>
          </div>
          
          <div>
            {renderQuestion()}
            
            <div className="flex justify-between mt-8 sm:mt-10">
              {currentQuestion > 0 && (
                <button
                  type="button"
                  onClick={goToPrevQuestion}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-sm text-sm sm:text-base transition-all"
                  style={{ 
                    color: darkMode ? colors.textMuted : colors.text,
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: `2px solid ${darkMode ? colors.border : colors.border}`
                  }}
                  aria-label="Go to previous question"
                >
                  Back
                </button>
              )}
              
              <div className={`${currentQuestion > 0 ? 'ml-auto' : 'mx-auto'}`}>
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  disabled={!answers[`question${currentQuestion + 1}`]?.trim()}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-sm text-sm sm:text-base transition-all ${
                    answers[`question${currentQuestion + 1}`]?.trim()
                      ? 'hover:shadow-lg transform hover:scale-105 transition-all bg-gradient-to-r from-[var(--primary-btn)] to-[var(--accent-btn)] text-white'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{ 
                    '--primary-btn': answers[`question${currentQuestion + 1}`]?.trim() ? 'rgb(79, 70, 229)' : 'transparent',
                    '--accent-btn': answers[`question${currentQuestion + 1}`]?.trim() ? 'rgb(139, 92, 246)' : 'transparent',
                    backgroundColor: !answers[`question${currentQuestion + 1}`]?.trim() 
                      ? darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)' 
                      : undefined,
                    color: !answers[`question${currentQuestion + 1}`]?.trim() 
                      ? darkMode ? colors.textMuted : '#6B7280'
                      : undefined
                  }}
                  aria-label={currentQuestion === 2 ? 'Generate roadmap' : 'Go to next question'}
                >
                  {currentQuestion === 2 ? 'Generate Roadmap' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapQuestionsPage; 