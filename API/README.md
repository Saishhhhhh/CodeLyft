# YouTube API - Comprehensive Documentation

This API provides a powerful interface for YouTube video and playlist operations, with a focus on educational content discovery and evaluation. It's built with FastAPI and uses multiple methods to interact with YouTube, including yt-dlp and custom web scraping techniques.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Running the API](#running-the-api)
4. [API Endpoints](#api-endpoints)
5. [Core Components](#core-components)
6. [Playlist Scoring System](#playlist-scoring-system)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

## Overview

The YouTube API is designed to provide robust access to YouTube data with a focus on finding high-quality educational content. Key features include:

- Detailed video information retrieval
- Playlist content extraction
- Advanced search capabilities
- Educational playlist scoring and ranking
- Multiple fallback mechanisms for reliability

The API uses FastAPI for the web interface and combines multiple YouTube data extraction methods, including:

1. **yt-dlp**: Primary method for reliable data extraction
2. **Custom web scraping**: Fallback method when yt-dlp is unavailable
3. **Custom playlist extraction**: Enhanced methods for complete playlist data

## Installation

### Prerequisites

- Python 3.7+
- pip (Python package manager)

### Dependencies

Install the required packages:

```bash
pip install fastapi uvicorn yt-dlp httpx python-dotenv
```

For enhanced functionality:
```bash
pip install youtube-search-python aiohttp
```

### Optional: Groq API for Semantic Relevance

For enhanced playlist quality evaluation, you can set up Groq API keys:

1. Obtain API keys from Groq
2. Create a `.env` file in the API directory
3. Add your keys:
```
GROQ_API_KEY_1=your_key_here
GROQ_API_KEY_2=your_backup_key_here
```

## Running the API

Start the API server:

```bash
cd API
python youtube_fastapi.py
```

The server will start on http://localhost:8000 with the following documentation endpoints:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Video Operations

#### GET /video/details

Retrieves detailed information about a YouTube video.

**Parameters:**
- `url` (required): YouTube video URL or ID

**Response Fields:**
- `id`: Video ID
- `title`: Video title
- `channel`: Object containing channel name, ID, and URL
- `description`: Full video description
- `thumbnail`: Thumbnail URL
- `publish_date`: Original publish date (format: YYYYMMDD)
- `publish_date_formatted`: Formatted publish date (YYYY-MM-DD)
- `duration`: Duration in seconds
- `duration_string`: Formatted duration (HH:MM:SS)
- `views`: View count
- `views_formatted`: Formatted view count with suffixes (K, M, B)
- `likes`: Like count
- `likes_formatted`: Formatted like count with suffixes
- `url`: Full YouTube URL
- `source`: Data source (yt-dlp or web_fallback)

### Playlist Operations

#### GET /playlist/videos

Retrieves videos from a YouTube playlist.

**Parameters:**
- `url` (required): YouTube playlist URL or ID
- `limit` (optional, default=0): Maximum number of videos to retrieve (0 for all)
- `max_details` (optional, default=15): Maximum number of videos to fetch detailed info for

**Response Fields:**
- `id`: Playlist ID
- `title`: Playlist title
- `url`: Playlist URL
- `channel`: Channel information
- `videos`: Array of video objects with details
- `video_count`: Total number of videos
- `direct_view_count`: Total playlist views
- `direct_view_count_formatted`: Formatted view count
- `source`: Data source

### Search Operations

#### GET /search/videos

Searches for videos on YouTube with optional filters.

**Parameters:**
- `query` (required): Search query
- `limit` (optional, default=5): Maximum number of results
- `content_type` (optional): Type of content ("video" or "playlist")
- `min_duration` (optional): Minimum duration in minutes
- `max_duration` (optional): Maximum duration in minutes

**Response Fields:**
- `query`: Original search query
- `results`: Array of video/playlist objects
- `result_count`: Number of results returned
- `source`: Data source

#### GET /search/playlists

Searches specifically for YouTube playlists.

**Parameters:**
- `query` (required): Search query
- `limit` (optional, default=5): Maximum number of results

**Response Fields:**
- `query`: Original search query
- `results`: Array of playlist objects
- `result_count`: Number of results returned
- `source`: Data source

### Recommendation Operations

#### GET /find/best-playlist

Finds the best educational playlist for a specific topic based on comprehensive scoring criteria.

**Parameters:**
- `query` (required): Topic to find the best educational playlist for
- `debug` (optional, default=false): Enable detailed scoring and debug output
- `max_videos` (optional, default=20): Maximum number of videos to include in the response (0 for all)

**Response Fields:**
- `status`: Success status
- `query`: Original search query
- `elapsed_seconds`: Processing time
- `playlists_evaluated`: Number of playlists analyzed
- `playlist`: Object containing the best playlist data
- `score`: Final score (0-10)
- `verdict`: Categorized recommendation
- `details`: Scoring breakdown

## Core Components

### Youtube.py

The main module providing core YouTube interaction functionality:

#### Key Functions:
- `get_video_details(video_id_or_url)`: Retrieves detailed information about a YouTube video
- `get_playlist_videos(playlist_id_or_url, limit, max_details)`: Fetches videos from a YouTube playlist
- `search_youtube(query, limit, content_type, min_duration, max_duration)`: Searches for videos or playlists
- `search_playlists(query, limit)`: Searches specifically for playlists
- `find_best_playlist(query, debug, detailed_fetch)`: Finds the best educational playlist for a topic
- `score_playlist(playlist, query, debug)`: Scores a playlist based on educational criteria
- `get_direct_playlist_views(playlist_url, debug)`: Extracts direct view count from playlist page
- `check_title_relevance_with_groq(title, query)`: Uses Groq API to check semantic relevance
- `evaluate_playlist_with_groq(playlist, query)`: Evaluates playlist quality using Groq LLM

#### Utility Functions:
- `format_number(num)`: Formats large numbers with K, M, B suffixes
- `extract_video_id(url)`: Extracts video ID from YouTube URL
- `extract_playlist_id(url)`: Extracts playlist ID from YouTube URL
- `check_yt_dlp()`: Checks if yt-dlp is installed
- `get_verdict(score)`: Converts numerical score to verdict category

### youtube_fastapi.py

The FastAPI application that exposes the YouTube functionality as REST endpoints:

#### Key Components:
- FastAPI app configuration with CORS middleware
- API route definitions for all endpoints
- Enhanced error handling and logging
- Custom playlist scoring with detailed logging
- Request parameter validation
- Response formatting and cleaning

#### Special Features:
- `clean_repeated_title()`: Recursively cleans repeated titles in YouTube data
- `enhanced_get_playlist_videos()`: Ensures first video has complete metadata
- `score_playlist_with_logging()`: Enhanced scoring with detailed logging

### youtube_custom_playlist.py

Custom implementation for YouTube playlist extraction:

#### Key Features:
- Handles playlists with large numbers of videos
- Works around YouTube API limitations
- Multiple extraction methods for redundancy
- Asynchronous video fetching for efficiency
- Comprehensive metadata extraction

#### Main Methods:
- `_init_playlist()`: Initializes playlist and fetches first batch of videos
- `get_next_videos()`: Retrieves the next batch of videos
- `fetch_playlist()`: Fetches all playlist videos asynchronously
- `_fetch_videos_with_continuation()`: Uses continuation tokens for large playlists
- `_extract_videos_from_html()`: Extracts video data from HTML

### custom_playlist_extractor.py

An alternative playlist extraction implementation:

#### Key Features:
- Uses YouTube's internal API
- Handles continuation tokens for large playlists
- Efficient video batch fetching
- Resilient to YouTube API changes

#### Main Methods:
- `fetch_playlist()`: Main method to retrieve all playlist videos
- `_fetch_videos_with_api()`: Uses YouTube's internal API with continuation tokens

### youtube_search_httpx_patch.py

A patch for the youtube-search-python library:

#### Purpose:
- Fixes issues with the httpx library's proxies parameter
- Ensures compatibility with the latest httpx versions

#### Implementation:
- Monkey patches httpx.post and httpx.get methods
- Removes problematic 'proxies' parameter from requests

## Playlist Scoring System

The API includes a sophisticated scoring system for educational playlists, designed to identify high-quality content. The scoring algorithm evaluates multiple factors:

### Scoring Criteria

#### 1. Video Count (0-1.5 points)
Evaluates the comprehensiveness of the playlist based on video count:
- **1.5 points**: 30+ videos
- **1.0 points**: 20-29 videos
- **0.5 points**: 10-19 videos
- **0.0 points**: <10 videos

#### 2. Total Views (0-1.5 points)
Measures popularity and community validation:
- **1.5 points**: 10M+ views
- **1.0 points**: 1M-10M views
- **0.5 points**: 100K-1M views
- **0.0 points**: <100K views

#### 3. Duration Ratio (0-2.0 points)
Assesses content depth based on average video length:
- **2.0 points**: Average 45+ minutes per video
- **1.5 points**: Average 30-45 minutes per video
- **1.0 points**: Average 15-30 minutes per video
- **0.0 points**: Average <15 minutes per video

#### 4. Recency (0-1.5 points)
Evaluates content currency based on first video publish date:
- **1.5 points**: Current year
- **1.0 points**: Last year
- **0.5 points**: Older

#### 5. Like/View Ratio (0-0.5 points)
Measures viewer engagement and satisfaction:
- **0.5 points**: ≥4% like/view ratio
- **0.25 points**: ≥2% like/view ratio
- **0.0 points**: <2% like/view ratio

#### 6. Content Quality (0-2.0 points)
Evaluates semantic relevance and educational value using Groq API:
- **2.0 points**: Excellent relevance and educational value
- **1.5 points**: Good relevance and educational value
- **1.0 points**: Moderate relevance and educational value
- **0.5 points**: Low relevance or educational value
- **0.0 points**: Poor relevance and educational value

#### 7. First Video Popularity (0-1.0 points)
Assesses the quality of the introductory content:
- **1.0 points**: 1M+ views
- **0.5 points**: 100K-1M views
- **0.0 points**: <100K views

### Verdict Categories

The total score (out of 10 points) determines the playlist's verdict:

- **⭐ EXCEPTIONAL** (≥8.0 points): Use immediately, stop searching
- **👍 GOOD** (≥7.0 points): High-quality content
- **⚠️ AVERAGE** (≥6.0 points): Acceptable but keep looking
- **❌ REJECTED** (<6.0 points): Not recommended

### Implementation Details

The scoring system is implemented in the `score_playlist()` function in Youtube.py with these key components:

1. **Video Count Evaluation**: Counts the number of videos in the playlist
2. **View Count Analysis**: Extracts and evaluates direct playlist views
3. **Duration Calculation**: Computes total and average video duration
4. **Publish Date Detection**: Extracts first video publish date using multiple methods
5. **Like/View Ratio Calculation**: Computes engagement metrics for the first video
6. **Semantic Relevance**: Uses Groq API to evaluate content quality
7. **Score Aggregation**: Combines all scores into a final rating
8. **Detailed Logging**: Provides comprehensive scoring breakdown

The enhanced version in youtube_fastapi.py (`score_playlist_with_logging()`) adds detailed logging of the scoring process, showing exactly how each score component is calculated.

## Advanced Features

### Multiple Fallback Mechanisms

The API implements a multi-layered fallback system to ensure reliability:

1. **Primary Method**: Uses yt-dlp for best results with full metadata
   - Provides the most comprehensive video and playlist data
   - Handles various YouTube URL formats and regional restrictions
   - Extracts metadata like likes, views, and publish dates

2. **Secondary Method**: Falls back to web scraping if yt-dlp fails
   - Uses custom regex patterns to extract data from YouTube pages
   - Works even when yt-dlp is not installed or encounters errors
   - Handles YouTube API changes gracefully

3. **Tertiary Method**: Custom implementations for specific operations
   - `CustomPlaylist` class for handling large playlists
   - Direct HTML parsing for playlist view counts
   - Multiple date extraction methods for publish dates

### Enhanced Logging System

The API includes comprehensive logging to track operations and troubleshoot issues:

1. **Request Logging**: Records all API requests with parameters
2. **Performance Metrics**: Tracks processing time for complex operations
3. **Scoring Details**: Provides detailed breakdown of playlist scoring
4. **Error Handling**: Captures and logs exceptions with tracebacks
5. **Debug Mode**: Optional detailed logging with the `debug=true` parameter

### Advanced Publish Date Detection

The system uses multiple methods to extract video publish dates:

1. **YYYYMMDD Format**: Primary extraction from yt-dlp metadata
2. **ISO Format**: Secondary extraction from YouTube API data
3. **Relative Date Parsing**: Converts "X years ago" format to actual dates
4. **Year Extraction**: Falls back to extracting just the year for scoring

### Title Cleaning Algorithm

Automatically cleans repeated titles in YouTube data:

1. **Newline Removal**: Handles titles with embedded newlines
2. **Duplicate Section Removal**: Removes repeated text in titles
3. **Recursive Processing**: Cleans titles in nested data structures
4. **Special Character Handling**: Properly handles Unicode and special characters

### Cross-Origin Resource Sharing (CORS)

The API includes CORS middleware to allow requests from:
- http://localhost:5173
- http://127.0.0.1:5173
- http://localhost:3000
- http://localhost:8000
- http://127.0.0.1:8000

### API Key Rotation

For Groq API integration, the system implements key rotation:

1. **Multiple Key Support**: Configurable with multiple API keys
2. **Automatic Rotation**: Cycles through keys on rate limits
3. **Retry Mechanism**: Automatically retries failed requests
4. **Graceful Degradation**: Falls back to basic scoring if API is unavailable

## Troubleshooting

### Common Issues

#### 1. API Returns 500 Error

**Possible Causes:**
- yt-dlp is not installed or outdated
- Network connectivity issues
- YouTube API changes or rate limiting

**Solutions:**
- Install or update yt-dlp: `pip install --upgrade yt-dlp`
- Check your internet connection
- Verify YouTube is accessible from your server
- Review the API logs for specific error details

#### 2. Missing Video Details

**Possible Causes:**
- Video is age-restricted or private
- Video metadata is incomplete on YouTube
- Region restrictions are blocking access

**Solutions:**
- Use the `debug=true` parameter for more information
- Check if the video is accessible in your browser
- Try a different video or playlist
- Consider using a VPN if region restrictions apply

#### 3. Slow Playlist Retrieval

**Possible Causes:**
- Large playlists take longer to process
- YouTube rate limiting
- Network latency
- Server resource constraints

**Solutions:**
- Use the `limit` parameter to reduce response time
- Implement caching for frequently accessed playlists
- Increase server resources if possible
- Add timeouts to prevent hanging requests

#### 4. Inaccurate Scoring

**Possible Causes:**
- Missing Groq API keys
- Incomplete video metadata
- YouTube API changes affecting data extraction
- Incorrect date parsing

**Solutions:**
- Set `debug=true` to see detailed scoring breakdown
- Verify Groq API keys are correctly configured
- Check if first video metadata is being properly extracted
- Review logs for specific scoring component issues

### Updating yt-dlp

If you encounter issues with YouTube API changes:

```bash
pip install --upgrade yt-dlp
```

### Rate Limiting Strategies

To avoid YouTube rate limiting:

1. **Add Delays**: Implement pauses between requests
2. **Batch Processing**: Fetch data in batches rather than all at once
3. **IP Rotation**: Use different IP addresses if possible
4. **Caching**: Store results to reduce repeated requests
5. **Request Queue**: Implement a queue system for high-volume usage

### Debug Mode

Enable debug mode for detailed information:

```
GET /find/best-playlist?query=React%20Course&debug=true
```

The debug mode provides:
- Detailed scoring breakdown
- Processing steps and decisions
- Data extraction details
- Error information 