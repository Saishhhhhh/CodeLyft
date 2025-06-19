const Resource = require('../models/Resource');

// Track API call timestamps for rate limiting
const API_CALL_TIMESTAMPS = [];

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 10,
  windowMs: 60000 // 1 minute in milliseconds
};

/**
 * Check if we've exceeded rate limits for the API
 * @returns {boolean} - True if rate limit exceeded, false otherwise
 */
const isRateLimited = () => {
  const now = Date.now();
  
  // Remove timestamps older than the window
  const recentTimestamps = API_CALL_TIMESTAMPS.filter(ts => (now - ts) < RATE_LIMIT.windowMs);
  API_CALL_TIMESTAMPS.length = 0; // Clear the array
  API_CALL_TIMESTAMPS.push(...recentTimestamps); // Add back recent timestamps
  
  // Check if we've exceeded the rate limit
  return recentTimestamps.length >= RATE_LIMIT.requestsPerMinute;
};

/**
 * Record an API call timestamp for rate limiting
 */
const recordApiCall = () => {
  API_CALL_TIMESTAMPS.push(Date.now());
};

/**
 * Check if two technology names are equivalent
 * @param {string} tech1 - First technology name
 * @param {string} tech2 - Second technology name
 * @returns {Promise<boolean>} - Whether the technologies are equivalent
 */
const areTechnologiesEquivalent = async (tech1, tech2) => {
  // Quick check for exact matches or simple cases
  if (tech1.toLowerCase() === tech2.toLowerCase()) {
    return true;
  }
  
  const TECH_MATCHER_API_URL = process.env.TECH_MATCHER_API_URL || 'http://localhost:8000';
  let retryCount = 0;
  const maxRetries = 3;
  let backoffDelay = 1000; // Start with 1 second
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Checking if technologies are equivalent: "${tech1}" and "${tech2}" (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Call the tech matcher API
      const response = await fetch(`${TECH_MATCHER_API_URL}/match?tech1=${encodeURIComponent(tech1)}&tech2=${encodeURIComponent(tech2)}`);
      
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log(`Technology equivalence result: ${result.areEquivalent ? 'EQUIVALENT' : 'DIFFERENT'} (similarity: ${result.similarity.toFixed(2)})`);
      console.log(`Explanation: ${result.explanation}`);
      
      return result.areEquivalent;
    } catch (error) {
      console.error('Error checking technology equivalence:', error);
      
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Apply exponential backoff
        console.log(`API error. Retrying with backoff (${backoffDelay}ms)...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        backoffDelay *= 2; // Exponential backoff
        continue;
      }
      
      // If all retries fail, use fallback method
      console.log('Using fallback technology matching method');
      return fallbackAreTechnologiesEquivalent(tech1, tech2);
    }
  }
  
  return fallbackAreTechnologiesEquivalent(tech1, tech2);
};

/**
 * Fallback function to check if two technologies are equivalent
 * @param {string} tech1 - First technology name
 * @param {string} tech2 - Second technology name
 * @returns {boolean} - Whether the technologies are equivalent
 */
const fallbackAreTechnologiesEquivalent = (tech1, tech2) => {
  // Normalize technology names
  const normalizeTech = (tech) => {
    return tech
      .toLowerCase()
      .replace(/\.js$/i, '')
      .replace(/js$/i, '')
      .replace(/\s+/g, '')
      .trim();
  };

  const normalized1 = normalizeTech(tech1);
  const normalized2 = normalizeTech(tech2);

  // Check for exact match after normalization
  return normalized1 === normalized2;
};

/**
 * Find resources for a specific technology
 * Checks both shared and individual resources
 */
exports.findResourcesForTechnology = async (req, res) => {
  try {
    const { technology } = req.query;
    const { limit = 10, refresh = false, roadmapTopics = [] } = req.query;
    
    if (!technology) {
      return res.status(400).json({
        success: false,
        message: 'Technology parameter is required'
      });
    }
    
    const currentDate = new Date();
    let resources = [];
    
    // Parse roadmap topics if provided
    let parsedRoadmapTopics = [];
    try {
      if (roadmapTopics && typeof roadmapTopics === 'string' && roadmapTopics.trim() !== '') {
        parsedRoadmapTopics = JSON.parse(roadmapTopics);
      }
    } catch (error) {
      console.error('Error parsing roadmap topics:', error);
      // Continue with empty roadmap topics array
    }
    
    // Only fetch fresh resources if refresh is not true
    if (refresh !== 'true') {
      // Get all potentially relevant resources with valid expiration
      const allResources = await Resource.find({
        expiresAt: { $gt: currentDate }
      }).sort({ 'metadata.rating': -1 });
      
      // Use semantic matching
      const matchedResources = [];
      
      for (const resource of allResources) {
        let isMatch = false;
      
        // Check shared resources
        if (resource.isShared && resource.technologies && resource.technologies.length > 0) {
          for (const tech of resource.technologies) {
            try {
              // Check if the technologies are equivalent
              const equivalent = await areTechnologiesEquivalent(technology, tech);
              if (equivalent) {
                isMatch = true;
                break;
              }
            } catch (error) {
              console.error(`Error checking technology equivalence: ${error.message}`);
              // Fallback to basic string comparison
              if (tech.toLowerCase() === technology.toLowerCase()) {
                isMatch = true;
                break;
              }
            }
          }
          
          // If we have a match but also have roadmap topics provided,
          // verify ALL technologies in the shared resource are present in the roadmap
          if (isMatch && parsedRoadmapTopics.length > 0) {
            const allTechnologiesInRoadmap = await checkAllTechnologiesInRoadmap(
              resource.technologies,
              parsedRoadmapTopics
            );
            
            if (!allTechnologiesInRoadmap) {
              console.log(`Rejecting shared resource for "${technology}" because not all its technologies are in the roadmap`);
              isMatch = false;
            }
          }
        } 
        // Check individual resources
        else if (!resource.isShared && resource.technology) {
          try {
            // Check if the technologies are equivalent
            const equivalent = await areTechnologiesEquivalent(technology, resource.technology);
            if (equivalent) {
              isMatch = true;
            }
          } catch (error) {
            console.error(`Error checking technology equivalence: ${error.message}`);
            // Fallback to basic string comparison
            if (resource.technology.toLowerCase() === technology.toLowerCase()) {
              isMatch = true;
            }
          }
        }
        
        if (isMatch) {
          matchedResources.push(resource);
          // Stop if we've reached the limit
          if (matchedResources.length >= parseInt(limit)) {
            break;
          }
        }
      }
      
      resources = matchedResources;
    }
    
    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
      isCached: resources.length > 0,
      needsFresh: resources.length < parseInt(limit) || refresh === 'true'
    });
  } catch (error) {
    console.error('Error finding resources for technology:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Check if all technologies in a shared resource are present in the roadmap
 * @param {Array<string>} resourceTechnologies - Technologies in the resource
 * @param {Array<string>} roadmapTopics - Topics in the roadmap
 * @returns {Promise<boolean>} - Whether all resource technologies are in the roadmap
 */
const checkAllTechnologiesInRoadmap = async (resourceTechnologies, roadmapTopics) => {
  if (!resourceTechnologies || !Array.isArray(resourceTechnologies) || resourceTechnologies.length === 0) {
    return false;
  }
  
  if (!roadmapTopics || !Array.isArray(roadmapTopics) || roadmapTopics.length === 0) {
    return false;
  }
  
  // Normalize roadmap topics for easier comparison
  const normalizedRoadmapTopics = roadmapTopics.map(topic => 
    typeof topic === 'string' ? topic.toLowerCase() : ''
  );
  
  // Check if each technology in the resource is in the roadmap
  for (const resourceTech of resourceTechnologies) {
    let techFound = false;
    
    // First check direct match
    if (normalizedRoadmapTopics.includes(resourceTech.toLowerCase())) {
      techFound = true;
      continue;
    }
    
    // If no direct match, check equivalence with each roadmap topic
    for (const roadmapTopic of normalizedRoadmapTopics) {
      try {
        const isEquivalent = await areTechnologiesEquivalent(resourceTech, roadmapTopic);
        if (isEquivalent) {
          techFound = true;
          break;
        }
      } catch (error) {
        console.error(`Error checking technology equivalence: ${error.message}`);
        // Fallback to simplified comparison
        if (resourceTech.toLowerCase().replace(/\s+/g, '') === roadmapTopic.replace(/\s+/g, '')) {
          techFound = true;
          break;
        }
      }
    }
    
    // If any technology is not found in the roadmap, return false
    if (!techFound) {
      console.log(`Resource technology "${resourceTech}" not found in roadmap topics`);
      return false;
    }
  }
  
  // All technologies were found in the roadmap
  return true;
};

/**
 * Find resources for multiple technologies
 * Used for batch processing roadmaps
 */
exports.findResourcesForMultipleTechnologies = async (req, res) => {
  try {
    const { technologies } = req.body;
    const { limit = 5 } = req.query;
    
    if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Technologies array is required'
      });
    }
    
    const currentDate = new Date();
    const results = [];
    
    // Get all potentially relevant resources with valid expiration
    const allResources = await Resource.find({
      expiresAt: { $gt: currentDate }
    }).sort({ 'metadata.rating': -1 });
    
    // Process each technology
    for (const technology of technologies) {
      const matchedResources = [];
      
      // Check each resource for a match with the current technology
      for (const resource of allResources) {
        let isMatch = false;
        
        // Check shared resources
        if (resource.isShared && resource.technologies && resource.technologies.length > 0) {
          for (const tech of resource.technologies) {
            try {
              // Check if the technologies are equivalent
              const equivalent = await areTechnologiesEquivalent(technology, tech);
              if (equivalent) {
                isMatch = true;
                break;
              }
            } catch (error) {
              console.error(`Error checking technology equivalence: ${error.message}`);
              // Fallback to basic string comparison
              if (tech.toLowerCase() === technology.toLowerCase()) {
                isMatch = true;
                break;
              }
            }
          }
        } 
        // Check individual resources
        else if (!resource.isShared && resource.technology) {
          try {
            // Check if the technologies are equivalent
            const equivalent = await areTechnologiesEquivalent(technology, resource.technology);
            if (equivalent) {
              isMatch = true;
            }
          } catch (error) {
            console.error(`Error checking technology equivalence: ${error.message}`);
            // Fallback to basic string comparison
            if (resource.technology.toLowerCase() === technology.toLowerCase()) {
              isMatch = true;
            }
          }
        }
        
        if (isMatch) {
          matchedResources.push(resource);
          // Stop if we've reached the limit
          if (matchedResources.length >= parseInt(limit)) {
            break;
          }
        }
      }
      
      results.push({
        technology,
        resources: matchedResources,
        count: matchedResources.length,
        needsFresh: matchedResources.length < parseInt(limit)
      });
    }
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error finding resources for multiple technologies:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Cache a resource (create or update)
 */
exports.cacheResource = async (req, res) => {
  try {
    const { resource, technology } = req.body;
    
    if (!resource || !technology) {
      return res.status(400).json({
        success: false,
        message: 'Resource and technology are required'
      });
    }
    
    // Check if resource already exists (by URL)
    let existingResource = await Resource.findOne({ url: resource.url });
    
    if (existingResource) {
      // Resource exists, update it
      
      // Set expiration to 15 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);
      existingResource.expiresAt = expiresAt;
      
      // Check if this is a new technology for this resource
      if (existingResource.isShared) {
        // For shared resources, check if technology is already in the list
        if (!existingResource.technologies.includes(technology)) {
          existingResource.technologies.push(technology);
        }
      } else {
        // This was an individual resource, convert to shared if technology is different
        if (existingResource.technology !== technology) {
          existingResource.isShared = true;
          existingResource.technologies = [existingResource.technology, technology];
          existingResource.technology = undefined; // Clear individual technology field
        }
      }
      
      await existingResource.save();
      
      return res.status(200).json({
        success: true,
        message: 'Resource updated in cache',
        data: existingResource,
        isNew: false
      });
    } else {
      // Resource doesn't exist, create new one
      
      // Process videos to ensure they have thumbnails and proper format
      const processedVideos = resource.isPlaylist ? 
        (resource.videos || []).map(video => {
          // Ensure each video has a thumbnail
          let thumbnail = '';
          if (video.thumbnail) {
            thumbnail = video.thumbnail;
          } else if (video.id && /^[a-zA-Z0-9_-]{11}$/.test(video.id)) {
            thumbnail = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
          } else {
            thumbnail = 'https://via.placeholder.com/320x180?text=No+Thumbnail';
          }
          
          // Process channel information
          let channelInfo = video.channel;
          
          return {
            ...video,
            thumbnail,
            channel: channelInfo,
            duration_string: video.duration_string || video.duration || "Unknown"
          };
        }) : 
        [{
          id: resource.id,
          title: resource.title,
          url: resource.url,
          thumbnail: resource.thumbnail || 
                    (resource.id && /^[a-zA-Z0-9_-]{11}$/.test(resource.id) ? 
                      `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg` : 
                      'https://via.placeholder.com/320x180?text=No+Thumbnail'),
          duration: resource.duration || "Unknown",
          duration_string: resource.duration_string || resource.duration || "Unknown",
          publish_date: resource.publish_date || "Unknown",
          views: resource.views || 0,
          likes: resource.likes || 0,
          views_formatted: resource.views_formatted || "N/A",
          likes_formatted: resource.likes_formatted || "N/A",
          channel: resource.channel || "Unknown"
        }];
      
      // Format resource data
      const newResource = {
        url: resource.url,
        title: resource.title,
        description: resource.description || '',
        type: resource.isPlaylist ? 'playlist' : 'video',
        technology: technology, // Start as individual resource
        isShared: false,
        metadata: {
          channelName: resource.channel || '',
          channelUrl: typeof resource.channel === 'object' ? resource.channel.url : '',
          videoCount: resource.isPlaylist ? (resource.videoCount || resource.videos?.length || 0) : 1,
          viewCount: resource.views || 0,
          viewCount_formatted: resource.views_formatted || '',
          rating: resource.rating || resource.score || 0,
          quality: resource.quality || resource.verdict || '',
          thumbnail: resource.thumbnail || 
                    (processedVideos.length > 0 ? processedVideos[0].thumbnail : '') || 
                    (resource.id && /^[a-zA-Z0-9_-]{11}$/.test(resource.id) ? 
                      `https://img.youtube.com/vi/${resource.id}/mqdefault.jpg` : 
                      'https://via.placeholder.com/320x180?text=No+Thumbnail')
        },
        videos: processedVideos
      };
      
      // Set expiration to 15 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);
      newResource.expiresAt = expiresAt;
      
      const createdResource = await Resource.create(newResource);
      
      return res.status(201).json({
        success: true,
        message: 'Resource added to cache',
        data: createdResource,
        isNew: true
      });
    }
  } catch (error) {
    console.error('Error caching resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Clean up expired resources
 */
exports.cleanupExpiredResources = async (req, res) => {
  try {
    const currentDate = new Date();
    const result = await Resource.deleteMany({
      expiresAt: { $lt: currentDate }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Expired resources cleaned up',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up expired resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Process technologies in batches
 * This endpoint processes a batch of technologies, 
 * checking cache and indicating which ones need fresh resources
 */
exports.processTechnologies = async (req, res) => {
  try {
    const { technologies } = req.body;
    const { batchSize = 5, startIndex = 0 } = req.query;
    
    if (!technologies || !Array.isArray(technologies)) {
      return res.status(400).json({
        success: false,
        message: 'Technologies array is required'
      });
    }
    
    const parsedBatchSize = parseInt(batchSize);
    const parsedStartIndex = parseInt(startIndex);
    
    // Get the subset of technologies for this batch
    const endIndex = Math.min(parsedStartIndex + parsedBatchSize, technologies.length);
    const batch = technologies.slice(parsedStartIndex, endIndex);
    
    // Process each technology in the batch
    const results = [];
    const currentDate = new Date();
    
    for (const technology of batch) {
      // Check for cached resources
      const sharedResources = await Resource.find({
        technologies: technology,
        isShared: true,
        expiresAt: { $gt: currentDate }
      }).sort({ 'metadata.rating': -1 }).limit(5);
      
      const individualResources = await Resource.find({
        technology: technology,
        isShared: false,
        expiresAt: { $gt: currentDate }
      }).sort({ 'metadata.rating': -1 }).limit(5 - sharedResources.length);
      
      const resources = [...sharedResources, ...individualResources];
      
      results.push({
        technology,
        hasCachedResources: resources.length > 0,
        cachedResourceCount: resources.length,
        needsFresh: resources.length < 5
      });
    }
    
    // Calculate next batch index or null if done
    const nextBatchIndex = endIndex < technologies.length ? endIndex : null;
    
    // Calculate progress percentage
    const progress = {
      processed: endIndex,
      total: technologies.length,
      percentage: Math.round((endIndex / technologies.length) * 100)
    };
    
    return res.status(200).json({
      success: true,
      results,
      nextBatchIndex,
      progress
    });
  } catch (error) {
    console.error('Error processing technologies batch:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update shared resources after roadmap generation
 * This endpoint analyzes resources used across multiple technologies
 * and updates them to be shared resources
 */
exports.updateSharedResources = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and must not be empty'
      });
    }
    
    console.log(`Processing ${updates.length} resource updates for shared content`);
    
    const results = {
      updated: [],
      failed: [],
      skipped: []
    };
    
    // Helper function to normalize technology names
    const normalizeTechName = (tech) => {
      // Remove duplicated words (e.g., "Git Git" -> "Git")
      const words = tech.split(' ');
      const uniqueWords = [...new Set(words)];
      return uniqueWords.join(' ');
    };
    
    // Process each update
    for (const update of updates) {
      const { resource, technologies } = update;
      
      if (!resource || !resource.url || !technologies || !Array.isArray(technologies) || technologies.length < 2) {
        results.skipped.push({ 
          url: resource?.url || 'unknown',
          reason: 'Invalid update data'
        });
        continue;
      }
      
      try {
        // Find the resource by URL
        const existingResource = await Resource.findOne({ url: resource.url });
        
        if (!existingResource) {
          results.skipped.push({ 
            url: resource.url,
            reason: 'Resource not found in database'
          });
          continue;
        }
        
        // Normalize technologies to prevent duplicates
        const normalizedTechnologies = new Set();
        
        // If it was an individual resource, add the normalized original technology
        if (existingResource.technology) {
          normalizedTechnologies.add(normalizeTechName(existingResource.technology));
        }
        
        // Add all technologies from the update, normalized
        technologies.forEach(tech => {
          normalizedTechnologies.add(normalizeTechName(tech));
        });
        
        // Add any existing technologies that might already be in the array
        if (existingResource.technologies && Array.isArray(existingResource.technologies)) {
          existingResource.technologies.forEach(tech => {
            normalizedTechnologies.add(normalizeTechName(tech));
          });
        }
        
        // Check for equivalent technologies
        const techArray = Array.from(normalizedTechnologies);
        const uniqueTechs = new Set();
        
        // Build a set of unique technologies by checking for equivalence
        for (let i = 0; i < techArray.length; i++) {
          let isUnique = true;
          const tech = techArray[i];
          
          // Check if this tech is equivalent to any already in the unique set
          for (const uniqueTech of uniqueTechs) {
            if (await areTechnologiesEquivalent(tech, uniqueTech)) {
              isUnique = false;
              console.log(`Detected equivalent technologies: "${tech}" and "${uniqueTech}"`);
              break;
            }
          }
          
          if (isUnique) {
            uniqueTechs.add(tech);
          }
        }
        
        // Convert the resource to a shared resource
        existingResource.isShared = true;
        existingResource.technologies = Array.from(uniqueTechs);
        existingResource.technology = undefined; // Clear individual technology field
        
        // Update the expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15);
        existingResource.expiresAt = expiresAt;
        
        await existingResource.save();
        
        results.updated.push({
          url: existingResource.url,
          title: existingResource.title,
          technologies: existingResource.technologies
        });
        
      } catch (error) {
        console.error(`Error updating resource ${resource.url}:`, error);
        results.failed.push({
          url: resource.url,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Updated ${results.updated.length} resources, skipped ${results.skipped.length}, failed ${results.failed.length}`,
      updatedCount: results.updated.length,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed
    });
  } catch (error) {
    console.error('Error updating shared resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 