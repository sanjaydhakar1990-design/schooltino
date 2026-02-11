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
    { key: 'admissions', label: 'Admissions CRM' },
    { key: 'communication_hub', label: 'Communication Hub' },
    { key: 'front_office', label: 'Front Office' },
    { key: 'transport', label: 'Transport' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'cctv', label: 'CCTV' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'ai_tools', label: 'AI Tools' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'multi_branch', label: 'Multi-Branch' },
  ];

  const PORTALS = ['schooltino', 'teachtino'];
  const PORTAL_LABELS = { schooltino: 'SchoolTino (Admin)', teachtino: 'TeachTino (Teachers)' };

  const defaultVisibility = () => {
    const settings = {};
    MODULE_LIST.forEach(m => {
      settings[m.key] = { schooltino: true, teachtino: true };
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
