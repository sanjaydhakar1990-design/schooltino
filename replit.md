# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive, AI-powered school management platform inspired by NextOS K-12 Suite. It features a clean, simplified architecture with ~25 core modules across three portals (SchoolTino Admin, TeachTino Teachers, StudyTino Students/Parents). The platform covers student/staff management, finance, attendance, communication, and AI tools.

## Recent Changes (Feb 2026)
- **Timetable Homeroom System**: Period 1 is always Homeroom/Attendance, auto-locked to class teacher with +10 mins extra duration. Class teacher assignment with conflict detection (one teacher = one class only). Backend endpoints: GET/POST /api/timetable-settings, POST /api/class-teacher/assign, GET/POST/DELETE /api/substitutions. Frontend rebuilt with 4 tabs (Class Timetable, Teacher Schedule, Substitutions, Settings). Period 1 cells show blue background, teacher icon, "Homeroom" label, not editable. Substitution system with notifications for substitute teachers. Settings panel for period durations, working days, break/lunch config.
- **WhatsApp Dual Mode**: Communication page now has Free (wa.me link) and Paid API (BotBiz) toggle. Free mode opens direct WhatsApp chat for single numbers or copies message for bulk forwarding. No credits required for free mode. Mobile validation for single-number free mode.
- **Admit Card Notifications**: Bulk admit card generation now creates Hindi notifications for each student - eligible students get download prompt, fee-pending students see pending amount with instructions.
- **Fee Collection Auto-Activates Admit Cards**: When admin collects fee and student's total meets minimum fee percentage, system auto-generates admit card entries for applicable pending exams (filtered by student's class).
- **Permission Update Fix**: Fixed quick permissions save in EmployeeManagementPage - now calls dedicated /api/employees/{id}/permissions endpoint instead of full employee update endpoint that was failing validation.
- **Security Fix - Director-Only Settings**: SettingsPage now blocks non-director users with "Access Denied" screen. Previously principal/staff could access settings and module management.
- **Login Credentials Viewer**: New "Login Credentials" tab in Employee Management (director-only) showing employee login IDs, roles, login status with password reset functionality. Similar password reset added for students.
- **Password Reset Endpoints**: New PUT /api/employees/{id}/reset-password and PUT /api/students/{id}/reset-password - both scoped by school_id for multi-school security.
- **Multi-School Data Isolation**: Student ID generation now scoped per school (STU-{year}-{seq} per school). Student login accepts school_id parameter to prevent cross-school access. Password reset endpoints enforce school_id matching.
- **Staff Can Teach Multitasking**: can_teach checkbox in employee add/edit form allows principal/admin staff to be assigned to classes as teachers. Backend queries staff with can_teach=True for class assignment.
- **AI Paper - Optional School Name**: Added showSchoolName toggle and editable school name input in paper settings. School name on printed paper is now optional.
- **AI Paper - Class-wise Instructions**: Dynamic instructions based on selected class - simple instructions for Nursery-Class 2, moderate for Class 3-5, formal for Class 6+. Both Hindi and English supported.
- **AI Paper - Small Class Diagrams**: Enhanced AI prompt for Nursery/LKG/UKG/Class 1-2 to generate picture-based, activity-based questions with diagram_description fields. At least 60% visual questions for young children.
- **Premium Admin ID Cards**: 3 exclusive VIP templates (Royal gold borders, Executive purple gradient, Gold Shield crest) for director/admin staff only. "My ID Card" button on ProfilePage.
- **AI Paper Generator - Language Fix**: Subject name mapping (SUBJECT_MAP_HI_TO_EN) so paper language controls subject display. English paper shows "Mathematics" even for MP Board Hindi subjects.
- **AI Paper Generator - Answer Key Rewrite**: Step 3 now has separate Question Paper and Answer Key tabs with individual print buttons. Answer key shows marking_points, diagram_steps, explanations per question.
- **AI Paper Generator - Diagram SVG**: Replaced broken Emergent LLM with Sarvam API for generating SVG diagrams in answer keys. Diagrams rendered as base64 data URLs.
- **AI Paper Generator - Print System**: New printSection() function opens popup window with styled content for clean printing of question paper or answer key separately.
- **ErrorBoundary Added**: React ErrorBoundary in App.js catches runtime crashes and shows friendly error page instead of blank white screen. Prevents "blank page" issue.
- **ID Card System Enhanced**: IDCardViewer rewritten with 5+3 templates (Classic, Modern, Elegant, Minimal, Vertical + Royal, Executive, Gold Shield), 8 color themes, field visibility controls (father/mother name, DOB, blood group, Samgra ID, etc.), settings panel with template/color/field toggles, persistent settings via localStorage ('id_card_settings'), proper print support for each template.
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
