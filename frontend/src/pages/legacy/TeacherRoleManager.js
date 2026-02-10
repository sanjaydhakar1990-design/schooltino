import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  User,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  School,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeacherRoleManager() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignType, setAssignType] = useState('class_teacher'); // 'class_teacher' or 'subject_teacher'
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [assignForm, setAssignForm] = useState({
    class_id: '',
    subject: ''
  });

  const subjects = ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 
                   'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Accountancy'];

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, classesRes] = await Promise.all([
        axios.get(`${API}/staff?school_id=${schoolId}&designation=Teacher`),
        axios.get(`${API}/classes?school_id=${schoolId}`)
      ]);
      setTeachers(teachersRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClassTeacher = async () => {
    if (!selectedTeacher || !assignForm.class_id) {
      toast.error('Please select a class');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teachers/${selectedTeacher.id}/assign`, {
        class_id: assignForm.class_id,
        is_class_teacher: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`${selectedTeacher.name} को Class Teacher बनाया गया!`);
      setShowAssignDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubjectTeacher = async () => {
    if (!selectedTeacher || !assignForm.class_id || !assignForm.subject) {
      toast.error('Please select class and subject');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      // Add to subject allocations for timetable
      await axios.post(`${API}/timetable/allocations?school_id=${schoolId}`, {
        class_id: assignForm.class_id,
        subject: assignForm.subject,
        teacher_id: selectedTeacher.id,
        periods_per_week: 5
      });
      
      toast.success(`${selectedTeacher.name} को ${assignForm.subject} Subject Teacher बनाया गया!`);
      setShowAssignDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignDialog = (teacher, type) => {
    setSelectedTeacher(teacher);
    setAssignType(type);
    setAssignForm({ class_id: '', subject: '' });
    setShowAssignDialog(true);
  };

  const getClassTeacherOf = (teacher) => {
    const classDoc = classes.find(c => c.class_teacher_id === teacher.id);
    return classDoc ? `${classDoc.name}-${classDoc.section}` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-role-manager">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Role Management</h1>
        <p className="text-slate-500">Class Teacher और Subject Teacher assign करें</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teachers.length}</p>
              <p className="text-sm text-slate-500">Total Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.filter(c => c.class_teacher_id).length}</p>
              <p className="text-sm text-slate-500">Classes with Class Teacher</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <School className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-sm text-slate-500">Total Classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map(teacher => {
          const classTeacherOf = getClassTeacherOf(teacher);
          
          return (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <CardTitle className="text-base">{teacher.name}</CardTitle>
                      <CardDescription>{teacher.employee_id || 'No ID'}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Class Teacher Badge */}
                  {classTeacherOf ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Class Teacher: {classTeacherOf}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-slate-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        No Class Assigned
                      </Badge>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={classTeacherOf ? "outline" : "default"}
                      className="flex-1 text-xs"
                      onClick={() => openAssignDialog(teacher, 'class_teacher')}
                      data-testid={`assign-class-teacher-${teacher.id}`}
                    >
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {classTeacherOf ? 'Change' : 'Class Teacher'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => openAssignDialog(teacher, 'subject_teacher')}
                      data-testid={`assign-subject-teacher-${teacher.id}`}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Subject Teacher
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No teachers found</p>
          <p className="text-sm text-slate-400">Add teachers from Staff page first</p>
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {assignType === 'class_teacher' ? '👨‍🏫 Class Teacher Assign करें' : '📚 Subject Teacher Assign करें'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedTeacher && (
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {selectedTeacher.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedTeacher.name}</p>
                  <p className="text-sm text-slate-500">{selectedTeacher.designation}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Select Class *</Label>
              <select
                value={assignForm.class_id}
                onChange={(e) => setAssignForm(prev => ({ ...prev, class_id: e.target.value }))}
                className="w-full h-11 rounded-lg border border-slate-200 px-3"
                data-testid="assign-class-select"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}-{cls.section} 
                    {cls.class_teacher_id && assignType === 'class_teacher' ? ' (Has Teacher)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {assignType === 'subject_teacher' && (
              <div className="space-y-2">
                <Label>Select Subject *</Label>
                <select
                  value={assignForm.subject}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3"
                  data-testid="assign-subject-select"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={assignType === 'class_teacher' ? handleAssignClassTeacher : handleAssignSubjectTeacher}
                disabled={submitting || !assignForm.class_id || (assignType === 'subject_teacher' && !assignForm.subject)}
                data-testid="confirm-assign-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign करें'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
