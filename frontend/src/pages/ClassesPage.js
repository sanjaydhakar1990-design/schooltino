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
import { Plus, Edit, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClassesPage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    section: '',  // Default to empty (no section)
    class_teacher_id: ''
  });

  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
                      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const sections = ['', 'A', 'B', 'C', 'D', 'E']; // Empty string for "None" option

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
      const response = await axios.get(`${API}/staff?school_id=${schoolId}&designation=Teacher`);
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData, school_id: schoolId };
      
      if (editingClass) {
        await axios.put(`${API}/classes/${editingClass.id}`, payload);
        toast.success(t('saved_successfully'));
      } else {
        await axios.post(`${API}/classes`, payload);
        toast.success(t('saved_successfully'));
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
      await axios.delete(`${API}/classes/${id}`);
      toast.success(t('deleted_successfully'));
      fetchClasses();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      section: 'A',
      class_teacher_id: ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getTeacherName = (teacherId) => {
    const teacher = staff.find(s => s.id === teacherId);
    return teacher?.name || '-';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('classes')}</h1>
          <p className="text-slate-500 mt-1">Manage classes and sections</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-class-btn">
              <Plus className="w-5 h-5 mr-2" />
              {t('add_class')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? t('edit') : t('add_class')}</DialogTitle>
              <DialogDescription className="sr-only">Class form</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t('class_name')} *</Label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="class-name-select"
                >
                  <option value="">Select Class</option>
                  {classNames.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('section')} *</Label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="section-select"
                >
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('class_teacher')}</Label>
                <select
                  name="class_teacher_id"
                  value={formData.class_teacher_id}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="class-teacher-select"
                >
                  <option value="">Select Teacher</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-class-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t('no_data')}</p>
          <p className="text-sm text-slate-400 mt-1">Add classes to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div 
              key={cls.id} 
              className="stat-card flex flex-col"
              data-testid={`class-card-${cls.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(cls)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    data-testid={`edit-class-${cls.id}`}
                  >
                    <Edit className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                    data-testid={`delete-class-${cls.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{cls.name} - {cls.section}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {t('class_teacher')}: {getTeacherName(cls.class_teacher_id)}
              </p>
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{t('student_count')}</span>
                  <span className="font-semibold text-slate-900">{cls.student_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
