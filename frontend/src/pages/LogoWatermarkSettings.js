import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { 
  Settings, Upload, Image, Loader2, Save, Eye, EyeOff, 
  Move, ZoomIn, ZoomOut, RotateCcw, Check, X, Sparkles,
  CreditCard, FileText, Bell, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LogoWatermarkSettings() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const logoInputRef = useRef(null);

  // Watermark settings
  const [watermarkSettings, setWatermarkSettings] = useState({
    size: 50, // 10-100%
    opacity: 15, // 5-50%
    position: 'center', // center, top-left, top-right, bottom-left, bottom-right
    offsetX: 0, // -50 to 50
    offsetY: 0, // -50 to 50
    rotation: 0, // 0-360
    enabled: true
  });

  // Where to apply logo
  const [applyTo, setApplyTo] = useState({
    idCards: true,
    notices: true,
    calendar: true,
    appHeader: true,
    certificates: true,
    feeBills: true
  });

  // School info
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    tagline: ''
  });

  useEffect(() => {
    fetchSchoolSettings();
  }, [schoolId]);

  const fetchSchoolSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.logo_url || null);
        setSchoolInfo({
          name: data.name || '',
          tagline: data.motto || data.tagline || ''
        });
        if (data.watermark_settings) {
          setWatermarkSettings(prev => ({ ...prev, ...data.watermark_settings }));
        }
        if (data.logo_apply_to) {
          setApplyTo(prev => ({ ...prev, ...data.logo_apply_to }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

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
      reader.onloadend = () => {
        setLogoUrl(reader.result);
        toast.success('Logo uploaded! Click Save to apply.');
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload logo');
      setUploadingLogo(false);
    }
  };

  const handleAIRemoveBg = async () => {
    if (!logoUrl) {
      toast.error('Please upload a logo first');
      return;
    }
    
    setRemovingBg(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/school/ai-remove-background-json`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          school_id: schoolId,
          image_data: logoUrl,
          image_type: 'logo'
        })
      });
      
      const data = await response.json();
      if (data.processed_image) {
        setLogoUrl(data.processed_image);
        toast.success('Background removed successfully!');
      } else {
        toast.error('Background removal failed');
      }
    } catch (error) {
      console.error('AI Remove BG Error:', error);
      toast.error('AI processing failed');
    } finally {
      setRemovingBg(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save logo URL
      if (logoUrl) {
        await fetch(`${API}/api/schools/${schoolId}/update-logo`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ logo_url: logoUrl })
        });
      }
      
      // Save watermark settings
      await fetch(`${API}/api/schools/${schoolId}/watermark-settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          watermark_settings: watermarkSettings,
          logo_apply_to: applyTo
        })
      });
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const positionOptions = [
    { value: 'center', label: 'Center (केंद्र)', icon: '⬛' },
    { value: 'top-left', label: 'Top Left', icon: '↖' },
    { value: 'top-right', label: 'Top Right', icon: '↗' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" data-testid="logo-watermark-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Logo & Watermark Settings
          </h1>
          <p className="text-slate-500 mt-1">
            School logo और watermark की सेटिंग्स यहाँ से करें
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="save-watermark-settings"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Logo Upload */}
        <div className="space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-600" />
              School Logo
            </h2>
            
            {/* Logo Preview */}
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

            {/* Upload Controls */}
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
                  onClick={handleAIRemoveBg}
                  disabled={removingBg}
                  variant="outline"
                  className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {removingBg ? (
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

          {/* Apply Logo To */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Logo Apply करें
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Logo कहाँ-कहाँ दिखना चाहिए?
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'idCards', label: 'ID Cards', icon: CreditCard },
                { key: 'notices', label: 'Notices', icon: Bell },
                { key: 'calendar', label: 'Calendar', icon: Calendar },
                { key: 'appHeader', label: 'App Header', icon: Settings },
                { key: 'certificates', label: 'Certificates', icon: FileText },
                { key: 'feeBills', label: 'Fee Bills', icon: FileText }
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

        {/* Right Column - Watermark Settings */}
        <div className="space-y-6">
          {/* Watermark Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Watermark Preview
            </h2>
            
            {/* Preview Box */}
            <div 
              className="w-full h-48 bg-white border-2 border-slate-200 rounded-lg relative overflow-hidden"
              style={{ backgroundColor: '#f8fafc' }}
            >
              {/* Sample Content */}
              <div className="absolute inset-0 p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sample Document</div>
                <div className="h-2 w-3/4 bg-slate-200 rounded mb-2"></div>
                <div className="h-2 w-1/2 bg-slate-200 rounded mb-4"></div>
                <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
              </div>
              
              {/* Watermark */}
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
              <h2 className="text-lg font-semibold text-slate-900">
                Watermark Settings
              </h2>
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
              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-slate-500" />
                    Size (आकार)
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

              {/* Opacity/Visibility */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500" />
                    Visibility (दिखावट)
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

              {/* Position */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Move className="w-4 h-4 text-slate-500" />
                  Position (स्थान)
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

              {/* Reset Button */}
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

      {/* ID Card Back Preview Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          ID Card Back Side Preview
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Student और Employee ID cards के पीछे ऐसा दिखेगा
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student ID Back */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700">Student ID Card - Back</h3>
            <div 
              className="w-full h-48 rounded-lg border-2 border-slate-200 relative overflow-hidden flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)' }}
            >
              {/* Watermark */}
              {logoUrl && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: watermarkSettings.opacity / 100 }}
                >
                  <img 
                    src={logoUrl} 
                    alt="" 
                    className="object-contain"
                    style={{ width: `${watermarkSettings.size}%`, height: `${watermarkSettings.size}%` }}
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10 text-center text-white p-4">
                <div className="text-2xl font-bold tracking-wider mb-2">
                  STUDENT OF
                </div>
                <div className="text-lg font-semibold uppercase">
                  {schoolInfo.name || 'School Name'}
                </div>
                {schoolInfo.tagline && (
                  <div className="text-xs mt-2 opacity-80">{schoolInfo.tagline}</div>
                )}
              </div>
            </div>
          </div>

          {/* Employee ID Back */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700">Employee ID Card - Back</h3>
            <div 
              className="w-full h-48 rounded-lg border-2 border-slate-200 relative overflow-hidden flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #047857 100%)' }}
            >
              {/* Watermark */}
              {logoUrl && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: watermarkSettings.opacity / 100 }}
                >
                  <img 
                    src={logoUrl} 
                    alt="" 
                    className="object-contain"
                    style={{ width: `${watermarkSettings.size}%`, height: `${watermarkSettings.size}%` }}
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10 text-center text-white p-4">
                <div className="text-xl font-bold tracking-wider mb-2">
                  TEACHER
                </div>
                <div className="text-lg font-semibold uppercase">
                  {schoolInfo.name || 'School Name'}
                </div>
                {schoolInfo.tagline && (
                  <div className="text-xs mt-2 opacity-80">{schoolInfo.tagline}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
