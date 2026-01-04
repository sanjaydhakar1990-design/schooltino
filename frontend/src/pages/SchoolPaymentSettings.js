import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Building2, CreditCard, Smartphone, QrCode, Save, 
  Loader2, CheckCircle, AlertCircle, Copy, Eye, EyeOff,
  IndianRupee, Shield, Info
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SchoolPaymentSettings() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  
  const [settings, setSettings] = useState({
    upi_id: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    razorpay_key_id: ''
  });

  const schoolId = user?.school_id || 'school1';

  useEffect(() => {
    fetchSchoolSettings();
  }, [schoolId]);

  const fetchSchoolSettings = async () => {
    try {
      setLoading(true);
      // Get school details which contain payment settings
      const res = await fetch(`${API}/api/schools/${schoolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const school = await res.json();
        setSettings({
          upi_id: school.upi_id || '',
          bank_name: school.bank_name || '',
          account_number: school.account_number || '',
          ifsc_code: school.ifsc_code || '',
          account_holder_name: school.account_holder_name || '',
          razorpay_key_id: school.razorpay_key_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.upi_id && !settings.account_number) {
      toast.error('UPI ID ya Bank Account number dalna zaroori hai');
      return;
    }

    setSaving(true);
    try {
      const params = new URLSearchParams();
      params.append('school_id', schoolId);
      if (settings.upi_id) params.append('upi_id', settings.upi_id);
      if (settings.bank_name) params.append('bank_name', settings.bank_name);
      if (settings.account_number) params.append('account_number', settings.account_number);
      if (settings.ifsc_code) params.append('ifsc_code', settings.ifsc_code);
      if (settings.account_holder_name) params.append('account_holder_name', settings.account_holder_name);
      if (settings.razorpay_key_id) params.append('razorpay_key_id', settings.razorpay_key_id);

      const res = await fetch(`${API}/api/fee-payment/school-settings?${params.toString()}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Payment settings saved! ✅ Ab students isi account me payment karenge');
      } else {
        toast.error('Settings save nahi ho paye');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" data-testid="school-payment-settings">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            School Payment Settings
          </h1>
          <p className="text-slate-500 mt-2 ml-15">
            Yahan apne school ki bank details aur UPI ID dalein. Students isi account me fee pay karenge.
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Important!</p>
                <p className="text-sm text-amber-700">
                  Ye details students ko payment karte waqt dikhegi. Galat details dalne se payment wrong account me ja sakta hai.
                  Carefully verify karke hi save karein.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UPI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                UPI Payment Settings
              </CardTitle>
              <CardDescription>
                Students UPI se direct payment kar sakenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  School UPI ID *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={settings.upi_id}
                    onChange={(e) => setSettings(s => ({ ...s, upi_id: e.target.value }))}
                    placeholder="schoolname@upi"
                    className="flex-1"
                    data-testid="upi-id-input"
                  />
                  {settings.upi_id && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(settings.upi_id, 'UPI ID')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Example: yourschool@paytm, school@okaxis, school@ybl
                </p>
              </div>

              {/* UPI Preview */}
              {settings.upi_id && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-2">Preview - Students ko ye dikhega:</p>
                  <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">UPI ID</p>
                        <p className="text-sm text-green-600">{settings.upi_id}</p>
                      </div>
                    </div>
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Bank Account Details
              </CardTitle>
              <CardDescription>
                Net Banking aur Card payments ke liye
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Bank Name
                </label>
                <Input
                  value={settings.bank_name}
                  onChange={(e) => setSettings(s => ({ ...s, bank_name: e.target.value }))}
                  placeholder="State Bank of India"
                  data-testid="bank-name-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Account Holder Name
                </label>
                <Input
                  value={settings.account_holder_name}
                  onChange={(e) => setSettings(s => ({ ...s, account_holder_name: e.target.value }))}
                  placeholder="ABC School Trust"
                  data-testid="account-holder-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Account Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showAccountNumber ? "text" : "password"}
                      value={settings.account_number}
                      onChange={(e) => setSettings(s => ({ ...s, account_number: e.target.value }))}
                      placeholder="1234567890123"
                      data-testid="account-number-input"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                  >
                    {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  IFSC Code
                </label>
                <Input
                  value={settings.ifsc_code}
                  onChange={(e) => setSettings(s => ({ ...s, ifsc_code: e.target.value.toUpperCase() }))}
                  placeholder="SBIN0001234"
                  data-testid="ifsc-input"
                />
              </div>

              {/* Bank Preview */}
              {settings.account_number && settings.bank_name && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-2">Preview - Receipt pe ye dikhega:</p>
                  <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-medium">{settings.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">A/C Name:</span>
                      <span className="font-medium">{settings.account_holder_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">A/C No:</span>
                      <span className="font-medium font-mono">
                        {settings.account_number.slice(0, 4)}****{settings.account_number.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IFSC:</span>
                      <span className="font-medium">{settings.ifsc_code || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Razorpay Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Razorpay Integration (Optional)
              </CardTitle>
              <CardDescription>
                Credit/Debit Card payments ke liye Razorpay key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Razorpay Key ID
                  </label>
                  <Input
                    value={settings.razorpay_key_id}
                    onChange={(e) => setSettings(s => ({ ...s, razorpay_key_id: e.target.value }))}
                    placeholder="rzp_live_xxxxxxxxxx"
                    data-testid="razorpay-key-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Razorpay Dashboard se key copy karein
                  </p>
                </div>
                <div className="flex items-end">
                  <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700">
                      Razorpay account nahi hai? <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">razorpay.com</a> pe create karein
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={fetchSchoolSettings}>
            Reset
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]"
            data-testid="save-settings-button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-6 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-1">Security Note:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bank details encrypted store hote hain</li>
                  <li>Students ko partial account number hi dikhta hai</li>
                  <li>Payment directly school account me jaata hai</li>
                  <li>Koi bhi third-party cut nahi leta (except payment gateway charges)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
