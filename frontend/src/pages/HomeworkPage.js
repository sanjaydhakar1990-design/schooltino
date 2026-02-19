import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import {
  BookOpen, Plus, Edit, Trash2, CheckCircle, Clock, Eye,
  BarChart3, TrendingUp, Users, GraduationCap, FileText,
  CalendarDays, Star, Award, Loader2, Search, Send,
  ClipboardList, PenTool, Paperclip, AlertCircle, Target
} from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Submitted': 'bg-blue-100 text-blue-700',
  'Returned': 'bg-orange-100 text-orange-700',
  'Graded': 'bg-green-100 text-green-700',
};

export default function HomeworkPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('assign');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [homeworks, setHomeworks] = useState([
    { id: 1, title: 'Chapter 5 - Linear Equations', subject: 'Mathematics', class: 'Class 10', description: 'Solve exercises 5.1 to 5.3 from textbook', dueDate: '2026-02-12', maxMarks: 20, attachments: true, createdAt: '2026-02-08', createdBy: 'Mr. Sharma' },
    { id: 2, title: 'Essay - My Country', subject: 'English', class: 'Class 8', description: 'Write a 500 word essay on My Country', dueDate: '2026-02-14', maxMarks: 25, attachments: false, createdAt: '2026-02-07', createdBy: 'Mrs. Patel' },
    { id: 3, title: 'Science Lab Report', subject: 'Science', class: 'Class 9', description: 'Write lab report for experiment on photosynthesis', dueDate: '2026-02-11', maxMarks: 15, attachments: true, createdAt: '2026-02-06', createdBy: 'Mr. Kumar' },
    { id: 4, title: 'Hindi Grammar Exercises', subject: 'Hindi', class: 'Class 7', description: 'Complete Samas and Sandhi exercises from workbook', dueDate: '2026-02-10', maxMarks: 10, attachments: false, createdAt: '2026-02-05', createdBy: 'Mrs. Verma' },
    { id: 5, title: 'History Map Work', subject: 'Social Science', class: 'Class 10', description: 'Mark important places of Indian independence movement', dueDate: '2026-02-15', maxMarks: 20, attachments: true, createdAt: '2026-02-09', createdBy: 'Mr. Singh' },
  ]);

  const [assignForm, setAssignForm] = useState({
    title: '', subject: '', class: '', description: '', dueDate: '', maxMarks: '', attachments: false
  });

  const [submissions, setSubmissions] = useState([
    { id: 1, homeworkId: 1, studentName: 'Aarav Gupta', rollNo: '01', status: 'Graded', submittedAt: '2026-02-10', marks: 18, feedback: 'Excellent work!' },
    { id: 2, homeworkId: 1, studentName: 'Priya Sharma', rollNo: '02', status: 'Submitted', submittedAt: '2026-02-11', marks: null, feedback: '' },
    { id: 3, homeworkId: 1, studentName: 'Rohit Kumar', rollNo: '03', status: 'Pending', submittedAt: null, marks: null, feedback: '' },
    { id: 4, homeworkId: 1, studentName: 'Sneha Patel', rollNo: '04', status: 'Graded', submittedAt: '2026-02-09', marks: 16, feedback: 'Good effort, check Q3' },
    { id: 5, homeworkId: 1, studentName: 'Vikram Singh', rollNo: '05', status: 'Returned', submittedAt: '2026-02-10', marks: null, feedback: 'Please redo Q2 and Q4' },
    { id: 6, homeworkId: 2, studentName: 'Ananya Mishra', rollNo: '01', status: 'Submitted', submittedAt: '2026-02-12', marks: null, feedback: '' },
    { id: 7, homeworkId: 2, studentName: 'Kartik Jain', rollNo: '02', status: 'Pending', submittedAt: null, marks: null, feedback: '' },
    { id: 8, homeworkId: 3, studentName: 'Meera Reddy', rollNo: '01', status: 'Graded', submittedAt: '2026-02-09', marks: 13, feedback: 'Well structured report' },
    { id: 9, homeworkId: 3, studentName: 'Arjun Nair', rollNo: '02', status: 'Submitted', submittedAt: '2026-02-10', marks: null, feedback: '' },
    { id: 10, homeworkId: 4, studentName: 'Divya Tiwari', rollNo: '01', status: 'Graded', submittedAt: '2026-02-08', marks: 9, feedback: 'Perfect!' },
  ]);

  const [gradingEntry, setGradingEntry] = useState({});

  const classAnalytics = [
    { class: 'Class 7', submissionRate: 92, avgScore: 78, onTime: 85, late: 15 },
    { class: 'Class 8', submissionRate: 85, avgScore: 72, onTime: 78, late: 22 },
    { class: 'Class 9', submissionRate: 88, avgScore: 75, onTime: 82, late: 18 },
    { class: 'Class 10', submissionRate: 78, avgScore: 70, onTime: 72, late: 28 },
  ];

  const getHomeworkSubmissions = (hwId) => submissions.filter(s => s.homeworkId === hwId);

  const getSubmissionStats = (hwId) => {
    const subs = getHomeworkSubmissions(hwId);
    const total = subs.length || 1;
    return {
      total: subs.length,
      pending: subs.filter(s => s.status === 'Pending').length,
      submitted: subs.filter(s => s.status === 'Submitted').length,
      graded: subs.filter(s => s.status === 'Graded').length,
      returned: subs.filter(s => s.status === 'Returned').length,
    };
  };

  const handleCreateHomework = () => {
    if (!assignForm.title || !assignForm.subject || !assignForm.class) {
      toast.error('Title, Subject and Class are required');
      return;
    }
    setHomeworks(prev => [...prev, {
      id: Date.now(),
      ...assignForm,
      maxMarks: parseInt(assignForm.maxMarks) || 0,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: user?.name || 'Teacher'
    }]);
    toast.success('Homework assigned successfully!');
    setShowAssignDialog(false);
    setAssignForm({ title: '', subject: '', class: '', description: '', dueDate: '', maxMarks: '', attachments: false });
  };

  const handleDeleteHomework = (id) => {
    setHomeworks(prev => prev.filter(h => h.id !== id));
    toast.success('Homework deleted');
  };

  const handleGradeSubmission = (submissionId) => {
    const entry = gradingEntry[submissionId];
    if (!entry || entry.marks === undefined || entry.marks === '') {
      toast.error('Please enter marks');
      return;
    }
    setSubmissions(prev => prev.map(s =>
      s.id === submissionId ? { ...s, marks: parseInt(entry.marks), feedback: entry.feedback || '', status: 'Graded' } : s
    ));
    toast.success('Marks saved successfully!');
    setGradingEntry(prev => {
      const updated = { ...prev };
      delete updated[submissionId];
      return updated;
    });
  };

  const filteredHomeworks = homeworks.filter(h =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalHomeworks = homeworks.length;
  const totalSubmissions = submissions.filter(s => s.status !== 'Pending').length;
  const totalGraded = submissions.filter(s => s.status === 'Graded').length;
  const avgScore = submissions.filter(s => s.marks !== null).length > 0
    ? Math.round(submissions.filter(s => s.marks !== null).reduce((sum, s) => sum + s.marks, 0) / submissions.filter(s => s.marks !== null).length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              {t('homework')}
            </h1>
            <p className="text-teal-100 mt-2">
              {t('assign_homework')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalHomeworks}</p>
              <p className="text-xs text-teal-100">{t('assigned_by')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalSubmissions}</p>
              <p className="text-xs text-teal-100">{t('submitted')}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalGraded}</p>
              <p className="text-xs text-teal-100">{t('grade')}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('assign_homework')}
          </TabsTrigger>
          <TabsTrigger value="track" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> {t('homework_list')}
          </TabsTrigger>
          <TabsTrigger value="grade" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" /> {t('grade')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> {t('analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setAssignForm({ title: '', subject: '', class: '', description: '', dueDate: '', maxMarks: '', attachments: false }); setShowAssignDialog(true); }} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" /> {t('assign_homework')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHomeworks.map(hw => {
              const stats = getSubmissionStats(hw.id);
              return (
                <Card key={hw.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{hw.title}</h4>
                          <p className="text-xs text-gray-500">{hw.subject} • {hw.class}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteHomework(hw.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                    {hw.description && <p className="text-xs text-gray-500 mb-3">{hw.description}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        <CalendarDays className="w-3 h-3 mr-1" /> {t('due_date')}: {hw.dueDate}
                      </Badge>
                      {hw.maxMarks > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" /> {hw.maxMarks} {t('total_marks')}
                        </Badge>
                      )}
                      {hw.attachments && (
                        <Badge variant="outline" className="text-xs">
                          <Paperclip className="w-3 h-3 mr-1" /> {t('attachments')}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-yellow-50 rounded p-1.5 text-center">
                        <p className="text-sm font-bold text-yellow-700">{stats.pending}</p>
                        <p className="text-[10px] text-yellow-600">{t('pending')}</p>
                      </div>
                      <div className="bg-blue-50 rounded p-1.5 text-center">
                        <p className="text-sm font-bold text-blue-700">{stats.submitted}</p>
                        <p className="text-[10px] text-blue-600">{t('submitted')}</p>
                      </div>
                      <div className="bg-green-50 rounded p-1.5 text-center">
                        <p className="text-sm font-bold text-green-700">{stats.graded}</p>
                        <p className="text-[10px] text-green-600">{t('grade')}</p>
                      </div>
                      <div className="bg-orange-50 rounded p-1.5 text-center">
                        <p className="text-sm font-bold text-orange-700">{stats.returned}</p>
                        <p className="text-[10px] text-orange-600">{t('completed')}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{t('assigned_by')} {hw.createdBy} • {hw.createdAt}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="track" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('homework_list')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('homework')}</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('class_section')}</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('due_date')}</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{t('pending')}</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{t('submitted')}</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{t('grade')}</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{t('completed')}</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworks.map(hw => {
                      const stats = getSubmissionStats(hw.id);
                      const isOverdue = new Date(hw.dueDate) < new Date();
                      return (
                        <tr key={hw.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{hw.title}</p>
                              <p className="text-xs text-gray-400">{hw.subject}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{hw.class}</td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                              {hw.dueDate}
                            </span>
                            {isOverdue && <Badge className="bg-red-100 text-red-700 ml-2 text-[10px]">{t('overdue')}</Badge>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-yellow-100 text-yellow-700">{stats.pending}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-blue-100 text-blue-700">{stats.submitted}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-green-100 text-green-700">{stats.graded}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="bg-orange-100 text-orange-700">{stats.returned}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedHomework(hw); setActiveTab('grade'); }}>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grade" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label className="text-sm font-medium">{t('select')} {t('homework')}:</Label>
            <select
              className="border rounded-md p-2 text-sm flex-1 max-w-md"
              value={selectedHomework?.id || ''}
              onChange={e => {
                const hw = homeworks.find(h => h.id === parseInt(e.target.value));
                setSelectedHomework(hw || null);
              }}
            >
              <option value="">-- {t('select')} --</option>
              {homeworks.map(hw => (
                <option key={hw.id} value={hw.id}>{hw.title} ({hw.class})</option>
              ))}
            </select>
          </div>

          {selectedHomework ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedHomework.title}</h3>
                    <p className="text-sm text-gray-500">{selectedHomework.subject} • {selectedHomework.class} • Max: {selectedHomework.maxMarks} {t('total_marks')}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('roll_no')}</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('student')}</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('status')}</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('submitted')}</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('obtained_marks')}</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('remarks')}</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getHomeworkSubmissions(selectedHomework.id).map(sub => (
                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">{sub.rollNo}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{sub.studentName}</td>
                          <td className="py-3 px-4">
                            <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{sub.submittedAt || '—'}</td>
                          <td className="py-3 px-4">
                            {sub.status === 'Graded' ? (
                              <span className="font-bold text-green-700">{sub.marks}/{selectedHomework.maxMarks}</span>
                            ) : sub.status === 'Submitted' || sub.status === 'Returned' ? (
                              <Input
                                type="number"
                                className="w-20 h-8 text-sm"
                                placeholder="0"
                                max={selectedHomework.maxMarks}
                                value={gradingEntry[sub.id]?.marks ?? ''}
                                onChange={e => setGradingEntry(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], marks: e.target.value } }))}
                              />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {sub.status === 'Graded' ? (
                              <span className="text-xs text-gray-500">{sub.feedback}</span>
                            ) : (sub.status === 'Submitted' || sub.status === 'Returned') ? (
                              <Input
                                className="h-8 text-sm"
                                placeholder="Feedback"
                                value={gradingEntry[sub.id]?.feedback ?? ''}
                                onChange={e => setGradingEntry(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))}
                              />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(sub.status === 'Submitted' || sub.status === 'Returned') && (
                              <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleGradeSubmission(sub.id)}>
                                <CheckCircle className="w-3 h-3 mr-1" /> {t('save')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">{t('select')} {t('homework')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('select')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-emerald-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600">{t('total')} {t('assign_homework')}</p>
                    <p className="text-3xl font-bold text-teal-900">{totalHomeworks}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-teal-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">{t('total')} {t('submitted')}</p>
                    <p className="text-3xl font-bold text-blue-900">{totalSubmissions}</p>
                  </div>
                  <FileText className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">{t('grade')}</p>
                    <p className="text-3xl font-bold text-green-900">{totalGraded}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">{t('average_marks')}</p>
                    <p className="text-3xl font-bold text-purple-900">{avgScore}%</p>
                  </div>
                  <Award className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('submitted')} - {t('class_section')}</h3>
              <div className="space-y-4">
                {classAnalytics.map(ca => (
                  <div key={ca.class}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{ca.class}</span>
                      <span className="text-sm font-bold text-gray-900">{ca.submissionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-4 rounded-full transition-all" style={{ width: `${ca.submissionRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('average_marks')}</h3>
                <div className="space-y-3">
                  {classAnalytics.map(ca => (
                    <div key={ca.class} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-20">{ca.class}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${ca.avgScore}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{ca.avgScore}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('submitted')} - {t('late')}</h3>
                <div className="space-y-4">
                  {classAnalytics.map(ca => (
                    <div key={ca.class}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{ca.class}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600">{ca.onTime}% on-time</span>
                          <span className="text-red-500">{ca.late}% {t('late')}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                        <div className="bg-green-500 h-3" style={{ width: `${ca.onTime}%` }} />
                        <div className="bg-red-400 h-3" style={{ width: `${ca.late}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('assign_homework')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('title')} *</Label>
              <Input value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Chapter 5 Exercises" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('subject')} *</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={assignForm.subject} onChange={e => setAssignForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">{t('select')} {t('subject')}</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Computer">Computer</option>
                </select>
              </div>
              <div>
                <Label>{t('class_section')} *</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={assignForm.class} onChange={e => setAssignForm(f => ({ ...f, class: e.target.value }))}>
                  <option value="">{t('select_class')}</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea value={assignForm.description} onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the homework..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('due_date')}</Label>
                <Input type="date" value={assignForm.dueDate} onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <Label>{t('max_marks')}</Label>
                <Input type="number" value={assignForm.maxMarks} onChange={e => setAssignForm(f => ({ ...f, maxMarks: e.target.value }))} placeholder="e.g., 20" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('attachments')}</Label>
              <Switch checked={assignForm.attachments} onCheckedChange={v => setAssignForm(f => ({ ...f, attachments: v }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreateHomework} className="bg-teal-600 hover:bg-teal-700">
                <Send className="w-4 h-4 mr-2" /> {t('assign_homework')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}