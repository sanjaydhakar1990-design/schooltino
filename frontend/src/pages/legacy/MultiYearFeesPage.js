import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { 
  Calendar, AlertCircle, IndianRupee, Plus, Search, Users, Clock, 
  CheckCircle, XCircle, Loader2, TrendingDown, History, Receipt,
  ChevronRight, Filter, Download
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function MultiYearFeesPage() {
  const { user, schoolId, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [yearSummary, setYearSummary] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDues, setStudentDues] = useState(null);
  const [showAddDueDialog, setShowAddDueDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);

  const [dueForm, setDueForm] = useState({
    student_id: '',
    academic_year: '',
    due_amount: '',
    fee_type: 'tuition',
    description: '',
    remarks: ''
  });

  const [payForm, setPayForm] = useState({
    payment_amount: '',
    payment_mode: 'cash',
    transaction_id: '',
    allocations: []
  });

  // Get academic years for dropdown
  const getAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 4; i++) {
      const startYear = currentYear - i;
      years.push(`${startYear - 1}-${String(startYear).slice(-2)}`);
    }
    return years;
  };

  useEffect(() => {
    if (schoolId) {
      fetchData();
      fetchStudents();
    }
  }, [schoolId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, defaultersRes] = await Promise.all([
        fetch(`${API}/api/multi-year-fees/summary/${schoolId}`),
        fetch(`${API}/api/multi-year-fees/defaulters/${schoolId}?min_amount=0`)
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setYearSummary(data);
      }

      if (defaultersRes.ok) {
        const data = await defaultersRes.json();
        setDefaulters(data.defaulters || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Data load nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API}/api/students?school_id=${schoolId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentDues = async (studentId) => {
    try {
      const res = await fetch(`${API}/api/multi-year-fees/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentDues(data);
      }
    } catch (error) {
      toast.error('Student dues load nahi ho paye');
    }
  };

  const handleAddDue = async () => {
    if (!dueForm.student_id || !dueForm.academic_year || !dueForm.due_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/multi-year-fees/add-due`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dueForm,
          school_id: schoolId,
          due_amount: parseFloat(dueForm.due_amount)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Due added successfully!');
        setShowAddDueDialog(false);
        setDueForm({
          student_id: '',
          academic_year: '',
          due_amount: '',
          fee_type: 'tuition',
          description: '',
          remarks: ''
        });
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to add due');
      }
    } catch (error) {
      toast.error('Error adding due');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!payForm.payment_amount || payForm.allocations.length === 0) {
      toast.error('Amount aur allocation specify karein');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/multi-year-fees/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          school_id: schoolId,
          payment_amount: parseFloat(payForm.payment_amount),
          payment_mode: payForm.payment_mode,
          transaction_id: payForm.transaction_id,
          allocations: payForm.allocations
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payment successful! Receipt: ${data.receipt_no}`);
        setShowPayDialog(false);
        setPayForm({
          payment_amount: '',
          payment_mode: 'cash',
          transaction_id: '',
          allocations: []
        });
        fetchData();
        if (selectedStudent) {
          fetchStudentDues(selectedStudent.student_id);
        }
      } else {
        toast.error(data.detail || 'Payment failed');
      }
    } catch (error) {
      toast.error('Payment error');
    } finally {
      setSubmitting(false);
    }
  };

  const openStudentDetails = async (student) => {
    setSelectedStudent(student);
    await fetchStudentDues(student.student_id);
    setShowStudentDialog(true);
  };

  const openPayDialog = (student) => {
    setSelectedStudent(student);
    
    // Auto-allocate to oldest year first
    const allocations = [];
    if (studentDues?.year_wise_breakdown) {
      let remaining = student.total_dues;
      for (const yearData of studentDues.year_wise_breakdown.sort((a, b) => a.academic_year.localeCompare(b.academic_year))) {
        if (remaining <= 0) break;
        const toAllocate = Math.min(remaining, yearData.remaining);
        allocations.push({ year: yearData.academic_year, amount: toAllocate });
        remaining -= toAllocate;
      }
    }
    
    setPayForm({
      payment_amount: student.total_dues.toString(),
      payment_mode: 'cash',
      transaction_id: '',
      allocations: allocations
    });
    setShowPayDialog(true);
  };

  const filteredDefaulters = defaulters.filter(d => 
    d.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="multi-year-fees-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-red-500" />
            Previous Years Fee Dues
          </h1>
          <p className="text-slate-500 mt-1">Track and collect fees from 2-3 years back</p>
        </div>
        <Button onClick={() => setShowAddDueDialog(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Previous Year Due
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Pending</p>
                <p className="text-3xl font-bold text-red-700">
                  ₹{(yearSummary?.total_pending_all_years || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Students with Dues</p>
                <p className="text-3xl font-bold text-slate-900">
                  {yearSummary?.total_students_with_dues || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Years with Dues</p>
                <p className="text-3xl font-bold text-slate-900">
                  {yearSummary?.years_with_dues || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">This Month Collection</p>
                <p className="text-3xl font-bold text-emerald-700">₹0</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-wise Summary */}
      {yearSummary?.year_wise_summary?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Year-wise Dues Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {yearSummary.year_wise_summary.map((year, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-slate-900">{year.academic_year}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      year.collection_percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      year.collection_percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {year.collection_percentage}% collected
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Dues:</span>
                      <span className="font-medium">₹{year.total_dues.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Collected:</span>
                      <span className="font-medium text-emerald-600">₹{year.collected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending:</span>
                      <span className="font-medium text-red-600">₹{year.pending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Students:</span>
                      <span className="font-medium">{year.students_with_dues}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Defaulters List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Fee Defaulters
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search student..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDefaulters.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <p className="text-slate-500">Koi previous year dues pending nahi hai! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDefaulters.map((student, idx) => (
                <div 
                  key={idx}
                  className="py-4 flex items-center justify-between hover:bg-slate-50 px-3 rounded-lg cursor-pointer transition-colors"
                  onClick={() => openStudentDetails(student)}
                  data-testid={`defaulter-row-${student.student_id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600">
                        {student.student_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.student_name}</p>
                      <p className="text-sm text-slate-500">{student.student_id}</p>
                      <div className="flex gap-1 mt-1">
                        {student.years_pending?.map((year, yIdx) => (
                          <span key={yIdx} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            {year}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">₹{student.total_dues.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Oldest: {student.oldest_due}</p>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Due Dialog */}
      <Dialog open={showAddDueDialog} onOpenChange={setShowAddDueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Previous Year Due</DialogTitle>
            <DialogDescription>Add outstanding fees from previous academic years</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <select
                value={dueForm.student_id}
                onChange={(e) => setDueForm(f => ({ ...f, student_id: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
                data-testid="due-student-select"
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.student_id || s.id}>
                    {s.name} ({s.student_id || s.admission_no})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <select
                value={dueForm.academic_year}
                onChange={(e) => setDueForm(f => ({ ...f, academic_year: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
                data-testid="due-year-select"
              >
                <option value="">Select Year</option>
                {getAcademicYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <select
                  value={dueForm.fee_type}
                  onChange={(e) => setDueForm(f => ({ ...f, fee_type: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="tuition">Tuition</option>
                  <option value="exam">Exam</option>
                  <option value="transport">Transport</option>
                  <option value="hostel">Hostel</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={dueForm.due_amount}
                  onChange={(e) => setDueForm(f => ({ ...f, due_amount: e.target.value }))}
                  placeholder="5000"
                  data-testid="due-amount-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={dueForm.description}
                onChange={(e) => setDueForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g., Tuition fee Q3 2023-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={dueForm.remarks}
                onChange={(e) => setDueForm(f => ({ ...f, remarks: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDueDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddDue} 
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
                data-testid="save-due-btn"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Due
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedStudent?.student_name}
            </DialogTitle>
            <DialogDescription>Year-wise dues breakdown</DialogDescription>
          </DialogHeader>
          
          {studentDues && (
            <div className="space-y-4 mt-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-600">Previous Years</p>
                  <p className="text-2xl font-bold text-red-700">
                    ₹{studentDues.summary?.total_previous_years_pending?.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600">Current Year</p>
                  <p className="text-2xl font-bold text-amber-700">
                    ₹{studentDues.summary?.current_year_pending?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-4 bg-slate-900 rounded-xl text-white">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Grand Total Pending</span>
                  <span className="text-3xl font-bold">
                    ₹{studentDues.summary?.grand_total_pending?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Year-wise breakdown */}
              {studentDues.year_wise_breakdown?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">Year-wise Breakdown</h4>
                  {studentDues.year_wise_breakdown.map((year, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-900">{year.academic_year}</span>
                        <span className="text-lg font-bold text-red-600">
                          ₹{year.remaining?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Total: ₹{year.total_due?.toLocaleString()} | Paid: ₹{year.total_paid?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={() => {
                  setShowStudentDialog(false);
                  openPayDialog(selectedStudent);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <IndianRupee className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Student: {selectedStudent?.student_name} | Total Due: ₹{selectedStudent?.total_dues?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Payment Amount (₹) *</Label>
              <Input
                type="number"
                value={payForm.payment_amount}
                onChange={(e) => setPayForm(f => ({ ...f, payment_amount: e.target.value }))}
                placeholder="Enter amount"
                data-testid="payment-amount-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <select
                value={payForm.payment_mode}
                onChange={(e) => setPayForm(f => ({ ...f, payment_mode: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
              >
                <option value="cash">Cash</option>
                <option value="online">Online/UPI</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Transaction ID (Optional)</Label>
              <Input
                value={payForm.transaction_id}
                onChange={(e) => setPayForm(f => ({ ...f, transaction_id: e.target.value }))}
                placeholder="For online/cheque payments"
              />
            </div>

            {/* Allocation Preview */}
            {payForm.allocations.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-700 mb-2">Payment Allocation:</p>
                {payForm.allocations.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{alloc.year}</span>
                    <span className="font-medium">₹{alloc.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPayDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="confirm-payment-btn"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
