/**
 * Payment Settings Page for School Admin
 * - Configure UPI/GPay/Paytm numbers
 * - Bank details
 * - Receipt settings
 * - View pending verifications
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Settings, Wallet, CreditCard, Building, Save, 
  Loader2, CheckCircle, XCircle, Clock, Receipt,
  Phone, QrCode, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [verifying, setVerifying] = useState(null);
  
  const [settings, setSettings] = useState({
    school_id: '',
    gpay_number: '',
    paytm_number: '',
    phonepe_number: '',
    upi_id: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    qr_code_url: '',
    receipt_prefix: 'RCP',
    receipt_footer_note: '',
    show_bank_details_on_receipt: true,
    authorized_signatory_name: '',
    authorized_signatory_designation: '',
    // Razorpay Settings
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    // Cash Settings
    cash_collection_enabled: true,
    cash_collectors: [] // Array of user IDs who can collect cash
  });

  useEffect(() => {
    if (schoolId) {
      fetchSettings();
      fetchPendingPayments();
    }
  }, [schoolId]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/school/payment-settings?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(prev => ({ ...prev, ...response.data, school_id: schoolId }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/pending-payments?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/school/payment-settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment settings saved!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Settings save करने में समस्या');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPayment = async (paymentId, action) => {
    const remarks = action === 'reject' 
      ? prompt('Rejection reason:') 
      : '';
    
    if (action === 'reject' && !remarks) return;
    
    setVerifying(paymentId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admin/verify-payment/${paymentId}`, 
        { action, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === 'approve' ? 'Payment verified!' : 'Payment rejected');
      fetchPendingPayments();
    } catch (error) {
      toast.error('Verification में समस्या');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            Payment Settings
          </h1>
          <p className="text-gray-500 text-sm">UPI, Bank details और receipt settings configure करें</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'settings' 
              ? 'text-indigo-600 border-indigo-600' 
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-4 py-2 font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'verify' 
              ? 'text-indigo-600 border-indigo-600' 
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Verification
          {pendingPayments.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* UPI Settings */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              UPI Payment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>GPay Number</Label>
                <Input
                  value={settings.gpay_number}
                  onChange={e => setSettings(s => ({ ...s, gpay_number: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <Label>Paytm Number</Label>
                <Input
                  value={settings.paytm_number}
                  onChange={e => setSettings(s => ({ ...s, paytm_number: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <Label>PhonePe Number</Label>
                <Input
                  value={settings.phonepe_number}
                  onChange={e => setSettings(s => ({ ...s, phonepe_number: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <Label>UPI ID</Label>
                <Input
                  value={settings.upi_id}
                  onChange={e => setSettings(s => ({ ...s, upi_id: e.target.value }))}
                  placeholder="school@upi"
                />
              </div>
              <div className="md:col-span-2">
                <Label>QR Code URL (Optional)</Label>
                <Input
                  value={settings.qr_code_url}
                  onChange={e => setSettings(s => ({ ...s, qr_code_url: e.target.value }))}
                  placeholder="https://example.com/qr.png"
                />
                <p className="text-xs text-gray-500 mt-1">Upload QR code image and paste URL here</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Bank Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={settings.bank_name}
                  onChange={e => setSettings(s => ({ ...s, bank_name: e.target.value }))}
                  placeholder="State Bank of India"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={settings.account_number}
                  onChange={e => setSettings(s => ({ ...s, account_number: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input
                  value={settings.ifsc_code}
                  onChange={e => setSettings(s => ({ ...s, ifsc_code: e.target.value }))}
                  placeholder="SBIN0001234"
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  value={settings.account_holder_name}
                  onChange={e => setSettings(s => ({ ...s, account_holder_name: e.target.value }))}
                  placeholder="School Trust Name"
                />
              </div>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              Receipt Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Receipt Number Prefix</Label>
                <Input
                  value={settings.receipt_prefix}
                  onChange={e => setSettings(s => ({ ...s, receipt_prefix: e.target.value }))}
                  placeholder="RCP"
                />
                <p className="text-xs text-gray-500 mt-1">Example: RCP-2026-000001</p>
              </div>
              <div>
                <Label>Authorized Signatory Name</Label>
                <Input
                  value={settings.authorized_signatory_name}
                  onChange={e => setSettings(s => ({ ...s, authorized_signatory_name: e.target.value }))}
                  placeholder="Principal Name"
                />
              </div>
              <div>
                <Label>Signatory Designation</Label>
                <Input
                  value={settings.authorized_signatory_designation}
                  onChange={e => setSettings(s => ({ ...s, authorized_signatory_designation: e.target.value }))}
                  placeholder="Principal"
                />
              </div>
              <div>
                <Label>Receipt Footer Note</Label>
                <Input
                  value={settings.receipt_footer_note}
                  onChange={e => setSettings(s => ({ ...s, receipt_footer_note: e.target.value }))}
                  placeholder="Thank you for your payment"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_bank_details_on_receipt}
                  onChange={e => setSettings(s => ({ ...s, show_bank_details_on_receipt: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Show bank details on receipt</span>
              </label>
            </div>
          </div>

          {/* Razorpay Online Payment Gateway */}
          <div className="bg-white rounded-xl border shadow-sm p-5 border-l-4 border-l-blue-500">
            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              💳 Razorpay Online Payment
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Parents ko online payment link bhej sakte ho. Credit/Debit Card, Net Banking, UPI sab support karega.
            </p>
            
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-blue-50 border border-blue-200">
                <input
                  type="checkbox"
                  checked={settings.razorpay_enabled}
                  onChange={e => setSettings(s => ({ ...s, razorpay_enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-blue-300 text-blue-600"
                />
                <div>
                  <span className="font-medium text-blue-900">Razorpay Online Payment Enable करें</span>
                  <p className="text-xs text-blue-600">Parents app se online fee pay kar payenge</p>
                </div>
              </label>
            </div>

            {settings.razorpay_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <Label className="flex items-center gap-2">
                    Razorpay Key ID *
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Test/Live</span>
                  </Label>
                  <Input
                    value={settings.razorpay_key_id}
                    onChange={e => setSettings(s => ({ ...s, razorpay_key_id: e.target.value }))}
                    placeholder="rzp_live_xxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Razorpay Dashboard → Settings → API Keys se copy करें
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Razorpay Key Secret *
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">🔒 Secret</span>
                  </Label>
                  <Input
                    type="password"
                    value={settings.razorpay_key_secret}
                    onChange={e => setSettings(s => ({ ...s, razorpay_key_secret: e.target.value }))}
                    placeholder="••••••••••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ye secret rahega, kisi ko share mat karna
                  </p>
                </div>
                <div className="md:col-span-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Razorpay Account नहीं है?</p>
                      <p className="text-xs">
                        <a 
                          href="https://razorpay.com/sign-up/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          razorpay.com/sign-up
                        </a>
                        {" "}पर जाकर free account बनाएं। 2% transaction fee lagta hai (GST extra).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cash Collection Settings */}
          <div className="bg-white rounded-xl border shadow-sm p-5 border-l-4 border-l-green-500">
            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
              💵 Cash Collection Settings
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              School me cash lene ke liye settings. Kon cash le sakta hai ye define करें।
            </p>
            
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-green-50 border border-green-200">
                <input
                  type="checkbox"
                  checked={settings.cash_collection_enabled}
                  onChange={e => setSettings(s => ({ ...s, cash_collection_enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-green-300 text-green-600"
                />
                <div>
                  <span className="font-medium text-green-900">Cash Collection Enable</span>
                  <p className="text-xs text-green-600">School counter par cash payment allow करें</p>
                </div>
              </label>
            </div>
            
            {settings.cash_collection_enabled && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  ℹ️ Cash collectors Team Management से manage होंगे
                </p>
                <p className="text-xs text-gray-500">
                  Team Management → Employee → "Can Collect Cash" permission enable करें
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="px-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* Pending Verification Tab */}
      {activeTab === 'verify' && (
        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h3 className="font-medium text-lg">कोई pending payment नहीं</h3>
              <p className="text-gray-500 text-sm">All payments have been verified</p>
            </div>
          ) : (
            pendingPayments.map(payment => (
              <div key={payment.id} className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">
                      ₹{payment.amount?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{payment.student_name}</span> • {payment.class_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      <div>Payment Mode: <span className="font-medium">{payment.payment_mode?.toUpperCase()}</span></div>
                      <div>Transaction ID: <span className="font-mono">{payment.transaction_id}</span></div>
                      {payment.payer_upi_id && <div>From: {payment.payer_upi_id}</div>}
                      <div>Date: {new Date(payment.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleVerifyPayment(payment.id, 'reject')}
                      disabled={verifying === payment.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerifyPayment(payment.id, 'approve')}
                      disabled={verifying === payment.id}
                    >
                      {verifying === payment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
