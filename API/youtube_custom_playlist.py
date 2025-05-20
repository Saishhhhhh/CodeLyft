"""
Custom implementation of YouTube playlist fetching to work around issues in the library
"""

import json
import re
import httpx
from youtubesearchpython import Video

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