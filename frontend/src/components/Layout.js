import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, MapPin, Phone, Mail, Hash, GraduationCap } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { GlobalWatermark } from './SchoolLogoWatermark';

const breadcrumbMap = {
  '/app/dashboard': 'Dashboard',
  '/app/students': 'Students',
  '/app/classes': 'Classes',
  '/app/attendance': 'Attendance',
  '/app/fee-management': 'Fee Management',
  '/app/fees': 'Fees',
  '/app/employee-management': 'Staff',
  '/app/leave': 'Leave',
  '/app/salary': 'Salary',
  '/app/notices': 'Notices',
  '/app/sms': 'SMS',
  '/app/meetings': 'Meetings',
  '/app/gallery': 'Gallery',
  '/app/tino-ai': 'Tino AI',
  '/app/tino-brain': 'Tino Brain',
  '/app/ai-paper': 'AI Paper',
  '/app/transport': 'Transport',
  '/app/health': 'Health',
  '/app/biometric': 'Biometric',
  '/app/cctv': 'CCTV',
  '/app/school-management': 'School Profile',
  '/app/school-analytics': 'Analytics',
  '/app/setup-wizard': 'Setup',
  '/app/logo-settings': 'Logo',
  '/app/timetable-management': 'Timetable',
  '/app/exam-report': 'Exams',
  '/app/certificates': 'Certificates',
  '/app/admit-cards': 'Admit Cards',
  '/app/accountant': 'Accountant',
  '/app/permission-manager': 'Permissions',
  '/app/event-designer': 'Event Designer',
  '/app/school-calendar': 'Calendar',
  '/app/family-portal': 'Family Portal',
  '/app/complaints': 'Complaints',
  '/app/board-notifications': 'Board Updates',
  '/app/prayer-system': 'Prayer System',
  '/app/website': 'Website',
  '/app/visitor-pass': 'Visitor Pass',
  '/app/school-feed': 'School Feed',
  '/app/student-wallet': 'Student Wallet',
  '/app/e-store': 'e-Store',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, schoolData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || user?.school_name;
  const currentPage = breadcrumbMap[location.pathname] || 'Page';

  useEffect(() => {
    if (schoolName) {
      document.title = schoolName;
    }
  }, [schoolName]);

  useEffect(() => {
    if (schoolLogo && (schoolLogo.startsWith('data:') || schoolLogo.startsWith('http') || schoolLogo.startsWith('/'))) {
      try {
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(icon => icon.remove());
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        faviconLink.href = schoolLogo;
        document.head.appendChild(faviconLink);
      } catch (error) {
        console.error('Failed to update icon:', error);
      }
    }
  }, [schoolLogo]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="sticky top-0 z-30">
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 lg:px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img src={schoolLogo} alt={schoolName} className="w-10 h-10 rounded-lg object-cover bg-white/10 p-0.5" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-sm lg:text-base font-bold leading-tight">{schoolName || 'Schooltino'}</h1>
                  {schoolData?.address && (
                    <p className="text-[10px] lg:text-xs text-blue-200 leading-tight truncate max-w-[200px] lg:max-w-none">
                      {schoolData.address}{schoolData.city ? `, ${schoolData.city}` : ''}{schoolData.state ? `, ${schoolData.state}` : ''}{schoolData.pincode ? ` - ${schoolData.pincode}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-blue-200">
                {schoolData?.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{schoolData.phone}</span>
                )}
                {schoolData?.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{schoolData.email}</span>
                )}
                {schoolData?.registration_number && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Reg: {schoolData.registration_number}</span>
                )}
                {schoolData?.board_type && (
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white text-[10px] font-semibold">{schoolData.board_type}</span>
                )}
              </div>
            </div>
          </div>

          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Home</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-semibold">{currentPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
              </button>
              <button className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>
              <button onClick={() => navigate('/app/profile')} className="w-9 h-9 gradient-card-blue rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || 'U'}</span>
              </button>
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          <GlobalWatermark />
          <div className="p-4 md:p-6 lg:p-8 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
