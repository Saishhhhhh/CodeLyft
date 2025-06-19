# CodeLyft

CodeLyft is a platform for learning programming and technology through personalized roadmaps.

## Setup

### Backend Setup

1. Navigate to the Backend directory:
   ```
   cd Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the default avatar:
   ```
   # On Windows
   scripts\setup.bat
   
   # On Linux/Mac
   bash scripts/setup.sh
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the Frontend directory:
   ```
   cd Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Default Avatar

The application uses a default avatar for users who haven't uploaded their own profile picture. This is stored at:
```
Backend/public/images/avatars/default-avatar.png
```

The setup scripts will download this automatically, but if you need to manually add it, you can:
1. Create the directory: `Backend/public/images/avatars/`
2. Add a PNG file named `default-avatar.png` to this directory
3. Make sure the server is configured to serve static files from the public directory 