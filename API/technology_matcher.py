"""
Technology Matcher API - Semantic similarity matching for technology names
Uses sentence-transformers/all-MiniLM-L6-v2 from Hugging Face
"""

import os
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
    # Convert to lowercase
    normalized = tech_name.lower()
    # Replace common separators with spaces
    normalized = re.sub(r'[-_./]', ' ', normalized)
    # Remove any special characters
    normalized = re.sub(r'[^\w\s]', '', normalized)
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized

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
        raise ValueError("Model not loaded")
    
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

def generate_explanation(tech1: str, tech2: str, similarity: float) -> str:
    """Generate explanation for the match result"""
    if similarity >= SIMILARITY_THRESHOLD:
        if similarity >= 0.8:
            return f"Very high semantic similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
        else:
            return f"Sufficient semantic similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
    else:
        return f"Insufficient semantic similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"

@app.post("/match", tags=["Technology"], response_model=TechnologyMatchResponse)
async def match_technologies(request: TechnologyMatchRequest):
    """Check if two technology names are equivalent using semantic similarity"""
    try:
        # Quick check for exact matches
        if request.tech1.lower() == request.tech2.lower():
            return TechnologyMatchResponse(
                areEquivalent=True,
                similarity=1.0,
                explanation=f"Exact match between '{request.tech1}' and '{request.tech2}'"
            )
        
        # Calculate similarity
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