import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import { Settings as SettingsIcon, School, Globe, Plus, Loader2, Check, Upload, PenTool, Stamp, Image, Wallet, Sparkles, Camera, X, ToggleLeft, Link, Eye, EyeOff, Move, ZoomIn, RotateCcw, Save, CreditCard, FileText, Bell, Calendar as CalendarIcon, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '../components/ui/slider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, schoolId, selectSchool } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Sign & Seal states
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [sealUrl, setSealUrl] = useState(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const signatureInputRef = useRef(null);
  const sealInputRef = useRef(null);
  
  // School Logo states
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogoBg, setRemovingLogoBg] = useState(false);
  const logoInputRef = useRef(null);

  const [watermarkSettings, setWatermarkSettings] = useState({
    size: 50,
    opacity: 15,
    position: 'center',
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    enabled: true
  });

  const [applyTo, setApplyTo] = useState({
    idCards: true,
    notices: true,
    calendar: true,
    appHeader: true,
    certificates: true,
    feeBills: true,
    appIcon: true
  });

  const [savingWatermark, setSavingWatermark] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    board_type: 'CBSE',
    city: '',
    state: '',
    phone: '',
    email: ''
  });

  const MODULE_LIST = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'students', label: 'Students' },
    { key: 'staff', label: 'Staff' },
    { key: 'classes', label: 'Classes' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'timetable', label: 'Timetable' },
    { key: 'exams_reports', label: 'Exams & Reports' },
    { key: 'homework', label: 'Homework' },
    { key: 'digital_library', label: 'Digital Library' },
    { key: 'live_classes', label: 'Live Classes' },
    { key: 'fee_management', label: 'Fee Management' },
    { key: 'communication_hub', label: 'Communication Hub' },
    { key: 'transport', label: 'Transport' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'cctv', label: 'CCTV' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'ai_tools', label: 'AI Tools' },
    { key: 'analytics', label: 'Analytics' },
  ];

  const PORTALS = ['schooltino', 'teachtino', 'studytino'];
  const PORTAL_LABELS = { schooltino: 'Schooltino (Admin)', teachtino: 'TeachTino (Teachers)', studytino: 'StudyTino (Students)' };

  const defaultVisibility = () => {
    const settings = {};
    MODULE_LIST.forEach(m => {
      settings[m.key] = { schooltino: true, teachtino: true, studytino: true };
    });
    return settings;
  };

  const [moduleVisibility, setModuleVisibility] = useState(defaultVisibility);
  const [savingModules, setSavingModules] = useState(false);

  const loadModuleVisibility = async () => {
    const defaults = defaultVisibility();
    let loaded = null;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings/module-visibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Object.keys(response.data).length > 0) {
        loaded = response.data;
      }
    } catch (error) {
      console.log('Backend module visibility not available, using local');
    }
    if (!loaded) {
      try {
        const saved = localStorage.getItem('module_visibility_settings');
        if (saved) loaded = JSON.parse(saved);
      } catch (e) {}
    }
    const merged = { ...defaults };
    if (loaded) {
      Object.keys(loaded).forEach(key => {
        merged[key] = { ...defaults[key], ...loaded[key] };
      });
    }
    setModuleVisibility(merged);
    localStorage.setItem('module_visibility_settings', JSON.stringify(merged));
    window.dispatchEvent(new Event('module_visibility_changed'));
  };

  const toggleModule = (moduleKey, portal) => {
    const newVisibility = {
      ...moduleVisibility,
      [moduleKey]: {
        ...moduleVisibility[moduleKey],
        [portal]: !moduleVisibility[moduleKey]?.[portal]
      }
    };
    setModuleVisibility(newVisibility);
    localStorage.setItem('module_visibility_settings', JSON.stringify(newVisibility));
    window.dispatchEvent(new Event('module_visibility_changed'));
  };

  const saveModuleVisibility = async () => {
    setSavingModules(true);
    try {
      localStorage.setItem('module_visibility_settings', JSON.stringify(moduleVisibility));
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings/module-visibility`, moduleVisibility, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Module settings saved! Sidebar updated.');
    } catch (error) {
      localStorage.setItem('module_visibility_settings', JSON.stringify(moduleVisibility));
      toast.success('Settings saved locally! Sidebar updated.');
    } finally {
      setSavingModules(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchSignatureSeal();
    fetchSchoolLogo();
    loadModuleVisibility();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get(`${API}/schools`);
      setSchools(response.data);
    } catch (error) {
      console.error('Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatureSeal = async () => {
    try {
      const response = await axios.get(`${API}/school/signature-seal`);
      setSignatureUrl(response.data.signature_url);
      setSealUrl(response.data.seal_url);
    } catch (error) {
      console.error('Failed to fetch signature/seal');
    }
  };

  const fetchSchoolLogo = async () => {
    try {
      if (!schoolId) return;
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.logo_url) {
        setLogoUrl(response.data.logo_url);
      }
      if (response.data?.watermark_settings) {
        setWatermarkSettings(prev => ({ ...prev, ...response.data.watermark_settings }));
      }
      if (response.data?.logo_apply_to) {
        setApplyTo(prev => ({ ...prev, ...response.data.logo_apply_to }));
      }
    } catch (error) {
      console.error('Failed to fetch school logo');
    }
  };

  // School Logo Upload with AI Background Removal
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        // Try AI background removal first
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(`${API}/school/ai-remove-background`, {
            school_id: schoolId,
            image_data: base64Image,
            image_type: 'logo'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data?.processed_image) {
            setLogoUrl(response.data.processed_image);
            // Also save to school
            await saveSchoolLogo(response.data.processed_image);
            toast.success('✨ Logo uploaded with AI background removal!');
          } else {
            setLogoUrl(base64Image);
            await saveSchoolLogo(base64Image);
            toast.success('Logo uploaded!');
          }
        } catch (aiError) {
          console.log('AI processing not available:', aiError);
          setLogoUrl(base64Image);
          await saveSchoolLogo(base64Image);
          toast.success('Logo uploaded!');
        }
        
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload logo');
      setUploadingLogo(false);
    }
  };

  const saveSchoolLogo = async (logoData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/schools/${schoolId}/update-logo`, {
        logo_url: logoData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        toast.success('✅ Logo saved successfully!');
        return true;
      }
    } catch (error) {
      console.error('Failed to save logo:', error);
      toast.error('Logo save failed');
      return false;
    }
  };

  const handleAIRemoveLogoBg = async () => {
    if (!logoUrl) {
      toast.error('Pehle logo upload karein');
      return;
    }
    
    setRemovingLogoBg(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/school/ai-remove-background-json`, {
        school_id: schoolId,
        image_data: logoUrl,
        image_type: 'logo'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.processed_image) {
        setLogoUrl(response.data.processed_image);
        await saveSchoolLogo(response.data.processed_image);
        toast.success('✨ Background removed successfully!');
      } else {
        toast.error('Background removal failed');
      }
    } catch (error) {
      console.error('AI Remove BG Error:', error);
      toast.error(error.response?.data?.detail || 'AI processing failed');
    } finally {
      setRemovingLogoBg(false);
    }
  };

  const saveWatermarkSettings = async () => {
    setSavingWatermark(true);
    try {
      const token = localStorage.getItem('token');
      if (logoUrl) {
        await axios.post(`${API}/schools/${schoolId}/update-logo`, {
          logo_url: logoUrl
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await axios.post(`${API}/schools/${schoolId}/watermark-settings`, {
        watermark_settings: watermarkSettings,
        logo_apply_to: applyTo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Watermark settings saved successfully!');
    } catch (error) {
      console.error('Save watermark error:', error);
      toast.error('Failed to save watermark settings');
    } finally {
      setSavingWatermark(false);
    }
  };

  const positionOptions = [
    { value: 'center', label: 'Center', icon: '⬛' },
    { value: 'top-left', label: 'Top Left', icon: '↖' },
    { value: 'top-right', label: 'Top Right', icon: '↗' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘' }
  ];

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }
    
    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/school/upload-signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSignatureUrl(response.data.url);
      toast.success('Signature uploaded successfully! ✍️');
    } catch (error) {
      toast.error('Failed to upload signature');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSealUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }
    
    setUploadingSeal(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/school/upload-seal`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSealUrl(response.data.url);
      toast.success('Seal uploaded successfully! 🔖');
    } catch (error) {
      toast.error('Failed to upload seal');
    } finally {
      setUploadingSeal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/schools`, formData);
      toast.success('School created successfully');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        board_type: 'CBSE',
        city: '',
        state: '',
        phone: '',
        email: ''
      });
      fetchSchools();
      // Auto select the new school
      selectSchool(response.data.id);
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectSchool = (id) => {
    selectSchool(id);
    toast.success('School selected');
  };

  return (
    <div className="space-y-8" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900">{t('settings')}</h1>
        <p className="text-slate-500 mt-1">Manage your preferences</p>
      </div>

      {/* User Info */}
      <div className="stat-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-900">{user?.name}</p>
            <p className="text-slate-500">{user?.email}</p>
            <span className="badge badge-info capitalize mt-1">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Language Setting */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Language / भाषा</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-6 py-3 rounded-xl border-2 transition-all ${
              language === 'en'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            data-testid="lang-en-btn"
          >
            <span className="font-medium">English</span>
            {language === 'en' && <Check className="w-4 h-4 inline ml-2" />}
          </button>
          <button
            onClick={() => changeLanguage('hi')}
            className={`px-6 py-3 rounded-xl border-2 transition-all ${
              language === 'hi'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            data-testid="lang-hi-btn"
          >
            <span className="font-medium">हिंदी</span>
            {language === 'hi' && <Check className="w-4 h-4 inline ml-2" />}
          </button>
          <button
            onClick={() => changeLanguage('hinglish')}
            className={`px-6 py-3 rounded-xl border-2 transition-all ${
              language === 'hinglish'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            data-testid="lang-hinglish-btn"
          >
            <span className="font-medium">Hinglish 🔄</span>
            {language === 'hinglish' && <Check className="w-4 h-4 inline ml-2" />}
          </button>
        </div>
      </div>

      {/* Payment & Logo Settings - Link to Setup Wizard */}
      {(user?.role === 'director' || user?.role === 'principal') && (
        <div className="stat-card border-2 border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Payment & Logo Settings</h2>
                <p className="text-sm text-slate-500">Payment & Logo settings are in the Setup Wizard</p>
              </div>
            </div>
            <a 
              href="/app/setup-wizard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Go to Setup Wizard
            </a>
          </div>
        </div>
      )}

      {/* School Logo & Watermark Settings - Director/Principal only */}
      {(user?.role === 'director' || user?.role === 'principal') && (
        <div className="stat-card border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">School Logo & Watermark Settings</h2>
            </div>
            <Button
              onClick={saveWatermarkSettings}
              disabled={savingWatermark}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="save-watermark-settings"
            >
              {savingWatermark ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Logo Upload & Apply Settings */}
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-600" />
                  School Logo
                </h3>

                <div className="flex flex-col items-center mb-4">
                  <div className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 relative">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain p-2" />
                        <button
                          onClick={() => setLogoUrl(null)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Image className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <span className="text-sm text-slate-400">No Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    variant="outline"
                    className="w-full"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </Button>

                  {logoUrl && (
                    <Button
                      onClick={handleAIRemoveLogoBg}
                      disabled={removingLogoBg || uploadingLogo}
                      variant="outline"
                      className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      {removingLogoBg ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI Remove Background
                    </Button>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  PNG/JPG format, Max 5MB. Square logos work best.
                </p>
              </div>

              {/* Logo Apply Settings */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Logo Apply Settings
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Select where the logo should appear
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'idCards', label: 'ID Cards', icon: CreditCard },
                    { key: 'notices', label: 'Notices', icon: Bell },
                    { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
                    { key: 'appHeader', label: 'App Header', icon: SettingsIcon },
                    { key: 'certificates', label: 'Certificates', icon: FileText },
                    { key: 'feeBills', label: 'Fee Bills', icon: FileText },
                    { key: 'appIcon', label: 'App Icon', icon: Smartphone }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setApplyTo(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          applyTo[item.key]
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                        data-testid={`apply-${item.key}`}
                      >
                        {applyTo[item.key] ? (
                          <Check className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Watermark Preview & Controls */}
            <div className="space-y-6">
              {/* Watermark Preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  Watermark Preview
                </h3>

                <div
                  className="w-full h-48 bg-white border-2 border-slate-200 rounded-lg relative overflow-hidden"
                  style={{ backgroundColor: '#f8fafc' }}
                >
                  <div className="absolute inset-0 p-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sample Document</div>
                    <div className="h-2 w-3/4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-1/2 bg-slate-200 rounded mb-4"></div>
                    <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                    <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                    <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                  </div>

                  {logoUrl && watermarkSettings.enabled && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        width: `${watermarkSettings.size}%`,
                        height: `${watermarkSettings.size}%`,
                        opacity: watermarkSettings.opacity / 100,
                        transform: `translate(${watermarkSettings.offsetX}%, ${watermarkSettings.offsetY}%) rotate(${watermarkSettings.rotation}deg)`,
                        ...(watermarkSettings.position === 'center' && { top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${watermarkSettings.offsetX}%, ${watermarkSettings.offsetY}%) rotate(${watermarkSettings.rotation}deg)` }),
                        ...(watermarkSettings.position === 'top-left' && { top: '10%', left: '10%' }),
                        ...(watermarkSettings.position === 'top-right' && { top: '10%', right: '10%' }),
                        ...(watermarkSettings.position === 'bottom-left' && { bottom: '10%', left: '10%' }),
                        ...(watermarkSettings.position === 'bottom-right' && { bottom: '10%', right: '10%' })
                      }}
                    >
                      <img src={logoUrl} alt="Watermark" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark Controls */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Watermark Controls
                  </h3>
                  <button
                    onClick={() => setWatermarkSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      watermarkSettings.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {watermarkSettings.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {watermarkSettings.enabled ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-slate-500" />
                        Size
                      </Label>
                      <span className="text-sm font-medium text-indigo-600">{watermarkSettings.size}%</span>
                    </div>
                    <Slider
                      value={[watermarkSettings.size]}
                      onValueChange={(v) => setWatermarkSettings(prev => ({ ...prev, size: v[0] }))}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-500" />
                        Opacity / Visibility
                      </Label>
                      <span className="text-sm font-medium text-indigo-600">{watermarkSettings.opacity}%</span>
                    </div>
                    <Slider
                      value={[watermarkSettings.opacity]}
                      onValueChange={(v) => setWatermarkSettings(prev => ({ ...prev, opacity: v[0] }))}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Move className="w-4 h-4 text-slate-500" />
                      Position
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {positionOptions.map(pos => (
                        <button
                          key={pos.value}
                          onClick={() => setWatermarkSettings(prev => ({ ...prev, position: pos.value }))}
                          className={`p-2 rounded-lg border-2 text-center transition-all ${
                            watermarkSettings.position === pos.value
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-lg">{pos.icon}</span>
                          <div className="text-xs mt-1">{pos.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setWatermarkSettings({
                      size: 50,
                      opacity: 15,
                      position: 'center',
                      offsetX: 0,
                      offsetY: 0,
                      rotation: 0,
                      enabled: true
                    })}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature & Seal Upload - Director/Principal only */}
      {(user?.role === 'director' || user?.role === 'principal') && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <PenTool className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Signature & Seal for Notices</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Ye signature aur seal notices pe automatically show honge
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Signature Upload */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-slate-700">Signature</span>
              </div>
              
              {signatureUrl ? (
                <div className="relative">
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${signatureUrl}`}
                    alt="Signature"
                    className="w-full h-24 object-contain bg-white rounded-lg border"
                  />
                  <button
                    onClick={() => signatureInputRef.current?.click()}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-slate-100"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                  className="w-full h-24 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  {uploadingSignature ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-sm text-slate-500">Upload Signature</span>
                    </>
                  )}
                </button>
              )}
              
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-400 mt-2">PNG/JPG, max 2MB</p>
            </div>
            
            {/* Seal Upload */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Stamp className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-slate-700">School Seal/Stamp</span>
              </div>
              
              {sealUrl ? (
                <div className="relative">
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${sealUrl}`}
                    alt="Seal"
                    className="w-full h-24 object-contain bg-white rounded-lg border"
                  />
                  <button
                    onClick={() => sealInputRef.current?.click()}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-slate-100"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => sealInputRef.current?.click()}
                  disabled={uploadingSeal}
                  className="w-full h-24 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  {uploadingSeal ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : (
                    <>
                      <Stamp className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-sm text-slate-500">Upload Seal</span>
                    </>
                  )}
                </button>
              )}
              
              <input
                ref={sealInputRef}
                type="file"
                accept="image/*"
                onChange={handleSealUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-400 mt-2">PNG/JPG, max 2MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Module Management */}
      {(user?.role === 'director' || user?.role === 'principal') && (
        <div className="stat-card border-2 border-violet-100" data-testid="module-management-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ToggleLeft className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-slate-900">Module Management (मॉड्यूल प्रबंधन)</h2>
            </div>
            <Button
              onClick={saveModuleVisibility}
              disabled={savingModules}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              data-testid="save-module-visibility-btn"
            >
              {savingModules ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Enable or disable modules for each portal. Changes will apply immediately after saving.</p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Module</th>
                    {PORTALS.map(portal => (
                      <th key={portal} className="text-center py-3 px-4 font-semibold text-slate-700">{PORTAL_LABELS[portal]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULE_LIST.map((mod, idx) => (
                    <tr key={mod.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{mod.label}</td>
                      {PORTALS.map(portal => (
                        <td key={portal} className="text-center py-2.5 px-4">
                          <button
                            onClick={() => toggleModule(mod.key, portal)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              moduleVisibility[mod.key]?.[portal] ? 'bg-violet-600' : 'bg-slate-300'
                            }`}
                            data-testid={`toggle-${mod.key}-${portal}`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                              moduleVisibility[mod.key]?.[portal] ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* School Selection */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <School className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Schools</h2>
          </div>
          {user?.role === 'director' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-school-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Add School
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New School</DialogTitle>
                  <DialogDescription className="sr-only">Fill the form to add a new school</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>School Name *</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      data-testid="school-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      data-testid="school-address-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        data-testid="school-city-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        data-testid="school-state-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Board Type *</Label>
                      <select
                        name="board_type"
                        value={formData.board_type}
                        onChange={handleChange}
                        className="w-full h-10 rounded-lg border border-slate-200 px-3"
                        data-testid="school-board-select"
                      >
                        <option value="CBSE">CBSE (NCERT)</option>
                        <option value="NCERT">NCERT</option>
                        <option value="MPBSE">MP Board (MPBSE)</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State Board">State Board</option>
                        <option value="IB">IB</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        data-testid="school-phone-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      data-testid="school-email-input"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-school-btn">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="spinner w-8 h-8" />
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-10">
            <School className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No schools added yet</p>
            <p className="text-sm text-slate-400">Add a school to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.map((school) => (
              <div
                key={school.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  schoolId === school.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handleSelectSchool(school.id)}
                data-testid={`school-card-${school.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{school.name}</h3>
                    <p className="text-sm text-slate-500">{school.city}, {school.state}</p>
                    <span className="badge badge-info mt-2">{school.board_type}</span>
                  </div>
                  {schoolId === school.id && (
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
