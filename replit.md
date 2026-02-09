# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive school management platform with AI-powered features, CCTV integration, and mobile apps. It provides complete automation for managing students, staff, fees, and attendance. Source: https://github.com/sanjaydhakar1990-design/schooltino

## Project Architecture

### Frontend (React)
- **Location**: `/frontend`
- **Framework**: React 19 with Create React App + CRACO
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui patterns
- **Port**: 5000 (development)
- **Webpack alias**: `@` maps to `src/`

### Backend (Python FastAPI)
- **Location**: `/backend`
- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT-based
- **Port**: 8000

### API Proxy
- Frontend dev server proxies `/api` requests to `http://localhost:8000`
- Configured via `frontend/src/setupProxy.js`

## Environment Variables

### Required Secrets
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name

### Frontend Environment
- `REACT_APP_BACKEND_URL` - Backend API URL (set to empty for proxy-based same-origin requests)
- `GENERATE_SOURCEMAP` - Set to false to disable source maps (set in workflow command)

## Running the Application

### Frontend (port 5000)
```bash
cd frontend && PORT=5000 HOST=0.0.0.0 GENERATE_SOURCEMAP=false BROWSER=none npm start
```

### Backend (port 8000)
```bash
cd backend && uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

## Key Features
- Student admission and management
- Staff/employee management
- Fee management and payments (Razorpay integration)
- Attendance tracking
- AI-powered paper generation
- CCTV management
- SMS center
- Multi-language support (i18n)
- PWA support
- Transport management
- Timetable management
- Visitor gate pass
- Biometric integration

## Known Limitations
- `emergentintegrations` is a private package - stub implementations provided in `backend/emergentintegrations/` for LlmChat, OpenAIChat, SpeechToText, TextToSpeech classes
- AI voice/avatar features are limited without the real package
- Core school management features work fully

## Design Philosophy
- "Bilkul simple" (completely simple) minimal design
- No gradients, no colored icons, no watermarks, no marketing panels
- White backgrounds, gray-200 borders, gray icons, dark buttons
- Clean flat navigation, minimal header (breadcrumb + bell + avatar)
- All core functionality preserved; visual clutter removed

## Recent Changes
- 2026-02-09: Complete minimal UI redesign ("bilkul simple"):
  - LoginPage: Centered card with clean tabs, no gradients or left marketing panel
  - Sidebar: Flat navigation list with gray icons, no descriptions or colored backgrounds
  - Layout header: Minimal topbar with breadcrumb, bell, avatar only (removed search, language toggle, Ask Tino button, watermark)
  - DashboardPage: Clean stat cards, pill-shaped quick actions, flat module grid
  - index.css: Removed all gradient styles, simplified to neutral gray palette
  - Preserved: Dynamic favicon/title branding, PWA support, all routes and functionality
  - Removed 14 unused files (TinoAvatar, TinoFace, SchoolWatermark, duplicate pages, etc.)
  - Fixed WebSocket hot-reload blocking Replit iframe (disabled in craco.config.js)
- 2026-02-07: Fresh clone from GitHub, fixed all dependency issues
- 2026-02-07: Simplified craco.config.js for Replit compatibility (removed visual-edits/health-check plugins)
- 2026-02-07: Added setupProxy.js for frontend-to-backend API proxying
- 2026-02-07: Fixed ajv dependency conflict (installed ajv@8.17.1)
- 2026-02-07: Restored original package.json with all Radix UI, recharts, react-razorpay dependencies
- 2026-01-29: Fixed hardcoded /app/backend paths to relative paths
- 2026-01-28: Initial Replit environment setup

## Project Structure
```
/
├── backend/                    # FastAPI Python backend
│   ├── routes/                 # API route modules
│   ├── services/               # Business logic services
│   ├── core/                   # Core utilities (auth, database)
│   ├── emergentintegrations/   # Stub for private AI package
│   └── server.py               # Main FastAPI application
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React contexts (AuthContext)
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utility functions
│   │   └── setupProxy.js       # API proxy config
│   ├── plugins/                # Webpack plugins (visual-edits, health-check)
│   ├── craco.config.js         # CRACO webpack configuration
│   └── public/                 # Static assets
└── replit.md                   # Project documentation
```
