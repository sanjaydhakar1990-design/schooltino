import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
      
      const [classRes, feeRes, collectionRes, duesRes, schemeRes, studentSchemeRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/fee-structures?school_id=${schoolId}&academic_year=${selectedAcademicYear}`, { headers }),
        axios.get(`${API}/fee-collections?school_id=${schoolId}&academic_year=${selectedAcademicYear}`, { headers }),
        axios.get(`${API}/old-dues?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/scholarships?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/student-scholarships?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setClasses(classRes.data);
      setFeeStructures(feeRes.data);
      setFeeCollections(collectionRes.data);
      setOldDues(duesRes.data || []);
      setScholarships(schemeRes.data || []);
      setStudentScholarships(studentSchemeRes.data || []);
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
      toast.error('Failed to fetch students');
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

  const handleSaveStructure = async () => {
    if (!structureForm.class_id) {
      toast.error('कृपया class select करें');
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
      toast.error(error.response?.data?.detail || 'Failed to save');
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
      toast.error('कृपया student और fee items select करें');
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
      toast.error(error.response?.data?.detail || 'Failed to collect fee');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOldDue = async () => {
    if (!oldDueForm.student_id || oldDueForm.amount <= 0) {
      toast.error('कृपया student और amount भरें');
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
      toast.error(error.response?.data?.detail || 'Failed to add old due');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScholarship = async () => {
    if (!scholarshipForm.name || scholarshipForm.amount <= 0) {
      toast.error('कृपया scheme name और amount भरें');
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
      toast.error(error.response?.data?.detail || 'Failed to save scheme');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignScholarship = async () => {
    if (!assignForm.student_id || !assignForm.scholarship_id) {
      toast.error('कृपया student और scheme select करें');
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
      toast.error(error.response?.data?.detail || 'Failed to assign scholarship');
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
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fee-management-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-600" />
            Fee Management
          </h1>
          <p className="text-slate-500 mt-1">Complete fee structure, collection & tracking</p>
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
            Add Old Due
          </Button>
          <Button
            onClick={() => setShowCollectionDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            data-testid="collect-fee-btn"
          >
            <IndianRupee className="w-4 h-4" />
            Collect Fee
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
                <p className="text-sm text-slate-500">Total Collected</p>
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
                <p className="text-sm text-slate-500">Old Dues</p>
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
                <p className="text-sm text-slate-500">Total Receipts</p>
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
                <p className="text-sm text-slate-500">Classes with Structure</p>
                <p className="text-2xl font-bold text-purple-600">{feeStructures.length}/{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="structure" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Fee Structure</span>
            <span className="md:hidden">Structure</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <CreditCard className="w-4 h-4" />
            <span className="hidden md:inline">Student Fees</span>
            <span className="md:hidden">Fees</span>
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden md:inline">Govt Schemes</span>
            <span className="md:hidden">Schemes</span>
          </TabsTrigger>
          <TabsTrigger value="old_dues" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Old Dues</span>
            <span className="md:hidden">Dues</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-white text-xs md:text-sm">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class-wise Fee Structure ({selectedAcademicYear})</CardTitle>
                <CardDescription>Set fees for each class</CardDescription>
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
                Add/Edit Structure
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
                      <TableHead>Class</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Fee Details</TableHead>
                      <TableHead>Total Annual</TableHead>
                      <TableHead>Actions</TableHead>
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
                                      {ft.name_hi}: {label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">Not set</span>
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
                  <CardTitle>Student Fee Status ({selectedAcademicYear})</CardTitle>
                  <CardDescription>View and collect fees for each student</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search student..."
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
                              <p className="text-sm text-slate-500">Total Fee</p>
                              <p className="font-semibold">₹{totalFee.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Paid</p>
                              <p className="font-semibold text-emerald-600">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
                            </div>
                            {summary.totalOldDue > 0 && (
                              <div className="text-right">
                                <p className="text-sm text-slate-500">Old Due</p>
                                <p className="font-semibold text-orange-600">₹{summary.totalOldDue.toLocaleString('en-IN')}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Pending</p>
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
                              Collect Fee
                            </Button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Fee Breakdown
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
                                          <span>{feeType.name_hi}</span>
                                          <span>{display}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">No fee structure set for this class</p>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <Receipt className="w-4 h-4" />
                                  Recent Payments
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
                                  <p className="text-sm text-slate-500">No payments yet</p>
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
                      <p>No students found</p>
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
                    Government Schemes & Scholarships
                  </CardTitle>
                  <CardDescription>Manage and assign govt schemes to students</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowAssignScholarshipDialog(true)} 
                    variant="outline"
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Assign to Student
                  </Button>
                  <Button 
                    onClick={() => setShowScholarshipDialog(true)} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Scheme
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
                        {scheme.type === 'central_govt' ? 'केंद्र सरकार' : 
                         scheme.type === 'state_govt' ? 'राज्य सरकार' : 'Private'}
                      </span>
                      <span className="text-emerald-600 font-bold">₹{(scheme.amount || 0).toLocaleString()}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{scheme.name}</CardTitle>
                    {scheme.name_hi && <p className="text-sm text-slate-500">{scheme.name_hi}</p>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {scheme.eligibility && (
                      <p className="text-xs text-slate-600 mb-2">
                        <strong>Eligibility:</strong> {scheme.eligibility}
                      </p>
                    )}
                    {scheme.documents_required && (
                      <p className="text-xs text-slate-500">
                        <strong>Documents:</strong> {scheme.documents_required}
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
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No schemes added yet. Click &quot;Add New Scheme&quot; to create one.</p>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Students with Scholarships ({studentScholarships.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentScholarships.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Scheme</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
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
                                {ss.status === 'received' ? 'प्राप्त' :
                                 ss.status === 'approved' ? 'स्वीकृत' :
                                 ss.status === 'rejected' ? 'अस्वीकृत' : 'Pending'}
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
                    <p>No scholarships assigned yet</p>
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
                  Old Fee Dues
                </CardTitle>
                <CardDescription>Track pending fees from previous years</CardDescription>
              </div>
              <Button onClick={() => setShowOldDueDialog(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4" />
                Add Old Due
              </Button>
            </CardHeader>
            <CardContent>
              {oldDues.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
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
                              {due.status || 'Pending'}
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
                              Collect
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
                  <p>No old dues found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Fee Summary ({selectedAcademicYear})</CardTitle>
              <CardDescription>Overview of fee collection by class</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Fee/Student</TableHead>
                    <TableHead>Expected Total</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Collection %</TableHead>
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
      </Tabs>

      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fee Structure Setup</DialogTitle>
            <DialogDescription>Set fee amounts for each fee type</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <select
                  value={structureForm.class_id}
                  onChange={(e) => setStructureForm(prev => ({ ...prev, class_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
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
              <Label className="text-sm font-medium">Tuition Fee Frequency (ट्यूशन फीस आवृत्ति)</Label>
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
                  <span className="text-sm">Monthly (मासिक)</span>
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
                  <span className="text-sm">Yearly (वार्षिक)</span>
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Fee Types (शुल्क प्रकार)</h4>
              <div className="grid grid-cols-2 gap-4">
                {FEE_TYPES.map(feeType => (
                  <div key={feeType.id} className="space-y-1">
                    <Label className="text-sm">
                      {feeType.name_hi} ({feeType.name})
                      {MONTHLY_FEE_IDS.includes(feeType.id) && (
                        <span className="text-xs text-slate-400 ml-1">
                          {feeType.id === 'tuition_fee' 
                            ? (structureForm.tuition_frequency === 'yearly' ? '(वार्षिक)' : '(मासिक)')
                            : '(मासिक)'}
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
              <Button variant="outline" onClick={() => setShowStructureDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveStructure} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Structure
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
            <DialogTitle>Collect Fee (फीस जमा करें)</DialogTitle>
            <DialogDescription>
              {selectedStudent ? `${selectedStudent.name} - ${selectedStudent.class_name}` : 'Select student'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {!selectedStudent && (
              <div className="space-y-2">
                <Label>Select Student *</Label>
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
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
                  ))}
                </select>
              </div>
            )}

            {selectedStudent && Object.keys(collectionFeeSelections).length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Fee Items (शुल्क मद)</h4>
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
                            <span className="text-sm font-medium">{feeType.name_hi} ({feeType.name})</span>
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
                            {isMonthly && <span className="text-xs text-slate-400">/month</span>}
                          </div>
                        </div>
                        
                        {isMonthly && data.selected && (
                          <div className="mt-2 ml-7">
                            <p className="text-xs text-slate-500 mb-1">Months (महीने):</p>
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
                <p className="text-sm">No fee structure found for this class</p>
              </div>
            )}

            {collectionItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-emerald-50">
                <h4 className="font-medium mb-2 text-emerald-800">Breakdown (विवरण)</h4>
                <div className="space-y-1">
                  {collectionItems.map((item, idx) => {
                    const ft = FEE_TYPES.find(f => f.id === item.fee_type);
                    return (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {ft?.name_hi || item.fee_type}
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
                    <span>Total (कुल)</span>
                    <span>₹{collectionTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <select
                  value={collectionForm.payment_mode}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={collectionForm.payment_date}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={collectionForm.remarks}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowCollectionDialog(false);
                setSelectedStudent(null);
                setCollectionFeeSelections({});
                setCollectionMonthSelections({});
              }}>Cancel</Button>
              <Button 
                onClick={handleCollectFee} 
                disabled={saving || collectionTotal <= 0} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Collect ₹{collectionTotal.toLocaleString('en-IN')}
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
              Add Old Due
            </DialogTitle>
            <DialogDescription>Add pending fee from previous year</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Student *</Label>
              <select
                value={oldDueForm.student_id}
                onChange={(e) => setOldDueForm(prev => ({ ...prev, student_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Previous Year *</Label>
                <select
                  value={oldDueForm.academic_year}
                  onChange={(e) => setOldDueForm(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i - 1;
                    return <option key={year} value={`${year}-${year + 1}`}>{year}-{year + 1}</option>;
                  })}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Previous Class</Label>
                <Input
                  value={oldDueForm.class_name}
                  onChange={(e) => setOldDueForm(prev => ({ ...prev, class_name: e.target.value }))}
                  placeholder="e.g., Class 5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Due Amount *</Label>
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
              <Label>Description</Label>
              <Input
                value={oldDueForm.description}
                onChange={(e) => setOldDueForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Pending tuition fee for March"
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
                Send notification to parent
              </Label>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOldDueDialog(false)}>Cancel</Button>
              <Button onClick={handleAddOldDue} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Old Due
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
              Add Government Scheme / Scholarship
            </DialogTitle>
            <DialogDescription>Add a new govt scheme or scholarship</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheme Name (English) *</Label>
                <Input
                  value={scholarshipForm.name}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pre Matric Scholarship"
                />
              </div>
              <div className="space-y-2">
                <Label>Scheme Name (Hindi)</Label>
                <Input
                  value={scholarshipForm.name_hi}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, name_hi: e.target.value }))}
                  placeholder="e.g., प्री-मैट्रिक छात्रवृत्ति"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheme Type *</Label>
                <select
                  value={scholarshipForm.type}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="central_govt">केंद्र सरकार (Central Govt)</option>
                  <option value="state_govt">राज्य सरकार (State Govt)</option>
                  <option value="private">Private / NGO</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
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
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={scholarshipForm.amount}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Or % of Fee</Label>
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
              <Label>Eligibility Criteria</Label>
              <Input
                value={scholarshipForm.eligibility}
                onChange={(e) => setScholarshipForm(prev => ({ ...prev, eligibility: e.target.value }))}
                placeholder="e.g., BPL Family, Income < 2.5 Lakh, SC/ST/OBC"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Documents Required</Label>
              <Input
                value={scholarshipForm.documents_required}
                onChange={(e) => setScholarshipForm(prev => ({ ...prev, documents_required: e.target.value }))}
                placeholder="e.g., Aadhar, Income Certificate, Caste Certificate"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowScholarshipDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveScholarship} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Scheme
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
              Assign Scholarship to Student
            </DialogTitle>
            <DialogDescription>Apply a scheme to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Student *</Label>
              <select
                value={assignForm.student_id}
                onChange={(e) => setAssignForm(prev => ({ ...prev, student_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.class_name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Select Scheme *</Label>
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
                <option value="">-- Select Scheme --</option>
                {scholarships.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - ₹{(s.amount || 0).toLocaleString()}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={assignForm.amount}
                onChange={(e) => setAssignForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={assignForm.status}
                onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="pending">Pending (लंबित)</option>
                <option value="approved">Approved (स्वीकृत)</option>
                <option value="received">Received (प्राप्त)</option>
                <option value="rejected">Rejected (अस्वीकृत)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={assignForm.remarks}
                onChange={(e) => setAssignForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any notes..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAssignScholarshipDialog(false)}>Cancel</Button>
              <Button onClick={handleAssignScholarship} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Assign Scholarship
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}