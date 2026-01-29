/**
 * STUDENT ATTENDANCE VIEW & LEAVE APPLICATION
 * For StudyTino Portal
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  CalendarCheck, CheckCircle, XCircle, Heart, Clock,
  TrendingUp, AlertCircle, Send, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudentAttendanceView({ studentId, schoolId }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    if (studentId && schoolId) {
      fetchAttendance();
      fetchStats();
    }
  }, [studentId, schoolId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/attendance/student/${studentId}?school_id=${schoolId}&limit=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceData(response.data.attendance || []);
    } catch (error) {
      console.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/attendance/student/${studentId}/stats?school_id=${schoolId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const applyLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance/student/apply-leave`, {
        school_id: schoolId,
        student_id: studentId,
        ...leaveForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Leave application sent! Approval pending.');
      setShowLeaveDialog(false);
      fetchAttendance();
    } catch (error) {
      toast.error('Leave apply करने में समस्या');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'absent': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'late': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'on_leave': return <Heart className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-600">{stats?.present_percentage || 0}%</div>
          <div className="text-xs text-emerald-700">Attendance</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
          <div className="text-2xl font-bold text-rose-600">{stats?.absent_days || 0}</div>
          <div className="text-xs text-rose-700">Absent Days</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats?.leave_days || 0}</div>
          <div className="text-xs text-blue-700">Leaves</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-2xl font-bold text-amber-600">{stats?.late_days || 0}</div>
          <div className="text-xs text-amber-700">Late</div>
        </div>
      </div>

      {/* Apply Leave Button */}
      <Button
        onClick={() => setShowLeaveDialog(true)}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Heart className="w-4 h-4 mr-2" />
        Apply for Leave
      </Button>

      {/* Attendance History */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Last 30 Days Attendance</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance records
            </div>
          ) : (
            attendanceData.map((record, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium">{new Date(record.date).toLocaleDateString('en-IN')}</div>
                  <div className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className={`text-sm font-medium capitalize ${
                    record.status === 'present' ? 'text-emerald-600' :
                    record.status === 'absent' ? 'text-rose-600' :
                    record.status === 'late' ? 'text-amber-600' :
                    record.status === 'on_leave' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leave Application Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-blue-600" />
              Apply for Leave
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Leave Type</Label>
              <select
                value={leaveForm.leave_type}
                onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
              >
                <option value="sick">Sick Leave (बीमारी)</option>
                <option value="medical">Medical Leave (डॉक्टर)</option>
                <option value="family">Family Function (घर का काम)</option>
                <option value="other">Other (अन्य)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                  min={leaveForm.start_date}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
                rows="3"
                placeholder="Leave का कारण बताएं..."
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ Leave application class teacher के पास approval के लिए जाएगा।
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLeaveDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={applyLeave}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
