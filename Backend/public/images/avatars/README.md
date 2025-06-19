# Avatar Images

This directory contains avatar images for users.

## Default Avatar

Please place a file named `default-avatar.png` in this directory. This image will be used as the default profile picture for users who haven't uploaded their own.

Recommended specifications for the default avatar:
- File format: PNG with transparency
- Dimensions: 200x200 pixels
- File size: Less than 50KB

You can use any generic avatar image or create a simple one with the application logo.

## Usage

The avatar images are served from the `/public/images/avatars/` path.

For example, the default avatar is accessible at:
```
http://localhost:5000/public/images/avatars/default-avatar.png
```

User-uploaded avatars will also be stored in this directory. 