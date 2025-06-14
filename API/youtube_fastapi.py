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

# Import sentence-transformers for technology matching
try:
    from sentence_transformers import SentenceTransformer, util
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    print("Warning: sentence-transformers not installed. Technology matching will be unavailable.")

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=3600,
)

# Global variables for technology matching
tech_model = None
embedding_cache = {}
SIMILARITY_THRESHOLD = 0.8  # Threshold for considering technologies equivalent

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
    global tech_model
    
    logger.info("Starting YouTube API")
    
    # Load sentence-transformers model if available
    if HAS_SENTENCE_TRANSFORMERS:
        try:
            logger.info("Loading sentence-transformers model...")
            tech_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading sentence-transformers model: {e}")
            tech_model = None
    else:
        logger.info("Sentence transformers not available - technology matching disabled")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down YouTube API")

def clean_repeated_title(data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean repeated titles in data recursively, handling any nested structures"""
    if not data:
        return data
    
    # Handle dictionary case
    if isinstance(data, dict):
        # Clean title if present
        if "title" in data and isinstance(data["title"], str):
            if '\n' in data["title"]:
                data["title"] = data["title"].split('\n')[0].strip()
        
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

def get_embedding(text: str):
    """Get embedding for text with caching"""
    global embedding_cache, tech_model
    
    # Normalize the text
    normalized_text = normalize_tech_name(text)
    
    # Check if embedding exists in cache
    if normalized_text in embedding_cache:
        return embedding_cache[normalized_text]
    
    # Generate new embedding
    if tech_model is None:
        raise ValueError("Sentence transformer model not loaded")
    
    embedding = tech_model.encode(normalized_text)
    
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

# Technology matching endpoint
@app.get("/match", tags=["Technology"], response_model=TechnologyMatchResponse)
async def match_technologies(
    tech1: str = Query(..., description="First technology name"),
    tech2: str = Query(..., description="Second technology name")
):
    """Check if two technology names are equivalent using semantic similarity"""
    if not HAS_SENTENCE_TRANSFORMERS or tech_model is None:
        raise HTTPException(
            status_code=503, 
            detail="Technology matching is unavailable. The sentence-transformers module is not installed or the model failed to load."
        )
    
    try:
        # Quick check for exact matches
        if tech1.lower() == tech2.lower():
            return TechnologyMatchResponse(
                areEquivalent=True,
                similarity=1.0,
                explanation=f"Exact match between '{tech1}' and '{tech2}'"
            )
        
        # Calculate similarity
        similarity = get_similarity(tech1, tech2)
        
        # Determine if technologies are equivalent
        are_equivalent = similarity >= SIMILARITY_THRESHOLD
        
        # Generate explanation
        explanation = generate_explanation(tech1, tech2, similarity)
        
        return TechnologyMatchResponse(
            areEquivalent=are_equivalent,
            similarity=similarity,
            explanation=explanation
        )
    except Exception as e:
        logger.error(f"Error matching technologies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    """Find the best educational playlist for a specific topic based on comprehensive scoring criteria"""
    try:
        # Log the start of processing
        logger.info(f"Processing request for best playlist on: '{query}' (debug={debug}, max_videos={max_videos})")
        start_time = datetime.now()
        
        # Create a custom score logging function that we'll pass to our find_best_playlist patch
        current_playlist_index = 0
        
        # Monkey patch the score_playlist function to log each playlist's score as it's evaluated
        import Youtube
        original_score_playlist = Youtube.score_playlist
        original_get_playlist_videos = Youtube.get_playlist_videos
        
        # Enhance the get_playlist_videos function to always fetch first video details
        def enhanced_get_playlist_videos(playlist_id_or_url, limit=0, max_details=15):
            """Enhanced version that ensures we get detailed data for the first video"""
            # Call original function but ensure we get detailed first video data
            playlist_data = original_get_playlist_videos(playlist_id_or_url, limit, max_details=max(max_details, 1))
            
            # Ensure we have detailed information for the first video
            videos = playlist_data.get('videos', [])
            if videos:
                first_video = videos[0]
                video_id = first_video.get('id')
                
                # Check if we already have likes and views
                has_complete_data = (
                    "likes" in first_video and 
                    "views" in first_video and 
                    "publish_date" in first_video
                )
                
                # If we're missing key data, fetch it
                if not has_complete_data:
                    try:
                        logger.info(f"Fetching detailed info for first video to get complete data...")
                        detailed_video = Youtube.get_video_details(video_id)
                        
                        # Update first video with detailed information
                        if "likes" in detailed_video and "likes" not in first_video:
                            first_video["likes"] = detailed_video["likes"]
                            first_video["likes_formatted"] = detailed_video["likes_formatted"]
                            logger.info(f"Updated first video likes: {first_video['likes_formatted']}")
                            
                        if "views" in detailed_video and "views" not in first_video:
                            first_video["views"] = detailed_video["views"]
                            first_video["views_formatted"] = detailed_video["views_formatted"]
                            logger.info(f"Updated first video views: {first_video['views_formatted']}")
                            
                        if "publish_date" in detailed_video and "publish_date" not in first_video:
                            first_video["publish_date"] = detailed_video["publish_date"]
                            logger.info(f"Updated first video publish date: {first_video['publish_date']}")
                            
                        if "publish_date_formatted" in detailed_video:
                            first_video["publish_date_formatted"] = detailed_video["publish_date_formatted"]
                            logger.info(f"Updated first video formatted date: {first_video['publish_date_formatted']}")
                            
                        # Update the videos list
                        videos[0] = first_video
                    except Exception as e:
                        logger.warning(f"Error enhancing first video data: {e}")
            
            return playlist_data
        
        # Replace the function temporarily
        Youtube.get_playlist_videos = enhanced_get_playlist_videos
        
        def score_playlist_with_logging(playlist, query, debug=False, relevance_check=None):
            nonlocal current_playlist_index
            current_playlist_index += 1
            
            # Call the original function with the relevance_check parameter
            score, details = original_score_playlist(playlist, query, debug, relevance_check)
            
            # Log the result if we have valid data
            if score is not None:
                # Extract key parameters for logging
                title = playlist.get('title', 'Unknown')
                url = playlist.get('url', 'Unknown')
                video_count = len(playlist.get('videos', []))
                direct_view_count = playlist.get('direct_view_count', 0)
                
                # Get video specific information
                videos = playlist.get('videos', [])
                first_video = videos[0] if videos else {}
                
                # Get duration information
                videos_with_duration = [v for v in videos if "duration_seconds" in v and v["duration_seconds"]]
                total_duration_minutes = sum(v["duration_seconds"] for v in videos_with_duration) / 60 if videos_with_duration else 0
                
                # Calculate the correct duration ratio thresholds based on video count
                duration_score_text = ""
                if video_count > 0 and videos_with_duration:
                    # Calculate thresholds
                    threshold_high = video_count * 45    # 45 min per video threshold for highest score
                    threshold_medium = video_count * 30  # 30 min per video threshold for medium score
                    threshold_low = video_count * 15     # 15 min per video threshold for minimum score
                    
                    # Determine which threshold the total duration meets
                    if total_duration_minutes >= threshold_high:
                        duration_score_text = f"{total_duration_minutes:.1f} minutes ≥ {video_count} videos × 45 min ({threshold_high} min) → +2.0"
                    elif total_duration_minutes >= threshold_medium:
                        duration_score_text = f"{total_duration_minutes:.1f} minutes ≥ {video_count} videos × 30 min ({threshold_medium} min) → +1.5"
                    elif total_duration_minutes >= threshold_low:
                        duration_score_text = f"{total_duration_minutes:.1f} minutes ≥ {video_count} videos × 15 min ({threshold_low} min) → +1.0"
                    else:
                        duration_score_text = f"{total_duration_minutes:.1f} minutes < {video_count} videos × 15 min ({threshold_low} min) → +0.0"
                
                # Get first video publish date and year
                publish_date = "Unknown"
                publish_year = details.get("publish_year", None)
                if first_video:
                    # Check for formatted date first
                    if "publish_date_formatted" in first_video:
                        publish_date = first_video.get("publish_date_formatted", "Unknown")
                    elif "publish_date" in first_video:
                        publish_date = first_video.get("publish_date", "Unknown")
                
                # Get recency score text
                recency_score_text = ""
                recency_score = details.get("recency_score", 0.0)
                if publish_year:
                    if publish_year >= 2024:
                        recency_score_text = f"Year {publish_year} (current) → +0.5"
                    elif publish_year >= 2023:
                        recency_score_text = f"Year {publish_year} (last year) → +0.3"
                    else:
                        recency_score_text = f"Year {publish_year} (older) → +0.1"
                else:
                    recency_score_text = "No year detected → +0.1 (default)"
                
                # Get like/view ratio information
                first_video_likes = 0
                first_video_views = 0
                like_ratio = 0
                like_ratio_text = ""
                
                if first_video and "likes" in first_video and "views" in first_video and first_video["views"]:
                    first_video_likes = first_video.get("likes", 0)
                    first_video_views = first_video.get("views", 0)
                    like_ratio = (first_video_likes / first_video_views) * 100 if first_video_views > 0 else 0
                    
                    # Generate like ratio score text
                    if like_ratio >= 2:
                        like_ratio_text = f"{like_ratio:.2f}% ≥ 2% → +0.8"
                    elif like_ratio >= 1:
                        like_ratio_text = f"{like_ratio:.2f}% ≥ 1% → +0.5"
                    else:
                        like_ratio_text = f"{like_ratio:.2f}% < 1% → +0.2"
                else:
                    like_ratio_text = "No like/view data → +0.0"
                
                # Log the score with detailed parameters
                verdict = "⭐ EXCEPTIONAL" if score >= 8.0 else "👍 GOOD" if score >= 7.0 else "⚠️ AVERAGE" if score >= 6.0 else "❌ REJECTED"
                
                logger.info(f"[Playlist {current_playlist_index}] '{title}' - Score: {score:.2f}/10.0 - {verdict}")
                logger.info(f"  URL: {url}")
                logger.info(f"  Parameters:")
                logger.info(f"    - Video count: {video_count}")
                logger.info(f"    - Direct view count: {direct_view_count:,}")
                logger.info(f"    - Total duration: {total_duration_minutes:.1f} minutes")
                if duration_score_text:
                    logger.info(f"    - Duration ratio score: {duration_score_text}")
                
                # Log first video details 
                if first_video:
                    first_title = first_video.get("title", "Unknown")
                    logger.info(f"    - First video: '{first_title}'")
                    logger.info(f"    - First video publish date: {publish_date}")
                    if recency_score_text:
                        logger.info(f"    - Recency score: {recency_score_text}")
                    if first_video_views:
                        logger.info(f"    - First video views: {first_video_views:,}")
                    if first_video_likes:
                        logger.info(f"    - First video likes: {first_video_likes:,}")
                    if like_ratio_text:
                        logger.info(f"    - Like ratio score: {like_ratio_text}")
                
                # Log the score breakdown
                logger.info(f"  Score breakdown:")
                for key, value in details.items():
                    if key.endswith('_score'):
                        try:
                            score_value = float(value)
                            logger.info(f"    - {key}: +{score_value:.1f}")
                        except (ValueError, TypeError):
                            logger.info(f"    - {key}: +{value}")
                
                # Log if this is an exceptional playlist (that might stop the search)
                if score >= 8.0:
                    logger.info(f"⭐ EXCEPTIONAL playlist found! Search may stop early.")
            
            return score, details
            
        # Replace the function
        Youtube.score_playlist = score_playlist_with_logging
        
        try:
            # Call the original function directly 
            result = original_find_best_playlist(query, debug=debug, detailed_fetch=True)
            elapsed_time = (datetime.now() - start_time).total_seconds()
            
            # Restore the original functions
            Youtube.score_playlist = original_score_playlist
            Youtube.get_playlist_videos = original_get_playlist_videos
            
            # Log how many playlists were evaluated
            logger.info(f"Evaluated {current_playlist_index} playlists in {elapsed_time:.2f}s using parallel processing")
            
            # Handle case where no suitable playlist was found
            if result is None or not isinstance(result, dict):
                logger.warning(f"No suitable playlist found for query: '{query}' after {elapsed_time:.2f}s")
                return {
                    "status": "no_results",
                    "message": "No suitable playlists found for this query",
                    "query": query,
                    "elapsed_seconds": elapsed_time,
                    "playlists_evaluated": current_playlist_index,
                    "parallel_processing": True
                }
                
            # Clean any repeated titles in the result
            cleaned_result = clean_repeated_title(result)
            
            # Extract the winning playlist
            winning_playlist = cleaned_result.get("playlist", {})
            winning_score = cleaned_result.get("score", 0)
            winning_verdict = cleaned_result.get("verdict", "Unknown")
            
            # Log the best playlist details
            logger.info(f"Best playlist found in {elapsed_time:.2f}s: '{winning_playlist.get('title', 'Unknown')}'")
            logger.info(f"URL: {winning_playlist.get('url', 'Unknown')}")
            logger.info(f"Channel: {winning_playlist.get('channel', {}).get('name', 'Unknown')}")
            logger.info(f"Videos: {len(winning_playlist.get('videos', []))}")
            logger.info(f"Score: {winning_score}/10.0 - Verdict: {winning_verdict}")
            
            # Log the scoring breakdown
            if "details" in cleaned_result:
                details = cleaned_result["details"]
                logger.info("Scoring breakdown:")
                for key, value in details.items():
                    if key.endswith("_score"):
                        logger.info(f"  - {key}: +{float(value):.1f}")
            
            # Prepare the response with the best playlist
            response = {
                "status": "success",
                "query": query,
                "elapsed_seconds": elapsed_time,
                "playlists_evaluated": current_playlist_index,
                "parallel_processing": True,
            "playlist": {
                    "id": winning_playlist.get("id"),
                    "title": winning_playlist.get("title"),
                    "url": winning_playlist.get("url"),
                    "channel": winning_playlist.get("channel"),
                    "channel_url": winning_playlist.get("channel_url"),
                    "video_count": len(winning_playlist.get("videos", [])),
                    "direct_view_count": winning_playlist.get("direct_view_count"),
                    "direct_view_count_formatted": winning_playlist.get("direct_view_count_formatted"),
                    "videos": []
                },
                "score": winning_score,
                "verdict": winning_verdict,
                "details": cleaned_result.get("details", {})
            }
            
            # Process videos (with optional limit)
            all_videos = winning_playlist.get("videos", [])
            
            # Apply video limit if specified
            limited_videos = all_videos if max_videos <= 0 else all_videos[:max_videos]
            
            # Log if videos were truncated
            if 0 < max_videos < len(all_videos):
                logger.info(f"Truncating videos from {len(all_videos)} to {max_videos} for response")
                response["playlist"]["videos_truncated"] = True
                response["playlist"]["videos_total"] = len(all_videos)
                response["playlist"]["videos_shown"] = max_videos
            
            # Add video data to response
            for video in limited_videos:
                video_data = {
                    "id": video.get("id"),
                    "title": video.get("title"),
                    "url": video.get("url"),
                    "channel": video.get("channel"),
                    "duration": video.get("duration")
                }
                
                # Include additional fields if available
                for field in ["duration_seconds", "likes", "likes_formatted", 
                             "views", "views_formatted", "publish_date"]:
                    if field in video:
                        video_data[field] = video[field]
                        
                response["playlist"]["videos"].append(video_data)
            
            logger.info(f"Successfully completed find_best_playlist request in {elapsed_time:.2f}s")
            return response
        finally:
            # Always restore the original functions
            Youtube.score_playlist = original_score_playlist
            Youtube.get_playlist_videos = original_get_playlist_videos
            
    except Exception as e:
        # Log the full error with traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error in find_best_playlist endpoint: {str(e)}")
        logger.error(f"Traceback: {error_trace}")
        
        # Return a detailed error response
        raise HTTPException(
            status_code=500, 
            detail={
                "status": "error",
                "message": str(e),
                "query": query,
                "traceback": error_trace
            }
        )

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
    logger.info("Server URL: http://localhost:8000")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("ReDoc Documentation: http://localhost:8000/redoc")
    uvicorn.run(
        "youtube_fastapi:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_delay=1,
        workers=1,
        reload_excludes=["__pycache__"],
        reload_includes=["*.py"],
        reload_dirs=["./"],
        use_colors=True,
        log_level="info"
    ) 