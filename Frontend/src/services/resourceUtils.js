// Service to handle avatar URLs and other shared resources

// Base API URL
export const API_BASE_URL = 'http://localhost:5000';

// Avatar URLs
export const DEFAULT_AVATAR_URL = `${API_BASE_URL}/public/images/avatars/default-avatar.png`;

// Function to get avatar URL
export const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR_URL;
  
  // If the profile picture is already a full URL, return it
  if (profilePicture.startsWith('http')) {
    return profilePicture;
  }
  
  // If it's a relative path, prepend the API base URL
  if (profilePicture.startsWith('/')) {
    return `${API_BASE_URL}${profilePicture}`;
  }
  
  // Otherwise, assume it's a relative path without leading slash
  return `${API_BASE_URL}/${profilePicture}`;
}; 