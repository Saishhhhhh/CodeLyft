"""
Technology Matcher API - Efficient and accurate technology name matching
Uses multiple matching strategies with proper validation and edge case handling
"""

import os
import json
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any, Tuple
import logging
import time
import re
from pydantic import BaseModel
from difflib import SequenceMatcher
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Technology Matcher API",
    description="API for matching technology names using efficient multi-strategy matching",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Global variables
SIMILARITY_THRESHOLD = 0.85
MIN_LENGTH_FOR_FUZZY = 3  # Minimum length for fuzzy matching
MAX_LENGTH_RATIO = 0.5    # Maximum length ratio for fuzzy matching

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

class TechnologyMatcher:
    """Efficient technology matcher with multiple strategies"""
    
    def __init__(self):
        self.canonical_to_aliases = {}
        self.alias_to_canonical = {}
        self.canonical_set = set()
        self.alias_set = set()
        self._build_indexes()
        
    def _build_indexes(self):
        """Build efficient lookup indexes"""
        for tech in TECH_ALIASES_DATA.get("technologies", []):
            canonical = tech.get("canonical", "").lower().strip()
            if not canonical:
                continue
            aliases = [alias.lower().strip() for alias in tech.get("aliases", [])]
            # Store canonical and its aliases
            self.canonical_to_aliases[canonical] = aliases
            self.canonical_set.add(canonical)
            # Map canonical to itself
            self.alias_to_canonical[canonical] = canonical
            self.alias_set.add(canonical)
            # Map each alias to canonical
            for alias in aliases:
                if alias:  # Skip empty aliases
                    self.alias_to_canonical[alias] = canonical
                    self.alias_set.add(alias)
        logger.info(f"Built indexes: {len(self.canonical_set)} canonicals, {len(self.alias_set)} total aliases")
    
    def normalize_tech_name(self, tech_name: str) -> str:
        """Normalize technology name for consistent matching"""
        if not tech_name:
            return ""
        # Convert to lowercase and strip
        normalized = tech_name.lower().strip()
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        # Remove common punctuation that doesn't affect meaning
        normalized = re.sub(r'[^\w\s-]', '', normalized)
        return normalized
    
    def is_exact_match(self, tech1: str, tech2: str) -> bool:
        """Check for exact match after normalization"""
        norm1 = self.normalize_tech_name(tech1)
        norm2 = self.normalize_tech_name(tech2)
        return norm1 == norm2 and norm1 != ""
    
    def is_alias_match(self, tech1: str, tech2: str) -> bool:
        """Check if technologies match via aliases"""
        norm1 = self.normalize_tech_name(tech1)
        norm2 = self.normalize_tech_name(tech2)
        
        # Direct match
        if norm1 == norm2:
            return True
        
        # Check if both are in our alias system
        canonical1 = self.alias_to_canonical.get(norm1)
        canonical2 = self.alias_to_canonical.get(norm2)
        
        # If both have canonical names and they're the same
        if canonical1 and canonical2 and canonical1 == canonical2:
            return True
        
        return False
    
    def get_canonical_name(self, tech_name: str) -> Optional[str]:
        """Get canonical name with strict validation"""
        norm_tech = self.normalize_tech_name(tech_name)
        
        # Direct lookup
        if norm_tech in self.alias_to_canonical:
            return self.alias_to_canonical[norm_tech]
        
        # Only do fuzzy matching for longer strings
        if len(norm_tech) < MIN_LENGTH_FOR_FUZZY:
            return None
        
        # Fuzzy matching with strict criteria
        best_match = None
        best_score = 0
        
        for alias in self.alias_set:
            # Skip if length ratio is too different
            length_ratio = min(len(norm_tech), len(alias)) / max(len(norm_tech), len(alias))
            if length_ratio < MAX_LENGTH_RATIO:
                continue
            
            # Calculate similarity
            score = SequenceMatcher(None, norm_tech, alias).ratio()
            
            # Very strict threshold for fuzzy matching
            if score > best_score and score > 0.95:
                best_score = score
                best_match = self.alias_to_canonical[alias]
        
        return best_match
    
    def calculate_similarity(self, tech1: str, tech2: str) -> Tuple[float, str]:
        """Calculate similarity with detailed explanation"""
        norm1 = self.normalize_tech_name(tech1)
        norm2 = self.normalize_tech_name(tech2)
        
        # Exact match
        if norm1 == norm2:
            return 1.0, "exact_match"
        
        # Alias match
        if self.is_alias_match(tech1, tech2):
            return 1.0, "alias_match"
        
        # Get canonical names
        canonical1 = self.get_canonical_name(tech1)
        canonical2 = self.get_canonical_name(tech2)
        
        # Both have canonical names
        if canonical1 and canonical2:
            if canonical1 == canonical2:
                return 0.95, "same_canonical"
            else:
                # Compare canonical names
                score = SequenceMatcher(None, canonical1, canonical2).ratio()
                return score, "canonical_comparison"
        
        # Only one has canonical name
        if canonical1:
            score1 = SequenceMatcher(None, norm1, canonical1).ratio()
            score2 = SequenceMatcher(None, norm2, canonical1).ratio()
            return max(score1, score2), "canonical_reference"
        elif canonical2:
            score1 = SequenceMatcher(None, norm1, canonical2).ratio()
            score2 = SequenceMatcher(None, norm2, canonical2).ratio()
            return max(score1, score2), "canonical_reference"
        
        # Direct fuzzy matching as last resort
        score = SequenceMatcher(None, norm1, norm2).ratio()
        return score, "direct_fuzzy"
    
    def validate_match(self, tech1: str, tech2: str, similarity: float, method: str) -> bool:
        """Additional validation to prevent false positives"""
        norm1 = self.normalize_tech_name(tech1)
        norm2 = self.normalize_tech_name(tech2)
        # Length-based validation
        if len(norm1) < 2 or len(norm2) < 2:
            return False
        # Substring validation - prevent "g" matching "gitlab"
        if len(norm1) < len(norm2) and norm1 in norm2:
            if len(norm1) / len(norm2) < 0.5:  # If one is less than half the length
                return False
        if len(norm2) < len(norm1) and norm2 in norm1:
            if len(norm2) / len(norm1) < 0.5:
                return False
        # Method-specific validation
        if method == "direct_fuzzy" and similarity < 0.9:
            return False
        return True

    def are_equivalent_by_alias_or_canonical(self, tech1: str, tech2: str) -> bool:
        norm1 = self.normalize_tech_name(tech1)
        norm2 = self.normalize_tech_name(tech2)
        canonical1 = self.alias_to_canonical.get(norm1)
        canonical2 = self.alias_to_canonical.get(norm2)
        # If both resolve to the same canonical, or are the same normalized string
        return (canonical1 is not None and canonical1 == canonical2) or (norm1 == norm2 and norm1 != "")

# Initialize the matcher
matcher = TechnologyMatcher()

class TechnologyMatchRequest(BaseModel):
    tech1: str
    tech2: str

class TechnologyMatchResponse(BaseModel):
    areEquivalent: bool
    similarity: float
    explanation: str

@app.on_event("startup")
async def startup_event():
    """Initialize the technology matcher"""
    logger.info("Technology matcher initialized with efficient multi-strategy matching")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "method": "efficient_multi_strategy_matching"}

def generate_explanation(tech1: str, tech2: str, similarity: float, method: str) -> str:
    """Generate detailed explanation for the match result"""
    method_descriptions = {
        "exact_match": "Exact match after normalization",
        "alias_match": "Match found via technology alias dictionary",
        "same_canonical": "Both technologies resolve to the same canonical name",
        "canonical_comparison": "Comparison of canonical names",
        "canonical_reference": "Comparison against canonical name reference",
        "direct_fuzzy": "Direct fuzzy string matching"
    }
    
    method_desc = method_descriptions.get(method, method)
    
    if similarity >= SIMILARITY_THRESHOLD:
        if similarity >= 0.95:
            return f"Very high similarity ({similarity:.2f}) via {method_desc} between '{tech1}' and '{tech2}'"
        else:
            return f"Sufficient similarity ({similarity:.2f}) via {method_desc} between '{tech1}' and '{tech2}'"
    else:
        return f"Insufficient similarity ({similarity:.2f}) via {method_desc} between '{tech1}' and '{tech2}'"

@app.post("/match", tags=["Technology"], response_model=TechnologyMatchResponse)
async def match_technologies(request: TechnologyMatchRequest):
    """Check if two technology names are equivalent using strict canonical/alias logic"""
    try:
        are_equivalent = matcher.are_equivalent_by_alias_or_canonical(request.tech1, request.tech2)
        similarity, method = matcher.calculate_similarity(request.tech1, request.tech2)
        explanation = generate_explanation(request.tech1, request.tech2, similarity, method)
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