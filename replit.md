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

## Recent Changes
- 2026-02-08: Edudibon Design System overhaul - Applied purple-blue gradient theme across entire app:
  - LoginPage: Gradient background, feature showcase grid, tab-based portal selection (Admin/Teacher/Student), gradient login button
  - TeachTinoDashboard: Welcome greeting, 8 individually colored stat card icons, circular module icons, cleaner bottom nav with shadow
  - StudentDashboard: Welcome greeting, 8 colored stat cards, circular module icons, all 9 dialogs + Razorpay preserved
  - Sidebar: Gradient accent bar at top, gradient icon backgrounds, indigo branding text
  - Layout header: Gradient "Ask Tino" button with blue shadow, gradient user avatar
  - Global CSS: Gradient primary buttons (blue-to-indigo), refined stat/module card styles with rounded-xl and shadow-md hover
- 2026-02-08: Dynamic school branding - Header shows school logo + full name, PWA installs with school's own logo as app icon, document title shows school name, favicon/apple-touch-icon dynamically replaced with school logo, removed hardcoded "Schooltino" branding from login page/dashboard/manifest/index.html, sidebar fallback uses both logo_url and logo fields
- 2026-02-08: Added EduNova-style branded module cards grid on all 3 dashboards (Schooltino=14 cards, TeachTino=6, StudyTino=6) with gradient top bars, colored icons, hover effects
- 2026-02-08: Fixed Analytics page not opening - added auth headers to all API calls in SchoolAnalytics.js, added missing backend endpoints (attendance/summary, fee-payment/summary, analytics/teachers, analytics/syllabus-progress, analytics/class-performance)
- 2026-02-08: Fixed School data not saving - updated SchoolCreate model to accept extra fields (signature_url, seal_url, watermark settings), added validator for empty string to None conversion on int fields (established_year, total_capacity), updated SchoolResponse with extra="allow", fixed frontend to clean payload before sending
- 2026-02-08: Full EduNova Corporate Clean theme applied across entire application:
  - Global CSS (index.css): EduNova theme variables, Tailwind overrides, consistent typography
  - UI Components (card, table, tabs, button): gray-200 borders, white backgrounds, rounded-xl
  - Sidebar.js: White theme, gray-200 borders, blue-200 active state borders
  - Layout.js: Clean header with notification bell, breadcrumbs, gray borders
  - DashboardPage.js: Professional stat cards with gray-200 borders, clean layout
  - TeachTinoDashboard.js: Full EduNova restyling (slate→gray, professional cards/buttons)
  - StudentDashboard.js: Full EduNova restyling (amber/orange→blue-gray professional)
  - App.js: Removed unused duplicate imports (StudyTinoLogin, AdmitCardManagement, AttendancePage)
  - Design: White bg, gray-50 content area, gray-200 borders, blue-500 accents, shadow-sm cards
- 2026-02-08: Critical fix - Root URL `/` was showing old LandingPage instead of redesigned LoginPage, redirected `/` to `/login`
- 2026-02-08: Cleaned up old files - removed LandingPage.js, MarketingPage.js, WhatsAppPamphlets.js, SchoolMarketingPage.js, PDFDownloadPage.js, sw.js, duplicate admit card/attendance/timetable pages
- 2026-02-08: Fixed PWA service worker caching - SW only registers in production, dev mode auto-clears caches
- 2026-02-08: Added server-side Cache-Control headers via craco.config.js and setupProxy.js
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
