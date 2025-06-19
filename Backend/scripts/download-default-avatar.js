const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const avatarDir = path.join(__dirname, '..', 'public', 'images', 'avatars');

if (!fs.existsSync(avatarDir)) {
  console.log(`Creating directory: ${avatarDir}`);
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarPath = path.join(avatarDir, 'default-avatar.png');

// Simple default avatar URL - using a generic avatar from DiceBear
const avatarUrl = 'https://api.dicebear.com/7.x/avataaars/png?seed=CodeLyft&backgroundColor=b6e3f4';

console.log(`Downloading default avatar from: ${avatarUrl}`);
console.log(`Saving to: ${avatarPath}`);

// Download the file
const file = fs.createWriteStream(avatarPath);

https.get(avatarUrl, (response) => {
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Default avatar downloaded successfully!');
  });
}).on('error', (err) => {
  fs.unlink(avatarPath, () => {}); // Delete the file if there's an error
  console.error(`Error downloading avatar: ${err.message}`);
}); 