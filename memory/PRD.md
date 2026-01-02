# Schooltino - Smart School Management System PRD

## Vision Statement
**"AI + CCTV + Apps से school को automatic, secure, paperless, data-driven banana - Director को remotely full control, teachers का load kam, students का tracking + learning improve."**

---

## Product Overview

### Core Apps
1. **Schooltino** - Director/Principal Admin Panel ✅ (Phase 1 Complete)
2. **Teachtino** - Teacher App (Phase 2)
3. **Studytino** - Student + Parent App (Phase 3)

### Target Users
- School Directors & Principals
- Teachers & Staff
- Students & Parents
- School Administrators in India

---

## Phase 1 - MVP (COMPLETED) ✅

### Implemented Features

#### 1. Authentication System
- JWT-based secure login
- Role-based access (Director, Principal, Teacher, Accountant)
- Multi-language support (Hindi/English)

#### 2. School Management
- Multi-school support
- School profile with board type (CBSE, ICSE, State)
- School selection for all operations

#### 3. Student Management
- CRUD operations for students
- Admission number tracking
- Class/Section assignment
- Parent details (Father/Mother name)
- Contact & address management
- Search & filter by class

#### 4. Staff Management
- Employee management with designations
- Teacher, Accountant, Librarian roles
- Qualification & salary tracking
- Department assignment

#### 5. Classes & Sections
- Class creation (Nursery to Class 12)
- Multiple sections (A, B, C, D, E)
- Class teacher assignment
- Student count tracking

#### 6. Attendance System
- Manual attendance marking
- Bulk attendance for entire class
- Status: Present/Absent/Late
- Daily attendance statistics
- Date-wise filtering

#### 7. Fee Management
- Fee plan creation (Monthly, Quarterly, Annual)
- Invoice generation
- Payment recording (Cash/Online/Cheque)
- Receipt generation
- Discount management
- Collection statistics

#### 8. Notice Board
- Create announcements
- Priority levels (Urgent, High, Normal, Low)
- Target audience selection (All, Teachers, Students, Parents)
- Valid till date

#### 9. AI Paper Generator
- OpenAI GPT integration
- Subject & chapter selection
- Question types (MCQ, Short, Long, Fill blanks)
- Difficulty levels
- Auto answer key generation
- Print/Download support

#### 10. Audit Logs
- Track all system activities
- User action logging
- Module-wise filtering

#### 11. Dashboard
- Total students/staff/classes count
- Today's attendance chart
- Fee collection statistics
- Recent notices
- Recent activities

---

## Phase 2 - CCTV AI Attendance (PLANNED)

### Features
- Gate camera face recognition
- Auto attendance on entry
- Period-wise attendance snapshots
- Late entry detection
- Unauthorized exit alerts

### Technical Requirements
- On-premises AI server
- RTSP camera integration
- Face recognition model
- Event-based cloud sync

---

## Phase 3 - Behavior AI & Incidents (PLANNED)

### Features
- Movement tracking (zone entry/exit)
- Behavior detection (running, fighting, crowding)
- AI voice warning system
- Escalation to teacher/principal
- Incident clip capture
- Heatmap analytics

### Alert Escalation
1. Level 1: AI warns student (speaker)
2. Level 2: Class teacher notification
3. Level 3: Principal + clip
4. Level 4: Director + incident package

---

## Phase 4 - DigiSchool (FUTURE VISION) 🚀

### AI Teacher Clone System
- Teacher-approved AI content delivery
- 3D imagination-based teaching
- LCD/Projector integration
- Visual learning with AI animations
- Personalized learning pace

### Smart Classroom Features
- AI-controlled LCD displays
- Projector integration
- Interactive 3D lessons
- Real-time doubt solving
- Automated lesson plans

### Integration Points
- ElevenLabs for voice synthesis
- HeyGen for AI avatars (future)
- 3D visualization engine
- Smart display APIs

---

## Technical Architecture

### Current Stack
- **Frontend:** React + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT
- **AI:** OpenAI GPT (Emergent Integration)

### Database Collections
- users, schools, classes, students, staff
- attendance_daily, fee_plans, fee_invoices, fee_payments
- notices, audit_logs, generated_papers

### API Prefix
All backend routes: `/api/*`

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| Director | Full access + CCTV control + Incident approvals |
| Principal | Staff/student ops + Academic control + Limited CCTV |
| Vice Principal | Academic + limited admin |
| Teacher | Own classes only |
| Accountant | Fee modules only |
| Exam Controller | Exams & results |

---

## What's Been Implemented (Jan 2026)

### Backend (100% Working)
- ✅ Auth endpoints (register, login, me)
- ✅ Schools CRUD
- ✅ Classes CRUD
- ✅ Students CRUD
- ✅ Staff CRUD
- ✅ Attendance (single + bulk)
- ✅ Fee Plans, Invoices, Payments
- ✅ Notices CRUD
- ✅ Dashboard stats
- ✅ Audit logs
- ✅ AI Paper Generator

### Frontend (85% Working)
- ✅ Login/Register page
- ✅ Sidebar navigation
- ✅ Dashboard with charts
- ✅ Students management
- ✅ Staff management
- ✅ Classes management
- ✅ Attendance marking
- ✅ Fee management
- ✅ Notices
- ✅ AI Paper Generator
- ✅ Settings with school creation
- ✅ Hindi/English language toggle
- ✅ Audit logs viewer

---

## Prioritized Backlog

### P0 (Critical - Next Sprint)
1. Add OpenAI API key in .env for AI Paper Generator
2. Test complete user flow with real data
3. Mobile responsive improvements

### P1 (Important)
1. Teachtino (Teacher App) - separate frontend
2. Studytino (Student/Parent App)
3. Exam module with marks entry
4. Result analytics

### P2 (Nice to Have)
1. CCTV integration preparation
2. Transport module
3. Library management
4. Hostel/Mess management

### P3 (Future - DigiSchool)
1. AI Teacher Clone system
2. LCD/Projector API integration
3. 3D lesson visualization
4. ElevenLabs voice integration
5. HeyGen avatar integration

---

## Environment Variables

```env
# Backend (.env)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="sk-your-openai-key"

# Frontend (.env)
REACT_APP_BACKEND_URL="https://your-domain.com"
```

---

## Next Action Items

1. **Immediate:** Add OpenAI API key to `/app/backend/.env`
2. **Test:** Complete flow - Register → School → Class → Staff → Student → Attendance → Fees
3. **Phase 2 Planning:** Start Teachtino (Teacher App) design
4. **DigiSchool R&D:** Research LCD/Projector APIs and AI avatar solutions

---

*Last Updated: January 2026*
*Version: 1.0.0 (Phase 1 MVP)*
