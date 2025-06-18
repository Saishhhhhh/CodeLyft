/**
 * Script to generate JSON mappings from SVG files in the logos directories
 * Run this script with Node.js to update the logo mappings
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to logo directories
const primaryDir = path.join(__dirname, '../public/logos/primary');
const secondaryDir = path.join(__dirname, '../public/logos/secondary');
const outputPrimaryJSON = path.join(__dirname, '../public/logos/primary-logos.json');
const outputSecondaryJSON = path.join(__dirname, '../public/logos/secondary-logos.json');

/**
 * Generate a mapping from directory of SVG files
 * @param {string} dir - Directory path
 * @returns {Object} - Mapping of technology names to SVG filenames
 */
function generateMappingFromDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    return {};
  }

  const mapping = {};
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (file.endsWith('.svg')) {
      // Use filename without extension as the key
      const techName = file.replace('.svg', '');
      mapping[techName] = file;
    }
  });

  return mapping;
}

/**
 * Write mapping to JSON file
 * @param {Object} mapping - Mapping object
 * @param {string} outputFile - Output file path
 */
function writeMapping(mapping, outputFile) {
  const json = JSON.stringify(mapping, null, 2);
  fs.writeFileSync(outputFile, json);
  console.log(`Wrote ${Object.keys(mapping).length} entries to ${outputFile}`);
}

// Generate and write primary mappings
console.log('Generating primary logo mappings...');
const primaryMapping = generateMappingFromDir(primaryDir);
writeMapping(primaryMapping, outputPrimaryJSON);

// Generate and write secondary mappings
console.log('Generating secondary logo mappings...');
const secondaryMapping = generateMappingFromDir(secondaryDir);
writeMapping(secondaryMapping, outputSecondaryJSON);

console.log('Done!'); 