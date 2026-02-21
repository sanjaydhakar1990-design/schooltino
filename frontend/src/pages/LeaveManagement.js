import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar, Clock, CheckCircle, XCircle, Loader2,
  FileText, AlertCircle, User, Send
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function LeaveManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getAccentColor } = useTheme();
  const accent = getAccentColor();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  
  // Director/Principal/VP should see "Pending Approvals" by default, others see "My Leaves"
  const isApprover = ['director', 'principal', 'vice_principal'].includes(user?.role);
  const canApplyLeave = ['teacher', 'staff', 'student'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isApprover && !canApplyLeave ? 'pending' : 'my-leaves');

  const [form, setForm] = useState({
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: '',
    half_day: false
  });

  const leaveTypes = [
    { id: 'sick', name: t('sick_leave'), color: 'rose' },
    { id: 'casual', name: t('casual_leave'), color: 'blue' },
    { id: 'personal', name: t('personal_leave') || 'Personal Leave', color: 'purple' },
    { id: 'emergency', name: t('emergency_leave') || 'Emergency Leave', color: 'amber' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        axios.get(`${API}/leave/my-leaves`),
        axios.get(`${API}/leave/balance`)
      ]);
      setMyLeaves(leavesRes.data);
      setLeaveBalance(balanceRes.data.balance);

      // Fetch pending if authorized
      if (['director', 'principal', 'vice_principal', 'teacher'].includes(user?.role)) {
        const pendingRes = await axios.get(`${API}/leave/pending`);
        setPendingLeaves(pendingRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/leave/apply`, form);
      toast.success('Leave application submitted!');
      setShowApplyDialog(false);
      setForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '', half_day: false });
      fetchData();
    } catch (error) {
      toast.error('Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/approve`);
      toast.success('Leave approved!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/reject`);
      toast.success('Leave rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const canApproveLeave = ['director', 'principal', 'vice_principal', 'teacher'].includes(user?.role);

  return (
    <div className="space-y-6" data-testid="leave-management">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <Calendar className="w-5 h-5" />
            </div>
            {t('leave_management')}
          </h1>
          <p className="text-gray-500 mt-1">
            {canApproveLeave && !canApplyLeave
              ? 'Approve or reject leave applications'
              : 'Apply for leave, check balance & track status'}
          </p>
        </div>
        {canApplyLeave && (
          <Button
            onClick={() => setShowApplyDialog(true)}
            className="gap-2 text-white"
            style={{ backgroundColor: accent }}
          >
            <Send className="w-4 h-4" />
            {t('apply_leave')}
          </Button>
        )}
      </div>

      {/* Leave Balance Cards */}
      {leaveBalance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(leaveBalance).map(([type, data]) => {
            const typeInfo = leaveTypes.find(t => t.id === type) || { name: type, color: 'slate' };
            return (
              <div key={type} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 capitalize">{typeInfo.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{data.remaining}</span>
                  <span className="text-sm text-slate-400 mb-1">/ {data.total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div 
                    className={`bg-${typeInfo.color}-500 h-2 rounded-full`}
                    style={{ width: `${(data.remaining / data.total) * 100}%`, backgroundColor: typeInfo.color === 'rose' ? '#f43f5e' : typeInfo.color === 'blue' ? '#3b82f6' : typeInfo.color === 'purple' ? '#a855f7' : '#f59e0b' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          {canApplyLeave && (
            <TabsTrigger value="my-leaves">{t('leave_management')}</TabsTrigger>
          )}
          {canApproveLeave && (
            <TabsTrigger value="pending">
              {t('pending')}
              {pendingLeaves.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {pendingLeaves.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Leaves Tab */}
        <TabsContent value="my-leaves" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {myLeaves.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No leave applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myLeaves.map(leave => (
                  <div key={leave.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 capitalize">{leave.leave_type} Leave</span>
                          {getStatusBadge(leave.status)}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {leave.from_date} to {leave.to_date} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                        </p>
                        <p className="text-sm text-slate-600 mt-2">{leave.reason}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {new Date(leave.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {pendingLeaves.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500">No pending approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="font-medium text-slate-900">{leave.applicant_name}</span>
                          <span className="text-xs text-slate-500 capitalize">({leave.applicant_type})</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 capitalize">
                          {leave.leave_type} Leave: {leave.from_date} to {leave.to_date} ({leave.days} days)
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{leave.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(leave.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('approve')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(leave.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {t('reject')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('apply_leave')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('leave_type')}</Label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm(f => ({ ...f, leave_type: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
              >
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('from_date')}</Label>
                <Input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm(f => ({ ...f, from_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('to_date')}</Label>
                <Input
                  type="date"
                  value={form.to_date}
                  onChange={(e) => setForm(f => ({ ...f, to_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="half_day"
                checked={form.half_day}
                onChange={(e) => setForm(f => ({ ...f, half_day: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="half_day">Half Day</Label>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Enter reason for leave..."
                rows={3}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
