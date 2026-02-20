import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import {
  Users, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  ChevronLeft, ChevronDown, Save, CalendarDays, Eye, Shield
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
  const [canEdit, setCanEdit] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-classes`, { headers: getHeaders() });
      const cls = Array.isArray(res.data) ? res.data : [];
      setClasses(cls);
      if (cls.length === 1) {
        setSelectedClass(cls[0]);
        setCanEdit(cls[0].can_edit_attendance !== false);
        loadStudentsForDate(cls[0], date);
      }
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = (cls) => {
    setSelectedClass(cls);
    setCanEdit(cls.can_edit_attendance !== false);
    setShowClassPicker(false);
    loadStudentsForDate(cls, date);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (selectedClass) loadStudentsForDate(selectedClass, newDate);
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

  const setStatus = (studentId, status) => {
    if (!canEdit) return;
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    if (!canEdit) return;
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  const submitAttendance = async () => {
    if (!selectedClass || students.length === 0 || !canEdit) return;
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
        <h2 className="text-base font-bold text-gray-800">
          {canEdit ? 'Mark Attendance' : 'View Attendance'}
        </h2>
        <div></div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <button
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between"
          >
            <span className={selectedClass ? 'text-gray-800 font-medium' : 'text-gray-400'}>
              {selectedClass ? (
                <span className="flex items-center gap-2">
                  {selectedClass.name}{selectedClass.section ? ` - ${selectedClass.section}` : ''}
                  {selectedClass.is_class_teacher && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-semibold">Class Teacher</span>
                  )}
                  {selectedClass.is_substitute && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">Substitute</span>
                  )}
                  {!selectedClass.is_class_teacher && !selectedClass.is_substitute && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold">View Only</span>
                  )}
                </span>
              ) : 'Select Class'}
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
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-medium text-gray-800">{cls.name}</span>
                      {cls.section && <span className="text-gray-400 ml-1">- {cls.section}</span>}
                      <span className="text-xs text-gray-400 ml-2">({cls.student_count || 0})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {cls.is_class_teacher && <Shield className="w-3 h-3 text-green-500" />}
                      {cls.is_substitute && <Clock className="w-3 h-3 text-amber-500" />}
                      {!cls.is_class_teacher && !cls.is_substitute && <Eye className="w-3 h-3 text-blue-400" />}
                    </span>
                  </div>
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

      {selectedClass && !canEdit && existingAttendance.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-700">View Only Mode</p>
            <p className="text-[10px] text-blue-500">You are a subject teacher for this class. Only the class teacher can mark attendance.</p>
          </div>
        </div>
      )}

      {selectedClass && !canEdit && existingAttendance.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-700">Attendance Not Marked Yet</p>
            <p className="text-[10px] text-amber-500">The class teacher has not marked attendance for this date.</p>
          </div>
        </div>
      )}

      {selectedClass && students.length > 0 && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-700">{presentCount}P</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 rounded-lg">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-700">{absentCount}A</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">{lateCount}L</span>
            </div>
            {canEdit && (
              <div className="ml-auto flex gap-1">
                <button onClick={() => markAll('present')} className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">All P</button>
                <button onClick={() => markAll('absent')} className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium">All A</button>
              </div>
            )}
          </div>

          {canEdit && existingAttendance.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">Attendance already marked - editing mode</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-0 px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase">
              <span className="w-8 text-center">#</span>
              <span>Student Name</span>
              <span className="text-center w-[120px]">Status</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
              {students.map((student, idx) => {
                const status = attendanceMap[student.id] || 'present';
                return (
                  <div key={student.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-0 px-3 py-2 hover:bg-gray-50">
                    <span className="text-xs text-gray-400 w-8 text-center">{idx + 1}</span>
                    <div className="min-w-0 px-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                      <p className="text-[10px] text-gray-400">{student.student_id || student.roll_number || ''}</p>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1 w-[120px] justify-center">
                        <button
                          onClick={() => setStatus(student.id, 'present')}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            status === 'present'
                              ? 'bg-green-500 text-white shadow-sm scale-105'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                          }`}
                        >P</button>
                        <button
                          onClick={() => setStatus(student.id, 'absent')}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            status === 'absent'
                              ? 'bg-red-500 text-white shadow-sm scale-105'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          }`}
                        >A</button>
                        <button
                          onClick={() => setStatus(student.id, 'late')}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            status === 'late'
                              ? 'bg-amber-500 text-white shadow-sm scale-105'
                              : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >L</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-[120px]">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          status === 'present' ? 'bg-green-100 text-green-700' :
                          status === 'absent' ? 'bg-red-100 text-red-700' :
                          status === 'late' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : '-'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {canEdit && (
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
          )}
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
