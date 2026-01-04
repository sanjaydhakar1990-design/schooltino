import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Activity,
  Users,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Bell,
  Loader2,
  TrendingUp,
  UserCheck,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminActivityDashboard() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const fetchData = async () => {
    try {
      const [overviewRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard-overview/${schoolId}`, { headers }),
        axios.get(`${API}/admin/teacher-activities/${schoolId}?limit=30`, { headers })
      ]);
      
      setOverview(overviewRes.data);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create_exam':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'mark_attendance':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'create_notice':
        return <Bell className="w-4 h-4 text-amber-600" />;
      case 'submit_exam':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'apply_leave':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionText = (action, details) => {
    switch (action) {
      case 'create_exam':
        return `Created exam: ${details?.title || 'New Exam'}`;
      case 'mark_attendance':
        return `Marked attendance for ${details?.class_name || 'class'}`;
      case 'create_notice':
        return `Posted notice: ${details?.title || 'New Notice'}`;
      case 'submit_exam':
        return `Submitted exam with ${details?.score || 0}% score`;
      case 'apply_leave':
        return `Applied for leave`;
      case 'add_student':
        return `Added new student: ${details?.name || 'Student'}`;
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-activity">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-600" />
            Activity Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Real-time overview of what's happening in your school</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Today's Summary */}
      {overview && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Today's Summary</h2>
          <p className="text-indigo-100">{overview.summary}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {overview?.stats?.exams_created || 0}
              </p>
              <p className="text-sm text-slate-500">Exams Created</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {overview?.stats?.attendance_marked || 0}
              </p>
              <p className="text-sm text-slate-500">Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {overview?.stats?.leaves_pending || 0}
              </p>
              <p className="text-sm text-slate-500">Pending Leaves</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {overview?.stats?.notices_posted || 0}
              </p>
              <p className="text-sm text-slate-500">Notices</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {overview?.stats?.active_teachers || 0}
              </p>
              <p className="text-sm text-slate-500">Active Teachers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Recent Activities
        </h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{activity.user_name || 'User'}</span>
                    <span className="text-slate-500 mx-1">•</span>
                    <span className="text-slate-600 capitalize">{activity.user_role}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {getActionText(activity.action, activity.details)}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatTime(activity.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
