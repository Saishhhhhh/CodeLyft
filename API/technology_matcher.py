"""
Technology Matcher API - Semantic similarity matching for technology names
Uses sentence-transformers/all-MiniLM-L6-v2 from Hugging Face
"""

import os
import json
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any
import logging
import time
import re
from pydantic import BaseModel

# Import sentence-transformers
from sentence_transformers import SentenceTransformer, util

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Technology Matcher API",
    description="API for matching technology names using semantic similarity",
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

# Global variables
model = None
embedding_cache = {}
SIMILARITY_THRESHOLD = 0.85  # Threshold for considering technologies equivalent

# Load technology aliases from JSON
try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    aliases_path = os.path.join(script_dir, 'tech_aliases.json')
    with open(aliases_path, 'r', encoding='utf-8') as f:
        TECH_ALIASES_DATA = json.load(f)
        logger.info(f"Loaded technology aliases from {aliases_path}")
except Exception as e:
    logger.error(f"Error loading technology aliases: {e}")
    TECH_ALIASES_DATA = {"technologies": []}

# Create lookup dictionaries for faster access
CANONICAL_TO_ALIASES = {}  # Maps canonical name to list of aliases
ALIAS_TO_CANONICAL = {}    # Maps any alias to its canonical name

# Build the lookup dictionaries
for tech in TECH_ALIASES_DATA.get("technologies", []):
    canonical = tech.get("canonical", "").lower()
    if canonical:
        aliases = [alias.lower() for alias in tech.get("aliases", [])]
        CANONICAL_TO_ALIASES[canonical] = aliases
        
        # Map canonical to itself
        ALIAS_TO_CANONICAL[canonical] = canonical
        
        # Map each alias to the canonical name
        for alias in aliases:
            ALIAS_TO_CANONICAL[alias] = canonical

logger.info(f"Processed {len(CANONICAL_TO_ALIASES)} technology mappings with {len(ALIAS_TO_CANONICAL)} total aliases")

class TechnologyMatchRequest(BaseModel):
    tech1: str
    tech2: str

class TechnologyMatchResponse(BaseModel):
    areEquivalent: bool
    similarity: float
    explanation: str

@app.on_event("startup")
async def startup_event():
    """Load the model at startup"""
    global model
    logger.info("Loading sentence-transformers model...")
    try:
        # Load the model
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        # Continue without failing - will return error on actual API calls

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model": "sentence-transformers/all-MiniLM-L6-v2"}

def normalize_tech_name(tech_name: str) -> str:
    """Normalize technology name for better matching"""
    if not tech_name:
        return ""
        
    # Convert to lowercase
    normalized = tech_name.lower()
    
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    # Remove duplicated words (e.g., "Git Git" -> "Git")
    words = normalized.split(' ')
    unique_words = []
    for word in words:
        if word not in unique_words:
            unique_words.append(word)
    normalized = ' '.join(unique_words)
    
    return normalized

def check_alias_match(tech1: str, tech2: str) -> bool:
    """Check if technologies match via the aliases dictionary"""
    # Convert to lowercase for case-insensitive comparison
    tech1_lower = tech1.lower()
    tech2_lower = tech2.lower()
    
    # Direct match check
    if tech1_lower == tech2_lower:
        return True
    
    # Find the canonical entries that contain these technologies
    matching_entries = []
    
    for tech in TECH_ALIASES_DATA.get("technologies", []):
        canonical = tech.get("canonical", "").lower()
        aliases = [alias.lower() for alias in tech.get("aliases", [])]
        
        # Check if either tech matches this entry's canonical or aliases
        tech1_matches = tech1_lower == canonical or tech1_lower in aliases
        tech2_matches = tech2_lower == canonical or tech2_lower in aliases
        
        # If both match the same entry, they're equivalent
        if tech1_matches and tech2_matches:
            logger.info(f"Found match: '{tech1}' and '{tech2}' both belong to '{canonical}' group")
            return True
    
    # No match found
    return False

def get_embedding(text: str):
    """Get embedding for text with caching"""
    global embedding_cache, model
    
    # Normalize the text
    normalized_text = normalize_tech_name(text)
    
    # Check if embedding exists in cache
    if normalized_text in embedding_cache:
        return embedding_cache[normalized_text]
    
    # Generate new embedding
    if model is None:
        # Try to load the model if it's not loaded yet
        try:
            logger.info("Attempting to load model on demand")
            model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except Exception as e:
            logger.error(f"Failed to load model on demand: {e}")
            raise ValueError("Model not loaded and could not be loaded on demand")
    
    embedding = model.encode(normalized_text)
    
    # Cache the embedding
    embedding_cache[normalized_text] = embedding
    
    return embedding

def get_similarity(tech1: str, tech2: str) -> float:
    """Calculate similarity between two technology names"""
    # Quick exact match check
    if tech1.lower() == tech2.lower():
        return 1.0
    
    # Get embeddings
    try:
        embedding1 = get_embedding(tech1)
        embedding2 = get_embedding(tech2)
        
        # Calculate cosine similarity
        similarity = util.cos_sim(embedding1, embedding2).item()
        
        return similarity
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        return 0.0  # Return 0 similarity on error

def generate_explanation(tech1: str, tech2: str, similarity: float, method: str = "semantic") -> str:
    """Generate explanation for the match result"""
    if method == "alias":
        return f"Match found via technology alias dictionary between '{tech1}' and '{tech2}'"
    elif similarity >= SIMILARITY_THRESHOLD:
        if similarity >= 0.9:
            return f"Very high {method} similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
        else:
            return f"Sufficient {method} similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
    else:
        return f"Insufficient {method} similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"

@app.post("/match", tags=["Technology"], response_model=TechnologyMatchResponse)
async def match_technologies(request: TechnologyMatchRequest):
    """Check if two technology names are equivalent using multiple methods"""
    try:
        # Step 1: Check for alias match using our dictionary
        if check_alias_match(request.tech1, request.tech2):
            return TechnologyMatchResponse(
                areEquivalent=True,
                similarity=1.0,
                explanation=generate_explanation(request.tech1, request.tech2, 1.0, method="alias")
            )
        
        # Step 2: Calculate similarity using embeddings
        try:
            similarity = get_similarity(request.tech1, request.tech2)
            
            # Determine if technologies are equivalent
            are_equivalent = similarity >= SIMILARITY_THRESHOLD
            
            # Generate explanation
            explanation = generate_explanation(request.tech1, request.tech2, similarity)
            
            return TechnologyMatchResponse(
                areEquivalent=are_equivalent,
                similarity=similarity,
                explanation=explanation
            )
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            # If semantic similarity fails, fall back to simple string comparison
            are_equivalent = normalize_tech_name(request.tech1) == normalize_tech_name(request.tech2)
            similarity = 1.0 if are_equivalent else 0.0
            
            return TechnologyMatchResponse(
                areEquivalent=are_equivalent,
                similarity=similarity,
                explanation=f"Fallback comparison (semantic matching failed): {request.tech1} and {request.tech2} are {'equivalent' if are_equivalent else 'different'}"
            )
    except Exception as e:
        logger.error(f"Error matching technologies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/match", tags=["Technology"])
async def match_technologies_get(
    tech1: str = Query(..., description="First technology name"),
    tech2: str = Query(..., description="Second technology name")
):
    """GET endpoint for technology matching"""
    request = TechnologyMatchRequest(tech1=tech1, tech2=tech2)
    return await match_technologies(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("technology_matcher:app", host="0.0.0.0", port=8001, reload=True) 