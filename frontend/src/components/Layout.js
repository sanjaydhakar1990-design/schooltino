import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

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
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="sticky top-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-md">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Home</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-medium">{currentPage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <Bell className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/app/profile')} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">{user?.name?.charAt(0) || 'U'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
