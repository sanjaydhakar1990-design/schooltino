import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Wallet, Plus, Search, Edit, Trash2, Loader2, FileText, Users, 
  IndianRupee, Receipt, AlertCircle, Check, Clock, Calendar,
  Download, Printer, Filter, ChevronDown, ChevronRight, 
  GraduationCap, CreditCard, Building2, History, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const FEE_TYPES = [
  { id: 'admission_fee', name: 'Admission Fee', name_hi: 'प्रवेश शुल्क', frequency: 'one_time' },
  { id: 'tuition_fee', name: 'Tuition Fee', name_hi: 'ट्यूशन फीस', frequency: 'monthly' },
  { id: 'exam_fee', name: 'Exam Fee', name_hi: 'परीक्षा शुल्क', frequency: 'term' },
  { id: 'development_fee', name: 'Development Fee', name_hi: 'विकास शुल्क', frequency: 'annual' },
  { id: 'sports_fee', name: 'Sports Fee', name_hi: 'खेल शुल्क', frequency: 'annual' },
  { id: 'computer_fee', name: 'Computer Fee', name_hi: 'कंप्यूटर शुल्क', frequency: 'monthly' },
  { id: 'lab_fee', name: 'Lab Fee', name_hi: 'लैब शुल्क', frequency: 'annual' },
  { id: 'library_fee', name: 'Library Fee', name_hi: 'पुस्तकालय शुल्क', frequency: 'annual' },
  { id: 'transport_fee', name: 'Transport Fee', name_hi: 'परिवहन शुल्क', frequency: 'monthly' },
  { id: 'hostel_fee', name: 'Hostel Fee', name_hi: 'छात्रावास शुल्क', frequency: 'monthly' },
  { id: 'activity_fee', name: 'Activity Fee', name_hi: 'गतिविधि शुल्क', frequency: 'annual' },
  { id: 'uniform_fee', name: 'Uniform Fee', name_hi: 'यूनिफॉर्म शुल्क', frequency: 'one_time' },
  { id: 'late_fee', name: 'Late Fee', name_hi: 'विलंब शुल्क', frequency: 'penalty' },
  { id: 'other_fee', name: 'Other Fee', name_hi: 'अन्य शुल्क', frequency: 'custom' }
];

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const MONTHLY_FEE_IDS = ['tuition_fee', 'transport_fee', 'computer_fee', 'hostel_fee'];

function getDefaultAcademicYear() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function generateAcademicYearOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  return [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`
  ];
}

export default function FeeManagementPage() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  const { isHindi } = useLanguage();
  const { getAccentColor } = useTheme();
  const accent = getAccentColor();
  
  const [activeTab, setActiveTab] = useState('structure');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getDefaultAcademicYear());
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeCollections, setFeeCollections] = useState([]);
  const [oldDues, setOldDues] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showOldDueDialog, setShowOldDueDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [onlinePayments, setOnlinePayments] = useState([]);
  const [viewScreenshot, setViewScreenshot] = useState(null);
  
  const [structureForm, setStructureForm] = useState({
    class_id: '',
    academic_year: getDefaultAcademicYear(),
    tuition_frequency: 'monthly',
    fees: FEE_TYPES.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {})
  });
  
  const [collectionForm, setCollectionForm] = useState({
    student_id: '',
    amount: 0,
    fee_types: [],
    months: [],
    fee_items: [],
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_no: '',
    remarks: '',
    academic_year: getDefaultAcademicYear()
  });

  const [collectionFeeSelections, setCollectionFeeSelections] = useState({});
  const [collectionMonthSelections, setCollectionMonthSelections] = useState({});

  const [oldDueForm, setOldDueForm] = useState({
    student_id: '',
    academic_year: '',
    class_name: '',
    amount: 0,
    description: '',
    send_notification: true
  });
  
  const [scholarships, setScholarships] = useState([]);
  const [studentScholarships, setStudentScholarships] = useState([]);
  const [showScholarshipDialog, setShowScholarshipDialog] = useState(false);
  const [showAssignScholarshipDialog, setShowAssignScholarshipDialog] = useState(false);
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '',
    name_hi: '',
    type: 'central_govt',
    amount: 0,
    percentage: 0,
    eligibility: '',
    documents_required: '',
    academic_year: getDefaultAcademicYear()
  });
  const [assignForm, setAssignForm] = useState({
    student_id: '',
    scholarship_id: '',
    amount: 0,
    status: 'pending',
    remarks: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId, selectedAcademicYear]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classRes, feeRes, collectionRes, duesRes, schemeRes, studentSchemeRes, onlineRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/fee-structures?school_id=${schoolId}&academic_year=${selectedAcademicYear}`, { headers }),
        axios.get(`${API}/fee-collections?school_id=${schoolId}&academic_year=${selectedAcademicYear}`, { headers }),
        axios.get(`${API}/old-dues?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/scholarships?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/student-scholarships?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/pending-payments?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setClasses(classRes.data);
      setFeeStructures(feeRes.data);
      setFeeCollections(collectionRes.data);
      setOldDues(duesRes.data || []);
      setScholarships(schemeRes.data || []);
      setStudentScholarships(studentSchemeRes.data || []);
      setOnlinePayments(Array.isArray(onlineRes.data) ? onlineRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId = '') => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/students?school_id=${schoolId}&status=active`;
      if (classId) url += `&class_id=${classId}`;
      if (search) url += `&search=${search}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      toast.error(isHindi ? 'छात्र डेटा लोड करने में समस्या' : 'Failed to fetch students');
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchStudents(selectedClass);
    }
  }, [schoolId, selectedClass, search, activeTab]);

  const isMonthlyFee = (feeId, structure) => {
    if (MONTHLY_FEE_IDS.includes(feeId)) {
      if (feeId === 'tuition_fee' && structure?.tuition_frequency === 'yearly') {
        return false;
      }
      return true;
    }
    return false;
  };

  const calculateAnnualFee = (structure) => {
    if (!structure || !structure.fees) return 0;
    const fees = structure.fees;
    const freq = structure.tuition_frequency || 'monthly';
    let total = 0;
    
    Object.entries(fees).forEach(([key, val]) => {
      const amount = Number(val) || 0;
      if (amount <= 0) return;
      
      if (MONTHLY_FEE_IDS.includes(key)) {
        if (key === 'tuition_fee' && freq === 'yearly') {
          total += amount;
        } else {
          total += amount * 12;
        }
      } else {
        total += amount;
      }
    });
    
    return total;
  };

  const handleVerifyPayment = async (paymentId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/verify-payment/${paymentId}`, 
        { action, remarks: '' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      toast.success(action === 'approve' ? 'Payment approved!' : 'Payment rejected');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to verify payment');
    }
  };

  const handleSaveStructure = async () => {
    if (!structureForm.class_id) {
      toast.error(isHindi ? 'कृपया class select करें' : 'Please select a class');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/fee-structures`, {
        ...structureForm,
        school_id: schoolId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Fee structure saved!');
      setShowStructureDialog(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'सेव करने में समस्या' : 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const openCollectionDialog = (student) => {
    setSelectedStudent(student);
    const structure = getClassFeeStructure(student.class_id);
    const feeSelections = {};
    const monthSelections = {};

    if (structure && structure.fees) {
      FEE_TYPES.forEach(ft => {
        const amt = Number(structure.fees[ft.id]) || 0;
        if (amt > 0) {
          feeSelections[ft.id] = { selected: false, amount: amt };
          if (isMonthlyFee(ft.id, structure)) {
            monthSelections[ft.id] = [];
          }
        }
      });
    }

    setCollectionFeeSelections(feeSelections);
    setCollectionMonthSelections(monthSelections);
    setCollectionForm({
      student_id: student.id,
      amount: 0,
      fee_types: [],
      months: [],
      fee_items: [],
      payment_mode: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      receipt_no: '',
      remarks: '',
      academic_year: selectedAcademicYear
    });
    setShowCollectionDialog(true);
  };

  const calculateCollectionTotal = () => {
    let total = 0;
    const items = [];

    Object.entries(collectionFeeSelections).forEach(([feeId, data]) => {
      if (!data.selected) return;
      const amt = Number(data.amount) || 0;

      if (collectionMonthSelections[feeId] !== undefined) {
        const months = collectionMonthSelections[feeId] || [];
        if (months.length > 0) {
          total += amt * months.length;
          items.push({ fee_type: feeId, amount: amt, months: [...months] });
        }
      } else {
        total += amt;
        items.push({ fee_type: feeId, amount: amt });
      }
    });

    return { total, items };
  };

  const handleCollectFee = async () => {
    const { total, items } = calculateCollectionTotal();

    if (!collectionForm.student_id || total <= 0) {
      toast.error(isHindi ? 'कृपया student और fee items select करें' : 'Please select student and fee items');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/fee-collections`, {
        ...collectionForm,
        amount: total,
        fee_items: items,
        academic_year: selectedAcademicYear,
        school_id: schoolId,
        collected_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Fee collected! Receipt No: ${response.data.receipt_no}`);
      setShowCollectionDialog(false);
      setSelectedStudent(null);
      setCollectionFeeSelections({});
      setCollectionMonthSelections({});
      setCollectionForm({
        student_id: '',
        amount: 0,
        fee_types: [],
        months: [],
        fee_items: [],
        payment_mode: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        receipt_no: '',
        remarks: '',
        academic_year: selectedAcademicYear
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'फीस जमा करने में समस्या' : 'Failed to collect fee'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddOldDue = async () => {
    if (!oldDueForm.student_id || oldDueForm.amount <= 0) {
      toast.error(isHindi ? 'कृपया student और amount भरें' : 'Please fill student and amount');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/old-dues`, {
        ...oldDueForm,
        school_id: schoolId,
        added_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Old due added successfully!');
      setShowOldDueDialog(false);
      setOldDueForm({
        student_id: '',
        academic_year: '',
        class_name: '',
        amount: 0,
        description: '',
        send_notification: true
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'पुरानी बकाया जोड़ने में समस्या' : 'Failed to add old due'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScholarship = async () => {
    if (!scholarshipForm.name || scholarshipForm.amount <= 0) {
      toast.error(isHindi ? 'कृपया scheme name और amount भरें' : 'Please fill scheme name and amount');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/scholarships`, {
        ...scholarshipForm,
        school_id: schoolId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Scheme saved successfully!');
      setShowScholarshipDialog(false);
      setScholarshipForm({
        name: '',
        name_hi: '',
        type: 'central_govt',
        amount: 0,
        percentage: 0,
        eligibility: '',
        documents_required: '',
        academic_year: getDefaultAcademicYear()
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'योजना सेव करने में समस्या' : 'Failed to save scheme'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignScholarship = async () => {
    if (!assignForm.student_id || !assignForm.scholarship_id) {
      toast.error(isHindi ? 'कृपया student और scheme select करें' : 'Please select student and scheme');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/student-scholarships`, {
        ...assignForm,
        school_id: schoolId,
        assigned_by: user?.id,
        assigned_date: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Scholarship assigned to student!');
      setShowAssignScholarshipDialog(false);
      setAssignForm({
        student_id: '',
        scholarship_id: '',
        amount: 0,
        status: 'pending',
        remarks: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'छात्रवृत्ति असाइन करने में समस्या' : 'Failed to assign scholarship'));
    } finally {
      setSaving(false);
    }
  };

  const getScholarshipName = (id) => {
    const scheme = scholarships.find(s => s.id === id);
    return scheme?.name || 'Unknown';
  };

  const getStudentScholarshipSummary = (studentId) => {
    return studentScholarships.filter(s => s.student_id === studentId);
  };

  const getClassFeeStructure = (classId) => {
    return feeStructures.find(f => f.class_id === classId);
  };

  const getStudentFeeSummary = (studentId) => {
    const studentCollections = feeCollections.filter(c => c.student_id === studentId);
    const studentDues = oldDues.filter(d => d.student_id === studentId);
    
    const totalPaid = studentCollections.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalOldDue = studentDues.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    return { totalPaid, totalOldDue, collections: studentCollections, dues: studentDues };
  };

  const handlePrintReceipt = (collection) => {
    const printWindow = window.open('', '_blank');
    const student = students.find(s => s.id === collection.student_id);
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Fee Receipt - ${collection.receipt_no}</title>
        <style>
          body { font-family: Arial; padding: 20px; max-width: 400px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .receipt-no { font-size: 18px; font-weight: bold; }
          .details { margin: 15px 0; }
          .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
          .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FEE RECEIPT</h2>
          <div class="receipt-no">${collection.receipt_no}</div>
        </div>
        <div class="details">
          <div class="row"><span>Student Name:</span><span>${student?.name || 'N/A'}</span></div>
          <div class="row"><span>Student ID:</span><span>${student?.student_id || 'N/A'}</span></div>
          <div class="row"><span>Class:</span><span>${student?.class_name || 'N/A'}</span></div>
          <div class="row"><span>Date:</span><span>${new Date(collection.payment_date).toLocaleDateString('en-IN')}</span></div>
          <div class="row"><span>Payment Mode:</span><span>${collection.payment_mode?.toUpperCase()}</span></div>
        </div>
        <div class="amount">\u20B9 ${collection.amount?.toLocaleString('en-IN')}</div>
        <div class="footer">
          <p>Thank you for your payment</p>
          <p>This is a computer generated receipt</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getClassSummary = () => {
    return classes.map(cls => {
      const structure = getClassFeeStructure(cls.id);
      const classStudents = students.filter(s => s.class_id === cls.id);
      const totalFee = calculateAnnualFee(structure);
      const collections = feeCollections.filter(c => classStudents.some(s => s.id === c.student_id));
      const totalCollected = collections.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        ...cls,
        totalFee,
        totalCollected,
        studentCount: classStudents.length,
        expectedTotal: totalFee * classStudents.length,
        pendingTotal: (totalFee * classStudents.length) - totalCollected
      };
    });
  };

  const { total: collectionTotal, items: collectionItems } = calculateCollectionTotal();

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{t('select')} {t('schools')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fee-management-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-600" />
            {t('fee_management')}
          </h1>
          <p className="text-slate-500 mt-1">{t('fee_structure')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="text-sm font-medium border-0 outline-none bg-transparent"
              data-testid="academic-year-selector"
            >
              {generateAcademicYearOptions().map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowOldDueDialog(true)}
            className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            data-testid="add-old-due-btn"
          >
            <History className="w-4 h-4" />
            {t('pending')}
          </Button>
          <Button
            onClick={() => setShowCollectionDialog(true)}
            className="gap-2 text-white font-medium"
            style={{ backgroundColor: accent }}
            data-testid="collect-fee-btn"
          >
            <IndianRupee className="w-4 h-4" />
            {t('collect_fee')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <IndianRupee className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('total_collected')}</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{feeCollections.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('pending')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{oldDues.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('receipt_no')}</p>
                <p className="text-2xl font-bold text-blue-600">{feeCollections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('fee_structure')}</p>
                <p className="text-2xl font-bold text-purple-600">{feeStructures.length}/{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="structure" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">{t('fee_structure')}</span>
            <span className="md:hidden">{t('fee_structure')}</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <CreditCard className="w-4 h-4" />
            <span className="hidden md:inline">{t('total_fee')}</span>
            <span className="md:hidden">{t('total_fee')}</span>
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden md:inline">{t('discount')}</span>
            <span className="md:hidden">{t('discount')}</span>
          </TabsTrigger>
          <TabsTrigger value="old_dues" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <History className="w-4 h-4" />
            <span className="hidden md:inline">{t('pending')}</span>
            <span className="md:hidden">{t('pending')}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <FileText className="w-4 h-4" />
            {t('reports')}
          </TabsTrigger>
          <TabsTrigger value="online_payments" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm relative">
            <Receipt className="w-4 h-4" />
            <span className="hidden md:inline">Online</span>
            <span className="md:hidden">Online</span>
            {onlinePayments.filter(p => p.status === 'pending_verification').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {onlinePayments.filter(p => p.status === 'pending_verification').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{`${t('fee_structure')} (${selectedAcademicYear})`}</CardTitle>
                <CardDescription>{t('fee_structure')}</CardDescription>
              </div>
              <Button onClick={() => {
                setStructureForm({
                  class_id: '',
                  academic_year: selectedAcademicYear,
                  tuition_frequency: 'monthly',
                  fees: FEE_TYPES.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {})
                });
                setShowStructureDialog(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('fee_structure')}
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('select_class')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('fee_type')}</TableHead>
                      <TableHead>{t('total_fee')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map(cls => {
                      const structure = getClassFeeStructure(cls.id);
                      const fees = structure?.fees || {};
                      const freq = structure?.tuition_frequency || 'monthly';
                      const totalAnnual = calculateAnnualFee(structure);
                      
                      const activeFees = FEE_TYPES.filter(ft => (Number(fees[ft.id]) || 0) > 0);
                      
                      return (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell className="text-sm text-slate-500">{structure?.academic_year || '-'}</TableCell>
                          <TableCell>
                            {activeFees.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activeFees.map(ft => {
                                  const amt = Number(fees[ft.id]) || 0;
                                  let label = `₹${amt.toLocaleString('en-IN')}`;
                                  if (ft.id === 'tuition_fee') {
                                    label = freq === 'yearly' ? `₹${amt.toLocaleString('en-IN')}/year` : `₹${amt.toLocaleString('en-IN')}/month`;
                                  } else if (MONTHLY_FEE_IDS.includes(ft.id)) {
                                    label = `₹${amt.toLocaleString('en-IN')}/month`;
                                  }
                                  return (
                                    <span key={ft.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                      {ft.name}: {label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">{t('not_available')}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            ₹{totalAnnual.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setStructureForm({
                                  class_id: cls.id,
                                  academic_year: structure?.academic_year || selectedAcademicYear,
                                  tuition_frequency: structure?.tuition_frequency || 'monthly',
                                  fees: structure?.fees || FEE_TYPES.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {})
                                });
                                setShowStructureDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>{`${t('total_fee')} (${selectedAcademicYear})`}</CardTitle>
                  <CardDescription>{t('collect_fee')}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">{t('select_class')}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t('search')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 w-60"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map(student => {
                    const summary = getStudentFeeSummary(student.id);
                    const structure = getClassFeeStructure(student.class_id);
                    const totalFee = calculateAnnualFee(structure);
                    const pendingAmount = totalFee - summary.totalPaid + summary.totalOldDue;
                    const isExpanded = expandedStudent === student.id;
                    
                    return (
                      <div key={student.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                          onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                        >
                          <div className="flex items-center gap-4">
                            <button className="text-slate-400">
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-slate-500">{student.student_id} • {student.class_name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-slate-500">{t('total_fee')}</p>
                              <p className="font-semibold">₹{totalFee.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">{t('paid')}</p>
                              <p className="font-semibold text-emerald-600">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
                            </div>
                            {summary.totalOldDue > 0 && (
                              <div className="text-right">
                                <p className="text-sm text-slate-500">{t('pending')}</p>
                                <p className="font-semibold text-orange-600">₹{summary.totalOldDue.toLocaleString('en-IN')}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-sm text-slate-500">{t('pending')}</p>
                              <p className={`font-semibold ${pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ₹{pendingAmount.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCollectionDialog(student);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {t('collect_fee')}
                            </Button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {t('fee_type')}
                                </h4>
                                {structure ? (
                                  <div className="space-y-2">
                                    {FEE_TYPES.filter(f => (Number(structure.fees?.[f.id]) || 0) > 0).map(feeType => {
                                      const amt = Number(structure.fees[feeType.id]) || 0;
                                      let display = `₹${amt.toLocaleString('en-IN')}`;
                                      if (isMonthlyFee(feeType.id, structure)) {
                                        display = `₹${amt.toLocaleString('en-IN')}/month`;
                                      }
                                      return (
                                        <div key={feeType.id} className="flex justify-between text-sm">
                                          <span>{feeType.name}</span>
                                          <span>{display}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">{t('fee_structure')}</p>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <Receipt className="w-4 h-4" />
                                  {t('payment_date')}
                                </h4>
                                {summary.collections.length > 0 ? (
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {summary.collections.slice(0, 5).map(c => (
                                      <div key={c.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                        <div>
                                          <p className="font-medium">₹{c.amount?.toLocaleString('en-IN')}</p>
                                          <p className="text-xs text-slate-500">{new Date(c.payment_date).toLocaleDateString('en-IN')}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handlePrintReceipt(c)}>
                                          <Printer className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">{t('paid')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {students.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t('student')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scholarships" className="mt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    {t('discount')}
                  </CardTitle>
                  <CardDescription>{t('discount')}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowAssignScholarshipDialog(true)} 
                    variant="outline"
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    {t('student')}
                  </Button>
                  <Button 
                    onClick={() => setShowScholarshipDialog(true)} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    {t('discount')}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {scholarships.length > 0 ? scholarships.map((scheme) => (
                <Card key={scheme.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        scheme.type === 'central_govt' ? 'bg-blue-100 text-blue-700' :
                        scheme.type === 'state_govt' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {scheme.type === 'central_govt' ? t('category') : 
                         scheme.type === 'state_govt' ? t('state') : t('other')}
                      </span>
                      <span className="text-emerald-600 font-bold">₹{(scheme.amount || 0).toLocaleString()}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{scheme.name}</CardTitle>
                    {scheme.name_hi && <p className="text-sm text-slate-500">{scheme.name_hi}</p>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {scheme.eligibility && (
                      <p className="text-xs text-slate-600 mb-2">
                        <strong>{t('required')}:</strong> {scheme.eligibility}
                      </p>
                    )}
                    {scheme.documents_required && (
                      <p className="text-xs text-slate-500">
                        <strong>{t('documents')}:</strong> {scheme.documents_required}
                      </p>
                    )}
                    <div className="mt-3 pt-2 border-t flex justify-between items-center">
                      <span className="text-xs text-slate-400">{scheme.academic_year}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setAssignForm({...assignForm, scholarship_id: scheme.id, amount: scheme.amount});
                          setShowAssignScholarshipDialog(true);
                        }}
                      >
                        {t('save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('discount')}</p>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {`${t('student')} (${studentScholarships.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentScholarships.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('student')}</TableHead>
                        <TableHead>{t('discount')}</TableHead>
                        <TableHead>{t('amount')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('remarks')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentScholarships.map((ss, idx) => {
                        const student = students.find(s => s.id === ss.student_id);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student?.name || ss.student_id}</p>
                                <p className="text-xs text-slate-500">{student?.class_name}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getScholarshipName(ss.scholarship_id)}</TableCell>
                            <TableCell className="font-medium text-emerald-600">₹{(ss.amount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                ss.status === 'received' ? 'bg-green-100 text-green-700' :
                                ss.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                ss.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {ss.status === 'received' ? t('completed') :
                                 ss.status === 'approved' ? t('approved') :
                                 ss.status === 'rejected' ? t('rejected') : t('pending')}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">{ss.remarks || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('discount')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="old_dues" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-600" />
                  {t('pending')}
                </CardTitle>
                <CardDescription>{t('pending')}</CardDescription>
              </div>
              <Button onClick={() => setShowOldDueDialog(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4" />
                {t('pending')}
              </Button>
            </CardHeader>
            <CardContent>
              {oldDues.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('student')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('select_class')}</TableHead>
                      <TableHead>{t('amount')}</TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oldDues.map(due => {
                      const student = students.find(s => s.id === due.student_id);
                      return (
                        <TableRow key={due.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student?.name || due.student_name}</p>
                              <p className="text-xs text-slate-500">{student?.student_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{due.academic_year}</TableCell>
                          <TableCell>{due.class_name}</TableCell>
                          <TableCell className="font-semibold text-orange-600">
                            ₹{due.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-sm">{due.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              due.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {due.status === 'paid' ? t('paid') : t('pending')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (student) {
                                  openCollectionDialog(student);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {t('collect_fee')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <Check className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p>{t('pending')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{`${t('fee_reports')} (${selectedAcademicYear})`}</CardTitle>
              <CardDescription>{t('class_wise')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('select_class')}</TableHead>
                    <TableHead>{t('student')}</TableHead>
                    <TableHead>{t('total_fee')}</TableHead>
                    <TableHead>{t('total')}</TableHead>
                    <TableHead>{t('total_collected')}</TableHead>
                    <TableHead>{t('pending')}</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getClassSummary().map(cls => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.studentCount}</TableCell>
                      <TableCell>₹{cls.totalFee.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{cls.expectedTotal.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-emerald-600 font-semibold">
                        ₹{cls.totalCollected.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        ₹{cls.pendingTotal.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${cls.expectedTotal ? (cls.totalCollected / cls.expectedTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {cls.expectedTotal ? Math.round((cls.totalCollected / cls.expectedTotal) * 100) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online_payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Online Payment Verification
              </CardTitle>
              <CardDescription>Verify UPI/QR payments submitted by students with screenshots</CardDescription>
            </CardHeader>
            <CardContent>
              {onlinePayments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No online payments pending</p>
                  <p className="text-sm mt-1">Students' UPI/QR payments will appear here for verification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {onlinePayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{payment.student_name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              payment.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-700' :
                              payment.status === 'verified' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payment.status === 'pending_verification' ? 'Pending' : payment.status === 'verified' ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{payment.class_name}</p>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div><span className="text-gray-400">Amount:</span> <span className="font-semibold text-green-600">₹{payment.amount?.toLocaleString('en-IN')}</span></div>
                            <div><span className="text-gray-400">Mode:</span> <span className="font-medium text-gray-700">{payment.payment_mode?.toUpperCase()}</span></div>
                            <div><span className="text-gray-400">Txn ID:</span> <span className="font-medium text-gray-700">{payment.transaction_id}</span></div>
                            <div><span className="text-gray-400">Date:</span> <span className="text-gray-600">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                          </div>
                          {payment.remarks && <p className="text-xs text-gray-400 mt-1">{payment.remarks}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {payment.screenshot_url && (
                            <Button variant="outline" size="sm" onClick={() => setViewScreenshot(payment.screenshot_url)} className="text-xs gap-1">
                              <FileText className="w-3 h-3" /> Screenshot
                            </Button>
                          )}
                          {payment.status === 'pending_verification' && (
                            <>
                              <Button size="sm" onClick={() => handleVerifyPayment(payment.id, 'approve')} className="bg-green-500 hover:bg-green-600 text-white text-xs gap-1">
                                <Check className="w-3 h-3" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleVerifyPayment(payment.id, 'reject')} className="text-red-500 border-red-200 hover:bg-red-50 text-xs gap-1">
                                <AlertCircle className="w-3 h-3" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewScreenshot} onOpenChange={() => setViewScreenshot(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
          {viewScreenshot && <img src={viewScreenshot} alt="Payment Screenshot" className="w-full rounded-lg border border-gray-200" />}
        </DialogContent>
      </Dialog>

      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('fee_structure')}</DialogTitle>
            <DialogDescription>{t('fee_type')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('select_class')} *</Label>
                <select
                  value={structureForm.class_id}
                  onChange={(e) => setStructureForm(prev => ({ ...prev, class_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">{t('select_class')}</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <select
                  value={structureForm.academic_year}
                  onChange={(e) => setStructureForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {generateAcademicYearOptions().map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <Label className="text-sm font-medium">{t('fee_type')}</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tuition_frequency"
                    value="monthly"
                    checked={structureForm.tuition_frequency === 'monthly'}
                    onChange={() => setStructureForm(prev => ({ ...prev, tuition_frequency: 'monthly' }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{t('monthly_fee')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tuition_frequency"
                    value="yearly"
                    checked={structureForm.tuition_frequency === 'yearly'}
                    onChange={() => setStructureForm(prev => ({ ...prev, tuition_frequency: 'yearly' }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{t('annual_fee')}</span>
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">{t('fee_type')}</h4>
              <div className="grid grid-cols-2 gap-4">
                {FEE_TYPES.map(feeType => (
                  <div key={feeType.id} className="space-y-1">
                    <Label className="text-sm">
                      {`${feeType.name} (${feeType.name_hi})`}
                      {MONTHLY_FEE_IDS.includes(feeType.id) && (
                        <span className="text-xs text-slate-400 ml-1">
                          {feeType.id === 'tuition_fee' 
                            ? (structureForm.tuition_frequency === 'yearly' ? `(${t('annual_fee')})` : `(${t('monthly_fee')})`)
                            : `(${t('monthly_fee')})`}
                        </span>
                      )}
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">₹</span>
                      <Input
                        type="number"
                        value={structureForm.fees[feeType.id] || ''}
                        onChange={(e) => setStructureForm(prev => ({
                          ...prev,
                          fees: { ...prev.fees, [feeType.id]: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowStructureDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveStructure} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCollectionDialog} onOpenChange={(open) => {
        if (!open) {
          setSelectedStudent(null);
          setCollectionFeeSelections({});
          setCollectionMonthSelections({});
        }
        setShowCollectionDialog(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('collect_fee')}</DialogTitle>
            <DialogDescription>
              {selectedStudent ? `${selectedStudent.name} - ${selectedStudent.class_name}` : t('student')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {!selectedStudent && (
              <div className="space-y-2">
                <Label>{t('student')} *</Label>
                <select
                  value={collectionForm.student_id}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value);
                    if (student) {
                      openCollectionDialog(student);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">{t('student')}</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
                  ))}
                </select>
              </div>
            )}

            {selectedStudent && Object.keys(collectionFeeSelections).length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{t('fee_type')}</h4>
                <div className="space-y-3">
                  {Object.entries(collectionFeeSelections).map(([feeId, data]) => {
                    const feeType = FEE_TYPES.find(f => f.id === feeId);
                    if (!feeType) return null;
                    const isMonthly = collectionMonthSelections[feeId] !== undefined;

                    return (
                      <div key={feeId} className="border rounded p-3 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={data.selected}
                            onChange={(e) => {
                              setCollectionFeeSelections(prev => ({
                                ...prev,
                                [feeId]: { ...prev[feeId], selected: e.target.checked }
                              }));
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{`${feeType.name} (${feeType.name_hi})`}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-slate-500">₹</span>
                            <Input
                              type="number"
                              value={data.amount}
                              onChange={(e) => {
                                setCollectionFeeSelections(prev => ({
                                  ...prev,
                                  [feeId]: { ...prev[feeId], amount: parseInt(e.target.value) || 0 }
                                }));
                              }}
                              className="w-24 h-8 text-sm"
                            />
                            {isMonthly && <span className="text-xs text-slate-400">/{t('monthly_fee')}</span>}
                          </div>
                        </div>
                        
                        {isMonthly && data.selected && (
                          <div className="mt-2 ml-7">
                            <p className="text-xs text-slate-500 mb-1">{t('monthly_fee')}:</p>
                            <div className="flex flex-wrap gap-1">
                              {MONTHS.map(month => {
                                const isSelected = (collectionMonthSelections[feeId] || []).includes(month);
                                return (
                                  <button
                                    key={month}
                                    type="button"
                                    onClick={() => {
                                      setCollectionMonthSelections(prev => {
                                        const current = prev[feeId] || [];
                                        const updated = isSelected
                                          ? current.filter(m => m !== month)
                                          : [...current, month];
                                        return { ...prev, [feeId]: updated };
                                      });
                                    }}
                                    className={`px-2 py-1 text-xs rounded border ${
                                      isSelected 
                                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {month}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedStudent && Object.keys(collectionFeeSelections).length === 0 && (
              <div className="text-center py-6 text-slate-500 border rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('fee_structure')}</p>
              </div>
            )}

            {collectionItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-emerald-50">
                <h4 className="font-medium mb-2 text-emerald-800">{t('description')}</h4>
                <div className="space-y-1">
                  {collectionItems.map((item, idx) => {
                    const ft = FEE_TYPES.find(f => f.id === item.fee_type);
                    return (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {ft?.name || item.fee_type}
                          {item.months && item.months.length > 0 && (
                            <span className="text-xs text-slate-500 ml-1">
                              ({item.months.length} months: {item.months.join(', ')})
                            </span>
                          )}
                        </span>
                        <span className="font-medium">
                          ₹{(item.months ? item.amount * item.months.length : item.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-emerald-700">
                    <span>{t('total')}</span>
                    <span>₹{collectionTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('payment_mode')}</Label>
                <select
                  value={collectionForm.payment_mode}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="cash">{t('cash')}</option>
                  <option value="upi">{t('upi')}</option>
                  <option value="card">{t('online')}</option>
                  <option value="bank_transfer">{t('bank_transfer')}</option>
                  <option value="cheque">{t('cheque')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={collectionForm.payment_date}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('remarks')}</Label>
              <Input
                value={collectionForm.remarks}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder={t('remarks')}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowCollectionDialog(false);
                setSelectedStudent(null);
                setCollectionFeeSelections({});
                setCollectionMonthSelections({});
              }}>{t('cancel')}</Button>
              <Button 
                onClick={handleCollectFee} 
                disabled={saving || collectionTotal <= 0} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {t('collect_fee')} ₹{collectionTotal.toLocaleString('en-IN')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOldDueDialog} onOpenChange={setShowOldDueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-orange-600" />
              {t('pending')}
            </DialogTitle>
            <DialogDescription>{t('pending')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('student')} *</Label>
              <select
                value={oldDueForm.student_id}
                onChange={(e) => setOldDueForm(prev => ({ ...prev, student_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">{t('student')}</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('date')} *</Label>
                <select
                  value={oldDueForm.academic_year}
                  onChange={(e) => setOldDueForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">{t('date')}</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i - 1;
                    return <option key={year} value={`${year}-${year + 1}`}>{year}-{year + 1}</option>;
                  })}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('select_class')}</Label>
                <Input
                  value={oldDueForm.class_name}
                  onChange={(e) => setOldDueForm(prev => ({ ...prev, class_name: e.target.value }))}
                  placeholder="e.g., Class 5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('amount')} *</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">₹</span>
                <Input
                  type="number"
                  value={oldDueForm.amount}
                  onChange={(e) => setOldDueForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="text-xl font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Input
                value={oldDueForm.description}
                onChange={(e) => setOldDueForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('description')}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendNotification"
                checked={oldDueForm.send_notification}
                onChange={(e) => setOldDueForm(prev => ({ ...prev, send_notification: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="sendNotification" className="flex items-center gap-2 cursor-pointer">
                <Bell className="w-4 h-4" />
                {t('send')} {t('notifications')}
              </Label>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOldDueDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleAddOldDue} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScholarshipDialog} onOpenChange={setShowScholarshipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              {t('discount')}
            </DialogTitle>
            <DialogDescription>{t('discount')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('name')} *</Label>
                <Input
                  value={scholarshipForm.name}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pre Matric Scholarship"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('name')} (Hindi)</Label>
                <Input
                  value={scholarshipForm.name_hi}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, name_hi: e.target.value }))}
                  placeholder="e.g., प्री-मैट्रिक छात्रवृत्ति"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('type')} *</Label>
                <select
                  value={scholarshipForm.type}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="central_govt">{t('category')}</option>
                  <option value="state_govt">{t('state')}</option>
                  <option value="private">{t('other')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <select
                  value={scholarshipForm.academic_year}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {generateAcademicYearOptions().map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('amount')} (₹) *</Label>
                <Input
                  type="number"
                  value={scholarshipForm.amount}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('percentage')}</Label>
                <Input
                  type="number"
                  value={scholarshipForm.percentage}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, percentage: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  max={100}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('required')}</Label>
              <Input
                value={scholarshipForm.eligibility}
                onChange={(e) => setScholarshipForm(prev => ({ ...prev, eligibility: e.target.value }))}
                placeholder="e.g., BPL Family, Income < 2.5 Lakh, SC/ST/OBC"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('documents')}</Label>
              <Input
                value={scholarshipForm.documents_required}
                onChange={(e) => setScholarshipForm(prev => ({ ...prev, documents_required: e.target.value }))}
                placeholder="e.g., Aadhar, Income Certificate, Caste Certificate"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowScholarshipDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveScholarship} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignScholarshipDialog} onOpenChange={setShowAssignScholarshipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {t('discount')}
            </DialogTitle>
            <DialogDescription>{t('student')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('student')} *</Label>
              <select
                value={assignForm.student_id}
                onChange={(e) => setAssignForm(prev => ({ ...prev, student_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- {t('student')} --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.class_name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('discount')} *</Label>
              <select
                value={assignForm.scholarship_id}
                onChange={(e) => {
                  const scheme = scholarships.find(s => s.id === e.target.value);
                  setAssignForm(prev => ({ 
                    ...prev, 
                    scholarship_id: e.target.value,
                    amount: scheme?.amount || 0
                  }));
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- {t('discount')} --</option>
                {scholarships.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - ₹{(s.amount || 0).toLocaleString()}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('amount')} (₹)</Label>
              <Input
                type="number"
                value={assignForm.amount}
                onChange={(e) => setAssignForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('status')}</Label>
              <select
                value={assignForm.status}
                onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="pending">{t('pending')}</option>
                <option value="approved">{t('approved')}</option>
                <option value="received">{t('completed')}</option>
                <option value="rejected">{t('rejected')}</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('remarks')}</Label>
              <Input
                value={assignForm.remarks}
                onChange={(e) => setAssignForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder={t('remarks')}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAssignScholarshipDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleAssignScholarship} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}