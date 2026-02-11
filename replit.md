# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive, AI-powered school management platform inspired by NextOS K-12 Suite. It features a clean, simplified architecture with ~25 core modules across three portals (SchoolTino Admin, TeachTino Teachers, StudyTino Students/Parents). The platform covers student/staff management, finance, attendance, communication, and AI tools.

## Recent Changes (Feb 2026)
- **ErrorBoundary Added**: React ErrorBoundary in App.js catches runtime crashes and shows friendly error page instead of blank white screen. Prevents "blank page" issue.
- **ID Card System Enhanced**: IDCardViewer rewritten with 5 templates (Classic, Modern, Elegant, Minimal, Vertical), 8 color themes, field visibility controls (father/mother name, DOB, blood group, Samgra ID, etc.), settings panel with template/color/field toggles, persistent settings via localStorage ('id_card_settings'), proper print support for each template.
- **Student Photo Upload Fixed**: Camera icon overlay on split-view student profile photo with hover effect, blue badge indicator, click-to-upload functionality. Uses splitPhotoInputRef, handleProfilePhotoUpload function.
- **index.js Import Fix**: Changed `@/App` to `./App` and `@/index.css` to `./index.css` for safer imports (craco alias also exists).
- **Module Management Enhanced**: Added Admissions CRM, Multi-Branch, and Front Office to MODULE_LIST with enable/disable toggles. Added moduleKey to sidebar entries so all modules can be hidden/shown via Settings.
- **StudyTino Removed from Module Management**: Students should never access admin modules. Removed StudyTino column from module toggle table. Students use separate StudentDashboard with fixed modules.
- **Teacher Approval System (TeachTino)**: Teacher actions (notices, etc.) now go through admin approval. Teachers submit requests → Admin gets notifications → Approve/Reject. Backend endpoints: POST /api/teacher/requests, GET /api/admin/teacher-requests, PUT /api/admin/teacher-requests/{id}. Teacher sees request status in "My Requests" section. Admin sees pending requests on Dashboard with approve/reject buttons.
- **Admin Notification Badge**: Notification bell now shows count of pending teacher requests + regular notifications
- **Mobile Dashboard Fix**: Fixed Layout.js (h-screen/100dvh, overflow-hidden, flex-shrink-0 headers, iOS touch scrolling, safe-area-inset), Sidebar.js (100dvh, touch scrolling, safe-area), login redirects (/app/dashboard, /portal), SmartRedirect paths
- **Landing Page**: New "/" route with app details, features, modules grid, portals info, AI showcase, and CTA buttons
- **School Registration**: "/register" page with minimal form (school name, board, city, state, director details), auto-generated secure password (10 chars with upper/lower/digits/special), credentials shown after registration with copy buttons
- **Backend register-school API**: POST /api/auth/register-school - creates school + director with auto-generated password, returns credentials + token
- **Login page updated**: Added "New school? Register Here" link below login form
- **Routing updated**: "/" → LandingPage, "/login" → LoginPage, "/register" → RegisterPage
- **MAJOR REBUILD (Option B)**: Fresh start rebuild to match NextOS K-12 style
- Reduced from 85+ pages to ~30 clean pages
- Simplified sidebar from 40+ items to 20 flat navigation items (no groups)
- Removed: Prayer System, Hostel, E-Store, Health Module, Website Integration, Mobile App page, Voice Assistant, multiple duplicate dashboards/pages, Tally Integration, Storage Backup, and ~55 other legacy pages
- Created: AIToolsPage (2 tabs: AI Content Studio with 5 sub-tabs + Event Designer with templates/styles/preview), CCTVPage (standalone module)
- **AI Tools rebuilt**: AI Content Studio (Admission Pamphlet, Topper Banner, Event Poster, Activity Banner, AI Writer) + Event Designer (templates, styles, design preview, print/download/WhatsApp share)
- **Logo & Watermark Settings**: Full watermark controls (size, opacity, position, enable/disable) + logo apply-to settings (ID Cards, Notices, Calendar, App Header, Certificates, Fee Bills, App Icon) + visual watermark preview
- **Staff Photo Upload**: Camera icon overlay on profile view + photo upload in add/edit form + backend /api/upload/photo endpoint with auth/validation
- **Digital Library fixed**: Corrected API endpoint mismatch (issues → issued)
- **Removed Notices** from MODULE_LIST (no sidebar item for it)
- Moved 55 legacy pages to `frontend/src/pages/legacy/`
- Updated routes: `/app/staff`, `/app/fees`, `/app/admissions`, `/app/exams`, `/app/timetable`, `/app/library`, `/app/communication`, `/app/calendar`, `/app/analytics`, `/app/ai-tools`, `/app/cctv`
- Clean Layout with school branding header (logo + name + contact info)
- Removed GlobalWatermark from Layout (cleaner look)
- Removed CreditCard dropdown from header
- **Module Toggle → Sidebar**: Settings module toggles now control sidebar visibility. Disabled modules hide from sidebar and dashboard module grid. Uses localStorage key `module_visibility_settings` with custom event `module_visibility_changed` for instant updates.
- **Removed SchoolTino branding** from sidebar top (user request)
- **Distinct portal icons**: SchoolTino (blue), TeachTino (green), StudyTino (purple) - used in login tabs and favicon (falls back to school logo if uploaded)
- **Setup Wizard**: Rebuilt as 6-step form (Basic Info, Contact, Details, Leadership, Logo, Social Media) - no backend wizard API needed

## User Preferences
- Prefers detailed explanations
- Wants iterative development
- Ask before making major changes
- NextOS-style clean, simple UI
- Per-student subscription pricing model planned
- Credit system discussion paused - focus on UI/UX

## System Architecture

### UI/UX Decisions
NextOS K-12 inspired design:
- Clean flat sidebar navigation (20 items max, no nested groups)
- Light blue gradient sidebar (blue-50 to sky-50 to indigo-50) with blue-500 active state
- School branding header: logo, name, address, contact, registration
- Card-based module layout on dashboard
- Tino AI chat floating panel (accessible from header)
- Notification bell in header

### Portal Structure
1. **SchoolTino** (Admin - `/app/*`) - 22 modules:
   Dashboard, Students, Staff, Classes, Attendance, Fees, Admissions, Exams, Timetable, Library, Homework, Live Classes, Communication, Front Office, Transport, Calendar, Analytics, AI Tools, CCTV, Inventory (optional), Multi-Branch, Settings

2. **TeachTino** (Teachers - `/portal`) - 10 modules:
   Dashboard, Classes, Attendance, Homework, Exams, Live Classes, Timetable, Feed, Leave, Profile

3. **StudyTino** (Students - `/student-dashboard`) - 10 modules:
   Dashboard, Attendance, Fees, Results, Homework, Live Classes, Timetable, Feed, Library, Profile

### Technical Stack
- **Frontend**: React 19 + Create React App + CRACO + Tailwind CSS
- **Backend**: Python FastAPI + JWT authentication
- **Database**: MongoDB with Motor async driver
- **API Proxy**: setupProxy.js proxies `/api` to backend on port 8000
- **UI Components**: Radix UI / Shadcn patterns
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner toast

### File Structure
```
frontend/src/
├── App.js (clean routing - ~30 routes)
├── context/AuthContext.js (auth + school data)
├── components/
│   ├── Layout.js (header + sidebar + content shell)
│   ├── Sidebar.js (20 flat nav items)
│   └── ui/ (Radix/Shadcn components)
├── pages/ (active ~30 pages)
│   ├── AIToolsPage.js (consolidated: Paper + Event + Calendar)
│   ├── CCTVPage.js (standalone CCTV integration)
│   └── legacy/ (55+ removed pages - archived)
backend/
├── server.py (main FastAPI app)
├── routes/ (modular API routes)
└── core/database.py (MongoDB connection)
```

### Key Modules
- **AI Tools**: Consolidated module with tabs for AI Paper Generator, Event Designer, Calendar AI
- **CCTV Integration**: Standalone camera management module
- **Settings**: Merged School Profile + Logo/Branding + Permissions (single page)
- **Communication Hub**: Merged SMS + WhatsApp + Notices + Events
- **Inventory**: Optional/toggleable module

## External Dependencies
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **AI/LLM Providers**: Sarvam API (Tino AI Chat), Anthropic Claude API (AI Paper)
- **Planned**: Sarvam for AI Paper (replacing Claude), Google Gemini for Event Designer (free)
