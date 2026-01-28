# Schooltino - Smart School Management System

## Overview
Schooltino is a comprehensive school management platform with AI-powered features, CCTV integration, and mobile apps. It provides complete automation for managing students, staff, fees, and attendance.

## Project Architecture

### Frontend (React)
- **Location**: `/frontend`
- **Framework**: React 19 with Create React App + CRACO
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui patterns
- **Port**: 5000 (development)

### Backend (Python FastAPI)
- **Location**: `/backend`
- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT-based

## Environment Variables

### Required Secrets
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name

### Frontend Environment
- `REACT_APP_BACKEND_URL` - Backend API URL (leave empty for same-origin requests)
- `GENERATE_SOURCEMAP` - Set to false to disable source maps

## Running the Application

### Development
The frontend runs on port 5000:
```bash
cd frontend && PORT=5000 HOST=0.0.0.0 npm start
```

### Backend (if needed separately)
```bash
cd backend && uvicorn server:app --host localhost --port 8000
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

## Recent Changes
- 2026-01-28: Initial Replit environment setup
- Configured frontend to run on port 5000 with all hosts allowed
- Added MongoDB secrets configuration

## Project Structure
```
/
├── backend/          # FastAPI Python backend
│   ├── routes/       # API route modules
│   ├── services/     # Business logic services
│   ├── core/         # Core utilities (auth, database)
│   └── server.py     # Main FastAPI application
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   └── hooks/       # Custom hooks
│   └── public/          # Static assets
└── marketing_materials/ # Marketing assets
```
