import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// ============================================================
// ACTIVE PAGES (in /src/pages/ folder)
// ============================================================
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import ImprovedAttendancePage from './pages/ImprovedAttendancePage';
import AIPaperPage from './pages/AIPaperPage';
import SettingsPage from './pages/SettingsPage';
import TeachTinoDashboard from './pages/TeachTinoDashboard';
import StudentDashboard from './pages/StudentDashboard';
import LeaveManagement from './pages/LeaveManagement';
import SchoolAnalytics from './pages/SchoolAnalytics';
import SetupWizard from './pages/SetupWizard';
import SubscriptionPage from './pages/SubscriptionPage';
import TeachTinoLogin from './pages/TeachTinoLogin';
import FrontOfficePage from './pages/FrontOfficePage';
import TransportPage from './pages/TransportPage';
import TimetableManagement from './pages/TimetableManagement';
import ExamReportCard from './pages/ExamReportCard';
import WhatsAppPamphlets from './pages/WhatsAppPamphlets';
import SchoolMarketingPage from './pages/SchoolMarketingPage';
import AdmitCardManagementFixed from './pages/AdmitCardManagementFixed';
import PDFDownloadPage from './pages/PDFDownloadPage';
import SchoolCalendarPage from './pages/SchoolCalendarPage';
import StudyTinoLoginPage from './pages/StudyTinoLoginPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import FeeManagementPage from './pages/FeeManagementPage';
import ProfilePage from './pages/ProfilePage';

// Sidebar pages (in /src/pages/ folder)
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import IntegratedCommunicationPage from './pages/IntegratedCommunicationPage';
import AdmissionCRMPage from './pages/AdmissionCRMPage';
import InventoryPage from './pages/InventoryPage';
import MultiBranchPage from './pages/MultiBranchPage';
import AIToolsPage from './pages/AIToolsPage';
import LiveClassesPage from './pages/LiveClassesPage';

// ============================================================
// LEGACY PAGES (in /src/pages/legacy/ folder)
// ============================================================
import FeesPage from './pages/legacy/FeesPage';
import NoticesPage from './pages/legacy/NoticesPage';
import AuditLogsPage from './pages/legacy/AuditLogsPage';
import UserManagementPage from './pages/legacy/UserManagementPage';
import AIContentStudio from './pages/legacy/AIContentStudio';
import VoiceAssistant from './pages/legacy/VoiceAssistant';
import ImageGallery from './pages/legacy/ImageGallery';
import SMSCenter from './pages/legacy/SMSCenter';
import WebsiteIntegration from './pages/legacy/WebsiteIntegration';
import CCTVDashboard from './pages/legacy/CCTVDashboard';
import PermissionManager from './pages/legacy/PermissionManager';
import SchoolRegistrationForm from './pages/legacy/SchoolRegistrationForm';
import ZoomMeetings from './pages/legacy/ZoomMeetings';
import OnlineExamSystem from './pages/legacy/OnlineExamSystem';
import CCTVManagement from './pages/legacy/CCTVManagement';
import StorageBackup from './pages/legacy/StorageBackup';
import AdminActivityDashboard from './pages/legacy/AdminActivityDashboard';
import FeePaymentPage from './pages/legacy/FeePaymentPage';
import AccountantDashboard from './pages/legacy/AccountantDashboard';
import SchoolSettingsPage from './pages/legacy/SchoolSettingsPage';
import BoardNotificationsPage from './pages/legacy/BoardNotificationsPage';
import FeeStructureManagement from './pages/legacy/FeeStructureManagement';
import AIHistoryPage from './pages/legacy/AIHistoryPage';
import HealthModulePage from './pages/legacy/HealthModulePage';
import BiometricPage from './pages/legacy/BiometricPage';
import DirectorAIDashboard from './pages/legacy/DirectorAIDashboard';
import MultiYearFeesPage from './pages/legacy/MultiYearFeesPage';
import SalaryTrackingPage from './pages/legacy/SalaryTrackingPage';
import StudentReceiptsPage from './pages/legacy/StudentReceiptsPage';
import UnifiedPortal from './pages/legacy/UnifiedPortal';
import TinoBrainDashboard from './pages/legacy/TinoBrainDashboard';
import SetupGuidePage from './pages/legacy/SetupGuidePage';
import SuperAdminPanel from './pages/legacy/SuperAdminPanel';
import TeacherRoleManager from './pages/legacy/TeacherRoleManager';
import ComplaintFeedbackPage from './pages/legacy/ComplaintFeedbackPage';
import PrayerSystemPage from './pages/legacy/PrayerSystemPage';
import EventDesignerPage from './pages/legacy/EventDesignerPage';
import FamilyPortalPage from './pages/legacy/FamilyPortalPage';
import ParentPortalPage from './pages/legacy/ParentPortalPage';
import ParentPaymentPortal from './pages/legacy/ParentPaymentPortal';
import SchoolManagementPage from './pages/legacy/SchoolManagementPage';
import LogoWatermarkSettings from './pages/legacy/LogoWatermarkSettings';
import CertificateGenerator from './pages/legacy/CertificateGenerator';
import TinoAICenter from './pages/legacy/AIJarvisCenter';
import TinoAIAgent from './pages/legacy/TinoAIAgent';

// TimetablePage → alias to TimetableManagement (same functionality)
const TimetablePage = TimetableManagement;
// MarketingPage → alias to SchoolMarketingPage
const MarketingPage = SchoolMarketingPage;

// PWA Install Prompt
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Trial Mode Components
import { TrialBanner, SupportFAB } from './components/TrialMode';

// Notice Popup System
import NoticePopup from './components/NoticePopup';

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

// Role-based Protected Route - SECURITY
const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = "/login" }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
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
  
  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user?.role)) {
    // Redirect based on role
    if (user?.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/teacher-dashboard" replace />;
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  return children;
};

// Student Only Route - BLOCKS admin/teacher access
const StudentOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/studytino" replace />;
  }
  
  // Only students can access
  if (user?.role !== 'student') {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return children;
};

// Admin Only Route - Director, Principal only
const AdminOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
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
  
  // Only director, principal, vice_principal, co_director
  const adminRoles = ['director', 'principal', 'vice_principal', 'co_director'];
  if (!adminRoles.includes(user?.role)) {
    // Redirect to their appropriate dashboard
    if (user?.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/teacher-dashboard" replace />;
    }
    return <Navigate to="/teacher-dashboard" replace />;
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
    // Role-based redirect - All staff go to Unified Portal
    const role = user.role;
    if (['teacher', 'admission_staff', 'clerk', 'staff', 'admin_staff', 'accountant', 'principal', 'vice_principal', 'co_director'].includes(role)) {
      return <Navigate to="/portal" replace />;
    } else if (role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (role === 'director') {
      return <Navigate to="/app/dashboard" replace />;
    }
    return <Navigate to="/portal" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page - Marketing Home */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Super Admin Panel - HIDDEN SECRET URL */}
      <Route path="/owner-x7k9m2" element={<SuperAdminPanel />} />
      
      {/* Marketing Brochure Page - Shareable on WhatsApp */}
      <Route path="/marketing" element={<MarketingPage />} />
      <Route path="/brochure" element={<MarketingPage />} />
      
      {/* WhatsApp Pamphlets - Daily Shareable Content */}
      <Route path="/pamphlets" element={<WhatsAppPamphlets />} />
      <Route path="/whatsapp" element={<WhatsAppPamphlets />} />
      
      {/* PDF Download Page */}
      <Route path="/download-brochure" element={<PDFDownloadPage />} />
      <Route path="/pdf" element={<PDFDownloadPage />} />
      
      {/* School Marketing Page - Each school can share their page */}
      <Route path="/school/:schoolId" element={<SchoolMarketingPage />} />
      
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
      
      {/* StudyTino Portal - Combined Student & Parent Login */}
      {/* Note: StudyTinoLoginPage is the new combined page at line 392 */}
      <Route 
        path="/studytino/receipts" 
        element={
          <StudentOnlyRoute>
            <StudentReceiptsPage />
          </StudentOnlyRoute>
        } 
      />

      {/* Student Dashboard - ONLY for students */}
      <Route 
        path="/student-dashboard" 
        element={
          <StudentOnlyRoute>
            <StudentDashboard />
          </StudentOnlyRoute>
        } 
      />

      {/* Admin Protected Routes - Director/Principal only */}
      <Route
        path="/app"
        element={
          <AdminOnlyRoute>
            <Layout />
          </AdminOnlyRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="school-analytics" element={<SchoolAnalytics />} />
        <Route path="users" element={<Navigate to="/app/employee-management" replace />} />
        <Route path="permission-manager" element={<PermissionManager />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="staff" element={<Navigate to="/app/employee-management" replace />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="attendance" element={<ImprovedAttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="ai-paper" element={<AIPaperPage />} />
        <Route path="ai-content" element={<Navigate to="/app/event-designer" replace />} />
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
        <Route path="fee-structure" element={<FeeStructureManagement />} />
        <Route path="fee-management" element={<FeeManagementPage />} />
        <Route path="timetable-management" element={<TimetableManagement />} />
        <Route path="certificates" element={<CertificateGenerator />} />
        <Route path="exam-report" element={<ExamReportCard />} />
        <Route path="tino-ai" element={<TinoAICenter />} />
        <Route path="tino-agent" element={<TinoAIAgent />} />
        <Route path="staff-directory" element={<Navigate to="/app/employee-management" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="meetings" element={<ZoomMeetings />} />
        <Route path="school-registration" element={<SchoolRegistrationForm />} />
        <Route path="setup-wizard" element={<SetupWizard />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="exams" element={<OnlineExamSystem />} />
        <Route path="ai-history" element={<AIHistoryPage />} />
        <Route path="front-office" element={<FrontOfficePage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="health" element={<HealthModulePage />} />
        <Route path="biometric" element={<BiometricPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="teacher-roles" element={<Navigate to="/app/employee-management" replace />} />
        <Route path="director-ai" element={<DirectorAIDashboard />} />
        <Route path="tino-brain" element={<TinoBrainDashboard />} />
        <Route path="multi-year-fees" element={<MultiYearFeesPage />} />
        <Route path="salary" element={<SalaryTrackingPage />} />
        <Route path="admit-cards" element={<AdmitCardManagementFixed />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="school-settings" element={<Navigate to="/app/school-management" replace />} />
        <Route path="board-notifications" element={<BoardNotificationsPage />} />
        <Route path="setup-guide" element={<SetupGuidePage />} />
        <Route path="school-calendar" element={<SchoolCalendarPage />} />
        <Route path="complaints" element={<ComplaintFeedbackPage />} />
        <Route path="prayer-system" element={<PrayerSystemPage />} />
        <Route path="event-designer" element={<EventDesignerPage />} />
        <Route path="family-portal" element={<FamilyPortalPage />} />
        <Route path="payment-settings" element={<Navigate to="/app/school-management" replace />} />
        <Route path="parent-pay" element={<ParentPaymentPortal />} />
        <Route path="school-management" element={<SchoolManagementPage />} />
        <Route path="employee-management" element={<EmployeeManagementPage />} />
        <Route path="logo-settings" element={<LogoWatermarkSettings />} />

        {/* Sidebar navigation routes - previously missing */}
        <Route path="library" element={<DigitalLibraryPage />} />
        <Route path="communication" element={<IntegratedCommunicationPage />} />
        <Route path="admissions" element={<AdmissionCRMPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="multi-branch" element={<MultiBranchPage />} />
        <Route path="ai-tools" element={<AIToolsPage />} />
        <Route path="live-classes" element={<LiveClassesPage />} />

        {/* Path aliases for cleaner sidebar URLs */}
        <Route path="analytics" element={<Navigate to="/app/school-analytics" replace />} />
        <Route path="calendar" element={<Navigate to="/app/school-calendar" replace />} />
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

      {/* TeachTino Portal - Only for Teachers */}
      <Route
        path="/teacher-dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['teacher', 'principal', 'vice_principal']} redirectTo="/login">
            <TeachTinoDashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Unified Portal - For Staff (NOT students, NOT full admin access) */}
      <Route
        path="/portal"
        element={
          <RoleProtectedRoute 
            allowedRoles={['teacher', 'admission_staff', 'clerk', 'staff', 'admin_staff', 'accountant', 'principal', 'vice_principal', 'co_director']} 
            redirectTo="/login"
          >
            <UnifiedPortal />
          </RoleProtectedRoute>
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

      {/* StudyTino Combined Login - Students & Parents */}
      <Route path="/studytino" element={<StudyTinoLoginPage />} />

      {/* Parent Portal - Standalone (No auth required - has own login) */}
      <Route path="/parent-portal" element={<ParentPortalPage />} />

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

// PWA Install Prompt Wrapper - Only shows when logged in
function PWAInstallPromptWrapper() {
  // Show PWA prompt to all users - no login required
  return <PWAInstallPrompt />;
}

// Smart redirect based on user role
function SmartRedirect() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const role = user.role;
  // Students go to student dashboard
  if (role === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }
  // Director goes to full admin dashboard
  if (role === 'director') {
    return <Navigate to="/app/dashboard" replace />;
  }
  // All other staff go to Unified Portal
  return <Navigate to="/portal" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          {/* Trial Banner removed from admin dashboard per user request */}
          
          <AppRoutes />
          
          {/* PWA Install Prompt - Shows after login */}
          <PWAInstallPromptWrapper />
          
          {/* Notice Popup - Shows unread notices as popup */}
          <NoticePopup />
          
          {/* Support FAB - Bottom right */}
          <SupportFAB />
          
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
