/**
 * Resource Cache Service
 * 
 * Provides methods to interact with the resource caching API.
 * This is used in conjunction with the youtubeService to provide cached resources.
 */

// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const RESOURCES_API = `${API_URL}/api/resources`;

/**
 * Find resources for a specific technology
 * @param {string} technology - The technology to find resources for
 * @param {number} limit - Maximum number of resources to return
 * @param {boolean} refresh - Whether to force refresh the cache
 * @returns {Promise<Object>} - The API response
 */
export const findResourcesForTechnology = async (technology, limit = 5, refresh = false) => {
  try {
    const response = await fetch(
      `${RESOURCES_API}/technology?technology=${encodeURIComponent(technology)}&limit=${limit}&refresh=${refresh}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to find resources: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding resources for technology:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Find resources for multiple technologies
 * @param {Array<string>} technologies - Array of technologies to find resources for
 * @param {number} limit - Maximum number of resources per technology
 * @returns {Promise<Object>} - The API response
 */
export const findResourcesForMultipleTechnologies = async (technologies, limit = 5) => {
  try {
    const response = await fetch(`${RESOURCES_API}/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        technologies,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to discover resources: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error discovering resources for technologies:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cache a resource
 * @param {Object} resource - The resource to cache
 * @param {string} technology - The technology this resource is for
 * @returns {Promise<Object>} - The API response
 */
export const cacheResource = async (resource, technology) => {
  try {
    const response = await fetch(`${RESOURCES_API}/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resource,
        technology
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to cache resource: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error caching resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process technologies in batches
 * @param {Array<string>} technologies - Array of technologies to process
 * @param {number} batchSize - Number of technologies to process at once
 * @param {number} startIndex - Starting index for batch processing
 * @returns {Promise<Object>} - The API response
 */
export const processTechnologies = async (technologies, batchSize = 5, startIndex = 0) => {
  try {
    const response = await fetch(
      `${RESOURCES_API}/process?batchSize=${batchSize}&startIndex=${startIndex}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          technologies
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to process technologies: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing technologies:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up expired resources
 * @returns {Promise<Object>} - The API response
 */
export const cleanupExpiredResources = async () => {
  try {
    const response = await fetch(`${RESOURCES_API}/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to clean up resources: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cleaning up resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update shared resources after roadmap generation
 * This function analyzes all resources in a roadmap and updates the database
 * to convert individual resources to shared resources when appropriate
 * 
 * @param {Object} roadmap - The generated roadmap with resources
 * @returns {Promise<Object>} - The API response with updated resources
 */
export const updateSharedResources = async (roadmap) => {
  try {
    console.log('Analyzing roadmap resources for shared content...');
    
    // Extract all resources from the roadmap
    const resourcesByUrl = new Map();
    const technologiesByUrl = new Map();
    
    // Helper function to normalize technology names
    const normalizeTechName = (tech) => {
      // Remove duplicated words (e.g., "Git Git" -> "Git")
      const words = tech.split(' ');
      const uniqueWords = [...new Set(words)];
      return uniqueWords.join(' ');
    };
    
    // Process all sections and topics to extract resources
    if (roadmap.sections && Array.isArray(roadmap.sections)) {
      roadmap.sections.forEach(section => {
        if (section.topics && Array.isArray(section.topics)) {
          section.topics.forEach(topic => {
            // Get the technology name from the topic
            const technology = normalizeTechName(topic.title.trim());
            
            // Check if this topic has a video resource
            if (topic.video) {
              const resource = topic.video;
              const url = resource.url;
              
              // Add to our tracking maps
              if (!resourcesByUrl.has(url)) {
                resourcesByUrl.set(url, resource);
                technologiesByUrl.set(url, new Set([technology]));
              } else {
                // Resource already exists, add this technology to its set
                technologiesByUrl.get(url).add(technology);
              }
            }
          });
        }
      });
    }
    
    // Find resources that are used for multiple technologies
    const sharedResourceUpdates = [];
    
    for (const [url, technologiesSet] of technologiesByUrl.entries()) {
      // If a resource is used for multiple technologies, it should be shared
      if (technologiesSet.size > 1) {
        const resource = resourcesByUrl.get(url);
        const technologies = Array.from(technologiesSet);
        
        console.log(`Found shared resource: ${resource.title}`);
        console.log(`Used for technologies: ${technologies.join(', ')}`);
        
        // Add to our list of resources to update
        sharedResourceUpdates.push({
          resource,
          technologies
        });
      }
    }
    
    // If we found shared resources, update them in the database
    if (sharedResourceUpdates.length > 0) {
      console.log(`Updating ${sharedResourceUpdates.length} shared resources...`);
      
      const response = await fetch(`${RESOURCES_API}/update-shared`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: sharedResourceUpdates
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update shared resources: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Shared resources updated successfully:', result);
      return result;
    } else {
      console.log('No shared resources found to update');
      return { success: true, message: 'No shared resources found to update', updatedCount: 0 };
    }
  } catch (error) {
    console.error('Error updating shared resources:', error);
    return { success: false, error: error.message };
  }
}; 