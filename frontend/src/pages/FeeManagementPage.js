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

// Fee Types Configuration
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

export default function FeeManagementPage() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('structure');
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeCollections, setFeeCollections] = useState([]);
  const [oldDues, setOldDues] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showOldDueDialog, setShowOldDueDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  
  // Fee structure form
  const [structureForm, setStructureForm] = useState({
    class_id: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    fees: FEE_TYPES.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {})
  });
  
  // Collection form
  const [collectionForm, setCollectionForm] = useState({
    student_id: '',
    amount: 0,
    fee_types: [],
    months: [],
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_no: '',
    remarks: ''
  });

  // Old Due form
  const [oldDueForm, setOldDueForm] = useState({
    student_id: '',
    academic_year: '',
    class_name: '',
    amount: 0,
    description: '',
    send_notification: true
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classRes, feeRes, collectionRes, duesRes] = await Promise.all([
        axios.get(`${API}/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/fee-structures?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/fee-collections?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/old-dues?school_id=${schoolId}`, { headers })
      ]);
      
      setClasses(classRes.data);
      setFeeStructures(feeRes.data);
      setFeeCollections(collectionRes.data);
      setOldDues(duesRes.data || []);
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
    if (schoolId && activeTab === 'collection') {
      fetchStudents(selectedClass);
    }
  }, [selectedClass, search, activeTab]);

  // Save fee structure
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

  // Collect fee
  const handleCollectFee = async () => {
    if (!collectionForm.student_id || collectionForm.amount <= 0) {
      toast.error('कृपया student और amount भरें');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/fee-collections`, {
        ...collectionForm,
        school_id: schoolId,
        collected_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Fee collected! Receipt No: ${response.data.receipt_no}`);
      setShowCollectionDialog(false);
      setCollectionForm({
        student_id: '',
        amount: 0,
        fee_types: [],
        months: [],
        payment_mode: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        receipt_no: '',
        remarks: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to collect fee');
    } finally {
      setSaving(false);
    }
  };

  // Add old due
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

  // Get fee structure for a class
  const getClassFeeStructure = (classId) => {
    return feeStructures.find(f => f.class_id === classId);
  };

  // Calculate student fee summary
  const getStudentFeeSummary = (studentId) => {
    const studentCollections = feeCollections.filter(c => c.student_id === studentId);
    const studentDues = oldDues.filter(d => d.student_id === studentId);
    
    const totalPaid = studentCollections.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalOldDue = studentDues.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    return { totalPaid, totalOldDue, collections: studentCollections, dues: studentDues };
  };

  // Print receipt
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
        <div class="amount">₹ ${collection.amount?.toLocaleString('en-IN')}</div>
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

  // Class-wise summary
  const getClassSummary = () => {
    return classes.map(cls => {
      const structure = getClassFeeStructure(cls.id);
      const classStudents = students.filter(s => s.class_id === cls.id);
      const totalFee = structure ? Object.values(structure.fees || {}).reduce((a, b) => a + (b || 0), 0) : 0;
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

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fee-management-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-600" />
            Fee Management
          </h1>
          <p className="text-slate-500 mt-1">Complete fee structure, collection & tracking</p>
        </div>
        <div className="flex gap-2">
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

      {/* Summary Cards */}
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="structure" className="gap-2 data-[state=active]:bg-white">
            <Building2 className="w-4 h-4" />
            Fee Structure
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2 data-[state=active]:bg-white">
            <CreditCard className="w-4 h-4" />
            Student Fees
          </TabsTrigger>
          <TabsTrigger value="old_dues" className="gap-2 data-[state=active]:bg-white">
            <History className="w-4 h-4" />
            Old Dues
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-white">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Fee Structure Tab */}
        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class-wise Fee Structure</CardTitle>
                <CardDescription>Set fees for each class</CardDescription>
              </div>
              <Button onClick={() => setShowStructureDialog(true)} className="gap-2">
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
                      <TableHead>Admission Fee</TableHead>
                      <TableHead>Tuition Fee</TableHead>
                      <TableHead>Exam Fee</TableHead>
                      <TableHead>Other Fees</TableHead>
                      <TableHead>Total Annual</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map(cls => {
                      const structure = getClassFeeStructure(cls.id);
                      const fees = structure?.fees || {};
                      const total = Object.values(fees).reduce((a, b) => a + (b || 0), 0);
                      
                      return (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>₹{fees.admission_fee?.toLocaleString('en-IN') || '-'}</TableCell>
                          <TableCell>₹{fees.tuition_fee?.toLocaleString('en-IN') || '-'}/month</TableCell>
                          <TableCell>₹{fees.exam_fee?.toLocaleString('en-IN') || '-'}</TableCell>
                          <TableCell>
                            ₹{(total - (fees.admission_fee || 0) - ((fees.tuition_fee || 0) * 12) - (fees.exam_fee || 0)).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            ₹{total.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setStructureForm({
                                  class_id: cls.id,
                                  academic_year: structure?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
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

        {/* Student Fees Tab */}
        <TabsContent value="collection" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Student Fee Status</CardTitle>
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
                    const totalFee = structure ? Object.values(structure.fees || {}).reduce((a, b) => a + (b || 0), 0) : 0;
                    const pendingAmount = totalFee - summary.totalPaid + summary.totalOldDue;
                    const isExpanded = expandedStudent === student.id;
                    
                    return (
                      <div key={student.id} className="border rounded-lg overflow-hidden">
                        {/* Student Row */}
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
                                setSelectedStudent(student);
                                setCollectionForm(prev => ({ ...prev, student_id: student.id }));
                                setShowCollectionDialog(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Collect Fee
                            </Button>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Fee Breakdown */}
                              <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Fee Breakdown
                                </h4>
                                {structure ? (
                                  <div className="space-y-2">
                                    {FEE_TYPES.filter(f => structure.fees?.[f.id] > 0).map(feeType => (
                                      <div key={feeType.id} className="flex justify-between text-sm">
                                        <span>{feeType.name_hi}</span>
                                        <span>₹{structure.fees[feeType.id]?.toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">No fee structure set for this class</p>
                                )}
                              </div>
                              
                              {/* Payment History */}
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

        {/* Old Dues Tab */}
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
                                setSelectedStudent(student);
                                setCollectionForm(prev => ({ 
                                  ...prev, 
                                  student_id: due.student_id,
                                  amount: due.amount,
                                  remarks: `Old due payment for ${due.academic_year}`
                                }));
                                setShowCollectionDialog(true);
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

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Fee Summary</CardTitle>
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

      {/* Fee Structure Dialog */}
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
                <Input
                  value={structureForm.academic_year}
                  onChange={(e) => setStructureForm(prev => ({ ...prev, academic_year: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Fee Types (शुल्क प्रकार)</h4>
              <div className="grid grid-cols-2 gap-4">
                {FEE_TYPES.map(feeType => (
                  <div key={feeType.id} className="space-y-1">
                    <Label className="text-sm">{feeType.name_hi} ({feeType.name})</Label>
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

      {/* Fee Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Fee</DialogTitle>
            <DialogDescription>
              {selectedStudent ? `Collecting fee for ${selectedStudent.name}` : 'Select student and enter amount'}
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
                    setSelectedStudent(student);
                    setCollectionForm(prev => ({ ...prev, student_id: e.target.value }));
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
            
            <div className="space-y-2">
              <Label>Amount *</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">₹</span>
                <Input
                  type="number"
                  value={collectionForm.amount}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="text-2xl font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            
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
              }}>Cancel</Button>
              <Button onClick={handleCollectFee} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Collect ₹{collectionForm.amount.toLocaleString('en-IN')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Old Due Dialog */}
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
    </div>
  );
}
