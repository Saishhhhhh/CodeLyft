import os
import sys
import subprocess
import time
import signal
import uvicorn

def launch_server():
    """Run FastAPI server with proper reload handling"""
    print("Starting YouTube API server...")
    
    # This reduces conflicts with Fortran/C libraries during reloads
    os.environ["PYTHONUNBUFFERED"] = "1"
    
    # Use uvicorn directly rather than letting FastAPI create its own
    # server, which gives more control over the reload process
    uvicorn.run(
        "youtube_fastapi:app", 
        host="127.0.0.1", 
        port=8000,
        reload=True,
        reload_delay=1.0,  # Add slight delay for file system to settle
        log_level="info"
    )

def signal_handler(sig, frame):
    """Handle Ctrl+C cleanly"""
    print("\nShutting down server gracefully...")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers for clean shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        launch_server()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Error: {e}")
        print("Server terminated unexpectedly. Restarting in 5 seconds...")
        time.sleep(5)
        launch_server() 