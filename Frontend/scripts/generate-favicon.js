const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Generating favicon.ico from SVG...');

// Check if ImageMagick is installed
exec('convert --version', (error) => {
  if (error) {
    console.error('Error: ImageMagick is not installed or not in PATH');
    console.log('Please install ImageMagick to generate favicon.ico:');
    console.log('- Windows: https://imagemagick.org/script/download.php');
    console.log('- macOS: brew install imagemagick');
    console.log('- Linux: sudo apt-get install imagemagick');
    return;
  }

  // Paths
  const svgPath = path.join(__dirname, '../public/favicon.svg');
  const icoPath = path.join(__dirname, '../public/favicon.ico');
  
  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error(`Error: SVG file not found at ${svgPath}`);
    return;
  }
  
  // Generate ICO file using ImageMagick
  const command = `convert -background none -density 256x256 ${svgPath} -define icon:auto-resize=16,32,48,64,128,256 ${icoPath}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating favicon.ico: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`ImageMagick stderr: ${stderr}`);
      return;
    }
    
    console.log(`Favicon.ico successfully generated at ${icoPath}`);
  });
}); 