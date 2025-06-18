#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p ../public/logos/primary
mkdir -p ../public/logos/secondary

# Run the Node.js script to generate mappings
node generateLogoMappings.js

echo "Logo mappings updated successfully!" 