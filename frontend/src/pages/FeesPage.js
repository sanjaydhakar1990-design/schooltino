import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import { Plus, Wallet, FileText, CreditCard, Loader2, Receipt, Search } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function FeesPage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [invoiceForm, setInvoiceForm] = useState({
    student_id: '',
    fee_plan_id: '',
    month: new Date().toISOString().slice(0, 7),
    amount: '',
    due_date: '',
    discount: 0,
    discount_reason: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    transaction_id: '',
    remarks: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    class_ids: [],
    amount: '',
    due_day: 10,
    late_fee: 0,
    description: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId, statusFilter]);

  const fetchData = async () => {
    try {
      const [invoicesRes, plansRes, studentsRes, classesRes, statsRes] = await Promise.all([
        axios.get(`${API}/fees/invoices?school_id=${schoolId}${statusFilter ? `&status=${statusFilter}` : ''}`),
        axios.get(`${API}/fees/plans?school_id=${schoolId}`),
        axios.get(`${API}/students?school_id=${schoolId}`),
        axios.get(`${API}/classes?school_id=${schoolId}`),
        axios.get(`${API}/fees/stats?school_id=${schoolId}`)
      ]);
      setInvoices(invoicesRes.data);
      setFeePlans(plansRes.data);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/fees/invoices`, {
        ...invoiceForm,
        school_id: schoolId,
        amount: parseFloat(invoiceForm.amount),
        discount: parseFloat(invoiceForm.discount) || 0
      });
      toast.success(t('saved_successfully'));
      setIsInvoiceDialogOpen(false);
      setInvoiceForm({
        student_id: '',
        fee_plan_id: '',
        month: new Date().toISOString().slice(0, 7),
        amount: '',
        due_date: '',
        discount: 0,
        discount_reason: ''
      });
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/fees/payments`, {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        transaction_id: paymentForm.transaction_id,
        remarks: paymentForm.remarks
      });
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        amount: '',
        payment_mode: 'cash',
        transaction_id: '',
        remarks: ''
      });
      setSelectedInvoice(null);
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/fees/plans`, {
        ...planForm,
        school_id: schoolId,
        amount: parseFloat(planForm.amount),
        late_fee: parseFloat(planForm.late_fee) || 0
      });
      toast.success(t('saved_successfully'));
      setIsPlanDialogOpen(false);
      setPlanForm({
        name: '',
        class_ids: [],
        amount: '',
        due_day: 10,
        late_fee: 0,
        description: ''
      });
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: (invoice.final_amount - invoice.paid_amount).toString(),
      payment_mode: 'cash',
      transaction_id: '',
      remarks: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      paid: 'badge-success',
      overdue: 'badge-error',
      partial: 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fees-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('fees')}</h1>
          <p className="text-slate-500 mt-1">Manage fee collection</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-slate-500">Expected ({stats.month})</p>
            <p className="text-2xl font-bold font-mono text-slate-900">₹{stats.total_expected.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('fee_collected')}</p>
            <p className="text-2xl font-bold font-mono text-emerald-600">₹{stats.total_collected.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">{t('pending_fees')}</p>
            <p className="text-2xl font-bold font-mono text-rose-600">₹{stats.pending.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500">Collection Rate</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.collection_rate}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices" data-testid="invoices-tab">
              <FileText className="w-4 h-4 mr-2" />
              {t('invoices')}
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="plans-tab">
              <Wallet className="w-4 h-4 mr-2" />
              {t('fee_plans')}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="create-invoice-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('create_invoice')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('create_invoice')}</DialogTitle>
                  <DialogDescription className="sr-only">Invoice form</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Student *</Label>
                    <select
                      value={invoiceForm.student_id}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, student_id: e.target.value }))}
                      required
                      className="w-full h-10 rounded-lg border border-slate-200 px-3"
                      data-testid="invoice-student-select"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.admission_no})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Plan *</Label>
                    <select
                      value={invoiceForm.fee_plan_id}
                      onChange={(e) => {
                        const plan = feePlans.find(p => p.id === e.target.value);
                        setInvoiceForm(prev => ({ 
                          ...prev, 
                          fee_plan_id: e.target.value,
                          amount: plan?.amount || ''
                        }));
                      }}
                      required
                      className="w-full h-10 rounded-lg border border-slate-200 px-3"
                      data-testid="invoice-plan-select"
                    >
                      <option value="">Select Plan</option>
                      {feePlans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - ₹{p.amount}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Month *</Label>
                      <Input
                        type="month"
                        value={invoiceForm.month}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, month: e.target.value }))}
                        required
                        data-testid="invoice-month-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('due_date')} *</Label>
                      <Input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                        required
                        data-testid="invoice-due-date-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('amount')} *</Label>
                      <Input
                        type="number"
                        value={invoiceForm.amount}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        data-testid="invoice-amount-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('discount')}</Label>
                      <Input
                        type="number"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, discount: e.target.value }))}
                        data-testid="invoice-discount-input"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-invoice-btn">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="invoices">
          {/* Filter */}
          <div className="flex gap-4 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 min-w-[150px]"
              data-testid="status-filter"
            >
              <option value="">All Status</option>
              <option value="pending">{t('pending')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="overdue">{t('overdue')}</option>
              <option value="partial">{t('partial')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner w-10 h-10" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t('no_data')}</p>
            </div>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('paid')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_no}</TableCell>
                      <TableCell className="font-medium">{invoice.student_name}</TableCell>
                      <TableCell>{invoice.month}</TableCell>
                      <TableCell className="font-mono">₹{invoice.final_amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-emerald-600">₹{invoice.paid_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(invoice)}
                            data-testid={`record-payment-${invoice.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay
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

        <TabsContent value="plans">
          <div className="flex justify-end mb-4">
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="create-plan-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Fee Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Fee Plan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePlan} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Fee, Annual Fee"
                      required
                      data-testid="plan-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('amount')} *</Label>
                    <Input
                      type="number"
                      value={planForm.amount}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      data-testid="plan-amount-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max="28"
                        value={planForm.due_day}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, due_day: parseInt(e.target.value) }))}
                        data-testid="plan-due-day-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Late Fee</Label>
                      <Input
                        type="number"
                        value={planForm.late_fee}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, late_fee: e.target.value }))}
                        data-testid="plan-late-fee-input"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-plan-btn">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {feePlans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No fee plans yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feePlans.map((plan) => (
                <div key={plan.id} className="stat-card" data-testid={`plan-card-${plan.id}`}>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="text-3xl font-bold font-mono text-indigo-600 mt-2">₹{plan.amount.toLocaleString()}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p>Due Day: {plan.due_day}th of month</p>
                    <p>Late Fee: ₹{plan.late_fee}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('record_payment')}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Invoice: {selectedInvoice.invoice_no}</p>
                <p className="text-sm text-slate-500">Student: {selectedInvoice.student_name}</p>
                <p className="text-sm text-slate-500">
                  Due: ₹{(selectedInvoice.final_amount - selectedInvoice.paid_amount).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('amount')} *</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  data-testid="payment-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('payment_mode')} *</Label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="payment-mode-select"
                >
                  <option value="cash">{t('cash')}</option>
                  <option value="online">{t('online')}</option>
                  <option value="cheque">{t('cheque')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input
                  value={paymentForm.transaction_id}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                  placeholder="For online/cheque payments"
                  data-testid="payment-txn-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-payment-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Record Payment
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
