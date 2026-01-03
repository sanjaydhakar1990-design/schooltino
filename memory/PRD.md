# Schooltino - Complete School Management System PRD

## Vision Statement
**"AI + CCTV + Apps से school को automatic, secure, paperless, data-driven banana - Director को remotely full control, teachers का load kam, students का tracking + learning improve."**

---

## Phase 1 - MVP (COMPLETED) ✅

### Implemented Features

#### 1. Authentication & User Management ✅
- JWT-based secure login
- **Role-based access control:**
  - Director (Super Admin)
  - Co-Director
  - Principal
  - Vice Principal
  - Accountant
  - Exam Controller
  - Teacher
  - Librarian
  - Clerk

#### 2. User Account Lifecycle ✅
- **Director creates all accounts** (email + password)
- **Principal can create** (needs Director approval)
- **Account statuses:**
  - Active
  - Pending (awaiting approval)
  - Suspended (temporary block)
  - Deactivated (permanent)
  - Rejected

#### 3. User Management Powers ✅
| Action | Director | Principal | Vice Principal |
|--------|----------|-----------|----------------|
| Create User | ✅ Instant | ✅ Needs approval | ❌ |
| Suspend | ✅ | ✅ | ✅ |
| Unsuspend | ✅ | ✅ | ❌ |
| Deactivate | ✅ | ❌ | ❌ |
| Reactivate | ✅ | ❌ | ❌ |
| Transfer Account | ✅ | ❌ | ❌ |

#### 4. Suspend Feature ✅
- Suspend reasons: Fees Pending, Misconduct, Document Pending, Other
- Suspend until date (optional)
- Auto-block login
- Unsuspend to reactivate

#### 5. Transfer Account Feature ✅
- Teacher change पर same ID नए व्यक्ति को transfer
- Syllabus/data continue रहता है
- Audit log में record

#### 6. Core Modules ✅
- Multi-school support
- Students CRUD
- Staff CRUD
- Classes & Sections
- Attendance (manual)
- Fee Plans, Invoices, Payments
- Notices with priority
- AI Paper Generator (OpenAI)
- Audit Logs
- Dashboard with charts
- Hindi/English bilingual

---

## Phase 2 - Enhanced Login & Portals (PLANNED)

### 2.1 Three Login Portals

| Portal | URL | Users |
|--------|-----|-------|
| **AdminTino** | /admin | Director, Principal, Vice Principal, Co-Director |
| **TeachTino** | /teach | Teachers, Staff |
| **StudyTino** | /study | Students, Parents |

### 2.2 Login Methods
- Mobile OTP (recommended)
- Email + Password
- Student ID + DOB/OTP (for students)
- Staff ID + Password

### 2.3 Self-Registration (Request Mode)
- Teacher/Staff signup → "Request Access"
- Status: Pending
- Director/Principal approve/reject
- Bulk CSV upload option

---

## Phase 3 - Leave Management (PLANNED)

### 3.1 Student Leave (StudyTino)
```
Student/Parent apply → Class Teacher approve → Principal approve (final)
```
- Leave types: Sick, Personal, Emergency, Other
- Half-day option
- Attachment support (medical slip)
- Auto-mark in attendance

### 3.2 Teacher Leave (TeachTino)
```
Teacher apply → Principal approve → Director approve (final)
```
- Substitute teacher assignment (AI suggest)
- Leave calendar
- Leave balance tracking

### 3.3 Leave Statuses
- Draft
- Submitted
- Pending (Teacher/Principal/Director)
- Approved
- Rejected
- Cancelled

---

## Phase 4 - Enhanced Notice System (PLANNED)

### 4.1 Notice Creation Flow
1. Draft notice (text/PDF/voice → AI convert)
2. Select audience (All, Teachers, Students, Class-specific)
3. Set expiry (start date - end date)
4. **2-step verification** (OTP/passkey)
5. Publish → Notifications (in-app, SMS, WhatsApp)

### 4.2 Notice Features
- School seal + signature template
- AI drafting from voice/text
- Teacher can create class-limited notices only
- Auto-archive after expiry
- Full audit logs

---

## Phase 5 - AI Assistants (PLANNED)

### 5.1 Three AI Buttons in Director Dashboard
1. **AdminTino** - School operations assistant
   - Staff management
   - Reports generation
   - Schedule optimization
   
2. **TeachTino** - Teaching assistant
   - Syllabus plans
   - Paper generation
   - Teaching aids
   
3. **StudyTino** - Student support
   - Homework help
   - Doubt solving (safe mode)
   - Study plans

### 5.2 AI Safety Rules
- All outputs require human confirmation
- No direct publish without verification
- Audit log for all AI actions

---

## Phase 6 - Student Admission & Gate (PLANNED)

### 6.1 Admission Workflow
1. Admin uploads student data
2. System generates: **Unique Student ID** (STD-2026-000345)
3. **Temporary password** created
4. First login → mandatory password change
5. OTP verify (parent mobile)

### 6.2 Student Account Lifecycle
- **Active** (normal)
- **Suspended** (fees pending / discipline)
- **Deactivated** (TC issued / left school)
- **Reactivated** (Director only)

### 6.3 Gate Verification (Hardware Integration)
- QR/Barcode/RFID card scan
- Real-time status check:
  - Active → Allow entry
  - Suspended/Deactivated → Deny entry
- Generic message on denial (privacy)
- Full access log

---

## Phase 7 - CCTV AI Integration (FUTURE)

### 7.1 CCTV Coverage Zones
- Entry Gate
- Corridors
- Classrooms (optional)
- Office area
- Boundary/exit points

### 7.2 AI Capabilities
- Face recognition attendance
- Movement tracking
- Behavior detection
- Voice warning system
- Incident escalation

---

## Phase 8 - DigiSchool Vision (FUTURE)

### 8.1 AI Teacher Clone
- Teacher-approved AI content
- 3D imagination-based teaching
- LCD/Projector integration
- ElevenLabs voice synthesis
- HeyGen avatars

### 8.2 Smart Classroom
- AI-controlled displays
- Interactive 3D lessons
- Real-time doubt solving
- Personalized learning pace

---

## Technical Architecture

### Current Stack
- **Frontend:** React + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT
- **AI:** OpenAI GPT (Emergent Integration)

### Database Collections
- users (with status, suspension_reason, etc.)
- schools
- classes
- students
- staff
- attendance_daily
- fee_plans, fee_invoices, fee_payments
- notices
- audit_logs
- generated_papers

---

## API Endpoints

### Auth & Users
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

POST /api/users/create
GET  /api/users/school/{school_id}
GET  /api/users/pending/{school_id}
POST /api/users/{id}/approve
POST /api/users/{id}/reject
POST /api/users/{id}/suspend
POST /api/users/{id}/unsuspend
POST /api/users/{id}/deactivate
POST /api/users/{id}/reactivate
POST /api/users/{id}/transfer
```

### Core Modules
```
/api/schools/*
/api/classes/*
/api/students/*
/api/staff/*
/api/attendance/*
/api/fees/*
/api/notices/*
/api/audit-logs/*
/api/ai/generate-paper
/api/dashboard/stats
```

---

## Environment Variables

```env
# Backend (.env)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="schooltino_db"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="sk-your-openai-key"

# Frontend (.env)
REACT_APP_BACKEND_URL="https://your-domain.com"
```

---

## Copy-Paste Requirement (For Developers)

```
"SchoolTino me 3 portals banao: Admin (Director/Principal/Vice/Co), 
TeachTino (teachers/staff), StudyTino (students/parents). 

Director is Super Admin - accounts create/approve/disable Director karega. 
Self-signup request mode ho jisme teacher/staff request bheje aur 
Director/authorized admin approve kare. CSV bulk import + Data mapping wizard ho.

User statuses: Active, Pending, Suspended, Deactivated. 
Suspend me reason + duration required. 
Transfer account feature for teacher change.

Notice system me AI drafting + seal/sign template + audience targeting + 
start/end expiry + notifications + 2-step verification before publish + audit logs.

Teacher class-limited notices + paper generator (PDF + answer key).

Leave Management: Student/Parent apply → Class Teacher → Principal approve.
Teacher apply → Principal → Director approve.

Director panel me 3 AI assistant buttons: AdminTino/TeachTino/StudyTino."
```

---

## Next Action Items

### Immediate (This Sprint)
1. ✅ User Management with full powers
2. ✅ Suspend/Unsuspend/Deactivate/Reactivate
3. ✅ Account Transfer feature
4. Test all features end-to-end

### Next Sprint
1. Leave Management module
2. Enhanced Notice system (2-step, expiry)
3. Self-registration request mode
4. Mobile responsive improvements

### Future Sprints
1. Three separate portals (Admin/Teach/Study)
2. Mobile OTP login
3. Student ID auto-generation
4. Gate integration APIs
5. AI Assistants

---

*Last Updated: January 2026*
*Version: 1.1.0 (Phase 1 Complete + User Management Enhanced)*
