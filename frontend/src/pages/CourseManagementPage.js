import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';
import {
  BookOpen, GraduationCap, Users, Clock, Plus, Loader2,
  Play, FileText, Video, Upload, Shield, Download, Search,
  Edit, Trash2, ChevronRight, DollarSign, Layers, FolderOpen,
  GripVertical, Link2, Eye, UserPlus, IndianRupee, BarChart3,
  CheckCircle, XCircle, ArrowUp, ArrowDown
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CourseManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [courseForm, setCourseForm] = useState({
    title: '', description: '', subject: '', class_name: '', teacher: '', duration: '', price: '', status: 'draft'
  });

  const [moduleForm, setModuleForm] = useState({
    title: '', description: '', video_link: ''
  });

  const [contentForm, setContentForm] = useState({
    title: '', type: 'pdf', file: null, module_id: null
  });

  const [batchForm, setBatchForm] = useState({
    name: '', course_id: '', start_date: '', max_students: ''
  });

  const [courses, setCourses] = useState([
    { id: 1, title: 'JEE Mathematics Crash Course', description: 'Complete JEE Mains math preparation with practice sets', subject: 'Mathematics', class_name: 'Class 11-12', teacher: 'Mr. Sharma', duration: '6 months', enrolled: 128, price: 4999, status: 'active', modules: 12, rating: 4.8 },
    { id: 2, title: 'NEET Biology Complete', description: 'Comprehensive biology course for NEET aspirants', subject: 'Biology', class_name: 'Class 11-12', teacher: 'Dr. Mehta', duration: '8 months', enrolled: 95, price: 5999, status: 'active', modules: 18, rating: 4.6 },
    { id: 3, title: 'English Communication Skills', description: 'Spoken English and writing skills development', subject: 'English', class_name: 'Class 8-10', teacher: 'Ms. Patel', duration: '3 months', enrolled: 67, price: 1999, status: 'active', modules: 8, rating: 4.5 },
    { id: 4, title: 'Computer Science with Python', description: 'Learn Python programming from basics to advanced', subject: 'Computer Science', class_name: 'Class 11-12', teacher: 'Mr. Kumar', duration: '4 months', enrolled: 84, price: 2999, status: 'draft', modules: 10, rating: 4.7 },
    { id: 5, title: 'Hindi Sahitya Special', description: 'Hindi literature board exam preparation', subject: 'Hindi', class_name: 'Class 9-10', teacher: 'Mrs. Verma', duration: '3 months', enrolled: 52, price: 1499, status: 'active', modules: 6, rating: 4.3 },
  ]);

  const [modules, setModules] = useState([
    { id: 1, courseId: 1, title: 'Algebra Fundamentals', description: 'Basic algebraic concepts and equations', videoLink: 'https://example.com/v1', order: 1, contentCount: 5, completed: 85 },
    { id: 2, courseId: 1, title: 'Trigonometry', description: 'Trigonometric functions and identities', videoLink: 'https://example.com/v2', order: 2, contentCount: 7, completed: 72 },
    { id: 3, courseId: 1, title: 'Coordinate Geometry', description: 'Points, lines, circles in coordinate system', videoLink: 'https://example.com/v3', order: 3, contentCount: 4, completed: 60 },
    { id: 4, courseId: 1, title: 'Calculus - Limits', description: 'Introduction to limits and continuity', videoLink: 'https://example.com/v4', order: 4, contentCount: 6, completed: 45 },
    { id: 5, courseId: 1, title: 'Calculus - Derivatives', description: 'Differentiation techniques and applications', videoLink: 'https://example.com/v5', order: 5, contentCount: 8, completed: 30 },
  ]);

  const [contentItems, setContentItems] = useState([
    { id: 1, moduleId: 1, title: 'Algebra Notes - Chapter 1', type: 'pdf', size: '2.4 MB', drm: true, downloads: 98 },
    { id: 2, moduleId: 1, title: 'Introduction to Algebra', type: 'video', size: '156 MB', drm: true, downloads: 120 },
    { id: 3, moduleId: 1, title: 'Practice Set - Equations', type: 'practice', size: '1.2 MB', drm: false, downloads: 85 },
    { id: 4, moduleId: 2, title: 'Trigonometry Formulas PDF', type: 'pdf', size: '3.1 MB', drm: true, downloads: 110 },
    { id: 5, moduleId: 2, title: 'Sin Cos Tan Video Lesson', type: 'video', size: '210 MB', drm: true, downloads: 95 },
    { id: 6, moduleId: 3, title: 'Coordinate Geometry Study Material', type: 'pdf', size: '4.5 MB', drm: false, downloads: 72 },
  ]);

  const [enrollments, setEnrollments] = useState([
    { id: 1, studentName: 'Aarav Patel', courseTitle: 'JEE Mathematics Crash Course', batch: 'Batch A - Morning', enrolledDate: '2026-01-15', feePaid: 4999, feeStatus: 'paid', progress: 68 },
    { id: 2, studentName: 'Ananya Sharma', courseTitle: 'JEE Mathematics Crash Course', batch: 'Batch A - Morning', enrolledDate: '2026-01-16', feePaid: 4999, feeStatus: 'paid', progress: 72 },
    { id: 3, studentName: 'Arjun Singh', courseTitle: 'NEET Biology Complete', batch: 'Batch B - Evening', enrolledDate: '2026-01-20', feePaid: 3000, feeStatus: 'partial', progress: 45 },
    { id: 4, studentName: 'Diya Gupta', courseTitle: 'English Communication Skills', batch: 'Batch C - Weekend', enrolledDate: '2026-02-01', feePaid: 1999, feeStatus: 'paid', progress: 30 },
    { id: 5, studentName: 'Ishaan Kumar', courseTitle: 'Computer Science with Python', batch: 'Batch A - Morning', enrolledDate: '2026-02-05', feePaid: 0, feeStatus: 'unpaid', progress: 10 },
  ]);

  const [batches] = useState([
    { id: 1, name: 'Batch A - Morning', courseTitle: 'JEE Mathematics Crash Course', students: 35, maxStudents: 40, startDate: '2026-01-15', status: 'active' },
    { id: 2, name: 'Batch B - Evening', courseTitle: 'NEET Biology Complete', students: 28, maxStudents: 35, startDate: '2026-01-20', status: 'active' },
    { id: 3, name: 'Batch C - Weekend', courseTitle: 'English Communication Skills', students: 22, maxStudents: 30, startDate: '2026-02-01', status: 'active' },
  ]);

  const handleCreateCourse = () => {
    if (!courseForm.title || !courseForm.subject) {
      toast.error('Title and Subject are required');
      return;
    }
    const newCourse = {
      id: Date.now(),
      ...courseForm,
      price: parseInt(courseForm.price) || 0,
      enrolled: 0,
      modules: 0,
      rating: 0
    };
    setCourses(prev => [newCourse, ...prev]);
    toast.success('Course created successfully!');
    setShowCreateDialog(false);
    setCourseForm({ title: '', description: '', subject: '', class_name: '', teacher: '', duration: '', price: '', status: 'draft' });
  };

  const handleAddModule = () => {
    if (!moduleForm.title) {
      toast.error('Module title is required');
      return;
    }
    const newModule = {
      id: Date.now(),
      courseId: selectedCourse?.id,
      title: moduleForm.title,
      description: moduleForm.description,
      videoLink: moduleForm.video_link,
      order: modules.filter(m => m.courseId === selectedCourse?.id).length + 1,
      contentCount: 0,
      completed: 0
    };
    setModules(prev => [...prev, newModule]);
    toast.success('Module added successfully!');
    setShowModuleDialog(false);
    setModuleForm({ title: '', description: '', video_link: '' });
  };

  const handleUploadContent = () => {
    if (!contentForm.title || !contentForm.type) {
      toast.error('Content title and type are required');
      return;
    }
    const newContent = {
      id: Date.now(),
      moduleId: contentForm.module_id || 1,
      title: contentForm.title,
      type: contentForm.type,
      size: '0 MB',
      drm: true,
      downloads: 0
    };
    setContentItems(prev => [...prev, newContent]);
    toast.success('Content uploaded successfully!');
    setShowContentDialog(false);
    setContentForm({ title: '', type: 'pdf', file: null, module_id: null });
  };

  const handleCreateBatch = () => {
    if (!batchForm.name) {
      toast.error('Batch name is required');
      return;
    }
    toast.success('Batch created successfully!');
    setShowBatchDialog(false);
    setBatchForm({ name: '', course_id: '', start_date: '', max_students: '' });
  };

  const moveModule = (id, direction) => {
    const courseModules = modules.filter(m => m.courseId === selectedCourse?.id).sort((a, b) => a.order - b.order);
    const idx = courseModules.findIndex(m => m.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === courseModules.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...modules];
    const current = updated.find(m => m.id === courseModules[idx].id);
    const swap = updated.find(m => m.id === courseModules[swapIdx].id);
    const tempOrder = current.order;
    current.order = swap.order;
    swap.order = tempOrder;
    setModules(updated);
    toast.success('Module reordered');
  };

  const handleDeleteCourse = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    toast.success('Course deleted');
  };

  const contentTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-purple-600" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'practice': return <BookOpen className="w-4 h-4 text-blue-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const stats = {
    totalCourses: courses.length,
    activeCourses: courses.filter(c => c.status === 'active').length,
    totalEnrolled: courses.reduce((sum, c) => sum + c.enrolled, 0),
    totalRevenue: courses.reduce((sum, c) => sum + (c.enrolled * c.price), 0)
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Course Management
            </h1>
            <p className="text-indigo-100 mt-2">
              Create, organize & deliver — structured learning paths
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-xs text-indigo-100">Courses</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.activeCourses}</p>
              <p className="text-xs text-indigo-100">Active</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
              <p className="text-xs text-indigo-100">Students</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
              <p className="text-xs text-indigo-100">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Courses
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Modules
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Enrollment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Create Course
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(course => (
              <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedCourse(course); setActiveTab('modules'); }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {course.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-amber-500">★</span>
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="outline" className="text-xs">{course.subject}</Badge>
                    <Badge variant="outline" className="text-xs">{course.class_name}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {course.teacher}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" /> {course.enrolled} enrolled
                    </span>
                    <span className="text-lg font-bold text-indigo-600">₹{course.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); setActiveTab('modules'); }}>
                      <Layers className="w-3 h-3 mr-1" /> Modules
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          {selectedCourse ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedCourse.title}</h3>
                  <p className="text-sm text-gray-500">Manage modules and chapters</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                    ← Back to Courses
                  </Button>
                  <Button onClick={() => setShowModuleDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Module
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {modules.filter(m => m.courseId === selectedCourse.id).sort((a, b) => a.order - b.order).map(mod => (
                  <Card key={mod.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <button onClick={() => moveModule(mod.id, 'up')} className="p-1 hover:bg-gray-100 rounded">
                            <ArrowUp className="w-4 h-4 text-gray-400" />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-300" />
                          <button onClick={() => moveModule(mod.id, 'down')} className="p-1 hover:bg-gray-100 rounded">
                            <ArrowDown className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center font-bold text-indigo-600">
                          {mod.order}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{mod.title}</h4>
                          <p className="text-sm text-gray-500">{mod.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {mod.contentCount} items</span>
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {mod.completed}% completed</span>
                            {mod.videoLink && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Video linked</span>}
                          </div>
                        </div>
                        <div className="w-full max-w-[120px]">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${mod.completed}%` }} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {modules.filter(m => m.courseId === selectedCourse.id).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No modules yet. Click "Add Module" to create the first one.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a course from the Courses tab to manage its modules.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Study Materials & Content</h3>
            <Button onClick={() => setShowContentDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Upload className="w-4 h-4 mr-2" /> Upload Content
            </Button>
          </div>
          <div className="space-y-3">
            {contentItems.map(item => (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        {contentTypeIcon(item.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                          <span>{item.size}</span>
                          <span>{item.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.drm && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Shield className="w-3 h-3 mr-1" /> DRM Protected
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => toast.success('Preview opened')}>
                        <Eye className="w-3 h-3 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.success('Download started')}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Student Enrollments & Batches</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowBatchDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Batch
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.success('Enrollment form shared')}>
                <UserPlus className="w-4 h-4 mr-2" /> Enroll Student
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {batches.map(batch => (
              <Card key={batch.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{batch.name}</h4>
                    <Badge className={batch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{batch.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{batch.courseTitle}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><Users className="w-3 h-3 inline mr-1" />{batch.students}/{batch.maxStudents}</span>
                    <span className="text-gray-400">{batch.startDate}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(batch.students / batch.maxStudents) * 100}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Student</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Batch</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Fee Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Progress</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map(enr => (
                  <tr key={enr.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{enr.studentName}</td>
                    <td className="p-3 text-sm text-gray-600">{enr.courseTitle}</td>
                    <td className="p-3 text-sm text-gray-500">{enr.batch}</td>
                    <td className="p-3">
                      <Badge className={enr.feeStatus === 'paid' ? 'bg-green-100 text-green-700' : enr.feeStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                        {enr.feeStatus === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        ₹{enr.feePaid.toLocaleString()} {enr.feeStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${enr.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{enr.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{enr.enrolledDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Create New Course
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title</Label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. JEE Mathematics Complete" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={courseForm.description} onChange={(e) => setCourseForm(f => ({ ...f, description: e.target.value }))} placeholder="Course description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={courseForm.subject} onChange={(e) => setCourseForm(f => ({ ...f, subject: e.target.value }))} placeholder="Mathematics" />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={courseForm.class_name} onChange={(e) => setCourseForm(f => ({ ...f, class_name: e.target.value }))} placeholder="Class 11-12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Input value={courseForm.teacher} onChange={(e) => setCourseForm(f => ({ ...f, teacher: e.target.value }))} placeholder="Teacher name" />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={courseForm.duration} onChange={(e) => setCourseForm(f => ({ ...f, duration: e.target.value }))} placeholder="6 months" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm(f => ({ ...f, price: e.target.value }))} placeholder="4999" />
            </div>
            <Button onClick={handleCreateCourse} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Create Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Add Module
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input value={moduleForm.title} onChange={(e) => setModuleForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 1 - Introduction" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={moduleForm.description} onChange={(e) => setModuleForm(f => ({ ...f, description: e.target.value }))} placeholder="Module description..." />
            </div>
            <div className="space-y-2">
              <Label>Video Link (optional)</Label>
              <Input value={moduleForm.video_link} onChange={(e) => setModuleForm(f => ({ ...f, video_link: e.target.value }))} placeholder="https://youtube.com/..." />
            </div>
            <Button onClick={handleAddModule} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" /> Upload Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content Title</Label>
              <Input value={contentForm.title} onChange={(e) => setContentForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Algebra Notes Chapter 1" />
            </div>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'pdf', label: 'PDF', icon: FileText },
                  { type: 'video', label: 'Video', icon: Video },
                  { type: 'practice', label: 'Practice', icon: BookOpen },
                  { type: 'material', label: 'Material', icon: FolderOpen }
                ].map(ct => (
                  <button key={ct.type} type="button" onClick={() => setContentForm(f => ({ ...f, type: ct.type }))} className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all ${contentForm.type === ct.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-200'}`}>
                    <ct.icon className="w-5 h-5 mx-auto mb-1" />
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, MP4, DOCX up to 500MB</p>
              </div>
            </div>
            <Button onClick={handleUploadContent} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Upload className="w-4 h-4 mr-2" /> Upload Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Create Batch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input value={batchForm.name} onChange={(e) => setBatchForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Batch A - Morning" />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <select value={batchForm.course_id} onChange={(e) => setBatchForm(f => ({ ...f, course_id: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={batchForm.start_date} onChange={(e) => setBatchForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max Students</Label>
                <Input type="number" value={batchForm.max_students} onChange={(e) => setBatchForm(f => ({ ...f, max_students: e.target.value }))} placeholder="40" />
              </div>
            </div>
            <Button onClick={handleCreateBatch} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Create Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}