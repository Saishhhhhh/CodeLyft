// const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

let currentKeyIndex = 0;

/**
 * Get the next available Groq API key
 * @returns {string} The next API key to use
 */
const getNextGroqApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
  return GROQ_API_KEYS[currentKeyIndex];
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_RATE_LIMIT_DELAY = 5000; // Increase delay to 5 seconds
const GROQ_MAX_RETRIES = 3;

import { roadmapData } from '../data/roadmapData';

export const validateLearningTopic = async (topic) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
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

      if (response.status === 429) { // Rate limit
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          throw new Error('Max retries reached for Groq API');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to validate learning topic');
      }

      const data = await response.json();
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
      if (retryCount < GROQ_MAX_RETRIES - 1) {
        retryCount++;
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
        continue;
      }
      throw error;
    }
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
    // Get relevant roadmap context
    const roadmapContext = getQuestionsContext(topic);
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEYS[currentKeyIndex]}`,
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
3. Third question should ask about their specific goals or focus areas within the topic
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
3. "What specific type of web applications are you interested in building? (e.g., e-commerce, social media, business applications)"

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

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();
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
    throw error;
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
  
  // Fix common JSON syntax errors before parsing
  // 1. Fix missing commas after properties (common issue in LLM outputs)
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*")/g, '"$1": "$2",\n  "');
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*})/g, '"$1": "$2"\n  }');
  fixedJson = fixedJson.replace(/"([^"]+)"\s*:\s*([^",\s\n\r\t{}]+)\s*(\n\s*")/g, '"$1": $2,\n  "');
  
  // 2. Fix the specific issue seen in logs - missing comma between description and difficulty
  fixedJson = fixedJson.replace(/"description"\s*:\s*"([^"]*)"\s*"difficulty"/g, '"description": "$1", "difficulty"');
  
  return fixedJson;
}

export const generateLearningRoadmap = async (userData) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      console.log("Generating roadmap with user data:", userData);
      
      // Get relevant roadmap.sh context
      const roadmapShContext = getRoadmapShContext(userData.topic);
      
      const requestBody = {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `Create a simple, straightforward learning roadmap for the requested topic. You have access to validated learning paths from roadmap.sh that you should use as a reference.

${roadmapShContext}

Follow these guidelines:
1. Present the roadmap as a SEQUENTIAL PATH of technologies to learn (e.g., HTML → CSS → JavaScript → React → Node.js)
2. Each technology should be its own separate section with NO SUBTOPICS
3. Each section should contain exactly ONE topic representing the complete technology
4. For each technology, provide a brief description of what it is and why it's important
5. Organize everything in a logical learning progression from beginner to advanced
6. Use the roadmap.sh data as a reference for valid technology sequences

IMPORTANT:
- Follow the provided JSON schema EXACTLY - do not add or modify properties
- Do not include URLs, time estimates, or resource links
- Keep everything extremely simple and high-level
- Ensure the JSON is valid and properly formatted without any syntax errors
- Every opening bracket MUST have a matching closing bracket
- Count and verify that your [ and ] brackets are balanced
- Count and verify that your { and } brackets are balanced
- Each technology in the path should be its own item in the mainPath array
- Every item MUST have title, description, and difficulty fields with proper "key": "value" format
- Include prerequisites, advanced topics, and practice projects
- DOUBLE-CHECK YOUR JSON STRUCTURE before returning

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

My time commitment: ${userData.timeCommitment}

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
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", response.status);
      
      if (response.status === 429) { // Rate limit
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          throw new Error('Max retries reached for Groq API');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to generate roadmap: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Received response from Groq API:", responseData);
      
      const content = responseData.choices[0].message.content;
      console.log("Roadmap content:", content);
      
      // Use the simplified parsing approach
      const simplifiedRoadmap = parseSimplifiedRoadmap(content);
      
      return simplifiedRoadmap;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      
      if (retryCount < GROQ_MAX_RETRIES - 1 && error.message.includes('429')) {
        retryCount++;
        console.log(`Retrying after error (${retryCount}/${GROQ_MAX_RETRIES})...`);
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
        continue;
      }
      
      throw error;
    }
  }
};

// Simplified roadmap parsing without keyword-specific debugging
function parseSimplifiedRoadmap(content) {
  try {
    // Extract JSON content from markdown code blocks
    let jsonContent = content;
    console.log("Original content length:", content.length);
    
    if (content.includes('```')) {
      console.log("Found code block in response");
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonContent = codeBlockMatch[1].trim();
        console.log("Extracted JSON from code block, length:", jsonContent.length);
      }
    }

    // Fix common JSON syntax errors before parsing
    // 1. Fix missing commas after properties (common issue in LLM outputs)
    jsonContent = jsonContent.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*")/g, '"$1": "$2",\n  "');
    jsonContent = jsonContent.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*(\n\s*})/g, '"$1": "$2"\n  }');
    jsonContent = jsonContent.replace(/"([^"]+)"\s*:\s*([^",\s\n\r\t{}]+)\s*(\n\s*")/g, '"$1": $2,\n  "');
    
    // 2. Fix the specific issue seen in logs - missing comma between description and difficulty
    jsonContent = jsonContent.replace(/"description"\s*:\s*"([^"]*)"\s*"difficulty"/g, '"description": "$1", "difficulty"');

    // Try to parse the JSON
    const parsedContent = JSON.parse(jsonContent);
    
    console.log("Successfully parsed roadmap JSON:", {
      hasMainPath: !!parsedContent.mainPath,
      mainPathLength: parsedContent.mainPath ? parsedContent.mainPath.length : 0,
      hasPrerequisites: !!parsedContent.prerequisites,
      hasAdvancedTopics: !!parsedContent.advancedTopics,
      advancedTopicsLength: parsedContent.advancedTopics ? parsedContent.advancedTopics.length : 0,
      hasProjects: !!parsedContent.projects
    });

    // Convert the mainPath array to the sections format expected by the UI
    const sections = Array.isArray(parsedContent.mainPath) ? 
      parsedContent.mainPath.map(item => ({
        title: item.title || "Technology",
        description: item.description || "Learn this technology",
        difficulty: item.difficulty || 'beginner',
        topics: [{
          title: `Complete ${item.title || "Technology"}`,
          description: item.description || `Learn ${item.title || "technology"} fundamentals`
        }]
      })) : [];

    // Create the roadmap structure for the UI
    const roadmap = {
      title: parsedContent.title || "Learning Roadmap",
      description: parsedContent.description || "A comprehensive learning guide",
      sections: sections,
      prerequisites: parsedContent.prerequisites || [],
      advancedTopics: parsedContent.advancedTopics || [],
      projects: parsedContent.projects || []
    };

    return roadmap;
  } catch (error) {
    console.error('Error parsing roadmap JSON:', error);
    console.error('Error occurred at:', error.stack);
    
    // Log a snippet of the content for debugging
    if (typeof content === 'string') {
      const snippetLength = 200;
      const contentStart = content.substring(0, snippetLength);
      const contentEnd = content.length > snippetLength ? 
        content.substring(content.length - snippetLength) : '';
      
      console.error(`Content start (${snippetLength} chars):`, contentStart);
      if (contentEnd) {
        console.error(`Content end (${snippetLength} chars):`, contentEnd);
      }
      
      // Check for common JSON issues
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      
      console.error('JSON balance check:', {
        braces: `${openBraces}:{, ${closeBraces}:} - ${openBraces === closeBraces ? 'balanced' : 'unbalanced'}`,
        brackets: `${openBrackets}:[, ${closeBrackets}:] - ${openBrackets === closeBrackets ? 'balanced' : 'unbalanced'}`
      });
      
      // Try a more aggressive approach to fix the JSON
      try {
        // Attempt to manually fix the specific error from the logs
        if (content.includes('"description": "') && content.includes('"difficulty":')) {
          const fixedContent = content.replace(/"description"\s*:\s*"([^"]*)"\s*"difficulty"/g, '"description": "$1", "difficulty"');
          const parsedFixed = JSON.parse(fixedContent);
          console.log("Successfully parsed after fixing missing comma between description and difficulty");
          
          // Convert to the expected format
          const sections = Array.isArray(parsedFixed.mainPath) ? 
            parsedFixed.mainPath.map(item => ({
              title: item.title || "Technology",
              description: item.description || "Learn this technology",
              difficulty: item.difficulty || 'beginner',
              topics: [{
                title: `Complete ${item.title || "Technology"}`,
                description: item.description || `Learn ${item.title || "technology"} fundamentals`
              }]
            })) : [];
          
          return {
            title: parsedFixed.title || "Learning Roadmap",
            description: parsedFixed.description || "A comprehensive learning guide",
            sections: sections,
            prerequisites: parsedFixed.prerequisites || [],
            advancedTopics: parsedFixed.advancedTopics || [],
            projects: parsedFixed.projects || []
          };
        }
      } catch (fixError) {
        console.error("Failed to fix JSON with manual approach:", fixError);
      }
    }
    
    // Return null instead of a default roadmap
    return null;
  }
}

export const evaluateVideoRelevance = async (videoTitle, videoDescription, topic) => {
  let retryCount = 0;
  let currentKey = GROQ_API_KEYS[currentKeyIndex];
  
  while (retryCount < GROQ_MAX_RETRIES) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a video relevance evaluator. Your task is to determine if a video is relevant to a given learning topic.

              Rules for evaluation:
              1. Consider both the video title and description
              2. Look for semantic relevance, not just exact keyword matches
              3. Consider alternative terms and related concepts
              4. Evaluate the depth and scope of the content
              5. Consider the target audience and skill level

              For example:
              - A video titled "SQL Tutorial for Beginners" is relevant to "Database with SQL"
              - A video about "Python Basics" is relevant to "Python Programming"
              - A video about "Web Development" is relevant to "Frontend Development"

              Respond with a JSON object containing:
              {
                "isRelevant": boolean,
                "relevanceScore": number (0-1),
                "reason": "explanation of why it is or isn't relevant",
                "suggestedTitle": "how the title could be improved if not relevant"
              }

              IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`
            },
            {
              role: 'user',
              content: `Evaluate if this video is relevant to the topic "${topic}":

              Title: ${videoTitle}
              Description: ${videoDescription}`
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (response.status === 429) { // Rate limit
        retryCount++;
        if (retryCount < GROQ_MAX_RETRIES) {
          console.log(`Groq API rate limit reached. Rotating API key and retrying...`);
          currentKey = getNextGroqApiKey();
          await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
          continue;
        } else {
          throw new Error('Max retries reached for Groq API');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to evaluate video relevance');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean and parse the response
      let cleanContent = content
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      
      try {
        const relevanceResult = JSON.parse(cleanContent);
        
        // Validate the structure
        if (typeof relevanceResult.isRelevant !== 'boolean' ||
            typeof relevanceResult.relevanceScore !== 'number' ||
            typeof relevanceResult.reason !== 'string') {
          throw new Error('Invalid response structure');
        }
        
        return relevanceResult;
      } catch (parseError) {
        console.error('Failed to parse relevance result:', parseError);
        console.log('Raw content:', content);
        
        // Try to extract values using regex as fallback
        const isRelevantMatch = cleanContent.match(/"isRelevant"\s*:\s*(true|false)/);
        const scoreMatch = cleanContent.match(/"relevanceScore"\s*:\s*(\d+(?:\.\d+)?)/);
        const reasonMatch = cleanContent.match(/"reason"\s*:\s*"([^"]+)"/);
        const titleMatch = cleanContent.match(/"suggestedTitle"\s*:\s*"([^"]+)"/);
        
        if (isRelevantMatch && scoreMatch && reasonMatch) {
          return {
            isRelevant: isRelevantMatch[1] === 'true',
            relevanceScore: parseFloat(scoreMatch[1]),
            reason: reasonMatch[1],
            suggestedTitle: titleMatch ? titleMatch[1] : null
          };
        }
        
        throw new Error('Invalid response format from relevance evaluation');
      }
    } catch (error) {
      console.error('Error evaluating video relevance:', error);
      if (retryCount < GROQ_MAX_RETRIES - 1) {
        retryCount++;
        currentKey = getNextGroqApiKey();
        await new Promise(resolve => setTimeout(resolve, GROQ_RATE_LIMIT_DELAY));
        continue;
      }
      throw error;
    }
  }
}; 
