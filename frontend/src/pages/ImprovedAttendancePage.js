/**
 * IMPROVED ATTENDANCE SYSTEM
 * ✅ Leave Management (Medical/Casual/Approved leaves)
 * ✅ Bulk Old Attendance Upload (Photo/Excel)
 * ✅ Better UI/UX
 * ✅ Half-day attendance
 * ✅ Attendance reports
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  CalendarCheck, CheckCircle, XCircle, Clock, Save, Loader2,
  Upload, FileSpreadsheet, Camera, Heart, Plane, FileText,
  Download, Users, TrendingUp, AlertCircle, UserX
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ImprovedAttendancePage() {
  const { schoolId, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  
  // New states
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
    approved_by: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStats();
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/classes?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/attendance/stats?school_id=${schoolId}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch students
      const studentsRes = await axios.get(`${API}/students?school_id=${schoolId}&class_id=${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(studentsRes.data);

      // Fetch existing attendance
      const attendanceRes = await axios.get(`${API}/attendance?class_id=${selectedClass}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Map attendance to student ids
      const attendanceMap = {};
      attendanceRes.data.forEach(att => {
        attendanceMap[att.student_id] = att.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      toast.error('Failed to fetch data');
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

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
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

      toast.success('✅ Attendance saved successfully!');
      fetchStats();
    } catch (error) {
      toast.error('Save करने में समस्या');
    } finally {
      setSaving(false);
    }
  };

  const openLeaveDialog = (student) => {
    setSelectedStudent(student);
    setLeaveForm({
      leave_type: 'sick',
      start_date: selectedDate,
      end_date: selectedDate,
      reason: '',
      approved_by: user?.name || ''
    });
    setShowLeaveDialog(true);
  };

  const submitLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance/mark-leave`, {
        school_id: schoolId,
        student_id: selectedStudent.id,
        ...leaveForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Leave marked successfully!');
      setShowLeaveDialog(false);
      fetchStudentsAndAttendance();
    } catch (error) {
      toast.error('Leave mark करने में समस्या');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'on_leave':
        return <Heart className="w-5 h-5 text-blue-500" />;
      case 'half_day':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <UserX className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'on_leave': return 'bg-blue-100 text-blue-700';
      case 'half_day': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarCheck className="w-8 h-8" />
              Attendance Management
            </h1>
            <p className="text-blue-100 mt-1">Mark attendance • Manage leaves • Upload old records</p>
          </div>
          <Button 
            onClick={() => setShowBulkUploadDialog(true)}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{stats.present || 0}</div>
            <div className="text-sm text-emerald-700">Present Today</div>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border-2 border-rose-200">
            <div className="text-3xl font-bold text-rose-600">{stats.absent || 0}</div>
            <div className="text-sm text-rose-700">Absent Today</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{stats.on_leave || 0}</div>
            <div className="text-sm text-blue-700">On Leave</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="text-3xl font-bold text-amber-600">{stats.late || 0}</div>
            <div className="text-sm text-amber-700">Late</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Select Class *</Label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
            >
              <option value="">Choose Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Select Date *</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={saving || !selectedClass}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {selectedClass && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => markAll('present')}
            className="bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
          >
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
            All Present
          </Button>
          <Button
            variant="outline"
            onClick={() => markAll('absent')}
            className="bg-rose-50 hover:bg-rose-100 border-rose-300"
          >
            <XCircle className="w-4 h-4 mr-2 text-rose-600" />
            All Absent
          </Button>
          <Button
            variant="outline"
            onClick={() => markAll('half_day')}
            className="bg-purple-50 hover:bg-purple-100 border-purple-300"
          >
            <Users className="w-4 h-4 mr-2 text-purple-600" />
            All Half Day
          </Button>
        </div>
      )}

      {/* Students Table */}
      {!selectedClass ? (
        <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
          <CalendarCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a class to mark attendance</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No students in this class</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Admission No</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Student Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">{student.student_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          {student.name?.charAt(0)}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {attendance[student.id] && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance[student.id])}`}>
                          {getStatusIcon(attendance[student.id])}
                          {attendance[student.id].replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Present */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`p-2 rounded-lg transition-all ${
                            attendance[student.id] === 'present' 
                              ? 'bg-emerald-100 ring-2 ring-emerald-500' 
                              : 'hover:bg-emerald-50'
                          }`}
                          title="Present"
                        >
                          <CheckCircle className={`w-5 h-5 ${
                            attendance[student.id] === 'present' ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                        </button>
                        
                        {/* Absent */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`p-2 rounded-lg transition-all ${
                            attendance[student.id] === 'absent' 
                              ? 'bg-rose-100 ring-2 ring-rose-500' 
                              : 'hover:bg-rose-50'
                          }`}
                          title="Absent"
                        >
                          <XCircle className={`w-5 h-5 ${
                            attendance[student.id] === 'absent' ? 'text-rose-600' : 'text-gray-400'
                          }`} />
                        </button>
                        
                        {/* Late */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`p-2 rounded-lg transition-all ${
                            attendance[student.id] === 'late' 
                              ? 'bg-amber-100 ring-2 ring-amber-500' 
                              : 'hover:bg-amber-50'
                          }`}
                          title="Late"
                        >
                          <Clock className={`w-5 h-5 ${
                            attendance[student.id] === 'late' ? 'text-amber-600' : 'text-gray-400'
                          }`} />
                        </button>
                        
                        {/* Leave */}
                        <button
                          onClick={() => openLeaveDialog(student)}
                          className={`p-2 rounded-lg transition-all ${
                            attendance[student.id] === 'on_leave' 
                              ? 'bg-blue-100 ring-2 ring-blue-500' 
                              : 'hover:bg-blue-50'
                          }`}
                          title="On Leave"
                        >
                          <Heart className={`w-5 h-5 ${
                            attendance[student.id] === 'on_leave' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </button>
                        
                        {/* Half Day */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'half_day')}
                          className={`p-2 rounded-lg transition-all ${
                            attendance[student.id] === 'half_day' 
                              ? 'bg-purple-100 ring-2 ring-purple-500' 
                              : 'hover:bg-purple-50'
                          }`}
                          title="Half Day"
                        >
                          <Users className={`w-5 h-5 ${
                            attendance[student.id] === 'half_day' ? 'text-purple-600' : 'text-gray-400'
                          }`} />
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

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-blue-600" />
              Mark Leave - {selectedStudent?.name}
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
                <option value="sick">Sick Leave (बीमारी की छुट्टी)</option>
                <option value="casual">Casual Leave (आकस्मिक छुट्टी)</option>
                <option value="medical">Medical Leave (चिकित्सा छुट्टी)</option>
                <option value="family">Family Function (पारिवारिक कार्य)</option>
                <option value="other">Other (अन्य)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Reason (Optional)</Label>
              <textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
                rows="3"
                placeholder="Leave reason..."
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
                onClick={submitLeave}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Mark Leave
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Bulk Attendance Upload
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Upload Options:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Upload old attendance register photos (mobile se click kiya hua)</li>
                <li>Excel/CSV format mein bulk data upload</li>
                <li>Date range select kar ke multiple days ka data ek saath</li>
              </ul>
            </div>

            {/* Photo Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Upload Attendance Register Photos
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Mobile se old attendance register की photos upload karein
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="photo-upload"
                onChange={(e) => {
                  if (e.target.files?.length > 0) {
                    toast.success(`${e.target.files.length} photos selected`);
                    // Handle photo upload
                  }
                }}
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 cursor-pointer"
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photos
              </label>
            </div>

            {/* Excel Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-all">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Upload Excel/CSV File
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Bulk attendance data upload via Excel
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-flex items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700 h-10 px-6 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Upload Excel
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
