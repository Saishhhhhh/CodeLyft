# YouTube API Tools

This repository contains a collection of Python scripts for interacting with YouTube, searching for videos, retrieving information, and downloading content.

## Overview

The scripts in this repository provide various ways to interact with YouTube:

- **youtube_fallback.py**: NEW! Works even without yt-dlp installed (recommended)
- **youtube_unified.py**: All-in-one solution using yt-dlp
- Legacy scripts using youtube-search-python library (with httpx patch):
  - **youtube_search_httpx_fixed.py**: Simple search script
  - **youtube_detailed_info_httpx_fixed.py**: Comprehensive API demo
  - **youtube_search_and_download_httpx_fixed.py**: Search and download videos
  - **youtube_custom_playlist.py**: Custom implementation for playlists
  - **youtube_video_extras.py**: Extended video information

## Requirements

- Python 3.x
- For youtube_fallback.py: No external dependencies required! (It will work with or without yt-dlp/youtube-dl)
- For youtube_unified.py: yt-dlp
- For legacy scripts: youtube-search-python and httpx

Install the required packages (optional for youtube_fallback.py):

```bash
# For best results with both tools:
pip install yt-dlp

# For legacy scripts only:
pip install youtube-search-python httpx
```

## Recommended: YouTube Fallback Tool

The `youtube_fallback.py` script works even without external dependencies using multiple fallback mechanisms:

1. Tries yt-dlp first if installed
2. Falls back to youtube-dl if available
3. Uses basic web requests as a last resort for retrieving video info
4. Offers to automatically install yt-dlp if needed

### Usage

```bash
python youtube_fallback.py
```

The script provides an interactive menu with the following options:

1. **Get video info** - View detailed information about a video
2. **Download video** - Download a video in your preferred format
3. **Download audio only** - Extract audio from a video
4. **Check/install tools** - Check for or install yt-dlp/youtube-dl
0. **Exit** - Quit the application

### Features

- **No dependencies required** - Works even without yt-dlp or youtube-dl
- **Auto-installation** - Can install yt-dlp if needed
- **Multiple fallbacks** - Tries different methods if one fails
- **User-friendly** - Interactive menu-driven interface

## Alternative: YouTube Unified Tool

The `youtube_unified.py` script is a complete solution that uses yt-dlp to:

1. Search for YouTube videos
2. Get detailed video information (including likes)
3. Download videos in various formats and resolutions
4. Extract audio from videos
5. Get playlist videos

**Note**: This tool requires yt-dlp to be installed.

### Usage

```bash
python youtube_unified.py
```

## Legacy Scripts

The repository includes several legacy scripts that use the youtube-search-python library with an httpx patch:

### youtube_search_httpx_patch.py

A monkey patch for the httpx library to fix the 'proxies' parameter error.

### youtube_search_httpx_fixed.py

A simple script to search for YouTube videos.

### youtube_detailed_info_httpx_fixed.py

A full-featured script demonstrating various YouTube API features:
- Search for videos
- Get detailed video information
- Get channel information
- Get playlist videos
- Get channel playlists
- Get search suggestions

### youtube_search_and_download_httpx_fixed.py

Search for videos and download them using youtube-dl or yt-dlp.

### youtube_custom_playlist.py

A custom implementation of playlist fetching to work around limitations in the youtube-search-python library.

## Troubleshooting

If you encounter errors:

1. Try using youtube_fallback.py which works even without external dependencies
2. If using other scripts, **ensure yt-dlp is installed** and accessible in your PATH
3. **Check for yt-dlp updates** if you encounter YouTube API changes
4. **Consider using a VPN** if you're experiencing regional restrictions
5. For legacy scripts, make sure you're using the patched versions

## Notes

- These scripts are for educational purposes only
- Respect YouTube's Terms of Service
- Be mindful of copyright restrictions when downloading content 