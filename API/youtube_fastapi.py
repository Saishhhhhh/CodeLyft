from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime
import sys
import types
from Youtube import (
    get_video_details,
    get_playlist_videos,
    search_youtube,
    search_playlists,
    find_best_playlist as original_find_best_playlist
)

# Configure logging
logging.basicConfig(level=logging.INFO)
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

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting YouTube API")

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
    max_videos: int = Query(20, description="Maximum number of videos to include in the response (0 for all)")
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
        
        def score_playlist_with_logging(playlist, query, debug=False):
            nonlocal current_playlist_index
            current_playlist_index += 1
            
            # Call the original function
            score, details = original_score_playlist(playlist, query, debug)
            
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
                        recency_score_text = f"Year {publish_year} (current) → +1.5"
                    elif publish_year >= 2023:
                        recency_score_text = f"Year {publish_year} (last year) → +1.0"
                    else:
                        recency_score_text = f"Year {publish_year} (older) → +0.5"
                else:
                    recency_score_text = "No year detected → +0.5 (default)"
                
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
                    if like_ratio >= 4:
                        like_ratio_text = f"{like_ratio:.2f}% ≥ 4% → +0.5"
                    elif like_ratio >= 2:
                        like_ratio_text = f"{like_ratio:.2f}% ≥ 2% → +0.25"
                    else:
                        like_ratio_text = f"{like_ratio:.2f}% < 2% → +0.0"
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
            logger.info(f"Evaluated {current_playlist_index} playlists in {elapsed_time:.2f}s")
            
            # Handle case where no suitable playlist was found
            if result is None or not isinstance(result, dict):
                logger.warning(f"No suitable playlist found for query: '{query}' after {elapsed_time:.2f}s")
                return {
                    "status": "no_results",
                    "message": "No suitable playlists found for this query",
                    "query": query,
                    "elapsed_seconds": elapsed_time,
                    "playlists_evaluated": current_playlist_index
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
            logger.info(f"Channel: {winning_playlist.get('channel', 'Unknown')}")
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
        import traceback
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

if __name__ == "__main__":
    logger.info("Starting YouTube API server...")
    logger.info("Server URL: http://localhost:8000")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("ReDoc Documentation: http://localhost:8000/redoc")
    uvicorn.run("youtube_fastapi:app", host="0.0.0.0", port=8000, reload=True) 