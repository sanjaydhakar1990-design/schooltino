import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  ClipboardList, Plus, Save, Loader2, Printer, Search, Edit, Trash2,
  BookOpen, GraduationCap, FileText, BarChart3, Award, Calendar, Check,
  Download, Users, TrendingUp, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Grade calculation
const calculateGrade = (percentage) => {
  if (percentage >= 91) return { grade: 'A1', points: 10, remark: 'Outstanding' };
  if (percentage >= 81) return { grade: 'A2', points: 9, remark: 'Excellent' };
  if (percentage >= 71) return { grade: 'B1', points: 8, remark: 'Very Good' };
  if (percentage >= 61) return { grade: 'B2', points: 7, remark: 'Good' };
  if (percentage >= 51) return { grade: 'C1', points: 6, remark: 'Above Average' };
  if (percentage >= 41) return { grade: 'C2', points: 5, remark: 'Average' };
  if (percentage >= 33) return { grade: 'D', points: 4, remark: 'Below Average' };
  return { grade: 'E', points: 0, remark: 'Needs Improvement' };
};

// Default subjects
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

// Exam types
const EXAM_TYPES = [
  { id: 'unit1', name: 'Unit Test 1', name_hi: 'इकाई परीक्षा 1', max_marks: 20 },
  { id: 'unit2', name: 'Unit Test 2', name_hi: 'इकाई परीक्षा 2', max_marks: 20 },
  { id: 'half_yearly', name: 'Half Yearly', name_hi: 'अर्धवार्षिक परीक्षा', max_marks: 80 },
  { id: 'unit3', name: 'Unit Test 3', name_hi: 'इकाई परीक्षा 3', max_marks: 20 },
  { id: 'unit4', name: 'Unit Test 4', name_hi: 'इकाई परीक्षा 4', max_marks: 20 },
  { id: 'annual', name: 'Annual Exam', name_hi: 'वार्षिक परीक्षा', max_marks: 80 }
];

export default function ExamReportCard() {
  const { schoolId, user } = useAuth();
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState({});
  const [school, setSchool] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('marks');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);
  
  // Exam form
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'unit1',
    class_id: '',
    start_date: '',
    end_date: '',
    max_marks: 20
  });

  // Marks entry
  const [marksEntry, setMarksEntry] = useState({});

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
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
        axios.get(`${API}/exams?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/schools/${schoolId}`, { headers })
      ]);
      
      setClasses(classRes.data || []);
      setExams(examRes.data || []);
      setSchool(schoolRes.data);
      
      if (classRes.data?.length > 0) {
        setSelectedClass(classRes.data[0].id);
      }
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
      
      // Convert to object format: { studentId: { subjectId: marks } }
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

  // Create exam
  const handleCreateExam = async () => {
    if (!examForm.name || !examForm.class_id) {
      toast.error('Please fill required fields');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exams`, {
        ...examForm,
        school_id: schoolId,
        created_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Exam created!');
      setShowExamDialog(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedExam) {
      toast.error('Please select class and exam');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare marks data
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
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Marks saved successfully!');
      setMarks(marksEntry);
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Update marks for a student
  const updateMarks = (studentId, subjectId, value) => {
    setMarksEntry(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: value
      }
    }));
  };

  // Calculate student result
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
    const gradeInfo = calculateGrade(percentage);
    
    return {
      totalObtained,
      totalMax,
      percentage: percentage.toFixed(2),
      ...gradeInfo,
      passed: percentage >= 33
    };
  };

  // Generate report card
  const generateReportCard = (student) => {
    setSelectedStudent(student);
    setShowReportCard(true);
  };

  // Print report card
  const handlePrintReportCard = () => {
    if (!selectedStudent) return;
    
    const result = calculateResult(selectedStudent.id);
    const studentMarks = marks[selectedStudent.id] || {};
    const studentClass = classes.find(c => c.id === selectedStudent.class_id);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Report Card - ${selectedStudent.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          .header img { width: 70px; height: 70px; }
          .header h1 { margin: 10px 0 5px; font-size: 22px; }
          .header h2 { margin: 10px 0; font-size: 16px; text-decoration: underline; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; }
          .info-grid div { padding: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #333; padding: 8px; text-align: center; font-size: 12px; }
          th { background: #f5f5f5; }
          .result-box { background: #f0f0f0; padding: 15px; text-align: center; margin: 20px 0; }
          .result-box h3 { margin: 0 0 10px; }
          .grade { font-size: 24px; font-weight: bold; color: ${result.passed ? '#22c55e' : '#ef4444'}; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .signatures div { text-align: center; }
          .signatures .line { border-top: 1px solid #000; width: 120px; margin-top: 40px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${school?.logo_url ? `<img src="${school.logo_url}" />` : ''}
          <h1>${school?.name || 'School Name'}</h1>
          <p style="margin: 0; font-size: 11px;">${school?.address || ''}</p>
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
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Subject</th>
              <th>Max Marks</th>
              <th>Marks Obtained</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map((subject, idx) => {
              const obtained = parseFloat(studentMarks[subject.id]) || 0;
              const pct = (obtained / subject.max_marks) * 100;
              const gradeInfo = calculateGrade(pct);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="text-align: left;">${subject.name} (${subject.name_hi})</td>
                  <td>${subject.max_marks}</td>
                  <td>${obtained}</td>
                  <td>${gradeInfo.grade}</td>
                </tr>
              `;
            }).join('')}
            <tr style="font-weight: bold; background: #f5f5f5;">
              <td colspan="2">Total</td>
              <td>${subjects.reduce((sum, s) => sum + s.max_marks, 0)}</td>
              <td>${result.totalObtained}</td>
              <td>${result.grade}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="result-box">
          <h3>Overall Result</h3>
          <p>Percentage: <b>${result.percentage}%</b></p>
          <p class="grade">Grade: ${result.grade} (${result.remark})</p>
          <p>Result: <b style="color: ${result.passed ? '#22c55e' : '#ef4444'};">${result.passed ? 'PASSED' : 'FAILED'}</b></p>
        </div>
        
        <div class="signatures">
          <div>
            <div class="line"></div>
            <p>Class Teacher</p>
          </div>
          <div>
            <div class="line"></div>
            <p>Parent/Guardian</p>
          </div>
          <div>
            <div class="line"></div>
            <p>Principal</p>
          </div>
        </div>
        
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" data-testid="exam-report-card">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            Exam & Report Card
          </h1>
          <p className="text-slate-500 mt-1">Marks entry, grading & report card generation</p>
        </div>
        <Button onClick={() => setShowExamDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Exam
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="marks" className="gap-2">
            <Edit className="w-4 h-4" />
            Marks Entry
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            Report Cards
          </TabsTrigger>
        </TabsList>

        {/* Marks Entry Tab */}
        <TabsContent value="marks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Enter Marks</CardTitle>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Exam</option>
                    {EXAM_TYPES.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                  <Button 
                    onClick={handleSaveMarks} 
                    disabled={saving || !selectedClass || !selectedExam}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Marks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : selectedClass && selectedExam ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">S.No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        {subjects.map(subject => (
                          <TableHead key={subject.id} className="text-center min-w-[80px]">
                            <div>{subject.name}</div>
                            <div className="text-xs font-normal text-slate-500">Max: {subject.max_marks}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const studentMarks = marksEntry[student.id] || {};
                        const total = subjects.reduce((sum, s) => sum + (parseFloat(studentMarks[s.id]) || 0), 0);
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.roll_no || student.student_id}</TableCell>
                            {subjects.map(subject => (
                              <TableCell key={subject.id} className="p-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max={subject.max_marks}
                                  value={studentMarks[subject.id] || ''}
                                  onChange={(e) => updateMarks(student.id, subject.id, e.target.value)}
                                  className="w-16 text-center"
                                  placeholder="-"
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-semibold">
                              {total}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-10">Select class and exam to enter marks</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Class Results</CardTitle>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedClass ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Result</TableHead>
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
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              student.result.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                              student.result.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                              student.result.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.result.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              student.result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {student.result.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-slate-500 py-10">Select a class to view results</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Cards Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generate Report Cards</CardTitle>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedClass ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(student => {
                    const result = calculateResult(student.id);
                    return (
                      <div 
                        key={student.id}
                        className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {student.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-slate-500">{student.roll_no || student.student_id}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-500">Total</p>
                            <p className="font-semibold">{result.totalObtained}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2">
                            <p className="text-slate-500">%</p>
                            <p className="font-semibold">{result.percentage}%</p>
                          </div>
                          <div className={`rounded p-2 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className="text-slate-500">Grade</p>
                            <p className={`font-semibold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                              {result.grade}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => generateReportCard(student)}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          View & Print
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-10">Select a class to generate report cards</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Exam Dialog */}
      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>Set up a new examination</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Exam Name *</Label>
              <Input
                value={examForm.name}
                onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Half Yearly Exam 2025"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <select
                  value={examForm.type}
                  onChange={(e) => {
                    const type = EXAM_TYPES.find(t => t.id === e.target.value);
                    setExamForm(prev => ({ 
                      ...prev, 
                      type: e.target.value,
                      max_marks: type?.max_marks || 20
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {EXAM_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <select
                  value={examForm.class_id}
                  onChange={(e) => setExamForm(prev => ({ ...prev, class_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={examForm.start_date}
                  onChange={(e) => setExamForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowExamDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateExam} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Card Preview Dialog */}
      <Dialog open={showReportCard} onOpenChange={setShowReportCard}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="text-center border-b pb-4 mb-4">
                {school?.logo_url && <img src={school.logo_url} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />}
                <h2 className="text-xl font-bold">{school?.name}</h2>
                <p className="text-sm text-slate-500">{school?.address}</p>
                <h3 className="text-lg font-semibold mt-2 underline">Progress Report</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><b>Name:</b> {selectedStudent.name}</div>
                <div><b>Roll No:</b> {selectedStudent.roll_no || selectedStudent.student_id}</div>
                <div><b>Father:</b> {selectedStudent.father_name}</div>
                <div><b>Class:</b> {classes.find(c => c.id === selectedStudent.class_id)?.name}</div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Max</TableHead>
                    <TableHead className="text-center">Obtained</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(subject => {
                    const obtained = parseFloat(marks[selectedStudent.id]?.[subject.id]) || 0;
                    const pct = (obtained / subject.max_marks) * 100;
                    return (
                      <TableRow key={subject.id}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell className="text-center">{subject.max_marks}</TableCell>
                        <TableCell className="text-center">{obtained}</TableCell>
                        <TableCell className="text-center">{calculateGrade(pct).grade}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center">
                <p>Percentage: <b>{calculateResult(selectedStudent.id).percentage}%</b></p>
                <p>Grade: <b>{calculateResult(selectedStudent.id).grade}</b></p>
                <p className={`font-bold ${calculateResult(selectedStudent.id).passed ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateResult(selectedStudent.id).passed ? 'PASSED' : 'FAILED'}
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowReportCard(false)}>Close</Button>
                <Button onClick={handlePrintReportCard} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
