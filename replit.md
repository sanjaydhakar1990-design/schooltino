# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive, AI-powered school management platform designed to automate and streamline all aspects of school operations, from student and staff management to finance, attendance, and communication. It aims to provide a secure, integrated, and user-friendly experience, embracing cloud-first and AI-enabled principles. The platform includes a full suite of features supporting student admissions, marketing campaigns, fee management, AI-powered attendance and paper generation, and extensive communication tools, with dedicated portals for Admin, Teachers, and Students/Parents.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture

### UI/UX Decisions
The design is inspired by the NextOS K-12 Suite, featuring a blue/purple gradient theme for hero sections and sidebars across all portals (Schooltino Admin, TeachTino, StudyTino). Key elements include:
- Tabbed feature navigation on login pages and within modules.
- Dark sidebar with a glass-effect search and translucent styles.
- Consistent school branding in headers with logo, name, address, contact, and registration details.
- Systematic module groups on dashboards (Academic, Administration, Communication & Tools, AI & Infrastructure).
- Use of Radix UI and Shadcn/ui patterns for UI components.
- Global watermark of the school logo on admin pages.

### Technical Implementations
- **Frontend**: React 19 with Create React App + CRACO, styled using Tailwind CSS.
- **Backend**: Python FastAPI, utilizing JWT-based authentication.
- **Database**: MongoDB with Motor async driver.
- **API Proxy**: Frontend development server proxies `/api` requests to the backend using `setupProxy.js`.
- **Core Functionality**:
    - **Multi-portal System**: Three interconnected portals (Schooltino, TeachTino, StudyTino) sharing school data via `AuthContext`.
    - **Feature Parity**: Comprehensive feature set covering admission, finance, HR, academics, communication, and AI tools.
    - **AI Integration**: AI-powered features for chat, paper generation, and staff geo-facial attendance.
    - **Credit System**: Integrated credit management for AI features and communication, with Razorpay for recharge.
    - **PWA Support**: Progressive Web App capabilities across all portals.
    - **Modular Design**: Features are structured into logical groups and toggleable modules.

### Feature Specifications
- **Admission & CRM**: Student admission, lead tracking, follow-ups, campaign analytics.
- **Staff Management**: Employee management with integrated permissions and AI staff geo-facial attendance.
- **Finance**: Fee management, online payments (Razorpay), Tally integration, Student Wallet.
- **Academics**: Exam & Report Card management (6 tabs), Homework & Assignment, Timetable, Digital Library, Live Classes, Course Management.
- **Communication**: SMS & WhatsApp integration, event triggers, surveys, School Feed (social activity).
- **AI & Tools**: AI Paper Generator, Tino AI Chat, Biometric integration.
- **Infrastructure**: CCTV management, Transport management (NFC & GPS), Inventory, Hostel Management, Visit Management (OTP approval), Multi-Branch Management.
- **E-commerce**: School e-Store.

## External Dependencies
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **AI/LLM Providers**:
    - Sarvam API (for Tino AI Chat)
    - Anthropic Claude API (for AI Paper Generator)
- **External Integrations**:
    - Tally (for accounting sync)
    - WhatsApp API
    - SMS Gateway Providers
    - CCTV Systems
    - GPS and NFC tracking hardware/software
    - Various EdTech tools and content libraries