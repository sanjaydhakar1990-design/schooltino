/**
 * Parent Payment Portal Page
 * - View fee details, pending fees, payment history
 * - Pay via UPI/GPay/Paytm
 * - Download receipts
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Wallet, CreditCard, Receipt, Download, CheckCircle, 
  AlertCircle, Loader2, Phone, Building, QrCode, Copy, 
  IndianRupee, Clock, FileText, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function ParentPaymentPortal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feeData, setFeeData] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'gpay',
    transaction_id: '',
    payer_upi_id: '',
    remarks: ''
  });

  // Get student ID from user context or query param
  const studentId = user?.student_id || user?.linked_student_id;

  useEffect(() => {
    if (studentId) {
      fetchFeeDetails();
    }
  }, [studentId]);

  const fetchFeeDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/parent/fee-details/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeeData(response.data);
    } catch (error) {
      console.error('Error fetching fee details:', error);
      toast.error('Fee details load करने में समस्या');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handlePayNow = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm(prev => ({
      ...prev,
      amount: (invoice.amount - invoice.paid_amount).toString()
    }));
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!paymentForm.transaction_id) {
      toast.error('Transaction ID डालें');
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('सही amount डालें');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/parent/record-payment`, {
        student_id: studentId,
        invoice_id: selectedInvoice?.id,
        amount: parseFloat(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        transaction_id: paymentForm.transaction_id,
        payer_upi_id: paymentForm.payer_upi_id,
        remarks: paymentForm.remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payment recorded! Verification के बाद receipt मिलेगी।');
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      setPaymentForm({
        amount: '',
        payment_mode: 'gpay',
        transaction_id: '',
        payer_upi_id: '',
        remarks: ''
      });
      fetchFeeDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment record करने में समस्या');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = async (receiptNo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/receipt/${receiptNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open print-friendly receipt
      const receiptData = response.data;
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(`
        <html>
        <head>
          <title>Receipt - ${receiptNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .logo { max-height: 60px; }
            .school-name { font-size: 20px; font-weight: bold; margin: 10px 0; }
            .receipt-title { background: #4f46e5; color: white; padding: 8px; text-align: center; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
            .label { color: #666; }
            .value { font-weight: 500; }
            .amount { font-size: 24px; color: #16a34a; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .signature { margin-top: 40px; text-align: right; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${receiptData.school.logo_url ? `<img src="${receiptData.school.logo_url}" class="logo" />` : ''}
            <div class="school-name">${receiptData.school.name}</div>
            <div>${receiptData.school.address || ''}</div>
            <div>${receiptData.school.phone || ''} | ${receiptData.school.email || ''}</div>
          </div>
          
          <div class="receipt-title">FEE RECEIPT</div>
          
          <div class="row"><span class="label">Receipt No:</span><span class="value">${receiptData.receipt.receipt_no}</span></div>
          <div class="row"><span class="label">Date:</span><span class="value">${new Date(receiptData.receipt.date).toLocaleDateString('en-IN')}</span></div>
          <div class="row"><span class="label">Student Name:</span><span class="value">${receiptData.student.name}</span></div>
          <div class="row"><span class="label">Class:</span><span class="value">${receiptData.student.class}</span></div>
          <div class="row"><span class="label">Father's Name:</span><span class="value">${receiptData.student.father_name || '-'}</span></div>
          <div class="row"><span class="label">Payment Mode:</span><span class="value">${receiptData.receipt.payment_mode}</span></div>
          <div class="row"><span class="label">Transaction ID:</span><span class="value">${receiptData.receipt.transaction_id || '-'}</span></div>
          
          <div class="amount">₹ ${receiptData.receipt.amount.toLocaleString('en-IN')}</div>
          
          ${receiptData.footer.note ? `<div style="text-align:center; font-style:italic; color:#666;">${receiptData.footer.note}</div>` : ''}
          
          <div class="signature">
            <div>_____________________</div>
            <div>${receiptData.footer.authorized_by || 'Authorized Signatory'}</div>
            <div style="font-size:11px;">${receiptData.footer.designation || ''}</div>
          </div>
          
          <div class="footer">
            This is a computer generated receipt.
          </div>
          
          <script>window.print();</script>
        </body>
        </html>
      `);
    } catch (error) {
      toast.error('Receipt load करने में समस्या');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Student ID Not Found</h2>
        <p className="text-gray-600">Please login with your parent account linked to a student.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          {feeData?.school?.logo_url && (
            <img src={feeData.school.logo_url} alt="School Logo" className="w-16 h-16 rounded-xl bg-white p-1" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{feeData?.school?.name || 'School'}</h1>
            <p className="text-indigo-100">Fee Payment Portal</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <span className="text-indigo-200">Student:</span>
            <span className="ml-2 font-semibold">{feeData?.student?.name}</span>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <span className="text-indigo-200">Class:</span>
            <span className="ml-2 font-semibold">{feeData?.student?.class}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Pending</span>
          </div>
          <div className="text-2xl font-bold text-red-700">
            ₹{feeData?.summary?.total_pending?.toLocaleString('en-IN') || 0}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            ₹{feeData?.summary?.total_paid?.toLocaleString('en-IN') || 0}
          </div>
        </div>
      </div>

      {/* Payment Options */}
      {feeData?.payment_options && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Payment Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeData.payment_options.gpay_number && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">GPay</div>
                    <div className="font-medium">{feeData.payment_options.gpay_number}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(feeData.payment_options.gpay_number, 'GPay Number')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {feeData.payment_options.paytm_number && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Paytm</div>
                    <div className="font-medium">{feeData.payment_options.paytm_number}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(feeData.payment_options.paytm_number, 'Paytm Number')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {feeData.payment_options.phonepe_number && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">PhonePe</div>
                    <div className="font-medium">{feeData.payment_options.phonepe_number}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(feeData.payment_options.phonepe_number, 'PhonePe Number')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {feeData.payment_options.upi_id && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">UPI ID</div>
                    <div className="font-medium">{feeData.payment_options.upi_id}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(feeData.payment_options.upi_id, 'UPI ID')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {feeData.payment_options.bank_details && (
              <div className="col-span-full bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Bank Transfer</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Bank:</span> {feeData.payment_options.bank_details.bank_name}</div>
                  <div><span className="text-gray-500">A/C:</span> {feeData.payment_options.bank_details.account_number}</div>
                  <div><span className="text-gray-500">IFSC:</span> {feeData.payment_options.bank_details.ifsc_code}</div>
                  <div><span className="text-gray-500">Name:</span> {feeData.payment_options.bank_details.account_holder_name}</div>
                </div>
              </div>
            )}

            {feeData.payment_options.qr_code_url && (
              <div className="col-span-full flex justify-center">
                <img src={feeData.payment_options.qr_code_url} alt="Payment QR" className="w-40 h-40 rounded-lg border" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Invoices */}
      {feeData?.pending_invoices?.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Fees
          </h2>
          <div className="space-y-3">
            {feeData.pending_invoices.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between bg-amber-50 rounded-lg p-4">
                <div>
                  <div className="font-medium">{invoice.fee_type || 'Fee'}</div>
                  <div className="text-sm text-gray-500">{invoice.description || `Due: ${invoice.due_date}`}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-700">
                    ₹{(invoice.amount - (invoice.paid_amount || 0)).toLocaleString('en-IN')}
                  </div>
                  <Button size="sm" onClick={() => handlePayNow(invoice)} className="mt-1">
                    Pay Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {feeData?.payment_history?.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Payment History
          </h2>
          <div className="space-y-3">
            {feeData.payment_history.map(payment => (
              <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="font-medium">₹{payment.amount?.toLocaleString('en-IN')}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString('en-IN')} • {payment.payment_mode?.toUpperCase()}
                  </div>
                </div>
                {payment.receipt_no && (
                  <Button variant="outline" size="sm" onClick={() => downloadReceipt(payment.receipt_no)}>
                    <Download className="w-4 h-4 mr-1" /> Receipt
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Record Payment</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <Label>Payment Mode</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={paymentForm.payment_mode}
                  onChange={e => setPaymentForm(p => ({ ...p, payment_mode: e.target.value }))}
                >
                  <option value="gpay">Google Pay</option>
                  <option value="paytm">Paytm</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="upi">Other UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <Label>Transaction ID / UTR Number *</Label>
                <Input
                  value={paymentForm.transaction_id}
                  onChange={e => setPaymentForm(p => ({ ...p, transaction_id: e.target.value }))}
                  placeholder="Enter transaction reference"
                />
              </div>
              
              <div>
                <Label>Your UPI ID (Optional)</Label>
                <Input
                  value={paymentForm.payer_upi_id}
                  onChange={e => setPaymentForm(p => ({ ...p, payer_upi_id: e.target.value }))}
                  placeholder="yourname@upi"
                />
              </div>
              
              <div>
                <Label>Remarks (Optional)</Label>
                <Input
                  value={paymentForm.remarks}
                  onChange={e => setPaymentForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Any note for school"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmitPayment} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
