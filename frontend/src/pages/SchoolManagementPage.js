/**
 * Unified School Management Page
 * - School Profile (Logo, Details, Contact)
 * - Payment Settings (UPI, Bank Account)
 * - Academic Settings (Timing, Session)
 * - Receipt & Invoice Settings (Signature, Seal, AI Seal)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Building, Save, Loader2, Upload, Phone, Mail, Globe, MapPin,
  CreditCard, Wallet, Clock, Calendar, Receipt, Image, CheckCircle,
  Settings, FileText, Camera, AlertCircle, Sparkles, PenTool, Stamp
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SchoolManagementPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [generatingAISeal, setGeneratingAISeal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingBgSignature, setRemovingBgSignature] = useState(false);
  const [removingBgSeal, setRemovingBgSeal] = useState(false);
  
  // School Profile
  const [school, setSchool] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website_url: '',
    logo_url: '',
    motto: '',
    principal_name: '',
    registration_number: '',
    established_year: '',
    board_type: 'RBSE',
    signature_url: '',
    seal_url: '',
    // Watermark Settings
    watermark_enabled: true,
    watermark_opacity: 0.08,
    watermark_size: 'large',
    watermark_position: 'center',
    watermark_apply: {
      notices: true,
      admit_cards: true,
      calendar: true,
      fee_receipts: true,
      reports: false,
      certificates: true
    }
  });
  
  // AI Seal Settings
  const [aiSealConfig, setAiSealConfig] = useState({
    seal_shape: 'circular',
    color_scheme: 'blue'
  });
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
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
    authorized_signatory_name: '',
    authorized_signatory_designation: ''
  });
  
  // Academic Settings
  const [academicSettings, setAcademicSettings] = useState({
    school_start_time: '08:00',
    school_end_time: '14:00',
    late_grace_period: 15,
    current_session: '2024-25',
    board: 'RBSE',
    state: 'Rajasthan',
    attendance_mode: 'auto'
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch school profile
      const schoolRes = await axios.get(`${API}/api/schools/${schoolId}`, { headers }).catch(() => ({ data: null }));
      if (schoolRes.data) {
        setSchool(prev => ({ ...prev, ...schoolRes.data }));
      }
      
      // Fetch payment settings
      const paymentRes = await axios.get(`${API}/api/school/payment-settings?school_id=${schoolId}`, { headers }).catch(() => ({ data: {} }));
      if (paymentRes.data) {
        setPaymentSettings(prev => ({ ...prev, ...paymentRes.data }));
      }
      
      // Fetch academic settings
      const academicRes = await axios.get(`${API}/api/school/settings?school_id=${schoolId}`, { headers }).catch(() => ({ data: {} }));
      if (academicRes.data) {
        setAcademicSettings(prev => ({ ...prev, ...academicRes.data }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // First, try AI background removal
        try {
          const response = await axios.post(`${API}/api/school/ai-remove-background`, {
            school_id: schoolId,
            image_data: base64Image,
            image_type: 'logo'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data?.processed_image) {
            setSchool(prev => ({ ...prev, logo_url: response.data.processed_image }));
            toast.success('✨ Logo uploaded with AI background removal!');
          } else {
            // Fallback to original image
            setSchool(prev => ({ ...prev, logo_url: base64Image }));
            toast.success('Logo uploaded!');
          }
        } catch (aiError) {
          console.log('AI processing not available, using original:', aiError);
          setSchool(prev => ({ ...prev, logo_url: base64Image }));
          toast.success('Logo uploaded!');
        }
        
        setUploadingLogo(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Logo upload failed');
      setUploadingLogo(false);
    }
  };
  
  // AI Background Removal for Logo
  const handleAIRemoveLogoBg = async () => {
    if (!school.logo_url) {
      toast.error('Pehle logo upload karein');
      return;
    }
    
    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/school/ai-remove-background`, {
        school_id: schoolId,
        image_data: school.logo_url,
        image_type: 'logo'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.processed_image) {
        setSchool(prev => ({ ...prev, logo_url: response.data.processed_image }));
        toast.success('✨ Background removed successfully!');
      } else {
        toast.error('Background removal failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'AI processing failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/api/school/upload-signature`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.url) {
        setSchool(prev => ({ ...prev, signature_url: response.data.url }));
        toast.success('Signature uploaded!');
      }
    } catch (error) {
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchool(prev => ({ ...prev, signature_url: reader.result }));
        toast.success('Signature uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/api/school/upload-seal`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.url) {
        setSchool(prev => ({ ...prev, seal_url: response.data.url }));
        toast.success('Seal uploaded!');
      }
    } catch (error) {
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchool(prev => ({ ...prev, seal_url: reader.result }));
        toast.success('Seal uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAISeal = async () => {
    if (!school.name) {
      toast.error('पहले School का नाम डालें');
      return;
    }
    
    setGeneratingAISeal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/school/generate-ai-seal`, {
        school_name: school.name,
        school_motto: school.motto || '',
        seal_shape: aiSealConfig.seal_shape,
        color_scheme: aiSealConfig.color_scheme
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.seal_url) {
        setSchool(prev => ({ ...prev, seal_url: response.data.seal_url }));
        toast.success('AI Seal generated! 🎉');
      } else {
        toast.error(response.data.message || 'Seal generate नहीं हो पाया');
      }
    } catch (error) {
      toast.error('AI Seal generation में समस्या');
    } finally {
      setGeneratingAISeal(false);
    }
  };

  // AI Background Remover for Signature
  const handleAISignatureRemoveBg = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setRemovingBgSignature(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', 'signature');
      
      toast.info('AI Background Remove कर रहा है... 🪄');
      
      const response = await axios.post(`${API}/api/school/ai-remove-background`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds for AI processing
      });
      
      if (response.data.success && response.data.url) {
        setSchool(prev => ({ ...prev, signature_url: response.data.url }));
        toast.success('AI ने Signature का background हटा दिया! ✨');
      } else {
        toast.error(response.data.message || 'Background remove नहीं हो पाया');
      }
    } catch (error) {
      console.error('AI Signature BG Remove error:', error);
      toast.error('AI Background Remove में समस्या');
    } finally {
      setRemovingBgSignature(false);
    }
  };

  // AI Background Remover for Seal
  const handleAISealRemoveBg = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setRemovingBgSeal(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', 'seal');
      
      toast.info('AI Background Remove कर रहा है... 🪄');
      
      const response = await axios.post(`${API}/api/school/ai-remove-background`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds for AI processing
      });
      
      if (response.data.success && response.data.url) {
        setSchool(prev => ({ ...prev, seal_url: response.data.url }));
        toast.success('AI ने Seal का background हटा दिया! ✨');
      } else {
        toast.error(response.data.message || 'Background remove नहीं हो पाया');
      }
    } catch (error) {
      console.error('AI Seal BG Remove error:', error);
      toast.error('AI Background Remove में समस्या');
    } finally {
      setRemovingBgSeal(false);
    }
  };

  const saveSchoolProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/schools/${schoolId}`, school, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('School profile saved!');
    } catch (error) {
      toast.error('Profile save करने में समस्या');
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/school/payment-settings`, {
        school_id: schoolId,
        ...paymentSettings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment settings saved!');
    } catch (error) {
      toast.error('Payment settings save करने में समस्या');
    } finally {
      setSaving(false);
    }
  };

  const saveAcademicSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/school/settings`, {
        school_id: schoolId,
        ...academicSettings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Academic settings saved!');
    } catch (error) {
      toast.error('Academic settings save करने में समस्या');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'profile') await saveSchoolProfile();
    else if (activeTab === 'payment') await savePaymentSettings();
    else if (activeTab === 'academic') await saveAcademicSettings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'School Profile', icon: Building },
    { id: 'payment', label: 'Payment Settings', icon: CreditCard },
    { id: 'academic', label: 'Academic Settings', icon: Calendar },
    { id: 'receipt', label: 'Receipt Settings', icon: Receipt },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          School Management
        </h1>
        <p className="text-gray-500 text-sm">School की सभी settings एक जगह manage करें</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 relative">
                  {school.logo_url ? (
                    <>
                      <img src={school.logo_url} alt="School Logo" className="w-full h-full object-contain" />
                      {/* Clear Logo Button */}
                      <button 
                        onClick={() => setSchool(s => ({ ...s, logo_url: '' }))}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <Camera className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                
                {/* Upload Button */}
                <label className="mt-2 block">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button variant="outline" size="sm" className="w-full" disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    {school.logo_url ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </label>
                
                {/* AI Background Remove Button */}
                {school.logo_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={handleAIRemoveLogoBg}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    ✨ AI Remove BG
                  </Button>
                )}
                
                {/* Logo Tips */}
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  PNG/JPG • Max 2MB<br/>
                  AI auto-remove background
                </p>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>School Name *</Label>
                  <Input
                    value={school.name}
                    onChange={e => setSchool(s => ({ ...s, name: e.target.value }))}
                    placeholder="ABC Public School"
                  />
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input
                    value={school.registration_number}
                    onChange={e => setSchool(s => ({ ...s, registration_number: e.target.value }))}
                    placeholder="RBSE/2024/12345"
                  />
                </div>
                <div>
                  <Label>Established Year</Label>
                  <Input
                    type="number"
                    value={school.established_year}
                    onChange={e => setSchool(s => ({ ...s, established_year: e.target.value }))}
                    placeholder="2010"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label><MapPin className="w-4 h-4 inline mr-1" />Address</Label>
                <Input
                  value={school.address}
                  onChange={e => setSchool(s => ({ ...s, address: e.target.value }))}
                  placeholder="123, Main Street, Near Bus Stand"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={school.city}
                  onChange={e => setSchool(s => ({ ...s, city: e.target.value }))}
                  placeholder="Jaipur"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={school.state}
                  onChange={e => setSchool(s => ({ ...s, state: e.target.value }))}
                  placeholder="Rajasthan"
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={school.pincode}
                  onChange={e => setSchool(s => ({ ...s, pincode: e.target.value }))}
                  placeholder="302001"
                />
              </div>
              <div>
                <Label><Phone className="w-4 h-4 inline mr-1" />Phone</Label>
                <Input
                  value={school.phone}
                  onChange={e => setSchool(s => ({ ...s, phone: e.target.value }))}
                  placeholder="0141-2345678"
                />
              </div>
              <div>
                <Label><Mail className="w-4 h-4 inline mr-1" />Email</Label>
                <Input
                  type="email"
                  value={school.email}
                  onChange={e => setSchool(s => ({ ...s, email: e.target.value }))}
                  placeholder="info@school.com"
                />
              </div>
              <div>
                <Label><Globe className="w-4 h-4 inline mr-1" />Website</Label>
                <Input
                  value={school.website_url}
                  onChange={e => setSchool(s => ({ ...s, website_url: e.target.value }))}
                  placeholder="www.school.com"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Principal Name</Label>
                <Input
                  value={school.principal_name}
                  onChange={e => setSchool(s => ({ ...s, principal_name: e.target.value }))}
                  placeholder="Dr. Ram Kumar"
                />
              </div>
              <div>
                <Label>Board Type</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={school.board_type}
                  onChange={e => setSchool(s => ({ ...s, board_type: e.target.value }))}
                >
                  <option value="RBSE">RBSE (Rajasthan Board)</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="MPBSE">MPBSE (MP Board)</option>
                  <option value="State">Other State Board</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>School Motto (टैगलाइन)</Label>
                <Input
                  value={school.motto}
                  onChange={e => setSchool(s => ({ ...s, motto: e.target.value }))}
                  placeholder="शिक्षा ही सर्वोत्तम धन है"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Important!</p>
                <p className="text-sm text-amber-700">ये details students को payment करते वक्त दिखेंगी। सही details डालें।</p>
              </div>
            </div>

            {/* UPI Settings */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                UPI Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>GPay Number</Label>
                  <Input
                    value={paymentSettings.gpay_number}
                    onChange={e => setPaymentSettings(s => ({ ...s, gpay_number: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <Label>Paytm Number</Label>
                  <Input
                    value={paymentSettings.paytm_number}
                    onChange={e => setPaymentSettings(s => ({ ...s, paytm_number: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <Label>PhonePe Number</Label>
                  <Input
                    value={paymentSettings.phonepe_number}
                    onChange={e => setPaymentSettings(s => ({ ...s, phonepe_number: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <Label>UPI ID</Label>
                  <Input
                    value={paymentSettings.upi_id}
                    onChange={e => setPaymentSettings(s => ({ ...s, upi_id: e.target.value }))}
                    placeholder="school@upi"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>QR Code URL (Optional)</Label>
                  <Input
                    value={paymentSettings.qr_code_url}
                    onChange={e => setPaymentSettings(s => ({ ...s, qr_code_url: e.target.value }))}
                    placeholder="Upload QR code somewhere and paste URL"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Bank Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={paymentSettings.bank_name}
                    onChange={e => setPaymentSettings(s => ({ ...s, bank_name: e.target.value }))}
                    placeholder="State Bank of India"
                  />
                </div>
                <div>
                  <Label>Account Holder Name</Label>
                  <Input
                    value={paymentSettings.account_holder_name}
                    onChange={e => setPaymentSettings(s => ({ ...s, account_holder_name: e.target.value }))}
                    placeholder="School Trust Name"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={paymentSettings.account_number}
                    onChange={e => setPaymentSettings(s => ({ ...s, account_number: e.target.value }))}
                    placeholder="1234567890123"
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={paymentSettings.ifsc_code}
                    onChange={e => setPaymentSettings(s => ({ ...s, ifsc_code: e.target.value }))}
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label><Clock className="w-4 h-4 inline mr-1" />School Start Time</Label>
                <Input
                  type="time"
                  value={academicSettings.school_start_time}
                  onChange={e => setAcademicSettings(s => ({ ...s, school_start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label><Clock className="w-4 h-4 inline mr-1" />School End Time</Label>
                <Input
                  type="time"
                  value={academicSettings.school_end_time}
                  onChange={e => setAcademicSettings(s => ({ ...s, school_end_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Late Grace Period (minutes)</Label>
                <Input
                  type="number"
                  value={academicSettings.late_grace_period}
                  onChange={e => setAcademicSettings(s => ({ ...s, late_grace_period: parseInt(e.target.value) || 15 }))}
                />
              </div>
              <div>
                <Label>Current Session</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={academicSettings.current_session}
                  onChange={e => setAcademicSettings(s => ({ ...s, current_session: e.target.value }))}
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
              <div>
                <Label>Board</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={academicSettings.board}
                  onChange={e => setAcademicSettings(s => ({ ...s, board: e.target.value }))}
                >
                  <option value="RBSE">RBSE</option>
                  <option value="CBSE">CBSE</option>
                  <option value="MPBSE">MPBSE</option>
                  <option value="ICSE">ICSE</option>
                </select>
              </div>
              <div>
                <Label>State</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={academicSettings.state}
                  onChange={e => setAcademicSettings(s => ({ ...s, state: e.target.value }))}
                >
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>
              <div>
                <Label>Attendance Mode</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={academicSettings.attendance_mode}
                  onChange={e => setAcademicSettings(s => ({ ...s, attendance_mode: e.target.value }))}
                >
                  <option value="auto">Auto (CCTV/Biometric)</option>
                  <option value="manual">Manual</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Tab */}
        {activeTab === 'receipt' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Receipt Number Prefix</Label>
                <Input
                  value={paymentSettings.receipt_prefix}
                  onChange={e => setPaymentSettings(s => ({ ...s, receipt_prefix: e.target.value }))}
                  placeholder="RCP"
                />
                <p className="text-xs text-gray-500 mt-1">Example: RCP-2026-000001</p>
              </div>
              <div>
                <Label>Authorized Signatory Name</Label>
                <Input
                  value={paymentSettings.authorized_signatory_name}
                  onChange={e => setPaymentSettings(s => ({ ...s, authorized_signatory_name: e.target.value }))}
                  placeholder="Principal Name"
                />
              </div>
              <div>
                <Label>Signatory Designation</Label>
                <Input
                  value={paymentSettings.authorized_signatory_designation}
                  onChange={e => setPaymentSettings(s => ({ ...s, authorized_signatory_designation: e.target.value }))}
                  placeholder="Principal / Director"
                />
              </div>
              <div>
                <Label>Receipt Footer Note</Label>
                <Input
                  value={paymentSettings.receipt_footer_note}
                  onChange={e => setPaymentSettings(s => ({ ...s, receipt_footer_note: e.target.value }))}
                  placeholder="Thank you for your payment"
                />
              </div>
            </div>

            {/* Signature & Seal Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-600" />
                Signature & Seal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Signature Upload */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="mb-3 block font-medium">Signature (हस्ताक्षर)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                      {school.signature_url ? (
                        <img src={school.signature_url} alt="Signature" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <PenTool className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <span><Upload className="w-4 h-4 mr-1" /> Upload Signature</span>
                        </Button>
                      </label>
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handleAISignatureRemoveBg} className="hidden" />
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
                          disabled={removingBgSignature}
                          asChild
                        >
                          <span>
                            {removingBgSignature ? (
                              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</>
                            ) : (
                              <><Sparkles className="w-4 h-4 mr-1" /> AI BG Remove</>
                            )}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500">कागज पर signature की photo upload करो, AI background हटा देगा</p>
                    </div>
                  </div>
                </div>

                {/* Seal Upload/Generate */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="mb-3 block font-medium">School Seal (मोहर)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-white overflow-hidden">
                      {school.seal_url ? (
                        <img src={school.seal_url} alt="Seal" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Stamp className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handleSealUpload} className="hidden" />
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <span><Upload className="w-4 h-4 mr-1" /> Upload Seal</span>
                        </Button>
                      </label>
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handleAISealRemoveBg} className="hidden" />
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
                          disabled={removingBgSeal}
                          asChild
                        >
                          <span>
                            {removingBgSeal ? (
                              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</>
                            ) : (
                              <><Sparkles className="w-4 h-4 mr-1" /> AI BG Remove</>
                            )}
                          </span>
                        </Button>
                      </label>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        onClick={generateAISeal}
                        disabled={generatingAISeal}
                      >
                        {generatingAISeal ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-1" /> AI से नई Seal बनाएं</>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* AI Seal Options */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">AI Seal Options:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="text-xs border rounded px-2 py-1"
                        value={aiSealConfig.seal_shape}
                        onChange={e => setAiSealConfig(c => ({ ...c, seal_shape: e.target.value }))}
                      >
                        <option value="circular">Circular (गोल)</option>
                        <option value="rectangular">Rectangular (आयत)</option>
                        <option value="shield">Shield (ढाल)</option>
                      </select>
                      <select 
                        className="text-xs border rounded px-2 py-1"
                        value={aiSealConfig.color_scheme}
                        onChange={e => setAiSealConfig(c => ({ ...c, color_scheme: e.target.value }))}
                      >
                        <option value="blue">Blue (नीला)</option>
                        <option value="red">Red (लाल)</option>
                        <option value="green">Green (हरा)</option>
                        <option value="gold">Gold (सुनहरा)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Preview with Signature & Seal */}
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Receipt Preview:</h4>
              <div className="bg-white p-4 rounded border text-sm max-w-md mx-auto">
                <div className="text-center border-b pb-3 mb-3">
                  {school.logo_url && <img src={school.logo_url} alt="" className="h-12 mx-auto mb-2" />}
                  <h3 className="font-bold">{school.name || 'School Name'}</h3>
                  <p className="text-xs text-gray-500">{school.address}</p>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span>Receipt No: {paymentSettings.receipt_prefix}-2026-000001</span>
                  <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div className="text-center py-4 border-y my-3">
                  <span className="text-2xl font-bold text-green-600">₹ 5,000</span>
                </div>
                <div className="text-center text-xs text-gray-500 mt-4">
                  {paymentSettings.receipt_footer_note || 'Thank you for your payment'}
                </div>
                
                {/* Signature & Seal on Receipt */}
                <div className="flex justify-between items-end mt-6 pt-4 border-t">
                  {/* Seal */}
                  <div className="text-center">
                    {school.seal_url ? (
                      <img src={school.seal_url} alt="Seal" className="w-16 h-16 object-contain opacity-80" />
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-xs text-gray-400">
                        Seal
                      </div>
                    )}
                  </div>
                  
                  {/* Signature */}
                  <div className="text-right">
                    {school.signature_url ? (
                      <img src={school.signature_url} alt="Signature" className="h-10 ml-auto mb-1" />
                    ) : (
                      <div className="text-xs border-b border-gray-400 w-24 mb-1">_____________</div>
                    )}
                    <div className="text-xs font-medium">{paymentSettings.authorized_signatory_name || 'Authorized Signatory'}</div>
                    <div className="text-xs text-gray-500">{paymentSettings.authorized_signatory_designation}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save {activeTab === 'profile' ? 'Profile' : activeTab === 'payment' ? 'Payment Settings' : activeTab === 'receipt' ? 'Receipt Settings' : 'Academic Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
