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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, Search, Edit, Trash2, Eye, Loader2, User, UserPlus, 
  Copy, Check, Ban, RefreshCw, LogOut, MoreVertical, AlertTriangle, Camera, CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import FaceEnrollmentCapture from '../components/FaceEnrollmentCapture';
import IDCardViewer from '../components/IDCardViewer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudentsPage() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [suspendedStudents, setSuspendedStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudentCredentials, setNewStudentCredentials] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    father_name: '',
    mother_name: '',
    dob: '',
    gender: 'male',
    address: '',
    mobile: '',
    email: '',
    blood_group: '',
    aadhar_no: '',
    previous_school: ''
  });

  const [suspendForm, setSuspendForm] = useState({
    reason: 'fees_pending',
    details: ''
  });

  const suspendReasons = {
    fees_pending: 'Fees Pending (शुल्क बकाया)',
    misconduct: 'Misconduct (अनुशासनहीनता)',
    document_pending: 'Document Pending (दस्तावेज़ लंबित)',
    attendance_low: 'Low Attendance (कम उपस्थिति)',
    other: 'Other (अन्य)'
  };

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
      
      const [activeRes, suspendedRes] = await Promise.all([
        axios.get(`${url}&status=active`),
        axios.get(`${url}&status=suspended`)
      ]);
      
      setStudents(activeRes.data);
      setSuspendedStudents(suspendedRes.data);
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
        setIsDialogOpen(false);
      } else {
        // New admission - use /students/admit endpoint
        const response = await axios.post(`${API}/students/admit`, payload);
        
        // Show credentials dialog
        setNewStudentCredentials({
          student_id: response.data.student_id,
          name: response.data.name,
          login_id: response.data.login_id,
          temporary_password: response.data.temporary_password,
          class_name: response.data.class_name,
          section: response.data.section
        });
        setIsDialogOpen(false);
        setIsCredentialsDialogOpen(true);
      }
      
      resetForm();
      fetchStudents();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);

    try {
      await axios.post(`${API}/students/${selectedStudent.id}/suspend?reason=${suspendForm.reason}&details=${suspendForm.details}`);
      toast.success('Student suspended');
      setIsSuspendDialogOpen(false);
      setSuspendForm({ reason: 'fees_pending', details: '' });
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to suspend student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsuspend = async (id) => {
    try {
      await axios.post(`${API}/students/${id}/unsuspend`);
      toast.success('Student unsuspended');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to unsuspend student');
    }
  };

  const handleMarkLeft = async (id) => {
    const reason = window.prompt('Left reason (e.g., Transfer, TC Issued):');
    if (!reason) return;
    
    try {
      await axios.post(`${API}/students/${id}/mark-left?reason=${encodeURIComponent(reason)}`);
      toast.success('Student marked as left');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      class_id: student.class_id,
      father_name: student.father_name,
      mother_name: student.mother_name,
      dob: student.dob,
      gender: student.gender,
      address: student.address,
      mobile: student.mobile,
      email: student.email || '',
      blood_group: student.blood_group || '',
      aadhar_no: student.aadhar_no || '',
      previous_school: student.previous_school || ''
    });
    setIsDialogOpen(true);
  };

  const openSuspendDialog = (student) => {
    setSelectedStudent(student);
    setIsSuspendDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      class_id: '',
      father_name: '',
      mother_name: '',
      dob: '',
      gender: 'male',
      address: '',
      mobile: '',
      email: '',
      blood_group: '',
      aadhar_no: '',
      previous_school: ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied!');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-warning';
      case 'left': return 'badge-error';
      default: return 'badge-info';
    }
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
          <p className="text-slate-500 mt-1">Student Admission & Management</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-student-btn">
              <UserPlus className="w-5 h-5 mr-2" />
              New Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'New Student Admission'}</DialogTitle>
              <DialogDescription>
                {!editingStudent && 'Student ID और Password automatically generate होंगे'}
              </DialogDescription>
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
                  <Label>Parent Mobile * (for login)</Label>
                  <Input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    placeholder="Will be used for OTP login"
                    data-testid="mobile-input"
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
                <div className="space-y-2">
                  <Label>Aadhar Number</Label>
                  <Input
                    name="aadhar_no"
                    value={formData.aadhar_no}
                    onChange={handleChange}
                    placeholder="Optional"
                    data-testid="aadhar-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Previous School</Label>
                  <Input
                    name="previous_school"
                    value={formData.previous_school}
                    onChange={handleChange}
                    placeholder="If transfer student"
                    data-testid="prev-school-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-student-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingStudent ? t('save') : 'Admit Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials Dialog - Shows after successful admission */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Admission Successful!
            </DialogTitle>
            <DialogDescription>
              Student के login credentials नीचे दिए गए हैं। इन्हें Parent को share करें।
            </DialogDescription>
          </DialogHeader>
          {newStudentCredentials && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-lg font-semibold text-emerald-800">{newStudentCredentials.name}</p>
                <p className="text-sm text-emerald-600">{newStudentCredentials.class_name} - {newStudentCredentials.section}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Student ID / Login ID</p>
                    <p className="font-mono font-bold text-lg">{newStudentCredentials.student_id}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(newStudentCredentials.student_id, 'id')}
                  >
                    {copiedField === 'id' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-xs text-amber-600">Temporary Password</p>
                    <p className="font-mono font-bold text-lg">{newStudentCredentials.temporary_password}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(newStudentCredentials.temporary_password, 'pass')}
                  >
                    {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <p className="font-medium">⚠️ Important:</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>यह password सिर्फ एक बार दिखेगा</li>
                  <li>First login पर password change करना mandatory है</li>
                  <li>Parent को Mobile + DOB से भी login कर सकते हैं</li>
                </ul>
              </div>
              
              <Button 
                className="w-full btn-primary" 
                onClick={() => {
                  const text = `Student ID: ${newStudentCredentials.student_id}\nPassword: ${newStudentCredentials.temporary_password}`;
                  copyToClipboard(text, 'all');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Credentials
              </Button>
              
              {/* Face Enrollment Option */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <p className="text-sm text-slate-600 mb-3">
                  📸 <strong>Face Enrollment</strong> - AI attendance ke liye photos add karein
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => {
                      setIsCredentialsDialogOpen(false);
                      setShowFaceEnrollment(true);
                    }}
                  >
                    📷 Capture Photos Now
                  </Button>
                  <Button 
                    variant="ghost"
                    className="text-slate-500"
                    onClick={() => {
                      toast.info('Face enrollment skipped. Complete from student profile later.');
                      setIsCredentialsDialogOpen(false);
                    }}
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Suspend Student
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.name} को temporarily suspend करें
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSuspend} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <select
                value={suspendForm.reason}
                onChange={(e) => setSuspendForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
                required
              >
                {Object.entries(suspendReasons).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Input
                value={suspendForm.details}
                onChange={(e) => setSuspendForm(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Additional details..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Suspend Student
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by name or Student ID..."
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

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            <User className="w-4 h-4 mr-2" />
            Active ({students.length})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            <Ban className="w-4 h-4 mr-2" />
            Suspended ({suspendedStudents.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Students */}
        <TabsContent value="active">
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
                    <TableHead>Student ID</TableHead>
                    <TableHead>{t('student_name')}</TableHead>
                    <TableHead>{t('class_section')}</TableHead>
                    <TableHead>{t('father_name')}</TableHead>
                    <TableHead>{t('mobile')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                      <TableCell className="font-mono text-sm font-medium">{student.student_id || student.admission_no}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <span className="badge badge-info">
                          {student.class_name} - {student.section}
                        </span>
                      </TableCell>
                      <TableCell>{student.father_name}</TableCell>
                      <TableCell>{student.mobile}</TableCell>
                      <TableCell>
                        <span className={`badge ${getStatusBadge(student.status)}`}>
                          {student.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setIdCardStudent(student);
                                setShowIDCard(true);
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2 text-indigo-600" />
                              View ID Card
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setNewStudentCredentials({
                                  student_id: student.student_id || student.id,
                                  name: student.name
                                });
                                setShowFaceEnrollment(true);
                              }}
                            >
                              <Camera className="w-4 h-4 mr-2 text-emerald-600" />
                              Face Enrollment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openSuspendDialog(student)}>
                              <Ban className="w-4 h-4 mr-2 text-amber-500" />
                              Suspend
                            </DropdownMenuItem>
                            {['director', 'principal'].includes(user?.role) && (
                              <DropdownMenuItem 
                                onClick={() => handleMarkLeft(student.id)}
                                className="text-rose-600"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Mark as Left (TC)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Suspended Students */}
        <TabsContent value="suspended">
          {suspendedStudents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Ban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No suspended students</p>
            </div>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>{t('student_name')}</TableHead>
                    <TableHead>{t('class_section')}</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspendedStudents.map((student) => (
                    <TableRow key={student.id} className="bg-amber-50">
                      <TableCell className="font-mono text-sm">{student.student_id || student.admission_no}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <span className="badge badge-warning">
                          {student.class_name} - {student.section}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-amber-700">
                          {suspendReasons[student.suspension_reason] || student.suspension_reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        {['director', 'principal'].includes(user?.role) && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleUnsuspend(student.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Unsuspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Face Enrollment Modal */}
      {showFaceEnrollment && newStudentCredentials && (
        <FaceEnrollmentCapture
          isOpen={showFaceEnrollment}
          onClose={() => setShowFaceEnrollment(false)}
          studentId={newStudentCredentials.student_id}
          schoolId={schoolId}
          studentName={newStudentCredentials.name}
          onComplete={() => {
            setShowFaceEnrollment(false);
            toast.success('Face enrollment completed!');
            fetchStudents();
          }}
          onSkip={() => {
            setShowFaceEnrollment(false);
            toast.info('Face enrollment skipped. Complete later from profile.');
          }}
        />
      )}

      {/* ID Card Viewer Modal */}
      {showIDCard && idCardStudent && (
        <IDCardViewer
          isOpen={showIDCard}
          onClose={() => {
            setShowIDCard(false);
            setIdCardStudent(null);
          }}
          personId={idCardStudent.student_id || idCardStudent.id}
          personType="student"
          schoolId={schoolId}
          onPhotoUpload={() => fetchStudents()}
        />
      )}
    </div>
  );
}
