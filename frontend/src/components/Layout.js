import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6 md:p-8 lg:p-10 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
