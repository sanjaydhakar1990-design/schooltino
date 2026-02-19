import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  FileText,
  Plus,
  Clock,
  Users,
  Play,
  Check,
  X,
  Loader2,
  Trash2,
  Edit,
  Eye,
  Trophy,
  Target,
  Calendar,
  BookOpen,
  AlertCircle,
  ChevronRight,
  Award,
  Timer,
  Brain,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function OnlineExamSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTakeExamDialog, setShowTakeExamDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [examForm, setExamForm] = useState({
    title: '',
    subject: '',
    class_id: '',
    duration: 30,
    total_marks: 100,
    instructions: '',
    questions: []
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    marks: 1
  });

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchExams();
    if (isStudent) {
      fetchMyResults();
    }
  }, [user]);

  useEffect(() => {
    let timer;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(res.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/exams/my-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyResults(res.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setMyResults([]);
    }
  };

  const handleAddQuestion = () => {
    if (!questionForm.question || questionForm.options.some(o => !o)) {
      toast.error('Please fill all fields');
      return;
    }
    
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, { ...questionForm, id: Date.now() }]
    }));
    
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      marks: 1
    });
    
    toast.success('Question added!');
  };

  const handleRemoveQuestion = (idx) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleCreateExam = async () => {
    if (!examForm.title || !examForm.subject || examForm.questions.length === 0) {
      toast.error('Please fill all required fields and add at least one question');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exams`, {
        ...examForm,
        school_id: user?.school_id || 'default'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Exam created successfully!');
      setShowCreateDialog(false);
      resetExamForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error(error.response?.data?.detail || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const resetExamForm = () => {
    setExamForm({
      title: '',
      subject: '',
      class_id: '',
      duration: 30,
      total_marks: 100,
      instructions: '',
      questions: []
    });
  };

  const handleStartExam = async (exam) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/exams/${exam.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const examWithQuestions = res.data;
      setSelectedExam(examWithQuestions);
      setTimeLeft(examWithQuestions.duration * 60);
      setAnswers({});
      setCurrentQuestion(0);
      setExamStarted(false);
      setShowTakeExamDialog(true);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You have already attempted this exam');
      } else {
        toast.error('Failed to load exam');
      }
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/exams/${selectedExam.id}/submit`, {
        exam_id: selectedExam.id,
        answers: answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = res.data;
      toast.success(`Exam submitted! Your score: ${result.score}/${result.total_marks} (${result.percentage}%)`);
      
      setMyResults([result, ...myResults]);
      setShowTakeExamDialog(false);
      setExamStarted(false);
      fetchExams(); // Refresh to show already_attempted status
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="online-exam-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Online Exam System
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacher ? 'Create and manage online tests for your students' : 'Take exams and view your results'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Exam
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{exams.filter(e => e.status === 'active').length}</p>
              <p className="text-sm text-slate-500">Active Exams</p>
            </div>
          </div>
        </div>
        {isStudent && (
          <>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{myResults.length}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {myResults.length > 0 ? Math.round(myResults.reduce((a, b) => a + b.percentage, 0) / myResults.length) : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Avg Score</p>
                </div>
              </div>
            </div>
          </>
        )}
        {isTeacher && (
          <>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">156</p>
                  <p className="text-sm text-slate-500">Submissions</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">72%</p>
                  <p className="text-sm text-slate-500">Pass Rate</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="exams" className="data-[state=active]:bg-white">
            <FileText className="w-4 h-4 mr-2" />
            {isTeacher ? 'My Exams' : 'Available Exams'}
          </TabsTrigger>
          {isStudent && (
            <TabsTrigger value="results" className="data-[state=active]:bg-white">
              <Trophy className="w-4 h-4 mr-2" />
              My Results
            </TabsTrigger>
          )}
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams">
          {exams.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Exams Available</h3>
              <p className="text-slate-500">
                {isTeacher ? 'Create your first exam to get started' : 'No exams scheduled yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{exam.title}</h3>
                        <p className="text-slate-500">{exam.subject} • {exam.class_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {exam.duration} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {exam.total_marks} marks
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {exam.total_questions} questions
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Created by: {exam.created_by_name || exam.created_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {exam.status === 'active' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                          Active
                        </span>
                      )}
                      {isStudent && (
                        <Button onClick={() => handleStartExam(exam)} className="bg-indigo-600 hover:bg-indigo-700">
                          <Play className="w-4 h-4 mr-2" />
                          Start Exam
                        </Button>
                      )}
                      {isTeacher && (
                        <>
                          <Button variant="outline" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Results Tab (Student Only) */}
        {isStudent && (
          <TabsContent value="results">
            {myResults.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Yet</h3>
                <p className="text-slate-500">Complete an exam to see your results here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myResults.map((result) => (
                  <div key={result.id} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          result.percentage >= 80 ? 'bg-emerald-100' :
                          result.percentage >= 60 ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          <Trophy className={`w-7 h-7 ${
                            result.percentage >= 80 ? 'text-emerald-600' :
                            result.percentage >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{result.exam_title}</h3>
                          <p className="text-slate-500">{result.subject}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Submitted: {new Date(result.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-slate-900">{result.percentage}%</p>
                        <p className="text-slate-500">{result.score}/{result.total_marks} marks</p>
                        {result.rank && (
                          <p className="text-sm text-indigo-600 mt-1">
                            Rank: #{result.rank} of {result.total_students}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Create Exam Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Create New Exam
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Exam Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Exam Title *</Label>
                <Input
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="e.g., Mathematics Unit Test - Chapter 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={examForm.subject}
                  onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input
                  value={examForm.class_id}
                  onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                  placeholder="e.g., Class 10-A"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={examForm.duration}
                  onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={examForm.total_marks}
                  onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  placeholder="Enter exam instructions for students..."
                  rows={2}
                />
              </div>
            </div>

            {/* Add Questions */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Add Questions ({examForm.questions.length} added)
              </h3>
              
              <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Enter your question here..."
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="space-y-1">
                      <Label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={questionForm.correct_answer === idx}
                          onChange={() => setQuestionForm({ ...questionForm, correct_answer: idx })}
                          className="text-indigo-600"
                        />
                        Option {idx + 1} {questionForm.correct_answer === idx && '(Correct)'}
                      </Label>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...questionForm.options];
                          newOpts[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Marks:</Label>
                    <Input
                      type="number"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                      className="w-20"
                      min={1}
                    />
                  </div>
                  <Button onClick={handleAddQuestion} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Added Questions List */}
              {examForm.questions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Added Questions:</Label>
                  {examForm.questions.map((q, idx) => (
                    <div key={q.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <span className="text-sm">
                        {idx + 1}. {q.question.substring(0, 50)}... ({q.marks} marks)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateExam}
                disabled={submitting || examForm.questions.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Exam'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Take Exam Dialog */}
      <Dialog open={showTakeExamDialog} onOpenChange={(open) => {
        if (!open && examStarted) {
          if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
            setShowTakeExamDialog(false);
            setExamStarted(false);
          }
        } else {
          setShowTakeExamDialog(open);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedExam && !examStarted ? (
            /* Exam Instructions */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedExam.title}</h2>
              <p className="text-slate-500 mb-6">{selectedExam.subject}</p>
              
              <div className="bg-slate-50 rounded-xl p-6 text-left mb-6 max-w-md mx-auto">
                <h3 className="font-semibold mb-3">Exam Details:</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Duration: {selectedExam.duration} minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Total Marks: {selectedExam.total_marks}
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Questions: {selectedExam.questions?.length || selectedExam.total_questions}
                  </li>
                </ul>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left text-sm text-amber-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Do not refresh or close the browser</li>
                      <li>Exam will auto-submit when time runs out</li>
                      <li>You cannot go back once submitted</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => setExamStarted(true)}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Exam
              </Button>
            </div>
          ) : selectedExam && examStarted ? (
            /* Exam Questions */
            <div className="h-[70vh] flex flex-col">
              {/* Timer Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedExam.title}</h3>
                  <p className="text-sm text-slate-500">Question {currentQuestion + 1} of {selectedExam.questions.length}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Timer className="w-5 h-5" />
                  <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              {/* Question */}
              <div className="flex-1 py-6 overflow-y-auto">
                <div className="mb-6">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {selectedExam.questions[currentQuestion].marks} marks
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {currentQuestion + 1}. {selectedExam.questions[currentQuestion].question}
                </h2>
                
                <div className="space-y-3">
                  {selectedExam.questions[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(selectedExam.questions[currentQuestion].id, idx)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        answers[selectedExam.questions[currentQuestion].id] === idx
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                        answers[selectedExam.questions[currentQuestion].id] === idx
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {selectedExam.questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        idx === currentQuestion
                          ? 'bg-indigo-600 text-white'
                          : answers[selectedExam.questions[idx].id] !== undefined
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                
                {currentQuestion < selectedExam.questions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Exam'}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
