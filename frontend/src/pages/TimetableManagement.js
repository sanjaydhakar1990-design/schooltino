import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Clock, Plus, Save, Loader2, Calendar, Users, BookOpen, 
  Edit, Trash2, Copy, Printer, AlertCircle, Check, X,
  ChevronLeft, ChevronRight, GraduationCap, User
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Time slots configuration
const DEFAULT_TIME_SLOTS = [
  { id: 1, start: '08:00', end: '08:45', label: 'Period 1' },
  { id: 2, start: '08:45', end: '09:30', label: 'Period 2' },
  { id: 3, start: '09:30', end: '10:15', label: 'Period 3' },
  { id: 4, start: '10:15', end: '10:30', label: 'Break', isBreak: true },
  { id: 5, start: '10:30', end: '11:15', label: 'Period 4' },
  { id: 6, start: '11:15', end: '12:00', label: 'Period 5' },
  { id: 7, start: '12:00', end: '12:45', label: 'Period 6' },
  { id: 8, start: '12:45', end: '01:30', label: 'Lunch', isBreak: true },
  { id: 9, start: '01:30', end: '02:15', label: 'Period 7' },
  { id: 10, start: '02:15', end: '03:00', label: 'Period 8' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HI = ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

// Subject colors
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

export default function TimetableManagement() {
  const { schoolId, user } = useAuth();
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [viewMode, setViewMode] = useState('class');
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [subjectAllocations, setSubjectAllocations] = useState([]);
  
  // Slot form
  const [slotForm, setSlotForm] = useState({
    day: '',
    period: '',
    subject_id: '',
    teacher_id: '',
    room: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classRes, teacherRes, subjectRes, timetableRes, slotsRes, schoolRes, allocRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/staff?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/subjects?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/timetables?school_id=${schoolId}`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/timetable/time-slots?school_id=${schoolId}`, { headers }).catch(() => ({ data: { slots: [] } })),
        axios.get(`${API}/schools/${schoolId}`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/subject-allocations?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setClasses(classRes.data || []);
      setTeachers(teacherRes.data?.filter(t => t.role === 'teacher' || t.designation?.toLowerCase().includes('teacher')) || []);
      
      // Fetch time slots from backend or use school timing defaults
      if (slotsRes.data?.slots?.length > 0) {
        setTimeSlots(slotsRes.data.slots);
      } else {
        // Use school start/end time from settings
        const schoolData = schoolRes.data;
        const schoolStartTime = schoolData?.school_start_time || '10:00';
        const schoolEndTime = schoolData?.school_end_time || '03:30';
        
        // Generate slots based on school timings
        const generatedSlots = generateSlotsFromSchoolTime(schoolStartTime, schoolEndTime);
        setTimeSlots(generatedSlots);
      }
      
      // Default subjects if none exist
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
      setTimetables(timetableRes.data || {});
      setSubjectAllocations(allocRes.data || []);
      
      if (classRes.data?.length > 0) {
        setSelectedClass(classRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots from school timing
  const generateSlotsFromSchoolTime = (startTime, endTime) => {
    // Parse school start time (e.g., "10:00")
    const [startHour] = startTime.split(':').map(Number);
    
    const slots = [];
    let currentHour = startHour;
    let currentMin = 0;
    let periodNum = 1;
    
    for (let i = 0; i < 8; i++) {
      if (i === 3) {
        // Add break after 3 periods
        slots.push({
          id: slots.length + 1,
          label: 'Break',
          start: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          end: `${String(currentHour).padStart(2, '0')}:${String(currentMin + 15).padStart(2, '0')}`,
          isBreak: true
        });
        currentMin += 15;
      } else if (i === 6) {
        // Add lunch after 6 periods
        slots.push({
          id: slots.length + 1,
          label: 'Lunch',
          start: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          end: `${String(currentHour).padStart(2, '0')}:${String(currentMin + 30).padStart(2, '0')}`,
          isBreak: true
        });
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      } else {
        // Regular period (45 mins)
        const endMin = currentMin + 45;
        const endHour = currentHour + Math.floor(endMin / 60);
        const finalEndMin = endMin % 60;
        
        slots.push({
          id: slots.length + 1,
          label: `Period ${periodNum}`,
          start: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          end: `${String(endHour).padStart(2, '0')}:${String(finalEndMin).padStart(2, '0')}`,
          isBreak: false
        });
        
        periodNum++;
        currentMin += 45;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    }
    
    return slots;
  };

  // Get timetable for selected class
  const getClassTimetable = (classId) => {
    return timetables[classId] || {};
  };

  // Get timetable for selected teacher
  const getTeacherTimetable = (teacherId) => {
    const teacherSchedule = {};
    Object.entries(timetables).forEach(([classId, classTT]) => {
      Object.entries(classTT).forEach(([day, periods]) => {
        Object.entries(periods).forEach(([periodId, slot]) => {
          if (slot.teacher_id === teacherId) {
            if (!teacherSchedule[day]) teacherSchedule[day] = {};
            teacherSchedule[day][periodId] = {
              ...slot,
              class_id: classId,
              class_name: classes.find(c => c.id === classId)?.name
            };
          }
        });
      });
    });
    return teacherSchedule;
  };

  // Check teacher availability
  const isTeacherBusy = (teacherId, day, periodId) => {
    for (const [classId, classTT] of Object.entries(timetables)) {
      if (classTT[day]?.[periodId]?.teacher_id === teacherId) {
        if (selectedClass?.id !== classId) {
          return classes.find(c => c.id === classId)?.name || 'Another class';
        }
      }
    }
    return null;
  };

  // Open slot editor
  const handleSlotClick = (day, period) => {
    const currentSlot = getClassTimetable(selectedClass?.id)?.[day]?.[period.id] || {};
    setSlotForm({
      day,
      period: period.id,
      subject_id: currentSlot.subject_id || '',
      teacher_id: currentSlot.teacher_id || '',
      room: currentSlot.room || ''
    });
    setEditingSlot({ day, period });
    setShowSlotDialog(true);
  };

  // Save slot
  const handleSaveSlot = async () => {
    if (!slotForm.subject_id) {
      toast.error('कृपया subject select करें');
      return;
    }

    // Check teacher availability
    if (slotForm.teacher_id) {
      const busyIn = isTeacherBusy(slotForm.teacher_id, slotForm.day, slotForm.period);
      if (busyIn) {
        toast.error(`Teacher already busy in ${busyIn} at this time!`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const subject = subjects.find(s => s.id === slotForm.subject_id);
      const teacher = teachers.find(t => t.id === slotForm.teacher_id);
      
      await axios.post(`${API}/timetables/slot`, {
        school_id: schoolId,
        class_id: selectedClass.id,
        day: slotForm.day,
        period_id: slotForm.period,
        subject_id: slotForm.subject_id,
        subject_name: subject?.name,
        teacher_id: slotForm.teacher_id,
        teacher_name: teacher?.name,
        room: slotForm.room
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setTimetables(prev => ({
        ...prev,
        [selectedClass.id]: {
          ...prev[selectedClass.id],
          [slotForm.day]: {
            ...prev[selectedClass.id]?.[slotForm.day],
            [slotForm.period]: {
              subject_id: slotForm.subject_id,
              subject_name: subject?.name,
              teacher_id: slotForm.teacher_id,
              teacher_name: teacher?.name,
              room: slotForm.room
            }
          }
        }
      }));

      toast.success('Period saved!');
      setShowSlotDialog(false);
    } catch (error) {
      toast.error('Failed to save period');
    } finally {
      setSaving(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/timetables/slot`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          school_id: schoolId,
          class_id: selectedClass.id,
          day: slotForm.day,
          period_id: slotForm.period
        }
      });

      // Update local state
      setTimetables(prev => {
        const newTT = { ...prev };
        if (newTT[selectedClass.id]?.[slotForm.day]) {
          delete newTT[selectedClass.id][slotForm.day][slotForm.period];
        }
        return newTT;
      });

      toast.success('Period removed');
      setShowSlotDialog(false);
    } catch (error) {
      toast.error('Failed to remove period');
    } finally {
      setSaving(false);
    }
  };

  // Copy timetable to another class
  const handleCopyTimetable = async (targetClassId) => {
    if (!selectedClass || !targetClassId) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/timetables/copy`, {
        school_id: schoolId,
        source_class_id: selectedClass.id,
        target_class_id: targetClassId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Timetable copied!');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to copy timetable');
    } finally {
      setSaving(false);
    }
  };

  const getClassTeacherInfo = (classObj) => {
    if (!classObj) return null;
    const classTeacherId = classObj.class_teacher_id || classObj.classTeacherId;
    if (classTeacherId) {
      const teacher = teachers.find(t => t.id === classTeacherId || t._id === classTeacherId);
      if (teacher) {
        const alloc = subjectAllocations.find(a => 
          (a.teacher_id === teacher.id || a.teacher_id === teacher._id) &&
          (a.class_id === classObj.id || a.class_id === classObj._id)
        );
        const subjectName = alloc?.subject_name || teacher.subject || null;
        const subjectId = alloc?.subject_id || subjects.find(s => s.name === subjectName)?.id || null;
        return { teacher, subjectName, subjectId };
      }
    }
    if (classObj.class_teacher) {
      const teacher = teachers.find(t => t.name === classObj.class_teacher);
      if (teacher) {
        const subjectName = teacher.subject || null;
        const subjectId = subjects.find(s => s.name === subjectName)?.id || null;
        return { teacher, subjectName, subjectId };
      }
    }
    return null;
  };

  const handleGenerateTimetable = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const res = await axios.post(`${API}/timetable/generate`, {
          school_id: schoolId,
          class_id: selectedClass.id || selectedClass._id
        }, { headers });
        if (res.data?.timetable) {
          setTimetables(prev => ({
            ...prev,
            [selectedClass.id || selectedClass._id]: res.data.timetable
          }));
          toast.success('Timetable generated successfully!');
          setGenerating(false);
          return;
        }
      } catch (apiErr) {
        console.log('API generate not available, using local generation');
      }

      const classId = selectedClass.id || selectedClass._id;
      const classTeacher = getClassTeacherInfo(selectedClass);
      const availableSubjects = subjects.filter(s => s.id && s.name);
      const periods = timeSlots.filter(s => !s.isBreak);
      const newTimetable = {};

      DAYS.forEach(day => {
        newTimetable[day] = {};
        const shuffledSubjects = [...availableSubjects].sort(() => Math.random() - 0.5);
        let subjectIndex = 0;

        periods.forEach((period, pIdx) => {
          let subject, teacher;
          
          if (pIdx === 0 && classTeacher?.subjectName) {
            subject = subjects.find(s => s.name === classTeacher.subjectName) || 
                      subjects.find(s => s.id === classTeacher.subjectId);
            teacher = classTeacher.teacher;
          } else {
            subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
            if (subject?.name === classTeacher?.subjectName && pIdx !== 0) {
              subjectIndex++;
              subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
            }
            subjectIndex++;
            teacher = teachers.find(t => {
              const alloc = subjectAllocations.find(a =>
                (a.teacher_id === t.id || a.teacher_id === t._id) &&
                (a.class_id === classId) &&
                (a.subject_name === subject?.name || a.subject_id === subject?.id)
              );
              return !!alloc;
            }) || teachers[Math.floor(Math.random() * (teachers.length || 1))] || null;
          }

          if (subject) {
            newTimetable[day][period.id] = {
              subject_id: subject.id,
              subject_name: subject.name,
              teacher_id: teacher?.id || teacher?._id || '',
              teacher_name: teacher?.name || '',
              room: ''
            };
          }
        });
      });

      setTimetables(prev => ({
        ...prev,
        [classId]: newTimetable
      }));

      try {
        await axios.post(`${API}/timetables/bulk`, {
          school_id: schoolId,
          class_id: classId,
          timetable: newTimetable
        }, { headers });
      } catch (e) {
        console.log('Could not save generated timetable to backend');
      }

      const msg = classTeacher?.subjectName 
        ? `Timetable generated! Class teacher's subject (${classTeacher.subjectName}) placed in Period 1` 
        : 'Timetable generated!';
      toast.success(msg);
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('timetable-grid');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Timetable - ${viewMode === 'class' ? selectedClass?.name : selectedTeacher?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 5px; }
          h2 { text-align: center; color: #666; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
          th { background: #f5f5f5; font-weight: bold; }
          .subject { font-weight: bold; color: #333; }
          .teacher { font-size: 10px; color: #666; }
          .break { background: #fef3c7; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>${viewMode === 'class' ? selectedClass?.name : selectedTeacher?.name} - Timetable</h1>
        <h2>Academic Year ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</h2>
        ${printContent.outerHTML}
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Get subject color
  const getSubjectColor = (subjectName) => {
    return SUBJECT_COLORS[subjectName] || SUBJECT_COLORS.default;
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="timetable-management">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            Timetable Management
          </h1>
          <p className="text-slate-500 mt-1">Class-wise & Teacher-wise scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateTimetable} 
            disabled={generating || !selectedClass}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Auto Generate'}
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)} className="gap-2">
            <Clock className="w-4 h-4" />
            Time Slots
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="class" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Class-wise
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2">
            <User className="w-4 h-4" />
            Teacher-wise
          </TabsTrigger>
        </TabsList>

        {/* Class-wise View */}
        <TabsContent value="class" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Class Timetable</CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Select Class:</Label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
                    className="px-3 py-2 border rounded-lg min-w-[150px]"
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : selectedClass ? (
                <div className="overflow-x-auto" id="timetable-grid">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-100 p-2 text-sm font-semibold w-20">
                          Day / Time
                        </th>
                        {timeSlots.map(slot => (
                          <th 
                            key={slot.id} 
                            className={`border border-slate-200 p-2 text-xs font-semibold ${slot.isBreak ? 'bg-amber-50' : 'bg-slate-100'}`}
                          >
                            <div>{slot.label}</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              {slot.start} - {slot.end}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, dayIdx) => {
                        const dayTT = getClassTimetable(selectedClass.id)?.[day] || {};
                        return (
                          <tr key={day}>
                            <td className="border border-slate-200 bg-slate-50 p-2 text-sm font-medium">
                              <div>{day}</div>
                              <div className="text-xs text-slate-500">{DAYS_HI[dayIdx]}</div>
                            </td>
                            {timeSlots.map(slot => {
                              if (slot.isBreak) {
                                return (
                                  <td key={slot.id} className="border border-slate-200 bg-amber-50 p-2 text-center text-xs text-amber-700">
                                    {slot.label}
                                  </td>
                                );
                              }
                              
                              const periodData = dayTT[slot.id];
                              return (
                                <td 
                                  key={slot.id}
                                  onClick={() => handleSlotClick(day, slot)}
                                  className={`border border-slate-200 p-1 cursor-pointer hover:bg-slate-50 transition-colors ${
                                    periodData ? getSubjectColor(periodData.subject_name) : ''
                                  }`}
                                >
                                  {periodData ? (
                                    <div className="text-center">
                                      <div className="font-semibold text-xs">{periodData.subject_name}</div>
                                      <div className="text-[10px] opacity-80">{periodData.teacher_name}</div>
                                      {periodData.room && (
                                        <div className="text-[9px] opacity-60">Room: {periodData.room}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center text-slate-300 text-xs py-2">
                                      <Plus className="w-4 h-4 mx-auto" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-10">Select a class to view timetable</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher-wise View */}
        <TabsContent value="teacher" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Teacher Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Select Teacher:</Label>
                  <select
                    value={selectedTeacher?.id || ''}
                    onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value))}
                    className="px-3 py-2 border rounded-lg min-w-[200px]"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTeacher ? (
                <div className="overflow-x-auto" id="timetable-grid">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-100 p-2 text-sm font-semibold w-20">
                          Day / Time
                        </th>
                        {timeSlots.map(slot => (
                          <th 
                            key={slot.id} 
                            className={`border border-slate-200 p-2 text-xs font-semibold ${slot.isBreak ? 'bg-amber-50' : 'bg-slate-100'}`}
                          >
                            <div>{slot.label}</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              {slot.start} - {slot.end}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, dayIdx) => {
                        const teacherTT = getTeacherTimetable(selectedTeacher.id);
                        const dayTT = teacherTT[day] || {};
                        return (
                          <tr key={day}>
                            <td className="border border-slate-200 bg-slate-50 p-2 text-sm font-medium">
                              <div>{day}</div>
                              <div className="text-xs text-slate-500">{DAYS_HI[dayIdx]}</div>
                            </td>
                            {timeSlots.map(slot => {
                              if (slot.isBreak) {
                                return (
                                  <td key={slot.id} className="border border-slate-200 bg-amber-50 p-2 text-center text-xs text-amber-700">
                                    {slot.label}
                                  </td>
                                );
                              }
                              
                              const periodData = dayTT[slot.id];
                              return (
                                <td 
                                  key={slot.id}
                                  className={`border border-slate-200 p-1 ${
                                    periodData ? getSubjectColor(periodData.subject_name) : 'bg-green-50'
                                  }`}
                                >
                                  {periodData ? (
                                    <div className="text-center">
                                      <div className="font-semibold text-xs">{periodData.class_name}</div>
                                      <div className="text-[10px] opacity-80">{periodData.subject_name}</div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-green-500 text-[10px]">
                                      Free
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-10">Select a teacher to view schedule</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subject Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Subject Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects.slice(0, 12).map(subject => (
              <span 
                key={subject.id}
                className={`px-2 py-1 rounded text-xs border ${getSubjectColor(subject.name)}`}
              >
                {subject.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slot Edit Dialog */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlot?.day} - {timeSlots.find(s => s.id === editingSlot?.period?.id)?.label}
            </DialogTitle>
            <DialogDescription>
              Set subject and teacher for this period
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <select
                value={slotForm.subject_id}
                onChange={(e) => setSlotForm(prev => ({ ...prev, subject_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.name_hi})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Teacher</Label>
              <select
                value={slotForm.teacher_id}
                onChange={(e) => setSlotForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map(teacher => {
                  const busyIn = isTeacherBusy(teacher.id, slotForm.day, slotForm.period);
                  return (
                    <option 
                      key={teacher.id} 
                      value={teacher.id}
                      disabled={!!busyIn}
                    >
                      {teacher.name} {busyIn ? `(Busy in ${busyIn})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Room (Optional)</Label>
              <Input
                value={slotForm.room}
                onChange={(e) => setSlotForm(prev => ({ ...prev, room: e.target.value }))}
                placeholder="e.g., Room 101"
              />
            </div>
            
            <div className="flex justify-between gap-3 pt-4">
              <Button 
                variant="destructive" 
                onClick={handleDeleteSlot}
                disabled={saving}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSlot} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Slots Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              Edit Time Slots
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                \ud83d\udccc School timing se default slots set honge. Aap inhe edit kar sakte hain.
              </p>
            </div>

            {timeSlots.map((slot, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-3 p-3 border rounded-lg bg-gray-50">
                <div>
                  <label className="text-xs font-medium text-gray-700">Label</label>
                  <Input
                    value={slot.label}
                    onChange={(e) => {
                      const newSlots = [...timeSlots];
                      newSlots[idx].label = e.target.value;
                      setTimeSlots(newSlots);
                    }}
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Start Time</label>
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => {
                      const newSlots = [...timeSlots];
                      newSlots[idx].start = e.target.value;
                      setTimeSlots(newSlots);
                    }}
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">End Time</label>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => {
                      const newSlots = [...timeSlots];
                      newSlots[idx].end = e.target.value;
                      setTimeSlots(newSlots);
                    }}
                    className="text-sm mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.isBreak || false}
                      onChange={(e) => {
                        const newSlots = [...timeSlots];
                        newSlots[idx].isBreak = e.target.checked;
                        setTimeSlots(newSlots);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">Break</span>
                  </label>
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSlots = timeSlots.filter((_, i) => i !== idx);
                      setTimeSlots(newSlots);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={() => {
                setTimeSlots([...timeSlots, {
                  id: timeSlots.length + 1,
                  label: `Period ${timeSlots.filter(s => !s.isBreak).length + 1}`,
                  start: '09:00',
                  end: '09:45',
                  isBreak: false
                }]);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Slot
            </Button>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowSettingsDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    await axios.post(`${API}/timetable/save-time-slots`, {
                      school_id: schoolId,
                      slots: timeSlots
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('\u2705 Time slots saved!');
                    setShowSettingsDialog(false);
                    fetchAllData();
                  } catch (err) {
                    toast.error('Save failed');
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Time Slots
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
