# 🚀 YouTube Content Analysis API

**Intelligent YouTube content discovery, analysis, and recommendation system for CodeLyft.**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white)](https://python.org/)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000.svg?style=flat&logo=YouTube&logoColor=white)](https://youtube.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Core Modules](#-core-modules)
- [Key Scoring Thresholds](#-key-scoring-thresholds)

---

## 🎯 Overview

The YouTube Content Analysis API is a sophisticated FastAPI-based system designed to intelligently discover, analyze, and recommend high-quality educational content from YouTube. It combines multiple AI models, advanced content scoring algorithms, and robust data processing to provide accurate technology-specific learning recommendations.

### Key Capabilities

- **🎥 Intelligent Video Discovery**: Find relevant educational videos using AI-powered relevance checking
- **📚 Playlist Analysis**: Evaluate and rank educational playlists based on quality metrics
- **🤖 Technology Matching**: Advanced technology name normalization and equivalence detection
- **📊 Content Scoring**: Multi-factor quality assessment for videos and playlists
- **🔄 Batch Processing**: Efficient processing of multiple content items simultaneously

---

## ✨ Features

### 🧠 AI-Powered Analysis
- **Groq LLM Integration**: Semantic relevance checking using state-of-the-art language models
- **Gemini API**: Technology extraction from video titles and descriptions
- **Multi-Model Approach**: Combines multiple AI services for robust analysis

### 📈 Intelligent Scoring
- **Playlist Evaluation**: Structure analysis, video count, total duration, and engagement
- **Technology Relevance**: Semantic similarity and keyword-based relevance checking

### 🔧 Robust Infrastructure
- **Multiple Data Sources**: yt-dlp, web scraping, and API fallbacks
- **Error Handling**: Comprehensive error recovery and graceful degradation
- **Rate Limiting**: Intelligent API usage management
- **Caching**: Efficient data caching and retrieval

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- yt-dlp (for video downloading)
- API keys for AI services (optional but recommended)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
export GROQ_API_KEY="your_groq_api_key"
export GROQ_MODEL="llama-3.3-70b-versatile"
export GEMINI_API_KEY="your_gemini_api_key"  # Optional
```

### Running the Server

```bash
# Development mode with hot reload
python server_launcher.py

# Production mode
uvicorn youtube_fastapi:app --host=0.0.0.0 --port=8000
```

### Basic Usage

```python
import requests

# Get video details
response = requests.get("http://localhost:8000/video/details?url=https://youtube.com/watch?v=VIDEO_ID")
video_data = response.json()

# Search for videos
response = requests.get("http://localhost:8000/search/videos?query=python tutorial&limit=5")
videos = response.json()

# Find best playlist
response = requests.get("http://localhost:8000/find/best-playlist?query=react js")
playlist = response.json()
```

---

## 📡 API Endpoints

### Video Operations

#### `GET /video/details`
Get detailed information about a specific YouTube video.

**Parameters:**
- `url` (string, required): YouTube video URL or ID

**Example Response:**
```json
{
  "id": "video_id",
  "title": "Complete Python Tutorial for Beginners",
  "duration": "10:30",
  "views": 1000000,
  "likes": 50000,
  "channel": "Programming Channel"
}
```

#### `GET /search/videos`
Search for YouTube videos with advanced filtering.

**Parameters:**
- `query` (string, required): Search query
- `limit` (integer, optional): Maximum results (default: 5)
- `min_duration` (integer, optional): Minimum duration in minutes
- `max_duration` (integer, optional): Maximum duration in minutes

### Playlist Operations

#### `GET /playlist/videos`
Get all videos from a YouTube playlist.

**Parameters:**
- `url` (string, required): YouTube playlist URL or ID
- `limit` (integer, optional): Maximum videos to retrieve (0 for all)

#### `GET /find/best-playlist`
Find the best educational playlist for a given topic.

**Parameters:**
- `query` (string, required): Topic to find playlist for
- `debug` (boolean, optional): Enable detailed scoring output

**Example Response:**
```json
{
  "playlist": {
    "title": "Complete React Course 2024",
    "videos": [...],
    "score": 8.5
  },
  "technologies": ["react", "javascript"]
}
```

### AI-Powered Analysis

#### `POST /check-relevance`
Check if a video title is relevant to a specific technology.

**Request Body:**
```json
{
  "title": "Complete Python Tutorial for Beginners",
  "technology": "python"
}
```

**Response:**
```json
{
  "isRelevant": true,
  "similarity": 0.95,
  "explanation": "Title directly mentions Python technology"
}
```

#### `POST /check-batch-relevance`
Check relevance for multiple titles simultaneously.

#### `GET /match`
Check if two technology names are equivalent.

**Parameters:**
- `tech1` (string, required): First technology name
- `tech2` (string, required): Second technology name

---

## 🔧 Core Modules

### **API Layer** (`youtube_fastapi.py`)
- Main FastAPI application with all endpoints
- Request/response handling and middleware
- Error handling and CORS configuration

### **YouTube Operations** (`Youtube.py`)
- Core video and playlist fetching functionality
- Search operations with advanced filtering
- Content scoring and quality assessment algorithms
- Intelligent playlist recommendation system

### **AI Services**
- **`relevance_checker.py`**: Groq LLM integration for semantic relevance analysis
- **`tech_extractor.py`**: Gemini API for technology extraction from text
- **`technology_matcher.py`**: Advanced technology name matching and aliases

### **Data Processing**
- **`youtube_custom_playlist.py`**: Custom playlist parsing and fetching
- **`youtube_search_httpx_patch.py`**: Library compatibility fixes
- Title cleaning, deduplication, and preprocessing utilities

### **Supporting Files**
- **`server_launcher.py`**: Development server with hot reload
- **`tech_aliases.json`**: Technology name mappings and aliases
- **`title_examples.json`**: Training data for relevance models

---

## 📊 Key Scoring Thresholds

### Playlist Quality Scoring (0-10.0 points)

#### **Critical Filter: Title Relevance**
```python
# Must pass title relevance check before scoring begins
# Uses AI-powered relevance checking or fallback to basic matching
# Playlists that fail this check are rejected immediately
```

#### **1. Duration Ratio (2.0 points)**
```python
# Duration per video thresholds
DURATION_HIGH = 45  # minutes per video for highest score (2.0 points)
DURATION_MEDIUM = 30  # minutes per video for medium score (1.5 points)  
DURATION_LOW = 15  # minutes per video for minimum score (1.0 points)

# Scoring logic
if total_duration >= (video_count × 45): score = 2.0
elif total_duration >= (video_count × 30): score = 1.5
elif total_duration >= (video_count × 15): score = 1.0
else: score = 0.0
```

#### **2. Total Playlist Views (2.0 points)**
```python
TOTAL_VIEWS_1M = 2.0  # ≥ 1,000,000 views
TOTAL_VIEWS_500K = 1.7  # 500,000 - 999,999 views
TOTAL_VIEWS_100K = 1.2  # 100,000 - 499,999 views
TOTAL_VIEWS_LOW = 0.7  # < 100,000 views
```

#### **3. Video Count (1.8 points)**
```python
VIDEO_COUNT_IDEAL = 1.8  # ≥ 10 videos (ideal range)
VIDEO_COUNT_GOOD = 1.3  # 5-9 videos
VIDEO_COUNT_LOW = 0.8  # < 5 videos
```

#### **4. Average Views per Video (1.5 points)**
```python
AVG_VIEWS_100K = 1.5  # ≥ 100,000 average views
AVG_VIEWS_50K = 1.1  # 50,000 - 100,000 average views
AVG_VIEWS_10K = 0.8  # 10,000 - 50,000 average views
AVG_VIEWS_LOW = 0.4  # < 10,000 average views
```

#### **5. First Video Views (1.2 points)**
```python
FIRST_VIDEO_500K = 1.2  # ≥ 500,000 views on first video
FIRST_VIDEO_100K = 0.9  # 100,000 - 500,000 views on first video
FIRST_VIDEO_LOW = 0.4  # < 100,000 views on first video
```

#### **6. Like Ratio (1.0 points)**
```python
LIKE_RATIO_2_PERCENT = 1.0  # ≥ 2% like-to-view ratio
LIKE_RATIO_1_PERCENT = 0.7  # 1-2% like-to-view ratio
LIKE_RATIO_LOW = 0.3  # < 1% like-to-view ratio
```

#### **7. Recency (0.5 points)**
```python
RECENCY_1_YEAR = 0.5  # Updated within 1 year
RECENCY_2_YEARS = 0.3  # 1-2 years old
RECENCY_OLDER = 0.1  # > 2 years old
```

#### **Quality Tiers**
```python
EXCEPTIONAL_PLAYLIST = 8.0  # ≥ 8.0 points
GOOD_PLAYLIST = 7.0  # ≥ 7.0 points  
AVERAGE_PLAYLIST = 5.0  # ≥ 5.0 points
# Below 5.0 points = Rejected
```

### Technology Matching Thresholds

```python
SIMILARITY_THRESHOLD = 0.85  # Minimum similarity for technology equivalence
MIN_LENGTH_FOR_FUZZY = 3  # Minimum length for fuzzy matching
MAX_LENGTH_RATIO = 0.5  # Maximum length ratio for fuzzy matching
FUZZY_THRESHOLD = 0.95  # Very strict threshold for fuzzy matching
```

### Relevance Checking Thresholds

```python
RELEVANCE_SIMILARITY_THRESHOLD = 0.8  # Minimum similarity for relevance
BATCH_SIZE = 10  # Default batch size for relevance checking
MAX_TITLE_LENGTH = 200  # Maximum title length for processing
```

---

## 🔗 Related Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Groq API Documentation](https://console.groq.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Built with ❤️ for educational content discovery** 