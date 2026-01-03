import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  User, Calendar, Wallet, Bell, BookOpen, Clock, 
  CheckCircle2, XCircle, Download, LogOut, School,
  ChevronRight, TrendingUp, Award
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/student/dashboard`);
      setDashboard(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  const profile = dashboard?.profile || {};
  const attendance = dashboard?.attendance_summary || {};
  const feeStatus = dashboard?.fee_status || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white" data-testid="student-dashboard">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl">StudyTino</h1>
                <p className="text-amber-100 text-xs">Student Portal</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <User className="w-10 h-10 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-amber-100">
                  {profile.class_name} - {profile.section}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    ID: {profile.student_id}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Roll: {profile.admission_no}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-amber-50/50">
            <div className="text-center">
              <p className="text-xs text-slate-500">Father's Name</p>
              <p className="font-medium text-slate-900">{profile.father_name}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Mother's Name</p>
              <p className="font-medium text-slate-900">{profile.mother_name}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Date of Birth</p>
              <p className="font-medium text-slate-900">{profile.dob}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Contact</p>
              <p className="font-medium text-slate-900">{profile.mobile}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Attendance Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Attendance
              </h3>
              <span className="text-2xl font-bold text-indigo-600">
                {attendance.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${attendance.percentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Present: {attendance.present || 0}
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <XCircle className="w-4 h-4" />
                Absent: {attendance.absent || 0}
              </span>
            </div>
          </div>

          {/* Fee Status Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Fee Status
              </h3>
            </div>
            {feeStatus.pending > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-rose-700 text-sm">Pending Amount</p>
                <p className="text-2xl font-bold text-rose-700">₹{feeStatus.pending?.toLocaleString()}</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-700 text-sm">All Dues</p>
                <p className="text-2xl font-bold text-emerald-700">Cleared ✓</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-3">
              View Fee History
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2 text-indigo-600" />
                Download ID Card
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2 text-amber-600" />
                View Report Card
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2 text-emerald-600" />
                My Homework
              </Button>
            </div>
          </div>
        </div>

        {/* Notices Section */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              School Notices
            </h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard?.recent_notices?.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No recent notices</p>
              </div>
            ) : (
              dashboard?.recent_notices?.map((notice, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notice.priority === 'urgent' ? 'bg-rose-500' :
                      notice.priority === 'high' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{notice.title}</p>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notice.content}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notice.created_at).toLocaleDateString('hi-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timetable Placeholder */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Today's Timetable
            </h3>
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('hi-IN', { weekday: 'long' })}
            </span>
          </div>
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Timetable feature coming soon...</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-slate-400 text-sm">
          <p>StudyTino - A part of Schooltino Smart School System</p>
        </div>
      </main>
    </div>
  );
}
