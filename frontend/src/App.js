import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StaffPage from './pages/StaffPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import FeesPage from './pages/FeesPage';
import NoticesPage from './pages/NoticesPage';
import AIPaperPage from './pages/AIPaperPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import TeachTinoDashboard from './pages/TeachTinoDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AIContentStudio from './pages/AIContentStudio';
import VoiceAssistant from './pages/VoiceAssistant';
import ImageGallery from './pages/ImageGallery';
import SMSCenter from './pages/SMSCenter';
import WebsiteIntegration from './pages/WebsiteIntegration';
import LeaveManagement from './pages/LeaveManagement';
import CCTVDashboard from './pages/CCTVDashboard';
import SchoolAnalytics from './pages/SchoolAnalytics';
import PermissionManager from './pages/PermissionManager';
import SchoolRegistrationForm from './pages/SchoolRegistrationForm';
import ZoomMeetings from './pages/ZoomMeetings';
import SetupWizard from './pages/SetupWizard';
import SubscriptionPage from './pages/SubscriptionPage';
import TeachTinoLogin from './pages/TeachTinoLogin';
import StudyTinoLogin from './pages/StudyTinoLogin';
import OnlineExamSystem from './pages/OnlineExamSystem';
import CCTVManagement from './pages/CCTVManagement';
import StorageBackup from './pages/StorageBackup';
import AdminActivityDashboard from './pages/AdminActivityDashboard';
import FeePaymentPage from './pages/FeePaymentPage';
import AccountantDashboard from './pages/AccountantDashboard';
import SchoolPaymentSettings from './pages/SchoolPaymentSettings';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }
  
  if (isAuthenticated && user) {
    // Role-based redirect
    const role = user.role;
    if (['teacher', 'admission_staff', 'clerk', 'staff'].includes(role)) {
      return <Navigate to="/teacher-dashboard" replace />;
    } else if (role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page - Marketing Home */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* TeachTino Portal - Teacher Login */}
      <Route path="/teachtino" element={<TeachTinoLogin />} />
      
      {/* StudyTino Portal - Student Login */}
      <Route path="/studytino" element={<StudyTinoLogin />} />

      {/* Protected Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="school-analytics" element={<SchoolAnalytics />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="permission-manager" element={<PermissionManager />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="ai-paper" element={<AIPaperPage />} />
        <Route path="ai-content" element={<AIContentStudio />} />
        <Route path="voice-assistant" element={<VoiceAssistant />} />
        <Route path="gallery" element={<ImageGallery />} />
        <Route path="sms" element={<SMSCenter />} />
        <Route path="website" element={<WebsiteIntegration />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="cctv" element={<CCTVDashboard />} />
        <Route path="cctv-management" element={<CCTVManagement />} />
        <Route path="storage" element={<StorageBackup />} />
        <Route path="activity" element={<AdminActivityDashboard />} />
        <Route path="accountant" element={<AccountantDashboard />} />
        <Route path="meetings" element={<ZoomMeetings />} />
        <Route path="school-registration" element={<SchoolRegistrationForm />} />
        <Route path="setup-wizard" element={<SetupWizard />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="exams" element={<OnlineExamSystem />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Old routes redirect to /app */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/students" element={<Navigate to="/app/students" replace />} />
      <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
      <Route path="/classes" element={<Navigate to="/app/classes" replace />} />
      <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
      <Route path="/attendance" element={<Navigate to="/app/attendance" replace />} />
      <Route path="/notices" element={<Navigate to="/app/notices" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

      {/* TeachTino Portal - Standalone for Teachers */}
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute>
            <TeachTinoDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student Portal - Standalone */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fee Payment Page - Student Access */}
      <Route
        path="/fee-payment"
        element={
          <ProtectedRoute>
            <FeePaymentPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - Smart redirect based on role */}
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}

// Smart redirect based on user role
function SmartRedirect() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const role = user.role;
  if (['teacher', 'admission_staff', 'clerk', 'staff'].includes(role)) {
    return <Navigate to="/teacher-dashboard" replace />;
  } else if (role === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'Inter, sans-serif'
              }
            }}
          />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
