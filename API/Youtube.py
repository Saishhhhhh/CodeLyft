"""
YouTube API - Simple interface for video details, playlists, and search
Uses yt-dlp as primary method with web scraping fallback
"""

import os
import re
import json
import sys
import subprocess
import urllib.request
import urllib.parse
from datetime import datetime
import http.client
import ssl
import time  # Add time module for sleep
import requests  # Add requests library for modern HTTP requests
import random
import concurrent.futures
import traceback  # Add traceback for error handling
from urllib.parse import urlparse, parse_qs

# Import relevance checker for batch processing
try:
    from relevance_checker import check_batch_relevance
except ImportError:
    print("Warning: relevance_checker module not found. Relevance checking will be unavailable.")
    def check_batch_relevance(titles, query):
        print("Relevance checking unavailable: relevance_checker module not found")
        return None

# Try to import dotenv for .env file support
try:
    from dotenv import load_dotenv
    # Load environment variables from .env file
    load_dotenv()
    HAS_DOTENV = True
except ImportError:
    HAS_DOTENV = False

# Import the custom playlist implementation and required components
try:
    import youtube_search_httpx_patch
    from youtube_custom_playlist import CustomPlaylist
    HAS_CUSTOM_PLAYLIST = True
except ImportError:
    print("Note: Advanced playlist functionality unavailable. Using fallback methods.")
    HAS_CUSTOM_PLAYLIST = False

# Using batch processing with Groq LLM for relevance checking

# ===== UTILITY FUNCTIONS =====

def format_number(num):
    """Format large numbers with K, M, B suffixes"""
    if num is None:
        return "N/A"
    
    try:
        num = int(num)
        if num < 1000:
            return str(num)
        elif num < 1000000:
            return f"{num/1000:.1f}K".replace(".0K", "K")
        elif num < 1000000000:
            return f"{num/1000000:.1f}M".replace(".0M", "M")
        else:
            return f"{num/1000000000:.1f}B".replace(".0B", "B")
    except:
        return str(num)

def extract_video_id(url):
    """Extract the video ID from a YouTube URL"""
    if not url:
        return None
    
    try:
        if "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
        elif "youtube.com/watch" in url and "v=" in url:
            start_idx = url.find("v=") + 2
            end_idx = url.find("&", start_idx) if "&" in url[start_idx:] else len(url)
            video_id = url[start_idx:end_idx]
        else:
            video_id = url
            
        if len(video_id) != 11:
            print(f"Warning: Extracted ID '{video_id}' is not 11 characters long")
            if len(video_id) > 11:
                video_id = video_id[:11]
        
        return video_id
    except Exception as e:
        print(f"Error extracting video ID: {e}")
        return url

def extract_playlist_id(url):
    """Extract playlist ID from a YouTube URL"""
    if not url:
        return None
    
    try:
        if "list=" in url:
            # Extract the playlist ID from the URL
            start_idx = url.find("list=") + 5
            end_idx = url.find("&", start_idx) if "&" in url[start_idx:] else len(url)
            playlist_id = url[start_idx:end_idx]
            return playlist_id
        else:
            # Assume it's already a playlist ID
            return url
    except Exception as e:
        print(f"Error extracting playlist ID: {e}")
        return url  # Return as-is

def check_yt_dlp():
    """Check if yt-dlp is installed"""
    try:
        subprocess.run(["yt-dlp", "--version"], 
                      stdout=subprocess.PIPE, 
                      stderr=subprocess.PIPE, 
                      check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

def search_youtube(query, limit=8, content_type=None, min_duration=None, max_duration=None):
    """Search for videos or playlists on YouTube with filters"""
    # Try yt-dlp first (best results)
    if check_yt_dlp():
        try:
            if content_type and content_type.lower() == 'playlist':
                encoded_query = urllib.parse.quote_plus(query)
                search_url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=EgIQAw%253D%253D"
                cmd = ["yt-dlp", "--flat-playlist", "--print-json", search_url]
            else:
                base_url = f"ytsearch{limit}:"
                search_filters = []
                
                if content_type and content_type.lower() == 'video':
                    search_filters.append("type:video")
                
                if min_duration is not None and max_duration is not None:
                    search_filters.append(f"duration>{min_duration}:{max_duration}")
                elif min_duration is not None:
                    search_filters.append(f"duration>{min_duration}")
                elif max_duration is not None:
                    search_filters.append(f"duration<{max_duration}")
                
                if search_filters:
                    query = f"{' '.join(search_filters)} {query}"
                
                search_url = f"{base_url}{query}"
                cmd = ["yt-dlp", "--flat-playlist", "--print-json", search_url]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            videos = []
            for line in result.stdout.strip().split('\n'):
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    
                    if content_type and content_type.lower() == 'playlist':
                        if data.get('_type') == 'playlist' or 'entries' in data:
                            playlist_data = {
                                "id": data.get("id", ""),
                                "title": data.get("title", "Unknown Playlist"),
                                "channel": {"name": data.get("uploader", "Unknown Channel")},
                                "video_count": data.get("playlist_count", "Unknown"),
                                "url": f"https://www.youtube.com/playlist?list={data.get('id', '')}",
                                "type": "playlist"
                            }
                            videos.append(playlist_data)
                    else:
                        is_playlist = data.get('_type') == 'playlist' or 'entries' in data
                        
                        if is_playlist:
                            playlist_data = {
                                "id": data.get("id", ""),
                                "title": data.get("title", "Unknown Playlist"),
                                "channel": {"name": data.get("uploader", "Unknown Channel")},
                                "video_count": data.get("playlist_count", "Unknown"),
                                "url": f"https://www.youtube.com/playlist?list={data.get('id', '')}",
                                "type": "playlist"
                            }
                            videos.append(playlist_data)
                        else:
                            video = {
                                "id": data.get("id", ""),
                                "title": data.get("title", "Unknown"),
                                "channel": {"name": data.get("uploader", "Unknown Channel")},
                                "duration": data.get("duration_string", "Unknown"),
                                "duration_seconds": data.get("duration", 0),
                                "thumbnail": data.get("thumbnail", ""),
                                "url": f"https://www.youtube.com/watch?v={data.get('id', '')}",
                                "type": "video"
                            }
                            videos.append(video)
                except json.JSONDecodeError:
                    print(f"Error parsing JSON: {line}")
            
            # Return results directly without fetching detailed info
            return {
                "query": query,
                "results": videos,
                "result_count": len(videos),
                "source": "yt-dlp"
            }
        except Exception as e:
            print(f"yt-dlp error: {e}")
            return search_youtube_web(query, limit, content_type, min_duration, max_duration)
    
    # Web scraping fallback
    return search_youtube_web(query, limit, content_type, min_duration, max_duration)

# ===== MAIN API FUNCTIONS =====

def get_video_details(video_id_or_url):
    """Get details about a YouTube video including likes"""
    video_id = extract_video_id(video_id_or_url)
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Try yt-dlp first (best results)
    if check_yt_dlp():
        try:
            cmd = ["yt-dlp", "--no-playlist", "--skip-download", "--print-json", url]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout.strip())
            
            # Process the publish date to ensure we have a usable format
            publish_date = data.get("upload_date", "")
            # If we have a date in YYYYMMDD format, format it more clearly
            if publish_date and publish_date.isdigit() and len(publish_date) == 8:
                year = publish_date[:4]
                month = publish_date[4:6]
                day = publish_date[6:8]
                publish_date_formatted = f"{year}-{month}-{day}"
            else:
                publish_date_formatted = publish_date
            
            return {
                "id": data.get("id", ""),
                "title": data.get("title", "Unknown"),
                "channel": {
                    "name": data.get("uploader", "Unknown Channel"),
                    "id": data.get("channel_id", ""),
                    "url": data.get("channel_url", "")
                },
                "description": data.get("description", ""),
                "thumbnail": data.get("thumbnail", ""),
                "publish_date": publish_date,
                "publish_date_formatted": publish_date_formatted,
                "duration": data.get("duration", 0),
                "duration_string": data.get("duration_string", ""),
                "views": data.get("view_count", 0),
                "views_formatted": format_number(data.get("view_count", 0)),
                "likes": data.get("like_count", None),
                "likes_formatted": format_number(data.get("like_count", None)),
                "url": url,
                "source": "yt-dlp"
            }
        except Exception as e:
            print(f"yt-dlp error: {e}")
    
    # Web scraping fallback
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        
        # Extract basic info
        title_match = re.search(r'<title>(.*?) - YouTube</title>', html)
        title = title_match.group(1) if title_match else "Unknown Title"
        
        channel_match = re.search(r'"ownerChannelName":"([^"]+)"', html)
        channel_name = channel_match.group(1) if channel_match else "Unknown Channel"
        
        view_match = re.search(r'"viewCount":"(\d+)"', html)
        views = int(view_match.group(1)) if view_match else None
        
        # Extract likes (simplified pattern)
        likes = None
        likes_match = re.search(r'"likeCount":"([^"]+)"', html) or re.search(r'"label":"([0-9,]+) likes"', html)
        if likes_match:
            try:
                likes_str = likes_match.group(1).replace(',', '')
                likes = int(likes_str)
            except ValueError:
                pass
        
        # Extract other info
        desc_match = re.search(r'"shortDescription":"([^"]+)"', html)
        description = desc_match.group(1).replace('\\n', '\n').replace('\\', '') if desc_match else ""
        
        # Try multiple patterns to extract publish date
        publish_date = None
        publish_date_formatted = None
        date_patterns = [
            r'"publishDate":"([^"]+)"',
            r'"uploadDate":"([^"]+)"', 
            r'{"text":"Premiered ([^"]+)"}',
            r'{"text":"([A-Z][a-z]+ \d+, \d{4})"}',
            r'itemprop="datePublished" content="([^"]+)"',
            r'"dateText":\{"simpleText":"([^"]+)"',
            r'"publishDate":"(.+?)"'
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, html)
            if date_match:
                publish_date = date_match.group(1)
                break
        
        # If we found a date, try to standardize its format
        if publish_date:
            # If it's already in ISO format (YYYY-MM-DD), keep it as formatted date
            if re.match(r'\d{4}-\d{2}-\d{2}', publish_date):
                publish_date_formatted = publish_date
            # Handle "Month Day, Year" format
            elif re.match(r'[A-Z][a-z]+ \d+, \d{4}', publish_date):
                try:
                    from datetime import datetime
                    dt = datetime.strptime(publish_date, '%B %d, %Y')
                    publish_date_formatted = dt.strftime('%Y-%m-%d')
                except Exception as e:
                    print(f"Error converting date format: {e}")
        
        duration_match = re.search(r'"lengthSeconds":"(\d+)"', html)
        duration = int(duration_match.group(1)) if duration_match else None
        
        duration_string = None
        if duration:
            minutes = duration // 60
            seconds = duration % 60
            duration_string = f"{minutes}:{seconds:02d}"
        
        return {
            "id": video_id,
            "title": title,
            "channel": {"name": channel_name},
            "description": description,
            "views": views,
            "views_formatted": format_number(views),
            "likes": likes,
            "likes_formatted": format_number(likes),
            "publish_date": publish_date,
            "publish_date_formatted": publish_date_formatted,
            "duration": duration,
            "duration_string": duration_string,
            "url": url,
            "source": "web_fallback"
        }
    except Exception as e:
        print(f"Web fallback error: {e}")
        return {
            "id": video_id,
            "title": "Could not retrieve video info",
            "error": str(e),
            "url": url
        }

def get_playlist_videos(playlist_id_or_url, limit=0, max_details=15):
    """
    Get videos from a YouTube playlist
    
    Args:
        playlist_id_or_url: YouTube playlist ID or URL
        limit: Maximum number of videos to retrieve (0 for all videos)
        max_details: Maximum number of videos to fetch detailed info for (typically just set to 1)
        
    Returns:
        dict: Playlist info with videos
    """
    # Safety limits to prevent excessive fetching or timeouts
    MAX_VIDEOS_SAFETY = 500  # Increased from 100 to 500
    MAX_FETCH_ATTEMPTS = 20  # Increased from 10 to 20
    FETCH_TIMEOUT_SECONDS = 60  # Increased from 30 to 60 seconds
    BATCH_SIZE = 100  # Number of videos to fetch per batch
    
    playlist_id = extract_playlist_id(playlist_id_or_url)
    playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"
    
    # First, try to get direct playlist view count from the web page
    direct_view_count = get_direct_playlist_views(playlist_url, debug=True)
    
    # Try using the CustomPlaylist implementation if available
    if HAS_CUSTOM_PLAYLIST:
        try:
            print(f"Fetching playlist using CustomPlaylist: {playlist_id}")
            playlist = CustomPlaylist(playlist_id)
            
            # Use asyncio to directly fetch all videos using our fetch_playlist method
            import asyncio
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                success = loop.run_until_complete(playlist.fetch_playlist())
                loop.close()
                
                if not success or not playlist.videos:
                    print("Error fetching playlist or no videos found")
                    return {
                        "id": playlist_id,
                        "title": playlist.info.get('title', 'Unknown Playlist'),
                        "url": playlist_url,
                        "videos": [],
                        "video_count": 0,
                        "source": "custom_playlist"
                    }
            except Exception as e:
                print(f"Error running async fetch_playlist: {e}")
                import traceback
                traceback.print_exc()
                
                # If we failed to fetch videos with the async method, try the regular method
            if not playlist.videos:
                print("No videos found in playlist")
                return {
                    "id": playlist_id,
                    "title": playlist.info.get('title', 'Unknown Playlist'),
                    "url": playlist_url,
                    "videos": [],
                    "video_count": 0,
                    "source": "custom_playlist"
                }
            
            # If we have a limit, respect it
            if limit > 0 and len(playlist.videos) > limit:
                playlist.videos = playlist.videos[:limit]
                print(f"Limited videos to {limit} as requested")
            
            # Format the videos to match our expected structure
            formatted_videos = []
            for i, video in enumerate(playlist.videos):
                formatted_video = {
                    "id": video.get("id", ""),
                    "title": video.get("title", "Unknown"),
                    "channel": {"name": video.get("channel", {}).get("name", "Unknown Channel")},
                    "duration": video.get("duration", "Unknown"),
                    "url": f"https://www.youtube.com/watch?v={video.get('id', '')}",
                    "publish_date": video.get("publish_date", "Unknown")
                }
                formatted_videos.append(formatted_video)
            
            # Get detailed info for ONLY the first video (if available) for scoring purposes
            if formatted_videos and max_details > 0:
                print(f"\nFetching detailed information for first video for scoring purposes...")
                try:
                    first_video = formatted_videos[0]
                    print(f"Getting details for first video: {first_video['title'][:30]}...")
                    details = get_video_details(first_video["id"])
                    if "likes" in details:
                        first_video["likes"] = details["likes"]
                        first_video["likes_formatted"] = details["likes_formatted"]
                    if "views" in details:
                        first_video["views"] = details["views"]
                        first_video["views_formatted"] = details["views_formatted"]
                    if "publish_date" in details:
                        first_video["publish_date"] = details["publish_date"]
                    if "duration" in details:
                        first_video["duration_seconds"] = details["duration"]
                        first_video["duration_string"] = details["duration_string"]
                except Exception as e:
                    print(f"Error getting details for first video: {e}")
            
            # Print debugging info for the playlist title
            print(f"Raw playlist info: {playlist.info}")
            
            # Get title from the playlist info
            playlist_title = playlist.info.get('title')
            if playlist_title == 'Unknown Playlist':
                # Try to get the title from yt-dlp as a fallback
                try:
                    if check_yt_dlp():
                        info_cmd = ["yt-dlp", "--flat-playlist", "--skip-download", "--print", "%(playlist_title)s", playlist_url]
                        info_result = subprocess.run(info_cmd, capture_output=True, text=True, check=True)
                        playlist_title = info_result.stdout.strip() or "Unknown Playlist"
                        print(f"Got playlist title from yt-dlp: {playlist_title}")
                except Exception as e:
                    print(f"Failed to get playlist title from yt-dlp: {e}")
            
            # Clean up the playlist title (remove repetitions)
            if playlist_title and '\n' in playlist_title:
                # If the title contains newlines, it might be repeated
                # Take only the first line
                playlist_title = playlist_title.split('\n')[0].strip()
            
            # Add direct view count to the result if available
            result = {
                "id": playlist_id,
                "title": playlist_title,
                "channel": {"name": playlist.info.get('channel', {}).get('name', 'Unknown Channel')},
                "url": playlist_url,
                "videos": formatted_videos,
                "video_count": len(formatted_videos),
                "source": "custom_playlist"
            }
            
            if direct_view_count is not None:
                result["direct_view_count"] = direct_view_count
                result["direct_view_count_formatted"] = format_number(direct_view_count)
                
            return result
        except Exception as e:
            print(f"CustomPlaylist error: {e}")
            import traceback
            traceback.print_exc()
    
    # Try yt-dlp if CustomPlaylist isn't available or failed
    if check_yt_dlp():
        try:
            # Get playlist title
            info_cmd = ["yt-dlp", "--flat-playlist", "--skip-download", "--print", "%(playlist_title)s", playlist_url]
            info_result = subprocess.run(info_cmd, capture_output=True, text=True, check=True)
            playlist_title = info_result.stdout.strip() or "Unknown Playlist"
            
            # Get videos
            videos_cmd = ["yt-dlp", "--flat-playlist", "--print-json"]
            if limit > 0:
                videos_cmd.append(f"--playlist-end={limit}")
            videos_cmd.append(playlist_url)
            
            videos_result = subprocess.run(videos_cmd, capture_output=True, text=True, check=True)
            
            videos = []
            for line in videos_result.stdout.strip().split('\n'):
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    video = {
                        "id": data.get("id", ""),
                        "title": data.get("title", "Unknown"),
                        "channel": {"name": data.get("uploader", "Unknown Channel")},
                        "duration": data.get("duration_string", "Unknown"),
                        "duration_seconds": data.get("duration", 0),
                        "thumbnail": data.get("thumbnail", ""),
                        "url": f"https://www.youtube.com/watch?v={data.get('id', '')}",
                        "publish_date": data.get("upload_date", "Unknown")
                    }
                    videos.append(video)
                except json.JSONDecodeError:
                    print(f"Error parsing JSON: {line}")
            
            # Get detailed info for ONLY the first video (if available)
            if videos and max_details > 0:
                first_video = videos[0]
                try:
                    details = get_video_details(first_video["id"])
                    if "likes" in details:
                        first_video["likes"] = details["likes"]
                        first_video["likes_formatted"] = details["likes_formatted"]
                    if "views" in details:
                        first_video["views"] = details["views"]
                        first_video["views_formatted"] = details["views_formatted"]
                except Exception as e:
                    print(f"Error getting details for first video: {e}")
            
            # Add direct view count to the result if available
            result = {
                "id": playlist_id,
                "title": playlist_title,
                "url": playlist_url,
                "videos": videos,
                "video_count": len(videos),
                "source": "yt-dlp"
            }
            
            if direct_view_count is not None:
                result["direct_view_count"] = direct_view_count
                result["direct_view_count_formatted"] = format_number(direct_view_count)
                
            return result
        except Exception as e:
            print(f"yt-dlp error: {e}")
    
    # Web scraping fallback
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        req = urllib.request.Request(playlist_url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='replace')
        
        # Extract playlist title
        title_match = re.search(r'<title>(.*?) - YouTube</title>', html)
        playlist_title = title_match.group(1) if title_match else "Unknown Playlist"
        
        # Try to extract videos using regex
        video_pattern = r'"videoRenderer":{"videoId":"([^"]+)","thumbnail":.+?"title":.+?"text":"([^"]+)".+?"ownerText":.+?"text":"([^"]+)"'
        matches = re.finditer(video_pattern, html)
        
        videos = []
        for i, match in enumerate(matches):
            if limit > 0 and i >= limit:
                break
            
            video_id, title, channel = match.groups()
            video = {
                "id": video_id,
                "title": title,
                "channel": {"name": channel},
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "publish_date": "Unknown"
            }
            videos.append(video)
        
        # Get detailed info for ONLY the first video (if available)
        if videos and max_details > 0:
            try:
                first_video = videos[0]
                print(f"Getting details for first video: {first_video['title'][:30]}...")
                details = get_video_details(first_video["id"])
                if "likes" in details:
                    first_video["likes"] = details["likes"]
                    first_video["likes_formatted"] = details["likes_formatted"]
                if "views" in details:
                    first_video["views"] = details["views"]
                    first_video["views_formatted"] = details["views_formatted"]
                if "publish_date" in details:
                    first_video["publish_date"] = details["publish_date"]
                if "duration" in details:
                    first_video["duration_seconds"] = details["duration"]
                    first_video["duration_string"] = details["duration_string"]
            except Exception as e:
                print(f"Error getting details for first video: {e}")
        
        # Add direct view count to the result if available
        result = {
            "id": playlist_id,
            "title": playlist_title,
            "url": playlist_url,
            "videos": videos,
            "video_count": len(videos),
            "source": "web_fallback"
        }
        
        if direct_view_count is not None:
            result["direct_view_count"] = direct_view_count
            result["direct_view_count_formatted"] = format_number(direct_view_count)
            
        return result
    except Exception as e:
        print(f"Web fallback error: {e}")
        return {
            "id": playlist_id,
            "title": "Could not retrieve playlist info",
            "error": str(e),
            "url": playlist_url,
            "videos": []
        }

def get_direct_playlist_views(playlist_url, debug=False):
    """
    Try to extract total playlist view count directly from YouTube's playlist page
    
    Args:
        playlist_url: URL of the YouTube playlist
        debug: If True, print debugging info
        
    Returns:
        int: Total view count if found, None otherwise
    """
    try:
        if debug:
            print(f"Attempting to extract direct view count for playlist: {playlist_url}")
            
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        req = urllib.request.Request(playlist_url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='replace')
        
        # Save larger portion of HTML for more detailed debugging
        if debug:
            # Commenting out file writing operations
            # with open('playlist_html_debug.txt', 'w', encoding='utf-8') as f:
            #     f.write(html)  # Save the entire HTML
            # print(f"Saved entire playlist HTML to playlist_html_debug.txt")
            pass
        
        # Try multiple patterns that might contain playlist view count
        patterns = [
            # Super generic patterns to find any view count (almost guaranteed to work)
            r'([0-9,\.]+)\s*views',
            
            # Previous patterns
            r'<span class="yt-core-attributed-string yt-content-metadata-view-model-wiz_metadata-text[^"]*"[^>]*>([0-9,\.]+) views<\/span>',
            r'<span[^>]*yt-content-metadata-view-model-wiz_metadata-text[^>]*>([0-9,\.]+) views<\/span>',
            r'<meta name="description" content="[^"]+ (\d[\d,\.]+) views',
            r'playlistHeaderRenderer"[^}]+"viewCountText":\{"simpleText":"(\d[\d,\.]+) views',
            r'"playlistVideoCountText"[^}]+"viewCountText":\{"runs":\[\{"text":"(\d[\d,\.]+)"\}',
            r'"viewCountText":\{"simpleText":"(\d[\d,\.]+) views"',
            r'"AboutPlaylist"[^}]+"views":\{"simpleText":"(\d[\d,\.]+) views"',
            r'"videoCountText"[^}]+"viewCountText":(?:\{"runs":\[\{"text":"(\d[\d,\.]+)"\}|\{"simpleText":"(\d[\d,\.]+) views")',
            r'"stats":\[\{"runs":\[\{"text":"([0-9]+)"\},"runs":\[\{"text":" videos"\}\],\{"runs":\[\{"text":"(\d[\d,\.]+)"\},"runs":\[\{"text":" views"\}',
            r'yt-core-attributed-string[^>]*>([0-9,]+) views<',
            r'class="yt-core-attributed-string[^"]*"[^>]*>([0-9,]+) views<',
            r'">([0-9,\.]+) views</'
        ]
        
        view_counts = []
        
        for i, pattern in enumerate(patterns):
            if debug:
                print(f"Trying pattern {i+1}...")
                
            # Find all matches instead of just the first one
            matches = re.finditer(pattern, html)
            
            for match in matches:
                try:
                    # Handle patterns with multiple capture groups
                    if i == 8 and len(match.groups()) > 1 and match.group(2):  # Old Pattern 8
                        view_str = match.group(2)
                    elif i == 9 and len(match.groups()) > 1:  # Old Pattern 9
                        view_str = match.group(2)
                    else:
                        view_str = match.group(1)
                    
                    view_str = view_str.replace(',', '').replace('.', '')
                    views = int(view_str)
                    
                    # Only consider reasonable view counts (to avoid extracting unrelated numbers)
                    if views > 100:
                        view_counts.append((views, i+1))
                        if debug:
                            print(f"Found possible view count with pattern {i+1}: {views:,}")
                except (ValueError, IndexError):
                    continue
        
        if view_counts:
            # If we found multiple possible view counts, take the one that appears most frequently
            # or the largest one if there's no clear winner
            from collections import Counter
            
            if debug:
                print(f"All view counts found: {[f'{v:,} (pattern {p})' for v, p in view_counts]}")
            
            # Get the most common view count
            views_counter = Counter([v for v, p in view_counts])
            most_common_views, freq = views_counter.most_common(1)[0]
            
            if debug:
                print(f"Most common view count: {most_common_views:,} (appeared {freq} times)")
                
            return most_common_views
        else:
            if debug:
                print("No direct view count found in playlist page")
            return None
    except Exception as e:
        print(f"Error fetching direct playlist views: {e}")
        return None

def search_youtube_web(query, limit=10, content_type=None, min_duration=None, max_duration=None):
    """Web scraping fallback for YouTube search"""
    try:
        encoded_query = urllib.parse.quote_plus(query)
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        
        # Add filters in URL
        filter_params = []
        if content_type:
            if content_type.lower() == 'playlist':
                filter_params.append("EgIQAw%3D%3D")  # Playlist filter
            elif content_type.lower() == 'video':
                filter_params.append("EgIQAQ%3D%3D")  # Video filter
        
        # Add duration filters
        if min_duration is not None and min_duration >= 20:
            filter_params.append("EgQQARgD")  # Over 20 minutes
        elif min_duration is not None and min_duration >= 4:
            filter_params.append("EgQQARgC")  # 4-20 minutes
        elif max_duration is not None and max_duration <= 4:
            filter_params.append("EgQQARgB")  # Under 4 minutes
        
        if filter_params:
            url += f"&sp={''.join(filter_params)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        
        videos = []
        
        # Extract video data
        video_pattern = r'"videoRenderer":{"videoId":"([^"]+)","thumbnail":.+?"title":.+?"text":"([^"]+)".+?"ownerText":.+?"text":"([^"]+)"'
        matches = re.finditer(video_pattern, html)
        
        for i, match in enumerate(matches):
            if i >= limit:
                break
            
            video_id, title, channel = match.groups()
            video = {
                "id": video_id,
                "title": title,
                "channel": {"name": channel},
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "type": "video"
            }
            videos.append(video)
        
        # Extract playlist data if needed
        if content_type != 'video':
            playlist_pattern = r'"playlistRenderer":{"playlistId":"([^"]+)".+?"title":.+?"simpleText":"([^"]+)".+?"shortBylineText":.+?"text":"([^"]+)".+?"videoCount":"([^"]+)"'
            playlist_matches = re.finditer(playlist_pattern, html)
            
            for i, match in enumerate(playlist_matches):
                if len(videos) >= limit:
                    break
                
                playlist_id, title, channel, video_count = match.groups()
                playlist = {
                    "id": playlist_id,
                    "title": title,
                    "channel": {"name": channel},
                    "video_count": video_count,
                    "url": f"https://www.youtube.com/playlist?list={playlist_id}",
                    "type": "playlist"
                }
                videos.append(playlist)
        
        # Return results directly without fetching detailed info
        return {
            "query": query,
            "results": videos,
            "result_count": len(videos),
            "source": "web_fallback"
        }
    except Exception as e:
        print(f"Web fallback error: {e}")
        return {
            "query": query,
            "results": [],
            "error": str(e)
        }

def search_playlists(query, limit=10):
    """
    Search specifically for YouTube playlists using direct web scraping
    
    Args:
        query: Search query
        limit: Maximum number of results
        
    Returns:
        list: Playlist search results
    """
    try:
        print(f"Searching for playlists with query: {query}")
        
        # Create search URL with playlist filter
        encoded_query = urllib.parse.quote_plus(query)
        search_url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=EgIQAw%253D%253D"
        
        # Set up a request with browser-like headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        req = urllib.request.Request(search_url, headers=headers)
        
        # Fetch the page
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        
        # Save HTML for debugging - commented out to prevent file creation
        # with open('youtube_search.html', 'w', encoding='utf-8') as f:
        #     f.write(html)
        
        # Try to extract playlist data using regex
        playlists = []
        
        # Pattern 1: Look for playlists in the ytInitialData
        yt_initial_data = re.search(r'var ytInitialData = ({.*?});', html)
        if yt_initial_data:
            try:
                data = json.loads(yt_initial_data.group(1))
                # Navigate through the JSON structure to find playlists
                if 'contents' in data:
                    for section in data['contents'].get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', []):
                        if 'itemSectionRenderer' in section:
                            for item in section['itemSectionRenderer'].get('contents', []):
                                if 'lockupViewModel' in item:
                                    playlist_data = item['lockupViewModel']
                                    if playlist_data.get('contentType') == 'LOCKUP_CONTENT_TYPE_PLAYLIST':
                                        playlist_id = playlist_data.get('contentId')
                                        title = playlist_data.get('metadata', {}).get('lockupMetadataViewModel', {}).get('title', {}).get('content', 'Unknown Playlist')
                                        channel = playlist_data.get('metadata', {}).get('lockupMetadataViewModel', {}).get('metadata', {}).get('contentMetadataViewModel', {}).get('metadataRows', [{}])[0].get('metadataParts', [{}])[0].get('text', {}).get('content', 'Unknown Channel')
                                        video_count = "Unknown"
                                        
                                        # Try to get video count from the thumbnail badge
                                        if 'contentImage' in playlist_data:
                                            badges = playlist_data['contentImage'].get('collectionThumbnailViewModel', {}).get('primaryThumbnail', {}).get('thumbnailViewModel', {}).get('overlays', [])
                                            for badge in badges:
                                                if 'thumbnailOverlayBadgeViewModel' in badge:
                                                    video_count = badge['thumbnailOverlayBadgeViewModel'].get('thumbnailBadges', [{}])[0].get('text', 'Unknown')
                                        
                                        if playlist_id and not any(p["id"] == playlist_id for p in playlists):
                                            playlist = {
                                                "id": playlist_id,
                                                "title": title,
                                                "channel": {"name": channel},
                                                "video_count": video_count,
                                                "url": f"https://www.youtube.com/playlist?list={playlist_id}",
                                                "type": "playlist"
                                            }
                                            playlists.append(playlist)
                                            
                                            if len(playlists) >= limit:
                                                break
            except json.JSONDecodeError as e:
                print(f"Error parsing ytInitialData JSON: {e}")
        
        # Pattern 2: Look for playlists in the search results
        if len(playlists) < limit:
            pattern2 = r'"playlistId":"([^"]+)".+?"title":\{"runs":\[\{"text":"([^"]+)"'
            matches2 = re.finditer(pattern2, html)
            
            for match in matches2:
                if len(playlists) >= limit:
                    break
                    
                playlist_id, title = match.groups()
                
                # Skip if we already have this playlist
                if any(p["id"] == playlist_id for p in playlists):
                    continue
                
                # Try to find channel name and video count
                channel_name = "Unknown Channel"
                video_count = "Unknown"
                
                # Look for channel name near the playlist ID
                channel_pattern = r'"playlistId":"' + playlist_id + r'".+?"ownerText":\{"runs":\[\{"text":"([^"]+)"'
                channel_match = re.search(channel_pattern, html)
                if channel_match:
                    channel_name = channel_match.group(1)
                
                # Look for video count near the playlist ID
                count_pattern = r'"playlistId":"' + playlist_id + r'".+?"videoCountText":\{"runs":\[\{"text":"([^"]+)"'
                count_match = re.search(count_pattern, html)
                if count_match:
                    video_count = count_match.group(1)
                
                playlist = {
                    "id": playlist_id,
                    "title": title,
                    "channel": {"name": channel_name},
                    "video_count": video_count,
                    "url": f"https://www.youtube.com/playlist?list={playlist_id}",
                    "type": "playlist"
                }
                playlists.append(playlist)
        
        return {
            "query": query,
            "results": playlists,
            "result_count": len(playlists),
            "source": "web_scraping"
        }
    
    except Exception as e:
        print(f"Error searching playlists: {e}")
        return {
            "query": query,
            "results": [],
            "error": str(e)
        }

def check_batch_title_relevance(titles, query):
    """
    Use batch processing with Groq LLM to check if multiple titles are relevant to the search query
    
    Args:
        titles: List of titles to check
        query: Search query (technology/topic)
        
    Returns:
        dict: Results from batch processing or None if API fails
    """
    try:
        # Extract technology name from query pattern like "Complete React JS Course"
        query_lower = query.lower()
        technology = None
        
        # Try to extract technology from common patterns
        if "complete" in query_lower and "course" in query_lower:
            # Pattern: "Complete X Course" - extract X
            parts = query_lower.replace("complete", "").replace("course", "").strip().split()
            if parts:
                # Join remaining words as the technology name
                technology = " ".join(parts)
                print(f"Extracted technology from query '{query}': '{technology}'")
        
        # If we couldn't extract a technology, use the full query
        if not technology:
            print(f"Using full query for relevance checking: '{query}'")
            technology = query
            
        # Use our relevance checker module for batch processing
        result = check_batch_relevance(titles, technology)
        return result
    except Exception as e:
        print(f"Error checking batch title relevance: {e}")
        return None

def find_best_playlist(query, debug=False, detailed_fetch=False):
    """
    Find the best educational playlist for a given query
    
    Args:
        query (str): The search query
        debug (bool, optional): Enable debug output. Defaults to False.
        detailed_fetch (bool, optional): Fetch detailed information for more videos. Defaults to False.
        
    Returns:
        dict: Best playlist with score and details
    """
    print(f"Finding best playlist for: {query}")
    
    # Search for playlists
    playlists_response = search_playlists(query, limit=10)
    
    if not playlists_response or 'results' not in playlists_response:
        print("No playlists found")
        return None
        
    playlists = playlists_response['results']
        
    if not playlists:
        print("No playlists found")
        return None
            
    print(f"Found {len(playlists)} playlists")
    
    # Create a list of playlist summaries for parallel processing
    playlist_summaries = []
    
    for idx, playlist in enumerate(playlists):
        playlist_id = playlist.get('id')
        playlist_url = playlist.get('url')
        playlist_title = playlist.get('title')
        
        # Skip playlists with missing data
        if not playlist_id or not playlist_url or not playlist_title:
            continue
            
        # Create a summary object with basic info
        summary = {
            'id': playlist_id,
            'url': playlist_url,
            'title': playlist_title,
            'channel': playlist.get('channel', {}),
            'channel_url': playlist.get('channel_url'),
            'video_count': playlist.get('video_count', 0),
            'direct_view_count': 0,  # Will be populated later
            'direct_view_count_formatted': "0",
            'idx': idx  # Store original index
        }
        
        playlist_summaries.append(summary)
    
    # Check if we have any valid playlists
    if not playlist_summaries:
        print("No valid playlists found")
        return None
        
    # Use batch processing to check title relevance for all playlists at once
    try:
        titles = [summary['title'] for summary in playlist_summaries]
        batch_result = check_batch_title_relevance(titles, query)
        
        if batch_result and 'results' in batch_result:
            # Create a map of title to relevance result
            title_relevance_map = {}
            for result in batch_result['results']:
                title_relevance_map[result['title']] = result
            
            # Add relevance information to each playlist summary
            for summary in playlist_summaries:
                result = title_relevance_map.get(summary['title'])
                if result:
                    summary['relevance_check'] = {
                        'is_relevant': result['isRelevant'],
                        'similarity': result['similarity'],
                        'explanation': result['explanation'],
                        'technologies': result.get('technologies', [])
                    }
                else:
                    # Fallback for titles not found in results
                    summary['relevance_check'] = {
                        'is_relevant': False,
                        'similarity': 0.0,
                        'explanation': "Title not found in batch results",
                        'technologies': []
                    }
        else:
            print("Batch relevance check failed, proceeding without relevance filtering")
    except Exception as e:
        print(f"Error in batch relevance checking: {e}")
        print("Proceeding without relevance filtering")
    
    # Function to evaluate a playlist in parallel
    def evaluate_playlist(playlist_summary, idx):
        try:
            # Always print basic info regardless of debug flag
            print(f"\n📑 Evaluating playlist {idx+1}: {playlist_summary['title']}")
        
            playlist_id = playlist_summary['id']
        
            # Get detailed playlist information with videos
            # Determine how many videos to fetch detailed info for
            max_details_count = 5 if detailed_fetch else 1
            
            print(f"Fetching playlist data for ID: {playlist_id}")
            
            # Fetch playlist data
            playlist = get_playlist_videos(playlist_id, limit=0, max_details=max_details_count)
            
            print(f"Playlist data fetched. Has videos: {bool(playlist.get('videos'))}")
            
            # Handle playlist title repetition
            if "title" in playlist and '\n' in playlist["title"]:
                playlist["title"] = playlist["title"].split('\n')[0].strip()
                
            videos = playlist.get("videos", [])
            
            # Note about video count but don't skip
            if len(videos) < 5:
                print(f"⚠️ Note: This playlist has fewer videos than recommended ({len(videos)}/5 minimum)")
                
            # Check if we have relevance information from batch processing
            relevance_check = playlist_summary.get('relevance_check')
            
            if relevance_check:
                is_relevant = relevance_check.get('is_relevant', False)
                explanation = relevance_check.get('explanation', 'No explanation provided')
                technologies = relevance_check.get('technologies', [])
                
                # Enhanced logging for relevance check
                print(f"Batch relevance check: {is_relevant}")
                print(f"  Explanation: {explanation}")

                if technologies:
                    print(f"  Technologies detected: {', '.join(technologies)}")
                    print(f"  IMPORTANT - Is this playlist relevant to '{query}'? {'YES' if is_relevant else 'NO'}")
                
                # Skip non-relevant playlists entirely
                if not is_relevant:
                    print(f"⚠️ Warning: Relevance check determined this playlist is not relevant")
                    print(f"   Reason: {explanation}")
                    print(f"   Skipping this playlist")
                    return None
            else:
                print("No relevance check information available")
            
            print("Applying scoring criteria...")
            
            # Apply scoring criteria - pass the pre-computed relevance_check
            score, details = score_playlist(playlist, query, debug, relevance_check)
            
            print(f"Score result: {score}")
                
            if score is not None:
                # Extract technologies from the relevance check if available
                technologies = []
                if relevance_check and 'technologies' in relevance_check:
                    technologies = relevance_check.get('technologies', [])
                
                result = {
                    "playlist": playlist,
                    "score": score,
                    "original_score": score,
                    "relevance_penalty": 0.0,
                    "details": details,
                    "verdict": get_verdict(score),
                    "technologies": technologies
                }
                    
                print(f"✅ Final Score: {score:.1f}/10.0")

                if technologies:
                    print(f"✅ Technologies detected: {', '.join(technologies)}")   
                return result
            
            else:
                print("❌ Score is None - playlist failed scoring criteria")
                return None
            
        except Exception as e:
            print(f"Error evaluating playlist {playlist_id}: {e}")
            traceback.print_exc()
            return None
    
    # Use ThreadPoolExecutor for parallel processing
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        # Submit tasks for each playlist
        future_to_playlist = {
            executor.submit(evaluate_playlist, summary, i): summary 
            for i, summary in enumerate(playlist_summaries)
        }
        
        # Process results as they complete
        scored_playlists = []
        exceptional_playlist = None
        
        for future in concurrent.futures.as_completed(future_to_playlist):
            summary = future_to_playlist[future]
            try:
                result = future.result()
                if result:
                    scored_playlists.append(result)
                    
                    # Check if this is an exceptional playlist (score >= 8.0, which is 80% of 10.0)
                    if result["score"] >= 8.0:
                        # If we already have an exceptional playlist, keep the one with higher score
                        if exceptional_playlist is None or result["score"] > exceptional_playlist["score"]:
                            exceptional_playlist = result
                            print(f"\n🌟 Found exceptional playlist: {result['playlist']['title']} (Score: {result['score']:.1f}/10.0)")
                            # Cancel remaining tasks if we have an exceptional playlist
                            for f in list(future_to_playlist.keys()):
                                if not f.done() and not f.running():
                                    f.cancel()
            except Exception as e:
                if debug:
                    print(f"Error processing result for playlist {summary['title']}: {e}")
    
    # Return the exceptional playlist if found, otherwise sort and return the best one
    if exceptional_playlist:
        if debug:
            print(f"\n🏆 BEST PLAYLIST (Exceptional): {exceptional_playlist['playlist']['title']}")
            print(f"Score: {exceptional_playlist['score']:.1f}/10.0")
            print(f"Verdict: {exceptional_playlist['verdict']}")
            print(f"URL: {exceptional_playlist['playlist']['url']}")
        return exceptional_playlist
    
    # Sort playlists by score and return the best one if no exceptional playlist was found
    if scored_playlists:
        # Sort by score descending
        scored_playlists.sort(key=lambda x: x["score"], reverse=True)
        best = scored_playlists[0]
        
        if debug:
            print(f"\n🏆 BEST PLAYLIST: {best['playlist']['title']}")
            print(f"Score: {best['score']:.1f}/10.0")
            print(f"Verdict: {best['verdict']}")
            print(f"URL: {best['playlist']['url']}")
            
            # Print top 3 if available
            if len(scored_playlists) > 1:
                print("\n🥈 Runner-up playlists:")
                for i, p in enumerate(scored_playlists[1:4]):
                    print(f"{i+2}. {p['playlist']['title']} - Score: {p['score']:.1f}/10.0 - {p['verdict']}")
        
        # Return the best playlist regardless of score
        return best
    elif debug:
        print("\n❌ No playlists could be properly evaluated.")
    
    return None

def score_playlist(playlist, query, debug=False, relevance_check=None):
    """
    Score a playlist based on defined criteria
    
    Args:
        playlist: The playlist to score
        query: The search query
        debug: Whether to print debug information
        relevance_check: Pre-computed relevance check result (to avoid redundant API calls)
    
    Returns:
        tuple: (score, details) or (None, None) if fails critical criteria
    """
    title = playlist.get("title", "")
    videos = playlist.get("videos", [])
    
    print(f"Scoring playlist: '{title}' ({len(videos)} videos)")
    
    # Initialize main_tech_term at the beginning
    main_tech_term = None
    query_terms = query.lower().split()
    tech_terms = ["javascript", "js", "python", "css", "html", "react", "node", "angular", "vue", 
                "typescript", "ts", "php", "ruby", "java", "c#", "c++", "swift", "kotlin", "go"]
    
    for term in query_terms:
        if term in tech_terms:
            main_tech_term = term
            break
    
    total_score = 0
    details = {
        "title_relevance": False,
        "video_count_score": 0,
        "total_views_score": 0,
        "duration_ratio_score": 0,
        "recency_score": 0,
        "like_ratio_score": 0,
        "avg_views_score": 0,
        "first_video_views_score": 0,
        "total_views": 0,
        "total_likes": 0,
        "total_duration_minutes": 0
    }
    
    # Check for enhanced duration data from API wrapper
    enhanced_duration = None
    if '_avg_duration_minutes' in playlist:
        enhanced_duration = playlist.get('_avg_duration_minutes')
        print(f"Using enhanced duration calculation: {enhanced_duration:.1f} min/video")
        
    # Check for enhanced total duration
    if '_total_duration_minutes' in playlist:
        details["total_duration_minutes"] = playlist.get('_total_duration_minutes')
        print(f"Using enhanced total duration: {details['total_duration_minutes']:.1f} minutes")
    
    # 🧠 Must-Pass Filter: Title Relevance
    title_relevance = False
    relevance_explanation = ""
    
    # Use the pre-computed relevance check if provided
    if relevance_check:
        print(f"Using pre-computed relevance check result")
        
        title_relevance = relevance_check.get('is_relevant', False)
        relevance_explanation = relevance_check.get('explanation', 'No explanation provided')
        
        print(f"Pre-computed relevance check: {title_relevance}")
        print(f"  Explanation: {relevance_explanation}")
    else:
        print("No pre-computed relevance check provided, doing a new check")
        
        # Check title relevance using batch processing
        print(f"Checking title relevance: '{title}'")
        
        # Use batch relevance checker (this is the redundant call we want to avoid)
        batch_result = check_batch_title_relevance([title], query)
        
        if batch_result and 'results' in batch_result and batch_result['results']:
            first_result = batch_result['results'][0]
            title_relevance = first_result['isRelevant']
            relevance_explanation = first_result['explanation']
            
            print(f"Batch relevance check: {title_relevance}")
            print(f"  Explanation: {relevance_explanation}")
        else:
            # Fall back to basic matching if batch processing fails
            print(f"Batch relevance check failed. Falling back to basic relevance matching.")
        
            # Basic matching approach
            query_terms = query.lower().split()
            title_lower = title.lower()
            
            # Check for query terms in title (partial match)
            matched_terms = [term for term in query_terms if term in title_lower]
            
            # Handle common abbreviations
            abbrev_map = {
                "js": "javascript",
                "py": "python",
                "ts": "typescript",
                "react": "reactjs",
                "vue": "vuejs",
                "node": "nodejs",
                "cpp": "c++"
            }
        
            for abbrev, full in abbrev_map.items():
                if abbrev in title_lower and full in query.lower():
                    matched_terms.append(full)
                elif full in title_lower and abbrev in query.lower():
                    matched_terms.append(abbrev)
        
            # Video titles check (verify most videos are on topic)
            relevant_videos = 0
            for video in videos:
                video_title = video.get("title", "").lower()
                if any(term in video_title for term in query_terms):
                    relevant_videos += 1
            
            relevance_percentage = (relevant_videos / len(videos)) * 100 if videos else 0
            
            title_relevance = len(matched_terms) > 0 and relevance_percentage >= 60
            relevance_explanation = f"Matched {len(matched_terms)} terms, {relevance_percentage:.1f}% relevant videos"
    
    details["title_relevance"] = title_relevance
    
    if not title_relevance:
        print(f"❌ Failed title relevance check: {relevance_explanation}")
        return None, None
    else:
        print(f"✓ Passed title relevance check: {relevance_explanation}")
    
    # Ensure we have at least one video
    if len(videos) < 1:
        print(f"❌ No videos found in playlist")
        return None, None
    
    # 🧮 Start scoring the playlist - NEW SCORING SYSTEM (Total: 10 points)

    # 3. Video Count (1.5 pts)
    video_count = len(videos)
    if video_count >= 10:
        video_count_score = 1.5  # Ideal range (above 10 videos)
    elif video_count >= 5:
        video_count_score = 1.0  # 5-9 videos
    else:
        video_count_score = 0.5  # <5 videos
    
    details["video_count_score"] = video_count_score
    total_score += video_count_score
    
    if debug:
        print(f"+ Video count ({video_count} videos): +{video_count_score:.1f} points")
    
    # 2. Total Playlist Views (1.8 pts)
    total_views_score = 0
    
    # Try to get direct playlist views first
    direct_view_count = playlist.get("direct_view_count", 0)
    
    # If not available, calculate from individual videos
    if not direct_view_count:
        videos_with_views = [v for v in videos if "views" in v and v["views"]]
        if videos_with_views:
            direct_view_count = sum(v["views"] for v in videos_with_views)
    
    details["total_views"] = direct_view_count
    
    if direct_view_count >= 1000000:
        total_views_score = 1.8  # 1M views → 1.8
    elif direct_view_count >= 500000:
        total_views_score = 1.5  # 500k-999k → 1.5
    elif direct_view_count >= 100000:
        total_views_score = 1.0  # 100k-499k → 1.0
    else:
        total_views_score = 0.5  # <100k → 0.5
    
    details["total_views_score"] = total_views_score
    total_score += total_views_score
    
    if debug:
        print(f"+ Total views ({format_number(direct_view_count)}): +{total_views_score:.1f} points")
    
    # 4. Average Views per Video (1.4 pts)
    avg_views_score = 0
    avg_views_per_video = 0
    
    if video_count > 0 and direct_view_count > 0:
        avg_views_per_video = direct_view_count / video_count
        
        if avg_views_per_video >= 100000:
            avg_views_score = 1.4  # 100k → 1.4
        elif avg_views_per_video >= 50000:
            avg_views_score = 1.0  # 50k-100k → 1.0
        elif avg_views_per_video >= 10000:
            avg_views_score = 0.7  # 10k-50k → 0.7
        else:
            avg_views_score = 0.3  # <10k → 0.3
    
    details["avg_views_score"] = avg_views_score
    details["avg_views_per_video"] = avg_views_per_video
    total_score += avg_views_score
    
    if debug:
        print(f"+ Average views per video ({format_number(avg_views_per_video)}): +{avg_views_score:.1f} points")
    
    # 1. Duration Ratio (0 to 2.0 points) - Same as before
    videos_with_duration = [v for v in videos if "duration_seconds" in v and v["duration_seconds"]]
    
    if enhanced_duration is not None:
        # Use our enhanced duration calculation
        duration_per_video = enhanced_duration
        
        if '_total_duration_minutes' in playlist:
            details["total_duration_minutes"] = playlist.get('_total_duration_minutes')
        elif videos_with_duration:
            # Still calculate total if not provided
            total_duration_minutes = sum(v["duration_seconds"] for v in videos_with_duration) / 60
            details["total_duration_minutes"] = total_duration_minutes
        
        # Calculate thresholds for scoring
        threshold_high = len(videos) * 45    # 45 min per video threshold for highest score
        threshold_medium = len(videos) * 30  # 30 min per video threshold for medium score
        threshold_low = len(videos) * 15     # 15 min per video threshold for minimum score
        
        total_duration_minutes = details["total_duration_minutes"]
        
        # Determine which threshold the total duration meets
        if total_duration_minutes >= threshold_high:
            duration_ratio_score = 2.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 45 min ({threshold_high} min)"
        elif total_duration_minutes >= threshold_medium:
            duration_ratio_score = 1.5
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 30 min ({threshold_medium} min)"
        elif total_duration_minutes >= threshold_low:
            duration_ratio_score = 1.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 15 min ({threshold_low} min)"
        else:
            duration_ratio_score = 0.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes < {len(videos)} videos × 15 min ({threshold_low} min)"
            
        details["duration_ratio_score"] = duration_ratio_score
        total_score += duration_ratio_score
        
        if debug:
            print(f"+ Duration/video ratio: +{duration_ratio_score:.1f} points ({threshold_desc})")
    elif videos_with_duration:
        total_duration_minutes = sum(v["duration_seconds"] for v in videos_with_duration) / 60
        details["total_duration_minutes"] = total_duration_minutes
        
        # Calculate thresholds for scoring
        threshold_high = len(videos) * 45    # 45 min per video threshold for highest score
        threshold_medium = len(videos) * 30  # 30 min per video threshold for medium score
        threshold_low = len(videos) * 15     # 15 min per video threshold for minimum score
        
        # Determine which threshold the total duration meets
        if total_duration_minutes >= threshold_high:
            duration_ratio_score = 2.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 45 min ({threshold_high} min)"
        elif total_duration_minutes >= threshold_medium:
            duration_ratio_score = 1.5
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 30 min ({threshold_medium} min)"
        elif total_duration_minutes >= threshold_low:
            duration_ratio_score = 1.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes ≥ {len(videos)} videos × 15 min ({threshold_low} min)"
        else:
            duration_ratio_score = 0.0
            threshold_desc = f"{total_duration_minutes:.1f} minutes < {len(videos)} videos × 15 min ({threshold_low} min)"
        
        details["duration_ratio_score"] = duration_ratio_score
        total_score += duration_ratio_score
        
        if debug:
            print(f"+ Duration/video ratio: +{duration_ratio_score:.1f} points ({threshold_desc})")
    else:
        details["duration_ratio_score"] = 0
        if debug:
            print(f"+ Duration/video ratio: +0.0 points (no duration data)")
    
    # 7. Recency (0.5 pts)
    current_year = datetime.now().year
    recency_score = 0
    publish_year = None
    
    # Check for enhanced publish date from API wrapper
    if '_publish_year' in playlist:
        publish_year = playlist.get('_publish_year')
        if debug:
            print(f"Using enhanced publish year: {publish_year}")
            
    # Try to get the publish date from the first video
    elif videos:
        first_video = videos[0]
        publish_date = None
        publish_date_formatted = None
        
        # First, check if we already have a formatted publish date
        if "publish_date_formatted" in first_video:
            publish_date_formatted = first_video.get("publish_date_formatted")
            if debug:
                print(f"Found formatted publish date: {publish_date_formatted}")
        
        # Check for regular publish date
        if "publish_date" in first_video:
            publish_date = first_video.get("publish_date", "")
            if debug:
                print(f"Found publish date: {publish_date}")
        
            # Extract year from publish date - try multiple formats
            if publish_date:
                # Try to parse a formatted date (YYYY-MM-DD)
                if "-" in publish_date and len(publish_date) >= 4:
                    year_str = publish_date.split("-")[0]
                    if year_str.isdigit():
                        publish_year = int(year_str)
                # Try YYYYMMDD format
                elif publish_date.isdigit() and len(publish_date) == 8:
                    publish_year = int(publish_date[:4])
                # Try just a year
                elif publish_date.isdigit() and len(publish_date) == 4:
                    publish_year = int(publish_date)
                # Try to extract from "N years ago"
                elif "year" in publish_date.lower():
                    try:
                        years_ago = int(re.search(r'(\d+) year', publish_date).group(1))
                        publish_year = current_year - years_ago
                    except:
                        pass
                # Try to infer current year from recent content
                elif any(term in publish_date.lower() for term in ["month", "week", "day", "hour", "minute", "second"]):
                    publish_year = current_year
                
        if debug and publish_year:
            print(f"Extracted year from publish date: {publish_year}")
        
        # If we still don't have a year, try fetching the video details specifically
        if not publish_year and "id" in first_video:
            try:
                if debug:
                    print(f"Fetching detailed info for first video to get publish date...")
                video_id = first_video.get("id")
                detailed_video = get_video_details(video_id)
                
                if "publish_date_formatted" in detailed_video:
                    formatted_date = detailed_video.get("publish_date_formatted")
                    if formatted_date and "-" in formatted_date:
                        year_str = formatted_date.split("-")[0]
                        if year_str.isdigit():
                            publish_year = int(year_str)
                            if debug:
                                print(f"Got year from formatted date: {publish_year}")
                
                if not publish_year and "publish_date" in detailed_video:
                    raw_date = detailed_video.get("publish_date")
                    if raw_date and raw_date.isdigit() and len(raw_date) == 8:
                        publish_year = int(raw_date[:4])
                        if debug:
                            print(f"Got year from raw date: {publish_year}")
            except Exception as e:
                if debug:
                    print(f"Error fetching publish date for first video: {e}")
    
    # Calculate recency score based on the year - NEW SCALE
    if publish_year:
        years_diff = current_year - publish_year
        if years_diff <= 1:  # 0-1 year old
            recency_score = 0.5
            if debug:
                print(f"+ First video publish year ({publish_year} - within 1 year): +{recency_score:.1f} points")
        elif years_diff <= 2:  # 1-2 years old
            recency_score = 0.3
            if debug:
                print(f"+ First video publish year ({publish_year} - 1-2 years old): +{recency_score:.1f} points")
        else:  # 2+ years old
            recency_score = 0.1
            if debug:
                print(f"+ First video publish year ({publish_year} - older than 2 years): +{recency_score:.1f} points")
    else:  # No year detected
        recency_score = 0.1  # Default to oldest category
        if debug:
            print(f"+ First video recency (no year detected): +0.1 points (default)")
    
    details["recency_score"] = recency_score
    details["publish_year"] = publish_year  # Store the year for reference
    total_score += recency_score
    
    # 6. Like Ratio (0.8 pts)
    like_ratio_score = 0
    
    if videos and "likes" in videos[0] and "views" in videos[0] and videos[0]["views"]:
        first_video = videos[0]
        like_ratio = (first_video["likes"] / first_video["views"]) * 100
        
        if like_ratio >= 2:
            like_ratio_score = 0.8  # 2% → 0.8
        elif like_ratio >= 1:
            like_ratio_score = 0.5  # 1-2% → 0.5
        else:
            like_ratio_score = 0.2  # <1% → 0.2
        
        details["like_ratio_score"] = like_ratio_score
        total_score += like_ratio_score
        
        if debug:
            print(f"+ First video like ratio ({like_ratio:.1f}%): +{like_ratio_score:.1f} points")
    else:
        details["like_ratio_score"] = 0
        if debug:
            print(f"+ First video like ratio: +0.0 points (no data)")
    
    # 5. First Video Views (1.0 pts)
    first_video_views_score = 0
    
    if videos and "views" in videos[0]:
        first_video_views = videos[0]["views"]
        
        if first_video_views >= 500000:
            first_video_views_score = 1.0  # 500k → 1.0
        elif first_video_views >= 100000:
            first_video_views_score = 0.7  # 100k-500k → 0.7
        else:
            first_video_views_score = 0.3  # <100k → 0.3
        
        details["first_video_views_score"] = first_video_views_score
        total_score += first_video_views_score
        
        if debug:
            print(f"+ First video views ({format_number(first_video_views)}): +{first_video_views_score:.1f} points")
    else:
        details["first_video_views_score"] = 0
        if debug:
            print(f"+ First video views: +0.0 points (no data)")
    
    # Note: We no longer apply specificity penalties as non-relevant playlists
    # are already filtered out at the evaluation stage
    
    # Final score (out of 10.0)
    if debug:
        print(f"= TOTAL SCORE: {total_score:.1f}/10.0")
        print(f"= VERDICT: {get_verdict(total_score)}")
    
    return total_score, details

def get_verdict(score):
    """Return the verdict based on the score (max score is now 10.0)"""
    if score >= 8.0:  # 80% of 10.0
        return "⭐ EXCEPTIONAL - Use immediately, stop searching"
    elif score >= 7.0:  # 70% of 10.0
        return "👍 GOOD - Use unless exceptional one found"
    # Changed from 6.0 to 5.0
    elif score >= 5.0:  # 50% of 10.0
        return "⚠️ AVERAGE - Keep as backup"
    else:
        return "❌ REJECT - Skip playlist"

# ===== DISPLAY FUNCTIONS =====

def print_video_details(video):
    """Print formatted video details"""
    print("\n" + "=" * 50)
    print(f"Title: {video.get('title', 'Unknown')}")
    print(f"Channel: {video.get('channel', {}).get('name', 'Unknown')}")
    
    if "likes" in video and video["likes"] is not None:
        print(f"👍 LIKES: {video.get('likes_formatted', format_number(video['likes']))}")
    
    if "views" in video:
        print(f"Views: {video.get('views_formatted', 'Unknown')}")
    
    if "publish_date" in video:
        print(f"Published: {video.get('publish_date', 'Unknown')}")
    
    if "duration_string" in video:
        print(f"Duration: {video.get('duration_string', 'Unknown')}")
    
    print(f"URL: {video.get('url', '')}")
    
    if "description" in video and video["description"]:
        print("\nDescription:")
        desc = video.get('description', '')
        print(f"{desc[:300]}..." if len(desc) > 300 else desc)
    
    print("=" * 50)

def print_search_results(search_results):
    """Print formatted search results"""
    results = search_results.get("results", [])
    
    if not results:
        print("No results found.")
        return
    
    print(f"\nFound {len(results)} results for '{search_results.get('query', '')}':")
    
    for i, item in enumerate(results, 1):
        item_type = item.get('type', 'video')
        
        if item_type == 'playlist':
            print(f"\n{i}. 📑 PLAYLIST: {item['title']}")
            print(f"   Channel: {item['channel']['name']}")
            print(f"   Videos: {item.get('video_count', 'Unknown')}")
            print(f"   URL: {item['url']}")
        else:
            print(f"\n{i}. 🎬 {item['title']}")
            print(f"   Channel: {item['channel']['name']}")
            
            if "likes" in item and item["likes"] is not None:
                print(f"   👍 Likes: {item.get('likes_formatted', 'Unknown')}")
            
            if "views" in item and item["views"] is not None:
                print(f"   Views: {item.get('views_formatted', 'Unknown')}")
            
            if "duration" in item:
                print(f"   Duration: {item.get('duration', 'Unknown')}")
            
            print(f"   URL: {item['url']}")

def print_playlist_videos(playlist):
    """Print formatted playlist videos"""
    videos = playlist.get("videos", [])
    
    if not videos:
        print("No videos found in playlist.")
        return
    
    print(f"\nPlaylist: {playlist.get('title', 'Unknown')}")
    print(f"Video count: {playlist.get('video_count', len(videos))}")
    
    for i, video in enumerate(videos, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   Channel: {video['channel']['name']}")
        
        if "likes" in video and video["likes"] is not None:
            print(f"   👍 Likes: {video.get('likes_formatted', 'Unknown')}")
        
        if "views" in video and video["views"] is not None:
            print(f"   Views: {video.get('views_formatted', 'Unknown')}")
        
        if "duration" in video:
            print(f"   Duration: {video.get('duration', 'Unknown')}")
            
        if "publish_date" in video:
            print(f"   Published: {video.get('publish_date', 'Unknown')}")
        
        print(f"   URL: {video['url']}")

# ===== USAGE EXAMPLE =====

if __name__ == "__main__":
    print("\n===== YouTube API =====")
    print("1. Get video details")
    print("2. Get playlist videos")
    print("3. Search YouTube with filters")
    print("4. Search Playlists Only")
    print("5. Find Best Playlist for Topic")
    
    choice = input("\nEnter your choice (1-5): ")
    
    if choice == '1':
        video_url = input("Enter YouTube video URL or ID: ")
        video = get_video_details(video_url)
        print_video_details(video)
    
    elif choice == '2':
        playlist_url = input("Enter YouTube playlist URL or ID: ")
        limit = int(input("How many videos to fetch (default: all): ") or "0")
        max_details = int(input("How many videos to fetch detailed info for (default: 15): ") or "15")
        
        print(f"\nFetching playlist information...")
        if limit > 0:
            print(f"Will fetch up to {limit} videos.")
        else:
            print("Will fetch all videos in the playlist.")
        print(f"Will get detailed information (likes/views) for up to {max_details} videos.")
        
        playlist = get_playlist_videos(playlist_url, limit, max_details)
        print_playlist_videos(playlist)
    
    elif choice == '3':
        query = input("Enter search query: ")
        limit = int(input("How many results (default: 5): ") or "5")
        
        print("\nSelect content type:")
        print("1. All content")
        print("2. Videos only")
        content_type_choice = input("Enter choice (1-2, default: 1): ") or "1"
        
        content_type = None
        if content_type_choice == "2":
            content_type = "video"
        
        print("\nSelect duration filter:")
        print("1. Any duration")
        print("2. Short (< 4 minutes)")
        print("3. Medium (4-20 minutes)")
        print("4. Long (> 20 minutes)")
        print("5. Custom duration range")
        duration_choice = input("Enter choice (1-5, default: 1): ") or "1"
        
        min_duration = None
        max_duration = None
        
        if duration_choice == "2":
            max_duration = 4
        elif duration_choice == "3":
            min_duration = 4
            max_duration = 20
        elif duration_choice == "4":
            min_duration = 20
        elif duration_choice == "5":
            min_duration = input("Enter minimum duration in minutes (leave blank for none): ")
            if min_duration:
                min_duration = int(min_duration)
            else:
                min_duration = None
                
            max_duration = input("Enter maximum duration in minutes (leave blank for none): ")
            if max_duration:
                max_duration = int(max_duration)
            else:
                max_duration = None
        
        print("\nSearching with filters...")
        search_results = search_youtube(query, limit, content_type, min_duration, max_duration)
        print_search_results(search_results)
    
    elif choice == '4':
        query = input("Enter search query: ")
        limit = int(input("How many results (default: 5): ") or "5")
        
        print("\nSearching for playlists...")
        search_results = search_playlists(query, limit)
        print_search_results(search_results)
        
    elif choice == '5':
        query = input("Enter topic to find best playlist for: ")
        print("\nSearching for best playlist...")
        print("(This may take some time as we analyze multiple playlists)")
        
        best_playlist = find_best_playlist(query, debug=True)
        
        if best_playlist:
            print("\n🏆 BEST PLAYLIST FOUND:")
            print_playlist_videos(best_playlist["playlist"])
            
            # Display additional analytics
            total_views = best_playlist["details"].get("total_views", 0)
            total_likes = best_playlist["details"].get("total_likes", 0)
            videos = best_playlist["playlist"].get("videos", [])
            
            print(f"\n📊 PLAYLIST ANALYTICS:")
            print(f"Total Videos: {len(videos)}")
            print(f"Total Views: {format_number(total_views)}")
            print(f"Total Duration: {int(best_playlist['details'].get('total_duration_minutes', 0))} minutes")
            print(f"Average Duration Per Video: {int(best_playlist['details'].get('total_duration_minutes', 0) / len(videos) if len(videos) > 0 else 0)} minutes")
            
            # Display scoring breakdown
            print(f"\n📝 SCORING BREAKDOWN (out of 10):")
            print(f"🔢 Video Count: +{best_playlist['details']['video_count_score']:.1f}")
            print(f"👀 Total Views: +{best_playlist['details']['total_views_score']:.1f}")
            print(f"⏱ Duration/Video: +{best_playlist['details']['duration_ratio_score']:.1f}")
            print(f"📅 First Video Recency: +{best_playlist['details']['recency_score']:.1f}")
            print(f"❤️ First Video Like Ratio: +{best_playlist['details']['like_ratio_score']:.2f}")
            # Quality evaluation section removed
            print(f"📈 First Video Popularity: +{best_playlist['details']['first_video_views_score']:.1f}")
            
            print(f"\nFinal Score: {best_playlist['score']:.1f}/10.0")
            print(f"Verdict: {best_playlist['verdict']}")
        else:
            print("\n❌ No suitable playlists found that meet the minimum criteria.")
    
    else:
        print("Invalid choice.")