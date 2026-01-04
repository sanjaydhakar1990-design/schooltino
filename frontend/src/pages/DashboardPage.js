import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users,
  UserCog,
  GraduationCap,
  Wallet,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrialStatusCard } from '../components/TrialMode';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats?school_id=${schoolId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceData = stats ? [
    { name: t('present'), value: stats.attendance_today.present, color: '#10B981' },
    { name: t('absent'), value: stats.attendance_today.absent, color: '#EF4444' },
    { name: t('late'), value: stats.attendance_today.late, color: '#F59E0B' }
  ] : [];

  const feeData = [
    { name: 'Jan', collected: 45000, pending: 12000 },
    { name: 'Feb', collected: 52000, pending: 8000 },
    { name: 'Mar', collected: 48000, pending: 15000 },
    { name: 'Apr', collected: 55000, pending: 10000 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20" data-testid="no-school-message">
        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No School Selected</h2>
        <p className="text-slate-500">Please create or select a school from Settings to view dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900">{t('dashboard')}</h1>
        <p className="text-slate-500 mt-1">Overview of your school's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label={t('total_students')}
          value={stats?.total_students || 0}
          trend="+12%"
          color="indigo"
          testId="stat-students"
        />
        <StatCard
          icon={UserCog}
          label={t('total_staff')}
          value={stats?.total_staff || 0}
          trend="+3%"
          color="emerald"
          testId="stat-staff"
        />
        <StatCard
          icon={GraduationCap}
          label={t('total_classes')}
          value={stats?.total_classes || 0}
          color="amber"
          testId="stat-classes"
        />
        <StatCard
          icon={Wallet}
          label={t('fee_collected')}
          value={`₹${(stats?.fee_collection_month || 0).toLocaleString()}`}
          subtext={`${t('pending_fees')}: ₹${(stats?.pending_fees || 0).toLocaleString()}`}
          color="rose"
          testId="stat-fees"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-4 stat-card" data-testid="attendance-chart">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('attendance_today')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {attendanceData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Collection Chart */}
        <div className="lg:col-span-8 stat-card" data-testid="fee-chart">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Fee Collection Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="collected" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="pending" fill="#F97316" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notices */}
        <div className="stat-card" data-testid="recent-notices">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{t('recent_notices')}</h3>
            <a href="/notices" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {stats?.recent_notices?.length > 0 ? (
              stats.recent_notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-3 rounded-lg border border-slate-100 priority-${notice.priority}`}
                >
                  <p className="font-medium text-slate-800">{notice.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No recent notices</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="stat-card" data-testid="recent-activities">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{t('recent_activities')}</h3>
            <a href="/audit-logs" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {stats?.recent_activities?.length > 0 ? (
              stats.recent_activities.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{activity.user_name || 'User'}</span>
                      {' '}{activity.action} in {activity.module}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, subtext, color, testId }) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="stat-card" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="badge badge-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-heading text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
