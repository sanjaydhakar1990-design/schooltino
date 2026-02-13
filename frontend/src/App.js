import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import ImprovedAttendancePage from './pages/ImprovedAttendancePage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import FeeManagementPage from './pages/FeeManagementPage';
import AdmissionCRMPage from './pages/AdmissionCRMPage';
import ExamReportCard from './pages/ExamReportCard';
import TimetableManagement from './pages/TimetableManagement';
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import HomeworkPage from './pages/HomeworkPage';
import LiveClassesPage from './pages/LiveClassesPage';
import IntegratedCommunicationPage from './pages/IntegratedCommunicationPage';
import FrontOfficePage from './pages/FrontOfficePage';
import TransportPage from './pages/TransportPage';
import SchoolCalendarPage from './pages/SchoolCalendarPage';
import SchoolAnalytics from './pages/SchoolAnalytics';
import AIToolsPage from './pages/AIToolsPage';
import CCTVPage from './pages/CCTVPage';
import InventoryPage from './pages/InventoryPage';
import MultiBranchPage from './pages/MultiBranchPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import SchoolFeedPage from './pages/SchoolFeedPage';
import LeaveManagement from './pages/LeaveManagement';
import SetupWizard from './pages/SetupWizard';

import TeachTinoLogin from './pages/TeachTinoLogin';
import TeachTinoDashboard from './pages/TeachTinoDashboard';
import StudyTinoLoginPage from './pages/StudyTinoLoginPage';
import StudentDashboard from './pages/StudentDashboard';

import Layout from './components/Layout';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',padding:'20px'}}>
          <div style={{textAlign:'center',maxWidth:'400px'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>⚠️</div>
            <h2 style={{fontSize:'20px',fontWeight:'bold',color:'#1e293b',marginBottom:'8px'}}>Something went wrong</h2>
            <p style={{fontSize:'14px',color:'#64748b',marginBottom:'16px'}}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/app/dashboard'; }} style={{padding:'10px 24px',background:'#3b82f6',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const adminRoles = ['director', 'principal', 'vice_principal', 'co_director', 'admin_staff', 'accountant', 'clerk', 'admission_staff'];
  if (!adminRoles.includes(user?.role)) {
    if (user?.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user?.role === 'teacher') return <Navigate to="/portal" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

const StudentRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/studytino" replace />;
  if (user?.role !== 'student') return <Navigate to="/app/dashboard" replace />;
  return children;
};

const TeacherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/teachtino" replace />;
  const teacherRoles = ['teacher', 'principal', 'vice_principal', 'co_director', 'staff', 'admin_staff', 'accountant', 'clerk', 'admission_staff'];
  if (!teacherRoles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (isAuthenticated && user) {
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/portal" replace />;
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
};

function SmartRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/portal" replace />;
  return <Navigate to="/app/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/teachtino" element={<TeachTinoLogin />} />
      <Route path="/portal" element={<TeacherRoute><TeachTinoDashboard /></TeacherRoute>} />

      <Route path="/studytino" element={<StudyTinoLoginPage />} />
      <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

      <Route path="/app" element={<AdminRoute><Layout /></AdminRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="staff" element={<EmployeeManagementPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="attendance" element={<ImprovedAttendancePage />} />
        <Route path="fees" element={<FeeManagementPage />} />
        <Route path="admissions" element={<AdmissionCRMPage />} />
        <Route path="exams" element={<ExamReportCard />} />
        <Route path="timetable" element={<TimetableManagement />} />
        <Route path="library" element={<DigitalLibraryPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="live-classes" element={<LiveClassesPage />} />
        <Route path="communication" element={<IntegratedCommunicationPage />} />
        <Route path="front-office" element={<FrontOfficePage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="calendar" element={<SchoolCalendarPage />} />
        <Route path="analytics" element={<SchoolAnalytics />} />
        <Route path="ai-tools" element={<AIToolsPage />} />
        <Route path="cctv" element={<CCTVPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="multi-branch" element={<MultiBranchPage />} />
        <Route path="school-feed" element={<SchoolFeedPage />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="setup-wizard" element={<SetupWizard />} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/students" element={<Navigate to="/app/students" replace />} />
      <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
      <Route path="/attendance" element={<Navigate to="/app/attendance" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="/teacher-dashboard" element={<Navigate to="/portal" replace />} />

      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
              />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
