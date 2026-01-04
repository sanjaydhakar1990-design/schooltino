import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  CreditCard, Smartphone, Building2, Receipt, CheckCircle, 
  Loader2, Download, Clock, IndianRupee, QrCode, Copy,
  AlertCircle, ArrowLeft, Wallet, History, FileText, School
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function FeePaymentPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feeStatus, setFeeStatus] = useState(null);
  const [feeStructure, setFeeStructure] = useState([]);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(null);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    fetchFeeData();
  }, [user]);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const studentId = user?.student_id || user?.id;
      const schoolId = user?.school_id || 'school1';
      const classId = user?.class_id || 'class1';

      // Fetch fee status
      const statusRes = await fetch(`${API}/api/fee-payment/status/${studentId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setFeeStatus(statusData);
      }

      // Fetch fee structure
      const structureRes = await fetch(`${API}/api/fee-payment/structure/${schoolId}/${classId}`);
      if (structureRes.ok) {
        const structureData = await structureRes.json();
        setFeeStructure(structureData.fee_structure || []);
      }

      // Fetch school details for payment info
      try {
        const schoolRes = await fetch(`${API}/api/schools/${schoolId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolDetails(school);
        }
      } catch (e) {
        console.log('School details not available');
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
      toast.error('Fee data load nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!selectedFee || !paymentMethod) {
      toast.error('Fee type aur payment method select karein');
      return;
    }

    const amount = customAmount ? parseFloat(customAmount) : selectedFee.amount;
    if (!amount || amount <= 0) {
      toast.error('Valid amount enter karein');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API}/api/fee-payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.student_id || user?.id,
          school_id: user?.school_id || 'school1',
          amount: amount,
          fee_type: selectedFee.fee_type,
          month: new Date().toISOString().slice(0, 7),
          payment_method: paymentMethod,
          description: selectedFee.description
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentInitiated(data);
        
        if (paymentMethod === 'upi' && data.upi_url) {
          // For UPI, show QR code dialog
          setShowPaymentDialog(true);
        } else {
          // For card payments, simulate success after delay
          setTimeout(() => verifyPayment(data.payment_id, 'success'), 2000);
        }
      } else {
        toast.error(data.detail || 'Payment initiate nahi ho paya');
      }
    } catch (error) {
      toast.error('Payment error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const verifyPayment = async (paymentId, status) => {
    setProcessing(true);
    try {
      const response = await fetch(`${API}/api/fee-payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          status: status
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment successful! Receipt ready ✅');
        setCurrentReceipt(data.receipt);
        setShowPaymentDialog(false);
        setShowReceiptDialog(true);
        fetchFeeData(); // Refresh data
      } else {
        toast.error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      toast.error('Verification error');
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = () => {
    // In real app, this would generate PDF
    const receiptText = `
SCHOOL FEE RECEIPT
==================
Receipt No: ${currentReceipt?.receipt_number}
Date: ${new Date().toLocaleDateString('en-IN')}

Student: ${currentReceipt?.student_name}
Fee Type: ${currentReceipt?.fee_type}
Amount: ₹${currentReceipt?.amount}
Payment Method: ${currentReceipt?.payment_method}

School: ${currentReceipt?.school_name}
==================
Thank you for your payment!
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${currentReceipt?.receipt_number}.txt`;
    a.click();
    toast.success('Receipt downloaded!');
  };

  const copyUPIId = () => {
    if (paymentInitiated?.upi_id) {
      navigator.clipboard.writeText(paymentInitiated.upi_id);
      toast.success('UPI ID copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto" />
          <p className="mt-4 text-amber-700">Loading fee details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4" data-testid="fee-payment-page">
      {/* Header */}
      <header className="max-w-lg mx-auto mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">💳 Fee Payment</h1>
            <p className="text-sm text-slate-500">Direct school account me pay karein</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto space-y-4">
        {/* Fee Summary Card */}
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-amber-100">Total Pending</p>
                <p className="text-3xl font-bold">₹{feeStatus?.summary?.total_pending || 0}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs text-amber-100">This Month Due</p>
                <p className="font-semibold">₹{feeStatus?.summary?.current_month_due || 0}</p>
              </div>
              <div>
                <p className="text-xs text-amber-100">Paid This Year</p>
                <p className="font-semibold">₹{feeStatus?.summary?.total_paid_this_year || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Payment Details - Important! */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <School className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">
                  {schoolDetails?.name || 'School Account'}
                </p>
                <p className="text-xs text-blue-600">Payment yahi account me jayega</p>
              </div>
            </div>
            
            {/* UPI Details */}
            {(schoolDetails?.upi_id || paymentInitiated?.upi_id) && (
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-slate-600">UPI ID:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-green-700">
                      {schoolDetails?.upi_id || paymentInitiated?.upi_id || 'school@upi'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(schoolDetails?.upi_id || paymentInitiated?.upi_id || '');
                        toast.success('UPI ID copied!');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details Toggle */}
            {schoolDetails?.bank_name && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-blue-600"
                onClick={() => setShowBankDetails(!showBankDetails)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                {showBankDetails ? 'Hide' : 'Show'} Bank Details
              </Button>
            )}

            {showBankDetails && schoolDetails?.bank_name && (
              <div className="bg-white rounded-lg p-3 mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-medium">{schoolDetails.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">A/C Name:</span>
                  <span className="font-medium">{schoolDetails.account_holder_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">A/C No:</span>
                  <span className="font-mono">
                    {schoolDetails.account_number ? 
                      `${schoolDetails.account_number.slice(0,4)}****${schoolDetails.account_number.slice(-4)}` : 
                      'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC:</span>
                  <span className="font-medium">{schoolDetails.ifsc_code || 'N/A'}</span>
                </div>
              </div>
            )}

            {!schoolDetails?.upi_id && !schoolDetails?.bank_name && (
              <div className="text-center py-2">
                <p className="text-xs text-blue-600">
                  School payment details coming soon...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Structure */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-3">📋 Select Fee to Pay</h2>
          <div className="space-y-2">
            {feeStructure.map((fee, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedFee(fee);
                  setCustomAmount(fee.amount.toString());
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedFee?.fee_type === fee.fee_type
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-amber-300'
                }`}
                data-testid={`fee-option-${fee.fee_type}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{fee.fee_type} Fee</p>
                    <p className="text-sm text-slate-500">{fee.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-900">₹{fee.amount}</p>
                    {fee.due_day > 0 && (
                      <p className="text-xs text-slate-400">Due: {fee.due_day}th</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        {selectedFee && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Amount (₹)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-9"
                  placeholder="Enter amount"
                  data-testid="custom-amount-input"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setCustomAmount(selectedFee.amount.toString())}
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {selectedFee && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">💳 Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-green-300'
                }`}
                data-testid="payment-method-upi"
              >
                <Smartphone className="w-8 h-8 text-green-600 mb-2" />
                <p className="font-medium text-slate-900">UPI</p>
                <p className="text-xs text-slate-500">GPay, PhonePe, Paytm</p>
              </div>
              
              <div
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'credit_card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
                data-testid="payment-method-card"
              >
                <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-slate-900">Card</p>
                <p className="text-xs text-slate-500">Credit/Debit Card</p>
              </div>
              
              <div
                onClick={() => setPaymentMethod('net_banking')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'net_banking'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
                data-testid="payment-method-netbanking"
              >
                <Building2 className="w-8 h-8 text-purple-600 mb-2" />
                <p className="font-medium text-slate-900">Net Banking</p>
                <p className="text-xs text-slate-500">All Banks</p>
              </div>
              
              <div
                onClick={() => setPaymentMethod('debit_card')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'debit_card'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-orange-300'
                }`}
                data-testid="payment-method-debit"
              >
                <Wallet className="w-8 h-8 text-orange-600 mb-2" />
                <p className="font-medium text-slate-900">Debit Card</p>
                <p className="text-xs text-slate-500">ATM Card</p>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button */}
        {selectedFee && paymentMethod && (
          <Button
            onClick={initiatePayment}
            disabled={processing}
            className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            data-testid="pay-now-button"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <IndianRupee className="w-5 h-5 mr-2" />
            )}
            Pay ₹{customAmount || selectedFee.amount}
          </Button>
        )}

        {/* Payment History */}
        {feeStatus?.recent_payments?.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Payments
            </h2>
            <div className="space-y-2">
              {feeStatus.recent_payments.map((payment, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{payment.fee_type}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(payment.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{payment.amount}</p>
                    {payment.receipt_number && (
                      <button className="text-xs text-blue-600 hover:underline">
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* UPI Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-600" />
              Pay via UPI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Scan QR Code</p>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-700">Amount to Pay</p>
              <p className="text-3xl font-bold text-green-800">₹{paymentInitiated?.amount}</p>
            </div>

            {/* UPI ID */}
            <div className="bg-slate-100 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">UPI ID</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-medium">{paymentInitiated?.upi_id || 'school@upi'}</span>
                <Button variant="ghost" size="icon" onClick={copyUPIId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => verifyPayment(paymentInitiated?.payment_id, 'success')}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Payment Done ✓'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Success Animation */}
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            {/* Receipt Details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No</span>
                <span className="font-mono font-medium">{currentReceipt?.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-green-600">₹{currentReceipt?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Type</span>
                <span className="capitalize">{currentReceipt?.fee_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="capitalize">{currentReceipt?.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadReceipt}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={() => setShowReceiptDialog(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
