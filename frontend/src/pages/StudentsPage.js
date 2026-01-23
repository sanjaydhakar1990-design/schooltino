import { useState, useEffect, useRef } from 'react';
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
  Copy, Check, Ban, RefreshCw, LogOut, MoreVertical, AlertTriangle, Camera, CreditCard,
  Upload, X, Fingerprint, Image, Printer, ArrowUpCircle, FileUp, GraduationCap
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
import StudentIDCard from '../components/StudentIDCard';

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
  const [showPrintableIDCard, setShowPrintableIDCard] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudentCredentials, setNewStudentCredentials] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  
  // Promotion states
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotingStudents, setPromotingStudents] = useState(false);
  const [promotionData, setPromotionData] = useState({
    fromClassId: '',
    toClassId: '',
    selectedStudentIds: [],
    selectAll: false
  });
  
  // Document upload states
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentStudent, setDocumentStudent] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Photo capture states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    father_name: '',
    mother_name: '',
    guardian_name: '',
    guardian_relation: '',
    dob: '',
    gender: 'male',
    address: '',
    mobile: '',
    parent_phone: '',  // Parent's phone for ID card
    email: '',
    blood_group: '',
    aadhar_no: '',
    samgra_id: '',  // Samgra ID for MP Board schools
    jan_aadhar_no: '',  // Jan Aadhar/Bhamashah for RBSE
    previous_school: '',
    admission_date: new Date().toISOString().split('T')[0] // Default to today
  });
  
  // Document uploads
  const [documents, setDocuments] = useState({
    birth_certificate: null,
    aadhar_card: null,
    transfer_certificate: null,
    marksheet: null,
    caste_certificate: null,
    income_certificate: null,
    passport_photo: null
  });

  // Parent/Guardian photo states
  const [parentPhotos, setParentPhotos] = useState({
    father_photo: null,
    mother_photo: null,
    guardian_photo: null
  });
  const [showParentCamera, setShowParentCamera] = useState(null); // 'father', 'mother', 'guardian'
  const parentVideoRef = useRef(null);
  const parentCanvasRef = useRef(null);
  const [parentCameraStream, setParentCameraStream] = useState(null);

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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let url = `${API}/students?school_id=${schoolId}`;
      if (search) url += `&search=${search}`;
      if (selectedClass) url += `&class_id=${selectedClass}`;
      
      const [activeRes, suspendedRes] = await Promise.all([
        axios.get(`${url}&status=active`, { headers }),
        axios.get(`${url}&status=suspended`, { headers })
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/classes?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  // Camera functions for photo capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(dataUrl);
      stopCamera();
      toast.success('Photo captured! 📸');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target.result);
        toast.success('Photo uploaded! 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData, school_id: schoolId };
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent.id}`, payload, { headers });
        toast.success(t('saved_successfully'));
        setIsDialogOpen(false);
      } else {
        // New admission - use /students/admit endpoint
        const response = await axios.post(`${API}/students/admit`, payload, { headers });
        
        const studentId = response.data.student_id;
        
        // If photo was captured, upload it for face recognition
        if (capturedPhoto) {
          try {
            // Convert base64 to blob
            const base64Data = capturedPhoto.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            const photoFormData = new FormData();
            photoFormData.append('photo', blob, 'admission_photo.jpg');
            photoFormData.append('student_id', studentId);
            photoFormData.append('school_id', schoolId);
            photoFormData.append('photo_type', 'front');
            
            await axios.post(`${API}/face-recognition/upload-photo`, photoFormData, {
              headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            toast.success('Face photo uploaded for AI attendance! 📸');
          } catch (photoErr) {
            console.error('Photo upload failed:', photoErr);
            toast.info('Student created but photo upload failed. Add later from profile.');
          }
        }
        
        // Show credentials dialog
        setNewStudentCredentials({
          student_id: studentId,
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
      setCapturedPhoto(null); // Clear captured photo
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
      const token = localStorage.getItem('token');
      await axios.post(`${API}/students/${selectedStudent.id}/suspend?reason=${suspendForm.reason}&details=${suspendForm.details}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await axios.post(`${API}/students/${id}/unsuspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      await axios.post(`${API}/students/${id}/mark-left?reason=${encodeURIComponent(reason)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student marked as left');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  // Delete student permanently (Admin only)
  const handleDeleteStudent = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/students/${deleteStudent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student data permanently deleted');
      setShowDeleteDialog(false);
      setDeleteStudent(null);
      setDeleteConfirmText('');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (student) => {
    setDeleteStudent(student);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
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
      parent_phone: student.parent_phone || student.mobile || '',
      email: student.email || '',
      blood_group: student.blood_group || '',
      aadhar_no: student.aadhar_no || '',
      samgra_id: student.samgra_id || '',
      previous_school: student.previous_school || '',
      admission_date: student.admission_date || new Date().toISOString().split('T')[0]
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
      parent_phone: '',
      email: '',
      blood_group: '',
      aadhar_no: '',
      samgra_id: '',
      previous_school: '',
      admission_date: new Date().toISOString().split('T')[0] // Default to today
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

  // Bulk Print All Student ID Cards
  const handleBulkPrintIDCards = async () => {
    if (students.length === 0) {
      toast.error('No students to print');
      return;
    }
    
    setBulkPrinting(true);
    toast.info('Generating ID cards...');
    
    try {
      const token = localStorage.getItem('token');
      const activeStudents = students.filter(s => s.status === 'active');
      const cardDataList = [];
      
      // Fetch all card data first
      for (const student of activeStudents) {
        try {
          const res = await axios.get(API + '/id-card/generate/student/' + student.id, {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (res.data?.id_card) {
            cardDataList.push({
              card: res.data.id_card,
              school: res.data.school
            });
          }
        } catch (e) {
          console.error('Error fetching card for', student.name);
        }
      }
      
      // Generate HTML and open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked - please allow popups');
        setBulkPrinting(false);
        return;
      }
      
      // Build cards HTML
      let cardsHtml = cardDataList.map(item => {
        const card = item.card;
        const sch = item.school;
        const logoImg = sch?.logo_url ? '<div class="watermark"><img src="' + sch.logo_url + '" alt=""/></div>' : '';
        const headerLogo = sch?.logo_url ? '<div class="header-logo"><img src="' + sch.logo_url + '" alt=""/></div>' : '';
        const parentPhone = card.parent_phone || card.phone || '';
        
        return '<div class="id-card">' + logoImg + 
          '<div class="content"><div class="header">' + headerLogo +
          '<div class="header-text"><div class="school-name">' + (sch?.name || 'School') + '</div>' +
          '<div class="card-type">STUDENT ID CARD</div></div></div>' +
          '<div class="body"><div class="photo"><span>Photo</span></div>' +
          '<div class="details"><div class="name">' + card.name + '</div>' +
          '<div class="detail-row"><span class="label">Class:</span><span class="value">' + (card.class || '') + '</span></div>' +
          '<div class="detail-row"><span class="label">Father:</span><span class="value">' + (card.father_name || '') + '</span></div>' +
          (card.blood_group ? '<div class="detail-row"><span class="label">Blood:</span><span class="value">' + card.blood_group + '</span></div>' : '') +
          (parentPhone ? '<div class="contact">📞 Parent: ' + parentPhone + '</div>' : '') +
          '</div></div><div class="footer">Valid: ' + (card.valid_until || (new Date().getFullYear() + 1)) + '</div></div></div>';
      }).join('');
      
      const pageHtml = '<!DOCTYPE html><html><head><title>Bulk Student ID Cards</title>' +
        '<style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}' +
        'body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10mm;padding:10mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        '.id-card{width:85.6mm;height:54mm;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#1e40af 100%);border-radius:4mm;overflow:hidden;position:relative;color:white;padding:3mm;page-break-inside:avoid}' +
        '.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.15;width:25mm;height:25mm}.watermark img{width:100%;height:100%;object-fit:contain}' +
        '.content{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
        '.header{display:flex;align-items:center;gap:2mm;padding-bottom:2mm;border-bottom:0.3mm solid rgba(255,255,255,0.3);margin-bottom:2mm}' +
        '.header-logo{width:7mm;height:7mm;background:white;border-radius:50%;padding:0.5mm}.header-logo img{width:100%;height:100%;object-fit:contain;border-radius:50%}' +
        '.header-text{flex:1;text-align:center}.school-name{font-size:8pt;font-weight:bold;text-transform:uppercase}' +
        '.card-type{font-size:5pt;background:rgba(255,255,255,0.25);padding:0.5mm 2mm;border-radius:2mm;display:inline-block;margin-top:1mm}' +
        '.body{display:flex;gap:2mm;flex:1}.photo{width:16mm;height:20mm;background:white;border-radius:2mm;display:flex;align-items:center;justify-content:center;color:#999;font-size:6pt}' +
        '.details{flex:1;font-size:6pt}.name{font-size:9pt;font-weight:bold;color:#fef08a;margin-bottom:1mm}' +
        '.detail-row{margin-bottom:0.5mm}.label{opacity:0.8;width:12mm;display:inline-block}.value{font-weight:600}' +
        '.contact{background:rgba(255,255,255,0.2);padding:1mm;border-radius:1mm;margin-top:1mm;font-size:5.5pt}' +
        '.footer{font-size:4pt;opacity:0.8;text-align:right;margin-top:auto}</style></head>' +
        '<body>' + cardsHtml + '<script>window.onload=function(){setTimeout(function(){window.print()},1000)}</script></body></html>';
      
      printWindow.document.write(pageHtml);
      printWindow.document.close();
      toast.success(cardDataList.length + ' ID cards ready to print!');
    } catch (error) {
      toast.error('Error generating bulk ID cards');
    } finally {
      setBulkPrinting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-warning';
      case 'left': return 'badge-error';
      default: return 'badge-info';
    }
  };

  // Class name order for promotion
  const classOrder = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  const getNextClass = (currentClassName) => {
    const idx = classOrder.findIndex(c => currentClassName.includes(c));
    if (idx >= 0 && idx < classOrder.length - 1) {
      return classOrder[idx + 1];
    }
    return null;
  };

  // Get students for promotion from selected class
  const getStudentsForPromotion = () => {
    if (!promotionData.fromClassId) return [];
    return students.filter(s => s.class_id === promotionData.fromClassId && s.status === 'active');
  };

  // Handle bulk promotion
  const handleBulkPromotion = async () => {
    if (!promotionData.toClassId || promotionData.selectedStudentIds.length === 0) {
      toast.error('कृपया target class और students select करें');
      return;
    }

    setPromotingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/students/bulk-promote`, {
        student_ids: promotionData.selectedStudentIds,
        from_class_id: promotionData.fromClassId,
        to_class_id: promotionData.toClassId,
        school_id: schoolId,
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`${response.data.promoted_count} students promoted successfully!`);
        setShowPromotionDialog(false);
        setPromotionData({ fromClassId: '', toClassId: '', selectedStudentIds: [], selectAll: false });
        fetchStudents();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Promotion failed');
    } finally {
      setPromotingStudents(false);
    }
  };

  // Handle select all for promotion
  const handleSelectAllForPromotion = (checked) => {
    const studentsToPromote = getStudentsForPromotion();
    setPromotionData(prev => ({
      ...prev,
      selectAll: checked,
      selectedStudentIds: checked ? studentsToPromote.map(s => s.id) : []
    }));
  };

  // Toggle individual student selection for promotion
  const toggleStudentForPromotion = (studentId) => {
    setPromotionData(prev => ({
      ...prev,
      selectedStudentIds: prev.selectedStudentIds.includes(studentId)
        ? prev.selectedStudentIds.filter(id => id !== studentId)
        : [...prev.selectedStudentIds, studentId]
    }));
  };

  // Document upload handler
  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setUploadingDocument(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_id', documentStudent.id);
      formData.append('document_type', docType);
      formData.append('school_id', schoolId);

      const response = await axios.post(`${API}/students/upload-document`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.data.success) {
        toast.success(`${docType} uploaded successfully!`);
        fetchStudents();
      }
    } catch (error) {
      toast.error('Document upload failed');
    } finally {
      setUploadingDocument(false);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('students')}</h1>
          <p className="text-slate-500 mt-1">Student Admission & Management</p>
        </div>
        <div className="flex gap-2">
          {/* Promotion Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowPromotionDialog(true)}
            className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
            data-testid="promote-students-btn"
          >
            <GraduationCap className="w-4 h-4" />
            Promote Students
          </Button>
          {/* Bulk Print Button */}
          <Button 
            variant="outline" 
            onClick={handleBulkPrintIDCards}
            disabled={bulkPrinting || students.length === 0}
            className="gap-2"
            data-testid="bulk-print-btn"
          >
            {bulkPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Bulk Print ID Cards
          </Button>
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
                        {cls.name}{cls.section && cls.section !== 'A' ? ` - ${cls.section}` : ''}
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
                    max={new Date().toISOString().split('T')[0]}
                    min="1990-01-01"
                    data-testid="dob-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admission Date (प्रवेश तिथि) *</Label>
                  <Input
                    name="admission_date"
                    type="date"
                    value={formData.admission_date}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="2000-01-01"
                    data-testid="admission-date-input"
                  />
                  <p className="text-xs text-slate-500">Mid-session joining schools के लिए पुरानी date डाल सकते हैं</p>
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
                  <Label>📞 Parent Phone (for ID Card) *</Label>
                  <Input
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleChange}
                    placeholder="Father/Mother का phone number"
                    data-testid="parent-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Samgra ID (MP Board)</Label>
                  <Input
                    name="samgra_id"
                    value={formData.samgra_id}
                    onChange={handleChange}
                    placeholder="Only for MP Board schools"
                    data-testid="samgra-id-input"
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

              {/* Photo Capture Section - Only for new admission */}
              {!editingStudent && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-indigo-600" />
                    Student Photo (AI Attendance के लिए) - Optional
                  </Label>
                  
                  {!capturedPhoto && !showCamera && (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-20"
                        onClick={startCamera}
                        data-testid="open-camera-btn"
                      >
                        <div className="flex flex-col items-center">
                          <Camera className="w-6 h-6 mb-1" />
                          <span>📷 Camera से Capture</span>
                        </div>
                      </Button>
                      <label className="flex-1">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-20 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-sm text-slate-600">📁 Photo Upload</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          data-testid="photo-upload-input"
                        />
                      </label>
                    </div>
                  )}

                  {/* Camera View */}
                  {showCamera && (
                    <div className="relative bg-black rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-white text-indigo-600 hover:bg-indigo-50"
                          data-testid="capture-btn"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Capture
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopCamera}
                          className="bg-white/80 text-red-600 border-red-300"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Photo Preview */}
                  {capturedPhoto && (
                    <div className="relative">
                      <img
                        src={capturedPhoto}
                        alt="Captured"
                        className="w-full h-48 object-cover rounded-xl border-2 border-emerald-500"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="bg-white/90 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={removePhoto}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Photo Ready
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    * Photo optional hai। बाद में student profile से भी add कर सकते हैं।
                  </p>
                </div>
              )}

              {/* Biometric Enrollment Section - Only for new admission */}
              {!editingStudent && (
                <div className="border-t border-slate-200 pt-4 mt-2">
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                    <Fingerprint className="w-5 h-5 text-emerald-600" />
                    Biometric Enrollment (Fingerprint) - Optional
                  </Label>
                  
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Fingerprint className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 font-medium">
                          Fingerprint Registration
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Biometric device से fingerprint register करें। Student admission के बाद Biometric section से भी कर सकते हैं।
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-xs text-slate-400">Not enrolled</span>
                    </div>
                    
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Biometric device connect होने पर ही काम करेगा
                    </p>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    * Biometric optional है। बाद में Biometric section से enroll कर सकते हैं।
                  </p>
                </div>
              )}

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
                  📸 <strong>Face Enrollment</strong> - AI attendance ke liye photos add karein (Optional)
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => {
                      setIsCredentialsDialogOpen(false);
                      setShowFaceEnrollment(true);
                    }}
                    data-testid="capture-photos-btn"
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
                    data-testid="skip-face-btn"
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>

              {/* Biometric Enrollment Option */}
              <div className="border-t border-slate-200 pt-4 mt-2">
                <p className="text-sm text-slate-600 mb-3">
                  👆 <strong>Biometric Enrollment</strong> - Fingerprint registration (Optional)
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      toast.info('Biometric device se connect karein aur fingerprint register karein.');
                      // Navigate to biometric page with student context
                      window.location.href = `/app/biometric?student_id=${newStudentCredentials?.student_id}&name=${encodeURIComponent(newStudentCredentials?.name || '')}`;
                    }}
                    data-testid="biometric-enroll-btn"
                  >
                    👆 Enroll Biometric Now
                  </Button>
                  <Button 
                    variant="ghost"
                    className="text-slate-500"
                    onClick={() => {
                      toast.info('Biometric enrollment skipped. Complete later from Biometric section.');
                    }}
                    data-testid="skip-biometric-btn"
                  >
                    Skip
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
              {cls.name}{cls.section && cls.section !== 'A' ? ` - ${cls.section}` : ''}
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
                          {student.class_name}{student.section && student.section !== 'A' ? ` - ${student.section}` : ''}
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
                            {(user?.role === 'director' || user?.role === 'admin') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(student)}
                                  className="text-red-600 bg-red-50 hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
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
                          {student.class_name}{student.section && student.section !== 'A' ? ` - ${student.section}` : ''}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              ⚠️ DANGER: Permanent Delete
            </DialogTitle>
          </DialogHeader>
          
          {deleteStudent && (
            <div className="space-y-4">
              {/* Risk Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">🚨 महत्वपूर्ण चेतावनी:</h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>यह action UNDO नहीं किया जा सकता</li>
                  <li>Student का सारा data हमेशा के लिए delete हो जाएगा</li>
                  <li>Attendance, Fee records, Results सब delete हो जाएंगे</li>
                  <li>Face recognition data भी delete हो जाएगा</li>
                </ul>
              </div>
              
              {/* Student Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-medium text-lg">{deleteStudent.name}</p>
                <p className="text-sm text-slate-500">
                  {deleteStudent.student_id} • {deleteStudent.class_name || 'Class N/A'}
                </p>
                <p className="text-sm text-slate-500">
                  Father: {deleteStudent.father_name}
                </p>
              </div>
              
              {/* Confirmation Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Confirm करने के लिए <span className="text-red-600 font-bold">DELETE</span> type करें:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE here"
                  className="border-red-200 focus:border-red-400"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                >
                  Cancel (रद्द करें)
                </Button>
                <Button 
                  onClick={handleDeleteStudent}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
