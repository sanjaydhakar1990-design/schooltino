import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit, Trash2, Loader2, GraduationCap, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Standard subjects per class level
const SUBJECTS_BY_LEVEL = {
  prePrimary: ['Mathematics', 'English', 'Hindi', 'EVS'],
  primary:    ['Mathematics', 'English', 'Hindi', 'Science', 'Social Studies', 'EVS'],
  upper:      ['Mathematics', 'English', 'Hindi', 'Science', 'Social Studies', 'History', 'Geography'],
  higher:     ['Mathematics', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Social Studies'],
};

function getSubjectsForClass(className) {
  if (['Nursery', 'LKG', 'UKG'].includes(className)) return SUBJECTS_BY_LEVEL.prePrimary;
  const num = parseInt(className?.replace(/\D/g, ''));
  if (num >= 1 && num <= 5)  return SUBJECTS_BY_LEVEL.primary;
  if (num >= 6 && num <= 8)  return SUBJECTS_BY_LEVEL.upper;
  if (num >= 9 && num <= 12) return SUBJECTS_BY_LEVEL.higher;
  return SUBJECTS_BY_LEVEL.prePrimary;
}

export default function ClassesPage() {
  const { t } = useTranslation();
  const { schoolId, token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Subject assignment modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectModalClass, setSubjectModalClass] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    section: '',
    class_teacher_id: ''
  });

  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
                      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const sections = ['', 'A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStaff();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes?school_id=${schoolId}`);
      setClasses(response.data);
    } catch (error) {
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      // [FIX] Unified approach: Get users with teacher role
      const response = await axios.get(`${API}/users/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const teachers = response.data.filter(u =>
        u.role === 'teacher' ||
        u.role === 'principal' ||
        u.role === 'vice_principal'
      );
      
      console.log('[ClassesPage] Fetched teachers:', teachers.length, teachers);
      
      if (teachers.length > 0) {
        setStaff(teachers);
        return;
      }
      
      throw new Error('No teachers in users');
    } catch (error) {
      console.error('[ClassesPage] Users endpoint failed, trying employees fallback:', error);
      try {
        // Fallback: employees endpoint with user_id mapping
        const response = await axios.get(`${API}/employees?school_id=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const teachers = response.data
          .filter(e => e.user_id && (
            e.role === 'teacher' ||
            e.role === 'principal' ||
            e.role === 'vice_principal' ||
            (e.designation && e.designation.toLowerCase().includes('teacher'))
          ))
          .map(e => ({
            ...e,
            id: e.user_id,  // Map user_id to id for consistency
            name: e.name || e.full_name || e.email
          }));
          
        console.log('[ClassesPage] Fetched from employees (mapped):', teachers.length, teachers);
        setStaff(teachers);
      } catch (e) {
        console.error('[ClassesPage] Employees fallback also failed:', e);
        toast.error('Failed to fetch teachers. Please refresh.');
      }
    }
  };

  const fetchExistingAllocations = async (classId) => {
    try {
      const res = await axios.get(`${API}/timetable/allocations/${classId}?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return (res.data?.allocations || res.data || []).map(a => a.subject);
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData, school_id: schoolId };
      const oldTeacherId = editingClass?.class_teacher_id;
      
      if (editingClass) {
        await axios.put(`${API}/classes/${editingClass.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('saved_successfully'));

        // class_teacher changed → open subject modal
        if (formData.class_teacher_id && formData.class_teacher_id !== oldTeacherId) {
          const existingSubjects = await fetchExistingAllocations(editingClass.id);
          const allSubjects = getSubjectsForClass(formData.name);
          setSelectedSubjects(existingSubjects.length > 0 ? existingSubjects : allSubjects);
          setSubjectModalClass({ id: editingClass.id, name: formData.name, class_teacher_id: formData.class_teacher_id });
          setShowSubjectModal(true);
        }
      } else {
        const res = await axios.post(`${API}/classes`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('saved_successfully'));

        // New class with a teacher → open subject modal
        if (formData.class_teacher_id && res.data?.id) {
          const allSubjects = getSubjectsForClass(formData.name);
          setSelectedSubjects(allSubjects);
          setSubjectModalClass({ id: res.data.id, name: formData.name, class_teacher_id: formData.class_teacher_id });
          setShowSubjectModal(true);
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      section: cls.section,
      class_teacher_id: cls.class_teacher_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await axios.delete(`${API}/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('deleted_successfully'));
      fetchClasses();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    }
  };

  // Manual subject assignment from class card
  const openSubjectModal = async (cls) => {
    if (!cls.class_teacher_id) {
      toast.warning('Pehle class teacher assign karein');
      return;
    }
    const existingSubjects = await fetchExistingAllocations(cls.id);
    const allSubjects = getSubjectsForClass(cls.name);
    setSelectedSubjects(existingSubjects.length > 0 ? existingSubjects : allSubjects);
    setSubjectModalClass({ id: cls.id, name: cls.name, class_teacher_id: cls.class_teacher_id });
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async () => {
    if (!subjectModalClass || selectedSubjects.length === 0) return;
    setSubjectSubmitting(true);
    try {
      const res = await axios.post(`${API}/classes/${subjectModalClass.id}/assign-subjects`, {
        teacher_id: subjectModalClass.class_teacher_id,
        subjects: selectedSubjects
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`✅ ${res.data?.created || 0} subjects assigned, ${res.data?.updated || 0} updated`);
      setShowSubjectModal(false);
    } catch (error) {
      const msg = error.response?.data?.detail;
      console.error('[Subject Assignment Error]', error.response?.data);
      toast.error(typeof msg === 'string' ? msg : 'Subject assignment failed');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({ name: '', section: 'A', class_teacher_id: '' });
  };

  // [FIX] Improved teacher name display with fallback
  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Not Assigned';
    
    const teacher = staff.find(s => s.id === teacherId);
    if (teacher) {
      return teacher.name || teacher.full_name || teacher.email || teacherId.substring(0, 8);
    }
    
    // [FALLBACK] If teacher not in staff array, show shortened ID
    console.warn('[ClassesPage] Teacher not found in staff array:', teacherId);
    return teacherId.length > 20 ? `${teacherId.substring(0, 8)}...` : teacherId;
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="classes-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('classes')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage class teachers and subjects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('add_class')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? t('edit_class') : t('add_class')}</DialogTitle>
              <DialogDescription>
                {editingClass ? 'Update class information' : 'Add a new class to your school'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('class_name')}</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <Label>Section (Optional)</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                >
                  <option value="">None (Single Section)</option>
                  {sections.filter(s => s).map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
              <div>
                <Label>{t('class_teacher')}</Label>
                <select
                  name="class_teacher_id"
                  value={formData.class_teacher_id}
                  onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Teacher</option>
                  {staff.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name || teacher.full_name || teacher.email || teacher.id}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {staff.length === 0 ? '⚠️ No teachers found. Please add teachers first.' : `${staff.length} teachers available`}
                </p>
              </div>
              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg">
          <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No classes created yet</p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create First Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="border rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{cls.name} {cls.section && `(${cls.section})`}</h3>
                  <p className="text-sm text-slate-500">
                    {t('class_teacher')}: {cls.class_teacher_id 
                      ? <span className="font-medium text-slate-700">{getTeacherName(cls.class_teacher_id)}</span>
                      : <span className="text-orange-600">Not Assigned</span>
                    }
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openSubjectModal(cls)} className="p-2 hover:bg-slate-100 rounded" title="Assign Subjects">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleEdit(cls)} className="p-2 hover:bg-slate-100 rounded">
                    <Edit className="h-4 w-4 text-slate-600" />
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="p-2 hover:bg-slate-100 rounded">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Student Count: <span className="font-semibold">{cls.student_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Assignment Modal */}
      <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subjects - {subjectModalClass?.name}</DialogTitle>
            <DialogDescription>
              Teacher: <span className="font-semibold">{subjectModalClass ? getTeacherName(subjectModalClass.class_teacher_id) : ''}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Select subjects to assign. These will appear on the teacher's dashboard.</p>
            <div className="grid grid-cols-2 gap-2">
              {subjectModalClass && getSubjectsForClass(subjectModalClass.name).map((subject) => (
                <label key={subject} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => toggleSubject(subject)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{subject}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
            <Button onClick={handleSubjectSubmit} disabled={subjectSubmitting || selectedSubjects.length === 0}>
              {subjectSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : `Assign ${selectedSubjects.length} Subject(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}