/**
 * Logo Service - Handles finding and matching technology logos
 * Implements lazy loading to improve initial page load time
 */
import axios from 'axios';

// In-memory cache for logo search results
const logoResultCache = {};

// Local storage keys
const LS_PRIMARY_LOGOS = 'codelyft_primary_logos';
const LS_SECONDARY_LOGOS = 'codelyft_secondary_logos';
const LS_TECH_ALIASES = 'codelyft_tech_aliases';
const LS_CACHE_VERSION = 'codelyft_cache_version';
const CACHE_VERSION = '1.0'; // Increment when logo structure changes

// Store loaded mappings - initialized empty and loaded on demand
let logoMappings = {
  primary: null, // Will be loaded on demand
  secondary: null // Will be loaded on demand
};

// Store tech aliases mapping
let techAliasesMap = null; // Will be loaded on demand
let canonicalToAliases = null; // Will be loaded on demand

// Track loading promises to prevent duplicate requests
let loadingPromises = {
  primary: null,
  secondary: null,
  aliases: null
};

// Essential logos for immediate use (most common technologies)
const essentialLogos = {
  'javascript': 'javascript.svg',
  'typescript': 'typescript.svg',
  'python': 'python.svg',
  'java': 'java.svg',
  'html5': 'html5.svg',
  'css3': 'css3.svg',
  'react': 'react.svg',
  'angular': 'angular.svg',
  'vue': 'vuejs.svg',
  'nodejs': 'nodejs.svg',
  'php': 'php.svg',
  'ruby': 'ruby.svg',
  'go': 'go.svg',
  'csharp': 'csharp.svg',
  'swift': 'swift.svg',
  'kotlin': 'kotlin.svg',
  'rust': 'rust.svg',
  'dart': 'dart.svg',
  'flutter': 'flutter.svg',
  'mongodb': 'mongodb.svg',
  'mysql': 'mysql.svg',
  'postgresql': 'postgresql.svg',
  'docker': 'docker.svg',
  'kubernetes': 'kubernetes.svg',
  'aws': 'amazonwebservices.svg',
  'azure': 'azure.svg',
  'gcp': 'googlecloud.svg',
  'git': 'git.svg',
  'github': 'github.svg',
  'vscode': 'vscode.svg'
};

/**
 * Try to load data from localStorage with fallback to default
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} - Parsed value or default
 */
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
};

/**
 * Save data to localStorage
 * @param {string} key - localStorage key
 * @param {any} value - Value to save
 */
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

/**
 * Check if cache is valid
 * @returns {boolean} - Whether cache is valid
 */
const isCacheValid = () => {
  return loadFromStorage(LS_CACHE_VERSION, null) === CACHE_VERSION;
};

/**
 * Load technology aliases from the tech_aliases.json file
 * @returns {Promise<Object>} - Promise resolving to the tech aliases mapping
 */
const loadTechAliases = async () => {
  // Return cached aliases if already loaded
  if (techAliasesMap && canonicalToAliases) {
    return { aliasMap: techAliasesMap, canonicalMap: canonicalToAliases };
  }
  
  // Use existing promise if already loading
  if (loadingPromises.aliases) {
    return loadingPromises.aliases;
  }
  
  // Check localStorage cache if cache version is valid
  if (isCacheValid()) {
    const cachedAliases = loadFromStorage(LS_TECH_ALIASES, null);
    if (cachedAliases && cachedAliases.aliasMap && cachedAliases.canonicalMap) {
      techAliasesMap = cachedAliases.aliasMap;
      canonicalToAliases = cachedAliases.canonicalMap;
      return { aliasMap: techAliasesMap, canonicalMap: canonicalToAliases };
    }
  }
  
  // Load from server
  loadingPromises.aliases = new Promise(async (resolve) => {
    try {
      const response = await axios.get('/tech_aliases.json');
      const data = response.data;
      
      // Create a mapping from aliases to canonical names
      const aliasMap = {};
      const canonicalMap = {};
      
      if (data && data.technologies) {
        data.technologies.forEach(tech => {
          const canonical = tech.canonical.toLowerCase();
          
          // Store each alias -> canonical mapping
          if (tech.aliases && tech.aliases.length) {
            tech.aliases.forEach(alias => {
              aliasMap[alias.toLowerCase()] = canonical;
            });
          }
          
          // Also map the canonical name to itself
          aliasMap[canonical] = canonical;
          
          // Store canonical -> aliases mapping
          canonicalMap[canonical] = tech.aliases ? 
            [...tech.aliases.map(a => a.toLowerCase()), canonical] : 
            [canonical];
        });
      }
      
      console.log(`Loaded ${Object.keys(aliasMap).length} technology aliases`);
      
      // Cache the results
      techAliasesMap = aliasMap;
      canonicalToAliases = canonicalMap;
      
      // Save to localStorage
      saveToStorage(LS_TECH_ALIASES, { 
        aliasMap, 
        canonicalMap,
        timestamp: Date.now()
      });
      
      resolve({ aliasMap, canonicalMap });
    } catch (error) {
      console.error('Failed to load tech aliases:', error);
      resolve({ aliasMap: {}, canonicalMap: {} });
    } finally {
      loadingPromises.aliases = null;
    }
  });
  
  return loadingPromises.aliases;
};

/**
 * Load logo mappings for a specific type (primary or secondary)
 * @param {string} type - 'primary' or 'secondary'
 * @returns {Promise<Object>} - Promise resolving to the logo mappings
 */
const loadLogoMappingsForType = async (type) => {
  // Return cached mappings if already loaded
  if (logoMappings[type]) {
    return logoMappings[type];
  }
  
  // Use existing promise if already loading
  if (loadingPromises[type]) {
    return loadingPromises[type];
  }
  
  // Check localStorage cache if cache version is valid
  if (isCacheValid()) {
    const cachedMappings = loadFromStorage(`codelyft_${type}_logos`, null);
    if (cachedMappings) {
      logoMappings[type] = cachedMappings;
      return cachedMappings;
    }
  }
  
  // Load from server
  loadingPromises[type] = new Promise(async (resolve) => {
    try {
      console.log(`Loading ${type} logo mappings from /logos/${type}-logos.json`);
      const response = await axios.get(`/logos/${type}-logos.json`);
      const mappings = response.data;
      console.log(`Successfully loaded ${type} logo mappings with ${Object.keys(mappings).length} entries`);
      
      // Cache the results
      logoMappings[type] = mappings;
      
      // Save to localStorage
      saveToStorage(`codelyft_${type}_logos`, mappings);
      
      resolve(mappings);
    } catch (error) {
      console.error(`Error loading ${type} logo mappings:`, error);
      resolve({});
    } finally {
      loadingPromises[type] = null;
    }
  });
  
  return loadingPromises[type];
};

/**
 * Normalize a technology name for logo matching
 * @param {string} name - The technology name to normalize
 * @returns {string} - Normalized name for logo matching
 */
export const normalizeTechName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    // Remove special characters
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .trim()
    .replace(/^-+|-+$/g, '');
};

/**
 * Common technology name aliases
 */
const techAliases = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'react.js': 'react',
  'reactjs': 'react',
  'node.js': 'nodejs',
  'vue.js': 'vuejs',
  'angular.js': 'angularjs',
  'next.js': 'nextjs',
  'nest.js': 'nestjs',
  'express.js': 'expressjs',
  'mongo': 'mongodb',
  'postgres': 'postgresql',
  'golang': 'go',
  'dotnet': 'dot-net',
  'csharp': 'c-sharp',
  'cpp': 'c-plus-plus',
  'c++': 'c-plus-plus',
  'aws': 'amazon-web-services',
  'azure': 'microsoft-azure',
  'gcp': 'google-cloud-platform',
  'k8s': 'kubernetes',
  'html': 'html5',
  'css': 'css3',
};

/**
 * Generate alternative name variations for better matching
 * @param {string} name - The normalized technology name
 * @returns {string[]} - Array of alternative variations to try
 */
export const generateAlternatives = (name) => {
  if (!name) return [];
  
  return [
    name,
    name.replace(/-/g, ''),          // Remove all hyphens
    name.replace(/-/g, '.'),         // Replace hyphens with dots
    name.split('-').pop(),           // Take last part
    name.split('-')[0],              // Take first part
  ];
};

/**
 * Find the best matching logo for a given technology name
 * This is a synchronous wrapper around the async findLogoAsync function
 * It returns a default logo immediately, but updates the UI when the real logo is found
 * 
 * @param {string} techName - The technology name to find a logo for
 * @returns {Object} - Logo information including path and type
 */
export const findLogo = (techName) => {
  // Return cached result if available
  if (logoResultCache[techName]) {
    return logoResultCache[techName];
  }
  
  // Check if this is an essential logo we can return immediately
  const normalized = normalizeTechName(techName);
  
  // Check built-in aliases
  const aliasedName = techAliases[normalized] || normalized;
  
  // Check essential logos
  if (essentialLogos[aliasedName]) {
    const result = {
      path: `/logos/primary/${essentialLogos[aliasedName]}`,
      isPrimary: true,
      isEssential: true,
      alt: `${techName} logo`,
      className: 'tech-logo'
    };
    
    // Store in cache
    logoResultCache[techName] = result;
    return result;
  }
  
  // Start with a default logo
  const defaultResult = {
    path: '/logos/default-tech-icon.svg',
    isDefault: true,
    alt: `${techName} logo`,
    className: 'tech-logo tech-logo-default',
  };
  
  // Store in cache
  logoResultCache[techName] = defaultResult;
  
  // Start async search
  findLogoAsync(techName).then(result => {
    if (result && !result.isDefault) {
      // Update the cache with the real result
      logoResultCache[techName] = {
        ...result,
        alt: `${techName} logo`,
        className: `tech-logo ${result.isSecondary ? 'tech-logo-secondary' : ''}`
      };
      
      // Trigger a UI update by dispatching a custom event
      window.dispatchEvent(new CustomEvent('logo-loaded', { 
        detail: { techName, logoInfo: logoResultCache[techName] }
      }));
    }
  });
  
  return defaultResult;
};

/**
 * Check if a technology name matches a canonical name or its aliases
 * @param {string} techName - The technology name to check
 * @returns {Promise<string|null>} - Promise resolving to the canonical name if found, null otherwise
 */
const findCanonicalName = async (techName) => {
  if (!techName) return null;
  
  // Ensure aliases are loaded
  if (!techAliasesMap) {
    await loadTechAliases();
  }
  
  const lowerTechName = techName.toLowerCase();
  
  // Direct match in aliases map
  if (techAliasesMap[lowerTechName]) {
    return techAliasesMap[lowerTechName];
  }
  
  // Check for substring matches
  for (const [alias, canonical] of Object.entries(techAliasesMap)) {
    if (lowerTechName.includes(alias) || alias.includes(lowerTechName)) {
      return canonical;
    }
  }
  
  return null;
};

/**
 * Asynchronously find the best matching logo for a given technology name
 * @param {string} techName - The technology name to find a logo for
 * @returns {Promise<Object>} - Promise resolving to logo information
 */
export const findLogoAsync = async (techName) => {
  if (!techName) {
    return {
      path: '/logos/default-tech-icon.svg',
      isDefault: true
    };
  }

  // 1. Normalize the input
  let normalized = normalizeTechName(techName);
  
  // 2. Check built-in aliases
  if (techAliases[normalized]) {
    normalized = techAliases[normalized];
  }
  
  // 3. Check essential logos first (fastest path)
  if (essentialLogos[normalized]) {
    return {
      path: `/logos/primary/${essentialLogos[normalized]}`,
      isPrimary: true,
      isEssential: true
    };
  }
  
  // 4. Try direct match in primary logos (load if needed)
  if (!logoMappings.primary) {
    await loadLogoMappingsForType('primary');
  }
  
  if (logoMappings.primary[normalized]) {
    return {
      path: `/logos/primary/${logoMappings.primary[normalized]}`,
      isPrimary: true
    };
  }
  
  // 5. Try alternative matches for primary logos
  const alternatives = generateAlternatives(normalized);
  
  for (const alt of alternatives) {
    // Check primary collection
    if (logoMappings.primary[alt]) {
      return {
        path: `/logos/primary/${logoMappings.primary[alt]}`,
        isPrimary: true,
        isAlternative: true
      };
    }
  }

  // 6. Check tech aliases from JSON
  const canonicalName = await findCanonicalName(techName);
  if (canonicalName) {
    normalized = normalizeTechName(canonicalName);
    
    // Try direct match with canonical name in primary logos
    if (logoMappings.primary[normalized]) {
      return {
        path: `/logos/primary/${logoMappings.primary[normalized]}`,
        isPrimary: true,
        isCanonical: true
      };
    }
  }

  // 7. Try aliases from canonical name
  if (canonicalName && canonicalToAliases[canonicalName]) {
    for (const alias of canonicalToAliases[canonicalName]) {
      const normalizedAlias = normalizeTechName(alias);
      
      // Check primary collection
      if (logoMappings.primary[normalizedAlias]) {
        return {
          path: `/logos/primary/${logoMappings.primary[normalizedAlias]}`,
          isPrimary: true,
          isAlternative: true
        };
      }
    }
  }
  
  // 8. Only load secondary logos if we haven't found a match in primary
  if (!logoMappings.secondary) {
    await loadLogoMappingsForType('secondary');
  }
  
  // 9. Try direct match in secondary logos
  if (logoMappings.secondary[normalized]) {
    return {
      path: `/logos/secondary/${logoMappings.secondary[normalized]}`,
      isSecondary: true
    };
  }
  
  // 10. Try alternative matches for secondary logos
  for (const alt of alternatives) {
    // Check secondary collection
    if (logoMappings.secondary[alt]) {
      return {
        path: `/logos/secondary/${logoMappings.secondary[alt]}`,
        isSecondary: true,
        isAlternative: true
      };
    }
  }
  
  // 11. Try canonical name in secondary logos
  if (canonicalName) {
    normalized = normalizeTechName(canonicalName);
    
    // Try direct match with canonical name in secondary logos
    if (logoMappings.secondary[normalized]) {
      return {
        path: `/logos/secondary/${logoMappings.secondary[normalized]}`,
        isSecondary: true,
        isCanonical: true
      };
    }
    
    // Try aliases from canonical name in secondary logos
    if (canonicalToAliases[canonicalName]) {
      for (const alias of canonicalToAliases[canonicalName]) {
        const normalizedAlias = normalizeTechName(alias);
        
        if (logoMappings.secondary[normalizedAlias]) {
          return {
            path: `/logos/secondary/${logoMappings.secondary[normalizedAlias]}`,
            isSecondary: true,
            isAlternative: true
          };
        }
      }
    }
  }
  
  // 12. Return default if no match
  return {
    path: '/logos/default-tech-icon.svg',
    isDefault: true
  };
};

/**
 * Initialize the logo service by loading essential data
 * Other data will be loaded on demand
 */
export const initLogoService = async () => {
  try {
    // Set cache version
    saveToStorage(LS_CACHE_VERSION, CACHE_VERSION);
    
    // Load tech aliases (small file, load immediately)
    await loadTechAliases();
    
    // Don't load logo mappings immediately - they'll be loaded on demand
    console.log('Logo service initialized with lazy loading');
    return true;
  } catch (error) {
    console.error('Failed to initialize logo service:', error);
    throw error;
  }
};

/**
 * Get a technology logo by name
 * @param {string} techName - The technology name
 * @returns {Object} - Logo information
 */
export const getTechLogo = (techName) => {
  return findLogo(techName);
};

/**
 * Preload logos for a list of technologies
 * Call this function for technologies that will be visible soon
 * @param {string[]} techNames - Array of technology names to preload
 */
export const preloadLogos = (techNames) => {
  if (!Array.isArray(techNames) || techNames.length === 0) return;
  
  // Use setTimeout to run in the next tick
  setTimeout(() => {
    techNames.forEach(tech => {
      if (tech) findLogo(tech);
    });
  }, 0);
};

/**
 * Warm up the logo cache by preloading primary logos
 * Call this when the user is idle or after critical content is loaded
 */
export const warmupLogoCache = () => {
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleWhenIdle = window.requestIdleCallback || 
    (cb => setTimeout(cb, 1000));
  
  scheduleWhenIdle(() => {
    console.log('Warming up logo cache in background...');
    loadLogoMappingsForType('primary');
  });
}; 