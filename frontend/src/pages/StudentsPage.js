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
  Upload, X, Fingerprint, Image, Printer, ArrowUpCircle, FileUp, GraduationCap, Key, MessageCircle, Share2,
  Phone, Wallet, Bus, Heart, Users
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
import BulkImport from '../components/BulkImport';
import DocumentUpload from '../components/DocumentUpload';

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
  
  // Credentials sharing states
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentialsStudent, setCredentialsStudent] = useState(null);
  const [showBulkCredentialsDialog, setShowBulkCredentialsDialog] = useState(false);
  
  // Profile view states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  
  // Split view state
  const [splitViewStudent, setSplitViewStudent] = useState(null);
  
  // Photo capture states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Form Tab State
  const [activeFormTab, setActiveFormTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    class_id: '',
    dob: '',
    gender: 'male',
    blood_group: '',
    admission_date: new Date().toISOString().split('T')[0],
    // Identity Documents
    aadhar_no: '',
    scholar_no: '',
    pen_number: '',
    sssmid: '',
    samagra_family_id: '',
    jan_aadhar_no: '',
    // Category Info
    caste: '',
    sub_caste: '',
    religion: '',
    category: '',
    nationality: 'Indian',
    mother_tongue: '',
    birth_place: '',
    identification_mark: '',
    rte_status: false,
    // Family Info
    father_name: '',
    father_occupation: '',
    father_qualification: '',
    mother_name: '',
    mother_occupation: '',
    mother_qualification: '',
    guardian_name: '',
    guardian_relation: '',
    guardian_mobile: '',
    guardian_occupation: '',
    annual_income: '',
    // Contact Info
    mobile: '',
    parent_phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    emergency_contact_name: '',
    // Bank Details (Scholarship)
    bank_name: '',
    bank_account_no: '',
    ifsc_code: '',
    bank_branch: '',
    // Transport
    transport_mode: '',
    bus_route: '',
    bus_stop: '',
    pickup_point: '',
    // Hostel
    is_hosteler: false,
    hostel_room_no: '',
    // Medical
    medical_conditions: '',
    allergies: '',
    // Previous Education
    previous_school: '',
    previous_class: '',
    previous_percentage: '',
    tc_number: ''
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

  // View/Share Student Credentials
  const viewCredentials = async (student) => {
    setCredentialsStudent({
      name: student.name,
      student_id: student.student_id || student.id,
      class_name: student.class_name,
      father_name: student.father_name,
      mobile: student.mobile || student.parent_phone,
      // Default password is mobile number or student_id
      default_password: student.mobile || student.parent_phone || student.student_id || student.id
    });
    setShowCredentialsDialog(true);
  };

  // Generate credentials text for sharing
  const generateCredentialsText = (student) => {
    return `📚 *StudyTino Login Details*

👤 Student: ${student.name}
🏫 Class: ${student.class_name || 'N/A'}

🔐 *Login Credentials:*
Student ID: ${student.student_id}
Password: ${student.default_password}

📱 App Link: ${window.location.origin}/studytino

Note: First login पर password change करें।`;
  };

  // Share via WhatsApp
  const shareViaWhatsApp = (student) => {
    const text = generateCredentialsText(student);
    const phone = student.mobile?.replace(/[^0-9]/g, '') || '';
    const url = phone 
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy credentials to clipboard
  const copyCredentials = async (student) => {
    const text = generateCredentialsText(student);
    await navigator.clipboard.writeText(text);
    toast.success('Credentials copied!');
  };

  const openStudentProfile = (student) => {
    setProfileStudent(student);
    setShowProfileModal(true);
  };

  const printStudentProfile = (student) => {
    const s = student;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked - please allow popups');
      return;
    }
    const photoHtml = s.photo_url 
      ? `<img src="${s.photo_url}" style="width:120px;height:140px;object-fit:cover;border-radius:8px;border:2px solid #1e40af;" />`
      : `<div style="width:120px;height:140px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:48px;color:#94a3b8;border:2px solid #1e40af;">👤</div>`;
    
    const row = (label, value) => value ? `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;background:#f8fafc;border:1px solid #e2e8f0;width:200px;">${label}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;">${value}</td></tr>` : '';
    const sectionHeader = (title, emoji) => `<tr><td colspan="2" style="padding:10px 12px;font-weight:700;font-size:14px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:1px solid #1e40af;">${emoji} ${title}</td></tr>`;
    
    const html = `<!DOCTYPE html><html><head><title>Student Profile - ${s.name}</title>
<style>@page{size:A4;margin:15mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;margin:0;padding:20px}
.header{text-align:center;margin-bottom:20px;border-bottom:3px solid #1e40af;padding-bottom:15px}
table{width:100%;border-collapse:collapse;margin-bottom:15px;font-size:13px}
.print-btn{position:fixed;top:10px;right:10px;padding:10px 20px;background:#1e40af;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px}
@media print{.print-btn{display:none}}</style></head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ Print</button>
<div class="header">
${photoHtml}
<h1 style="margin:10px 0 5px;color:#1e40af;font-size:24px;">${s.name}</h1>
<p style="color:#64748b;margin:0;">Student ID: ${s.student_id || s.admission_no || 'N/A'} | Class: ${s.class_name || 'N/A'}${s.section ? ' - ' + s.section : ''}</p>
</div>
<table>
${sectionHeader('Basic Information (मूल जानकारी)', '📋')}
${row('Name (नाम)', s.name)}
${row('Student ID', s.student_id || s.admission_no)}
${row('Class (कक्षा)', s.class_name)}
${row('Section', s.section)}
${row('Gender (लिंग)', s.gender)}
${row('Date of Birth (जन्म तिथि)', s.dob)}
${row('Blood Group (रक्त समूह)', s.blood_group)}
${row('Admission Date (प्रवेश तिथि)', s.admission_date)}
${row('Category (श्रेणी)', s.category)}
${row('Caste (जाति)', s.caste)}
${row('Religion (धर्म)', s.religion)}
${row('Nationality', s.nationality)}
${row('Mother Tongue', s.mother_tongue)}
${row('Birth Place', s.birth_place)}
${row('Identification Mark', s.identification_mark)}
${row('RTE Status', s.rte_status ? 'Yes' : 'No')}
${sectionHeader('Identity Documents (पहचान दस्तावेज़)', '🆔')}
${row('Aadhar No (आधार नं.)', s.aadhar_no)}
${row('Scholar No (विद्यार्थी क्रमांक)', s.scholar_no)}
${row('PEN Number', s.pen_number)}
${row('SSSMID', s.sssmid)}
${row('Samagra Family ID', s.samagra_family_id)}
${row('Jan Aadhar No', s.jan_aadhar_no)}
${sectionHeader('Family Information (पारिवारिक जानकारी)', '👨‍👩‍👦')}
${row('Father Name (पिता का नाम)', s.father_name)}
${row('Father Occupation', s.father_occupation)}
${row('Father Qualification', s.father_qualification)}
${row('Mother Name (माता का नाम)', s.mother_name)}
${row('Mother Occupation', s.mother_occupation)}
${row('Mother Qualification', s.mother_qualification)}
${row('Guardian Name', s.guardian_name)}
${row('Guardian Relation', s.guardian_relation)}
${row('Guardian Mobile', s.guardian_mobile)}
${row('Guardian Occupation', s.guardian_occupation)}
${row('Annual Income', s.annual_income)}
${sectionHeader('Contact Information (संपर्क जानकारी)', '📞')}
${row('Mobile (मोबाइल)', s.mobile)}
${row('Parent Phone', s.parent_phone)}
${row('Email', s.email)}
${row('Address (पता)', s.address)}
${row('Emergency Contact', s.emergency_contact)}
${row('Emergency Contact Name', s.emergency_contact_name)}
${sectionHeader('Bank Details - Scholarship (बैंक विवरण)', '🏦')}
${row('Bank Name', s.bank_name)}
${row('Account No', s.bank_account_no)}
${row('IFSC Code', s.ifsc_code)}
${row('Branch', s.bank_branch)}
${sectionHeader('Transport (परिवहन)', '🚌')}
${row('Transport Mode', s.transport_mode)}
${row('Bus Route', s.bus_route)}
${row('Bus Stop', s.bus_stop)}
${row('Pickup Point', s.pickup_point)}
${sectionHeader('Medical (चिकित्सा)', '🏥')}
${row('Medical Conditions', s.medical_conditions)}
${row('Allergies', s.allergies)}
${sectionHeader('Previous Education (पूर्व शिक्षा)', '🎓')}
${row('Previous School', s.previous_school)}
${row('Previous Class', s.previous_class)}
${row('Previous Percentage', s.previous_percentage)}
${row('TC Number', s.tc_number)}
</table>
<div style="text-align:center;margin-top:30px;color:#94a3b8;font-size:11px;">
Generated on ${new Date().toLocaleDateString('en-IN')} | Schooltino ERP
</div>
</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
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
      scholar_no: student.scholar_no || '',
      pen_number: student.pen_number || '',
      sssmid: student.sssmid || '',
      samagra_family_id: student.samagra_family_id || '',
      jan_aadhar_no: student.jan_aadhar_no || '',
      caste: student.caste || '',
      sub_caste: student.sub_caste || '',
      religion: student.religion || '',
      category: student.category || '',
      nationality: student.nationality || 'Indian',
      mother_tongue: student.mother_tongue || '',
      birth_place: student.birth_place || '',
      identification_mark: student.identification_mark || '',
      rte_status: student.rte_status || false,
      father_occupation: student.father_occupation || '',
      father_qualification: student.father_qualification || '',
      mother_occupation: student.mother_occupation || '',
      mother_qualification: student.mother_qualification || '',
      guardian_name: student.guardian_name || '',
      guardian_relation: student.guardian_relation || '',
      guardian_mobile: student.guardian_mobile || '',
      guardian_occupation: student.guardian_occupation || '',
      annual_income: student.annual_income || '',
      emergency_contact: student.emergency_contact || '',
      emergency_contact_name: student.emergency_contact_name || '',
      bank_name: student.bank_name || '',
      bank_account_no: student.bank_account_no || '',
      ifsc_code: student.ifsc_code || '',
      bank_branch: student.bank_branch || '',
      transport_mode: student.transport_mode || '',
      bus_route: student.bus_route || '',
      bus_stop: student.bus_stop || '',
      pickup_point: student.pickup_point || '',
      is_hosteler: student.is_hosteler || false,
      hostel_room_no: student.hostel_room_no || '',
      medical_conditions: student.medical_conditions || '',
      allergies: student.allergies || '',
      previous_school: student.previous_school || '',
      previous_class: student.previous_class || '',
      previous_percentage: student.previous_percentage || '',
      tc_number: student.tc_number || '',
      admission_date: student.admission_date || new Date().toISOString().split('T')[0]
    });
    setActiveFormTab('basic');
    setIsDialogOpen(true);
  };

  const openSuspendDialog = (student) => {
    setSelectedStudent(student);
    setIsSuspendDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setActiveFormTab('basic');
    setFormData({
      name: '',
      class_id: '',
      dob: '',
      gender: 'male',
      blood_group: '',
      admission_date: new Date().toISOString().split('T')[0],
      aadhar_no: '',
      scholar_no: '',
      pen_number: '',
      sssmid: '',
      samagra_family_id: '',
      jan_aadhar_no: '',
      caste: '',
      sub_caste: '',
      religion: '',
      category: '',
      nationality: 'Indian',
      mother_tongue: '',
      birth_place: '',
      identification_mark: '',
      rte_status: false,
      father_name: '',
      father_occupation: '',
      father_qualification: '',
      mother_name: '',
      mother_occupation: '',
      mother_qualification: '',
      guardian_name: '',
      guardian_relation: '',
      guardian_mobile: '',
      guardian_occupation: '',
      annual_income: '',
      mobile: '',
      parent_phone: '',
      email: '',
      address: '',
      emergency_contact: '',
      emergency_contact_name: '',
      bank_name: '',
      bank_account_no: '',
      ifsc_code: '',
      bank_branch: '',
      transport_mode: '',
      bus_route: '',
      bus_stop: '',
      pickup_point: '',
      is_hosteler: false,
      hostel_room_no: '',
      medical_conditions: '',
      allergies: '',
      previous_school: '',
      previous_class: '',
      previous_percentage: '',
      tc_number: ''
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
        <div className="flex gap-2 flex-wrap">
          {/* Bulk Import Button */}
          <BulkImport 
            type="student" 
            schoolId={schoolId} 
            onImportComplete={fetchStudents}
          />
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
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingStudent ? 'Edit Student' : '📝 New Student Admission Form'}</DialogTitle>
              <DialogDescription>
                {!editingStudent && 'Student ID और Password automatically generate होंगे। सभी * fields भरना जरूरी है।'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Form Tabs Navigation - Merged tabs for less scrolling */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 overflow-x-auto">
              {[
                { id: 'basic', label: '📋 Basic' },
                { id: 'identity', label: '🆔 ID & Docs' },
                { id: 'family', label: '👨‍👩‍👦 Family & Contact' },
                { id: 'bank', label: '🏦 Bank' },
                { id: 'other', label: '🚌 Transport & Medical' },
                { id: 'documents', label: '📄 Documents' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    activeFormTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tab 1: Basic Info */}
              {activeFormTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">📋 Basic Information (मूल जानकारी)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('student_name')} *</Label>
                      <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Student Full Name" data-testid="student-name-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('class_section')} *</Label>
                      <select name="class_id" value={formData.class_id} onChange={handleChange} required className="w-full h-10 rounded-lg border border-slate-200 px-3" data-testid="class-select">
                        <option value="">{t('select_class')}</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}{cls.section && cls.section !== 'A' ? ` - ${cls.section}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('gender')} *</Label>
                      <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full h-10 rounded-lg border border-slate-200 px-3" data-testid="gender-select">
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                        <option value="other">{t('other')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('dob')} *</Label>
                      <Input name="dob" type="date" value={formData.dob} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} data-testid="dob-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Admission Date *</Label>
                      <Input name="admission_date" type="date" value={formData.admission_date} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} data-testid="admission-date-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('blood_group')}</Label>
                      <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Birth Place (जन्म स्थान)</Label>
                      <Input name="birth_place" value={formData.birth_place} onChange={handleChange} placeholder="City/Village" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Identification Mark (पहचान चिन्ह)</Label>
                      <Input name="identification_mark" value={formData.identification_mark} onChange={handleChange} placeholder="Mole on right cheek, etc." />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Identity Documents */}
              {activeFormTab === 'identity' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">🆔 Identity Documents (पहचान दस्तावेज़)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Scholar No. / Enrollment No.</Label>
                      <Input name="scholar_no" value={formData.scholar_no} onChange={handleChange} placeholder="If existing student" />
                    </div>
                    <div className="space-y-2">
                      <Label>PEN Number (CBSE)</Label>
                      <Input name="pen_number" value={formData.pen_number} onChange={handleChange} placeholder="Permanent Education Number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Aadhar Number</Label>
                      <Input name="aadhar_no" value={formData.aadhar_no} onChange={handleChange} placeholder="12 digit Aadhar" data-testid="aadhar-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>SSSMID / Samagra ID (MP)</Label>
                      <Input name="sssmid" value={formData.sssmid} onChange={handleChange} placeholder="समग्र ID" data-testid="samgra-id-input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Samagra Family ID (MP)</Label>
                      <Input name="samagra_family_id" value={formData.samagra_family_id} onChange={handleChange} placeholder="समग्र परिवार ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Jan Aadhar / Bhamashah (RJ)</Label>
                      <Input name="jan_aadhar_no" value={formData.jan_aadhar_no} onChange={handleChange} placeholder="जन आधार" />
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-slate-700 mb-3">📂 Category Information (श्रेणी)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Caste (जाति)</Label>
                        <select name="caste" value={formData.caste} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select Caste</option>
                          <option value="General">General (सामान्य)</option>
                          <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                          <option value="SC">SC (अनुसूचित जाति)</option>
                          <option value="ST">ST (अनुसूचित जनजाति)</option>
                          <option value="EWS">EWS (आर्थिक कमजोर)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sub-Caste (उप जाति)</Label>
                        <Input name="sub_caste" value={formData.sub_caste} onChange={handleChange} placeholder="Sub-caste" />
                      </div>
                      <div className="space-y-2">
                        <Label>Religion (धर्म)</Label>
                        <select name="religion" value={formData.religion} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select Religion</option>
                          <option value="Hindu">Hindu (हिन्दू)</option>
                          <option value="Muslim">Muslim (मुस्लिम)</option>
                          <option value="Christian">Christian (ईसाई)</option>
                          <option value="Sikh">Sikh (सिख)</option>
                          <option value="Buddhist">Buddhist (बौद्ध)</option>
                          <option value="Jain">Jain (जैन)</option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category (वर्ग)</Label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="APL">APL (गरीबी रेखा से ऊपर)</option>
                          <option value="BPL">BPL (गरीबी रेखा से नीचे)</option>
                          <option value="EWS">EWS (आर्थिक कमजोर)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mother Tongue (मातृभाषा)</Label>
                        <select name="mother_tongue" value={formData.mother_tongue} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Hindi">Hindi (हिन्दी)</option>
                          <option value="English">English (अंग्रेजी)</option>
                          <option value="Marathi">Marathi (मराठी)</option>
                          <option value="Gujarati">Gujarati (गुजराती)</option>
                          <option value="Punjabi">Punjabi (पंजाबी)</option>
                          <option value="Bengali">Bengali (बंगाली)</option>
                          <option value="Urdu">Urdu (उर्दू)</option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality (राष्ट्रीयता)</Label>
                        <Input name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Indian" />
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <input type="checkbox" id="rte_status" name="rte_status" checked={formData.rte_status} onChange={(e) => setFormData({...formData, rte_status: e.target.checked})} className="w-4 h-4" />
                        <Label htmlFor="rte_status">RTE Admission (शिक्षा का अधिकार)</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Family Info */}
              {activeFormTab === 'family' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">👨‍👩‍👦 Family Information (परिवार जानकारी)</h3>
                  
                  {/* Father's Info */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">👨 Father Details (पिता की जानकारी)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('father_name')} *</Label>
                        <Input name="father_name" value={formData.father_name} onChange={handleChange} required placeholder="Father Full Name" data-testid="father-name-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Occupation (व्यवसाय)</Label>
                        <select name="father_occupation" value={formData.father_occupation} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Government Job">Government Job (सरकारी नौकरी)</option>
                          <option value="Private Job">Private Job (प्राइवेट नौकरी)</option>
                          <option value="Business">Business (व्यापार)</option>
                          <option value="Farmer">Farmer (किसान)</option>
                          <option value="Daily Wage">Daily Wage (दैनिक मजदूर)</option>
                          <option value="Self Employed">Self Employed (स्वरोजगार)</option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Qualification (शिक्षा)</Label>
                        <select name="father_qualification" value={formData.father_qualification} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Below 10th">Below 10th</option>
                          <option value="10th Pass">10th Pass</option>
                          <option value="12th Pass">12th Pass</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Post Graduate">Post Graduate</option>
                          <option value="Professional">Professional Degree</option>
                          <option value="Illiterate">Illiterate (अशिक्षित)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mother's Info */}
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <h4 className="font-medium text-pink-800 mb-3">👩 Mother Details (माता की जानकारी)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('mother_name')} *</Label>
                        <Input name="mother_name" value={formData.mother_name} onChange={handleChange} required placeholder="Mother Full Name" data-testid="mother-name-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Occupation (व्यवसाय)</Label>
                        <select name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Housewife">Housewife (गृहिणी)</option>
                          <option value="Government Job">Government Job</option>
                          <option value="Private Job">Private Job</option>
                          <option value="Business">Business</option>
                          <option value="Teacher">Teacher (शिक्षक)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Qualification (शिक्षा)</Label>
                        <select name="mother_qualification" value={formData.mother_qualification} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Below 10th">Below 10th</option>
                          <option value="10th Pass">10th Pass</option>
                          <option value="12th Pass">12th Pass</option>
                          <option value="Graduate">Graduate</option>
                          <option value="Post Graduate">Post Graduate</option>
                          <option value="Illiterate">Illiterate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Info */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-3">🧓 Guardian Details (if different from parents)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Guardian Name</Label>
                        <Input name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Guardian's Full Name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Relation (रिश्ता)</Label>
                        <select name="guardian_relation" value={formData.guardian_relation} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                          <option value="">Select</option>
                          <option value="Grandfather">Grandfather (दादा/नाना)</option>
                          <option value="Grandmother">Grandmother (दादी/नानी)</option>
                          <option value="Uncle">Uncle (चाचा/मामा)</option>
                          <option value="Aunt">Aunt (चाची/मामी)</option>
                          <option value="Brother">Brother (भाई)</option>
                          <option value="Sister">Sister (बहन)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Guardian Mobile</Label>
                        <Input name="guardian_mobile" value={formData.guardian_mobile} onChange={handleChange} placeholder="10 digit mobile" />
                      </div>
                      <div className="space-y-2">
                        <Label>Guardian Occupation</Label>
                        <Input name="guardian_occupation" value={formData.guardian_occupation} onChange={handleChange} placeholder="व्यवसाय" />
                      </div>
                    </div>
                  </div>

                  {/* Annual Income */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Annual Family Income (वार्षिक आय)</Label>
                      <select name="annual_income" value={formData.annual_income} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                        <option value="">Select</option>
                        <option value="Below 1 Lakh">Below ₹1 Lakh</option>
                        <option value="1-2.5 Lakh">₹1 - 2.5 Lakh</option>
                        <option value="2.5-5 Lakh">₹2.5 - 5 Lakh</option>
                        <option value="5-10 Lakh">₹5 - 10 Lakh</option>
                        <option value="Above 10 Lakh">Above ₹10 Lakh</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Info Section - Merged */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-4">
                    <h4 className="font-medium text-green-800 mb-3">📞 Contact Information (संपर्क जानकारी)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Mobile * (for login)</Label>
                        <Input name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="Parent's mobile for OTP" data-testid="mobile-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Phone (ID Card)</Label>
                        <Input name="parent_phone" value={formData.parent_phone} onChange={handleChange} placeholder="Alternate number" data-testid="parent-phone-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Optional" />
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-3">
                        <Label>{t('address')} *</Label>
                        <Input name="address" value={formData.address} onChange={handleChange} required placeholder="Full Address" data-testid="address-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Name</Label>
                        <Input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Emergency person name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Emergency Contact Number</Label>
                        <Input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Emergency mobile" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Bank Details */}
              {activeFormTab === 'bank' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">🏦 Bank Details (छात्रवृत्ति के लिए)</h3>
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">💡 Scholarship और government benefits के लिए bank details जरूरी हैं</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="State Bank of India" />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input name="bank_account_no" value={formData.bank_account_no} onChange={handleChange} placeholder="Account Number" />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} placeholder="SBIN0001234" />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Name</Label>
                      <Input name="bank_branch" value={formData.bank_branch} onChange={handleChange} placeholder="Branch Name" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Transport, Medical & Education - Merged */}
              {activeFormTab === 'other' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Transport Section */}
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="font-medium text-teal-800 mb-3">🚌 Transport Details (परिवहन)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label>Transport Mode</Label>
                        <select name="transport_mode" value={formData.transport_mode} onChange={handleChange} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm">
                          <option value="">Select</option>
                          <option value="School Bus">School Bus</option>
                          <option value="Private Vehicle">Private Vehicle</option>
                          <option value="Walking">Walking</option>
                          <option value="Bicycle">Bicycle</option>
                          <option value="Auto/Rickshaw">Auto/Rickshaw</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Bus Route</Label>
                        <Input name="bus_route" value={formData.bus_route} onChange={handleChange} placeholder="Route No." className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bus Stop</Label>
                        <Input name="bus_stop" value={formData.bus_stop} onChange={handleChange} placeholder="Stop Name" className="h-10" />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id="is_hosteler" name="is_hosteler" checked={formData.is_hosteler} onChange={(e) => setFormData({...formData, is_hosteler: e.target.checked})} className="w-4 h-4" />
                        <Label htmlFor="is_hosteler">Hostel Student</Label>
                      </div>
                    </div>
                  </div>

                  {/* Medical Section */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3">🏥 Medical Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Medical Conditions (बीमारियाँ)</Label>
                        <Input name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} placeholder="Asthma, Diabetes, etc." />
                      </div>
                      <div className="space-y-2">
                        <Label>Allergies (एलर्जी)</Label>
                        <Input name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Food/medicine allergies" />
                      </div>
                    </div>
                  </div>

                  {/* Previous Education Section */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3">📚 Previous Education (पूर्व शिक्षा)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2 col-span-2">
                        <Label>Previous School</Label>
                        <Input name="previous_school" value={formData.previous_school} onChange={handleChange} placeholder="School name" data-testid="prev-school-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Previous Class</Label>
                        <Input name="previous_class" value={formData.previous_class} onChange={handleChange} placeholder="Last class" />
                      </div>
                      <div className="space-y-2">
                        <Label>TC Number</Label>
                        <Input name="tc_number" value={formData.tc_number} onChange={handleChange} placeholder="TC/LC No." />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Documents Upload */}
              {activeFormTab === 'documents' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">📄 Documents Upload (दस्तावेज़ अपलोड)</h3>
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    💡 Scholarship और government benefits के लिए documents जरूरी हैं। Admission के बाद भी upload कर सकते हैं।
                  </p>
                  
                  {editingStudent ? (
                    <DocumentUpload 
                      personId={editingStudent.id}
                      personType="student"
                      schoolId={schoolId}
                      existingDocuments={[]}
                    />
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">📁</div>
                      <h4 className="font-medium text-blue-800 mb-2">Documents बाद में Upload करें</h4>
                      <p className="text-sm text-blue-600">
                        Student admission complete होने के बाद Edit करके documents upload कर सकते हैं।
                      </p>
                    </div>
                  )}
                  
                  {/* Document Checklist */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-slate-700 mb-3">📋 Required Documents Checklist:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { icon: '📄', name: 'Birth Certificate (जन्म प्रमाण पत्र)' },
                        { icon: '🆔', name: 'Aadhar Card (आधार कार्ड)' },
                        { icon: '📋', name: 'Transfer Certificate (TC)' },
                        { icon: '📊', name: 'Previous Marksheet' },
                        { icon: '📜', name: 'Caste Certificate (जाति प्रमाण पत्र)' },
                        { icon: '💰', name: 'Income Certificate (आय प्रमाण पत्र)' },
                        { icon: '🏠', name: 'Domicile Certificate' },
                        { icon: '📷', name: 'Passport Photo' },
                        { icon: '👨', name: 'Father Aadhar (पिता का आधार)' },
                        { icon: '👩', name: 'Mother Aadhar (माता का आधार)' },
                        { icon: '🎫', name: 'BPL Card (यदि लागू हो)' },
                        { icon: '🏦', name: 'Bank Passbook (छात्रवृत्ति के लिए)' },
                      ].map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded">
                          <span>{doc.icon}</span>
                          <span className="text-slate-600">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Capture Section - Only for new admission */}
              {!editingStudent && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Student Photo (AI Attendance के लिए) - Optional
                  </Label>
                  
                  {!capturedPhoto && !showCamera && (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 h-20"
                        onClick={startCamera}
                        data-testid="open-camera-btn"
                      >
                        <div className="flex flex-col items-center">
                          <Camera className="w-6 h-6 mb-1" />
                          <span>📷 Camera से Capture</span>
                        </div>
                      </Button>
                      <label className="flex-1">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-20 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
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
                          className="bg-white text-blue-600 hover:bg-blue-50"
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

      {/* Split View Layout */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        {/* Left Panel - Student List (~40% width) */}
        <div className="w-2/5 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                data-testid="search-input"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
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

          <Tabs defaultValue="active" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-3 mt-2 shrink-0">
              <TabsTrigger value="active" className="text-xs gap-1">
                <User className="w-3.5 h-3.5" />
                Active ({students.length})
              </TabsTrigger>
              <TabsTrigger value="suspended" className="text-xs gap-1">
                <Ban className="w-3.5 h-3.5" />
                Suspended ({suspendedStudents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="flex-1 overflow-y-auto p-2 mt-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('no_data')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSplitViewStudent(student)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all group ${
                        splitViewStudent?.id === student.id
                          ? 'bg-blue-50 border-2 border-blue-400 shadow-sm'
                          : 'border-2 border-transparent hover:bg-slate-50 hover:border-blue-200'
                      }`}
                      data-testid={`student-row-${student.id}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {student.class_name}{student.section && student.section !== 'A' ? ` - ${student.section}` : ''} {student.father_name ? `| ${student.father_name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          student.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          student.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openStudentProfile(student)}>
                              <Eye className="w-4 h-4 mr-2 text-blue-600" />
                              View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIdCardStudent(student); setShowIDCard(true); }}>
                              <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                              View ID Card
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => viewCredentials(student)}>
                              <Key className="w-4 h-4 mr-2 text-purple-600" />
                              Share Login Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setNewStudentCredentials({ student_id: student.student_id || student.id, name: student.name }); setShowFaceEnrollment(true); }}>
                              <Camera className="w-4 h-4 mr-2 text-emerald-600" />
                              Face Enrollment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openSuspendDialog(student)}>
                              <Ban className="w-4 h-4 mr-2 text-amber-500" />
                              Suspend
                            </DropdownMenuItem>
                            {['director', 'principal'].includes(user?.role) && (
                              <DropdownMenuItem onClick={() => handleMarkLeft(student.id)} className="text-rose-600">
                                <LogOut className="w-4 h-4 mr-2" />
                                Mark as Left (TC)
                              </DropdownMenuItem>
                            )}
                            {(user?.role === 'director' || user?.role === 'admin') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog(student)} className="text-red-600 bg-red-50 hover:bg-red-100">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suspended" className="flex-1 overflow-y-auto p-2 mt-0">
              {suspendedStudents.length === 0 ? (
                <div className="text-center py-10">
                  <Ban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No suspended students</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {suspendedStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSplitViewStudent(student)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all group ${
                        splitViewStudent?.id === student.id
                          ? 'bg-amber-50 border-2 border-amber-400 shadow-sm'
                          : 'border-2 border-transparent hover:bg-amber-50/50 hover:border-amber-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-amber-600 truncate">
                          {student.class_name} | {suspendReasons[student.suspension_reason] || student.suspension_reason || 'Suspended'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">suspended</span>
                        {['director', 'principal'].includes(user?.role) && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleUnsuspend(student.id); }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Unsuspend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Student Profile (~60% width) */}
        <div className="w-3/5 bg-white rounded-xl border border-gray-100 shadow-sm overflow-y-auto">
          {!splitViewStudent ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">Select a student to view profile</p>
              <p className="text-sm mt-1 text-slate-400">Click on any student from the left panel</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Profile Header with Dual Photos */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start gap-6">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-xl bg-white border-3 border-blue-300 shadow-lg flex items-center justify-center overflow-hidden">
                        {splitViewStudent.photo_url ? (
                          <img src={splitViewStudent.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-slate-300" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">Profile Photo</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-xl bg-white border-3 border-emerald-300 shadow-lg flex items-center justify-center overflow-hidden">
                        {splitViewStudent.face_photo_url ? (
                          <img src={splitViewStudent.face_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Camera className="w-8 h-8 text-slate-300" />
                            <span className="text-xs text-slate-300 mt-1">No AI Photo</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">AI Attendance</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{splitViewStudent.name}</h2>
                    <p className="text-slate-500 mt-1">
                      {splitViewStudent.student_id || splitViewStudent.admission_no} | {splitViewStudent.class_name}{splitViewStudent.section ? ` - ${splitViewStudent.section}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        splitViewStudent.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        splitViewStudent.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {splitViewStudent.status?.toUpperCase()}
                      </span>
                      {splitViewStudent.blood_group && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 font-medium">{splitViewStudent.blood_group}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => printStudentProfile(splitViewStudent)}>
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => handleEdit(splitViewStudent)}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-blue-600" onClick={() => { setIdCardStudent(splitViewStudent); setShowIDCard(true); }}>
                        <CreditCard className="w-3.5 h-3.5" /> ID Card
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-purple-600" onClick={() => viewCredentials(splitViewStudent)}>
                        <Key className="w-3.5 h-3.5" /> Credentials
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-emerald-600" onClick={() => { setNewStudentCredentials({ student_id: splitViewStudent.student_id || splitViewStudent.id, name: splitViewStudent.name }); setShowFaceEnrollment(true); }}>
                        <Camera className="w-3.5 h-3.5" /> Face Enroll
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Personal Info */}
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Information
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    ['Name', splitViewStudent.name],
                    ['Student ID', splitViewStudent.student_id || splitViewStudent.admission_no],
                    ['Class', splitViewStudent.class_name],
                    ['Section', splitViewStudent.section || 'A'],
                    ['Gender', splitViewStudent.gender],
                    ['DOB', splitViewStudent.dob],
                    ['Blood Group', splitViewStudent.blood_group],
                    ['Admission Date', splitViewStudent.admission_date],
                    ['Category', splitViewStudent.category],
                    ['Caste', splitViewStudent.caste],
                    ['Sub Caste', splitViewStudent.sub_caste],
                    ['Religion', splitViewStudent.religion],
                    ['Nationality', splitViewStudent.nationality],
                    ['Mother Tongue', splitViewStudent.mother_tongue],
                    ['Birth Place', splitViewStudent.birth_place],
                    ['Identification Mark', splitViewStudent.identification_mark],
                    ['RTE Status', splitViewStudent.rte_status ? 'Yes' : 'No'],
                    ['Aadhar No', splitViewStudent.aadhar_no],
                    ['Scholar No', splitViewStudent.scholar_no],
                    ['PEN Number', splitViewStudent.pen_number],
                    ['SSSMID', splitViewStudent.sssmid],
                    ['Samagra Family ID', splitViewStudent.samagra_family_id],
                    ['Jan Aadhar No', splitViewStudent.jan_aadhar_no],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Family & Contact */}
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> Family & Contact
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    ['Father Name', splitViewStudent.father_name],
                    ['Father Occupation', splitViewStudent.father_occupation],
                    ['Father Qualification', splitViewStudent.father_qualification],
                    ['Mother Name', splitViewStudent.mother_name],
                    ['Mother Occupation', splitViewStudent.mother_occupation],
                    ['Mother Qualification', splitViewStudent.mother_qualification],
                    ['Guardian Name', splitViewStudent.guardian_name],
                    ['Guardian Relation', splitViewStudent.guardian_relation],
                    ['Guardian Mobile', splitViewStudent.guardian_mobile],
                    ['Guardian Occupation', splitViewStudent.guardian_occupation],
                    ['Annual Income', splitViewStudent.annual_income],
                    ['Mobile', splitViewStudent.mobile],
                    ['Parent Phone', splitViewStudent.parent_phone],
                    ['Email', splitViewStudent.email],
                    ['Address', splitViewStudent.address],
                    ['Emergency Contact', splitViewStudent.emergency_contact],
                    ['Emergency Name', splitViewStudent.emergency_contact_name],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Bank Details */}
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Bank Details (Scholarship)
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    ['Bank Name', splitViewStudent.bank_name],
                    ['Account No', splitViewStudent.bank_account_no],
                    ['IFSC Code', splitViewStudent.ifsc_code],
                    ['Branch', splitViewStudent.bank_branch],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![splitViewStudent.bank_name, splitViewStudent.bank_account_no].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No bank details recorded</div>
                )}
              </div>

              {/* Section: Transport & Medical */}
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm flex items-center gap-2">
                  <Bus className="w-4 h-4" /> Transport & Medical
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    ['Transport Mode', splitViewStudent.transport_mode],
                    ['Bus Route', splitViewStudent.bus_route],
                    ['Bus Stop', splitViewStudent.bus_stop],
                    ['Pickup Point', splitViewStudent.pickup_point],
                    ['Medical Conditions', splitViewStudent.medical_conditions],
                    ['Allergies', splitViewStudent.allergies],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![splitViewStudent.transport_mode, splitViewStudent.bus_route, splitViewStudent.medical_conditions, splitViewStudent.allergies].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No transport or medical details recorded</div>
                )}
              </div>

              {/* Section: Previous Education */}
              <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-semibold text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Previous Education
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    ['Previous School', splitViewStudent.previous_school],
                    ['Previous Class', splitViewStudent.previous_class],
                    ['Previous Percentage', splitViewStudent.previous_percentage],
                    ['TC Number', splitViewStudent.tc_number],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![splitViewStudent.previous_school, splitViewStudent.previous_class, splitViewStudent.tc_number].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No previous education details recorded</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Student Full Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-6 h-6 text-blue-600" />
              Student Profile (विद्यार्थी प्रोफ़ाइल)
            </DialogTitle>
          </DialogHeader>
          
          {profileStudent && (
            <div className="space-y-4">
              {/* Photo & Basic Header */}
              <div className="text-center bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex justify-center mb-3">
                  <div className="w-28 h-28 rounded-xl bg-white border-4 border-blue-300 shadow-lg flex items-center justify-center overflow-hidden">
                    {profileStudent.photo_url ? (
                      <img src={profileStudent.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-slate-300" />
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{profileStudent.name}</h2>
                <p className="text-slate-500 mt-1">
                  {profileStudent.student_id || profileStudent.admission_no} | {profileStudent.class_name}{profileStudent.section ? ` - ${profileStudent.section}` : ''}
                </p>
                <span className={`inline-block mt-2 badge ${getStatusBadge(profileStudent.status)}`}>
                  {profileStudent.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap justify-center">
                <Button size="sm" className="gap-2" onClick={() => printStudentProfile(profileStudent)}>
                  <Printer className="w-4 h-4" /> Print Profile
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setShowProfileModal(false); handleEdit(profileStudent); }}>
                  <Edit className="w-4 h-4" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="gap-2 text-blue-600" onClick={() => { setShowProfileModal(false); setIdCardStudent(profileStudent); setShowIDCard(true); }}>
                  <CreditCard className="w-4 h-4" /> ID Card
                </Button>
              </div>

              {/* Section: Basic Info */}
              <div className="rounded-xl border border-blue-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  📋 Basic Information (मूल जानकारी)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Name (नाम)', profileStudent.name],
                    ['Student ID', profileStudent.student_id || profileStudent.admission_no],
                    ['Class (कक्षा)', profileStudent.class_name],
                    ['Section', profileStudent.section || 'A'],
                    ['Gender (लिंग)', profileStudent.gender],
                    ['DOB (जन्म तिथि)', profileStudent.dob],
                    ['Blood Group (रक्त समूह)', profileStudent.blood_group],
                    ['Admission Date (प्रवेश तिथि)', profileStudent.admission_date],
                    ['Category (श्रेणी)', profileStudent.category],
                    ['Caste (जाति)', profileStudent.caste],
                    ['Sub Caste', profileStudent.sub_caste],
                    ['Religion (धर्म)', profileStudent.religion],
                    ['Nationality', profileStudent.nationality],
                    ['Mother Tongue', profileStudent.mother_tongue],
                    ['Birth Place', profileStudent.birth_place],
                    ['Identification Mark', profileStudent.identification_mark],
                    ['RTE Status', profileStudent.rte_status ? 'Yes' : 'No'],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Identity Docs */}
              <div className="rounded-xl border border-amber-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  🆔 Identity Documents (पहचान दस्तावेज़)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Aadhar No (आधार नं.)', profileStudent.aadhar_no],
                    ['Scholar No (विद्यार्थी क्रमांक)', profileStudent.scholar_no],
                    ['PEN Number', profileStudent.pen_number],
                    ['SSSMID', profileStudent.sssmid],
                    ['Samagra Family ID', profileStudent.samagra_family_id],
                    ['Jan Aadhar No', profileStudent.jan_aadhar_no],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![profileStudent.aadhar_no, profileStudent.scholar_no, profileStudent.pen_number, profileStudent.sssmid].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No identity documents recorded</div>
                )}
              </div>

              {/* Section: Family Info */}
              <div className="rounded-xl border border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  👨‍👩‍👦 Family Information (पारिवारिक जानकारी)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Father Name (पिता)', profileStudent.father_name],
                    ['Father Occupation', profileStudent.father_occupation],
                    ['Father Qualification', profileStudent.father_qualification],
                    ['Mother Name (माता)', profileStudent.mother_name],
                    ['Mother Occupation', profileStudent.mother_occupation],
                    ['Mother Qualification', profileStudent.mother_qualification],
                    ['Guardian Name', profileStudent.guardian_name],
                    ['Guardian Relation', profileStudent.guardian_relation],
                    ['Guardian Mobile', profileStudent.guardian_mobile],
                    ['Guardian Occupation', profileStudent.guardian_occupation],
                    ['Annual Income', profileStudent.annual_income],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Contact */}
              <div className="rounded-xl border border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  📞 Contact Information (संपर्क जानकारी)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Mobile (मोबाइल)', profileStudent.mobile],
                    ['Parent Phone', profileStudent.parent_phone],
                    ['Email', profileStudent.email],
                    ['Address (पता)', profileStudent.address],
                    ['Emergency Contact', profileStudent.emergency_contact],
                    ['Emergency Contact Name', profileStudent.emergency_contact_name],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Bank */}
              <div className="rounded-xl border border-teal-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  🏦 Bank Details - Scholarship (बैंक विवरण)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Bank Name', profileStudent.bank_name],
                    ['Account No', profileStudent.bank_account_no],
                    ['IFSC Code', profileStudent.ifsc_code],
                    ['Branch', profileStudent.bank_branch],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![profileStudent.bank_name, profileStudent.bank_account_no].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No bank details recorded</div>
                )}
              </div>

              {/* Section: Transport */}
              <div className="rounded-xl border border-orange-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  🚌 Transport (परिवहन)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Transport Mode', profileStudent.transport_mode],
                    ['Bus Route', profileStudent.bus_route],
                    ['Bus Stop', profileStudent.bus_stop],
                    ['Pickup Point', profileStudent.pickup_point],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![profileStudent.transport_mode, profileStudent.bus_route].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No transport details recorded</div>
                )}
              </div>

              {/* Section: Medical */}
              <div className="rounded-xl border border-red-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  🏥 Medical Information (चिकित्सा)
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-200">
                  {[
                    ['Medical Conditions', profileStudent.medical_conditions],
                    ['Allergies', profileStudent.allergies],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![profileStudent.medical_conditions, profileStudent.allergies].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No medical information recorded</div>
                )}
              </div>

              {/* Section: Previous Education */}
              <div className="rounded-xl border border-indigo-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  🎓 Previous Education (पूर्व शिक्षा)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200">
                  {[
                    ['Previous School', profileStudent.previous_school],
                    ['Previous Class', profileStudent.previous_class],
                    ['Previous Percentage', profileStudent.previous_percentage],
                    ['TC Number', profileStudent.tc_number],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={i} className="bg-white p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-sm text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
                {![profileStudent.previous_school, profileStudent.previous_class, profileStudent.tc_number].some(Boolean) && (
                  <div className="bg-white p-3 text-center text-sm text-slate-400">No previous education details recorded</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Credentials Sharing Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              📱 StudyTino Login Details
            </DialogTitle>
          </DialogHeader>
          
          {credentialsStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <p className="font-bold text-lg">{credentialsStudent.name}</p>
                <p className="text-sm text-slate-600">
                  Class: {credentialsStudent.class_name || 'N/A'} | Father: {credentialsStudent.father_name}
                </p>
              </div>
              
              {/* Credentials Box */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Student ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-purple-300">
                      {credentialsStudent.student_id}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 w-7 p-0 text-white hover:bg-slate-700"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsStudent.student_id);
                        toast.success('ID copied!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-green-300">
                      {credentialsStudent.default_password}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 w-7 p-0 text-white hover:bg-slate-700"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialsStudent.default_password);
                        toast.success('Password copied!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* App Link */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 mb-1">App Link:</p>
                <p className="font-mono text-sm text-blue-800">{window.location.origin}/studytino</p>
              </div>
              
              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => shareViaWhatsApp(credentialsStudent)}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Share
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyCredentials(credentialsStudent)}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
              </div>
              
              {/* Note */}
              <div className="text-xs text-slate-500 text-center bg-amber-50 rounded-lg p-2">
                💡 Parent को ये details share करें। First login पर password change करना होगा।
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
