"""
Technology Extractor - Extract technology names from text using Gemini API
"""

import os
import json
import logging
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict, Any, Optional, Union

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load API key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"GEMINI_API_KEY: {GEMINI_API_KEY}")

# Configure Gemini API
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API key configured successfully")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables")

# Default model - using a free tier model
DEFAULT_MODEL = "gemini-2.0-flash"

def extract_technology(text: str) -> Dict[str, Any]:
    """
    Extract all technologies mentioned in a text
    
    Args:
        text: The text to analyze
        
    Returns:
        dict: Dictionary with extracted technology information
    """
    try:
        if not GEMINI_API_KEY:
            logger.warning("Gemini API key not configured")
            return fallback_technology_extraction(text)
        
        # Create prompt for technology extraction
        prompt = f"""
        Extract ALL technologies mentioned in this text. 
        Focus on specific technologies, treating compound names like "React JS" as a single technology.
        
        Text: "{text}"
        
        Respond with JSON only in this exact format without any markdown formatting:
        {{
          "technologies": ["tech1", "tech2", "tech3"]
        }}
        
        If no specific technology is mentioned, return an empty array.
        """
        
        # Configure the model
        model = genai.GenerativeModel(DEFAULT_MODEL)
        
        # Generate response
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1}
        )
        
        # Parse the response, handling potential markdown code blocks
        try:
            response_text = response.text
            # Remove markdown code blocks if present
            if "```" in response_text:
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:].strip()
            
            result = json.loads(response_text)
            return result
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON response: {response.text}")
            return fallback_technology_extraction(text)
            
    except Exception as e:
        logger.error(f"Error extracting technology: {e}")
        return fallback_technology_extraction(text)

def extract_technologies_batch(texts: List[str]) -> Dict[str, Any]:
    """
    Extract technologies from multiple texts in a single API call
    
    Args:
        texts: List of texts to analyze
        
    Returns:
        dict: Dictionary with extracted technology information for each text
    """
    try:
        if not GEMINI_API_KEY:
            logger.warning("Gemini API key not configured")
            return {"results": [fallback_technology_extraction(text) for text in texts]}
        
        # Create prompt for batch technology extraction
        texts_json = json.dumps(texts)
        prompt = f"""
        Extract ALL technologies mentioned in each of these texts.
        Focus on specific technologies, treating compound names like "React JS" as a single technology.
        
        Texts: {texts_json}
        
        For each text, identify all technologies and respond with JSON only in this exact format without any markdown formatting:
        {{
          "results": [
            {{
              "text": "the original text",
              "technologies": ["tech1", "tech2", "tech3"]
            }},
            // ... more results
          ]
        }}
        
        If no specific technology is mentioned in a text, return an empty array for that text.
        """
        
        # Configure the model
        model = genai.GenerativeModel(DEFAULT_MODEL)
        
        # Generate response
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1}
        )
        
        # Parse the response, handling potential markdown code blocks
        try:
            response_text = response.text
            # Remove markdown code blocks if present
            if "```" in response_text:
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:].strip()
            
            result = json.loads(response_text)
            
            # Ensure the result has the expected format
            if "results" not in result:
                result = {"results": []}
                
            # Ensure each result has the original text
            for i, item in enumerate(result.get("results", [])):
                if i < len(texts) and "text" not in item:
                    item["text"] = texts[i]
            
            return result
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON response: {response.text}")
            return {"results": [fallback_technology_extraction(text) for text in texts]}
            
    except Exception as e:
        logger.error(f"Error in batch technology extraction: {e}")
        return {"results": [fallback_technology_extraction(text) for text in texts]}

def fallback_technology_extraction(text: str) -> Dict[str, Any]:
    """
    Fallback method for technology extraction when API fails
    
    Args:
        text: The text to analyze
        
    Returns:
        dict: Dictionary with best-guess technology information
    """
    # List of common technologies to check for
    common_techs = [
        "javascript", "js", "python", "css", "html", "react", "node", "angular", "vue", 
        "typescript", "ts", "php", "ruby", "java", "c#", "c++", "swift", "kotlin", "go",
        "flutter", "dart", "rust", "scala", "haskell", "r", "matlab", "sql", "nosql",
        "mongodb", "postgres", "mysql", "oracle", "firebase", "aws", "azure", "gcp",
        "docker", "kubernetes", "devops", "git", "github", "gitlab", "linux", "unix", 
        "windows", "android", "ios", "web", "frontend", "backend", "fullstack", 
        "machine learning", "ml", "ai", "deep learning", "nlp", "blockchain",
        "react js", "node js", "vue js", "angular js", "next js", "express js"
    ]
    
    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Find all technologies in the text
    found_techs = []
    
    # Check for compound technologies first
    compound_techs = [tech for tech in common_techs if " " in tech]
    for tech in compound_techs:
        if tech in text_lower:
            found_techs.append(tech)
    
    # Check for exact matches in the text
    for tech in common_techs:
        if " " not in tech:  # Skip compound techs as we already checked them
            # Check for word boundaries to avoid partial matches
            if f" {tech} " in f" {text_lower} " or f" {tech}," in text_lower or f" {tech}." in text_lower:
                # Avoid duplicates (e.g. don't add "js" if "react js" is already added)
                if not any(tech in found_tech for found_tech in found_techs):
                    found_techs.append(tech)
    
    # Return all found technologies
    return {
        "technologies": found_techs
    }

# Test the module if run directly
if __name__ == "__main__":
    # Test individual extraction
    test_text = "Complete React JS Course for Beginners"
    result = extract_technology(test_text)
    print(f"Technologies extracted from '{test_text}': {result}")
    
    # Test batch extraction
    test_texts = [
        "Complete React JS Course for Beginners",
        "Python Programming Tutorial for Data Science",
        "Introduction to Web Development with HTML, CSS, and JavaScript"
    ]
    batch_result = extract_technologies_batch(test_texts)
    print(f"Batch extraction results: {json.dumps(batch_result, indent=2)}") 