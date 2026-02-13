# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive, AI-powered school management platform, inspired by NextOS K-12 Suite. It features a clean, simplified architecture with approximately 25 core modules distributed across three distinct portals: SchoolTino Admin, TeachTino Teachers, and StudyTino Students/Parents. The platform's primary purpose is to streamline school operations, covering essential functions such as student and staff management, finance, attendance, communication, and advanced AI-powered tools. The project aims to provide a robust, user-friendly system that enhances administrative efficiency and improves the educational experience for all stakeholders.

## User Preferences
- Prefers detailed explanations
- Wants iterative development
- Ask before making major changes
- NextOS-style clean, simple UI
- Per-student subscription pricing model planned
- Credit system discussion paused - focus on UI/UX

## System Architecture

### UI/UX Decisions
The design is heavily inspired by NextOS K-12, emphasizing simplicity and clarity. Key UI/UX elements include:
- A clean, flat sidebar navigation with a maximum of 20 items, avoiding nested groups.
- A light blue gradient sidebar (blue-50 to sky-50 to indigo-50) with a distinct blue-500 active state.
- A prominent school branding header displaying the logo, name, address, contact information, and registration details.
- A card-based module layout for the dashboard to enhance readability and access.
- A floating Tino AI chat panel accessible from the header.
- A notification bell in the header for system alerts.
- Distinct portal icons (SchoolTino - blue, TeachTino - green, StudyTino - purple) used in login tabs and as favicons, falling back to the school logo if uploaded.

### Technical Implementations
- **AI Paper Generation**: Features dynamic instructions based on class level (Nursery-Class 2, Class 3-5, Class 6+), generates SVG reference images for all questions, and includes an answer key with marking points, diagram steps, and explanations.
- **Timetable Homeroom System**: Period 1 is automatically designated as Homeroom/Attendance, locked to the class teacher with extended duration. Includes a substitution system with notifications.
- **Fee Management**: Fully bilingual support for all text elements.
- **ID Card System**: Enhanced with 5+3 templates, 8 color themes, and configurable field visibility.
- **Multi-School Data Isolation**: Student ID generation and login processes are scoped per school to ensure data segregation.
- **Teacher Approval System**: Teacher actions (e.g., notices) require admin approval, with a notification system for requests.
- **Global Language Toggle**: A header-level Hindi/English toggle for immediate language switching.
- **WhatsApp Integration**: Dual mode with Free (wa.me link) and Paid API (BotBiz) options.
- **Login Credentials Viewer**: Director-only access to view and reset employee and student login credentials.
- **Security**: Settings page access restricted to director-level users.
- **Module Management**: Enhanced with toggleable modules for Admissions CRM, Multi-Branch, and Front Office, controlling sidebar visibility and dashboard presence.

### Feature Specifications
- **Core Modules**: Approximately 25 modules across three portals.
- **AI Tools**: Consolidated module including AI Paper Generator, Event Designer, and Calendar AI.
- **CCTV Integration**: A standalone module for camera management.
- **Communication Hub**: Integrated SMS, WhatsApp, notices, and events.
- **Inventory**: An optional and toggleable module.
- **School Registration**: A dedicated page for new school sign-ups with auto-generated secure passwords.
- **Landing Page**: A comprehensive public-facing landing page detailing app features and portals.
- **Setup Wizard**: A 6-step guided setup for initial school configuration.

### System Design Choices
- **Reduced Complexity**: Significant reduction of pages and sidebar items from previous versions, focusing on a streamlined core.
- **Error Handling**: Implemented React ErrorBoundary for graceful error handling.
- **Branding Controls**: Comprehensive logo and watermark settings with visual previews, applied across various system elements.

### Portal Structure
1.  **SchoolTino** (Admin - `/app/*`) - 22 modules: Dashboard, Students, Staff, Classes, Attendance, Fees, Admissions, Exams, Timetable, Library, Homework, Live Classes, Communication, Front Office, Transport, Calendar, Analytics, AI Tools, CCTV, Inventory (optional), Multi-Branch, Settings.
2.  **TeachTino** (Teachers - `/portal`) - 10 modules: Dashboard, Classes, Attendance, Homework, Exams, Live Classes, Timetable, Feed, Leave, Profile.
3.  **StudyTino** (Students - `/student-dashboard`) - 10 modules: Dashboard, Attendance, Fees, Results, Homework, Live Classes, Timetable, Feed, Library, Profile.

### Technical Stack
- **Frontend**: React 19, Create React App, CRACO, Tailwind CSS.
- **Backend**: Python FastAPI with JWT authentication.
- **Database**: MongoDB with Motor async driver.
- **API Proxy**: `setupProxy.js` for `/api` to backend (port 8000).
- **UI Components**: Radix UI / Shadcn patterns.
- **Charts**: Recharts.
- **Icons**: Lucide React.
- **Notifications**: Sonner toast.

## External Dependencies
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **AI/LLM Providers**: Sarvam API (Tino AI Chat), Anthropic Claude API (AI Paper).
- **Planned**: Sarvam for AI Paper (replacing Claude), Google Gemini for Event Designer.