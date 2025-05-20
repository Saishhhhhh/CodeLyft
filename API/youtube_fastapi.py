from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from Youtube import (
    get_video_details,
    get_playlist_videos,
    search_youtube,
    search_playlists,
    find_best_playlist
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

# API Routes - Use Dict[str, Any] for all responses instead of Pydantic models
@app.get("/video/details", tags=["Video"])
async def video_details(url: str = Query(..., description="YouTube video URL or ID")):
    """Get details for a specific YouTube video"""
    try:
        return get_video_details(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/playlist/videos", tags=["Playlist"])
async def playlist_videos(
    url: str = Query(..., description="YouTube playlist URL or ID"),
    limit: int = Query(0, description="Maximum number of videos to retrieve (0 for all)"),
    max_details: int = Query(15, description="Maximum number of videos to fetch detailed info for")
):
    """Get all videos from a YouTube playlist"""
    try:
        return get_playlist_videos(url, limit, max_details)
    except Exception as e:
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
        return search_youtube(query, limit, content_type, min_duration, max_duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/playlists", tags=["Search"])
async def search_playlists_endpoint(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Maximum number of results")
):
    """Search specifically for YouTube playlists"""
    try:
        return search_playlists(query, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/find/best-playlist", tags=["Recommendations"])
async def find_best_playlist_endpoint(
    query: str = Query(..., description="Topic to find the best educational playlist for"),
    debug: bool = Query(False, description="Enable detailed scoring and debug output")
):
    """Find the best educational playlist for a specific topic based on comprehensive scoring criteria"""
    try:
        result = find_best_playlist(query, debug)
        if result is None:
            return {"status": "no_suitable_playlist", "message": "No suitable playlists found for this query"}
        
        # Simplify response to avoid circular references from json serialization
        simplified_result = {
            "playlist": {
                "id": result["playlist"].get("id"),
                "title": result["playlist"].get("title"),
                "url": result["playlist"].get("url"),
                "channel": result["playlist"].get("channel"),
                "video_count": len(result["playlist"].get("videos", [])),
                "direct_view_count": result["playlist"].get("direct_view_count"),
                "direct_view_count_formatted": result["playlist"].get("direct_view_count_formatted"),
                # Include all videos but with minimal details
                "videos": [{
                    "id": v.get("id"),
                    "title": v.get("title"),
                    "url": v.get("url"),
                    "channel": v.get("channel"),
                    "duration": v.get("duration")
                } for v in result["playlist"].get("videos", [])]  # Include all videos
            },
            "score": result["score"],
            "verdict": result["verdict"],
            "details": result["details"],
        }
        
        return simplified_result
    except Exception as e:
        logger.error(f"Error finding best playlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting YouTube API server...")
    logger.info("Server URL: http://localhost:8000")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("ReDoc Documentation: http://localhost:8000/redoc")
    uvicorn.run("youtube_fastapi:app", host="0.0.0.0", port=8000, reload=True) 