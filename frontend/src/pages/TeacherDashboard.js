import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  Users, BookOpen, Calendar, Bell, ClipboardCheck, 
  ChevronRight, GraduationCap, Clock, FileText, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/teacher/dashboard`);
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-dashboard">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">
              नमस्ते, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-emerald-100 mt-1">
              TeachTino - Your Teaching Assistant
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.my_classes?.length || 0}</p>
              <p className="text-sm text-slate-500">My Classes</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_students || 0}</p>
              <p className="text-sm text-slate-500">Total Students</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.attendance_today?.present || 0}/{(stats?.attendance_today?.present || 0) + (stats?.attendance_today?.absent || 0)}
              </p>
              <p className="text-sm text-slate-500">Present Today</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending_homework || 0}</p>
              <p className="text-sm text-slate-500">Pending Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Classes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">My Classes</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.my_classes?.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No classes assigned yet</p>
              </div>
            ) : (
              stats?.my_classes?.map((cls, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-indigo-600">{cls.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{cls.name} - {cls.section}</p>
                      <p className="text-sm text-slate-500">{cls.student_count || 0} students</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">
                <ClipboardCheck className="w-5 h-5 mr-3" />
                Mark Attendance
              </Button>
              <Button className="w-full justify-start bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                <FileText className="w-5 h-5 mr-3" />
                Create Homework
              </Button>
              <Button className="w-full justify-start bg-amber-50 text-amber-700 hover:bg-amber-100 border-0">
                <Sparkles className="w-5 h-5 mr-3" />
                AI Paper Generator
              </Button>
              <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border-0">
                <Bell className="w-5 h-5 mr-3" />
                Send Notice
              </Button>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Notices</h3>
            {stats?.recent_notices?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent notices</p>
            ) : (
              <div className="space-y-3">
                {stats?.recent_notices?.map((notice, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">{notice.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Today's Schedule</h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { time: '8:00 AM', class: 'Class 10-A', subject: 'Mathematics' },
            { time: '9:30 AM', class: 'Class 9-B', subject: 'Mathematics' },
            { time: '11:00 AM', class: 'Class 8-A', subject: 'Mathematics' },
            { time: '1:00 PM', class: 'Class 10-B', subject: 'Mathematics' }
          ].map((slot, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{slot.time}</span>
              </div>
              <p className="font-semibold text-slate-900">{slot.class}</p>
              <p className="text-sm text-slate-500">{slot.subject}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-400 mt-4">
          Timetable feature coming soon...
        </p>
      </div>
    </div>
  );
}
