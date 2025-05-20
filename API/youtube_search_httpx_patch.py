"""
This script patches the youtube-search-python library to fix the 'proxies' error with httpx
Import this module before using any youtube-search-python functionality
"""

import httpx
from functools import wraps
from youtubesearchpython import *

# Original methods from httpx
original_post = httpx.post
original_get = httpx.get

# Create a patched version of the post method that removes proxies
@wraps(httpx.post)
def patched_post(*args, **kwargs):
    # Remove the problematic 'proxies' parameter if it exists
    if 'proxies' in kwargs:
        del kwargs['proxies']
    return original_post(*args, **kwargs)

# Create a patched version of the get method that removes proxies
@wraps(httpx.get)
def patched_get(*args, **kwargs):
    # Remove the problematic 'proxies' parameter if it exists
    if 'proxies' in kwargs:
        del kwargs['proxies']
    return original_get(*args, **kwargs)

# Override the methods
httpx.post = patched_post
httpx.get = patched_get

print("✅ youtube-search-python library patched successfully!") 