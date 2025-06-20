/**
 * YouTube API Loader
 */

let apiLoaded = false;
let apiLoading = false;
let apiLoadPromise = null;

export const loadYouTubeApi = () => {
  if (apiLoaded) {
    return Promise.resolve();
  }

  if (apiLoading && apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoading = true;
  
  apiLoadPromise = new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiLoading = false;
      resolve();
    };

    try {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      tag.onerror = (err) => {
        apiLoading = false;
        reject(err);
      };
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } catch (error) {
      apiLoading = false;
      reject(error);
    }
  });

  return apiLoadPromise;
};

export const isYouTubeApiLoaded = () => {
  return apiLoaded && window.YT && window.YT.Player;
};

export const createYouTubePlayer = async (container, options) => {
  if (!isYouTubeApiLoaded()) {
    await loadYouTubeApi();
  }
  
  return new window.YT.Player(container, options);
};
