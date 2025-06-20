from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime
import sys
import types
import re
import traceback
import time  # Add time module for retries and backoff
from pydantic import BaseModel
from Youtube import (
    get_video_details,
    get_playlist_videos,
    search_youtube,
    search_playlists,
    find_best_playlist as original_find_best_playlist
)
import relevance_checker  # Import our new relevance checker module
import os
import json
from difflib import SequenceMatcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="YouTube API",
    description="A RESTful API for YouTube video and playlist operations",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=3600,
)

@app.get("/")
async def root():
    return {"message": "YouTube API is running 🚀"}


# Global variables for technology matching
SIMILARITY_THRESHOLD = 0.8  # Threshold for considering technologies equivalent

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

# Technology matching response model
class TechnologyMatchResponse(BaseModel):
    areEquivalent: bool
    similarity: float
    explanation: str

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

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting YouTube API with lightweight technology matching")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down YouTube API")
    # Add a small delay to ensure resources are properly released
    # This helps prevent issues during hot reloads
    try:
        time.sleep(0.5)
    except:
        pass
    
    # Force garbage collection to clean up resources
    try:
        import gc
        gc.collect()
    except:
        pass

def clean_repeated_title(data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean repeated titles in data recursively, handling any nested structures"""
    if not data:
        return data
    
    # Handle dictionary case
    if isinstance(data, dict):
        # Clean title if present
        if "title" in data and isinstance(data["title"], str):
            # First handle newlines
            if '\n' in data["title"]:
                data["title"] = data["title"].split('\n')[0].strip()
            
            # Try to use the preprocess_title function from relevance_checker if available
            try:
                original_title = data["title"]
                data["title"] = relevance_checker.preprocess_title(original_title, max_length=200)
                
                # Only log if title was modified significantly
                if original_title != data["title"] and len(original_title) > 50:
                    logger.info(f"Title cleaned with preprocess_title: {len(original_title)} chars -> {len(data['title'])} chars")
                    if len(original_title) > 100:
                        logger.info(f"Original (truncated): {original_title[:40]}...{original_title[-40:]}")
                        logger.info(f"Cleaned: {data['title']}")
            except (AttributeError, ImportError):
                # If relevance_checker.preprocess_title is not available, use our local implementation
                title = data["title"]
                
                # Handle repetitive patterns (3 or more repetitions)
                # This regex finds patterns of 3+ words that repeat
                repetition_pattern = r'(\b[\w\s]{5,50}\b)(\s+\1){2,}'
                
                # Keep checking for repetitions until no more are found
                prev_title = ""
                current_title = title
                
                while prev_title != current_title:
                    prev_title = current_title
                    
                    # Find repetitive patterns
                    match = re.search(repetition_pattern, current_title, re.IGNORECASE)
                    if match:
                        # Get the repeating pattern
                        pattern = match.group(1)
                        # Replace multiple repetitions with just one instance
                        replacement = pattern
                        # Create a regex that matches 2 or more repetitions of this exact pattern
                        exact_pattern = re.escape(pattern) + r'(\s+' + re.escape(pattern) + r'){1,}'
                        current_title = re.sub(exact_pattern, replacement, current_title, flags=re.IGNORECASE)
                
                # Truncate if still too long
                max_length = 200
                if len(current_title) > max_length:
                    logger.warning(f"Title too long ({len(title)} chars), truncating to {max_length} chars")
                    current_title = current_title[:max_length] + "..."
                
                # Only log if title was modified significantly
                if title != current_title and len(title) > 50:
                    logger.info(f"Title cleaned with local function: {len(title)} chars -> {len(current_title)} chars")
                    if len(title) > 100:
                        logger.info(f"Original (truncated): {title[:40]}...{title[-40:]}")
                        logger.info(f"Cleaned: {current_title}")
                
                data["title"] = current_title
        
        # Recursively clean all nested dictionaries and lists
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                data[key] = clean_repeated_title(value)
                
    # Handle list case
    elif isinstance(data, list):
        # Clean each item in the list
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                data[i] = clean_repeated_title(item)
    
    return data

# Technology matching utility functions
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

def check_alias_match(tech1: str, tech2: str) -> bool:
    """Check if technologies match via the aliases dictionary"""
    # Convert to lowercase for case-insensitive comparison
    tech1_lower = tech1.lower()
    tech2_lower = tech2.lower()
    
    # Direct match check
    if tech1_lower == tech2_lower:
        return True
    
    # Find the canonical entries that contain these technologies
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

def get_canonical_name(tech_name: str) -> Optional[str]:
    """Get the canonical name for a technology if it exists in our aliases"""
    tech_lower = tech_name.lower()
    
    # Direct match
    if tech_lower in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[tech_lower]
    
    # Fuzzy match with aliases
    best_match = None
    best_score = 0
    
    for alias, canonical in ALIAS_TO_CANONICAL.items():
        score = SequenceMatcher(None, tech_lower, alias).ratio()
        if score > best_score and score > 0.8:  # 80% similarity threshold
            best_score = score
            best_match = canonical
    
    return best_match

def get_similarity(tech1: str, tech2: str) -> float:
    """Calculate similarity between two technology names using multiple methods"""
    # Quick exact match check
    if tech1.lower() == tech2.lower():
        return 1.0
    
    # Check alias match first
    if check_alias_match(tech1, tech2):
        return 1.0
    
    # Get canonical names
    canonical1 = get_canonical_name(tech1)
    canonical2 = get_canonical_name(tech2)
        
    # If both have canonical names, compare them
    if canonical1 and canonical2:
        if canonical1 == canonical2:
            return 0.95  # Very high similarity for same canonical name
        else:
            # Compare canonical names with fuzzy matching
            return SequenceMatcher(None, canonical1, canonical2).ratio()
    
    # If only one has canonical name, compare original with canonical
    if canonical1:
        return max(
            SequenceMatcher(None, tech1.lower(), canonical1).ratio(),
            SequenceMatcher(None, tech2.lower(), canonical1).ratio()
        )
    elif canonical2:
        return max(
            SequenceMatcher(None, tech1.lower(), canonical2).ratio(),
            SequenceMatcher(None, tech2.lower(), canonical2).ratio()
        )
    
    # Fallback to direct fuzzy matching
    return SequenceMatcher(None, tech1.lower(), tech2.lower()).ratio()

def generate_explanation(tech1: str, tech2: str, similarity: float) -> str:
    """Generate explanation for the match result"""
    if similarity >= SIMILARITY_THRESHOLD:
        if similarity >= 0.95:
            return f"Very high string similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
        else:
            return f"Sufficient string similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"
    else:
        return f"Insufficient string similarity ({similarity:.2f}) between '{tech1}' and '{tech2}'"

# Technology matching endpoint
@app.get("/match", tags=["Technology"], response_model=TechnologyMatchResponse)
async def match_technologies(
    tech1: str = Query(..., description="First technology name"),
    tech2: str = Query(..., description="Second technology name")
):
    """Check if two technology names are equivalent"""
    try:
        # Import the technology matcher module
        import technology_matcher
        
        # Use the technology_matcher directly
        request = technology_matcher.TechnologyMatchRequest(tech1=tech1, tech2=tech2)
        result = await technology_matcher.match_technologies(request)
        
        return result
    except Exception as e:
        logger.error(f"Error matching technologies: {e}")
        traceback.print_exc()
        return TechnologyMatchResponse(
            areEquivalent=False,
            similarity=get_similarity(tech1, tech2),
            explanation=f"Error during technology matching: {str(e)}"
        )

# API Routes - Use Dict[str, Any] for all responses instead of Pydantic models
@app.get("/video/details", tags=["Video"])
async def video_details(url: str = Query(..., description="YouTube video URL or ID")):
    """Get details for a specific YouTube video"""
    try:
        video_data = get_video_details(url)
        # Clean any repeated titles
        cleaned_data = clean_repeated_title(video_data)
        return cleaned_data
    except Exception as e:
        logger.error(f"Error fetching video details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/playlist/videos", tags=["Playlist"])
async def playlist_videos(
    url: str = Query(..., description="YouTube playlist URL or ID"),
    limit: int = Query(0, description="Maximum number of videos to retrieve (0 for all)"),
    max_details: int = Query(15, description="Maximum number of videos to fetch detailed info for")
):
    """Get all videos from a YouTube playlist"""
    try:
        playlist_data = get_playlist_videos(url, limit, max_details)
        # Clean all titles recursively
        cleaned_data = clean_repeated_title(playlist_data)
        return cleaned_data
    except Exception as e:
        logger.error(f"Error fetching playlist videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/videos", tags=["Search"])
async def search_videos(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Maximum number of results"),
    content_type: Optional[str] = Query(None, description="Type of content (video/playlist)"),
    min_duration: Optional[int] = Query(None, description="Minimum duration in minutes"),
    max_duration: Optional[int] = Query(None, description="Maximum duration in minutes")
):
    """Search for videos on YouTube with filters"""
    try:
        search_results = search_youtube(query, limit, content_type, min_duration, max_duration)
        # Clean all titles recursively
        cleaned_results = clean_repeated_title(search_results)
        return cleaned_results
    except Exception as e:
        logger.error(f"Error searching videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/playlists", tags=["Search"])
async def search_playlists_endpoint(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Maximum number of results")
):
    """Search specifically for YouTube playlists"""
    try:
        search_results = search_playlists(query, limit)
        # Clean all titles recursively
        cleaned_results = clean_repeated_title(search_results)
        return cleaned_results
    except Exception as e:
        logger.error(f"Error searching playlists: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/find/best-playlist", tags=["Recommendations"])
async def find_best_playlist_endpoint(
    query: str = Query(..., description="Topic to find the best educational playlist for"),
    debug: bool = Query(False, description="Enable detailed scoring and debug output"),
    max_videos: int = Query(0, description="Maximum number of videos to include in the response (0 for all)")
):
    """Find the best educational playlist for a given topic"""
    try:
        logger.info(f"Finding best playlist for: {query}")
        
        # Monkey patch the get_playlist_videos function to clean titles
        # This ensures that all playlist data has clean titles
        original_get_playlist_videos = get_playlist_videos
        
        def enhanced_get_playlist_videos(playlist_id_or_url, limit=0, max_details=15):
            """Enhanced version of get_playlist_videos that cleans titles"""
            result = original_get_playlist_videos(playlist_id_or_url, limit, max_details)
            
            # Clean titles in the result
            if result:
                result = clean_repeated_title(result)
                
                # Ensure all video titles are also cleaned
                if "videos" in result and isinstance(result["videos"], list):
                    for video in result["videos"]:
                        if isinstance(video, dict) and "title" in video:
                            # Clean any remaining problematic titles
                            if '\n' in video["title"]:
                                video["title"] = video["title"].split('\n')[0].strip()
            
            return result
        
        # Apply the monkey patch
        import types
        import Youtube
        Youtube.get_playlist_videos = enhanced_get_playlist_videos
        
        # Also monkey patch the score_playlist function to add more logging
        original_score_playlist = Youtube.score_playlist
        
        def score_playlist_with_logging(playlist, query, debug=False, relevance_check=None):
            """Enhanced version of score_playlist with more logging"""
            # Clean any titles in the playlist before scoring
            if playlist:
                playlist = clean_repeated_title(playlist)
            
            # Log the playlist title
            if playlist and "title" in playlist:
                logger.info(f"Scoring playlist: {playlist['title']}")
            
            # Call the original function
            return original_score_playlist(playlist, query, debug, relevance_check)
        
        # Apply the second monkey patch
        Youtube.score_playlist = score_playlist_with_logging
        
        # Call the find_best_playlist function
        best_playlist_result = original_find_best_playlist(query, debug)
        
        # Restore the original functions
        Youtube.get_playlist_videos = original_get_playlist_videos
        Youtube.score_playlist = original_score_playlist
        
        if not best_playlist_result:
            return {"status": "no_suitable_playlist", "message": "No suitable playlist found"}
        
        # Clean any remaining problematic titles in the result
        best_playlist_result = clean_repeated_title(best_playlist_result)
        
        # Limit the number of videos if requested
        if max_videos > 0 and "playlist" in best_playlist_result and "videos" in best_playlist_result["playlist"]:
            best_playlist_result["playlist"]["videos"] = best_playlist_result["playlist"]["videos"][:max_videos]
        
        return best_playlist_result
    except Exception as e:
        logger.error(f"Error finding best playlist: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error finding best playlist: {str(e)}")

@app.post("/check-relevance", tags=["Relevance"], response_model=RelevanceResponse)
async def check_title_relevance(request: RelevanceRequest):
    """
    Check if a title is relevant to a technology using semantic similarity
    
    This endpoint uses sentence-transformers to compare the title against good and bad examples
    """
    try:
        # Use our relevance checker module
        result = relevance_checker.check_relevance(request.title, request.technology)
        
        return RelevanceResponse(
            isRelevant=result["isRelevant"],
            similarity=result["similarity"],
            explanation=result["explanation"]
        )
    except Exception as e:
        logger.error(f"Error checking title relevance: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-batch-relevance", tags=["Relevance"], response_model=BatchRelevanceResponse)
async def check_batch_title_relevance(request: BatchRelevanceRequest):
    """
    Check if multiple titles are relevant to a technology using batch processing
    
    This endpoint uses Groq LLM to efficiently evaluate multiple titles at once
    """
    try:
        # Use our batch relevance checker
        result = relevance_checker.check_batch_relevance(request.titles, request.technology)
        return result
    except Exception as e:
        logger.error(f"Error checking batch title relevance: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Explicitly set environment variables for relevance checker
    if "GROQ_API_KEY" in os.environ:
        logger.info(f"Found GROQ_API_KEY in environment: {os.environ['GROQ_API_KEY'][:4]}...{os.environ['GROQ_API_KEY'][-4:]}")
        os.environ["GROQ_API_KEY"] = os.environ["GROQ_API_KEY"]
    else:
        logger.warning("GROQ_API_KEY not found in environment variables")
    
    if "GROQ_MODEL" in os.environ:
        logger.info(f"Found GROQ_MODEL in environment: {os.environ['GROQ_MODEL']}")
        os.environ["GROQ_MODEL"] = os.environ["GROQ_MODEL"]
    
    logger.info("Starting YouTube API server...")
    uvicorn.run(
        "youtube_fastapi:app", 
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 8000)), 
        log_level="info"
    ) 