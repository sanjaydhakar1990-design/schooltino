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

## Key Features (NextOS Full Suite Parity)
- Student admission and management
- Admission CRM with lead tracking, follow-ups, campaign analytics
- Marketing & Campaign Management with landing pages, SEO tools, social media
- Staff/employee management with integrated permissions
- Fee management and payments (Razorpay integration)
- Attendance tracking (students + AI staff geo-facial)
- AI-powered paper generation
- CCTV management
- SMS & WhatsApp communication
- Multi-language support (i18n)
- PWA support
- Transport management with NFC & GPS tracking
- Timetable management
- Visit Management with OTP approval flow
- Biometric integration
- Multi-Branch Management (unified dashboard)
- Tally Integration (accounting sync)
- School Feed (social activity feed)
- Student Wallet (digital cashless)
- School e-Store (online store)
- Exam & Report Card Management (6 tabs: Marks, Results, Reports, Exam Structure, Design, Grading)
- Homework & Assignment Management (assign, track, grade, analytics)
- Digital Library & EdTech Tools (books, e-books, interactive labs, content library)
- Live Classes (schedule, ongoing, recordings, attendance)
- Course Management (courses, modules, content, enrollment)
- Credit System (credits overview, usage tracking, subscription plans, recharge)
- Inventory Management (stock, issue/return, purchase orders, reports)
- Hostel Management (rooms, students, mess menu, fees)
- Integrated Communication (messages, event triggers, DLT templates, surveys, analytics)
- Unified Mobile App showcase (6 roles)
- Integrations Hub (20+ integrations across 6 categories)

## Known Limitations
- `emergentintegrations` is a private package - stub implementations provided in `backend/emergentintegrations/` for LlmChat, OpenAIChat, SpeechToText, TextToSpeech classes
- AI voice/avatar features are limited without the real package
- Core school management features work fully

## Design Philosophy
- NextOS K-12 Suite inspired design with tabbed feature navigation
- Blue/purple gradient hero sections and sidebar across all portals
- 10-tab feature showcase: Enrollment, Admissions, Attendance, Finance, Website, Dashboard, Test Builder, Assignment, EdTech, Content
- "Secure & Integrated, User-friendly, Cloud-first, AI-enabled" circular infographic
- School branding bar in Layout header: logo, name, address, contact, registration number, board type
- Dark sidebar with glass-effect search and translucent styles
- Three connected portals: Schooltino (Admin), TeachTino (Teachers), StudyTino (Students/Parents)
- Same school data shared across all portals via AuthContext schoolData
- All core functionality preserved plus new modules

## Recent Changes
- 2026-02-09: UI cleanup & profile enhancement v7:
  - Removed duplicate profile: Profile now only accessible from sidebar top (clickable NavLink), removed from sidebar bottom and header top-right
  - School name made bigger in header (text-xl)
  - EmployeeManagementPage: Added page-level tabs (All Staff, Permissions, Quick Actions), full staff profile modal with printable layout, clickable names, eye icon view, permissions management directly in profile
  - StudentsPage: Added comprehensive student profile modal with all data sections, clickable names/photos, View Profile in dropdown, larger photo display (w-14), print profile feature
  - Notification bell already works across all admin pages via Layout component
- 2026-02-09: NextOS full feature parity v6 (comprehensive overhaul):
  - 9 new feature pages: CreditSystemPage, AdmissionCRMPage, HomeworkPage, DigitalLibraryPage, InventoryPage, HostelPage, LiveClassesPage, CourseManagementPage, MarketingCampaignPage
  - ExamReportCard enhanced from 3 to 6 tabs: Marks Entry, Results, Reports, Exam Hierarchy, Design, Grading
  - Sidebar reorganized from 7 to 11 groups: Main, Admission & CRM, Academic, Learning & Content, HR & Staff, Finance, Communication, AI & Tools, Infrastructure, Platform, Settings
  - Dashboard revamped with 9 module groups covering all NextOS suite features
  - App.js updated with 12 new routes, fixed duplicate /student-dashboard route
  - All pages follow consistent patterns: gradient headers, stats rows, tabbed workflows, dialog modals, toast notifications
- 2026-02-09: NextOS full feature parity v5:
  - Removed duplicate Permission Manager from sidebar (permissions now managed inside Staff page only)
  - Permission Manager route now redirects to Employee Management
  - New page: MultiBranchPage - unified dashboard for multi-branch management with branch CRUD, stats, cross-campus monitoring
  - New page: AIStaffAttendancePage - AI-powered staff attendance with geo-facial recognition, camera capture, GPS verification
  - New page: TallyIntegrationPage - Tally accounting sync with connection settings, module status, auto-sync
  - New backend: routes/branches.py - CRUD API for multi-branch management
  - New backend: routes/staff_attendance.py - Staff attendance marking/reporting with geo-facial data
  - TransportPage: Added NFC & GPS Tracking tab with NFC tap attendance, GPS device setup, boarding log
  - FrontOfficePage: Renamed to Visit Management, added OTP verification flow for visitor approval
  - Sidebar: SMS renamed to "SMS & WhatsApp", Visitor Pass renamed to "Visit Management", new entries for AI Attendance, Multi-Branch, Tally Integration
  - Dashboard: Module groups updated with new features (Tally, AI Attendance, Multi-Branch, Visit Mgmt), Permissions removed
- 2026-02-09: Global school branding & watermark v4:
  - SchoolLogoWatermark: Refactored to use AuthContext directly (no extra API calls), added GlobalWatermark component
  - Layout.js: GlobalWatermark added to main content area - school logo appears as watermark on all admin pages
  - StudentDashboard: Added GlobalWatermark, school branding gradient bar (name, phone, email, board type), school logo in header
  - UnifiedPortal (TeachTino): Added GlobalWatermark, school branding gradient bar with full details (logo, name, address, phone, email, reg number, board type)
  - All three portals now show consistent school branding with logo, name, and contact info in headers
- 2026-02-09: K-12 Suite redesign v3:
  - LoginPage: Tabbed feature navigation (10 tabs) matching NextOS K-12 Suite, K12Illustration component per tab, hero tagline "The Launchpad of 21st-Century Skills", circular infographic with 4 pillars, portal links in nav and footer
  - Layout header: School branding gradient bar with logo, name, full address, phone, email, registration number, board type badge
  - AuthContext: studentLogin now fetches schoolData for StudyTino portal
  - TeachTino & StudyTino: Unified blue/purple gradient theme, back-to-Schooltino links
  - Footer: Product Suite section with all 3 portal links, updated module descriptions
- 2026-02-09: NextOS exact-match redesign v2:
  - DashboardPage: Systematic module groups (Academic, Administration, Communication & Tools, AI & Infrastructure), stat cards with trend arrows, quick actions in card section, setup wizard CTA banner
  - craco.config.js: Re-enabled hot reload with WebSocket config for Replit iframe preview fix
  - Sidebar: Dark blue gradient, school logo, glass-effect search, translucent nav items, gradient user avatar
  - Layout header: Modern with search button, notification bell with blue dot, gradient avatar
  - index.css: Blue/purple gradient theme, gradient utility classes, glass-card, feature-card, modern shadows
  - New pages: SchoolFeedPage (social feed), StudentWalletPage (digital wallet), EStorePage (school e-store)
  - New routes: /app/school-feed, /app/student-wallet, /app/e-store, /app/visitor-pass
  - Preserved: Dynamic favicon/title branding, PWA support, all existing routes and functionality
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
