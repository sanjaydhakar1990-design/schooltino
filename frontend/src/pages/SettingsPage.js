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
import { Settings as SettingsIcon, School, Globe, Plus, Loader2, Check, Upload, PenTool, Stamp, Image, Wallet } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchSchools();
    fetchSignatureSeal();
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

      {/* Razorpay Configuration - School ke liye */}
      {(user?.role === 'director' || user?.role === 'principal') && (
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Payment Gateway (Razorpay)</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Apne school ka Razorpay account connect karein. Students ki fees directly aapke bank account mein aayegi.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Razorpay account banane ke liye <a href="https://razorpay.com/signup/" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">yahan click karein</a>. 
              Signup ke baad Dashboard → Settings → API Keys se Key ID aur Secret milega.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Razorpay Key ID</Label>
              <Input
                placeholder="rzp_live_xxxxxxxxxxxxx"
                className="mt-1"
                data-testid="razorpay-key-id"
              />
            </div>
            <div>
              <Label>Razorpay Key Secret</Label>
              <Input
                type="password"
                placeholder="••••••••••••••••••••"
                className="mt-1"
                data-testid="razorpay-key-secret"
              />
            </div>
            <div>
              <Label>Business Name (Receipt pe dikhega)</Label>
              <Input
                placeholder="ABC Public School"
                className="mt-1"
                data-testid="razorpay-business-name"
              />
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Save Razorpay Config
            </Button>
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
