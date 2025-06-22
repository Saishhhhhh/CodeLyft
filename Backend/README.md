# CodeLyft Backend API

[![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=flat&logo=Node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000.svg?style=flat&logo=Express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=flat&logo=MongoDB&logoColor=white)](https://mongodb.com/)
[![Passport.js](https://img.shields.io/badge/Passport.js-34E27A.svg?style=flat&logo=Passport&logoColor=white)](http://www.passportjs.org/)
[![JWT](https://img.shields.io/badge/JWT-000000.svg?style=flat&logo=JSON-Web-Tokens&logoColor=white)](https://jwt.io/)

A robust Node.js/Express.js backend API for the CodeLyft learning platform, providing authentication, roadmap management, resource tracking, and user progress monitoring.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Models](#-database-models)
- [Authentication & Security](#-authentication--security)
- [Email Templates](#-email-templates)
- [Related Links](#-related-links)

## 🚀 Features

- **User Authentication & Authorization**
  - Local authentication with email/password
  - OAuth integration (Google, GitHub)
  - JWT token-based sessions
  - Email verification system
  - Password reset functionality

- **Roadmap Management**
  - Create and manage learning roadmaps
  - Track progress and completion
  - Custom roadmap creation
  - Public/private roadmap sharing

- **Resource Management**
  - Add and organize learning resources
  - Track resource completion
  - Resource categorization and filtering
  - Progress analytics

- **Note Taking System**
  - Create and manage study notes
  - Associate notes with roadmaps
  - Rich text support

## 🛠 Tech Stack

- **Runtime**: Node.js (≥18.0.0)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with JWT
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: bcryptjs, crypto-js
- **AI Integration**: Together AI

## 📁 Project Structure

```
Backend/
├── config/                 # Configuration files
│   ├── db.js              # MongoDB connection
│   ├── passport.js        # Passport authentication config
│   └── email.js           # Email service configuration
├── controllers/           # Route handlers
│   ├── authController.js  # Authentication logic
│   ├── roadmapController.js # Roadmap operations
│   ├── resourceController.js # Resource management
│   ├── noteController.js  # Note operations
│   ├── customRoadmapController.js # Custom roadmap logic
│   └── passwordController.js # Password operations
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   ├── authMiddleware.js # Additional auth helpers
│   └── validators.js     # Input validation
├── models/               # Database models
│   ├── User.js          # User schema
│   ├── Roadmap.js       # Roadmap schema
│   ├── Resource.js      # Resource schema
│   ├── Note.js          # Note schema
│   └── CustomRoadmap.js # Custom roadmap schema
├── routes/              # API routes
│   ├── authRoutes.js    # Authentication endpoints
│   ├── roadmapRoutes.js # Roadmap endpoints
│   ├── resourceRoutes.js # Resource endpoints
│   ├── noteRoutes.js    # Note endpoints
│   ├── customRoadmapRoutes.js # Custom roadmap endpoints
│   └── passwordRoutes.js # Password endpoints
├── utils/               # Utility functions
│   └── emailTemplates.js # Email template system
├── scripts/             # Utility scripts
│   ├── download-default-avatar.js # Avatar setup
│   └── updateTotalResources.js # Resource counter
├── public/              # Static files
│   └── images/
│       └── avatars/     # User avatars
├── server.js            # Main application file
├── package.json         # Dependencies and scripts
└── Procfile            # Deployment configuration
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | User registration |
| `POST` | `/login` | User login |
| `GET` | `/me` | Get current user |
| `GET` | `/logout` | User logout |
| `GET` | `/google` | Google OAuth login |
| `GET` | `/google/callback` | Google OAuth callback |
| `GET` | `/github` | GitHub OAuth login |
| `GET` | `/github/callback` | GitHub OAuth callback |
| `GET` | `/check` | Check authentication status |

### Password Management (`/api/password`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/forgot-password` | Request password reset |
| `POST` | `/reset-password` | Reset password with OTP |
| `POST` | `/verify-otp` | Verify OTP for password reset |

### Roadmaps (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/roadmaps` | Get user roadmaps |
| `POST` | `/roadmaps` | Create new roadmap |
| `GET` | `/roadmaps/:id` | Get specific roadmap |
| `PUT` | `/roadmaps/:id` | Update roadmap |
| `DELETE` | `/roadmaps/:id` | Delete roadmap |
| `POST` | `/roadmaps/:id/topics/:topicId/complete` | Mark topic as complete |

### Custom Roadmaps (`/api/custom-roadmaps`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get custom roadmaps |
| `POST` | `/` | Create custom roadmap |
| `GET` | `/:id` | Get specific custom roadmap |
| `PUT` | `/:id` | Update custom roadmap |
| `DELETE` | `/:id` | Delete custom roadmap |

### Resources (`/api/resources`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get user resources |
| `POST` | `/` | Add new resource |
| `GET` | `/:id` | Get specific resource |
| `PUT` | `/:id` | Update resource |
| `DELETE` | `/:id` | Delete resource |
| `POST` | `/complete/:id` | Mark resource as complete |

### Notes (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes` | Get user notes |
| `POST` | `/notes` | Create new note |
| `GET` | `/notes/:id` | Get specific note |
| `PUT` | `/notes/:id` | Update note |
| `DELETE` | `/notes/:id` | Delete note |

## 🗄 Database Models

### User Model
- **Fields**: name, email, password, profilePicture, role, googleId, githubId, isEmailVerified
- **Features**: Password hashing, OTP generation, email verification

### Roadmap Model
- **Fields**: userId, title, description, category, difficulty, isPublic, isCustom, completionPercentage
- **Sub-schemas**: Topics, AdvancedTopics, Projects, Resources
- **Features**: Progress tracking, completion percentage calculation

### Resource Model
- **Fields**: title, url, type, description, thumbnailUrl, source, duration, isRequired
- **Types**: video, article, course, book, documentation, other

### Note Model
- **Fields**: userId, roadmapId, title, content, tags
- **Features**: Rich text support, tagging system

### CustomRoadmap Model
- **Fields**: userId, title, description, topics, isPublic
- **Features**: User-generated learning paths

## 🔐 Authentication & Security

### Authentication Methods
1. **Local Authentication**: Email/password with bcrypt hashing
2. **OAuth Providers**: Google and GitHub integration
3. **Session Management**: Express-session with MongoDB store
4. **JWT Tokens**: Stateless authentication for API access

### Security Features
- Password hashing with bcryptjs
- CORS configuration for cross-origin requests
- Input validation with express-validator
- Rate limiting and request sanitization
- Secure session configuration

### Email Verification
- OTP-based email verification
- Password reset functionality
- HTML email templates with responsive design

## 🎨 Email Templates

The system includes comprehensive email templates for:
- Welcome emails
- Email verification
- Password reset
- Account updates
- Progress notifications

Templates are located in `utils/emailTemplates.js` and support HTML formatting.

## 🔗 Related Links

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

**Built with ❤️ for the CodeLyft learning platform** 