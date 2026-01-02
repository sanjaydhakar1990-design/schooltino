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
import { Plus, Search, Edit, Trash2, Eye, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudentsPage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    admission_no: '',
    class_id: '',
    father_name: '',
    mother_name: '',
    dob: '',
    gender: 'male',
    address: '',
    mobile: '',
    email: '',
    blood_group: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchStudents();
      fetchClasses();
    }
  }, [schoolId, search, selectedClass]);

  const fetchStudents = async () => {
    try {
      let url = `${API}/students?school_id=${schoolId}`;
      if (search) url += `&search=${search}`;
      if (selectedClass) url += `&class_id=${selectedClass}`;
      const response = await axios.get(url);
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes?school_id=${schoolId}`);
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData, school_id: schoolId };
      
      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent.id}`, payload);
        toast.success(t('saved_successfully'));
      } else {
        await axios.post(`${API}/students`, payload);
        toast.success(t('saved_successfully'));
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      admission_no: student.admission_no,
      class_id: student.class_id,
      father_name: student.father_name,
      mother_name: student.mother_name,
      dob: student.dob,
      gender: student.gender,
      address: student.address,
      mobile: student.mobile,
      email: student.email || '',
      blood_group: student.blood_group || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    
    try {
      await axios.delete(`${API}/students/${id}`);
      toast.success(t('deleted_successfully'));
      fetchStudents();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      admission_no: '',
      class_id: '',
      father_name: '',
      mother_name: '',
      dob: '',
      gender: 'male',
      address: '',
      mobile: '',
      email: '',
      blood_group: ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="students-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('students')}</h1>
          <p className="text-slate-500 mt-1">Manage student records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-student-btn">
              <Plus className="w-5 h-5 mr-2" />
              {t('add_student')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? t('edit') : t('add_student')}</DialogTitle>
              <DialogDescription className="sr-only">Student form</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('student_name')} *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="student-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admission_no')} *</Label>
                  <Input
                    name="admission_no"
                    value={formData.admission_no}
                    onChange={handleChange}
                    required
                    data-testid="admission-no-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('class_section')} *</Label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                    data-testid="class-select"
                  >
                    <option value="">{t('select_class')}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('gender')} *</Label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                    data-testid="gender-select"
                  >
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('father_name')} *</Label>
                  <Input
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    required
                    data-testid="father-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('mother_name')} *</Label>
                  <Input
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    required
                    data-testid="mother-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('dob')} *</Label>
                  <Input
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    data-testid="dob-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('mobile')} *</Label>
                  <Input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    data-testid="mobile-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t('address')} *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    data-testid="address-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    data-testid="email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('blood_group')}</Label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                    data-testid="blood-group-select"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-student-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 min-w-[150px]"
          data-testid="filter-class"
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - {cls.section}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t('no_data')}</p>
        </div>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admission_no')}</TableHead>
                <TableHead>{t('student_name')}</TableHead>
                <TableHead>{t('class_section')}</TableHead>
                <TableHead>{t('father_name')}</TableHead>
                <TableHead>{t('mobile')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                  <TableCell className="font-mono text-sm">{student.admission_no}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <span className="badge badge-info">
                      {student.class_name} - {student.section}
                    </span>
                  </TableCell>
                  <TableCell>{student.father_name}</TableCell>
                  <TableCell>{student.mobile}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        data-testid={`edit-student-${student.id}`}
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        data-testid={`delete-student-${student.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
