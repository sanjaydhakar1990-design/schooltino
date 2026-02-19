import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { 
  ClipboardList, Plus, Save, Loader2, Printer, Search, Edit, Trash2,
  BookOpen, GraduationCap, FileText, BarChart3, Award, Calendar, Check,
  Download, Users, TrendingUp, AlertCircle, Settings, Palette, Layers,
  Eye, Share2, Smartphone, Mail, CheckCircle, Star, Target, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const calculateGrade = (percentage, gradingSystem) => {
  const system = gradingSystem || 'cbse';
  const scales = {
    cbse: [
      { min: 91, grade: 'A1', points: 10, remark: 'Outstanding' },
      { min: 81, grade: 'A2', points: 9, remark: 'Excellent' },
      { min: 71, grade: 'B1', points: 8, remark: 'Very Good' },
      { min: 61, grade: 'B2', points: 7, remark: 'Good' },
      { min: 51, grade: 'C1', points: 6, remark: 'Above Average' },
      { min: 41, grade: 'C2', points: 5, remark: 'Average' },
      { min: 33, grade: 'D', points: 4, remark: 'Below Average' },
      { min: 0, grade: 'E', points: 0, remark: 'Needs Improvement' }
    ],
    icse: [
      { min: 90, grade: 'A+', points: 10, remark: 'Exceptional' },
      { min: 80, grade: 'A', points: 9, remark: 'Excellent' },
      { min: 70, grade: 'B+', points: 8, remark: 'Very Good' },
      { min: 60, grade: 'B', points: 7, remark: 'Good' },
      { min: 50, grade: 'C+', points: 6, remark: 'Fair' },
      { min: 40, grade: 'C', points: 5, remark: 'Average' },
      { min: 33, grade: 'D', points: 4, remark: 'Below Average' },
      { min: 0, grade: 'F', points: 0, remark: 'Fail' }
    ],
    state: [
      { min: 90, grade: 'A+', points: 10, remark: 'Distinction' },
      { min: 75, grade: 'A', points: 9, remark: 'First Class' },
      { min: 60, grade: 'B', points: 7, remark: 'Second Class' },
      { min: 45, grade: 'C', points: 5, remark: 'Third Class' },
      { min: 33, grade: 'D', points: 4, remark: 'Pass' },
      { min: 0, grade: 'F', points: 0, remark: 'Fail' }
    ],
    custom: []
  };
  
  const scale = scales[system] || scales.cbse;
  for (const entry of scale) {
    if (percentage >= entry.min) return entry;
  }
  return { grade: 'E', points: 0, remark: 'Needs Improvement' };
};

const DEFAULT_SUBJECTS = [
  { id: 'hindi', name: 'Hindi', name_hi: 'हिंदी', max_marks: 100 },
  { id: 'english', name: 'English', name_hi: 'अंग्रेजी', max_marks: 100 },
  { id: 'math', name: 'Mathematics', name_hi: 'गणित', max_marks: 100 },
  { id: 'science', name: 'Science', name_hi: 'विज्ञान', max_marks: 100 },
  { id: 'sst', name: 'Social Science', name_hi: 'सामाजिक विज्ञान', max_marks: 100 },
  { id: 'computer', name: 'Computer', name_hi: 'कंप्यूटर', max_marks: 50 },
  { id: 'gk', name: 'General Knowledge', name_hi: 'सामान्य ज्ञान', max_marks: 50 },
  { id: 'drawing', name: 'Drawing', name_hi: 'चित्रकला', max_marks: 50 }
];

const EXAM_TYPES = [
  { id: 'unit1', name: 'Unit Test 1', name_hi: 'इकाई परीक्षा 1', max_marks: 20 },
  { id: 'unit2', name: 'Unit Test 2', name_hi: 'इकाई परीक्षा 2', max_marks: 20 },
  { id: 'half_yearly', name: 'Half Yearly', name_hi: 'अर्धवार्षिक परीक्षा', max_marks: 80 },
  { id: 'unit3', name: 'Unit Test 3', name_hi: 'इकाई परीक्षा 3', max_marks: 20 },
  { id: 'unit4', name: 'Unit Test 4', name_hi: 'इकाई परीक्षा 4', max_marks: 20 },
  { id: 'annual', name: 'Annual Exam', name_hi: 'वार्षिक परीक्षा', max_marks: 80 }
];

const REPORT_DESIGNS = [
  { id: 'classic', name: 'Classic', description: 'Traditional report card with borders', color: '#1e40af' },
  { id: 'modern', name: 'Modern', description: 'Clean minimal design with gradients', color: '#7c3aed' },
  { id: 'colorful', name: 'Colorful', description: 'Bright colors with visual elements', color: '#059669' },
  { id: 'formal', name: 'Formal', description: 'Government school style formal layout', color: '#374151' }
];

export default function ExamReportCard() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState({});
  const [school, setSchool] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('marks');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  
  const [gradingSystem, setGradingSystem] = useState('cbse');
  const [selectedDesign, setSelectedDesign] = useState('classic');
  const [reportSettings, setReportSettings] = useState({
    show_rank: true,
    show_attendance: true,
    show_remarks: true,
    show_activities: true,
    show_photo: true,
    show_graph: false,
    principal_name: '',
    watermark: true,
    digital_publish: false,
    show_co_scholastic: true
  });
  
  const [examHierarchy, setExamHierarchy] = useState([
    { id: 'term1', name: 'Term 1', weight: 50, children: [
      { id: 'ut1', name: 'Unit Test 1', weight: 10, max_marks: 20 },
      { id: 'ut2', name: 'Unit Test 2', weight: 10, max_marks: 20 },
      { id: 'half', name: 'Half Yearly', weight: 30, max_marks: 80 }
    ]},
    { id: 'term2', name: 'Term 2', weight: 50, children: [
      { id: 'ut3', name: 'Unit Test 3', weight: 10, max_marks: 20 },
      { id: 'ut4', name: 'Unit Test 4', weight: 10, max_marks: 20 },
      { id: 'annual', name: 'Annual Exam', weight: 30, max_marks: 80 }
    ]}
  ]);

  const [coScholastic, setCoScholastic] = useState([
    { id: 'art', name: 'Art & Craft', grade: '' },
    { id: 'music', name: 'Music', grade: '' },
    { id: 'dance', name: 'Dance', grade: '' },
    { id: 'sports', name: 'Physical Education', grade: '' },
    { id: 'discipline', name: 'Discipline', grade: '' },
    { id: 'personality', name: 'Personality Development', grade: '' }
  ]);

  const [examForm, setExamForm] = useState({
    name: '',
    type: 'unit1',
    class_id: '',
    start_date: '',
    end_date: '',
    max_marks: 20
  });

  const [marksEntry, setMarksEntry] = useState({});

  useEffect(() => {
    if (schoolId) fetchAllData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClass && selectedExam) {
      fetchMarks();
      fetchStudents();
    }
  }, [selectedClass, selectedExam]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classRes, examRes, schoolRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/exam-schedules?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/schools/${schoolId}`, { headers })
      ]);
      
      setClasses(classRes.data || []);
      setExams(examRes.data || []);
      setSchool(schoolRes.data);
      
      if (classRes.data?.length > 0) setSelectedClass(classRes.data[0].id);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/students?school_id=${schoolId}&class_id=${selectedClass}&status=active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/marks?school_id=${schoolId}&class_id=${selectedClass}&exam_id=${selectedExam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => ({ data: {} }));
      
      const marksObj = {};
      (response.data || []).forEach(m => {
        if (!marksObj[m.student_id]) marksObj[m.student_id] = {};
        marksObj[m.student_id][m.subject_id] = m.marks;
      });
      setMarks(marksObj);
      setMarksEntry(marksObj);
    } catch (error) {
      console.error('Error fetching marks:', error);
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.name || !examForm.class_id) {
      toast.error('Please fill required fields');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exam-schedule`, {
        ...examForm,
        school_id: schoolId,
        created_by: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Exam created!');
      setShowExamDialog(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedExam) {
      toast.error('Please select class and exam');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const marksData = [];
      Object.entries(marksEntry).forEach(([studentId, studentMarks]) => {
        Object.entries(studentMarks).forEach(([subjectId, obtainedMarks]) => {
          if (obtainedMarks !== undefined && obtainedMarks !== '') {
            marksData.push({
              student_id: studentId,
              subject_id: subjectId,
              marks: parseFloat(obtainedMarks) || 0
            });
          }
        });
      });
      
      await axios.post(`${API}/marks/bulk`, {
        school_id: schoolId,
        class_id: selectedClass,
        exam_id: selectedExam,
        marks: marksData,
        entered_by: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Marks saved successfully!');
      setMarks(marksEntry);
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const updateMarks = (studentId, subjectId, value) => {
    setMarksEntry(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectId]: value }
    }));
  };

  const calculateResult = (studentId) => {
    const studentMarks = marks[studentId] || {};
    let totalObtained = 0;
    let totalMax = 0;
    
    subjects.forEach(subject => {
      const obtained = parseFloat(studentMarks[subject.id]) || 0;
      totalObtained += obtained;
      totalMax += subject.max_marks;
    });
    
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const gradeInfo = calculateGrade(percentage, gradingSystem);
    
    return {
      totalObtained, totalMax,
      percentage: percentage.toFixed(2),
      ...gradeInfo,
      passed: percentage >= 33
    };
  };

  const generateReportCard = (student) => {
    setSelectedStudent(student);
    setShowReportCard(true);
  };

  const handlePrintReportCard = () => {
    if (!selectedStudent) return;
    
    const result = calculateResult(selectedStudent.id);
    const studentMarks = marks[selectedStudent.id] || {};
    const studentClass = classes.find(c => c.id === selectedStudent.class_id);
    const design = REPORT_DESIGNS.find(d => d.id === selectedDesign) || REPORT_DESIGNS[0];
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Report Card - ${selectedStudent.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 3px solid ${design.color}; padding-bottom: 15px; margin-bottom: 20px; }
          .header img { width: 70px; height: 70px; }
          .header h1 { margin: 10px 0 5px; font-size: 22px; color: ${design.color}; }
          .header h2 { margin: 10px 0; font-size: 16px; text-decoration: underline; color: ${design.color}; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; }
          .info-grid div { padding: 5px; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #333; padding: 8px; text-align: center; font-size: 12px; }
          th { background: ${design.color}15; color: ${design.color}; }
          .result-box { background: ${design.color}08; border: 2px solid ${design.color}30; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .result-box h3 { margin: 0 0 10px; color: ${design.color}; }
          .grade { font-size: 24px; font-weight: bold; color: ${result.passed ? '#22c55e' : '#ef4444'}; }
          .co-scholastic { margin: 20px 0; }
          .co-scholastic h4 { color: ${design.color}; margin-bottom: 10px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .signatures div { text-align: center; }
          .signatures .line { border-top: 1px solid #000; width: 120px; margin-top: 40px; }
          ${reportSettings.watermark && school?.logo_url ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; width: 300px; }` : ''}
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${reportSettings.watermark && school?.logo_url ? `<img src="${school.logo_url}" class="watermark" />` : ''}
        <div class="header">
          ${school?.logo_url ? `<img src="${school.logo_url}" />` : ''}
          <h1>${school?.name || 'School Name'}</h1>
          <p style="margin: 0; font-size: 11px;">${school?.address || ''}</p>
          ${school?.phone ? `<p style="margin: 2px 0; font-size: 11px;">Phone: ${school.phone}</p>` : ''}
          ${school?.registration_number ? `<p style="margin: 2px 0; font-size: 11px;">Reg. No: ${school.registration_number}</p>` : ''}
          <h2>PROGRESS REPORT / प्रगति पत्र</h2>
          <p>Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</p>
        </div>
        
        <div class="info-grid">
          <div><b>Student Name:</b> ${selectedStudent.name}</div>
          <div><b>Roll No:</b> ${selectedStudent.roll_no || selectedStudent.student_id}</div>
          <div><b>Father's Name:</b> ${selectedStudent.father_name || '-'}</div>
          <div><b>Class:</b> ${studentClass?.name || '-'}</div>
          <div><b>Date of Birth:</b> ${selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString('en-IN') : '-'}</div>
          <div><b>Admission No:</b> ${selectedStudent.admission_no || selectedStudent.student_id}</div>
          ${reportSettings.show_attendance ? `<div><b>Attendance:</b> -</div>` : ''}
          ${reportSettings.show_rank ? `<div><b>Rank:</b> -</div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Subject</th>
              <th>Max Marks</th>
              <th>Marks Obtained</th>
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map((subject, idx) => {
              const obtained = parseFloat(studentMarks[subject.id]) || 0;
              const pct = (obtained / subject.max_marks) * 100;
              const gradeInfo = calculateGrade(pct, gradingSystem);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="text-align: left;">${subject.name} (${subject.name_hi})</td>
                  <td>${subject.max_marks}</td>
                  <td>${obtained}</td>
                  <td>${gradeInfo.grade}</td>
                  <td>${gradeInfo.remark}</td>
                </tr>
              `;
            }).join('')}
            <tr style="font-weight: bold; background: ${design.color}08;">
              <td colspan="2">Total</td>
              <td>${subjects.reduce((sum, s) => sum + s.max_marks, 0)}</td>
              <td>${result.totalObtained}</td>
              <td>${result.grade}</td>
              <td>${result.remark}</td>
            </tr>
          </tbody>
        </table>
        
        ${reportSettings.show_co_scholastic ? `
        <div class="co-scholastic">
          <h4>Co-Scholastic Activities / सह-शैक्षिक गतिविधियाँ</h4>
          <table>
            <thead><tr><th>Activity</th><th>Grade</th></tr></thead>
            <tbody>
              ${coScholastic.map(a => `<tr><td style="text-align:left">${a.name}</td><td>${a.grade || 'A'}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="result-box">
          <h3>Overall Result / समग्र परिणाम</h3>
          <p>Percentage: <b>${result.percentage}%</b></p>
          <p class="grade">Grade: ${result.grade} (${result.remark})</p>
          <p>Result: <b style="color: ${result.passed ? '#22c55e' : '#ef4444'};">${result.passed ? 'PASSED' : 'FAILED'}</b></p>
        </div>

        ${reportSettings.show_remarks ? `
        <div style="margin: 15px 0; padding: 10px; border: 1px dashed #ccc; border-radius: 6px;">
          <p><b>Teacher's Remarks:</b> ___________________________________</p>
        </div>` : ''}
        
        <div class="signatures">
          <div><div class="line"></div><p>Class Teacher</p></div>
          <div><div class="line"></div><p>Parent/Guardian</p></div>
          <div><div class="line"></div><p>${reportSettings.principal_name || 'Principal'}</p></div>
        </div>
        
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDigitalPublish = () => {
    toast.success('Report cards published digitally! Parents can view on StudyTino app.');
  };

  const handleBulkPrint = () => {
    toast.success(`Printing report cards for ${students.length} students...`);
    students.forEach((student, i) => {
      setTimeout(() => {
        setSelectedStudent(student);
      }, i * 500);
    });
  };

  return (
    <div className="space-y-6" data-testid="exam-report-card">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              {t('exams')} & {t('report_card')}
            </h1>
            <p className="text-blue-100 mt-2">
              {t('exams_reports')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowExamDialog(true)} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline">
              <Plus className="w-4 h-4" />
              {t('create_exam')}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: t('exams'), value: exams.length || EXAM_TYPES.length, icon: Calendar },
            { label: t('classes'), value: classes.length, icon: GraduationCap },
            { label: t('students'), value: students.length, icon: Users },
            { label: t('grade'), value: gradingSystem.toUpperCase(), icon: Award }
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-blue-200" />
                <span className="text-sm text-blue-200">{stat.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 max-w-4xl">
          <TabsTrigger value="marks" className="gap-1 text-xs">
            <Edit className="w-3.5 h-3.5" />
            {t('marks_entry')}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            {t('result')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1 text-xs">
            <FileText className="w-3.5 h-3.5" />
            {t('report_card')}
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-1 text-xs">
            <Layers className="w-3.5 h-3.5" />
            {t('exam_schedule')}
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-1 text-xs">
            <Palette className="w-3.5 h-3.5" />
            {t('settings')}
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-1 text-xs">
            <Settings className="w-3.5 h-3.5" />
            {t('grade')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t('enter_marks')}</CardTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                    <option value="">{t('select_class')}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                    <option value="">{t('exam_type')}</option>
                    {EXAM_TYPES.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                  <Button onClick={handleSaveMarks} disabled={saving || !selectedClass || !selectedExam} className="gap-2 bg-green-600 hover:bg-green-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('save')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : selectedClass && selectedExam ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">{t('serial_no')}</TableHead>
                        <TableHead>{t('student_name')}</TableHead>
                        <TableHead>{t('roll_no')}</TableHead>
                        {subjects.map(subject => (
                          <TableHead key={subject.id} className="text-center min-w-[80px]">
                            <div className="text-xs">{subject.name}</div>
                            <div className="text-[10px] font-normal text-slate-400">Max: {subject.max_marks}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">{t('total')}</TableHead>
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">{t('grade')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const sm = marksEntry[student.id] || {};
                        const total = subjects.reduce((sum, s) => sum + (parseFloat(sm[s.id]) || 0), 0);
                        const maxTotal = subjects.reduce((sum, s) => sum + s.max_marks, 0);
                        const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0';
                        const g = calculateGrade(parseFloat(pct), gradingSystem);
                        return (
                          <TableRow key={student.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{student.name}</TableCell>
                            <TableCell className="text-sm">{student.roll_no || student.student_id}</TableCell>
                            {subjects.map(subject => (
                              <TableCell key={subject.id} className="p-1">
                                <Input type="number" min="0" max={subject.max_marks} value={sm[subject.id] || ''} onChange={(e) => updateMarks(student.id, subject.id, e.target.value)} className="w-16 text-center text-sm" placeholder="-" />
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-semibold">{total}</TableCell>
                            <TableCell className="text-center text-sm">{pct}%</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={g.grade.startsWith('A') ? 'default' : g.grade === 'E' || g.grade === 'F' ? 'destructive' : 'secondary'}>{g.grade}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">{t('select_class')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t('exam_results')}</CardTitle>
                <div className="flex gap-3">
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                    <option value="">{t('select_class')}</option>
                    {classes.map(cls => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
                  </select>
                  <Button variant="outline" className="gap-2 text-sm" onClick={() => toast.success('Exporting results...')}>
                    <Download className="w-4 h-4" /> {t('export')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedClass && students.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {(() => {
                      const results = students.map(s => calculateResult(s.id));
                      const passed = results.filter(r => r.passed).length;
                      const avgPct = results.reduce((s, r) => s + parseFloat(r.percentage), 0) / results.length;
                      const topGrade = results.filter(r => r.grade.startsWith('A')).length;
                      return [
                        { label: t('pass_percentage'), value: `${((passed/results.length)*100).toFixed(0)}%`, color: 'bg-green-50 text-green-700' },
                        { label: t('average_marks'), value: `${avgPct.toFixed(1)}%`, color: 'bg-blue-50 text-blue-700' },
                        { label: t('highest_marks'), value: topGrade, color: 'bg-purple-50 text-purple-700' },
                        { label: t('total_students'), value: results.length, color: 'bg-slate-50 text-slate-700' }
                      ].map((s, i) => (
                        <div key={i} className={`p-3 rounded-xl ${s.color}`}>
                          <p className="text-xs opacity-75">{s.label}</p>
                          <p className="text-xl font-bold">{s.value}</p>
                        </div>
                      ));
                    })()}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('rank')}</TableHead>
                        <TableHead>{t('student_name')}</TableHead>
                        <TableHead>{t('roll_no')}</TableHead>
                        <TableHead className="text-center">{t('total')}</TableHead>
                        <TableHead className="text-center">%</TableHead>
                        <TableHead className="text-center">{t('grade')}</TableHead>
                        <TableHead className="text-center">{t('result')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students
                        .map(student => ({ ...student, result: calculateResult(student.id) }))
                        .sort((a, b) => parseFloat(b.result.percentage) - parseFloat(a.result.percentage))
                        .map((student, idx) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-bold">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.roll_no || student.student_id}</TableCell>
                            <TableCell className="text-center">{student.result.totalObtained}/{student.result.totalMax}</TableCell>
                            <TableCell className="text-center">{student.result.percentage}%</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={student.result.grade.startsWith('A') ? 'default' : student.result.grade === 'E' || student.result.grade === 'F' ? 'destructive' : 'secondary'}>
                                {student.result.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={student.result.passed ? 'default' : 'destructive'}>
                                {student.result.passed ? t('pass') : t('fail')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-10">
                  <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">{t('select_class')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>{t('report_card')}</CardTitle>
                  <CardDescription>{t('generate_report')}</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                    <option value="">{t('select_class')}</option>
                    {classes.map(cls => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
                  </select>
                  <Button variant="outline" className="gap-2 text-sm" onClick={handleBulkPrint}>
                    <Printer className="w-4 h-4" /> {t('print')}
                  </Button>
                  <Button className="gap-2 text-sm bg-green-600 hover:bg-green-700" onClick={handleDigitalPublish}>
                    <Share2 className="w-4 h-4" /> {t('generate_report')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedClass && students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(student => {
                    const result = calculateResult(student.id);
                    return (
                      <div key={student.id} className="p-4 border rounded-xl hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {student.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{student.name}</p>
                            <p className="text-sm text-slate-500">{student.roll_no || student.student_id}</p>
                          </div>
                          <Badge variant={result.passed ? 'default' : 'destructive'}>{result.grade}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-[10px] text-slate-400">{t('total')}</p>
                            <p className="font-semibold">{result.totalObtained}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-[10px] text-slate-400">{t('percentage')}</p>
                            <p className="font-semibold">{result.percentage}%</p>
                          </div>
                          <div className={`rounded-lg p-2 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className="text-[10px] text-slate-400">{t('result')}</p>
                            <p className={`font-semibold text-xs ${result.passed ? 'text-green-700' : 'text-red-700'}`}>{result.passed ? t('pass') : t('fail')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => generateReportCard(student)} variant="outline" className="flex-1 gap-1 text-sm" size="sm">
                            <Eye className="w-3.5 h-3.5" /> {t('view')}
                          </Button>
                          <Button onClick={() => { setSelectedStudent(student); handlePrintReportCard(); }} className="flex-1 gap-1 text-sm bg-blue-600 hover:bg-blue-700" size="sm">
                            <Printer className="w-3.5 h-3.5" /> {t('print')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">{t('select_class')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /> {t('exam_schedule')}</CardTitle>
                  <CardDescription>{t('exam_schedule')}</CardDescription>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => { toast.success('Exam structure saved!'); }}>
                  <Save className="w-4 h-4" /> {t('save')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examHierarchy.map((term, ti) => (
                  <div key={term.id} className="border rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <Input value={term.name} onChange={(e) => {
                            const updated = [...examHierarchy];
                            updated[ti].name = e.target.value;
                            setExamHierarchy(updated);
                          }} className="font-semibold text-lg border-0 bg-transparent p-0 h-auto focus-visible:ring-0" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-500">Weight:</Label>
                        <Input type="number" value={term.weight} onChange={(e) => {
                          const updated = [...examHierarchy];
                          updated[ti].weight = parseInt(e.target.value) || 0;
                          setExamHierarchy(updated);
                        }} className="w-16 text-center" />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      {term.children.map((child, ci) => (
                        <div key={child.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <Input value={child.name} onChange={(e) => {
                            const updated = [...examHierarchy];
                            updated[ti].children[ci].name = e.target.value;
                            setExamHierarchy(updated);
                          }} className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0" />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-400">Weight:</Label>
                            <Input type="number" value={child.weight} onChange={(e) => {
                              const updated = [...examHierarchy];
                              updated[ti].children[ci].weight = parseInt(e.target.value) || 0;
                              setExamHierarchy(updated);
                            }} className="w-14 text-center text-sm" />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-400">Max:</Label>
                            <Input type="number" value={child.max_marks} onChange={(e) => {
                              const updated = [...examHierarchy];
                              updated[ti].children[ci].max_marks = parseInt(e.target.value) || 0;
                              setExamHierarchy(updated);
                            }} className="w-14 text-center text-sm" />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const updated = [...examHierarchy];
                            updated[ti].children.splice(ci, 1);
                            setExamHierarchy(updated);
                          }}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="gap-2 ml-5 text-xs" onClick={() => {
                        const updated = [...examHierarchy];
                        updated[ti].children.push({ id: `new_${Date.now()}`, name: 'New Assessment', weight: 10, max_marks: 20 });
                        setExamHierarchy(updated);
                      }}>
                        <Plus className="w-3 h-3" /> {t('create_exam')}
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="gap-2 w-full" onClick={() => {
                  setExamHierarchy([...examHierarchy, { id: `term_${Date.now()}`, name: 'New Term', weight: 0, children: [] }]);
                }}>
                  <Plus className="w-4 h-4" /> {t('create_exam')}
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-medium text-blue-800 flex items-center gap-2"><Target className="w-4 h-4" /> {t('exam_schedule')}</h4>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>Term &gt; Assessment (Unit Test, Half Yearly, Annual)</p>
                  <p>Each assessment can have its own max marks and weightage</p>
                  <p>Total weightage across all terms should equal 100%</p>
                  <p>Current total: <b>{examHierarchy.reduce((s, t) => s + t.weight, 0)}%</b></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600" /> {t('report_card')}</CardTitle>
                  <CardDescription>{t('report_card')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {REPORT_DESIGNS.map(design => (
                      <button key={design.id} onClick={() => setSelectedDesign(design.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${selectedDesign === design.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-200'}`}>
                        <div className="w-full h-20 rounded-lg mb-2 flex items-center justify-center" style={{ background: `${design.color}15`, border: `2px solid ${design.color}40` }}>
                          <FileText className="w-8 h-8" style={{ color: design.color }} />
                        </div>
                        <p className="font-medium text-sm">{design.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{design.description}</p>
                      </button>
                    ))}
                  </div>

                  <h4 className="font-medium text-slate-700 mb-3">{t('class_performance')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {coScholastic.map((activity, i) => (
                      <div key={activity.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="flex-1 text-sm">{activity.name}</span>
                        <select value={activity.grade} onChange={(e) => {
                          const updated = [...coScholastic];
                          updated[i].grade = e.target.value;
                          setCoScholastic(updated);
                        }} className="px-2 py-1 border rounded text-sm">
                          <option value="">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                    setCoScholastic([...coScholastic, { id: `act_${Date.now()}`, name: 'New Activity', grade: '' }]);
                  }}>
                    <Plus className="w-3 h-3" /> {t('add')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('settings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'show_rank', label: t('rank') },
                    { key: 'show_attendance', label: t('attendance') },
                    { key: 'show_remarks', label: t('remarks') },
                    { key: 'show_co_scholastic', label: t('class_performance') },
                    { key: 'show_photo', label: t('photo') },
                    { key: 'show_graph', label: t('percentage') },
                    { key: 'watermark', label: t('settings') },
                    { key: 'digital_publish', label: t('generate_report') }
                  ].map(setting => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <Label className="text-sm">{setting.label}</Label>
                      <Switch checked={reportSettings[setting.key]} onCheckedChange={(checked) => setReportSettings(prev => ({ ...prev, [setting.key]: checked }))} />
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <Label className="text-sm">{t('name')}</Label>
                    <Input value={reportSettings.principal_name} onChange={(e) => setReportSettings(prev => ({ ...prev, principal_name: e.target.value }))} placeholder="Principal's name" className="mt-1" />
                  </div>
                  <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => toast.success('Design settings saved!')}>
                    <Save className="w-4 h-4" /> {t('save_settings')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Share2 className="w-4 h-4 text-green-600" /> {t('generate_report')}</h4>
                  <p className="text-xs text-slate-500 mb-3">Published report cards are visible to parents on the StudyTino mobile app.</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.success('Report cards shared via WhatsApp!')}>
                      <Smartphone className="w-4 h-4" /> {t('share')}
                    </Button>
                    <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => toast.success('Report cards emailed to parents!')}>
                      <Mail className="w-4 h-4" /> {t('send')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grading" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-orange-600" /> {t('grade')}</CardTitle>
                <CardDescription>{t('grade')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { id: 'cbse', name: 'CBSE', desc: 'A1-E Scale' },
                    { id: 'icse', name: 'ICSE', desc: 'A+-F Scale' },
                    { id: 'state', name: 'State Board', desc: 'Distinction-Fail' },
                    { id: 'custom', name: 'Custom', desc: 'Your own scale' }
                  ].map(system => (
                    <button key={system.id} onClick={() => setGradingSystem(system.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${gradingSystem === system.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-200 hover:border-orange-200'}`}>
                      <Award className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                      <p className="font-semibold text-sm">{system.name}</p>
                      <p className="text-[10px] text-slate-500">{system.desc}</p>
                    </button>
                  ))}
                </div>

                <h4 className="font-medium text-slate-700 mb-3">{t('grade')}: {gradingSystem.toUpperCase()}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Min %</TableHead>
                      <TableHead>{t('grade')}</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>{t('remarks')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const scales = {
                        cbse: [
                          { min: 91, grade: 'A1', points: 10, remark: 'Outstanding' },
                          { min: 81, grade: 'A2', points: 9, remark: 'Excellent' },
                          { min: 71, grade: 'B1', points: 8, remark: 'Very Good' },
                          { min: 61, grade: 'B2', points: 7, remark: 'Good' },
                          { min: 51, grade: 'C1', points: 6, remark: 'Above Average' },
                          { min: 41, grade: 'C2', points: 5, remark: 'Average' },
                          { min: 33, grade: 'D', points: 4, remark: 'Below Average' },
                          { min: 0, grade: 'E', points: 0, remark: 'Needs Improvement' }
                        ],
                        icse: [
                          { min: 90, grade: 'A+', points: 10, remark: 'Exceptional' },
                          { min: 80, grade: 'A', points: 9, remark: 'Excellent' },
                          { min: 70, grade: 'B+', points: 8, remark: 'Very Good' },
                          { min: 60, grade: 'B', points: 7, remark: 'Good' },
                          { min: 50, grade: 'C+', points: 6, remark: 'Fair' },
                          { min: 40, grade: 'C', points: 5, remark: 'Average' },
                          { min: 33, grade: 'D', points: 4, remark: 'Below Average' },
                          { min: 0, grade: 'F', points: 0, remark: 'Fail' }
                        ],
                        state: [
                          { min: 90, grade: 'A+', points: 10, remark: 'Distinction' },
                          { min: 75, grade: 'A', points: 9, remark: 'First Class' },
                          { min: 60, grade: 'B', points: 7, remark: 'Second Class' },
                          { min: 45, grade: 'C', points: 5, remark: 'Third Class' },
                          { min: 33, grade: 'D', points: 4, remark: 'Pass' },
                          { min: 0, grade: 'F', points: 0, remark: 'Fail' }
                        ],
                        custom: [
                          { min: 90, grade: 'A+', points: 10, remark: 'Outstanding' },
                          { min: 75, grade: 'A', points: 8, remark: 'Excellent' },
                          { min: 60, grade: 'B', points: 6, remark: 'Good' },
                          { min: 33, grade: 'C', points: 4, remark: 'Pass' },
                          { min: 0, grade: 'F', points: 0, remark: 'Fail' }
                        ]
                      };
                      return (scales[gradingSystem] || scales.cbse).map((entry, i) => (
                        <TableRow key={i}>
                          <TableCell>{entry.min}%+</TableCell>
                          <TableCell><Badge>{entry.grade}</Badge></TableCell>
                          <TableCell>{entry.points}</TableCell>
                          <TableCell>{entry.remark}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" /> {t('pass')}/{t('fail')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">{t('min_marks')}</Label>
                    <Input type="number" defaultValue={33} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">{t('min_marks')} ({t('subject')})</Label>
                    <Input type="number" defaultValue={33} className="mt-1" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label className="text-sm">{t('max_marks')}</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div>
                    <Label className="text-sm">{t('max_marks')}</Label>
                    <Input type="number" defaultValue={5} className="mt-1" />
                  </div>
                  <Button className="w-full gap-2 bg-orange-600 hover:bg-orange-700 mt-2" onClick={() => toast.success('Grading criteria saved!')}>
                    <Save className="w-4 h-4" /> {t('save')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> {t('total_marks')}</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Auto-calculate totals', checked: true },
                      { label: 'Weighted scoring', checked: true },
                      { label: 'Best of N exams', checked: false },
                      { label: 'Internal assessment marks', checked: true },
                      { label: 'Practical marks separate', checked: false }
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Label className="text-sm">{opt.label}</Label>
                        <Switch defaultChecked={opt.checked} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('create_exam')}</DialogTitle>
            <DialogDescription>{t('create_exam')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('exam_name')} *</Label>
              <Input value={examForm.name} onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Half Yearly Exam 2025" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('exam_type')}</Label>
                <select value={examForm.type} onChange={(e) => {
                  const type = EXAM_TYPES.find(t => t.id === e.target.value);
                  setExamForm(prev => ({ ...prev, type: e.target.value, max_marks: type?.max_marks || 20 }));
                }} className="w-full px-3 py-2 border rounded-lg">
                  {EXAM_TYPES.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('classes')} *</Label>
                <select value={examForm.class_id} onChange={(e) => setExamForm(prev => ({ ...prev, class_id: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">{t('select_class')}</option>
                  {classes.map(cls => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('start_date')}</Label>
                <Input type="date" value={examForm.start_date} onChange={(e) => setExamForm(prev => ({ ...prev, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('end_date')}</Label>
                <Input type="date" value={examForm.end_date} onChange={(e) => setExamForm(prev => ({ ...prev, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowExamDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreateExam} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t('create_exam')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportCard} onOpenChange={setShowReportCard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('report_card')}</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="text-center border-b-2 pb-4 mb-4" style={{ borderColor: REPORT_DESIGNS.find(d => d.id === selectedDesign)?.color }}>
                {school?.logo_url && <img src={school.logo_url} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />}
                <h2 className="text-xl font-bold" style={{ color: REPORT_DESIGNS.find(d => d.id === selectedDesign)?.color }}>{school?.name}</h2>
                <p className="text-sm text-slate-500">{school?.address}</p>
                <h3 className="text-lg font-semibold mt-2 underline">{t('report_card')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div><b>{t('name')}:</b> {selectedStudent.name}</div>
                <div><b>{t('roll_no')}:</b> {selectedStudent.roll_no || selectedStudent.student_id}</div>
                <div><b>{t('father_name')}:</b> {selectedStudent.father_name}</div>
                <div><b>{t('classes')}:</b> {classes.find(c => c.id === selectedStudent.class_id)?.name}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('subject')}</TableHead>
                    <TableHead className="text-center">{t('max_marks')}</TableHead>
                    <TableHead className="text-center">{t('obtained_marks')}</TableHead>
                    <TableHead className="text-center">{t('grade')}</TableHead>
                    <TableHead className="text-center">{t('remarks')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(subject => {
                    const obtained = parseFloat(marks[selectedStudent.id]?.[subject.id]) || 0;
                    const pct = (obtained / subject.max_marks) * 100;
                    const g = calculateGrade(pct, gradingSystem);
                    return (
                      <TableRow key={subject.id}>
                        <TableCell>{subject.name} ({subject.name_hi})</TableCell>
                        <TableCell className="text-center">{subject.max_marks}</TableCell>
                        <TableCell className="text-center">{obtained}</TableCell>
                        <TableCell className="text-center"><Badge>{g.grade}</Badge></TableCell>
                        <TableCell className="text-center text-xs">{g.remark}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {reportSettings.show_co_scholastic && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">{t('class_performance')}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {coScholastic.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <span>{a.name}</span>
                        <Badge variant="secondary">{a.grade || 'A'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center">
                <p>{t('percentage')}: <b>{calculateResult(selectedStudent.id).percentage}%</b></p>
                <p>{t('grade')}: <b>{calculateResult(selectedStudent.id).grade}</b> ({calculateResult(selectedStudent.id).remark})</p>
                <p className={`font-bold ${calculateResult(selectedStudent.id).passed ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateResult(selectedStudent.id).passed ? t('pass') : t('fail')}
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowReportCard(false)}>{t('close')}</Button>
                <Button onClick={handlePrintReportCard} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4" /> {t('print')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
