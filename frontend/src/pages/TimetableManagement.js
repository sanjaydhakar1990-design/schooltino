import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Clock, Plus, Save, Loader2, Calendar, Users, BookOpen,
  Edit, Trash2, Printer, AlertCircle, Check, X,
  GraduationCap, User, Settings, RefreshCw, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HI = ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const SUBJECT_COLORS = {
  'Hindi': 'bg-orange-100 border-orange-300 text-orange-800',
  'English': 'bg-blue-100 border-blue-300 text-blue-800',
  'Mathematics': 'bg-green-100 border-green-300 text-green-800',
  'Science': 'bg-purple-100 border-purple-300 text-purple-800',
  'Social Science': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'Computer': 'bg-cyan-100 border-cyan-300 text-cyan-800',
  'Physical Education': 'bg-red-100 border-red-300 text-red-800',
  'Drawing': 'bg-pink-100 border-pink-300 text-pink-800',
  'Music': 'bg-indigo-100 border-indigo-300 text-indigo-800',
  'GK': 'bg-teal-100 border-teal-300 text-teal-800',
  'Moral Science': 'bg-amber-100 border-amber-300 text-amber-800',
  'Sanskrit': 'bg-rose-100 border-rose-300 text-rose-800',
  'default': 'bg-slate-100 border-slate-300 text-slate-800'
};

const DEFAULT_SETTINGS = {
  normal_period_duration: 40,
  first_period_extra_mins: 10,
  school_start_time: '08:00',
  break_duration: 15,
  lunch_duration: 30,
  break_after_period: 3,
  lunch_after_period: 5,
  periods_per_day: 8,
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

const getSubjectColor = (subjectName) => SUBJECT_COLORS[subjectName] || SUBJECT_COLORS.default;

const generateTimeSlots = (settings) => {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const slots = [];
  let [h, m] = s.school_start_time.split(':').map(Number);
  let periodNum = 1;

  for (let i = 0; i < s.periods_per_day; i++) {
    if (periodNum - 1 === s.break_after_period) {
      const endM = m + s.break_duration;
      const endH = h + Math.floor(endM / 60);
      slots.push({
        id: `break-${periodNum}`, label: 'Break / अवकाश', isBreak: true,
        start: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
        end: `${String(endH).padStart(2,'0')}:${String(endM % 60).padStart(2,'0')}`
      });
      h = endH; m = endM % 60;
    }
    if (periodNum - 1 === s.lunch_after_period) {
      const endM = m + s.lunch_duration;
      const endH = h + Math.floor(endM / 60);
      slots.push({
        id: `lunch-${periodNum}`, label: 'Lunch / भोजन', isBreak: true,
        start: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
        end: `${String(endH).padStart(2,'0')}:${String(endM % 60).padStart(2,'0')}`
      });
      h = endH; m = endM % 60;
    }

    const dur = periodNum === 1 ? s.normal_period_duration + s.first_period_extra_mins : s.normal_period_duration;
    const endM = m + dur;
    const endH = h + Math.floor(endM / 60);
    slots.push({
      id: periodNum, label: `Period ${periodNum}`, isBreak: false,
      start: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
      end: `${String(endH).padStart(2,'0')}:${String(endM % 60).padStart(2,'0')}`
    });
    h = endH; m = endM % 60;
    periodNum++;
  }
  return slots;
};

export default function TimetableManagement() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [substitutions, setSubstitutions] = useState([]);
  const [subjectAllocations, setSubjectAllocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('class');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [subDate, setSubDate] = useState(new Date().toISOString().split('T')[0]);

  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [showSubjectAssignDialog, setShowSubjectAssignDialog] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [slotForm, setSlotForm] = useState({ day: '', period: '', subject_id: '', teacher_id: '', room: '' });
  const [subForm, setSubForm] = useState({ class_id: '', period_id: '', original_teacher_id: '', substitute_teacher_id: '', reason: '', is_homeroom: false });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const timeSlots = generateTimeSlots(settings);
  const periods = timeSlots.filter(s => !s.isBreak);
  const workingDays = settings.working_days || DAYS;

  const fetchAllData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [classRes, staffRes, subjectRes, ttRes, settingsRes, allocRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/staff?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/subjects?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/timetables?school_id=${schoolId}`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/timetable-settings?school_id=${schoolId}`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/subject-allocations?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);

      const cls = classRes.data || [];
      setClasses(cls);
      setTeachers((staffRes.data || []).filter(t => t.role === 'teacher' || t.designation?.toLowerCase().includes('teacher')));

      const defaultSubjects = [
        { id: 'hindi', name: 'Hindi', name_hi: 'हिंदी' },
        { id: 'english', name: 'English', name_hi: 'अंग्रेजी' },
        { id: 'math', name: 'Mathematics', name_hi: 'गणित' },
        { id: 'science', name: 'Science', name_hi: 'विज्ञान' },
        { id: 'sst', name: 'Social Science', name_hi: 'सामाजिक विज्ञान' },
        { id: 'computer', name: 'Computer', name_hi: 'कंप्यूटर' },
        { id: 'pe', name: 'Physical Education', name_hi: 'शारीरिक शिक्षा' },
        { id: 'drawing', name: 'Drawing', name_hi: 'चित्रकला' },
        { id: 'music', name: 'Music', name_hi: 'संगीत' },
        { id: 'gk', name: 'GK', name_hi: 'सामान्य ज्ञान' },
        { id: 'moral', name: 'Moral Science', name_hi: 'नैतिक शिक्षा' },
        { id: 'sanskrit', name: 'Sanskrit', name_hi: 'संस्कृत' }
      ];
      setSubjects(subjectRes.data?.length > 0 ? subjectRes.data : defaultSubjects);
      setTimetables(ttRes.data || {});
      if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
        setSettings(prev => ({ ...prev, ...settingsRes.data }));
      }
      setSubjectAllocations(allocRes.data || []);
      if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchSubstitutions = useCallback(async () => {
    if (!schoolId) return;
    try {
      const res = await axios.get(`${API}/substitutions?school_id=${schoolId}&date=${subDate}`, { headers }).catch(() => ({ data: [] }));
      setSubstitutions(res.data || []);
    } catch { setSubstitutions([]); }
  }, [schoolId, subDate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  useEffect(() => { fetchSubstitutions(); }, [fetchSubstitutions]);

  const getClassTeacherInfo = (classObj) => {
    if (!classObj) return null;
    const ctId = classObj.class_teacher_id || classObj.classTeacherId;
    if (ctId) {
      const teacher = teachers.find(t => t.id === ctId || t._id === ctId);
      if (teacher) {
        const alloc = subjectAllocations.find(a =>
          (a.teacher_id === teacher.id || a.teacher_id === teacher._id) &&
          (a.class_id === classObj.id || a.class_id === classObj._id)
        );
        return { teacher, subjectName: alloc?.subject_name || teacher.subject || null, subjectId: alloc?.subject_id || null };
      }
    }
    if (classObj.class_teacher) {
      const teacher = teachers.find(t => t.name === classObj.class_teacher);
      if (teacher) return { teacher, subjectName: teacher.subject || null, subjectId: null };
    }
    return null;
  };

  const isTeacherBusy = (teacherId, day, periodId) => {
    for (const [classId, classTT] of Object.entries(timetables)) {
      if (classTT[day]?.[periodId]?.teacher_id === teacherId && selectedClass?.id !== classId) {
        return classes.find(c => c.id === classId)?.name || 'Another class';
      }
    }
    return null;
  };

  const getTeacherSchedule = (teacherId) => {
    const schedule = {};
    Object.entries(timetables).forEach(([classId, classTT]) => {
      Object.entries(classTT).forEach(([day, dayPeriods]) => {
        Object.entries(dayPeriods).forEach(([pId, slot]) => {
          if (slot.teacher_id === teacherId) {
            if (!schedule[day]) schedule[day] = {};
            schedule[day][pId] = { ...slot, class_id: classId, class_name: classes.find(c => c.id === classId)?.name };
          }
        });
      });
    });
    return schedule;
  };

  const getClassSubjects = () => {
    if (!selectedClass) return subjects;
    const classSubjectIds = selectedClass.subjects;
    if (classSubjectIds && classSubjectIds.length > 0) {
      return subjects.filter(s => classSubjectIds.includes(s.id));
    }
    return subjects;
  };

  const handleOpenSubjectAssign = () => {
    setSelectedSubjectIds(selectedClass?.subjects || []);
    setShowSubjectAssignDialog(true);
  };

  const handleSaveClassSubjects = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      await axios.put(`${API}/classes/${selectedClass.id}/subjects`, { subjects: selectedSubjectIds }, { headers });
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? { ...c, subjects: selectedSubjectIds } : c));
      setSelectedClass(prev => ({ ...prev, subjects: selectedSubjectIds }));
      toast.success('Subjects assigned successfully! / विषय सफलतापूर्वक जोड़े गए!');
      setShowSubjectAssignDialog(false);
    } catch (error) {
      toast.error('Failed to save subjects');
    } finally { setSaving(false); }
  };

  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSlotClick = (day, period) => {
    if (period.id === 1) return;
    const slot = timetables[selectedClass?.id]?.[day]?.[period.id] || {};
    setSlotForm({ day, period: period.id, subject_id: slot.subject_id || '', teacher_id: slot.teacher_id || '', room: slot.room || '' });
    setShowSlotDialog(true);
  };

  const handleSaveSlot = async () => {
    if (!slotForm.subject_id) { toast.error('Please select a subject'); return; }
    if (slotForm.teacher_id) {
      const busy = isTeacherBusy(slotForm.teacher_id, slotForm.day, slotForm.period);
      if (busy) { toast.error(`Teacher already busy in ${busy}`); return; }
    }
    setSaving(true);
    try {
      const subject = subjects.find(s => s.id === slotForm.subject_id);
      const teacher = teachers.find(t => t.id === slotForm.teacher_id);
      await axios.post(`${API}/timetables/slot`, {
        school_id: schoolId, class_id: selectedClass.id, day: slotForm.day,
        period_id: slotForm.period, subject_id: slotForm.subject_id, subject_name: subject?.name,
        teacher_id: slotForm.teacher_id, teacher_name: teacher?.name, room: slotForm.room
      }, { headers });
      setTimetables(prev => ({
        ...prev,
        [selectedClass.id]: {
          ...prev[selectedClass.id],
          [slotForm.day]: {
            ...prev[selectedClass.id]?.[slotForm.day],
            [slotForm.period]: { subject_id: slotForm.subject_id, subject_name: subject?.name, teacher_id: slotForm.teacher_id, teacher_name: teacher?.name, room: slotForm.room }
          }
        }
      }));
      toast.success('Period saved!');
      setShowSlotDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save period');
    } finally { setSaving(false); }
  };

  const handleDeleteSlot = async () => {
    setSaving(true);
    try {
      await axios.delete(`${API}/timetables/slot`, { headers, data: { school_id: schoolId, class_id: selectedClass.id, day: slotForm.day, period_id: slotForm.period } });
      setTimetables(prev => {
        const n = { ...prev };
        if (n[selectedClass.id]?.[slotForm.day]) delete n[selectedClass.id][slotForm.day][slotForm.period];
        return n;
      });
      toast.success('Period removed');
      setShowSlotDialog(false);
    } catch { toast.error('Failed to remove'); }
    finally { setSaving(false); }
  };

  const handleAssignClassTeacher = async () => {
    if (!assignTeacherId || !selectedClass) return;
    setSaving(true);
    try {
      await axios.post(`${API}/class-teacher/assign`, { school_id: schoolId, class_id: selectedClass.id, teacher_id: assignTeacherId }, { headers });
      toast.success('Class teacher assigned! Homeroom entries created.');
      setShowAssignDialog(false);
      setAssignTeacherId('');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign class teacher');
    } finally { setSaving(false); }
  };

  const handleGenerateTimetable = async () => {
    if (!selectedClass) { toast.error('Select a class first'); return; }
    setGenerating(true);
    try {
      try {
        const res = await axios.post(`${API}/timetable/generate`, { school_id: schoolId, class_id: selectedClass.id || selectedClass._id }, { headers });
        if (res.data?.timetable) {
          setTimetables(prev => ({ ...prev, [selectedClass.id || selectedClass._id]: res.data.timetable }));
          toast.success('Timetable generated!');
          setGenerating(false);
          return;
        }
      } catch { /* fallback to local */ }

      const classId = selectedClass.id || selectedClass._id;
      const ct = getClassTeacherInfo(selectedClass);
      const avail = subjects.filter(s => s.id && s.name);
      const newTT = {};

      workingDays.forEach(day => {
        newTT[day] = {};
        const shuffled = [...avail].sort(() => Math.random() - 0.5);
        let si = 0;

        periods.forEach((period) => {
          if (period.id === 1 && ct?.teacher) {
            newTT[day][1] = { subject_id: 'homeroom', subject_name: 'Homeroom', teacher_id: ct.teacher.id || ct.teacher._id, teacher_name: ct.teacher.name, room: '', is_homeroom: true };
            return;
          }
          const sub = shuffled[si % shuffled.length];
          si++;
          const teacher = teachers.find(t => {
            return subjectAllocations.find(a => (a.teacher_id === t.id || a.teacher_id === t._id) && (a.class_id === classId) && (a.subject_name === sub?.name || a.subject_id === sub?.id));
          }) || teachers[Math.floor(Math.random() * (teachers.length || 1))] || null;

          if (sub) {
            newTT[day][period.id] = { subject_id: sub.id, subject_name: sub.name, teacher_id: teacher?.id || '', teacher_name: teacher?.name || '', room: '' };
          }
        });
      });

      setTimetables(prev => ({ ...prev, [classId]: newTT }));
      try { await axios.post(`${API}/timetables/bulk`, { school_id: schoolId, class_id: classId, timetable: newTT }, { headers }); } catch {}
      toast.success(ct?.subjectName ? `Generated! Class teacher in Period 1 homeroom` : 'Timetable generated!');
    } catch { toast.error('Failed to generate'); }
    finally { setGenerating(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/timetable-settings`, { school_id: schoolId, ...settings }, { headers });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleAddSubstitution = async () => {
    if (!subForm.class_id || !subForm.period_id || !subForm.substitute_teacher_id) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/substitutions`, {
        school_id: schoolId, class_id: subForm.class_id, date: subDate,
        period_id: parseInt(subForm.period_id), original_teacher_id: subForm.original_teacher_id,
        substitute_teacher_id: subForm.substitute_teacher_id, reason: subForm.reason,
        is_homeroom: subForm.period_id === '1' || subForm.period_id === 1
      }, { headers });
      toast.success('Substitution added!');
      setShowSubDialog(false);
      setSubForm({ class_id: '', period_id: '', original_teacher_id: '', substitute_teacher_id: '', reason: '', is_homeroom: false });
      fetchSubstitutions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add substitution');
    } finally { setSaving(false); }
  };

  const handleDeleteSubstitution = async (subId) => {
    try {
      await axios.delete(`${API}/substitutions/${subId}`, { headers });
      toast.success('Substitution removed');
      fetchSubstitutions();
    } catch { toast.error('Failed to remove'); }
  };

  const handlePrint = () => {
    const el = document.getElementById('timetable-grid');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Timetable</title><style>
      body{font-family:Arial,sans-serif;padding:20px}
      h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:8px;text-align:center;font-size:11px}
      th{background:#f5f5f5;font-weight:bold}.homeroom{background:#dbeafe}
      @media print{body{-webkit-print-color-adjust:exact}}
    </style></head><body>
      <h1>${activeTab === 'class' ? selectedClass?.name : selectedTeacher?.name} - Timetable</h1>
      ${el.outerHTML}
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`);
    w.document.close();
  };

  if (!schoolId) return <div className="text-center py-20"><p className="text-slate-500">{t('select_class')}</p></div>;

  const classTT = timetables[selectedClass?.id] || {};
  const classTeacher = selectedClass ? getClassTeacherInfo(selectedClass) : null;

  return (
    <div className="space-y-6" data-testid="timetable-management">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            {t('timetable')}
          </h1>
          <p className="text-slate-500 mt-1">{t('view_timetable')}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'class' && (
            <>
              <Button onClick={handleGenerateTimetable} disabled={generating || !selectedClass} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {generating ? t('loading') : t('create_timetable')}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> {t('print')}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="class" className="gap-1.5">
            <GraduationCap className="w-4 h-4" /> {t('timetable')}
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-1.5">
            <User className="w-4 h-4" /> {t('teacher')}
          </TabsTrigger>
          <TabsTrigger value="substitutions" className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> {t('substitution')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="w-4 h-4" /> {t('settings')}
          </TabsTrigger>
        </TabsList>

        {/* ============ CLASS TIMETABLE TAB ============ */}
        <TabsContent value="class" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t('timetable')}</CardTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label>{t('select_class')}:</Label>
                    <select
                      className="border rounded-md px-3 py-2 text-sm bg-white min-w-[160px]"
                      value={selectedClass?.id || ''}
                      onChange={e => setSelectedClass(classes.find(c => c.id === e.target.value))}
                    >
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {classTeacher ? (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{t('class_teacher')}: {classTeacher.teacher.name}</span>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setShowAssignDialog(true)} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                      <AlertCircle className="w-4 h-4" /> {t('class_teacher')}
                    </Button>
                  )}

                  <Button size="sm" variant="ghost" onClick={() => setShowAssignDialog(true)} className="gap-1">
                    <Edit className="w-3.5 h-3.5" /> {t('edit')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleOpenSubjectAssign} className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedClass?.subjects?.length > 0 ? `${t('subjects')} (${selectedClass.subjects.length})` : t('subjects')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
              ) : (
                <div className="overflow-x-auto" id="timetable-grid">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-100 p-2 text-sm font-semibold w-28">Day / दिन</th>
                        {timeSlots.map(slot => (
                          <th key={slot.id} className={`border border-slate-200 p-2 text-xs font-semibold ${slot.isBreak ? 'bg-amber-50' : slot.id === 1 ? 'bg-blue-100 border-blue-300' : 'bg-slate-100'}`}>
                            <div>{slot.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{slot.start} - {slot.end}</div>
                            {slot.id === 1 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-200 text-blue-700">+{settings.first_period_extra_mins} min</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workingDays.map((day, di) => (
                        <tr key={day}>
                          <td className="border border-slate-200 bg-slate-50 p-2 text-sm font-medium">
                            <div>{day}</div>
                            <div className="text-[10px] text-slate-400">{DAYS_HI[DAYS.indexOf(day)]}</div>
                          </td>
                          {timeSlots.map(slot => {
                            if (slot.isBreak) {
                              return (
                                <td key={slot.id} className="border border-amber-200 bg-amber-50 p-2 text-center">
                                  <span className="text-xs text-amber-600 font-medium">{slot.label}</span>
                                </td>
                              );
                            }

                            if (slot.id === 1) {
                              const ctName = classTeacher?.teacher?.name || 'Not Assigned';
                              return (
                                <td key={slot.id} className="border-2 border-blue-300 bg-blue-50 p-2 cursor-not-allowed" title="Reserved for Class Teacher - Attendance Period (+10 mins)">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-lg">👨‍🏫</span>
                                    <span className="text-xs font-bold text-blue-800">{t('homeroom')}</span>
                                    <span className="text-[10px] text-blue-600">उपस्थिति</span>
                                    <span className="text-[10px] text-blue-700 font-medium truncate max-w-[80px]">{ctName}</span>
                                    <span className="inline-block px-1 py-0.5 rounded-full text-[8px] font-bold bg-blue-200 text-blue-700">+{settings.first_period_extra_mins} min</span>
                                  </div>
                                </td>
                              );
                            }

                            const cellData = classTT[day]?.[slot.id];
                            return (
                              <td
                                key={slot.id}
                                className={`border border-slate-200 p-1.5 text-center cursor-pointer hover:bg-slate-50 transition-colors ${cellData ? getSubjectColor(cellData.subject_name) : ''}`}
                                onClick={() => handleSlotClick(day, slot)}
                              >
                                {cellData ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-semibold">{cellData.subject_name}</span>
                                    <span className="text-[10px] text-slate-500">{cellData.teacher_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">+ {t('add')}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(SUBJECT_COLORS).filter(k => k !== 'default').map(sub => (
                  <span key={sub} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${SUBJECT_COLORS[sub]}`}>{sub}</span>
                ))}
                <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-blue-100 border-blue-300 text-blue-800">🏠 {t('homeroom')}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TEACHER SCHEDULE TAB ============ */}
        <TabsContent value="teacher" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t('teacher')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Label>{t('teacher')}:</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-white min-w-[200px]"
                    value={selectedTeacher?.id || ''}
                    onChange={e => setSelectedTeacher(teachers.find(t => t.id === e.target.value))}
                  >
                    <option value="">-- {t('subject_teacher')} --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedTeacher ? (
                <div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>{t('subject_teacher')}</p></div>
              ) : (() => {
                const schedule = getTeacherSchedule(selectedTeacher.id);
                const isClassTeacherOf = classes.filter(c => {
                  const ctId = c.class_teacher_id || c.classTeacherId;
                  return ctId === selectedTeacher.id || ctId === selectedTeacher._id || c.class_teacher === selectedTeacher.name;
                });

                return (
                  <div>
                    {isClassTeacherOf.length > 0 && (
                      <div className="mb-3 flex gap-2 flex-wrap">
                        {isClassTeacherOf.map(c => (
                          <span key={c.id} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            {t('class_teacher')}: {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                          <tr>
                            <th className="border border-slate-200 bg-slate-100 p-2 text-sm font-semibold w-28">{t('date')}</th>
                            {periods.map(p => (
                              <th key={p.id} className={`border border-slate-200 p-2 text-xs font-semibold ${p.id === 1 ? 'bg-blue-100 border-blue-300' : 'bg-slate-100'}`}>
                                <div>{p.label}</div>
                                <div className="text-[10px] text-slate-500">{p.start}-{p.end}</div>
                                {p.id === 1 && <span className="inline-block mt-0.5 px-1 rounded-full text-[9px] font-bold bg-blue-200 text-blue-700">+{settings.first_period_extra_mins}m</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {workingDays.map((day, di) => (
                            <tr key={day}>
                              <td className="border border-slate-200 bg-slate-50 p-2 text-sm font-medium">
                                <div>{day}</div>
                                <div className="text-[10px] text-slate-400">{DAYS_HI[DAYS.indexOf(day)]}</div>
                              </td>
                              {periods.map(p => {
                                const slot = schedule[day]?.[p.id];
                                const isHomeroom = p.id === 1 && isClassTeacherOf.length > 0;

                                if (isHomeroom) {
                                  return (
                                    <td key={p.id} className="border-2 border-blue-300 bg-blue-50 p-2">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-lg">👨‍🏫</span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">{t('homeroom')}</span>
                                        <span className="text-[10px] text-blue-700">{isClassTeacherOf.map(c => c.name).join(', ')}</span>
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td key={p.id} className={`border border-slate-200 p-1.5 text-center ${slot ? getSubjectColor(slot.subject_name) : 'bg-green-50'}`}>
                                    {slot ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xs font-semibold">{slot.subject_name}</span>
                                        <span className="text-[10px] text-slate-500">{slot.class_name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-green-500 text-xs font-medium">{t('available')}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SUBSTITUTIONS TAB ============ */}
        <TabsContent value="substitutions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t('substitution')}</CardTitle>
                <div className="flex items-center gap-3">
                  <Input type="date" value={subDate} onChange={e => setSubDate(e.target.value)} className="w-40" />
                  <Button onClick={() => { setSubForm({ class_id: '', period_id: '', original_teacher_id: '', substitute_teacher_id: '', reason: '', is_homeroom: false }); setShowSubDialog(true); }} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> {t('assign_substitute')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {substitutions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>{t('no_data')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-2 text-sm text-left">{t('classes')}</th>
                        <th className="border border-slate-200 p-2 text-sm text-left">{t('period')}</th>
                        <th className="border border-slate-200 p-2 text-sm text-left">{t('teacher')}</th>
                        <th className="border border-slate-200 p-2 text-sm text-left">{t('substitution')}</th>
                        <th className="border border-slate-200 p-2 text-sm text-left">{t('reason')}</th>
                        <th className="border border-slate-200 p-2 text-sm text-center w-20">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {substitutions.map(sub => {
                        const cls = classes.find(c => c.id === sub.class_id);
                        const origT = teachers.find(t => t.id === sub.original_teacher_id);
                        const subT = teachers.find(t => t.id === sub.substitute_teacher_id);
                        return (
                          <tr key={sub.id || sub._id} className="hover:bg-slate-50">
                            <td className="border border-slate-200 p-2 text-sm">{cls?.name || sub.class_id}</td>
                            <td className="border border-slate-200 p-2 text-sm">
                              {t('period')} {sub.period_id}
                              {(sub.is_homeroom || sub.period_id === 1) && <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">{t('homeroom')}</span>}
                            </td>
                            <td className="border border-slate-200 p-2 text-sm">{origT?.name || sub.original_teacher_name || '-'}</td>
                            <td className="border border-slate-200 p-2 text-sm font-medium text-green-700">{subT?.name || sub.substitute_teacher_name || '-'}</td>
                            <td className="border border-slate-200 p-2 text-sm text-slate-500">{sub.reason || '-'}</td>
                            <td className="border border-slate-200 p-2 text-center">
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleDeleteSubstitution(sub.id || sub._id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SETTINGS TAB ============ */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> {t('settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>{t('period')} ({t('time_slot')})</Label>
                    <Input type="number" min={20} max={90} value={settings.normal_period_duration} onChange={e => setSettings(s => ({ ...s, normal_period_duration: parseInt(e.target.value) || 40 }))} />
                  </div>
                  <div>
                    <Label>{t('start_time')}</Label>
                    <Input type="number" min={0} max={30} value={settings.first_period_extra_mins} onChange={e => setSettings(s => ({ ...s, first_period_extra_mins: parseInt(e.target.value) || 10 }))} />
                    <p className="text-xs text-slate-400 mt-1">Period 1 = {settings.normal_period_duration + settings.first_period_extra_mins} mins (Homeroom / उपस्थिति)</p>
                  </div>
                  <div>
                    <Label>{t('start_time')}</Label>
                    <Input type="time" value={settings.school_start_time} onChange={e => setSettings(s => ({ ...s, school_start_time: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t('period')}</Label>
                    <Input type="number" min={4} max={12} value={settings.periods_per_day} onChange={e => setSettings(s => ({ ...s, periods_per_day: parseInt(e.target.value) || 8 }))} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{t('break_time')}</Label>
                    <Input type="number" min={5} max={30} value={settings.break_duration} onChange={e => setSettings(s => ({ ...s, break_duration: parseInt(e.target.value) || 15 }))} />
                  </div>
                  <div>
                    <Label>{t('lunch')}</Label>
                    <Input type="number" min={15} max={60} value={settings.lunch_duration} onChange={e => setSettings(s => ({ ...s, lunch_duration: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div>
                    <Label>{t('break_time')}</Label>
                    <Input type="number" min={1} max={10} value={settings.break_after_period} onChange={e => setSettings(s => ({ ...s, break_after_period: parseInt(e.target.value) || 3 }))} />
                  </div>
                  <div>
                    <Label>{t('lunch')}</Label>
                    <Input type="number" min={1} max={10} value={settings.lunch_after_period} onChange={e => setSettings(s => ({ ...s, lunch_after_period: parseInt(e.target.value) || 5 }))} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label className="mb-2 block">{t('working_days')}</Label>
                <div className="flex flex-wrap gap-3">
                  {DAYS.map((day, i) => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.working_days?.includes(day)}
                        onChange={e => {
                          setSettings(s => ({
                            ...s,
                            working_days: e.target.checked
                              ? [...(s.working_days || []), day]
                              : (s.working_days || []).filter(d => d !== day)
                          }));
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{day} <span className="text-slate-400 text-xs">({DAYS_HI[i]})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSaveSettings} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('save_settings')}
                </Button>
              </div>

              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('time_slot')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {timeSlots.map(slot => (
                    <div key={slot.id} className={`p-2 rounded-lg border text-center text-xs ${slot.isBreak ? 'bg-amber-50 border-amber-200' : slot.id === 1 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                      <div className="font-medium">{slot.label}</div>
                      <div className="text-slate-500">{slot.start} - {slot.end}</div>
                      {slot.id === 1 && <span className="text-[9px] text-blue-600 font-bold">{t('homeroom')} +{settings.first_period_extra_mins}m</span>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ SLOT EDIT DIALOG ============ */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('period')}</DialogTitle>
            <DialogDescription>{slotForm.day} - {t('period')} {slotForm.period}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('subject')}</Label>
              {(!selectedClass?.subjects || selectedClass.subjects.length === 0) && (
                <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  सभी विषय दिख रहे हैं। कक्षा के विषय सेट करने के लिए "Assign Subjects" बटन दबाएं।
                </p>
              )}
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={slotForm.subject_id} onChange={e => setSlotForm(f => ({ ...f, subject_id: e.target.value }))}>
                <option value="">-- {t('subject')} --</option>
                {getClassSubjects().map(s => <option key={s.id} value={s.id}>{s.name}{s.name_hi ? ` (${s.name_hi})` : ''}</option>)}
              </select>
            </div>
            <div>
              <Label>{t('teacher')}</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={slotForm.teacher_id} onChange={e => setSlotForm(f => ({ ...f, teacher_id: e.target.value }))}>
                <option value="">-- {t('teacher')} --</option>
                {teachers.map(t => {
                  const busy = isTeacherBusy(t.id, slotForm.day, slotForm.period);
                  return <option key={t.id} value={t.id} disabled={!!busy}>{t.name}{busy ? ` (Busy: ${busy})` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <Label>{t('room_number')} ({t('optional')})</Label>
              <Input value={slotForm.room} onChange={e => setSlotForm(f => ({ ...f, room: e.target.value }))} placeholder="Room number" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" size="sm" onClick={handleDeleteSlot} disabled={saving} className="gap-1">
                <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setShowSlotDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveSlot} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ASSIGN CLASS TEACHER DIALOG ============ */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('class_teacher')}</DialogTitle>
            <DialogDescription>
              {selectedClass?.name} - Assigning will auto-create Period 1 Homeroom entries
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('teacher')}</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
                <option value="">-- {t('teacher')} --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.subject ? ` (${t.subject})` : ''}</option>)}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Assigning a class teacher will automatically lock Period 1 as "Homeroom / उपस्थिति" for all working days. This period has +{settings.first_period_extra_mins} extra minutes for attendance.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleAssignClassTeacher} disabled={saving || !assignTeacherId} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ADD SUBSTITUTION DIALOG ============ */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('substitution')}</DialogTitle>
            <DialogDescription>Date: {subDate}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('classes')}</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                value={subForm.class_id}
                onChange={e => {
                  const cid = e.target.value;
                  setSubForm(f => ({ ...f, class_id: cid, period_id: '', original_teacher_id: '' }));
                }}
              >
                <option value="">-- {t('select_class')} --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>{t('period')}</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                value={subForm.period_id}
                onChange={e => {
                  const pid = e.target.value;
                  const slot = timetables[subForm.class_id]?.[workingDays[0]]?.[parseInt(pid)];
                  setSubForm(f => ({ ...f, period_id: pid, original_teacher_id: slot?.teacher_id || '', is_homeroom: pid === '1' }));
                }}
              >
                <option value="">-- {t('period')} --</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {t('period')} {p.id}{p.id === 1 ? ` (${t('homeroom')})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('teacher')}</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={subForm.original_teacher_id} onChange={e => setSubForm(f => ({ ...f, original_teacher_id: e.target.value }))}>
                <option value="">-- {t('teacher')} --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <Label>{t('substitution')}</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={subForm.substitute_teacher_id} onChange={e => setSubForm(f => ({ ...f, substitute_teacher_id: e.target.value }))}>
                <option value="">-- {t('assign_substitute')} --</option>
                {teachers.filter(t => t.id !== subForm.original_teacher_id).map(t => {
                  const busy = subForm.period_id ? isTeacherBusy(t.id, workingDays[0], parseInt(subForm.period_id)) : null;
                  return <option key={t.id} value={t.id} disabled={!!busy}>{t.name}{busy ? ` (Busy: ${busy})` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <Label>{t('reason')}</Label>
              <Input value={subForm.reason} onChange={e => setSubForm(f => ({ ...f, reason: e.target.value }))} placeholder={t('reason')} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSubDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleAddSubstitution} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ASSIGN SUBJECTS TO CLASS DIALOG ============ */}
      <Dialog open={showSubjectAssignDialog} onOpenChange={setShowSubjectAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('subjects')} - {selectedClass?.name}</DialogTitle>
            <DialogDescription>इस कक्षा में पढ़ाए जाने वाले विषय चुनें। केवल चुने हुए विषय ही टाइमटेबल में दिखेंगे।</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {subjects.map(s => (
              <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedSubjectIds.includes(s.id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="checkbox"
                  checked={selectedSubjectIds.includes(s.id)}
                  onChange={() => toggleSubjectSelection(s.id)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">{s.name}</span>
                  {s.name_hi && <span className="text-xs text-slate-500 ml-2">({s.name_hi})</span>}
                </div>
                {selectedSubjectIds.includes(s.id) && <Check className="w-4 h-4 text-indigo-600" />}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-xs text-slate-500">{selectedSubjectIds.length} विषय चुने गए / {selectedSubjectIds.length} subjects selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubjectAssignDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveClassSubjects} disabled={saving || selectedSubjectIds.length === 0} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
