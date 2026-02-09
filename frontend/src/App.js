import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import ImprovedAttendancePage from './pages/ImprovedAttendancePage';
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
import SchoolRegistrationForm from './pages/SchoolRegistrationForm';
import ZoomMeetings from './pages/ZoomMeetings';
import SetupWizard from './pages/SetupWizard';
import SubscriptionPage from './pages/SubscriptionPage';
import TeachTinoLogin from './pages/TeachTinoLogin';
import OnlineExamSystem from './pages/OnlineExamSystem';
import CCTVManagement from './pages/CCTVManagement';
import StorageBackup from './pages/StorageBackup';
import AdminActivityDashboard from './pages/AdminActivityDashboard';
import FeePaymentPage from './pages/FeePaymentPage';
import AccountantDashboard from './pages/AccountantDashboard';
import SchoolSettingsPage from './pages/SchoolSettingsPage';
import BoardNotificationsPage from './pages/BoardNotificationsPage';
import FeeStructureManagement from './pages/FeeStructureManagement';
import AIHistoryPage from './pages/AIHistoryPage';
import FrontOfficePage from './pages/FrontOfficePage';
import TransportPage from './pages/TransportPage';
import HealthModulePage from './pages/HealthModulePage';
import BiometricPage from './pages/BiometricPage';
import DirectorAIDashboard from './pages/DirectorAIDashboard';
import MultiYearFeesPage from './pages/MultiYearFeesPage';
import SalaryTrackingPage from './pages/SalaryTrackingPage';
import StudentReceiptsPage from './pages/StudentReceiptsPage';
import UnifiedPortal from './pages/UnifiedPortal';
import TinoBrainDashboard from './pages/TinoBrainDashboard';
import AdmitCardManagementFixed from './pages/AdmitCardManagementFixed';
import SetupGuidePage from './pages/SetupGuidePage';
import SuperAdminPanel from './pages/SuperAdminPanel';
import TeacherRoleManager from './pages/TeacherRoleManager';
import SchoolCalendarPage from './pages/SchoolCalendarPage';
import ComplaintFeedbackPage from './pages/ComplaintFeedbackPage';
import PrayerSystemPage from './pages/PrayerSystemPage';
import EventDesignerPage from './pages/EventDesignerPage';
import FamilyPortalPage from './pages/FamilyPortalPage';
import ParentPortalPage from './pages/ParentPortalPage';
import StudyTinoLoginPage from './pages/StudyTinoLoginPage';
import ParentPaymentPortal from './pages/ParentPaymentPortal';
import SchoolManagementPage from './pages/SchoolManagementPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import LogoWatermarkSettings from './pages/LogoWatermarkSettings';
import FeeManagementPage from './pages/FeeManagementPage';
import TimetableManagement from './pages/TimetableManagement';
import CertificateGenerator from './pages/CertificateGenerator';
import ExamReportCard from './pages/ExamReportCard';
import TinoAICenter from './pages/AIJarvisCenter';
import TinoAIAgent from './pages/TinoAIAgent';
import SchoolFeedPage from './pages/SchoolFeedPage';
import StudentWalletPage from './pages/StudentWalletPage';
import EStorePage from './pages/EStorePage';
import MultiBranchPage from './pages/MultiBranchPage';
import AIStaffAttendancePage from './pages/AIStaffAttendancePage';
import TallyIntegrationPage from './pages/TallyIntegrationPage';

import IntegratedCommunicationPage from './pages/IntegratedCommunicationPage';
import UnifiedMobileAppPage from './pages/UnifiedMobileAppPage';
import IntegrationsHubPage from './pages/IntegrationsHubPage';
import CreditSystemPage from './pages/CreditSystemPage';
import AdmissionCRMPage from './pages/AdmissionCRMPage';
import HomeworkPage from './pages/HomeworkPage';
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import InventoryPage from './pages/InventoryPage';
import HostelPage from './pages/HostelPage';
import LiveClassesPage from './pages/LiveClassesPage';
import CourseManagementPage from './pages/CourseManagementPage';
import MarketingCampaignPage from './pages/MarketingCampaignPage';

import PWAInstallPrompt from './components/PWAInstallPrompt';
import { TrialBanner, SupportFAB } from './components/TrialMode';
import NoticePopup from './components/NoticePopup';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner w-12 h-12" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = "/login" }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner w-12 h-12" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user?.role)) {
    if (user?.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user?.role === 'teacher') return <Navigate to="/portal" replace />;
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

const StudentOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner w-12 h-12" /></div>;
  if (!isAuthenticated) return <Navigate to="/studytino" replace />;
  if (user?.role !== 'student') return <Navigate to="/app/dashboard" replace />;
  return children;
};

const AdminOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner w-12 h-12" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const adminRoles = ['director', 'principal', 'vice_principal', 'co_director'];
  if (!adminRoles.includes(user?.role)) {
    if (user?.role === 'student') return <Navigate to="/student-dashboard" replace />;
    return <Navigate to="/portal" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="spinner w-12 h-12" /></div>;
  if (isAuthenticated && user) {
    const role = user.role;
    if (['teacher', 'admission_staff', 'clerk', 'staff', 'admin_staff', 'accountant', 'principal', 'vice_principal', 'co_director'].includes(role)) return <Navigate to="/portal" replace />;
    if (role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (role === 'director') return <Navigate to="/app/dashboard" replace />;
    return <Navigate to="/portal" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/owner-x7k9m2" element={<SuperAdminPanel />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/teachtino" element={<TeachTinoLogin />} />
      <Route path="/studytino/receipts" element={<StudentOnlyRoute><StudentReceiptsPage /></StudentOnlyRoute>} />
      <Route path="/student-dashboard" element={<StudentOnlyRoute><StudentDashboard /></StudentOnlyRoute>} />

      <Route path="/app" element={<AdminOnlyRoute><Layout /></AdminOnlyRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="school-analytics" element={<SchoolAnalytics />} />
        <Route path="users" element={<Navigate to="/app/employee-management" replace />} />
        <Route path="permission-manager" element={<Navigate to="/app/employee-management" replace />} />
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
        <Route path="timetable" element={<TimetableManagement />} />
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
        <Route path="school-feed" element={<SchoolFeedPage />} />
        <Route path="student-wallet" element={<StudentWalletPage />} />
        <Route path="e-store" element={<EStorePage />} />
        <Route path="multi-branch" element={<MultiBranchPage />} />
        <Route path="ai-staff-attendance" element={<AIStaffAttendancePage />} />
        <Route path="tally-integration" element={<TallyIntegrationPage />} />
        <Route path="visitor-pass" element={<FrontOfficePage />} />

        <Route path="integrated-comm" element={<IntegratedCommunicationPage />} />
        <Route path="mobile-app" element={<UnifiedMobileAppPage />} />
        <Route path="integrations" element={<IntegrationsHubPage />} />
        <Route path="credit-system" element={<CreditSystemPage />} />
        <Route path="admission-crm" element={<AdmissionCRMPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="digital-library" element={<DigitalLibraryPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="hostel" element={<HostelPage />} />
        <Route path="live-classes" element={<LiveClassesPage />} />
        <Route path="course-management" element={<CourseManagementPage />} />
        <Route path="marketing" element={<MarketingCampaignPage />} />
      </Route>
      
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/students" element={<Navigate to="/app/students" replace />} />
      <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
      <Route path="/classes" element={<Navigate to="/app/classes" replace />} />
      <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
      <Route path="/attendance" element={<Navigate to="/app/attendance" replace />} />
      <Route path="/notices" element={<Navigate to="/app/notices" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

      <Route path="/teacher-dashboard" element={<RoleProtectedRoute allowedRoles={['teacher', 'principal', 'vice_principal']} redirectTo="/login"><TeachTinoDashboard /></RoleProtectedRoute>} />
      <Route path="/portal" element={<RoleProtectedRoute allowedRoles={['teacher', 'admission_staff', 'clerk', 'staff', 'admin_staff', 'accountant', 'principal', 'vice_principal', 'co_director']} redirectTo="/login"><UnifiedPortal /></RoleProtectedRoute>} />
      <Route path="/studytino" element={<StudyTinoLoginPage />} />
      <Route path="/parent-portal" element={<ParentPortalPage />} />
      <Route path="/fee-payment" element={<ProtectedRoute><FeePaymentPage /></ProtectedRoute>} />
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}

function PWAInstallPromptWrapper() {
  return <PWAInstallPrompt />;
}

function SmartRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  const role = user.role;
  if (role === 'student') return <Navigate to="/student-dashboard" replace />;
  if (role === 'director') return <Navigate to="/app/dashboard" replace />;
  return <Navigate to="/portal" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
          <PWAInstallPromptWrapper />
          <NoticePopup />
          <SupportFAB />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
          />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
