import { validateAndGenerateQuestions } from '../services/groqService';

// Safe localStorage access
const getLocalStorage = (key) => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch (e) {
    console.error('localStorage access error:', e);
    return null;
  }
};

const setLocalStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('localStorage access error:', e);
  }
};

const removeLocalStorage = (key) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('localStorage access error:', e);
  }
};

/**
 * Stores information about a prompt that needs validation after login
 * @param {string} prompt - The user's learning prompt to validate after login
 */
export const storePromptForValidation = (prompt) => {
  // Don't store empty prompts
  if (!prompt || !prompt.trim()) return;
  
  // Store the prompt for validation after login
  setLocalStorage('pendingPromptValidation', prompt);
  
  // Set a flag that we need to validate this prompt after login
  setLocalStorage('needsValidation', 'true');
};

/**
 * Checks if there's a pending prompt that needs validation after login
 * @returns {boolean} True if there's a pending prompt
 */
export const hasPendingPrompt = () => {
  return getLocalStorage('needsValidation') === 'true' && 
         !!getLocalStorage('pendingPromptValidation');
};

/**
 * Clears any pending prompt validation data
 */
export const clearPendingPrompt = () => {
  removeLocalStorage('pendingPromptValidation');
  removeLocalStorage('needsValidation');
};

/**
 * Validates a pending prompt and returns the result
 * @returns {Promise<Object>} Object with validation result and prompt
 */
export const validatePendingPrompt = async () => {
  try {
    // Get the pending prompt
    const prompt = getLocalStorage('pendingPromptValidation');
    
    if (!prompt) {
      return { 
        success: false, 
        error: 'No pending prompt found',
        prompt: null
      };
    }
    
    // Validate the prompt
    const result = await validateAndGenerateQuestions(prompt);
    
    // Clear pending prompt data
    clearPendingPrompt();
    
    return {
      success: true,
      isValid: result.validation.isValid,
      result,
      prompt
    };
  } catch (error) {
    console.error('Error validating pending prompt:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate prompt',
      prompt: getLocalStorage('pendingPromptValidation')
    };
  }
}; 