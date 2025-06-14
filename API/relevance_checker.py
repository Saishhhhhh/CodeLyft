"""
Relevance Checker API - Batch processing with Groq LLM for title relevance checking
"""

import os
import json
import re
import logging
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Relevance Checker API",
    description="API for checking title relevance using Groq LLM (batch processing)",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Load environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Try to reload environment variables if not found
if not GROQ_API_KEY:
    try:
        # Force reload environment variables
        from dotenv import load_dotenv
        load_dotenv(override=True)
        GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    except ImportError:
        pass

# Log API key status
if GROQ_API_KEY:
    logger.info("GROQ_API_KEY is set")
    # Show first few characters of the key for verification (don't show the full key)
    masked_key = GROQ_API_KEY[:4] + "..." + GROQ_API_KEY[-4:] if len(GROQ_API_KEY) > 8 else "***"
    logger.info(f"Using GROQ_API_KEY: {masked_key}")
else:
    logger.error("GROQ_API_KEY is not set - API calls will fail")

# Log model information
logger.info(f"Using GROQ_MODEL: {GROQ_MODEL}")
logger.info(f"Using GROQ_API_URL: {GROQ_API_URL}")

# Request and response models
class RelevanceRequest(BaseModel):
    title: str
    technology: str

class BatchRelevanceRequest(BaseModel):
    titles: List[str]
    technology: str

class RelevanceResponse(BaseModel):
    isRelevant: bool
    similarity: float
    explanation: str

class BatchRelevanceResponse(BaseModel):
    results: List[Dict[str, Any]]

# Load title examples from JSON file
GOOD_EXAMPLES = []
BAD_EXAMPLES = []

try:
    # Determine the path to the JSON file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'title_examples.json')
    
    # Load examples from JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        examples_data = json.load(f)
        GOOD_EXAMPLES = examples_data.get('good_examples', [])
        BAD_EXAMPLES = examples_data.get('bad_examples', [])
    
    logger.info(f"Loaded examples from JSON file: {len(GOOD_EXAMPLES)} good examples, {len(BAD_EXAMPLES)} bad examples")
    
except Exception as e:
    logger.error(f"Error loading title examples from JSON: {e}")
    # Fallback to default examples
    GOOD_EXAMPLES = [
        "Complete TECH Tutorial for Beginners",
        "TECH Crash Course: Learn TECH in 90 Minutes",
        "Modern TECH: From Fundamentals to Advanced",
        "TECH Features and Syntax",
        "Learn TECH - Full Course for Beginners"
    ]
    
    BAD_EXAMPLES = [
        "Web Development Full Course",
        "Top 10 Programming Languages in 2023",
        "How to Become a Developer in 2023",
        "Coding Interview Preparation Guide",
        "Build a Portfolio Website from Scratch"
    ]
    logger.info("Using default examples due to JSON loading error")

def prepare_examples_for_technology(tech):
    """Prepare examples for a specific technology by replacing TECH placeholder"""
    tech_good_examples = []
    tech_bad_examples = BAD_EXAMPLES.copy()  # Bad examples don't need technology substitution
    
    # Replace TECH placeholder with the actual technology name
    for example in GOOD_EXAMPLES:
        tech_good_examples.append(example.replace("TECH", tech))
    
    return tech_good_examples, tech_bad_examples

def create_batch_prompt(titles, technology):
    """Create a prompt for batch processing of titles"""
    good_examples, bad_examples = prepare_examples_for_technology(technology)
    
    # Select a subset of examples to keep the prompt size manageable
    good_examples_subset = good_examples[:10]
    bad_examples_subset = bad_examples[:10]
    
    prompt = f"""You are evaluating whether YouTube playlist titles are relevant educational content for learning a specific technology.

Technology: {technology}

Here are examples of good educational titles for {technology}:
{json.dumps(good_examples_subset, indent=2)}

Here are examples of non-educational titles:
{json.dumps(bad_examples_subset, indent=2)}

IMPORTANT GUIDELINES:
1. Educational content should focus on teaching the technology, not just mentioning it.
2. Titles indicating complete courses, tutorials, or series are highly relevant.
3. Titles mentioning projects or practical applications are valuable educational content.
4. Content from well-known educational channels should be considered relevant even if the title is brief.
5. Language-specific indicators (like "in Hindi", "in English") are common in educational content.
6. Comparison videos (X vs Y), short overviews (X in 100 seconds), and interview questions are NOT educational content.
7. A title can be educational even if it doesn't explicitly contain words like "course" or "tutorial".
8. Channel names like "Chai", "WsCube Tech" etc. often indicate quality educational content.

STRICT RELEVANCE RULES:
1. The title MUST contain the SPECIFIC technology/topic name or a common abbreviation.
2. General web development courses are NOT relevant for specific topics like CSS, JavaScript, React, etc.
3. For a {technology} query, the playlist should be specifically about {technology}, not general web development.
4. Be STRICT - only accept playlists that are clearly focused on {technology}.

RECOGNIZE COMMON TECHNOLOGY NAME VARIATIONS:
- Recognize that "Node" and "Node.js" refer to the same technology
- Recognize that "CSS" and "Cascading Style Sheets" refer to the same technology
- Recognize that "JS" and "JavaScript" refer to the same technology
- Recognize that "TS" and "TypeScript" refer to the same technology
- Recognize that "React", "ReactJS", and "React.js" refer to the same technology
- Recognize that "Mongo" and "MongoDB" refer to the same technology
- Recognize that "Postgres" and "PostgreSQL" refer to the same technology

Please evaluate each of the following titles and determine if they are relevant educational content for learning {technology}.
For each title, provide:
1. A boolean "isRelevant" (true/false)
2. A confidence score "similarity" (0.0 to 1.0)
3. A brief "explanation" of your decision

Titles to evaluate:
{json.dumps(titles, indent=2)}

Respond with a JSON array where each element is an object with "title", "isRelevant", "similarity", and "explanation" fields.
"""

    return prompt

def call_groq_api(prompt):
    """Call the Groq LLM API with the given prompt"""
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set")
        # Instead of raising an error, return a structured response indicating the error
        return {
            "error": "GROQ_API_KEY is not set",
            "results": []
        }
    
    logger.info(f"Calling Groq API with model: {GROQ_MODEL}")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,  # Low temperature for more consistent results
        "response_format": {"type": "json_object"}
    }
    
    logger.info(f"API request data: {json.dumps(data, indent=2)}")
    
    try:
        logger.info(f"Sending request to Groq API: {GROQ_API_URL}")
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        
        # Log the raw response
        logger.info(f"Groq API response status: {response.status_code}")
        logger.info(f"Groq API response headers: {response.headers}")
        
        # Check for errors
        if response.status_code != 200:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            return {
                "error": f"Groq API returned error: {response.status_code}",
                "results": []
            }
        
        result = response.json()
        logger.info(f"Groq API result structure: {list(result.keys())}")
        
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        logger.info(f"Extracted content: {content[:100]}...")
        
        # Parse the JSON response
        try:
            parsed_result = json.loads(content)
            logger.info(f"Successfully parsed JSON response with keys: {list(parsed_result.keys())}")
            
            # Check if the response has the expected structure
            if "results" not in parsed_result:
                # Try to adapt the response format
                if isinstance(parsed_result, list):
                    # If it's a list, assume it's a list of results
                    return {"results": parsed_result}
                elif isinstance(parsed_result, dict):
                    # Check for evaluations key (from Groq API)
                    if "evaluations" in parsed_result:
                        logger.info(f"Found 'evaluations' key in response with {len(parsed_result['evaluations'])} items")
                        return {"results": parsed_result["evaluations"]}
                    # If it's a dict but missing 'results', create a results list
                    elif any(key in parsed_result for key in ["isRelevant", "title", "similarity"]):
                        # It looks like a single result
                        return {"results": [parsed_result]}
                    else:
                        # Create an empty results list
                        parsed_result["results"] = []
                
            return parsed_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {content}")
            logger.error(f"JSON parse error: {e}")
            
            # Return an empty result instead of raising an error
            return {
                "error": f"Invalid JSON response from Groq API: {e}",
                "results": []
            }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Groq API: {e}")
        
        # Return an empty result instead of raising an error
        return {
            "error": f"Error calling Groq API: {e}",
            "results": []
        }

def check_relevance(title: str, technology: str) -> Dict[str, Any]:
    """Check if a title is relevant to a technology using Groq LLM"""
    # Use batch processing with a single title
    batch_result = check_batch_relevance([title], technology)
    
    # Check if results exist and are not empty
    if not batch_result or "results" not in batch_result or not batch_result["results"]:
        # Fallback to simple rule-based approach if batch processing failed
        tech_lower = technology.lower()
        title_lower = title.lower()
        
        contains_tech = tech_lower in title_lower
        contains_tutorial = "tutorial" in title_lower or "course" in title_lower
        contains_negative = any(x in title_lower for x in ["vs", "versus", "in 100 seconds", "interview"])
        
        is_relevant = contains_tech and contains_tutorial and not contains_negative
        
        return {
            "title": title,
            "isRelevant": is_relevant,
            "similarity": 0.7 if is_relevant else 0.3,
            "explanation": f"Fallback method: Title {'contains' if contains_tech else 'does not contain'} {technology} and {'appears' if is_relevant else 'does not appear'} educational"
        }
    
    # Return the first result if available
    return batch_result["results"][0]

def check_batch_relevance(titles: List[str], technology: str) -> Dict[str, Any]:
    """Check if multiple titles are relevant to a technology using Groq LLM (batch processing)"""
    logger.info(f"Checking batch relevance for {len(titles)} titles with technology: '{technology}'")
    
    # Apply quick rejection rules first to save API calls
    results = []
    filtered_titles = []
    title_to_index = {}
    
    for i, title in enumerate(titles):
        # Check for obvious non-educational patterns
        if (re.search(r'\bvs\.?\s+|\bversus\b|\bin \d+ seconds\b|#shorts|interview questions|\b\d+ reasons why\b|^top \d+\b', title.lower())):
            pattern = re.search(r'\bvs\.?\s+|\bversus\b|\bin \d+ seconds\b|#shorts|interview questions|\b\d+ reasons why\b|^top \d+\b', title.lower()).group(0)
            logger.info(f"Title rejected by pattern match: '{title}' - pattern: '{pattern}'")
            results.append({
                "title": title,
                "isRelevant": False,
                "similarity": 0.0,
                "explanation": f"Title contains non-educational pattern: '{pattern}'"
            })
        # Check for obvious educational patterns
        elif (re.search(f"complete {technology.lower()} tutorial for beginners|{technology.lower()} full course|learn {technology.lower()} step by step", title.lower())):
            pattern = re.search(f"complete {technology.lower()} tutorial for beginners|{technology.lower()} full course|learn {technology.lower()} step by step", title.lower()).group(0)
            logger.info(f"Title accepted by pattern match: '{title}' - pattern: '{pattern}'")
            results.append({
                "title": title,
                "isRelevant": True,
                "similarity": 1.0,
                "explanation": f"Title contains strong educational pattern: '{pattern}'"
            })
        else:
            # Add to filtered titles for LLM processing
            title_to_index[title] = i
            filtered_titles.append(title)
    
    logger.info(f"Pre-filtering results: {len(results)} titles processed, {len(filtered_titles)} titles need LLM processing")
    
    # If there are titles that need LLM processing
    if filtered_titles:
        try:
            # Create prompt for batch processing
            prompt = create_batch_prompt(filtered_titles, technology)
            logger.info(f"Created prompt for {len(filtered_titles)} titles")
            
            # Call Groq API
            logger.info("Calling Groq API...")
            api_response = call_groq_api(prompt)
            
            # Check if there was an error in the API call
            if "error" in api_response:
                logger.error(f"Error from Groq API: {api_response.get('error')}")
                # If there was an error, use the rule-based fallback for all filtered titles
                raise ValueError(f"API error: {api_response.get('error')}")
            
            logger.info(f"Received API response: {json.dumps(api_response, indent=2)[:500]}...")
            
            # Process API response
            llm_results = api_response.get("results", [])
            logger.info(f"Extracted {len(llm_results)} results from API response")
            
            # If no results were returned, use the rule-based fallback
            if not llm_results:
                logger.warning("No results returned from API, using rule-based fallback")
                raise ValueError("No results returned from API")
            
            # Map LLM results back to original title indices
            for llm_result in llm_results:
                title = llm_result.get("title")
                if title in title_to_index:
                    logger.info(f"Processing LLM result for title: '{title}' - isRelevant: {llm_result.get('isRelevant', False)}")
                    results.insert(title_to_index[title], {
                        "title": title,
                        "isRelevant": llm_result.get("isRelevant", False),
                        "similarity": llm_result.get("similarity", 0.5),
                        "explanation": llm_result.get("explanation", "No explanation provided")
                    })
                else:
                    logger.warning(f"Title in LLM result not found in original titles: '{title}'")
            
            # Check if any titles were missed
            processed_titles = set(r.get("title") for r in results)
            missing_titles = set(titles) - processed_titles
            if missing_titles:
                logger.warning(f"Some titles were not processed: {missing_titles}")
                # Process missing titles with rule-based approach
                for title in missing_titles:
                    if title in title_to_index:
                        logger.info(f"Processing missing title with rule-based approach: '{title}'")
                        rule_based_result = rule_based_relevance_check(title, technology)
                        results.insert(title_to_index[title], rule_based_result)
                
        except Exception as e:
            logger.error(f"Error in LLM processing: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Fall back to simple heuristic for remaining titles
            logger.info(f"Falling back to rule-based approach for {len(filtered_titles)} titles")
            for title in filtered_titles:
                rule_based_result = rule_based_relevance_check(title, technology)
                results.insert(title_to_index[title], rule_based_result)
    
    logger.info(f"Final results: {len(results)} titles processed")
    return {"results": results}

def rule_based_relevance_check(title: str, technology: str) -> Dict[str, Any]:
    """
    Simple rule-based approach to check if a title is relevant to a technology
    
    Args:
        title: The title to check
        technology: The technology to check against
        
    Returns:
        dict: Result with relevance information
    """
    tech_lower = technology.lower()
    title_lower = title.lower()
    
    # Define common technology name variations
    tech_variations = {
        "react": ["react", "reactjs", "react.js", "react js"],
        "javascript": ["javascript", "js"],
        "typescript": ["typescript", "ts"],
        "python": ["python", "py"],
        "node": ["node", "nodejs", "node.js", "node js"],
        "angular": ["angular", "angularjs", "angular.js", "angular js"],
        "mongodb": ["mongodb", "mongo"],
        "postgresql": ["postgresql", "postgres"],
        "css": ["css", "cascading style sheets"],
        "html": ["html", "hypertext markup language"],
        "vue": ["vue", "vuejs", "vue.js", "vue js"]
    }
    
    # Check if the title contains the technology or its variations
    contains_tech = False
    
    # First, normalize the technology name
    normalized_tech = tech_lower
    for main_tech, variations in tech_variations.items():
        if tech_lower in variations:
            normalized_tech = main_tech
            break
    
    # Then check if the title contains the technology or any of its variations
    if normalized_tech in tech_variations:
        for variation in tech_variations[normalized_tech]:
            if variation in title_lower:
                contains_tech = True
                break
    else:
        # If technology doesn't have defined variations, check for direct match
        contains_tech = tech_lower in title_lower
    
    # Check for educational indicators
    educational_terms = [
        "tutorial", "course", "learn", "complete", "mastering", "beginner", 
        "advanced", "guide", "series", "lessons", "class", "training",
        "full course", "crash course", "bootcamp", "masterclass", "workshop",
        "projects", "project based", "hands-on", "practical", "code along",
        "from scratch", "zero to", "basics", "fundamentals", "essentials"
    ]
    
    contains_educational = any(term in title_lower for term in educational_terms)
    
    # Check for non-educational patterns
    negative_patterns = [
        "vs ", "versus", "in 100 seconds", "interview questions", 
        "top 10 ", "top 5 ", "comparison", "news"
    ]
    
    contains_negative = any(pattern in title_lower for pattern in negative_patterns)
    
    # Check for language-specific indicators
    language_indicators = [
        "in hindi", "in english", "in spanish", "in french", "in german",
        "hindi", "english", "spanish", "french", "german", "russian"
    ]
    
    contains_language = any(indicator in title_lower for indicator in language_indicators)
    
    # Check for quality educational channels
    quality_channels = [
        "traversy", "mosh", "academind", "net ninja", "freecodecamp",
        "web dev simplified", "coding train", "fireship", "wes bos",
        "chai", "love babbar", "code with harry", "thapa", "hitesh choudhary",
        "wscube", "apna college"
    ]
    
    is_quality_channel = any(channel in title_lower for channel in quality_channels)
    
    # Check if title is too broad
    broad_terms = ["web development", "web dev", "programming", "coding", "developer", "software engineering"]
    is_too_broad = any(term in title_lower for term in broad_terms) and not contains_tech
    
    # Determine relevance based on our rules
    is_relevant = (
        contains_tech and 
        (contains_educational or is_quality_channel) and 
        not contains_negative and
        not is_too_broad
    )
    
    # Calculate confidence score
    confidence = 0.0
    if contains_tech:
        confidence += 0.4
    else:
        # If it doesn't contain the technology, confidence should be very low
        confidence = 0.1
        
    if contains_educational:
        confidence += 0.3
    if is_quality_channel:
        confidence += 0.2
    if contains_language:
        confidence += 0.1
    if contains_negative:
        confidence -= 0.3
    if is_too_broad:
        confidence -= 0.3
    
    # Clamp confidence to [0.0, 1.0]
    confidence = max(0.0, min(1.0, confidence))
    
    # Generate explanation
    explanation_parts = []
    if contains_tech:
        explanation_parts.append(f"contains technology '{technology}'")
    else:
        explanation_parts.append(f"does not contain technology '{technology}'")
        
    if contains_educational:
        explanation_parts.append("contains educational terms")
    if is_quality_channel:
        explanation_parts.append("from a recognized quality channel")
    if contains_language:
        explanation_parts.append("language-specific tutorial")
    if contains_negative:
        explanation_parts.append("contains non-educational patterns")
    if is_too_broad:
        explanation_parts.append("too broad for specific technology")
    
    explanation = "Title " + ", ".join(explanation_parts)
    
    # Special case handling for specific examples
    if ("chai aur react" in title_lower or "chai and react" in title_lower) and normalized_tech == "react":
        is_relevant = True
        confidence = 0.9
        explanation = "Title contains technology 'React', from quality channel 'Chai', includes projects"
    
    if "wscube tech" in title_lower and normalized_tech in title_lower:
        is_relevant = True
        confidence = 0.8
        explanation = f"Title contains technology '{technology}', from recognized channel"
    
    return {
        "title": title,
        "isRelevant": is_relevant,
        "similarity": confidence,
        "explanation": explanation
    }

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting Relevance Checker API")
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY environment variable is not set. API calls will fail.")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    has_api_key = bool(GROQ_API_KEY)
    return {
        "status": "healthy", 
        "model": GROQ_MODEL,
        "api_key_configured": has_api_key
    }

@app.post("/check-relevance", tags=["Relevance"], response_model=RelevanceResponse)
async def check_title_relevance(request: RelevanceRequest):
    """Check if a title is relevant to a technology using Groq LLM"""
    try:
        result = check_relevance(request.title, request.technology)
        
        return RelevanceResponse(
            isRelevant=result["isRelevant"],
            similarity=result["similarity"],
            explanation=result["explanation"]
        )
    except Exception as e:
        logger.error(f"Error checking title relevance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-batch-relevance", tags=["Relevance"], response_model=BatchRelevanceResponse)
async def check_batch_title_relevance(request: BatchRelevanceRequest):
    """Check if multiple titles are relevant to a technology using Groq LLM (batch processing)"""
    try:
        result = check_batch_relevance(request.titles, request.technology)
        return result
    except Exception as e:
        logger.error(f"Error checking batch title relevance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("relevance_checker:app", host="0.0.0.0", port=8002, reload=False) 