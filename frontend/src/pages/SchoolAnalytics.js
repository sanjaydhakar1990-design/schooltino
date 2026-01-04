import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users, BookOpen, GraduationCap, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, BarChart3, PieChart,
  BookMarked, Target, Brain, Award, ChevronRight, RefreshCw,
  Loader2, School, UserCheck, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SchoolAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [syllabusData, setSyllabusData] = useState([]);
  const [weakStudents, setWeakStudents] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, teachersRes, syllabusRes, weakRes, classRes] = await Promise.allSettled([
        axios.get(`${API}/analytics/school-overview`),
        axios.get(`${API}/analytics/teachers`),
        axios.get(`${API}/analytics/syllabus-progress`),
        axios.get(`${API}/analytics/weak-students`),
        axios.get(`${API}/analytics/class-performance`)
      ]);

      // Mock data for demo
      setAnalytics({
        total_students: 450,
        total_teachers: 28,
        total_classes: 15,
        avg_attendance: 87,
        avg_performance: 72,
        syllabus_completion: 58,
        pending_fees: 125000,
        weak_students_count: 23
      });

      setTeachers([
        { id: '1', name: 'Mrs. Sharma', subject: 'Mathematics', classes: 4, syllabus_progress: 65, avg_result: 78, weak_students: 3 },
        { id: '2', name: 'Mr. Verma', subject: 'English', classes: 3, syllabus_progress: 72, avg_result: 82, weak_students: 2 },
        { id: '3', name: 'Mrs. Gupta', subject: 'Science', classes: 4, syllabus_progress: 55, avg_result: 68, weak_students: 5 },
        { id: '4', name: 'Mr. Singh', subject: 'Hindi', classes: 3, syllabus_progress: 80, avg_result: 85, weak_students: 1 },
        { id: '5', name: 'Mrs. Patel', subject: 'Social Science', classes: 4, syllabus_progress: 60, avg_result: 75, weak_students: 4 },
      ]);

      setSyllabusData([
        { class: 'Class 6', total: 100, completed: 62, subjects: { math: 58, science: 65, english: 70, hindi: 55 } },
        { class: 'Class 7', total: 100, completed: 55, subjects: { math: 50, science: 60, english: 58, hindi: 52 } },
        { class: 'Class 8', total: 100, completed: 48, subjects: { math: 45, science: 52, english: 50, hindi: 45 } },
        { class: 'Class 9', total: 100, completed: 60, subjects: { math: 55, science: 65, english: 62, hindi: 58 } },
        { class: 'Class 10', total: 100, completed: 70, subjects: { math: 68, science: 72, english: 75, hindi: 65 } },
      ]);

      setWeakStudents([
        { id: '1', name: 'Rahul Sharma', class: '8-A', avg_score: 42, weak_subjects: ['Math', 'Science'], teacher: 'Mrs. Sharma' },
        { id: '2', name: 'Priya Singh', class: '9-B', avg_score: 48, weak_subjects: ['Math'], teacher: 'Mrs. Sharma' },
        { id: '3', name: 'Amit Kumar', class: '7-A', avg_score: 45, weak_subjects: ['English', 'Hindi'], teacher: 'Mr. Verma' },
        { id: '4', name: 'Neha Gupta', class: '10-A', avg_score: 50, weak_subjects: ['Science'], teacher: 'Mrs. Gupta' },
        { id: '5', name: 'Vikram Singh', class: '8-B', avg_score: 38, weak_subjects: ['Math', 'Science', 'English'], teacher: 'Mrs. Sharma' },
      ]);

      setClassPerformance([
        { class: 'Class 6-A', students: 35, avg_score: 75, attendance: 92, top_score: 98, lowest_score: 45 },
        { class: 'Class 7-A', students: 38, avg_score: 72, attendance: 88, top_score: 95, lowest_score: 42 },
        { class: 'Class 8-A', students: 32, avg_score: 68, attendance: 85, top_score: 92, lowest_score: 38 },
        { class: 'Class 9-A', students: 30, avg_score: 70, attendance: 90, top_score: 96, lowest_score: 48 },
        { class: 'Class 10-A', students: 28, avg_score: 78, attendance: 94, top_score: 99, lowest_score: 55 },
      ]);

    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="school-analytics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📊 School Analytics</h1>
          <p className="text-slate-500">Complete overview of school performance</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{analytics?.total_students}</p>
              <p className="text-sm text-slate-500">Total Students</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{analytics?.total_teachers}</p>
              <p className="text-sm text-slate-500">Teachers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{analytics?.syllabus_completion}%</p>
              <p className="text-sm text-slate-500">Syllabus Done</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{analytics?.weak_students_count}</p>
              <p className="text-sm text-slate-500">Weak Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="teachers">👨‍🏫 Teachers Progress</TabsTrigger>
          <TabsTrigger value="syllabus">📚 Syllabus Status</TabsTrigger>
          <TabsTrigger value="weak">⚠️ Weak Students</TabsTrigger>
          <TabsTrigger value="classes">📊 Class Performance</TabsTrigger>
        </TabsList>

        {/* Teachers Progress Tab */}
        <TabsContent value="teachers">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">All Teachers - Syllabus & Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Teacher</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Classes</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Syllabus %</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Avg Result</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Weak Students</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">{teacher.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{teacher.subject}</td>
                      <td className="px-4 py-4 text-center">{teacher.classes}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                teacher.syllabus_progress >= 70 ? 'bg-emerald-500' :
                                teacher.syllabus_progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${teacher.syllabus_progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{teacher.syllabus_progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-medium ${
                          teacher.avg_result >= 75 ? 'text-emerald-600' :
                          teacher.avg_result >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {teacher.avg_result}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          teacher.weak_students <= 2 ? 'bg-emerald-100 text-emerald-700' :
                          teacher.weak_students <= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {teacher.weak_students}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {teacher.syllabus_progress >= 60 && teacher.avg_result >= 70 ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Syllabus Status Tab */}
        <TabsContent value="syllabus">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Class-wise Syllabus Progress</h3>
            </div>
            <div className="p-4 space-y-4">
              {syllabusData.map((cls, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{cls.class}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cls.completed >= 70 ? 'bg-emerald-100 text-emerald-700' :
                      cls.completed >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cls.completed}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        cls.completed >= 70 ? 'bg-emerald-500' :
                        cls.completed >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${cls.completed}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-slate-500">Math</p>
                      <p className="font-semibold text-slate-900">{cls.subjects.math}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Science</p>
                      <p className="font-semibold text-slate-900">{cls.subjects.science}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">English</p>
                      <p className="font-semibold text-slate-900">{cls.subjects.english}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Hindi</p>
                      <p className="font-semibold text-slate-900">{cls.subjects.hindi}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Weak Students Tab */}
        <TabsContent value="weak">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">⚠️ Students Needing Attention</h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {weakStudents.length} students
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Class</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Avg Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Weak Subjects</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Class Teacher</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weakStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">{student.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{student.class}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-red-600">{student.avg_score}%</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.weak_subjects.map((sub, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{student.teacher}</td>
                      <td className="px-4 py-4 text-center">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          View Strategy
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Class Performance Tab */}
        <TabsContent value="classes">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Class-wise Performance Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Class</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Students</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Avg Score</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Attendance</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Highest</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Lowest</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classPerformance.map((cls, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{cls.class}</td>
                      <td className="px-4 py-4 text-center">{cls.students}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold ${
                          cls.avg_score >= 75 ? 'text-emerald-600' :
                          cls.avg_score >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {cls.avg_score}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`${cls.attendance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {cls.attendance}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-emerald-600 font-medium">{cls.top_score}%</td>
                      <td className="px-4 py-4 text-center text-red-600 font-medium">{cls.lowest_score}%</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          cls.avg_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          cls.avg_score >= 70 ? 'bg-blue-100 text-blue-700' :
                          cls.avg_score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cls.avg_score >= 80 ? 'A' : cls.avg_score >= 70 ? 'B' : cls.avg_score >= 60 ? 'C' : 'D'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
