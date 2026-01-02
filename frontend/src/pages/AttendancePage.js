import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { CalendarCheck, CheckCircle, XCircle, Clock, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AttendancePage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

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
      const response = await axios.get(`${API}/classes?school_id=${schoolId}`);
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/attendance/stats?school_id=${schoolId}&date=${selectedDate}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Fetch students
      const studentsRes = await axios.get(`${API}/students?school_id=${schoolId}&class_id=${selectedClass}`);
      setStudents(studentsRes.data);

      // Fetch existing attendance
      const attendanceRes = await axios.get(`${API}/attendance?class_id=${selectedClass}&date=${selectedDate}`);
      
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
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        status: status
      }));

      await axios.post(`${API}/attendance/bulk`, {
        class_id: selectedClass,
        school_id: schoolId,
        date: selectedDate,
        attendance: attendanceData
      });

      toast.success(t('saved_successfully'));
      fetchStats();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    } finally {
      setSaving(false);
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
      default:
        return null;
    }
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('attendance')}</h1>
          <p className="text-slate-500 mt-1">{t('mark_attendance')}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('total_students')}</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total_students}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('present')}</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('absent')}</p>
            <p className="text-2xl font-bold text-rose-600">{stats.absent}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('late')}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>{t('select_class')}</Label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 min-w-[200px]"
            data-testid="attendance-class-select"
          >
            <option value="">{t('select_class')}</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.section}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t('select_date')}</Label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3"
            data-testid="attendance-date-input"
          />
        </div>
        {selectedClass && (
          <>
            <Button
              variant="outline"
              onClick={() => markAll('present')}
              className="btn-secondary"
              data-testid="mark-all-present"
            >
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
              {t('all_present')}
            </Button>
            <Button
              variant="outline"
              onClick={() => markAll('absent')}
              className="btn-secondary"
              data-testid="mark-all-absent"
            >
              <XCircle className="w-4 h-4 mr-2 text-rose-500" />
              {t('all_absent')}
            </Button>
            <Button
              onClick={handleSave}
              className="btn-primary"
              disabled={saving || Object.keys(attendance).length === 0}
              data-testid="save-attendance-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {t('save')}
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      {!selectedClass ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <CalendarCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Select a class to mark attendance</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No students in this class</p>
        </div>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('admission_no')}</TableHead>
                <TableHead>{t('student_name')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id} data-testid={`attendance-row-${student.id}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{student.admission_no}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    {attendance[student.id] && (
                      <span className={`badge ${
                        attendance[student.id] === 'present' ? 'badge-success' :
                        attendance[student.id] === 'absent' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {getStatusIcon(attendance[student.id])}
                        <span className="ml-1 capitalize">{attendance[student.id]}</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`p-2 rounded-lg transition-colors ${
                          attendance[student.id] === 'present' ? 'bg-emerald-100' : 'hover:bg-slate-100'
                        }`}
                        data-testid={`mark-present-${student.id}`}
                      >
                        <CheckCircle className={`w-5 h-5 ${
                          attendance[student.id] === 'present' ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${
                          attendance[student.id] === 'absent' ? 'bg-rose-100' : 'hover:bg-slate-100'
                        }`}
                        data-testid={`mark-absent-${student.id}`}
                      >
                        <XCircle className={`w-5 h-5 ${
                          attendance[student.id] === 'absent' ? 'text-rose-600' : 'text-slate-400'
                        }`} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'late')}
                        className={`p-2 rounded-lg transition-colors ${
                          attendance[student.id] === 'late' ? 'bg-amber-100' : 'hover:bg-slate-100'
                        }`}
                        data-testid={`mark-late-${student.id}`}
                      >
                        <Clock className={`w-5 h-5 ${
                          attendance[student.id] === 'late' ? 'text-amber-600' : 'text-slate-400'
                        }`} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
