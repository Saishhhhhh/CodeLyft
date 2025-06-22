# CodeLyft Frontend

[![React](https://img.shields.io/badge/React-20232A.svg?style=flat&logo=React&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245.svg?style=flat&logo=React-Router&logoColor=white)](https://reactrouter.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF.svg?style=flat&logo=Framer&logoColor=white)](https://www.framer.com/motion/)

A modern, responsive React application for the CodeLyft learning platform, featuring interactive roadmaps, AI-powered content discovery, and comprehensive user management.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages & Routes](#-pages--routes)
- [Components](#-components)
- [Services](#-services)
- [Context & State Management](#-context--state-management)
- [Hooks](#-hooks)
- [Assets & Resources](#-assets--resources)
- [Key Features](#-key-features)
- [Video Scoring System](#-video-scoring-system)
- [Related Links](#-related-links)

## 🚀 Features

- **Interactive Learning Roadmaps**
  - Dynamic roadmap visualization with progress tracking
  - Custom roadmap creation and management
  - AI-powered content recommendations
  - Progress analytics and statistics

- **User Authentication & Management**
  - Secure login/signup with OAuth support
  - Email verification and password reset
  - User profile management
  - Session management with JWT

- **Resource Management**
  - YouTube video integration and processing
  - Resource categorization and filtering
  - Personal resource library
  - Progress tracking for individual resources

- **AI-Powered Features**
  - Intelligent chatbot for learning assistance
  - AI-driven content relevance checking
  - Smart technology matching and aliases
  - Automated resource scoring and recommendations

- **Advanced UI/UX**
  - Responsive design with Tailwind CSS
  - Smooth animations with Framer Motion
  - Interactive 3D elements with Three.js
  - Real-time progress updates and notifications

- **Content Discovery**
  - Technology logo mapping system
  - YouTube playlist analysis and scoring
  - Custom resource input and management
  - Export and sharing capabilities

## 🛠 Tech Stack

- **Framework**: React 19.1.0 with Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.6
- **Routing**: React Router DOM 6.23.0
- **Animations**: Framer Motion 12.18.1, GSAP 3.13.0
- **HTTP Client**: Axios 1.9.0
- **UI Components**: React Icons 5.5.0, React Hot Toast 2.5.2
- **AI Integration**: Together AI 0.16.0
- **Data Visualization**: D3.js 7.9.0
- **Code Highlighting**: React Syntax Highlighter 15.6.1

## 📁 Project Structure

```
Frontend/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── chatbot/       # AI chatbot components
│   │   ├── common/        # Shared components
│   │   ├── home/          # Homepage components
│   │   └── roadmap/       # Roadmap-specific components
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   └── roadmap/       # Roadmap pages
│   ├── services/          # API and external services
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── layouts/           # Layout components
│   ├── data/              # Static data and constants
│   ├── assets/            # Static assets
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Application entry point
├── public/                # Public assets
│   ├── logos/             # Technology logos
│   │   ├── primary/       # Primary technology logos
│   │   ├── default-tech-icon.svg  # Default technology icon
│   │   └── primary-logos.json  # Logo mapping data
│   │   └── icons/             # Application icons
│   │   └── data/              # Static JSON data
│   ├── favicon.html       # Dynamic favicon
│   └── tech_aliases.json  # Technology aliases data
│   └── sample_roadmap.json  # Sample roadmap data
├── scripts/               # Build and utility scripts
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── vercel.json           # Deployment configuration
```

## 📄 Pages & Routes

### Authentication Pages
- **`LoginPage.jsx`** - User login with OAuth support
- **`SignupPage.jsx`** - User registration
- **`ForgotPasswordPage.jsx`** - Password recovery
- **`ResetPasswordPage.jsx`** - Password reset
- **`EmailVerificationPage.jsx`** - Email verification

### Main Application Pages
- **`HomePage.jsx`** - Landing page with features showcase
- **`Dashboard.jsx`** - User dashboard with overview
- **`ProfilePage.jsx`** - User profile management
- **`AboutPage.jsx`** - About page with project information

### Roadmap Pages
- **`RoadmapQuestionsPage.jsx`** - Roadmap generation questions
- **`RoadmapResultPage.jsx`** - Generated roadmap display
- **`RoadmapProgressPage.jsx`** - Progress tracking interface
- **`RoadmapTestPage.jsx`** - Roadmap testing interface
- **`RoadmapDetailPage.jsx`** - Individual roadmap details
- **`MyRoadmapsPage.jsx`** - User's roadmap collection
- **`CustomRoadmapPage.jsx`** - Custom roadmap creation

### Utility Pages
- **`LoadingTestPage.jsx`** - Loading state testing
- **`NotFoundPage.jsx`** - 404 error page

## 🧩 Components

### Core Components
- **`Navbar.jsx`** - Main navigation bar
- **`HeroAnimation.jsx`** - Animated hero section
- **`GlobalResourceModal.jsx`** - Global resource management modal
- **`RoadmapCustomDisplay.jsx`** - Custom roadmap visualization

### Authentication Components
- **`AuthLayout.jsx`** - Authentication page layout
- **`AuthModal.jsx`** - Authentication modal
- **`FormInput.jsx`** - Reusable form input component

### Roadmap Components
- **`RoadmapVisualizer.jsx`** - Main roadmap visualization
- **`LearningPath.jsx`** - Learning path display
- **`PracticeProjects.jsx`** - Project recommendations
- **`AdvancedChallenges.jsx`** - Advanced learning challenges
- **`RoadmapStats.jsx`** - Progress statistics
- **`RoadmapActions.jsx`** - Roadmap action buttons
- **`RoadmapFilters.jsx`** - Filtering and search
- **`RoadmapFooter.jsx`** - Roadmap footer information

### Resource Management
- **`UserResourceManager.jsx`** - Main resource management interface
- **`UserResourceInput.jsx`** - Resource input forms
- **`UserResourceDisplay.jsx`** - Resource display components

### Chatbot Components
- **`Chatbot.jsx`** - Main chatbot interface
- **`ChatbotContainer.jsx`** - Chatbot container
- **`ChatbotWrapper.jsx`** - Chatbot wrapper component

### Common Components
- **`LoadingAnimation.jsx`** - Loading states and animations
- **`VideoCard.jsx`** - Video resource cards
- **`TechLogo.jsx`** - Technology logo display
- **`Pagination.jsx`** - Pagination controls

## 🔧 Services

### API Services
- **`authService.js`** - Authentication API calls
- **`roadmapService.js`** - Roadmap management
- **`customRoadmapService.js`** - Custom roadmap operations
- **`userResourceService.js`** - User resource management
- **`userStatsService.js`** - User statistics and analytics

### External Services
- **`youtubeService.js`** - YouTube API integration
- **`youtubeResourceService.js`** - YouTube resource processing
- **`groqService.js`** - Groq AI integration
- **`togetherService.js`** - Together AI integration

### Utility Services
- **`logoService.js`** - Technology logo management
- **`logoMappings.js`** - Logo mapping utilities
- **`resourceCache.js`** - Resource caching system
- **`resourceUtils.js`** - Resource utility functions
- **`exportService.js`** - Data export functionality

## 🎯 Context & State Management

### Context Providers
- **`AuthContext.jsx`** - Authentication state management
- **`ThemeContext.jsx`** - Theme and dark mode management
- **`ChatbotContext.jsx`** - Chatbot state and interactions
- **`CustomRoadmapContext.jsx`** - Custom roadmap state
- **`ResourceModalContext.jsx`** - Resource modal state

### State Management Features
- Global authentication state
- Theme switching (light/dark mode)
- Chatbot conversation history
- Custom roadmap creation state
- Resource modal management
- User preferences and settings

## 🪝 Hooks

### Custom Hooks
- **`useAuth.js`** - Authentication hook
- **`useResourceManagement.js`** - Resource management
- **`useRoadmapData.js`** - Roadmap data handling
- **`useVideoProcessing.js`** - Video processing utilities
- **`useChatbotContext.js`** - Chatbot context access

### Animation Hooks
- **`useScrollAnimation.js`** - Scroll-based animations
- **`useSmoothScrollAnimation.js`** - Smooth scroll animations
- **`useBasicScrollAnimation.js`** - Basic scroll animations
- **`useSimpleAnimation.js`** - Simple animation utilities

## 🎨 Assets & Resources

### Public Assets
- **`public/logos/`** - Technology logos and icons
  - `primary/` - Primary technology logos
  - `default-tech-icon.svg` - Default technology icon
  - `primary-logos.json` - Logo mapping data
- **`public/icons/`** - Application icons
- **`public/favicon.html`** - Dynamic favicon
- **`public/tech_aliases.json`** - Technology aliases data
- **`public/sample_roadmap.json`** - Sample roadmap data

### Static Data
- Technology logo mappings
- Technology aliases and synonyms
- Sample roadmap templates
- Default configuration data

## 🚀 Key Features

### Interactive Roadmaps
- Dynamic visualization with D3.js
- Progress tracking and analytics
- Custom roadmap creation
- AI-powered content recommendations

### AI Integration
- Intelligent chatbot assistance
- Content relevance checking
- Technology matching algorithms
- Automated resource scoring

### Modern UI/UX
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Interactive 3D elements
- Real-time updates and notifications

### Resource Management
- YouTube video integration
- Personal resource library
- Progress tracking
- Export and sharing capabilities

## 🎯 Video Scoring System

Our AI-powered system evaluates YouTube videos and playlists using comprehensive scoring algorithms:

### **Video Scoring (0-6.0 points)**

#### **Critical Filter: Duration**
- **Minimum Requirement**: 40 minutes (automatic rejection if shorter)
- **Duration Bonuses**: 
  - 3+ hours: +0.5 points
  - 1.5+ hours: +0.3 points
- **Oneshot/Complete Course Bonus**: +0.7 points

#### **Engagement & Popularity (6.0 points total)**
- **Views** (3.0 pts max): 500K+ = 3.0, 250K+ = 2.0, 100K+ = 1.0
- **Likes** (1.5 pts max): 5K+ = 1.5, 2K+ = 1.0, 1K+ = 0.5
- **Like-to-View Ratio** (0.5 pts max): 4%+ = 0.5, 2%+ = 0.25
- **Recency** (1.0 pts max): 2024+ = 1.0, 2022+ = 0.5

#### **Video Quality Thresholds**
- **Exceptional**: ≥4.8 points (normalized to ≥8.0/10)
- **Good**: ≥4.0 points (normalized to ≥6.7/10)
- **Average**: ≥3.0 points (normalized to ≥5.0/10)
- **Rejected**: <3.0 points (normalized to <5.0/10)

### **Playlist Scoring (0-10.0 points)**

#### **Critical Filters**
- **Title Relevance**: Must contain technology name
- **Video Count**: Minimum 5 videos
- **Total Duration**: Minimum 90 minutes

#### **Scoring Criteria**
- **Duration Ratio** (2.0 pts) - Optimal learning time per video
- **Total Views** (2.0 pts) - Overall playlist popularity
- **Video Count** (1.8 pts) - Comprehensive content coverage
- **Average Views** (1.5 pts) - Individual video engagement
- **First Video Views** (1.2 pts) - Initial content quality
- **Like Ratio** (1.0 pts) - User satisfaction (≥2%)
- **Recency** (0.5 pts) - Content freshness

#### **Playlist Quality Thresholds**
- **Exceptional**: ≥8.0 points
- **Good**: ≥7.0 points
- **Average**: ≥5.0 points
- **Rejected**: <5.0 points

Only content scoring above the minimum thresholds is recommended to ensure high-quality learning resources.

## 🔗 Related Links

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

**Built with ❤️ for the CodeLyft learning platform**
