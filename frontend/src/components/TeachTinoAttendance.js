import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  ChevronLeft, ChevronDown, Save, CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function TeachTinoAttendance({ onBack }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-classes`, { headers: getHeaders() });
      const cls = Array.isArray(res.data) ? res.data : [];
      setClasses(cls);
      if (cls.length === 1) {
        selectClass(cls[0]);
      }
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setShowClassPicker(false);
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.allSettled([
        axios.get(`${API}/teacher/class/${cls.id}/students`, { headers: getHeaders() }),
        axios.get(`${API}/attendance?class_id=${cls.id}&date=${date}`, { headers: getHeaders() })
      ]);

      const studentList = studentsRes.status === 'fulfilled' ? (Array.isArray(studentsRes.value.data) ? studentsRes.value.data : []) : [];
      const existingAtt = attendanceRes.status === 'fulfilled' ? (Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : []) : [];

      setStudents(studentList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setExistingAttendance(existingAtt);

      const map = {};
      studentList.forEach(s => { map[s.id] = 'present'; });
      existingAtt.forEach(a => { map[a.student_id] = a.status; });
      setAttendanceMap(map);
    } catch (e) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (selectedClass) {
      loadStudentsForDate(selectedClass, newDate);
    }
  };

  const loadStudentsForDate = async (cls, dateStr) => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.allSettled([
        axios.get(`${API}/teacher/class/${cls.id}/students`, { headers: getHeaders() }),
        axios.get(`${API}/attendance?class_id=${cls.id}&date=${dateStr}`, { headers: getHeaders() })
      ]);

      const studentList = studentsRes.status === 'fulfilled' ? (Array.isArray(studentsRes.value.data) ? studentsRes.value.data : []) : [];
      const existingAtt = attendanceRes.status === 'fulfilled' ? (Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : []) : [];

      setStudents(studentList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setExistingAttendance(existingAtt);

      const map = {};
      studentList.forEach(s => { map[s.id] = 'present'; });
      existingAtt.forEach(a => { map[a.student_id] = a.status; });
      setAttendanceMap(map);
    } catch (e) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId) => {
    setAttendanceMap(prev => {
      const current = prev[studentId] || 'present';
      const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
      return { ...prev, [studentId]: next };
    });
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  const submitAttendance = async () => {
    if (!selectedClass || students.length === 0) return;
    setSubmitting(true);
    try {
      const attendanceData = students.map(s => ({
        student_id: s.id,
        status: attendanceMap[s.id] || 'present',
        remarks: ''
      }));

      await axios.post(`${API}/attendance/bulk`, {
        class_id: selectedClass.id,
        school_id: user?.school_id,
        date: date,
        attendance: attendanceData
      }, { headers: getHeaders() });

      toast.success(`Attendance saved for ${selectedClass.name || 'class'}!`);
    } catch (error) {
      const msg = error?.response?.data?.detail || 'Failed to save attendance';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length;

  if (loading && !selectedClass) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-bold text-gray-800">Mark Attendance</h2>
        <div></div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <button
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between"
          >
            <span className={selectedClass ? 'text-gray-800 font-medium' : 'text-gray-400'}>
              {selectedClass ? `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ''}` : 'Select Class'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showClassPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => selectClass(cls)}
                  className="w-full p-2.5 text-left text-sm hover:bg-green-50 border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-800">{cls.name}</span>
                  {cls.section && <span className="text-gray-400 ml-1">- {cls.section}</span>}
                  <span className="text-xs text-gray-400 ml-2">({cls.student_count || 0} students)</span>
                </button>
              ))}
              {classes.length === 0 && (
                <p className="p-3 text-sm text-gray-400 text-center">No classes assigned</p>
              )}
            </div>
          )}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {selectedClass && students.length > 0 && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-700">{presentCount} Present</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 rounded-lg">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-700">{absentCount} Absent</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">{lateCount} Late</span>
            </div>
            <div className="ml-auto flex gap-1">
              <button onClick={() => markAll('present')} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">All Present</button>
              <button onClick={() => markAll('absent')} className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">All Absent</button>
            </div>
          </div>

          {existingAttendance.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">Attendance already marked for this date - editing mode</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {students.map((student, idx) => {
                const status = attendanceMap[student.id] || 'present';
                return (
                  <div key={student.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                    <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                      <p className="text-[10px] text-gray-400">{student.student_id || student.roll_number || ''}</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(student.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        status === 'present' ? 'bg-green-100 text-green-700 border border-green-200' :
                        status === 'absent' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={submitAttendance}
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Attendance ({students.length} students)</>
            )}
          </Button>
        </>
      )}

      {selectedClass && students.length === 0 && !loading && (
        <div className="text-center py-10">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No students found in this class</p>
        </div>
      )}

      {!selectedClass && classes.length === 0 && (
        <div className="text-center py-10">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No classes assigned to you yet</p>
          <p className="text-xs text-gray-400 mt-1">Ask your admin to assign classes</p>
        </div>
      )}
    </div>
  );
}
