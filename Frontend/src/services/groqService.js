// const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Track API call metrics
const apiMetrics = {
  calls: 0,
  successes: 0,
  failures: 0,
  totalTokens: 0,
  latencies: [],
  callTypes: {}
};

/**
 * Track an API call for metrics
 * @param {string} callType - Type of API call (e.g., 'validate', 'questions', 'combined')
 * @param {number} latency - Call latency in ms
 * @param {boolean} success - Whether the call succeeded
 * @param {number} tokens - Total tokens used (if available)
 */
const trackApiCall = (callType, latency, success, tokens = 0) => {
  apiMetrics.calls++;
  if (success) apiMetrics.successes++;
  else apiMetrics.failures++;
  
  apiMetrics.totalTokens += tokens;
  apiMetrics.latencies.push(latency);
  
  // Track by call type
  if (!apiMetrics.callTypes[callType]) {
    apiMetrics.callTypes[callType] = { calls: 0, totalLatency: 0, tokens: 0 };
  }
  
  apiMetrics.callTypes[callType].calls++;
  apiMetrics.callTypes[callType].totalLatency += latency;
  apiMetrics.callTypes[callType].tokens += tokens;
  
  console.log(`API Metrics - Total Calls: ${apiMetrics.calls}, Avg Latency: ${getAverageLatency().toFixed(2)}ms`);
  console.log(`Call Type: ${callType}, Success: ${success}, Latency: ${latency.toFixed(2)}ms`);
};

/**
 * Get average API call latency
 * @returns {number} Average latency in ms
 */
const getAverageLatency = () => {
  if (apiMetrics.latencies.length === 0) return 0;
  return apiMetrics.latencies.reduce((sum, val) => sum + val, 0) / apiMetrics.latencies.length;
};

/**
 * Get API metrics summary
 * @returns {Object} API usage metrics
 */
export const getApiMetrics = () => {
  return {
    ...apiMetrics,
    averageLatency: getAverageLatency(),
    callTypeBreakdown: Object.entries(apiMetrics.callTypes).map(([type, data]) => ({
      type,
      calls: data.calls,
      averageLatency: data.calls > 0 ? data.totalLatency / data.calls : 0,
      averageTokens: data.calls > 0 ? data.tokens / data.calls : 0
    }))
  };
};

// OpenRouter API keys for video/content relevance checks
const OPENROUTER_API_KEYS = [
  import.meta.env.VITE_OPENROUTER_API_KEY_1,
  import.meta.env.VITE_OPENROUTER_API_KEY_2,
  import.meta.env.VITE_OPENROUTER_API_KEY_3
];

let openRouterKeyIndex = 0;

/**
 * Get the next available OpenRouter API key
 * @returns {string} The next API key to use
 */
const getNextOpenRouterApiKey = () => {
  openRouterKeyIndex = (openRouterKeyIndex + 1) % OPENROUTER_API_KEYS.length;
  return OPENROUTER_API_KEYS[openRouterKeyIndex];
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_RATE_LIMIT_DELAY = 5000; // 5 seconds
const API_MAX_RETRIES = 3;

import { roadmapData } from '../data/roadmapData';

export const validateLearningTopic = async (topic) => {
    try {
      const startTime = performance.now();
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a learning topic validator. Your task is to:
              1. Extract the main learning topic from the user's input, even if it's in natural language
              2. Determine if it's a valid technology or skill that can be learned
              3. If multiple topics are mentioned, focus on the main one

              Valid examples include:
              - Programming languages (Python, JavaScript)
              - Frameworks (React, Django)
              - Technologies (Docker, Kubernetes)
              - Development stacks (MERN, MEAN, LAMP)
              - Specific skills (Data Science, Machine Learning)
              - Broad topics (Web Development, Mobile Development)

              Invalid examples include:
              - General questions (how to make friends)
              - Personal problems
              - Non-technical topics

              Respond with a JSON object containing:
              {
                "isValid": boolean,
                "extractedTopic": "the main topic extracted from the input",
                "reason": "explanation of why it's valid or invalid",
                "example": "a valid example if the input is invalid"
              }

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
              content: topic
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      const endTime = performance.now();
      const latency = endTime - startTime;
      let success = false;
      let tokens = 0;

      if (response.status === 429) {
        trackApiCall('validate', latency, false);
        throw new Error('Rate limit reached. Please try again in a few moments.');
      }

      if (!response.ok) {
        trackApiCall('validate', latency, false);
        throw new Error(`Failed to validate learning topic: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      tokens = data.usage?.total_tokens || 0;
      success = true;
      trackApiCall('validate', latency, success, tokens);
      
      const content = data.choices[0].message.content;
      
      // Clean the response content
      let cleanContent = content
        // Remove any markdown formatting
        .replace(/```json\n?|\n?```/g, '')
        // Remove any whitespace at the start and end
        .trim();
      
      // If the content starts with text rather than a JSON object, extract just the JSON part
      if (!cleanContent.startsWith('{')) {
        const jsonStartIndex = cleanContent.indexOf('{');
        if (jsonStartIndex > -1) {
          cleanContent = cleanContent.substring(jsonStartIndex);
        }
      }
      
      // If the content ends with text after the JSON object, remove it
      const lastBraceIndex = cleanContent.lastIndexOf('}');
      if (lastBraceIndex > -1 && lastBraceIndex < cleanContent.length - 1) {
        cleanContent = cleanContent.substring(0, lastBraceIndex + 1);
      }
      
      try {
        // First try to parse the content as is
        const validationResult = JSON.parse(cleanContent);
        
        // Validate the structure of the result
        if (typeof validationResult.isValid !== 'boolean' ||
            typeof validationResult.extractedTopic !== 'string' ||
            typeof validationResult.reason !== 'string') {
          throw new Error('Invalid response structure');
        }
        
        return validationResult;
      } catch (parseError) {
        console.error('Failed to parse validation result:', parseError);
        console.log('Raw content:', content);
        
        // Try to extract the values using regex as a fallback
        const isValidMatch = cleanContent.match(/"isValid"\s*:\s*(true|false)/);
        const topicMatch = cleanContent.match(/"extractedTopic"\s*:\s*"([^"]+)"/);
        const reasonMatch = cleanContent.match(/"reason"\s*:\s*"([^"]+)"/);
        const exampleMatch = cleanContent.match(/"example"\s*:\s*(null|"[^"]*")/);
        
        if (isValidMatch && topicMatch && reasonMatch) {
          return {
            isValid: isValidMatch[1] === 'true',
            extractedTopic: topicMatch[1],
            reason: reasonMatch[1],
            example: exampleMatch ? (exampleMatch[1] === 'null' ? null : exampleMatch[1].slice(1, -1)) : null
          };
        }
        
        throw new Error('Invalid response format from validation service');
      }
    } catch (error) {
      console.error('Error validating learning topic:', error);
    throw {
      message: 'Unable to validate your learning topic. Please try again later.',
      originalError: error.message
    };
  }
};

// Helper function to get relevant roadmap context for questions
function getQuestionsContext(topic) {
  // Find matching roadmaps
  const matchingRoadmaps = findMatchingRoadmaps(topic);
  
  // Get the actual roadmap data for the matching roadmaps
  const relevantRoadmaps = roadmapData.role_based.filter(roadmap => 
    matchingRoadmaps.includes(roadmap.title)
  ).concat(
    roadmapData.skill_based.filter(roadmap => 
      matchingRoadmaps.includes(roadmap.title)
    )
  );
        
  // Format the context for the LLM
  let context = "RELEVANT LEARNING PATHS FROM ROADMAP.SH:\n\n";
  
  if (relevantRoadmaps.length === 0) {
    // If no exact match, include some general paths that might be relevant
    const generalRoadmaps = ['Frontend Beginner', 'Backend Beginner', 'Full Stack'];
    relevantRoadmaps.push(...roadmapData.role_based.filter(roadmap => 
      generalRoadmaps.includes(roadmap.title)
    ));
        }
        
  relevantRoadmaps.forEach(roadmap => {
    context += `${roadmap.title} Path:\n`;
    if (roadmap.sections) {
      // Include only the first few sections to keep context focused
      roadmap.sections.slice(0, 5).forEach((section, index) => {
        context += `${index + 1}. ${section.title}`;
        if (section.items && section.items.length > 0) {
          context += ` - ${section.items.map(item => item.title).join(', ')}`;
        }
        context += '\n';
      });
    }
    context += '\n';
  });

  return context;
  }

export const generateLearningQuestions = async (topic) => {
  try {
    const startTime = performance.now();
    
    // Get relevant roadmap context
    const roadmapContext = getQuestionsContext(topic);
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a learning path generator. Your task is to generate 3 relevant questions to help create a personalized learning roadmap for the given topic.

${roadmapContext}

Rules for generating questions:
1. First question should ask about their current experience level with the topic and related technologies
2. Second question should ask about their preferred learning path/stack based on the roadmap.sh data
3. Third question should ask about how much content they would like included in their roadmap (e.g., "Just the essentials", "Balanced approach", "Comprehensive coverage", "Quick overview", "Deep dive")
            4. Questions should be specific to the topic and help gather information for creating a personalized roadmap
5. Use the roadmap.sh data to inform your questions about:
   - Relevant technology stacks and paths
   - Common prerequisites and dependencies
   - Typical learning progressions
   - Important focus areas
            6. Keep questions clear and concise
7. Make questions specific to the learning paths shown in the roadmap.sh data

For example, if the topic is "Web Development" and the roadmap shows Frontend and Backend paths:
1. "What is your current experience with HTML, CSS, and JavaScript? Have you worked with any frontend frameworks?"
2. "Would you prefer to focus on frontend development (React, Vue), backend development (Node.js, Python), or full-stack development?"
3. "How much content would you like included in your web development roadmap? (e.g., just essentials, balanced approach, or comprehensive coverage)"

            Respond with a JSON object containing:
            {
              "questions": [
                "first question",
                "second question",
                "third question"
              ]
            }

            IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
          },
          {
            role: 'user',
            content: topic
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const endTime = performance.now();
    const latency = endTime - startTime;
    let success = false;
    let tokens = 0;

    if (response.status === 429) {
      trackApiCall('questions', latency, false);
      throw new Error('Rate limit reached. Please try again in a few moments.');
    }

    if (!response.ok) {
      trackApiCall('questions', latency, false);
      throw new Error(`Failed to generate questions: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    tokens = data.usage?.total_tokens || 0;
    success = true;
    trackApiCall('questions', latency, success, tokens);
    
    const content = data.choices[0].message.content;
    
    // Clean the response content by removing any markdown formatting
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const questionsResult = JSON.parse(cleanContent);
      return questionsResult;
    } catch (parseError) {
      console.error('Failed to parse questions result:', parseError);
      console.log('Raw content:', content);
      throw new Error('Invalid response format from questions service');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw {
      message: 'Unable to generate learning questions. Please try again later.',
      originalError: error.message
    };
  }
};

// Helper function to find the best matching roadmap
function findMatchingRoadmaps(topic) {
  const topicLower = topic.toLowerCase();
  
  // Define topic categories and their related roadmaps
  const topicCategories = {
    // Frontend related
    frontend: ['Frontend', 'Frontend Beginner', 'React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'React Native', 'Flutter', 'Design System'],
    // Backend related
    backend: ['Backend', 'Backend Beginner', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'Spring Boot', 'ASP.NET Core'],
    // Full stack
    fullstack: ['Full Stack', 'MERN', 'MEAN', 'LAMP'],
    // DevOps related
    devops: ['DevOps', 'DevOps Beginner', 'Docker', 'Kubernetes', 'AWS', 'Cloudflare', 'Linux', 'Terraform'],
    // Database related
    database: ['PostgreSQL', 'MongoDB', 'Redis', 'SQL'],
    // Mobile development
    mobile: ['Android', 'iOS', 'React Native', 'Flutter'],
    // AI/ML related
    ai: ['AI and Data Scientist', 'AI Engineer', 'AI Agents', 'MLOps', 'Prompt Engineering', 'AI Red Teaming'],
    // Data related
    data: ['Data Analyst', 'Data Structures', 'Computer Science'],
    // Design related
    design: ['UX Design', 'Design System'],
    // Security related
    security: ['Cyber Security'],
    // Game development
    game: ['Client Side Game Dev.', 'Server Side Game Dev.'],
    // Other specific technologies
    specific: ['GraphQL', 'Git and GitHub', 'C++', 'Blockchain']
  };

  // Find matching categories for the topic
  const matchingCategories = Object.entries(topicCategories)
    .filter(([_, roadmaps]) => 
      roadmaps.some(roadmap => 
        roadmap.toLowerCase().includes(topicLower) ||
        topicLower.includes(roadmap.toLowerCase())
      )
    )
    .map(([category, _]) => category);

  // Get all relevant roadmaps from matching categories
  const relevantRoadmaps = new Set();
  matchingCategories.forEach(category => {
    topicCategories[category].forEach(roadmap => relevantRoadmaps.add(roadmap));
  });

  // Also check for direct matches in the roadmap titles
  roadmapData.role_based.forEach(roadmap => {
    if (roadmap.title.toLowerCase().includes(topicLower) ||
        topicLower.includes(roadmap.title.toLowerCase())) {
      relevantRoadmaps.add(roadmap.title);
    }
  });

  roadmapData.skill_based.forEach(roadmap => {
    if (roadmap.title.toLowerCase().includes(topicLower) ||
        topicLower.includes(roadmap.title.toLowerCase())) {
      relevantRoadmaps.add(roadmap.title);
    }
  });

  return Array.from(relevantRoadmaps);
}

// Helper function to process roadmap.sh data
function getRoadmapShContext(topic) {
  // Find matching roadmaps
  const matchingRoadmaps = findMatchingRoadmaps(topic);
  
  // Get the actual roadmap data for the matching roadmaps
  const relevantRoadmaps = roadmapData.role_based.filter(roadmap => 
    matchingRoadmaps.includes(roadmap.title)
  ).concat(
    roadmapData.skill_based.filter(roadmap => 
      matchingRoadmaps.includes(roadmap.title)
    )
  );

  // Format the context for the LLM
  let context = "VALIDATED LEARNING PATHS FROM ROADMAP.SH:\n\n";
  
  if (relevantRoadmaps.length === 0) {
    context += "No exact roadmap found for this topic, but here are some general learning paths that might be relevant:\n\n";
    // Include some general roadmaps that might be helpful
    const generalRoadmaps = ['Frontend Beginner', 'Backend Beginner', 'Full Stack'];
    relevantRoadmaps.push(...roadmapData.role_based.filter(roadmap => 
      generalRoadmaps.includes(roadmap.title)
    ));
  }

  relevantRoadmaps.forEach(roadmap => {
    context += `${roadmap.title} Path:\n`;
    if (roadmap.sections) {
      roadmap.sections.forEach((section, index) => {
        context += `${index + 1}. ${section.title}`;
        if (section.items && section.items.length > 0) {
          context += ` - ${section.items.map(item => item.title).join(', ')}`;
        }
        context += '\n';
      });
    }
    context += '\n';
  });

  return context;
}

// Function to pre-validate and clean JSON format from Groq
function prepareApiResponse(content) {
  // Extract JSON content from markdown code blocks
  let jsonContent = content;
  if (content.includes('```')) {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonContent = codeBlockMatch[1].trim();
    }
  }
  
  // Balance brackets before attempting further processing
  const openBraces = (jsonContent.match(/{/g) || []).length;
  const closeBraces = (jsonContent.match(/}/g) || []).length;
  const openBrackets = (jsonContent.match(/\[/g) || []).length;
  const closeBrackets = (jsonContent.match(/\]/g) || []).length;
  
  console.log(`Bracket counts - Open braces: ${openBraces}, Close braces: ${closeBraces}, Open brackets: ${openBrackets}, Close brackets: ${closeBrackets}`);
  
  // Fix bracket imbalances
  let fixedJson = jsonContent;
  
  // Fix brace imbalance
  if (openBraces > closeBraces) {
    fixedJson += '}'.repeat(openBraces - closeBraces);
  }
  
  // Fix bracket imbalance
  if (openBrackets > closeBrackets) {
    // Find where brackets should be closed
    let tempContent = fixedJson;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      const lastArrayPos = tempContent.lastIndexOf('[');
      if (lastArrayPos !== -1) {
        // Find the position where this array should be closed
        let depth = 1;
        let closePos = -1;
        for (let j = lastArrayPos + 1; j < tempContent.length; j++) {
          if (tempContent[j] === '[') depth++;
          else if (tempContent[j] === ']') depth--;
          
          if (depth === 0) {
            closePos = j;
            break;
          }
        }
        
        if (closePos !== -1) {
          // Mark this position so we don't find it again
          tempContent = tempContent.substring(0, lastArrayPos) + ' ' + tempContent.substring(lastArrayPos + 1);
        }
      }
    }
    fixedJson += ']'.repeat(openBrackets - closeBrackets);
  } else if (closeBrackets > openBrackets) {
    // Remove extra closing brackets - this is trickier and might cause issues
    // For simplicity, we'll just add matching opening brackets at the start
    fixedJson = '['.repeat(closeBrackets - openBrackets) + fixedJson;
  }
  
  // STEP 1: Fix common JSON syntax errors
  
  // Fix the specific issue we're observing - duplicated colons in property names
  // From: "title": ": "Learning Roadmap for MERN Stack", " => "title": "Learning Roadmap for MERN Stack"
  fixedJson = fixedJson.replace(/"([^"]+)":\s*":\s*"([^"]+)",\s*"/g, '"$1": "$2", "');
  fixedJson = fixedJson.replace(/"([^"]+)":\s*":\s*"([^"]+)"\s*([,}])/g, '"$1": "$2"$3');
  
  // Fix property name format issues with extra colons - new pattern from logs
  fixedJson = fixedJson.replace(/"([^"]+)":\s*"([^"]+)",\s*"([^"]+)/g, '"$1": "$2", "$3');
  fixedJson = fixedJson.replace(/"\s*:\s*"([^"]+)"\s*,/g, '"$1", '); // ": "name", => "name",
  fixedJson = fixedJson.replace(/"\s*:\s*"([^"]+)"\s*}/g, '"$1"}');   // ": "name"} => "name"}
  
  // More aggressive fix for property name issues
  fixedJson = fixedJson.replace(/"([^"]+)":\s*"([^"]+)"\s*,\s*"/g, '"$1": "$2", "');
  
  // Fix missing commas after properties
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*")/g, '"$1": "$2",\n  "');
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*})/g, '"$1": "$2"\n  }');
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*([^",\s\n\r\t{}]+)\s*(\n\s*")/g, '"$1": $2,\n  "');
  
  // Fix the specific issue seen in logs - missing comma between description and difficulty
  fixedJson = fixedJson.replace(/"description"\s*:\s*"([^"]*)"\s*"difficulty"/g, '"description": "$1", "difficulty"');
  
  return fixedJson;
}

/**
 * Generate a learning roadmap with retry logic
 * @param {Object} data - User data for roadmap generation
 * @param {number} attempt - Current attempt number (for internal retry tracking)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Object} Generated roadmap data
 */
export const generateRoadmapWithRetry = async (data, attempt = 1, maxRetries = 5) => {
  try {
    console.log(`Attempt ${attempt} to generate roadmap`);
    const result = await generateLearningRoadmap(data);
    
    if (result === null) {
      throw new Error('Failed to generate roadmap - null result');
    }
    
    return result;
  } catch (error) {
    console.error(`Attempt ${attempt} failed:`, error);
    
    if (attempt < maxRetries) {
      console.log(`Retrying... (${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateRoadmapWithRetry(data, attempt + 1, maxRetries);
    }
    
    throw error;
  }
};

export const generateLearningRoadmap = async (userData) => {
    try {
      console.log("Generating roadmap with user data:", userData);
      
      // Get relevant roadmap.sh context
      const roadmapShContext = getRoadmapShContext(userData.topic);
      
      const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Create a simple, straightforward learning roadmap for the requested topic. You have access to validated learning paths from roadmap.sh that you should use as a reference.

${roadmapShContext}

Follow these guidelines:
1. Present the roadmap as a SEQUENTIAL PATH of CONCRETE TOOLS, LIBRARIES, and PLATFORMS to learn (e.g., HTML → CSS → Bootstrap → JavaScript → React → Node.js → Express.js → MongoDB)
2. Focus EXCLUSIVELY on specific technologies, libraries, frameworks, and tools - NOT abstract domains or concepts
3. Always include essential general tools like Git/GitHub that are relevant to the field
4. Each technology should be its own separate section with NO SUBTOPICS
5. Each section should contain exactly ONE specific tool/library/framework representing the complete technology
6. Organize everything in a logical learning progression from foundational to advanced
7. Include MORE items in the roadmap (12-15 items) if relevant to provide a comprehensive learning path
8. Use the roadmap.sh data as a reference for valid technology sequences

EXTREMELY IMPORTANT JSON FORMATTING RULES:
- Follow the provided JSON schema EXACTLY - do not add or modify properties
- Do not include URLs, time estimates, or resource links
- Keep everything extremely simple and high-level
- Ensure the JSON is valid and properly formatted without any syntax errors
- MAKE SURE YOUR JSON CAN BE PARSED with JSON.parse() - this is critical!
- Never place a bare value without a property name (like "intermediate" by itself)
- Every property must have both a name and a value separated by a colon (e.g., "difficulty": "intermediate")
- Every property-value pair in an object must be followed by either a comma or a closing brace
- Every object in an array must be followed by either a comma or a closing bracket
- Every opening bracket MUST have a matching closing bracket
- Count and verify that your [ and ] brackets are balanced
- Count and verify that your { and } brackets are balanced
- Each technology in the path should be its own item in the mainPath array
- The projects array must always be an array with square brackets [], even if empty
- Every item MUST have title, description, and difficulty fields with proper "key": "value" format
- COMPARE your final JSON against the provided example to ensure it has the same structure
- DO NOT use colons within property names!

COMMON JSON ERRORS TO AVOID:
- Missing commas between properties
- Missing property names before values
- Missing colons between property names and values
- Unbalanced brackets and braces
- Double inclusion of the same property
- Properties outside of objects
- Missing difficulty property on mainPath items
- Duplicated colons (like "title": ": "value") - this is a serious error!

The roadmap should follow this EXACT schema:
{
  "title": "Learning Roadmap for [Topic]",
  "description": "A simple guide to learning [Topic]",
  "mainPath": [
    {
      "title": "HTML",
      "description": "Brief description of HTML",
      "difficulty": "beginner"
    },
    {
      "title": "Git",
      "description": "Brief description of Git",
      "difficulty": "beginner"
    }
  ],
  "prerequisites": [
    {
      "title": "Required Prerequisite",
      "description": "Why it's needed"
    }
  ],
  "advancedTopics": [
    {
      "title": "Advanced Topic",
      "description": "What to learn later"
    }
  ],
  "projects": [
    {
      "title": "Practice Project",
      "description": "Project description",
      "difficulty": "beginner"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `I want to learn ${userData.topic}.

My current experience level: ${userData.experienceLevel}

My learning goals: ${userData.learningGoal}

Content amount preference: ${userData.contentAmount}

Please create a simple roadmap with valid JSON syntax that covers just the main technologies/topics I need to learn. Include prerequisites, advanced topics, and practice projects.`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      };
      
      console.log("Sending request to Groq API with body:", JSON.stringify(requestBody));
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", response.status);
      
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please try again in a few moments.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to generate roadmap: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received response from Groq API:", data);
      
      const content = data.choices[0].message.content;
      console.log("Roadmap content:", content);
      
      // First try to use prepareApiResponse to clean up the JSON
      const preparedContent = prepareApiResponse(content);
      
      try {
        // First try to parse using native JSON.parse
        const parsedRoadmap = JSON.parse(preparedContent);
        console.log("Successfully parsed roadmap JSON");
        
        // Ensure we have a sections array that matches the mainPath
        if (parsedRoadmap.mainPath && !parsedRoadmap.sections) {
          parsedRoadmap.sections = parsedRoadmap.mainPath.map(item => ({
            title: item.title,
            description: item.description,
            difficulty: item.difficulty,
            topics: [{ title: item.title, description: item.description }]
          }));
        }
        
        return parsedRoadmap;
      } catch (parseError) {
        console.error("Error parsing fixed JSON:", parseError);
        
        // If JSON parsing fails, use the previously implemented simplified parsing functions
  try {
    // Extract JSON content from markdown code blocks
    let jsonContent = content;
    
    if (content.includes('```')) {
      console.log("Found code block in response");
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonContent = codeBlockMatch[1].trim();
            }
          }
          
          // Try more aggressive fixes for the specific issue we're seeing
          jsonContent = jsonContent.replace(/":\s*"/g, '":"'); // Fix double colons in properties
          jsonContent = jsonContent.replace(/,\s*"/g, ',"'); // Fix spacing after commas
          
          // Specific fix for the pattern seen in the logs - duplicate colons in property names
          // From: "title": ": "Learning Roadmap for MERN Stack" => "title": "Learning Roadmap for MERN Stack"
          jsonContent = jsonContent.replace(/"([^"]+)":\s*":\s*"/g, '"$1": "');
          
          // Fix missing "description": in Git section, a common error from LLM
          jsonContent = jsonContent.replace(/"Git",\s*"([^"]+)",/g, '"Git", "description": "$1",');
          jsonContent = jsonContent.replace(/"Git",\s*"([^"]+)"\s*}/g, '"Git", "description": "$1" }');
          
          // More general fix for any key missing the "description" property name
          jsonContent = jsonContent.replace(/"([^"]+)",\s*"([^"]+)",\s*"difficulty"/g, '"$1", "description": "$2", "difficulty"');
          jsonContent = jsonContent.replace(/"([^"]+)",\s*"([^"]+)"\s*}/g, '"$1", "description": "$2" }');
          
          // Try to parse the fixed content
          const fixedParsedRoadmap = JSON.parse(jsonContent);
          console.log("Successfully parsed roadmap JSON after more aggressive fixes");
          
          // Ensure we have a sections array that matches the mainPath
          if (fixedParsedRoadmap.mainPath && !fixedParsedRoadmap.sections) {
            fixedParsedRoadmap.sections = fixedParsedRoadmap.mainPath.map(item => ({
              title: item.title,
              description: item.description,
              difficulty: item.difficulty,
              topics: [{ title: item.title, description: item.description }]
            }));
          }
          
          return fixedParsedRoadmap;
        } catch (secondParseError) {
          console.error("Failed to parse roadmap JSON with aggressive fixes:", secondParseError);
          console.log("Raw content:", content);
          
          // As a last resort, return a simplified minimal roadmap structure
          const fallbackRoadmap = {
            title: `Learning Roadmap for ${userData.topic}`,
            description: `A guide to learning ${userData.topic} based on your experience level: ${userData.experienceLevel || 'Beginner'} and goals: ${userData.learningGoal || 'Complete understanding'}`,
            sections: [
              {
                title: userData.topic,
                description: `Learn ${userData.topic} fundamentals`,
                difficulty: "beginner",
                topics: [
                  {
                    title: userData.topic,
                    description: `Learn ${userData.topic} fundamentals based on your preferences`
                  }
                ]
              }
            ],
            mainPath: [
              {
                title: userData.topic,
                description: `Learn ${userData.topic} fundamentals`,
                difficulty: "beginner"
              }
            ],
            prerequisites: [],
            advancedTopics: [
              {
                title: `Advanced ${userData.topic}`,
                description: "More advanced concepts to explore later"
              }
            ],
            projects: [
              {
                title: `Practice ${userData.topic} Project`,
                description: "A project to apply your knowledge",
                difficulty: "intermediate"
              }
            ]
          };
          
          console.log("Returning emergency fallback roadmap structure");
          
          // Ensure we have a sections array that matches the mainPath
          if (fallbackRoadmap.mainPath && !fallbackRoadmap.sections) {
            fallbackRoadmap.sections = fallbackRoadmap.mainPath.map(item => ({
              title: item.title,
              description: item.description,
              difficulty: item.difficulty,
              topics: [{ title: item.title, description: item.description }]
            }));
          }
          
          return fallbackRoadmap;
        }
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw {
        message: 'Unable to generate learning roadmap. Please try again later.',
        originalError: error.message
      };
    }
  }

/**
 * Validates a learning topic and generates questions in a single API call
 * @param {string} topic - The learning topic to validate and generate questions for
 * @returns {Promise<Object>} - Object containing validation result and questions
 */
export const validateAndGenerateQuestions = async (topic) => {
  try {
    const startTime = performance.now();
    
    // Get relevant roadmap context
    const roadmapContext = getQuestionsContext(topic);
    
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
            content: `You are both a learning topic validator and question generator for creating personalized learning roadmaps. You have two tasks:

TASK 1 - VALIDATE THE TOPIC:
1. Extract the main learning topic from the user's input, even if it's in natural language
2. Determine if it's a valid technology or skill that can be learned
3. If multiple topics are mentioned, focus on the main one
4. Respond with validation information

Valid topics include:
- Programming languages (Python, JavaScript)
- Frameworks (React, Django)
- Technologies (Docker, Kubernetes)
- Development stacks (MERN, MEAN, LAMP)
- Specific skills (Data Science, Machine Learning)
- Broad topics (Web Development, Mobile Development)

Invalid topics include:
- General questions (how to make friends)
- Personal problems
- Non-technical topics

TASK 2 - GENERATE QUESTIONS:
If the topic is valid, generate 3 relevant questions to help create a personalized learning roadmap using this context:

${roadmapContext}

Rules for generating questions:
1. First question should ask about their current experience level with the topic and related technologies
2. Second question should ask about their preferred learning path/stack based on the roadmap.sh data
3. Third question should ask about how much content they would like included in their roadmap (e.g., "Just the essentials", "Balanced approach", "Comprehensive coverage", "Quick overview", "Deep dive")
4. Questions should be specific to the topic and help gather information for creating a personalized roadmap
5. Use the roadmap.sh data to inform your questions about:
   - Relevant technology stacks and paths
   - Common prerequisites and dependencies
   - Typical learning progressions
   - Important focus areas
6. Keep questions clear and concise
7. Make questions specific to the learning paths shown in the roadmap.sh data

Example questions for "Web Development":
1. "What is your current experience with HTML, CSS, and JavaScript? Have you worked with any frontend frameworks?"
2. "Would you prefer to focus on frontend development (React, Vue), backend development (Node.js, Python), or full-stack development?"
3. "How much content would you like included in your web development roadmap? (e.g., just essentials, balanced approach, or comprehensive coverage)"

Respond with a JSON object containing BOTH validation and questions:
{
  "validation": {
    "isValid": boolean,
    "extractedTopic": "the main topic extracted from the input",
    "reason": "explanation of why it's valid or invalid",
    "example": "a valid example if the input is invalid"
  },
  "questions": [
    "first question",
    "second question",
    "third question"
  ]
}

Note: The "questions" array should be populated only if isValid is true. If isValid is false, return an empty array for questions.

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
            content: topic
            }
          ],
        temperature: 0.5,
        max_tokens: 400
        })
      });

    const endTime = performance.now();
    const latency = endTime - startTime;
    let success = false;
    let tokens = 0;

    if (response.status === 429) {
      trackApiCall('combined', latency, false);
      throw new Error('Rate limit reached. Please try again in a few moments.');
      }

      if (!response.ok) {
      trackApiCall('combined', latency, false);
      throw new Error(`Failed to validate topic and generate questions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
    tokens = data.usage?.total_tokens || 0;
    success = true;
    trackApiCall('combined', latency, success, tokens);
    
      const content = data.choices[0].message.content;
      
    // Clean the response content
      let cleanContent = content
      // Remove any markdown formatting
        .replace(/```json\n?|\n?```/g, '')
      // Remove any whitespace at the start and end
        .trim();
      
    // If the content starts with text rather than a JSON object, extract just the JSON part
    if (!cleanContent.startsWith('{')) {
      const jsonStartIndex = cleanContent.indexOf('{');
      if (jsonStartIndex > -1) {
        cleanContent = cleanContent.substring(jsonStartIndex);
      }
    }
    
    // If the content ends with text after the JSON object, remove it
    const lastBraceIndex = cleanContent.lastIndexOf('}');
    if (lastBraceIndex > -1 && lastBraceIndex < cleanContent.length - 1) {
      cleanContent = cleanContent.substring(0, lastBraceIndex + 1);
    }
    
    try {
      // Parse the content as JSON
      const result = JSON.parse(cleanContent);
      
      // Validate the structure of the result
      if (typeof result.validation?.isValid !== 'boolean' ||
          typeof result.validation?.extractedTopic !== 'string' ||
          typeof result.validation?.reason !== 'string' ||
          !Array.isArray(result.questions)) {
          throw new Error('Invalid response structure');
        }
        
      return result;
      } catch (parseError) {
      console.error('Failed to parse validation and questions result:', parseError);
        console.log('Raw content:', content);
      throw new Error('Invalid response format from service');
      }
    } catch (error) {
    console.error('Error validating topic and generating questions:', error);
    throw {
      message: 'Unable to validate your learning topic and generate questions. Please try again later.',
      originalError: error.message
    };
  }
}; 
