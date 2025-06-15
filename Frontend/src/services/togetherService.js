import axios from 'axios';

// API keys from environment variables
const API_KEYS = [
  import.meta.env.VITE_TOGETHER_API_KEY_1,
  import.meta.env.VITE_TOGETHER_API_KEY_2,
  import.meta.env.VITE_TOGETHER_API_KEY_3,
  import.meta.env.VITE_TOGETHER_API_KEY_4,
  import.meta.env.VITE_TOGETHER_API_KEY_5
];

class TogetherService {
  constructor() {
    this.currentKeyIndex = 0;
    this.baseURL = 'https://api.together.xyz/v1';
  }

  // Get the current API key
  getCurrentKey() {
    return API_KEYS[this.currentKeyIndex];
  }

  // Rotate to the next API key
  rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % API_KEYS.length;
    console.log(`Rotated to API key ${this.currentKeyIndex + 1}`);
    return this.getCurrentKey();
  }

  // Create headers with the current API key
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.getCurrentKey()}`,
      'Content-Type': 'application/json'
    };
  }

  // Send a chat completion request
  async createChatCompletion(messages, options = {}) {
    const defaultOptions = {
      model: "deepseek-ai/DeepSeek-V3",
      max_tokens: 1000,
      temperature: 0.7,
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    // Try up to 5 times (once with each key)
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`, 
          {
            messages,
            ...requestOptions
          },
          { headers: this.getHeaders() }
        );
        
        return response.data;
      } catch (error) {
        console.error(`Error with API key ${this.currentKeyIndex + 1}:`, error.message);
        
        // Check if it's a rate limit, insufficient balance or auth error
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error?.message || '';
        
        if (
          status === 401 || // Unauthorized
          status === 429 || // Rate limited
          status === 403 || // Forbidden
          status === 404 || // Not Found
          status === 400 || // Bad Request
          errorMsg.includes('rate limit') ||
          errorMsg.includes('insufficient') ||
          errorMsg.includes('balance')
        ) {
          // Rotate to the next key
          this.rotateKey();
          
          // If we've tried all keys, throw the error
          if (attempt === API_KEYS.length - 1) {
            throw new Error('All API keys exhausted. Please try again later.');
          }
          
          // Otherwise, continue to the next attempt
          continue;
        }
        
        // For other types of errors, just throw
        throw error;
      }
    }
  }
}

// Create a singleton instance
const togetherService = new TogetherService();

export default togetherService; 