/**
 * TEACHER ATTENDANCE MANAGEMENT
 * For TeachTino Portal
 * - Daily attendance marking
 * - Leave application
 * - Approval notifications
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  CalendarCheck, CheckCircle, XCircle, Clock, Save, Loader2,
  Heart, Users, Bell, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeacherAttendancePortal() {
  const { user, schoolId } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [myLeaveForm, setMyLeaveForm] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    if (user?.id && schoolId) {
      fetchMyClasses();
      fetchPendingLeaveApprovals();
    }
  }, [user, schoolId]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchMyClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get classes where this teacher is class teacher
      const response = await axios.get(
        `${API}/classes?school_id=${schoolId}&class_teacher_id=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClasses(response.data || []);
      if (response.data?.length > 0) {
        setSelectedClass(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchPendingLeaveApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/attendance/pending-leaves?approver_id=${user.id}&school_id=${schoolId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Failed to fetch pending leaves');
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const studentsRes = await axios.get(
        `${API}/students?school_id=${schoolId}&class_id=${selectedClass}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(studentsRes.data);

      const attendanceRes = await axios.get(
        `${API}/attendance?class_id=${selectedClass}&date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const attendanceMap = {};
      attendanceRes.data.forEach(att => {
        attendanceMap[att.student_id] = att.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      toast.error('Data fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status: status
      }));

      await axios.post(`${API}/attendance/bulk`, {
        class_id: selectedClass,
        school_id: schoolId,
        date: selectedDate,
        attendance: attendanceData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('✅ Attendance saved!');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const approveLeave = async (leaveId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance/approve-leave`, {
        leave_id: leaveId,
        approved: approve,
        approved_by: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(approve ? '✅ Leave approved!' : '❌ Leave rejected!');
      fetchPendingLeaveApprovals();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const applyMyLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance/teacher/apply-leave`, {
        school_id: schoolId,
        teacher_id: user.id,
        ...myLeaveForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Leave application sent to admin!');
      setShowLeaveDialog(false);
    } catch (error) {
      toast.error('Leave apply failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Attendance</h1>
        <div className="flex gap-2">
          {pendingLeaves.length > 0 && (
            <div className="relative">
              <Button variant="outline" className="relative">
                <Bell className="w-4 h-4 mr-2" />
                Leave Approvals
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingLeaves.length}
                </span>
              </Button>
            </div>
          )}
          <Button onClick={() => setShowLeaveDialog(true)}>
            <Heart className="w-4 h-4 mr-2" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingLeaves.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Pending Leave Approvals ({pendingLeaves.length})
          </h3>
          <div className="space-y-2">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{leave.student_name}</div>
                  <div className="text-sm text-gray-600">
                    {leave.leave_type} • {leave.start_date} to {leave.end_date}
                  </div>
                  {leave.reason && (
                    <div className="text-xs text-gray-500 mt-1">{leave.reason}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveLeave(leave.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => approveLeave(leave.id, false)}
                    className="text-red-600"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Controls */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Select Class</Label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-10 rounded-lg border px-3 mt-1"
            >
              <option value="">Choose Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Select Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>
        </div>

        {selectedClass && (
          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Attendance
          </Button>
        )}
      </div>

      {/* Students List */}
      {selectedClass && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">#</th>
                  <th className="text-left px-4 py-2 text-sm">Student</th>
                  <th className="text-left px-4 py-2 text-sm">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.student_id}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`p-2 rounded ${attendance[student.id] === 'present' ? 'bg-emerald-100' : 'hover:bg-gray-100'}`}
                        >
                          <CheckCircle className={`w-5 h-5 ${attendance[student.id] === 'present' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`p-2 rounded ${attendance[student.id] === 'absent' ? 'bg-rose-100' : 'hover:bg-gray-100'}`}
                        >
                          <XCircle className={`w-5 h-5 ${attendance[student.id] === 'absent' ? 'text-rose-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`p-2 rounded ${attendance[student.id] === 'late' ? 'bg-amber-100' : 'hover:bg-gray-100'}`}
                        >
                          <Clock className={`w-5 h-5 ${attendance[student.id] === 'late' ? 'text-amber-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'on_leave')}
                          className={`p-2 rounded ${attendance[student.id] === 'on_leave' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        >
                          <Heart className={`w-5 h-5 ${attendance[student.id] === 'on_leave' ? 'text-blue-600' : 'text-gray-400'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Leave Application Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Leave Type</Label>
              <select
                value={myLeaveForm.leave_type}
                onChange={(e) => setMyLeaveForm({...myLeaveForm, leave_type: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
              >
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="medical">Medical Leave</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={myLeaveForm.start_date}
                  onChange={(e) => setMyLeaveForm({...myLeaveForm, start_date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={myLeaveForm.end_date}
                  onChange={(e) => setMyLeaveForm({...myLeaveForm, end_date: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <textarea
                value={myLeaveForm.reason}
                onChange={(e) => setMyLeaveForm({...myLeaveForm, reason: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
                rows="3"
              />
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
                onClick={applyMyLeave}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
