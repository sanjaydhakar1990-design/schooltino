# Schooltino - Complete School Management System PRD

## Vision Statement
**"AI + CCTV + Apps से school को automatic, secure, paperless, data-driven banana - Director को remotely full control, teachers का load kam, students का tracking + learning improve."**

---

## Current Version: 2.0.0
**Last Updated:** January 3, 2026

---

## ✅ Phase 1 - MVP (COMPLETED)

### Implemented Features

#### 1. Authentication & Security ✅
- **JWT-based secure login**
- **PUBLIC REGISTRATION DISABLED** - Only Director can create users
- Initial Director setup via one-time `/api/auth/setup-director` endpoint
- Role-based access control (RBAC)

#### 2. Three Login Portals ✅
| Portal | Users | Access |
|--------|-------|--------|
| **Schooltino Admin** | Director, Principal, Vice Principal | Full admin access |
| **TeachTino** | Teachers, Staff | Class management, attendance |
| **StudyTino** | Students, Parents | View profile, fees, notices |

#### 3. Student Login Methods ✅
- Student ID + Password
- Parent Mobile + DOB

#### 4. User Account Lifecycle ✅
- **Director creates all accounts** (email + password)
- **Principal can create** (needs Director approval)
- **Account statuses:** Active, Pending, Suspended, Deactivated, Rejected
- Suspend with reason (Fees Pending, Misconduct, Document Pending)
- Account Transfer feature (for teacher changes)

#### 5. Student Admission Flow ✅
- Auto-generated Student ID (STD-YYYY-XXXXXX)
- Auto-generated temporary password
- First login → mandatory password change
- Status tracking: Active, Suspended, Left

#### 6. Core Modules ✅
- Multi-school support
- Students CRUD with search/filter
- Staff CRUD
- Classes & Sections management
- Attendance (manual marking, bulk)
- Fee Plans, Invoices, Payments
- Notices with priority levels
- Dashboard with statistics
- Audit Logs
- Hindi/English bilingual UI

#### 7. AI Features ✅
- **AI Paper Generator** - Generate question papers using OpenAI GPT
- **AI Content Studio** - Generate professional content for:
  - Admission Pamphlets
  - Topper Banners
  - Event Posters
  - Activity Banners

#### 8. PWA Support ✅
- Installable on mobile and desktop
- manifest.json configured
- Service worker for offline support
- App shortcuts (Dashboard, Students, Attendance)

---

## 🚀 Phase 2 - Enhanced Features (PLANNED)

### 2.1 Leave Management System
```
Student Leave: Parent apply → Class Teacher → Principal approve
Teacher Leave: Teacher apply → Principal → Director approve
```
- Leave types: Sick, Personal, Emergency
- Half-day option
- Attachment support
- Leave balance tracking

### 2.2 Enhanced Notice System
- AI drafting from voice/text
- 2-step verification (OTP) before publish
- Audience targeting (All, Teachers, Class-specific)
- Expiry dates
- Auto-archive

### 2.3 Self-Registration (Request Mode)
- Teacher/Staff can request access
- Status: Pending → Approved/Rejected by Director
- Bulk CSV upload option

---

## 🔮 Phase 3 - AI Assistants (FUTURE)

### AI Buttons on Director Dashboard
1. **AdminTino** - School operations assistant
2. **TeachTino AI** - Teaching assistant
3. **StudyTino AI** - Student support (safe mode)

---

## 🏢 Phase 4 - CCTV & Hardware (FUTURE)

### Gate Verification System
- QR/Barcode/RFID card scan
- Real-time status check
- Active → Allow, Suspended → Deny
- Access logging

### CCTV AI Capabilities
- Face recognition attendance
- Movement tracking
- Behavior detection
- Incident escalation

---

## Technical Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind CSS + Shadcn/UI |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Auth | JWT |
| AI | OpenAI GPT (via emergentintegrations) |

### Database Collections
- users, schools, classes, students, staff
- attendance, fee_plans, fee_invoices, fee_payments
- notices, audit_logs, generated_papers, ai_content

### Key API Endpoints
```
# Auth
POST /api/auth/setup-director (one-time)
POST /api/auth/login
GET  /api/auth/check-setup
GET  /api/auth/me

# User Management
POST /api/users/create
POST /api/users/{id}/suspend
POST /api/users/{id}/unsuspend
POST /api/users/{id}/deactivate
POST /api/users/{id}/reactivate
POST /api/users/{id}/transfer

# Students
POST /api/students/admit (auto-generates ID + password)
POST /api/students/login
GET  /api/students

# AI Features
POST /api/ai/generate-paper
POST /api/ai/generate-content

# Portals
GET /api/teacher/dashboard
GET /api/student/dashboard
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Director | director@schooltino.com | admin123 |

---

## File Structure
```
/app/
├── backend/
│   ├── .env (MONGO_URL, JWT_SECRET, OPENAI_API_KEY)
│   └── server.py
├── frontend/
│   ├── public/
│   │   ├── manifest.json (PWA)
│   │   └── service-worker.js
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.js (3 portal tabs)
│       │   ├── DashboardPage.js
│       │   ├── UserManagementPage.js
│       │   ├── StudentsPage.js
│       │   ├── AIContentStudio.js
│       │   ├── TeacherDashboard.js
│       │   └── StudentDashboard.js
│       └── context/
│           └── AuthContext.js
├── tests/
│   └── test_schooltino_backend.py
└── test_reports/
    ├── iteration_2.json
    └── iteration_3.json (Latest - 100% pass)
```

---

## Changelog

### v2.0.0 (January 3, 2026)
- ✅ **Security Fix:** Public registration disabled
- ✅ **New:** AI Content Studio (pamphlets, banners, posters)
- ✅ **New:** TeachTino Dashboard
- ✅ **New:** StudyTino Dashboard
- ✅ **New:** PWA Support (installable app)
- ✅ **New:** 3-portal login page (Admin/Teacher/Student)
- ✅ **Fix:** Student login with ID+Password or Mobile+DOB
- ✅ **Test:** 100% backend tests passing (20/20)

### v1.1.0 (January 2, 2026)
- User Management with full powers
- Suspend/Unsuspend/Deactivate/Reactivate
- Account Transfer feature
- Student Admission with auto-ID

### v1.0.0 (Initial)
- Basic authentication
- Core modules (Students, Staff, Classes)
- Dashboard, Fees, Notices, Attendance

---

## Next Action Items

### Immediate (This Sprint)
1. ✅ Security: Disable public registration
2. ✅ AI Content Studio
3. ✅ PWA Conversion
4. ✅ TeachTino & StudyTino portals

### Next Sprint
1. 🔲 Leave Management module
2. 🔲 Enhanced Notice system (2-step verification)
3. 🔲 Self-registration request mode
4. 🔲 Mobile responsive improvements

### Backlog
- OTP-based login
- AI Assistants on dashboard
- CCTV integration
- Gate access control

---

*Schooltino - Making Schools Smart, One Feature at a Time*
