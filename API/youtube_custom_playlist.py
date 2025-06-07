"""
Custom implementation of YouTube playlist fetching to work around issues in the library
"""

import json
import re
import httpx
from youtubesearchpython import Video
import aiohttp
import asyncio
import yt_dlp
from Youtube import format_number

class CustomPlaylist:
    """
    A custom implementation of playlist fetching to work around bugs
    in the youtube-search-python library
    """
    
    def __init__(self, playlist_id):
        """Initialize with a playlist ID"""
        self.playlist_id = self._extract_playlist_id(playlist_id)
        self.videos = []
        self.info = {
            'title': 'Unknown Playlist',
            'channel': {'name': 'Unknown Channel'},
            'videoCount': 'Unknown'
        }
        self.continuation_token = None
        self.has_more_videos = True
        self._batch_size = 100  # Set batch size before initializing playlist
        self._total_videos_fetched = 0
        self._session = httpx.Client(timeout=30.0)  # Add a 30-second timeout
        self._init_playlist()  # Initialize playlist after setting all attributes
    
    def _extract_playlist_id(self, playlist_id):
        """Extract playlist ID from a URL if needed"""
        if "youtube.com" in playlist_id or "youtu.be" in playlist_id:
            if "list=" in playlist_id:
                playlist_id = playlist_id.split("list=")[1]
                if "&" in playlist_id:
                    playlist_id = playlist_id.split("&")[0]
        return playlist_id
    
    def _init_playlist(self):
        """Initialize the playlist and fetch first batch of videos"""
        try:
            url = f"https://www.youtube.com/playlist?list={self.playlist_id}"
            response = self._session.get(url)
            html = response.text
            
            # Extract playlist title directly from title tag first as most reliable method
            title_tag_match = re.search(r'<title>(.*?) - YouTube</title>', html)
            if title_tag_match:
                self.info['title'] = title_tag_match.group(1)
                print(f"Extracted playlist title from title tag: {self.info['title']}")
            
            # Extract initial data from page
            initial_data_match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});\s*</script>', html, re.DOTALL)
            if not initial_data_match:
                print("Could not find initial data in playlist page")
                return
                
            try:
                initial_data = json.loads(initial_data_match.group(1))
            except json.JSONDecodeError:
                print("Could not parse initial data JSON")
                return
                
            # Try to extract playlist info - multiple approaches for redundancy
            try:
                # First approach via header
                header = initial_data.get('header', {}).get('playlistHeaderRenderer', {})
                if header:
                    if header.get('title', {}).get('simpleText'):
                        self.info['title'] = header.get('title', {}).get('simpleText')
                        print(f"Got playlist title from header: {self.info['title']}")
                    
                    video_count_text = header.get('numVideosText', {}).get('runs', [{}])[0].get('text', '0')
                    self.info['videoCount'] = re.sub(r'\D', '', video_count_text) or 'Unknown'
                
                # Second approach: via microformat
                if self.info['title'] == 'Unknown Playlist':
                    microformat = initial_data.get('microformat', {}).get('microformatDataRenderer', {})
                    if microformat and microformat.get('title'):
                        self.info['title'] = microformat.get('title')
                        print(f"Got playlist title from microformat: {self.info['title']}")
                
                # Third approach: via page metadata
                if self.info['title'] == 'Unknown Playlist':
                    sidebar = initial_data.get('sidebar', {}).get('playlistSidebarRenderer', {})
                    if sidebar:
                        items = sidebar.get('items', [])
                        for item in items:
                            if 'playlistSidebarPrimaryInfoRenderer' in item:
                                info_renderer = item['playlistSidebarPrimaryInfoRenderer']
                                title_runs = info_renderer.get('title', {}).get('runs', [])
                                if title_runs and title_runs[0].get('text'):
                                    self.info['title'] = title_runs[0].get('text')
                                    print(f"Got playlist title from sidebar: {self.info['title']}")
                                    break
                
                # Fourth approach: via playlist title from renderer
                if self.info['title'] == 'Unknown Playlist':
                    contents = initial_data.get('contents', {}).get('twoColumnBrowseResultsRenderer', {})
                    tabs = contents.get('tabs', [])
                    for tab in tabs:
                        if tab.get('tabRenderer', {}).get('selected'):
                            title_elem = tab.get('tabRenderer', {}).get('title')
                            if title_elem:
                                self.info['title'] = title_elem
                                print(f"Got playlist title from tab: {self.info['title']}")
                                break
            except Exception as e:
                print(f"Error extracting playlist info: {e}")
            
            # Extract videos and continuation token
            try:
                playlist_contents = initial_data.get('contents', {}) \
                    .get('twoColumnBrowseResultsRenderer', {}) \
                    .get('tabs', [{}])[0] \
                    .get('tabRenderer', {}) \
                    .get('content', {}) \
                    .get('sectionListRenderer', {}) \
                    .get('contents', [{}])[0] \
                    .get('itemSectionRenderer', {}) \
                    .get('contents', [{}])[0] \
                    .get('playlistVideoListRenderer', {}) \
                    .get('contents', [])
                
                if not playlist_contents:
                    print("Could not find playlist contents")
                    self.has_more_videos = False
                    return
                
                videos_fetched = 0
                first_video_channel = None  # Store the first video's channel name
                
                for item in playlist_contents:
                    if videos_fetched >= self._batch_size:
                        # Store continuation token and break if we've reached batch size
                        if 'continuationItemRenderer' in item:
                            continuation_renderer = item['continuationItemRenderer']
                            self.continuation_token = continuation_renderer.get('continuationEndpoint', {}) \
                                .get('continuationCommand', {}) \
                                .get('token')
                            if self.continuation_token:
                                print(f"Found continuation token for next batch")
                                break
                        continue
                        
                    if 'playlistVideoRenderer' in item:
                        video_renderer = item['playlistVideoRenderer']
                        video_id = video_renderer.get('videoId')
                        
                        if not video_id:
                            continue
                            
                        title = video_renderer.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown Title')
                        channel = video_renderer.get('shortBylineText', {}).get('runs', [{}])[0].get('text', 'Unknown Channel')
                        duration = video_renderer.get('lengthText', {}).get('simpleText', 'Unknown')
                        
                        # Store the first video's channel name
                        if first_video_channel is None:
                            first_video_channel = channel
                            self.info['channel'] = {'name': channel}  # Set playlist channel to first video's channel
                        
                        video_data = {
                            'id': video_id,
                            'title': title,
                            'channel': {'name': channel},
                            'duration': duration,
                            'link': f"https://www.youtube.com/watch?v={video_id}"
                        }
                        
                        self.videos.append(video_data)
                        videos_fetched += 1
                        self._total_videos_fetched += 1
                    
                    # Check for continuation token if we haven't found it yet
                    if not self.continuation_token and 'continuationItemRenderer' in item:
                        continuation_renderer = item['continuationItemRenderer']
                        continuation_token = continuation_renderer.get('continuationEndpoint', {}) \
                            .get('continuationCommand', {}) \
                            .get('token')
                        
                        if continuation_token:
                            self.continuation_token = continuation_token
                            print(f"Found continuation token for next batch")
                        else:
                            self.has_more_videos = False
                
                print(f"Initial batch: Fetched {videos_fetched} videos (Total: {self._total_videos_fetched})")
                
                # If we didn't find a continuation token but have videos, try to find it in the response
                if not self.continuation_token and videos_fetched > 0:
                    continuation_pattern = r'"continuationEndpoint":\{"clickTrackingParams":"[^"]+","commandMetadata":\{"webCommandMetadata":\{"sendPost":true,"apiUrl":"/youtubei/v1/browse"\}\},"continuationCommand":\{"token":"([^"]+)"'
                    continuation_match = re.search(continuation_pattern, html)
                    if continuation_match:
                        self.continuation_token = continuation_match.group(1)
                        print("Found continuation token using regex fallback")
                
            except Exception as e:
                print(f"Error extracting playlist videos: {e}")
                self.has_more_videos = False
                
        except Exception as e:
            print(f"Error initializing playlist: {e}")
            self.has_more_videos = False
    
    def get_next_videos(self, batch_size=None):
        """Fetch next batch of videos using continuation token"""
        if not self.continuation_token or not self.has_more_videos:
            print(f"No continuation token or no more videos. Token: {self.continuation_token}, has_more: {self.has_more_videos}")
            return False
            
        try:
            # Use provided batch size or default
            self._batch_size = batch_size if batch_size is not None else self._batch_size
            
            api_url = "https://www.youtube.com/youtubei/v1/browse"
            params = {
                'key': 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
            }
            
            # Updated payload to match YouTube's web client
            payload = {
                'context': {
                    'client': {
                        'clientName': 'WEB',
                        'clientVersion': '2.20240320.01.00',
                        'newVisitorCookie': True,
                        'gl': 'US',
                        'hl': 'en'
                    },
                    'user': {},
                    'request': {
                        'sessionIndex': 0
                    }
                },
                'continuation': self.continuation_token
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/json',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20240320.01.00',
                'Origin': 'https://www.youtube.com',
                'Referer': f'https://www.youtube.com/playlist?list={self.playlist_id}'
            }
            
            print(f"Fetching next batch with token: {self.continuation_token[:20]}...")
            response = self._session.post(api_url, params=params, json=payload, headers=headers)
            if response.status_code != 200:
                print(f"Error fetching videos: HTTP {response.status_code}")
                self.has_more_videos = False
                return False
                
            data = response.json()
            
            # Try to find continuation items in the response
            continuation_items = None
            new_continuation_token = None
            
            # Debug: Print the keys in the response to help identify the structure
            print(f"Response keys: {list(data.keys())}")
            
            # Updated structure for current YouTube API response
            if 'onResponseReceivedActions' in data:
                for action in data['onResponseReceivedActions']:
                    print(f"Action keys: {list(action.keys())}")
                    if 'appendContinuationItemsAction' in action:
                        continuation_items = action['appendContinuationItemsAction'].get('continuationItems', [])
                        print(f"Found {len(continuation_items)} continuation items")
                        # Look for continuation token in the last item
                        if continuation_items:
                            for item in reversed(continuation_items):
                                if 'continuationItemRenderer' in item:
                                    token = item['continuationItemRenderer'].get('continuationEndpoint', {}) \
                                        .get('continuationCommand', {}) \
                                        .get('token')
                                    if token:
                                        new_continuation_token = token
                                        print("Found continuation token in appendContinuationItemsAction")
                                        break
                            break
            
            # If no continuation items found, try alternative structure
            if not continuation_items and 'continuationContents' in data:
                try:
                    contents = data['continuationContents']
                    print(f"Continuation contents keys: {list(contents.keys())}")
                    if 'playlistVideoListContinuation' in contents:
                        continuation_items = contents['playlistVideoListContinuation'].get('contents', [])
                        print(f"Found {len(continuation_items)} continuation items in playlistVideoListContinuation")
                        # Look for continuation token in the last item
                        if continuation_items:
                            for item in reversed(continuation_items):
                                if 'continuationItemRenderer' in item:
                                    token = item['continuationItemRenderer'].get('continuationEndpoint', {}) \
                                        .get('continuationCommand', {}) \
                                        .get('token')
                                    if token:
                                        new_continuation_token = token
                                        print("Found continuation token in continuationContents")
                                        break
                except Exception as e:
                    print(f"Error parsing continuationContents: {e}")
            
            # If still no continuation items, try the most recent structure
            if not continuation_items and 'contents' in data:
                try:
                    contents = data['contents']
                    print(f"Contents keys: {list(contents.keys())}")
                    if 'twoColumnBrowseResultsRenderer' in contents:
                        tabs = contents['twoColumnBrowseResultsRenderer'].get('tabs', [])
                        for tab in tabs:
                            if 'tabRenderer' in tab and tab['tabRenderer'].get('selected'):
                                content = tab['tabRenderer'].get('content', {})
                                if 'sectionListRenderer' in content:
                                    sections = content['sectionListRenderer'].get('contents', [])
                                    for section in sections:
                                        if 'itemSectionRenderer' in section:
                                            items = section['itemSectionRenderer'].get('contents', [])
                                            for item in items:
                                                if 'playlistVideoListRenderer' in item:
                                                    continuation_items = item['playlistVideoListRenderer'].get('contents', [])
                                                    print(f"Found {len(continuation_items)} continuation items in playlistVideoListRenderer")
                                                    # Look for continuation token in the last item
                                                    if continuation_items:
                                                        for item in reversed(continuation_items):
                                                            if 'continuationItemRenderer' in item:
                                                                token = item['continuationItemRenderer'].get('continuationEndpoint', {}) \
                                                                    .get('continuationCommand', {}) \
                                                                    .get('token')
                                                                if token:
                                                                    new_continuation_token = token
                                                                    print("Found continuation token in nested contents")
                                                                    break
                                                    break
                except Exception as e:
                    print(f"Error parsing nested contents: {e}")
            
            if not continuation_items:
                print("No continuation items found in response")
                # Try to find token in the raw response as a last resort
                try:
                    response_text = response.text
                    continuation_pattern = r'"continuationEndpoint":\{"clickTrackingParams":"[^"]+","commandMetadata":\{"webCommandMetadata":\{"sendPost":true,"apiUrl":"/youtubei/v1/browse"\}\},"continuationCommand":\{"token":"([^"]+)"'
                    continuation_match = re.search(continuation_pattern, response_text)
                    if continuation_match:
                        new_continuation_token = continuation_match.group(1)
                        print("Found continuation token using regex fallback in response")
                        # Try to extract items from the response text
                        video_pattern = r'"playlistVideoRenderer":\{"videoId":"([^"]+)","thumbnail":.+?"title":.+?"runs":\[\{"text":"([^"]+)"\}.+?"shortBylineText":.+?"runs":\[\{"text":"([^"]+)"\}'
                        video_matches = re.finditer(video_pattern, response_text)
                        continuation_items = []
                        for match in video_matches:
                            video_id, title, channel = match.groups()
                            continuation_items.append({
                                'playlistVideoRenderer': {
                                    'videoId': video_id,
                                    'title': {'runs': [{'text': title}]},
                                    'shortBylineText': {'runs': [{'text': channel}]},
                                    'lengthText': {'simpleText': 'Unknown'}
                                }
                            })
                        print(f"Found {len(continuation_items)} videos using regex fallback")
                except Exception as e:
                    print(f"Error in regex fallback: {e}")
                    self.has_more_videos = False
                    return False
            
            videos_fetched = 0
            
            # Process video items
            for item in continuation_items:
                if videos_fetched >= self._batch_size:
                    break
                    
                if 'playlistVideoRenderer' in item:
                    video_renderer = item['playlistVideoRenderer']
                    video_id = video_renderer.get('videoId')
                    
                    if not video_id:
                        continue
                        
                    title = video_renderer.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown Title')
                    channel = video_renderer.get('shortBylineText', {}).get('runs', [{}])[0].get('text', 'Unknown Channel')
                    duration = video_renderer.get('lengthText', {}).get('simpleText', 'Unknown')
                    
                    video_data = {
                        'id': video_id,
                        'title': title,
                        'channel': {'name': channel},
                        'duration': duration,
                        'link': f"https://www.youtube.com/watch?v={video_id}"
                    }
                    
                    self.videos.append(video_data)
                    videos_fetched += 1
                    self._total_videos_fetched += 1
            
            # Update continuation token if found
            if new_continuation_token:
                self.continuation_token = new_continuation_token
                print(f"Found new continuation token for next batch: {new_continuation_token[:20]}...")
            else:
                # Try to find token in the last item if we haven't found it yet
                if continuation_items:
                    for item in reversed(continuation_items):
                        if 'continuationItemRenderer' in item:
                            token = item['continuationItemRenderer'].get('continuationEndpoint', {}) \
                                .get('continuationCommand', {}) \
                                .get('token')
                            if token:
                                self.continuation_token = token
                                print(f"Found continuation token in last item: {token[:20]}...")
                                break
                    else:
                        print("No continuation token found in response")
                        self.has_more_videos = False
                else:
                    print("No continuation token found in response")
                    self.has_more_videos = False
            
            print(f"Fetched {videos_fetched} videos in this batch (Total: {self._total_videos_fetched})")
            return videos_fetched > 0
            
        except Exception as e:
            print(f"Error fetching more videos: {e}")
            self.has_more_videos = False
            return False
    
    @property
    def hasMoreVideos(self):
        """Property to match youtube-search-python API"""
        return self.has_more_videos and self.continuation_token is not None
    
    def getNextVideos(self, batch_size=None):
        """Method to match youtube-search-python API with batch size support"""
        return self.get_next_videos(batch_size) 

    async def _fetch_remaining_videos_with_api(self, start_index: int, total_videos: int) -> None:
        """Fetch remaining videos from a playlist using YouTube's internal API"""
        try:
            # Initialize variables
            self._continuation_token = None
            base_url = f"https://www.youtube.com/playlist?list={self.playlist_id}&hl=en"
            
            # First request to get the continuation token
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
            
            # Make initial request to get the continuation token
            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, headers=headers) as response:
                    if response.status != 200:
                        print(f"Error fetching playlist page: {response.status}")
                        return
                        
                    response_text = await response.text()
                    
                    # Save the entire HTML for debugging
                    # Commenting out file writing operations
                    # with open('playlist_html_debug.txt', 'w', encoding='utf-8') as f:
                    #     f.write(response_text)
                    # print("Saved entire playlist HTML to playlist_html_debug.txt")
                    
                    # Try to find the continuation token in the ytInitialData
                    initial_data_match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});\s*</script>', response_text)
                    if initial_data_match:
                        try:
                            data = json.loads(initial_data_match.group(1))
                            
                            # Look for continuationItemRenderer in the playlist contents
                            if 'contents' in data and 'twoColumnBrowseResultsRenderer' in data['contents']:
                                tabs = data['contents']['twoColumnBrowseResultsRenderer'].get('tabs', [])
                                for tab in tabs:
                                    if 'tabRenderer' in tab and 'content' in tab['tabRenderer']:
                                        content = tab['tabRenderer']['content']
                                        if 'sectionListRenderer' in content:
                                            sections = content['sectionListRenderer'].get('contents', [])
                                            for section in sections:
                                                if 'itemSectionRenderer' in section:
                                                    items = section['itemSectionRenderer'].get('contents', [])
                                                    for item in items:
                                                        if 'playlistVideoListRenderer' in item:
                                                            contents = item['playlistVideoListRenderer'].get('contents', [])
                                                            # Look for continuationItemRenderer at the end of the list
                                                            for content_item in contents:
                                                                if 'continuationItemRenderer' in content_item:
                                                                    continuation = content_item['continuationItemRenderer']
                                                                    if 'continuationEndpoint' in continuation:
                                                                        endpoint = continuation['continuationEndpoint']
                                                                        if 'continuationCommand' in endpoint:
                                                                            self._continuation_token = endpoint['continuationCommand'].get('token')
                                                                            if self._continuation_token:
                                                                                print(f"Found continuation token in playlistVideoListRenderer")
                                                                                break
                                                                        
                                                                        # Also check for commandExecutorCommand
                                                                        elif 'commandExecutorCommand' in endpoint:
                                                                            commands = endpoint.get('commandExecutorCommand', {}).get('commands', [])
                                                                            for cmd in commands:
                                                                                if 'continuationCommand' in cmd:
                                                                                    self._continuation_token = cmd['continuationCommand'].get('token')
                                                                                    if self._continuation_token:
                                                                                        print(f"Found continuation token in commandExecutorCommand")
                                                                                        break
                        except Exception as e:
                            print(f"Error parsing JSON data: {e}")
                    
                    # If we still don't have a token, try regex patterns
                    if not self._continuation_token:
                        print("Trying regex patterns to find continuation token...")
                        continuation_patterns = [
                            r'"continuationCommand":\s*\{\s*"token":\s*"([^"]+)"',
                            r'"continuationEndpoint":[^}]*"continuationCommand":[^}]*"token":"([^"]+)"',
                            r'"token":"([^"]+)","request":"CONTINUATION_REQUEST_TYPE_BROWSE"',
                            r'"token":"([^"]+)"[^}]*"commandMetadata"',
                            r'"continuationCommand":\{"token":"([^"]+)"',
                            r'"continuation":"([^"]+)"'
                        ]
                        
                        for i, pattern in enumerate(continuation_patterns):
                            matches = re.findall(pattern, response_text)
                            if matches:
                                # Take the last match as it's likely for the continuation after the first 100 videos
                                self._continuation_token = matches[-1]
                                print(f"Found continuation token using regex pattern {i+1}")
                                break
                    
                    if not self._continuation_token:
                        print("No continuation token found. Trying alternative approach...")
                        # If we can't find a continuation token, we'll try to extract videos directly from the page
                        try:
                            # Extract video IDs directly from the page
                            video_pattern = r'"videoId"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"'
                            video_matches = re.finditer(video_pattern, response_text)
                            
                            video_data_list = []
                            for match in video_matches:
                                video_id, title = match.groups()
                                # Check if this is likely a video title (not a button text or other UI element)
                                if len(title) > 10:  # Simple heuristic: titles are usually longer
                                    video_data_list.append((video_id, title))
                            
                            # Remove duplicates by converting to a dictionary with video_id as key
                            unique_videos = {}
                            for video_id, title in video_data_list:
                                if video_id not in unique_videos:
                                    unique_videos[video_id] = title
                            
                            # Add videos to our list
                            videos_added = 0
                            for video_id, title in unique_videos.items():
                                # Skip videos we already have
                                if any(v.get('id') == video_id for v in self.videos):
                                    continue
                                
                                # Create video data
                                video_data = {
                                    'id': video_id,
                                    'title': title,
                                    'channel': {'name': "Unknown Channel"},
                                    'duration': "Unknown",
                                    'link': f"https://www.youtube.com/watch?v={video_id}"
                                }
                                
                                self.videos.append(video_data)
                                videos_added += 1
                            
                            print(f"Extracted {videos_added} videos directly from page")
                            
                            # Create a fake continuation token to continue fetching
                            if videos_added > 0:
                                self._continuation_token = f"fake_token_{self.playlist_id}_{len(self.videos)}"
                                print(f"Created fake continuation token to continue fetching: {self._continuation_token[:20]}...")
                        except Exception as e:
                            print(f"Error extracting videos from page: {e}")
                    
                    if self._continuation_token:
                        print(f"Found continuation token: {self._continuation_token[:20]}...")
                    else:
                        print("No continuation token found. Cannot fetch more videos.")
                        return
                    
                    # Now fetch the remaining videos with the continuation token
                    videos_before = len(self.videos)
                    batch_count = 0
                    max_batches = 20  # Limit to prevent infinite loops
                    
                    while self._continuation_token and len(self.videos) < total_videos and batch_count < max_batches:
                        batch_count += 1
                        print(f"Fetching batch {batch_count}/{max_batches}... (Current total: {len(self.videos)} videos)")
                        
                        # Check if we're using a fake token
                        if self._continuation_token.startswith("fake_token_"):
                            print("Using fake token - trying alternative approach...")
                            # When using a fake token, we'll try a different approach:
                            # 1. Fetch the playlist page with a different index
                            # 2. Extract videos directly from the page
                            
                            # Extract the current index from the fake token
                            try:
                                current_index = int(self._continuation_token.split("_")[-1])
                            except:
                                current_index = len(self.videos)
                            
                            # Calculate the page number (each page has about 100 videos)
                            page_number = (current_index // 100) + 1
                            
                            # Fetch the playlist page with the page parameter
                            page_url = f"{base_url}&page={page_number}"
                            print(f"Fetching playlist page {page_number}...")
                            
                            async with session.get(page_url, headers=headers) as page_response:
                                if page_response.status != 200:
                                    print(f"Error fetching playlist page {page_number}: {page_response.status}")
                                    self._continuation_token = None
                                    break
                                
                                page_text = await page_response.text()
                                
                                # Extract videos from the page
                                try:
                                    # Extract video IDs directly from the page
                                    video_pattern = r'"videoId"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"'
                                    video_matches = re.finditer(video_pattern, page_text)
                                    
                                    video_data_list = []
                                    for match in video_matches:
                                        video_id, title = match.groups()
                                        # Check if this is likely a video title (not a button text or other UI element)
                                        if len(title) > 10:  # Simple heuristic: titles are usually longer
                                            video_data_list.append((video_id, title))
                                    
                                    # Remove duplicates by converting to a dictionary with video_id as key
                                    unique_videos = {}
                                    for video_id, title in video_data_list:
                                        if video_id not in unique_videos:
                                            unique_videos[video_id] = title
                                    
                                    # Add videos to our list
                                    videos_added = 0
                                    for video_id, title in unique_videos.items():
                                        # Skip videos we already have
                                        if any(v.get('id') == video_id for v in self.videos):
                                            continue
                                        
                                        # Create video data
                                        video_data = {
                                            'id': video_id,
                                            'title': title,
                                            'channel': {'name': "Unknown Channel"},
                                            'duration': "Unknown",
                                            'link': f"https://www.youtube.com/watch?v={video_id}"
                                        }
                                        
                                        self.videos.append(video_data)
                                        videos_added += 1
                                    
                                    print(f"Extracted {videos_added} videos from page {page_number}")
                                    
                                    # Update the fake token for the next batch
                                    if videos_added > 0:
                                        self._continuation_token = f"fake_token_{self.playlist_id}_{len(self.videos)}"
                                        print(f"Updated fake token: {self._continuation_token[:20]}...")
                                    else:
                                        # If we didn't find any new videos, stop fetching
                                        self._continuation_token = None
                                        print("No new videos found. Stopping.")
                                except Exception as e:
                                    print(f"Error extracting videos from page {page_number}: {e}")
                                    self._continuation_token = None
                        else:
                            # Use the normal continuation token approach
                            await self._fetch_videos_with_continuation(session, total_videos)
                        
                        # If we didn't get any new videos and this isn't the first batch, break
                        if len(self.videos) == videos_before and batch_count > 1:
                            print("No new videos fetched. Stopping.")
                            break
                            
                        videos_before = len(self.videos)
                        # Add a small delay between requests
                        await asyncio.sleep(1)
                    
                    print(f"Finished fetching videos. Total videos: {len(self.videos)}")
            
        except Exception as e:
            print(f"Error fetching remaining videos: {e}")
            import traceback
            traceback.print_exc()

    async def _fetch_videos_with_continuation(self, session, total_videos):
        """Fetch videos using a continuation token"""
        try:
            # Prepare the API request
            api_url = "https://www.youtube.com/youtubei/v1/browse"
            params = {
                'key': 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
                'prettyPrint': 'false'
            }
            
            # Prepare the payload with the continuation token
            payload = {
                'context': {
                    'client': {
                        'clientName': 'WEB',
                        'clientVersion': '2.20240606.01.00',
                        'hl': 'en',
                        'gl': 'US',
                        'clientFormFactor': 'UNKNOWN_FORM_FACTOR',
                        'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36,gzip(gfe)',
                    },
                    'user': {},
                    'request': {
                        'useSsl': True,
                        'internalExperimentFlags': [],
                        'consistencyTokenJars': []
                    }
                },
                'continuation': self._continuation_token
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/json',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20240606.01.00',
                'Origin': 'https://www.youtube.com',
                'Referer': f'https://www.youtube.com/playlist?list={self.playlist_id}'
            }
            
            print(f"Fetching next batch with token: {self._continuation_token[:20]}...")
            
            # Make the request
            async with session.post(api_url, params=params, json=payload, headers=headers) as response:
                if response.status != 200:
                    print(f"Error fetching continuation: {response.status}")
                    self._continuation_token = None
                    return
                    
                data = await response.json()
                
                # Save response for debugging
                # Commenting out file writing operations
                # with open('continuation_response_debug.json', 'w', encoding='utf-8') as f:
                #     json.dump(data, f, indent=2)
                
                # Print top-level keys for debugging
                print(f"Response keys: {list(data.keys())}")
                
                # Reset continuation token - we'll set it again if we find a new one
                self._continuation_token = None
                
                # Extract videos from onResponseReceivedActions
                continuation_items = None
                
                # Check for the most common response structure - onResponseReceivedActions
                if 'onResponseReceivedActions' in data:
                    for action in data['onResponseReceivedActions']:
                        if 'appendContinuationItemsAction' in action:
                            continuation_items = action['appendContinuationItemsAction'].get('continuationItems', [])
                            print(f"Found {len(continuation_items)} items in appendContinuationItemsAction")
                            break
                
                # If no items found, try other paths
                if not continuation_items:
                    print("No continuation items found in standard location. Checking other paths...")
                    
                    # Try to find in contents structure
                    if 'contents' in data and 'twoColumnBrowseResultsRenderer' in data['contents']:
                        tabs = data['contents']['twoColumnBrowseResultsRenderer'].get('tabs', [])
                        for tab in tabs:
                            if 'tabRenderer' in tab and 'content' in tab['tabRenderer']:
                                content = tab['tabRenderer']['content']
                                if 'sectionListRenderer' in content:
                                    sections = content['sectionListRenderer'].get('contents', [])
                                    for section in sections:
                                        if 'itemSectionRenderer' in section:
                                            items = section['itemSectionRenderer'].get('contents', [])
                                            for item in items:
                                                if 'playlistVideoListRenderer' in item:
                                                    continuation_items = item['playlistVideoListRenderer'].get('contents', [])
                                                    print(f"Found {len(continuation_items)} items in playlistVideoListRenderer")
                                                    break
                
                # If still no items, try looking for playlistVideoRenderer directly in the response
                if not continuation_items:
                    print("Checking for playlistVideoRenderer directly in the response...")
                    try:
                        # Convert data to string for easier searching
                        data_str = json.dumps(data)
                        
                        # Look for playlistVideoRenderer in the response
                        video_renderers = re.findall(r'"playlistVideoRenderer":\s*(\{[^{]*?"videoId"\s*:\s*"[^"]+"\s*,[^}]*?\})', data_str)
                        if video_renderers:
                            print(f"Found {len(video_renderers)} video renderers using regex")
                            
                            # Process these video renderers directly
                            continuation_items = []
                            for renderer_str in video_renderers:
                                try:
                                    # Try to convert the string to a valid JSON object
                                    # First, ensure it's a complete JSON object by adding missing braces if needed
                                    if not renderer_str.strip().startswith('{'):
                                        renderer_str = '{' + renderer_str
                                    if not renderer_str.strip().endswith('}'):
                                        renderer_str = renderer_str + '}'
                                    
                                    # Replace any invalid JSON constructs
                                    renderer_str = re.sub(r',\s*}', '}', renderer_str)
                                    
                                    # Parse the JSON
                                    renderer_json = json.loads(renderer_str)
                                    continuation_items.append({"playlistVideoRenderer": renderer_json})
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing renderer JSON: {e}")
                    except Exception as e:
                        print(f"Error searching for video renderers: {e}")
                
                # If still no items, try direct extraction of video IDs and titles
                if not continuation_items:
                    print("No video items found in response. Trying direct extraction...")
                    
                    # Try direct extraction of video IDs and titles from the raw response
                    try:
                        data_str = json.dumps(data)
                        
                        # Extract video IDs and titles using regex patterns
                        # First try a more specific pattern that captures videoId and title together
                        video_pattern = r'"videoId"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"'
                        video_matches = re.finditer(video_pattern, data_str)
                        
                        video_data_list = []
                        for match in video_matches:
                            video_id, title = match.groups()
                            # Check if this is likely a video title (not a button text or other UI element)
                            if len(title) > 10:  # Simple heuristic: titles are usually longer
                                video_data_list.append((video_id, title))
                        
                        # If we found videos, create continuation items
                        if video_data_list:
                            # Remove duplicates by converting to a dictionary with video_id as key
                            unique_videos = {}
                            for video_id, title in video_data_list:
                                if video_id not in unique_videos:
                                    unique_videos[video_id] = title
                            
                            # Create continuation items
                            continuation_items = []
                            for video_id, title in unique_videos.items():
                                continuation_items.append({
                                    "playlistVideoRenderer": {
                                        "videoId": video_id,
                                        "title": {"runs": [{"text": title}]},
                                        "shortBylineText": {"runs": [{"text": "Unknown Channel"}]},
                                        "lengthText": {"simpleText": "Unknown"}
                                    }
                                })
                            
                            print(f"Extracted {len(continuation_items)} videos using direct extraction")
                    except Exception as e:
                        print(f"Error in direct extraction: {e}")
                
                # If we still don't have items but we have metadata, try to extract videos from metadata
                if not continuation_items and 'metadata' in data:
                    try:
                        print("Trying to extract videos from metadata...")
                        metadata_str = json.dumps(data['metadata'])
                        video_ids = re.findall(r'"videoId"\s*:\s*"([^"]+)"', metadata_str)
                        
                        if video_ids:
                            continuation_items = []
                            for video_id in video_ids:
                                continuation_items.append({
                                    "playlistVideoRenderer": {
                                        "videoId": video_id,
                                        "title": {"runs": [{"text": f"Video {video_id}"}]},
                                        "shortBylineText": {"runs": [{"text": "Unknown Channel"}]},
                                        "lengthText": {"simpleText": "Unknown"}
                                    }
                                })
                            print(f"Extracted {len(continuation_items)} videos from metadata")
                    except Exception as e:
                        print(f"Error extracting from metadata: {e}")
                
                # As a last resort, try to extract videos from the entire response
                if not continuation_items:
                    try:
                        print("Trying to extract video IDs from entire response...")
                        # This pattern looks for videoId in various contexts
                        video_ids = set(re.findall(r'"videoId"\s*:\s*"([^"]+)"', json.dumps(data)))
                        
                        if video_ids:
                            # Filter out any videoIds that are too short or too long
                            valid_video_ids = [vid for vid in video_ids if 10 <= len(vid) <= 12]
                            
                            continuation_items = []
                            for video_id in valid_video_ids:
                                continuation_items.append({
                                    "playlistVideoRenderer": {
                                        "videoId": video_id,
                                        "title": {"runs": [{"text": f"Video {video_id}"}]},
                                        "shortBylineText": {"runs": [{"text": "Unknown Channel"}]},
                                        "lengthText": {"simpleText": "Unknown"}
                                    }
                                })
                            print(f"Extracted {len(continuation_items)} video IDs from entire response")
                    except Exception as e:
                        print(f"Error extracting video IDs: {e}")
                
                if not continuation_items:
                    print("No continuation items found.")
                    return
                
                # Process all videos from the continuation
                videos_added = 0
                for item in continuation_items:
                    # Skip continuationItemRenderer items
                    if 'continuationItemRenderer' in item:
                        continuation_renderer = item.get('continuationItemRenderer', {})
                        print(f"Found continuationItemRenderer with keys: {list(continuation_renderer.keys())}")
                        
                        # Try multiple paths for token extraction
                        if 'continuationEndpoint' in continuation_renderer:
                            endpoint = continuation_renderer.get('continuationEndpoint', {})
                            print(f"Found continuationEndpoint with keys: {list(endpoint.keys())}")
                            
                            # Check for direct token in continuationCommand
                            if 'continuationCommand' in endpoint:
                                token = endpoint.get('continuationCommand', {}).get('token')
                                if token:
                                    self._continuation_token = token
                                    print(f"Found new continuation token in continuationCommand: {token[:20]}...")
                            
                            # Check for token in commandExecutorCommand
                            elif 'commandExecutorCommand' in endpoint:
                                commands = endpoint.get('commandExecutorCommand', {}).get('commands', [])
                                for cmd in commands:
                                    if 'continuationCommand' in cmd:
                                        token = cmd.get('continuationCommand', {}).get('token')
                                        if token:
                                            self._continuation_token = token
                                            print(f"Found new continuation token in commandExecutorCommand: {token[:20]}...")
                                            break
                        continue
                    
                    # Process video item
                    video_renderer = item.get('playlistVideoRenderer')
                    if not video_renderer:
                        print(f"Item is not a playlistVideoRenderer, keys: {list(item.keys())}")
                        continue
                        
                    video_id = video_renderer.get('videoId')
                    if not video_id:
                        print("Missing videoId in playlistVideoRenderer")
                        continue
                    
                    # Skip videos we already have
                    if any(v.get('id') == video_id for v in self.videos):
                        print(f"Skipping duplicate video: {video_id}")
                        continue
                    
                    # Extract title
                    title = "Unknown Title"
                    if 'title' in video_renderer:
                        if 'runs' in video_renderer['title']:
                            for run in video_renderer['title']['runs']:
                                if 'text' in run:
                                    title = run['text']
                                    break
                        elif 'simpleText' in video_renderer['title']:
                            title = video_renderer['title']['simpleText']
                    
                    # Extract channel name
                    channel = "Unknown Channel"
                    if 'shortBylineText' in video_renderer:
                        if 'runs' in video_renderer['shortBylineText']:
                            for run in video_renderer['shortBylineText']['runs']:
                                if 'text' in run:
                                    channel = run['text']
                                    break
                        elif 'simpleText' in video_renderer['shortBylineText']:
                            channel = video_renderer['shortBylineText']['simpleText']
                    
                    # Extract duration
                    duration = "Unknown"
                    if 'lengthText' in video_renderer:
                        if 'simpleText' in video_renderer['lengthText']:
                            duration = video_renderer['lengthText']['simpleText']
                        elif 'accessibility' in video_renderer['lengthText']:
                            label = video_renderer['lengthText']['accessibility'].get('accessibilityData', {}).get('label', '')
                            if label:
                                duration = label
                    
                    # Create video data object
                    video_data = {
                        'id': video_id,
                        'title': title,
                        'channel': {'name': channel},
                        'duration': duration,
                        'link': f"https://www.youtube.com/watch?v={video_id}"
                    }
                    
                    # Extract view count if available
                    if 'videoInfo' in video_renderer and 'runs' in video_renderer['videoInfo']:
                        for run in video_renderer['videoInfo']['runs']:
                            if 'text' in run and 'views' in run['text']:
                                video_data['views'] = run['text']
                                break
                    
                    self.videos.append(video_data)
                    videos_added += 1
                    print(f"Fetched video {len(self.videos)}/{total_videos}: {title}")
                
                print(f"Added {videos_added} videos in this batch. Total videos: {len(self.videos)}")
                
                # If we didn't find a continuation token in the items, try to find it in the raw response
                if not self._continuation_token:
                    # Convert data to string to use regex
                    data_str = json.dumps(data)
                    
                    # Try multiple patterns
                    patterns = [
                        r'"continuationCommand":\s*\{\s*"token":\s*"([^"]+)"',
                        r'"continuationEndpoint":[^}]*"continuationCommand":[^}]*"token":"([^"]+)"',
                        r'"token":"([^"]+)","request":"CONTINUATION_REQUEST_TYPE_BROWSE"',
                        r'"continuation":"([^"]+)"'
                    ]
                    
                    for pattern in patterns:
                        match = re.search(pattern, data_str)
                        if match:
                            self._continuation_token = match.group(1)
                            print(f"Found continuation token using regex: {pattern}")
                            print(f"New token: {self._continuation_token[:20]}...")
                            break
                    
                    # If we still don't have a continuation token but we added videos,
                    # create a fake continuation token to continue fetching
                    if not self._continuation_token and videos_added > 0:
                        # Create a fake token based on the current video count
                        # This will allow us to continue fetching even if the API doesn't provide a token
                        current_count = len(self.videos)
                        # Only create a fake token if we haven't reached the end of the playlist
                        if total_videos > current_count:
                            self._continuation_token = f"fake_token_{self.playlist_id}_{current_count}"
                            print(f"Created fake continuation token to continue fetching: {self._continuation_token[:20]}...")
                    
                    if not self._continuation_token:
                        print("No more videos available in playlist")
                        
                        # If we got videos but no continuation token, we've likely reached the end of the playlist
                        if videos_added > 0:
                            print(f"Successfully fetched {videos_added} videos in this batch without finding a continuation token.")
                            print("This may indicate we've reached the end of the playlist.")
        
        except Exception as e:
            print(f"Error fetching videos with continuation: {e}")
            import traceback
            traceback.print_exc()
            self._continuation_token = None

    async def fetch_playlist(self) -> bool:
        """Fetch all videos in the playlist using yt-dlp and YouTube's internal API"""
        try:
            url = f"https://www.youtube.com/playlist?list={self.playlist_id}"
            print(f"Fetching playlist: {url}")
            
            # Configure yt-dlp options
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
                'ignoreerrors': True,
                'skip_download': True,
                'logger': None,
                'nocheckcertificate': True,
                'geo_bypass': True,
                'socket_timeout': 30,
                'retries': 10,
                'playlistend': 100,  # Limit to first 100 videos for initial fetch
                'playliststart': 1,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                playlist_info = ydl.extract_info(url, download=False)
                
                if not playlist_info:
                    return False
            
                # Extract playlist metadata
                self.info = {
                    'id': self.playlist_id,
                    'title': playlist_info.get('title', 'Unknown Playlist'),
                    'channel': {'name': playlist_info.get('channel', playlist_info.get('uploader', 'Unknown Channel'))},
                    'url': url
                }
                
                # Extract video information
                entries = playlist_info.get('entries', [])
                
                # Try to get the total video count from playlist_count or from the entries
                # Sometimes yt-dlp reports incorrect playlist_count, so we'll check both
                reported_count = playlist_info.get('playlist_count', 0)
                entries_count = len(entries)
                
                # If yt-dlp reports more videos than it fetched, use that as total count
                # Otherwise, use the number of entries we got
                total_videos = reported_count if reported_count > entries_count else entries_count
                
                # Set videoCount in self.info
                self.info['videoCount'] = str(total_videos)
                
                print(f"Found playlist: {self.info['title']}")
                print(f"Channel: {self.info['channel']['name']}")
                print(f"Total videos in playlist: {total_videos}")
                
                # Process videos from yt-dlp
                self.videos = []
                for entry in entries:
                    if not entry:
                        continue
                        
                    video_id = entry.get('id')
                    if not video_id:
                        continue
                        
                    title = entry.get('title', 'Unknown Title')
                    channel = entry.get('channel', entry.get('uploader', 'Unknown Channel'))
                    duration = entry.get('duration_string', 'Unknown')
                    
                    # Create video data object
                    video_data = self._extract_video_info(None, title, channel, duration, video_id)
                    
                    self.videos.append(video_data)
                
                print(f"Initial batch: Fetched {len(self.videos)} videos (Total: {total_videos})")
                
                # If there are no more videos to fetch, we're done
                if total_videos <= len(self.videos) or total_videos <= 100:
                    print(f"All videos fetched. Total: {len(self.videos)}")
                    return True
                
                # We need to fetch more videos - prepare to use the webpage approach
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
                
                # To fetch videos beyond the first 100, we'll try multiple approaches
                max_attempts = 5  # Maximum page attempts
                batch_size = 100  # Each page typically has around 100 videos
                
                # Try to fetch additional pages
                async with aiohttp.ClientSession() as session:
                    # First fetch the initial page to get more accurate title and other metadata
                    try:
                        async with session.get(url, headers=headers) as response:
                            if response.status == 200:
                                initial_html = await response.text()
                                
                                # Extract a better title from HTML
                                better_title = self._extract_playlist_title(initial_html)
                                if better_title and better_title != "Unknown Playlist":
                                    self.info['title'] = better_title
                                    print(f"Updated playlist title: {better_title}")
                    except Exception as e:
                        print(f"Error fetching initial page: {e}")
                    
                    # Now fetch additional pages
                    for page_num in range(2, max_attempts + 2):  # Start from page 2 (after the first 100 videos)
                        print(f"Fetching page {page_num} of playlist...")
                        page_url = f"{url}&page={page_num}"
                        
                        # Fetch the page
                        try:
                            async with session.get(page_url, headers=headers) as response:
                                if response.status != 200:
                                    print(f"Error fetching page {page_num}: {response.status}")
                                    continue
                                
                                page_html = await response.text()
                                
                                # Extract video IDs and titles from the page
                                videos_found = self._extract_videos_from_html(page_html)
                                if not videos_found:
                                    print(f"No videos found on page {page_num}")
                                    break
                                
                                videos_added = 0
                                for video_id, title, channel in videos_found:
                                    # Skip videos we already have
                                    if any(v.get('id') == video_id for v in self.videos):
                                        continue
                                    
                                    # Create video data object
                                    video_data = self._extract_video_info(None, title, channel, "Unknown", video_id)
                                    self.videos.append(video_data)
                                    videos_added += 1
                                
                                print(f"Added {videos_added} videos from page {page_num}. Total: {len(self.videos)}")
                                
                                # If we didn't add any new videos, we're probably at the end
                                if videos_added == 0:
                                    print("No new videos found. Stopping.")
                                    break
                                
                                # If we've fetched all videos or reached a limit, stop
                                if len(self.videos) >= total_videos or len(self.videos) >= 500:
                                    print(f"All videos fetched or reached limit. Total: {len(self.videos)}")
                                    break
                        
                        except Exception as e:
                            print(f"Error fetching page {page_num}: {e}")
                            continue
                
                # If we still haven't found all videos, try the continuation token approach
                if len(self.videos) < total_videos and len(self.videos) < 500:
                    print(f"Trying continuation token approach for remaining videos...")
                    self._continuation_token = None
                    
                    # Extract continuation token from the initial page
                    try:
                        initial_data_match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});\s*</script>', page_html)
                        if initial_data_match:
                            data = json.loads(initial_data_match.group(1))
                            
                            # Try to find continuation token using multiple patterns
                            continuation_patterns = [
                                r'"continuationCommand":\s*\{\s*"token":\s*"([^"]+)"',
                                r'"continuationEndpoint":[^}]*"continuationCommand":[^}]*"token":"([^"]+)"',
                                r'"token":"([^"]+)","request":"CONTINUATION_REQUEST_TYPE_BROWSE"',
                                r'"token":"([^"]+)"[^}]*"commandMetadata"',
                                r'"continuationCommand":\{"token":"([^"]+)"',
                                r'"continuation":"([^"]+)"'
                            ]
                            
                            data_str = json.dumps(data)
                            for pattern in continuation_patterns:
                                matches = re.findall(pattern, data_str)
                                if matches:
                                    self._continuation_token = matches[-1]
                                    print(f"Found continuation token: {self._continuation_token[:20]}...")
                                    break
                            
                            if self._continuation_token:
                                # Fetch videos using continuation token
                                await self._fetch_remaining_videos_with_api(len(self.videos), total_videos)
                    except Exception as e:
                        print(f"Error extracting continuation token: {e}")
                
                print(f"Successfully fetched {len(self.videos)} videos out of approximately {total_videos}")
                return True
                
        except Exception as e:
            print(f"Error fetching playlist: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    def _extract_videos_from_html(self, html):
        """Extract video IDs, titles, and channels from HTML"""
        videos = []
        
        # Try multiple patterns to find videos
        # Pattern 1: Look for videoId and text in the same segment
        pattern1 = r'"videoId"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)".*?"shortBylineText".*?"text"\s*:\s*"([^"]+)"'
        matches1 = re.finditer(pattern1, html)
        for match in matches1:
            video_id, title, channel = match.groups()
            # Check if this is likely a video title (not a button text or other UI element)
            if len(title) > 10:  # Simple heuristic: titles are usually longer
                videos.append((video_id, title, channel))
        
        # If we found videos with pattern 1, return them
        if videos:
            return videos
        
        # Pattern 2: Look for just videoId and title
        pattern2 = r'"videoId"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"'
        matches2 = re.finditer(pattern2, html)
        for match in matches2:
            video_id, title = match.groups()
            # Check if this is likely a video title
            if len(title) > 10:
                videos.append((video_id, title, "Unknown Channel"))
        
        # If we found videos with pattern 2, return them
        if videos:
            return videos
        
        # Pattern 3: Look for video links in a tag
        pattern3 = r'href="/watch\?v=([^&"]+)[^>]*>([^<]+)'
        matches3 = re.finditer(pattern3, html)
        for match in matches3:
            video_id, title = match.groups()
            # Clean up the title
            title = title.strip()
            if len(title) > 5:
                videos.append((video_id, title, "Unknown Channel"))
        
        # Remove duplicates by using a dictionary with video_id as key
        unique_videos = {}
        for video_id, title, channel in videos:
            if video_id not in unique_videos:
                unique_videos[video_id] = (title, channel)
        
        # Convert back to list format
        result = [(video_id, title, channel) for video_id, (title, channel) in unique_videos.items()]
        
        return result

    def _extract_text_from_runs(self, runs):
        """Extract text from a 'runs' array in YouTube's API response"""
        if not runs:
            return ""
        
        parts = []
        for run in runs:
            if isinstance(run, dict) and 'text' in run:
                parts.append(run['text'])
        
        text = "".join(parts)
        
        # Clean up text by removing repetition patterns
        if '\n' in text:
            # If there are newlines, it might be a repetition pattern
            # Take only the first line or segment
            text = text.split('\n')[0].strip()
        
        return text
        
    def _extract_text_from_accessibility(self, data):
        """Extract text from YouTube API accessibility label"""
        if not data:
            return "Unknown"
        
        accessibility_data = data.get('accessibility', {}).get('accessibilityData', {})
        return accessibility_data.get('label', "Unknown")

    def _extract_video_info(self, video_data, title, channel, duration, video_id):
        """Extract video info from various sources into a standardized format"""
        return {
            'id': video_id,
            'title': title,
            'channel': {'name': channel},
            'duration': duration,
            'link': f"https://www.youtube.com/watch?v={video_id}"
        }

    def _extract_playlist_title(self, html):
        """Extract playlist title from HTML"""
        # Try to find title in meta tags first
        meta_title_match = re.search(r'<meta\s+name="title"\s+content="([^"]+)"', html)
        if meta_title_match:
            title = meta_title_match.group(1)
            # Remove " - YouTube" suffix if present
            title = re.sub(r'\s*-\s*YouTube\s*$', '', title)
            return title
        
        # Try to find title in og:title meta tag
        og_title_match = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
        if og_title_match:
            title = og_title_match.group(1)
            # Remove " - YouTube" suffix if present
            title = re.sub(r'\s*-\s*YouTube\s*$', '', title)
            return title
        
        # Try to find title in title tag
        title_match = re.search(r'<title>([^<]+)</title>', html)
        if title_match:
            title = title_match.group(1)
            # Remove " - YouTube" suffix if present
            title = re.sub(r'\s*-\s*YouTube\s*$', '', title)
            return title
        
        # Try to find title in script data
        script_match = re.search(r'"title":\s*"([^"]+)"', html)
        if script_match:
            return script_match.group(1)
        
        return "Unknown Playlist" 