import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  School, MapPin, Phone, Globe, Building2, Users,
  Image, Share2, Check, ChevronRight, ChevronLeft,
  Loader2, Save, SkipForward, Upload, Camera, X,
  Wallet, CreditCard, Bell, Calendar as CalendarIcon,
  FileText, Smartphone, Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 'basic', title: 'Basic Information', subtitle: 'School ka naam aur address', icon: School },
  { id: 'contact', title: 'Contact & Registration', subtitle: 'Phone, email aur registration details', icon: Phone },
  { id: 'details', title: 'School Details', subtitle: 'Type, medium aur capacity', icon: Building2 },
  { id: 'leadership', title: 'Leadership & About', subtitle: 'Principal aur school ki jaankari', icon: Users },
  { id: 'logo', title: 'Logo & Branding Settings', subtitle: 'School logo upload aur apply settings', icon: Image },
  { id: 'payment', title: 'Payment Settings', subtitle: 'Razorpay, UPI aur bank details', icon: Wallet },
  { id: 'social', title: 'Social Media', subtitle: 'Social media links', icon: Share2 },
];

export default function SetupWizard() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', state: '', pincode: '', board_type: 'CBSE',
    phone: '', email: '', website_url: '', registration_number: '', established_year: '',
    school_type: '', medium: '', shift: '', total_capacity: '', motto: '',
    principal_name: '', principal_message: '', about_school: '', vision: '', mission: '',
    logo_url: '',
    logo_apply_to: {
      idCards: true, notices: true, calendar: true, appHeader: true,
      certificates: true, feeBills: true, appIcon: true
    },
    razorpay_key_id: '', razorpay_key_secret: '', upi_id: '', payment_mode: '',
    bank_name: '', bank_account_no: '', bank_ifsc: '', bank_branch: '',
    facebook_url: '', instagram_url: '', youtube_url: '', whatsapp_number: ''
  });

  useEffect(() => {
    if (schoolId) fetchSchoolData();
    else setLoading(false);
  }, [schoolId]);

  const fetchSchoolData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        const d = res.data;
        setFormData(prev => ({
          ...prev,
          name: d.name || '', address: d.address || '', city: d.city || '', state: d.state || '',
          pincode: d.pincode || '', board_type: d.board_type || 'CBSE',
          phone: d.phone || '', email: d.email || '', website_url: d.website_url || '',
          registration_number: d.registration_number || '', established_year: d.established_year || '',
          school_type: d.school_type || '', medium: d.medium || '', shift: d.shift || '',
          total_capacity: d.total_capacity || '', motto: d.motto || '',
          principal_name: d.principal_name || '', principal_message: d.principal_message || '',
          about_school: d.about_school || '', vision: d.vision || '', mission: d.mission || '',
          logo_url: d.logo_url || '',
          logo_apply_to: d.logo_apply_to || {
            idCards: true, notices: true, calendar: true, appHeader: true,
            certificates: true, feeBills: true, appIcon: true
          },
          razorpay_key_id: d.razorpay_key_id || '', razorpay_key_secret: d.razorpay_key_secret || '',
          upi_id: d.upi_id || '', payment_mode: d.payment_mode || '',
          bank_name: d.bank_name || '', bank_account_no: d.bank_account_no || '',
          bank_ifsc: d.bank_ifsc || '', bank_branch: d.bank_branch || '',
          facebook_url: d.facebook_url || '', instagram_url: d.instagram_url || '',
          youtube_url: d.youtube_url || '', whatsapp_number: d.whatsapp_number || ''
        }));
        if (d.logo_url) setLogoPreview(d.logo_url);
      }
    } catch (err) {
      console.error('Error loading school data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size should be less than 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setFormData(prev => ({ ...prev, logo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const toggleApplyTo = (key) => {
    setFormData(prev => ({
      ...prev,
      logo_apply_to: {
        ...prev.logo_apply_to,
        [key]: !prev.logo_apply_to[key]
      }
    }));
  };

  const saveCurrentStep = async () => {
    if (!schoolId) { toast.error('No school selected'); return false; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/schools/${schoolId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Saved successfully!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentStep();
    if (saved && currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else if (saved && currentStep === STEPS.length - 1) {
      toast.success('School setup complete!');
      navigate('/app/settings');
    }
  };

  const handlePrev = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };
  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else navigate('/app/settings');
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  const renderField = (label, name, type = 'text', placeholder = '', options = null) => (
    <div>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {options ? (
        <select name={name} value={formData[name]} onChange={handleChange}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder}
          rows={3} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
      ) : (
        <Input name={name} type={type} value={formData[name]} onChange={handleChange} placeholder={placeholder}
          className="mt-1" />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">School Setup Wizard</h1>
        <p className="text-slate-500 mt-1">Step-by-step apne school ki details bharein</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <button key={step.id} onClick={() => setCurrentStep(idx)}
                className={`flex flex-col items-center gap-1 transition-all ${idx <= currentStep ? 'text-blue-600' : 'text-slate-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < currentStep ? 'bg-blue-600 text-white' : idx === currentStep ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  {idx < currentStep ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-medium hidden md:block">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="w-6 h-6 text-blue-600" />; })()}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{STEPS[currentStep].title}</h2>
            <p className="text-sm text-slate-500">{STEPS[currentStep].subtitle}</p>
          </div>
        </div>

        {currentStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('School Name *', 'name', 'text', 'Enter school name')}
            {renderField('Board Type', 'board_type', 'text', '', [
              { value: 'CBSE', label: 'CBSE' }, { value: 'ICSE', label: 'ICSE' },
              { value: 'State Board', label: 'State Board' }, { value: 'IB', label: 'IB' },
              { value: 'IGCSE', label: 'IGCSE' }, { value: 'Other', label: 'Other' }
            ])}
            <div className="md:col-span-2">{renderField('Address', 'address', 'text', 'Full school address')}</div>
            {renderField('City', 'city', 'text', 'City name')}
            {renderField('State', 'state', 'text', 'State name')}
            {renderField('Pincode', 'pincode', 'text', '000000')}
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Phone Number', 'phone', 'tel', '9876543210')}
            {renderField('Email', 'email', 'email', 'school@example.com')}
            {renderField('Website URL', 'website_url', 'url', 'https://www.school.com')}
            {renderField('Registration Number', 'registration_number', 'text', 'e.g., MPBOARD/2012/12345')}
            {renderField('Established Year', 'established_year', 'number', '2000')}
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('School Type', 'school_type', 'text', '', [
              { value: '', label: 'Select Type' }, { value: 'Co-Ed', label: 'Co-Education' },
              { value: 'Boys', label: 'Boys Only' }, { value: 'Girls', label: 'Girls Only' }
            ])}
            {renderField('Medium', 'medium', 'text', '', [
              { value: '', label: 'Select Medium' }, { value: 'Hindi', label: 'Hindi Medium' },
              { value: 'English', label: 'English Medium' }, { value: 'Both', label: 'Hindi + English' }
            ])}
            {renderField('Shift', 'shift', 'text', '', [
              { value: '', label: 'Select Shift' }, { value: 'Morning', label: 'Morning' },
              { value: 'Afternoon', label: 'Afternoon' }, { value: 'Both', label: 'Both Shifts' }
            ])}
            {renderField('Total Capacity', 'total_capacity', 'number', 'e.g., 500')}
            <div className="md:col-span-2">{renderField('School Motto', 'motto', 'text', 'Your school motto or tagline')}</div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Principal Name', 'principal_name', 'text', 'Principal name')}
            </div>
            {renderField('Principal Message', 'principal_message', 'textarea', 'A message from the principal...')}
            {renderField('About School', 'about_school', 'textarea', 'Brief description of the school...')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Vision', 'vision', 'textarea', 'School vision statement...')}
              {renderField('Mission', 'mission', 'textarea', 'School mission statement...')}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50">
                  {logoPreview ? (
                    <div className="relative w-full h-full">
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                      <button onClick={() => { setLogoPreview(null); setFormData(prev => ({ ...prev, logo_url: '' })); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                      <span className="text-xs text-slate-400">No Logo</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" /> {logoPreview ? 'Change Logo' : 'Upload School Logo'}
                </Button>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-0.5 text-blue-600">
                    <li>PNG/JPG format, Max 5MB</li>
                    <li>Square logo best results deta hai</li>
                    <li>Logo header, ID cards aur notices mein use hoga</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Logo Apply Settings</h3>
              <p className="text-xs text-slate-500 mb-3">Select where the logo should appear</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'idCards', label: 'Set as ID Cards watermark', icon: CreditCard },
                  { key: 'notices', label: 'Set on Notices', icon: Bell },
                  { key: 'calendar', label: 'Set on Calendar', icon: CalendarIcon },
                  { key: 'appHeader', label: 'Set on App Header (School Name ke saath)', icon: SettingsIcon },
                  { key: 'certificates', label: 'Set on Certificates', icon: FileText },
                  { key: 'feeBills', label: 'Set on Fee Bills', icon: FileText },
                  { key: 'appIcon', label: 'Set as App Icon', icon: Smartphone }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleApplyTo(item.key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        formData.logo_apply_to[item.key]
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {formData.logo_apply_to[item.key] ? (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Icon className="w-4 h-4 shrink-0" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Razorpay Key ID', 'razorpay_key_id', 'text', 'rzp_live_xxxxxx')}
              {renderField('Razorpay Key Secret', 'razorpay_key_secret', 'password', '••••••••')}
              {renderField('UPI ID', 'upi_id', 'text', 'school@upi')}
              {renderField('Payment Mode', 'payment_mode', 'text', '', [
                { value: '', label: 'Select Payment Mode' },
                { value: 'online', label: 'Online Only' },
                { value: 'cash', label: 'Cash Only' },
                { value: 'both', label: 'Both Online & Cash' }
              ])}
              {renderField('Bank Name', 'bank_name', 'text', 'e.g., State Bank of India')}
              {renderField('Bank Account Number', 'bank_account_no', 'text', 'Account number')}
              {renderField('IFSC Code', 'bank_ifsc', 'text', 'e.g., SBIN0001234')}
              {renderField('Branch Name', 'bank_branch', 'text', 'Branch name')}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Note:</p>
              <p>Payment settings will be used in Fee Management for online fee collection via Razorpay. UPI ID will be shown to parents for direct payment.</p>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Facebook URL', 'facebook_url', 'url', 'https://facebook.com/school')}
            {renderField('Instagram URL', 'instagram_url', 'url', 'https://instagram.com/school')}
            {renderField('YouTube URL', 'youtube_url', 'url', 'https://youtube.com/school')}
            {renderField('WhatsApp Number', 'whatsapp_number', 'tel', '9876543210')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="text-slate-500">
          <SkipForward className="w-4 h-4 mr-1" /> Skip
        </Button>
        <Button onClick={handleNext} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {currentStep === STEPS.length - 1 ? 'Finish Setup' : 'Save & Next'}
          {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
