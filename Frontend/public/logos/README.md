# Technology Logo System

This directory contains SVG logos for various technologies used in the roadmap system.

## Directory Structure

- `/primary` - Contains 473 primary colored SVG logos
- `/secondary` - Contains 3313 secondary (black) SVG logos
- `primary-logos.json` - Mapping of technology names to primary logo files
- `secondary-logos.json` - Mapping of technology names to secondary logo files
- `default-tech-icon.svg` - Default fallback icon for technologies without logos

## How It Works

1. The system first tries to match a technology name with a logo in the primary collection
2. If not found, it tries the secondary collection
3. It applies various normalization and matching strategies:
   - Exact name matching
   - Alias matching (e.g., "js" -> "javascript")
   - Alternative name variations (e.g., with/without hyphens)
   - Substring matching for common technologies

## Usage

To display a technology logo in a component:

```jsx
import TechLogo from '../components/roadmap/common/TechLogo';

// Basic usage
<TechLogo techName="React" />

// With size options (xs, sm, md, lg, xl, 2xl)
<TechLogo techName="JavaScript" size="lg" />

// With technology name displayed
<TechLogo techName="Python" showName={true} namePosition="right" />

// With custom color filter for secondary logos
<TechLogo 
  techName="MongoDB" 
  colorFilter="invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)" 
/>
```

## Updating Logo Mappings

After adding or removing SVG files, run the mapping generation script:

```bash
# From the scripts directory
./update-logo-mappings.sh  # Linux/Mac
update-logo-mappings.bat   # Windows
```

This will scan the logo directories and update the JSON mapping files.

## Adding New Logos

1. Add the SVG file to the appropriate directory:
   - Colored logos in `/primary`
   - Black logos in `/secondary`
2. Name the file using the normalized technology name (lowercase, hyphens for spaces)
3. Run the mapping generation script

## Technical Implementation

The logo system is implemented with these components:

- `logoMappings.js` - Handles checking if logos exist and loading mappings
- `logoService.js` - Provides functions for finding and matching logos
- `TechLogo.jsx` - React component for displaying logos with fallbacks 