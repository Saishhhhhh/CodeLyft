/**
 * Logo Mappings Service
 * Handles loading and managing mappings between technology names and logo files
 * that already exist in the primary and secondary folders
 */
import axios from 'axios';

// Cache for logo existence
const logoCache = {
  primary: {},
  secondary: {}
};

/**
 * Scan the logos directory to build a mapping of available logos
 * @param {string} type - Either 'primary' or 'secondary'
 * @returns {Promise<Object>} - Object mapping technology names to logo filenames
 */
const scanLogoDirectory = async (type) => {
  try {
    console.log(`Loading ${type} logo mappings from /logos/${type}-logos.json`);
    // Load the JSON mapping file
    const response = await axios.get(`/logos/${type}-logos.json`);
    console.log(`Successfully loaded ${type} logo mappings with ${Object.keys(response.data).length} entries`);
    return response.data;
  } catch (error) {
    console.error(`Error loading ${type} logo mappings:`, error);
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
 * Check if a logo exists in the secondary collection
 * @param {string} normalizedName - Normalized technology name
 * @returns {boolean} - Whether the logo exists
 */
export const checkSecondaryLogo = async (normalizedName) => {
  // Use cache if available
  if (logoCache.secondary[normalizedName] !== undefined) {
    return logoCache.secondary[normalizedName];
  }

  try {
    // Try to access the file directly
    const response = await axios.head(`/logos/secondary/${normalizedName}.svg`);
    const exists = response.status === 200;
    logoCache.secondary[normalizedName] = exists;
    return exists;
  } catch (error) {
    logoCache.secondary[normalizedName] = false;
    return false;
  }
};

/**
 * Get all available primary logos
 * @returns {Promise<string[]>} - Array of available primary logo names
 */
export const getAllPrimaryLogos = async () => {
  const mappings = await scanLogoDirectory('primary');
  return Object.keys(mappings);
};

/**
 * Get all available secondary logos
 * @returns {Promise<string[]>} - Array of available secondary logo names
 */
export const getAllSecondaryLogos = async () => {
  const mappings = await scanLogoDirectory('secondary');
  return Object.keys(mappings);
};

/**
 * Load logo mappings from the JSON files
 * @returns {Promise<Object>} - Object containing primary and secondary logo mappings
 */
export const loadLogoMappings = async () => {
  try {
    console.log('Loading logo mappings...');
    
    // For primary logos (473)
    const primaryMappings = await scanLogoDirectory('primary');
    console.log(`Loaded ${Object.keys(primaryMappings).length} primary logos`);
    
    // For secondary logos (3313)
    const secondaryMappings = await scanLogoDirectory('secondary');
    console.log(`Loaded ${Object.keys(secondaryMappings).length} secondary logos`);
    
    // Cache the results
    Object.keys(primaryMappings).forEach(tech => {
      logoCache.primary[tech] = true;
    });
    
    Object.keys(secondaryMappings).forEach(tech => {
      logoCache.secondary[tech] = true;
    });
    
    console.log(`Loaded ${Object.keys(primaryMappings).length} primary logos and ${Object.keys(secondaryMappings).length} secondary logos`);
    console.log('Sample primary keys:', Object.keys(primaryMappings).slice(0, 5));
    console.log('Sample secondary keys:', Object.keys(secondaryMappings).slice(0, 5));
    
    return {
      primary: primaryMappings,
      secondary: secondaryMappings
    };
  } catch (error) {
    console.error('Failed to load logo mappings:', error);
    throw error;
  }
}; 