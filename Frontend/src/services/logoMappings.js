/**
 * Logo Mappings Service
 * Handles loading and managing mappings between technology names and logo files
 * that already exist in the primary folder
 */
import axios from 'axios';

// Cache for logo existence
const logoCache = {
  primary: {}
};

/**
 * Scan the logos directory to build a mapping of available logos
 * @returns {Promise<Object>} - Object mapping technology names to logo filenames
 */
const scanLogoDirectory = async () => {
  try {
    console.log('Loading primary logo mappings from /logos/primary-logos.json');
    // Load the JSON mapping file
    const response = await axios.get('/logos/primary-logos.json');
    console.log(`Successfully loaded primary logo mappings with ${Object.keys(response.data).length} entries`);
    return response.data;
  } catch (error) {
    console.error('Error loading primary logo mappings:', error);
    return {};
  }
};

/**
 * Check if a logo exists in the primary collection
 * @param {string} normalizedName - Normalized technology name
 * @returns {boolean} - Whether the logo exists
 */
export const checkPrimaryLogo = async (normalizedName) => {
  // Use cache if available
  if (logoCache.primary[normalizedName] !== undefined) {
    return logoCache.primary[normalizedName];
  }

  try {
    // Try to access the file directly
    const response = await axios.head(`/logos/primary/${normalizedName}.svg`);
    const exists = response.status === 200;
    logoCache.primary[normalizedName] = exists;
    return exists;
  } catch (error) {
    logoCache.primary[normalizedName] = false;
    return false;
  }
};

/**
 * Get all available primary logos
 * @returns {Promise<string[]>} - Array of available primary logo names
 */
export const getAllPrimaryLogos = async () => {
  const mappings = await scanLogoDirectory();
  return Object.keys(mappings);
};

/**
 * Load logo mappings from the JSON files
 * @returns {Promise<Object>} - Object containing primary logo mappings
 */
export const loadLogoMappings = async () => {
  try {
    console.log('Loading logo mappings...');
    
    // For primary logos (473)
    const primaryMappings = await scanLogoDirectory();
    console.log(`Loaded ${Object.keys(primaryMappings).length} primary logos`);
    
    // Cache the results
    Object.keys(primaryMappings).forEach(tech => {
      logoCache.primary[tech] = true;
    });
    
    console.log(`Loaded ${Object.keys(primaryMappings).length} primary logos`);
    console.log('Sample primary keys:', Object.keys(primaryMappings).slice(0, 5));
    
    return {
      primary: primaryMappings
    };
  } catch (error) {
    console.error('Failed to load logo mappings:', error);
    throw error;
  }
}; 