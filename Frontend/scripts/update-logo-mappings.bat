@echo off
echo Updating logo mappings...

rem Create necessary directories if they don't exist
if not exist "..\public\logos\primary" mkdir "..\public\logos\primary"
if not exist "..\public\logos\secondary" mkdir "..\public\logos\secondary"

rem Run the Node.js script to generate mappings
node generateLogoMappings.js

echo Logo mappings updated successfully! 