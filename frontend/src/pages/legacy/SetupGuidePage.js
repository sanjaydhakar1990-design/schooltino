/**
 * SETUP GUIDE PAGE - AI-Powered Hardware & Software Setup
 * - CCTV Auto Detection & Manual Setup
 * - Speaker Auto Configuration
 * - Website AI Integration
 * - Other Software Data Import
 * - Skip options with Resume in Profile
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Camera, Volume2, Globe, Database, ChevronRight, CheckCircle,
  SkipForward, ArrowRight, Loader2, AlertCircle, Play, Settings,
  Wifi, Monitor, Mic, HelpCircle, ExternalLink, FileText, Upload,
  Smartphone, Server, Link2, Zap, RefreshCw, Search, Bot, Wand2,
  Download, Copy, Code
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

// CCTV Brand Information
const CCTV_BRANDS = [
  {
    name: 'Hikvision',
    logo: '🔵',
    popular: true,
    rtspFormat: 'rtsp://username:password@{ip}:554/Streaming/Channels/{channel}01',
    steps: [
      'SADP Tool से camera का IP find करें',
      'Browser में IP open करें (default: admin/admin)',
      'Configuration → Network → Advanced Settings',
      'RTSP Port note करें (default: 554)',
      'Authentication enable रखें'
    ],
    defaultPort: 554,
    supportsSpeaker: true
  },
  {
    name: 'Dahua',
    logo: '🟢',
    popular: true,
    rtspFormat: 'rtsp://username:password@{ip}:554/cam/realmonitor?channel={channel}&subtype=0',
    steps: [
      'ConfigTool software से IP find करें',
      'Web interface open करें',
      'Setup → Network → TCP/IP में IP confirm करें',
      'RTSP port check करें (default: 554)',
      'Main stream select करें'
    ],
    defaultPort: 554,
    supportsSpeaker: true
  },
  {
    name: 'CP Plus',
    logo: '🔴',
    popular: true,
    rtspFormat: 'rtsp://username:password@{ip}:554/cam/realmonitor?channel={channel}&subtype=0',
    steps: [
      'Device Search Tool use करें',
      'Default credentials: admin/admin',
      'Configuration → Network Settings',
      'RTSP port enable करें',
      'Live stream test करें'
    ],
    defaultPort: 554,
    supportsSpeaker: false
  },
  {
    name: 'Uniview',
    logo: '⚫',
    popular: false,
    rtspFormat: 'rtsp://username:password@{ip}:554/unicast/c{channel}/s0/live',
    steps: [
      'EZTools software download करें',
      'Network scan से device find करें',
      'Web login: admin/123456',
      'Setup → Network → Port में RTSP verify करें'
    ],
    defaultPort: 554,
    supportsSpeaker: true
  },
  {
    name: 'Other/Generic',
    logo: '⚪',
    popular: false,
    rtspFormat: 'rtsp://username:password@{ip}:554/stream1',
    steps: [
      'Camera manual check करें',
      'Usually: rtsp://IP:554/stream',
      'VLC Player से test करें',
      'Working URL को Schooltino में add करें'
    ],
    defaultPort: 554,
    supportsSpeaker: false
  }
];

// Speaker Systems
const SPEAKER_SYSTEMS = [
  {
    name: 'Direct CCTV Speaker',
    type: 'direct_cctv',
    description: 'CCTV में built-in speaker',
    icon: '📹'
  },
  {
    name: 'External PA System',
    type: 'pa_system',
    description: 'School PA System',
    icon: '🔊'
  },
  {
    name: 'Bluetooth Speaker',
    type: 'bluetooth',
    description: 'Wireless speaker',
    icon: '🎧'
  },
  {
    name: 'USB/Computer Speaker',
    type: 'usb',
    description: 'PC speakers',
    icon: '🖥️'
  }
];

// Supported Software for Import
const SOFTWARE_LIST = [
  { id: 'tally', name: 'Tally ERP', icon: '📊', types: ['fees', 'accounts'] },
  { id: 'fedena', name: 'Fedena', icon: '🎓', types: ['students', 'staff', 'attendance'] },
  { id: 'entab', name: 'Entab CampusCare', icon: '🏫', types: ['students', 'fees'] },
  { id: 'edumaat', name: 'EduMaat', icon: '📚', types: ['students', 'fees'] },
  { id: 'excel', name: 'Excel/CSV', icon: '📁', types: ['students', 'staff', 'fees'] },
  { id: 'other', name: 'Other Software', icon: '💾', types: ['custom'] }
];

export default function SetupGuidePage() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  
  // Step completion status
  const [setupStatus, setSetupStatus] = useState({
    cctv: { completed: false, skipped: false },
    speaker: { completed: false, skipped: false },
    website: { completed: false, skipped: false },
    dataImport: { completed: false, skipped: false }
  });
  
  // CCTV State
  const [selectedCCTVBrand, setSelectedCCTVBrand] = useState(null);
  const [cctvConfig, setCctvConfig] = useState({
    ip: '',
    port: '554',
    username: 'admin',
    password: '',
    channel: '1',
    location: 'Main Gate'
  });
  const [autoDetectedDevices, setAutoDetectedDevices] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState('');
  
  // Speaker State
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [speakerAiGuide, setSpeakerAiGuide] = useState('');
  
  // Website State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteOption, setWebsiteOption] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [integrationScript, setIntegrationScript] = useState(null);
  
  // Software Import State
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [importMethod, setImportMethod] = useState('excel');
  const [aiMappingGuide, setAiMappingGuide] = useState('');

  useEffect(() => {
    fetchSetupStatus();
  }, [schoolId]);

  const fetchSetupStatus = async () => {
    if (!schoolId) return;
    try {
      const res = await axios.get(`${API}/api/ai-config/status/${schoolId}`);
      if (res.data) {
        setSetupStatus(prev => ({
          cctv: { completed: res.data.cctv?.configured, skipped: false },
          speaker: { completed: res.data.speaker?.configured, skipped: false },
          website: { completed: res.data.website?.connected, skipped: false },
          dataImport: { completed: res.data.api_integration?.enabled, skipped: false }
        }));
      }
    } catch (err) {
      console.error('Error fetching setup status:', err);
    }
  };

  const steps = [
    { id: 'cctv', title: 'CCTV Setup', icon: Camera, description: 'AI Auto-detect cameras' },
    { id: 'speaker', title: 'Speaker Setup', icon: Volume2, description: 'Audio configuration' },
    { id: 'website', title: 'Website Integration', icon: Globe, description: 'AI data extraction' },
    { id: 'dataImport', title: 'Data Import', icon: Database, description: 'Import from software' }
  ];

  // ==================== CCTV AUTO DETECTION ====================
  const handleCCTVAutoDetect = async () => {
    setAutoDetecting(true);
    setAiSuggestions('');
    
    try {
      const res = await axios.post(`${API}/api/ai-config/cctv/auto-detect`, {
        school_id: schoolId,
        ip_address: cctvConfig.ip || null,
        network_scan: true,
        device_name: cctvConfig.location
      });
      
      if (res.data.devices_found?.length > 0) {
        setAutoDetectedDevices(res.data.devices_found);
        toast.success(`🎉 ${res.data.devices_found.length} cameras detected!`);
      } else {
        toast.info('No cameras auto-detected. Please configure manually.');
      }
      
      if (res.data.configured_devices?.length > 0) {
        toast.success(`✅ ${res.data.configured_devices.length} cameras auto-configured!`);
      }
      
      if (res.data.ai_suggestions) {
        setAiSuggestions(res.data.ai_suggestions);
      }
      
    } catch (err) {
      toast.error('Auto-detection failed. Try manual configuration.');
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleCCTVManualConfig = async () => {
    if (!cctvConfig.ip || !cctvConfig.password) {
      toast.error('IP address और password required हैं');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai-config/cctv/manual-config`, null, {
        params: {
          school_id: schoolId,
          device_name: cctvConfig.location || 'Camera 1',
          ip_address: cctvConfig.ip,
          port: parseInt(cctvConfig.port),
          username: cctvConfig.username,
          password: cctvConfig.password,
          brand: selectedCCTVBrand?.name?.toLowerCase() || 'hikvision',
          location: cctvConfig.location
        }
      });
      
      if (res.data.success) {
        toast.success('✅ CCTV configured successfully!');
        setAiSuggestions(res.data.ai_guide || '');
        handleComplete('cctv');
      }
    } catch (err) {
      toast.error('Configuration failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ==================== SPEAKER AUTO CONFIG ====================
  const handleSpeakerAutoConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai-config/speaker/auto-config`, {
        school_id: schoolId,
        speaker_type: selectedSpeaker?.type || 'direct_cctv'
      });
      
      if (res.data.success) {
        toast.success('✅ Speaker configured!');
        setSpeakerAiGuide(res.data.speaker_config?.ai_guide || '');
        handleComplete('speaker');
      }
    } catch (err) {
      toast.error('Speaker config failed');
    } finally {
      setLoading(false);
    }
  };

  // ==================== WEBSITE AI EXTRACTION ====================
  const handleWebsiteExtract = async () => {
    if (!websiteUrl) {
      toast.error('Website URL enter करें');
      return;
    }
    
    setExtracting(true);
    try {
      const res = await axios.post(`${API}/api/ai-config/website/auto-extract`, {
        school_id: schoolId,
        website_url: websiteUrl,
        extract_data: true,
        auto_import: true
      });
      
      if (res.data.success) {
        setExtractedData(res.data.extracted_data);
        toast.success('🎉 AI ने website से data extract कर लिया!');
      } else {
        toast.error(res.data.error || 'Extraction failed');
      }
    } catch (err) {
      toast.error('Website extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerateIntegrationScript = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai-config/website/generate-integration-script`, null, {
        params: {
          school_id: schoolId,
          website_platform: 'html'
        }
      });
      
      if (res.data.success) {
        setIntegrationScript(res.data);
        toast.success('Integration script generated!');
      }
    } catch (err) {
      toast.error('Script generation failed');
    } finally {
      setLoading(false);
    }
  };

  // ==================== SOFTWARE IMPORT ====================
  const handleSoftwareImport = async () => {
    if (!selectedSoftware) {
      toast.error('Software select करें');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai-config/software/auto-import`, {
        school_id: schoolId,
        software_name: selectedSoftware.id,
        import_type: importMethod
      });
      
      if (res.data.success) {
        setAiMappingGuide(res.data.ai_mapping || '');
        toast.success('Import process started!');
      }
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP HANDLERS ====================
  const handleSkip = (stepId) => {
    setSetupStatus(prev => ({
      ...prev,
      [stepId]: { completed: false, skipped: true }
    }));
    
    saveSetupProgress(stepId, 'skipped');
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeSetup();
    }
    
    toast.info(`${steps[activeStep].title} skipped. Profile में जाकर बाद में complete कर सकते हैं।`);
  };

  const handleComplete = async (stepId) => {
    setSetupStatus(prev => ({
      ...prev,
      [stepId]: { completed: true, skipped: false }
    }));
    
    await saveSetupProgress(stepId, 'completed');
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeSetup();
    }
    
    toast.success(`✅ ${steps.find(s => s.id === stepId)?.title} complete!`);
  };

  const saveSetupProgress = async (stepId, status) => {
    try {
      await axios.post(`${API}/api/school-setup/progress`, {
        school_id: schoolId,
        step: stepId,
        status: status,
        config: {}
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const completeSetup = () => {
    toast.success('🎉 Setup Complete! Schooltino ready है!');
    navigate('/app/dashboard');
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              AI-Powered Setup Guide
            </h1>
          </div>
          <p className="text-slate-600">
            Tino AI automatically configure करेगा - Manual option भी available है
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((step, idx) => {
            const status = setupStatus[step.id];
            const isActive = idx === activeStep;
            const isCompleted = status?.completed;
            const isSkipped = status?.skipped;
            
            return (
              <div 
                key={step.id}
                className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all ${
                  idx < activeStep ? 'opacity-60' : ''
                }`}
                onClick={() => idx <= activeStep && setActiveStep(idx)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isSkipped ? 'bg-amber-400 text-white' :
                  isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isSkipped ? (
                    <SkipForward className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              {React.createElement(steps[activeStep].icon, { className: "w-6 h-6" })}
              Step {activeStep + 1}: {steps[activeStep].title}
              <Badge className="ml-auto bg-white/20">
                {steps[activeStep].description}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* CCTV Setup */}
            {activeStep === 0 && (
              <div className="space-y-6">
                <Tabs defaultValue="auto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="auto" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> AI Auto-Detect
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Manual Setup
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* AI Auto Detection */}
                  <TabsContent value="auto" className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-indigo-900">AI Auto-Detection</h3>
                          <p className="text-sm text-indigo-700 mt-1">
                            Tino AI आपके network को scan करेगा और CCTV cameras automatically detect और configure करेगा।
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        placeholder="Camera IP (optional) - 192.168.1.100"
                        value={cctvConfig.ip}
                        onChange={(e) => setCctvConfig({...cctvConfig, ip: e.target.value})}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleCCTVAutoDetect}
                        disabled={autoDetecting}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {autoDetecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Auto-Detect Cameras
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Detected Devices */}
                    {autoDetectedDevices.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h4 className="font-semibold text-green-800 mb-2">
                          ✅ {autoDetectedDevices.length} Cameras Found!
                        </h4>
                        <div className="space-y-2">
                          {autoDetectedDevices.map((device, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg">
                              <Camera className="w-5 h-5 text-green-600" />
                              <span className="font-medium">{device.ip}:{device.port}</span>
                              <Badge>{device.detected_brand}</Badge>
                              <Badge variant="outline" className="text-green-600">{device.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* AI Suggestions */}
                    {aiSuggestions && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-800">AI Suggestions</h4>
                        </div>
                        <p className="text-sm text-purple-700 whitespace-pre-line">{aiSuggestions}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Manual Setup */}
                  <TabsContent value="manual" className="space-y-4">
                    {/* Brand Selection */}
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">1. CCTV Brand Select करें:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CCTV_BRANDS.map((brand) => (
                          <button
                            key={brand.name}
                            onClick={() => {
                              setSelectedCCTVBrand(brand);
                              setCctvConfig(prev => ({ ...prev, port: brand.defaultPort.toString() }));
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              selectedCCTVBrand?.name === brand.name
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{brand.logo}</span>
                              <span className="font-medium text-sm">{brand.name}</span>
                              {brand.popular && <Badge className="text-xs">Popular</Badge>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Manual Config Form */}
                    {selectedCCTVBrand && (
                      <>
                        <div className="bg-slate-50 rounded-xl p-4">
                          <h4 className="font-medium text-slate-800 mb-2">{selectedCCTVBrand.name} Setup Steps:</h4>
                          <ol className="space-y-1 text-sm text-slate-600">
                            {selectedCCTVBrand.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-indigo-600 font-medium">{idx + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-600 mb-1 block">Camera IP Address *</label>
                            <Input
                              placeholder="192.168.1.100"
                              value={cctvConfig.ip}
                              onChange={(e) => setCctvConfig({...cctvConfig, ip: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-600 mb-1 block">Port</label>
                            <Input
                              placeholder="554"
                              value={cctvConfig.port}
                              onChange={(e) => setCctvConfig({...cctvConfig, port: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-600 mb-1 block">Username</label>
                            <Input
                              placeholder="admin"
                              value={cctvConfig.username}
                              onChange={(e) => setCctvConfig({...cctvConfig, username: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-600 mb-1 block">Password *</label>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              value={cctvConfig.password}
                              onChange={(e) => setCctvConfig({...cctvConfig, password: e.target.value})}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm text-slate-600 mb-1 block">Camera Location</label>
                            <Input
                              placeholder="Main Gate / Class 10-A / Office"
                              value={cctvConfig.location}
                              onChange={(e) => setCctvConfig({...cctvConfig, location: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleCCTVManualConfig}
                          disabled={loading || !cctvConfig.ip}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Save & Configure
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
                
                {/* Help Contact */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">Help चाहिए?</p>
                      <p className="text-xs text-amber-700">WhatsApp: <strong>+91 78799 67616</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Speaker Setup */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <Tabs defaultValue="auto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="auto" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> AI Auto-Configure
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Manual Guide
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="auto" className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <p className="text-sm text-indigo-700">
                        AI automatically detect करेगा आपके CCTV में speaker है या नहीं, और best configuration suggest करेगा।
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      {SPEAKER_SYSTEMS.map((speaker) => (
                        <button
                          key={speaker.type}
                          onClick={() => setSelectedSpeaker(speaker)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedSpeaker?.type === speaker.type
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{speaker.icon}</span>
                            <div>
                              <p className="font-medium">{speaker.name}</p>
                              <p className="text-xs text-slate-500">{speaker.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {selectedSpeaker && (
                      <Button
                        onClick={handleSpeakerAutoConfig}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        AI Configure Speaker
                      </Button>
                    )}
                    
                    {speakerAiGuide && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-800">AI Guide</h4>
                        </div>
                        <p className="text-sm text-purple-700 whitespace-pre-line">{speakerAiGuide}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium mb-3">Speaker Connection Types:</h4>
                      {SPEAKER_SYSTEMS.map((speaker) => (
                        <div key={speaker.type} className="mb-4 last:mb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{speaker.icon}</span>
                            <span className="font-medium">{speaker.name}</span>
                          </div>
                          <ol className="text-sm text-slate-600 ml-8 space-y-1">
                            {speaker.type === 'direct_cctv' && (
                              <>
                                <li>1. CCTV web interface open करें</li>
                                <li>2. Audio Settings → Output enable</li>
                                <li>3. Two-way Audio ON करें</li>
                                <li>4. Volume 50-70% set करें</li>
                              </>
                            )}
                            {speaker.type === 'pa_system' && (
                              <>
                                <li>1. PA amplifier ON करें</li>
                                <li>2. Audio out connect करें</li>
                                <li>3. Volume balance set करें</li>
                              </>
                            )}
                            {speaker.type === 'bluetooth' && (
                              <>
                                <li>1. Speaker pairing mode में रखें</li>
                                <li>2. Tino device से pair करें</li>
                                <li>3. Audio output select करें</li>
                              </>
                            )}
                            {speaker.type === 'usb' && (
                              <>
                                <li>1. Speaker connect करें</li>
                                <li>2. Default device select करें</li>
                                <li>3. Browser permissions allow करें</li>
                              </>
                            )}
                          </ol>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance('Namaste! Schooltino speaker test!');
                        utterance.lang = 'hi-IN';
                        speechSynthesis.speak(utterance);
                        toast.success('Audio test playing...');
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Test Audio
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Website Integration */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <Tabs defaultValue="auto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="auto" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> AI Extract Data
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Code className="w-4 h-4" /> Integration Script
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="auto" className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <p className="text-sm text-indigo-700">
                        AI आपकी existing website से school details automatically extract करेगा - Name, Address, Contact, etc.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://myschool.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleWebsiteExtract}
                        disabled={extracting || !websiteUrl}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {extracting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-1" />
                            AI Extract
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {extractedData && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800">Data Extracted!</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {extractedData.school_name && (
                            <div><span className="text-slate-500">Name:</span> {extractedData.school_name}</div>
                          )}
                          {extractedData.phone && (
                            <div><span className="text-slate-500">Phone:</span> {extractedData.phone}</div>
                          )}
                          {extractedData.email && (
                            <div><span className="text-slate-500">Email:</span> {extractedData.email}</div>
                          )}
                          {extractedData.address && (
                            <div className="col-span-2"><span className="text-slate-500">Address:</span> {extractedData.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* No Website Options */}
                    <div className="grid md:grid-cols-2 gap-3 pt-4 border-t">
                      <button
                        onClick={() => setWebsiteOption('new')}
                        className={`p-4 rounded-xl border-2 text-center ${
                          websiteOption === 'new' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                        }`}
                      >
                        <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="font-medium">Website नहीं है?</p>
                        <p className="text-xs text-slate-500">हम बना देंगे</p>
                      </button>
                      
                      <button
                        onClick={() => handleSkip('website')}
                        className="p-4 rounded-xl border-2 border-slate-200 text-center hover:bg-slate-50"
                      >
                        <SkipForward className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="font-medium">Skip for Now</p>
                        <p className="text-xs text-slate-500">बाद में करेंगे</p>
                      </button>
                    </div>
                    
                    {websiteOption === 'new' && (
                      <div className="bg-indigo-50 rounded-xl p-4 text-center">
                        <a
                          href="https://wa.me/917879967616?text=Hi!%20I%20want%20school%20website"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium"
                        >
                          WhatsApp पर Contact करें
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium mb-3">Website Integration Script Generate करें:</h4>
                      <Button
                        onClick={handleGenerateIntegrationScript}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Code className="w-4 h-4 mr-2" />
                        )}
                        Generate Script
                      </Button>
                    </div>
                    
                    {integrationScript && (
                      <div className="space-y-3">
                        <div className="bg-slate-900 text-green-400 rounded-xl p-4 overflow-auto">
                          <pre className="text-xs">{integrationScript.scripts.html}</pre>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(integrationScript.scripts.html);
                            toast.success('Script copied!');
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Script
                        </Button>
                        
                        <div className="text-sm text-slate-600">
                          <h5 className="font-medium mb-2">Steps:</h5>
                          <ol className="space-y-1">
                            {integrationScript.manual_steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Data Import */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <Tabs defaultValue="auto" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="auto" className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> AI Import
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Excel Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="auto" className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <p className="text-sm text-indigo-700">
                        AI आपके existing software से data automatically import और map करेगा।
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Software Select करें:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SOFTWARE_LIST.map((software) => (
                          <button
                            key={software.id}
                            onClick={() => setSelectedSoftware(software)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              selectedSoftware?.id === software.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{software.icon}</span>
                              <div>
                                <p className="font-medium text-sm">{software.name}</p>
                                <p className="text-xs text-slate-500">{software.types.join(', ')}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedSoftware && (
                      <Button
                        onClick={handleSoftwareImport}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        AI Import from {selectedSoftware.name}
                      </Button>
                    )}
                    
                    {aiMappingGuide && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-800">AI Import Guide</h4>
                        </div>
                        <p className="text-sm text-purple-700 whitespace-pre-line">{aiMappingGuide}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium mb-3">Excel Template Download करें:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Students Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Staff Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Fees Template
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">Excel file drag & drop करें</p>
                      <p className="text-xs text-slate-400 mt-1">या click करके select करें</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSkip('dataImport')}
                        className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-center hover:bg-slate-50"
                      >
                        <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="font-medium text-sm">Start Fresh</p>
                        <p className="text-xs text-slate-500">No existing data</p>
                      </button>
                      
                      <button
                        onClick={() => handleSkip('dataImport')}
                        className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-center hover:bg-slate-50"
                      >
                        <SkipForward className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="font-medium text-sm">Skip</p>
                        <p className="text-xs text-slate-500">बाद में करेंगे</p>
                      </button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => handleSkip(steps[activeStep].id)}
                className="flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip This Step
              </Button>
              
              <Button
                onClick={() => handleComplete(steps[activeStep].id)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                {activeStep < steps.length - 1 ? 'Next Step' : 'Complete Setup'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Info */}
        <p className="text-center text-sm text-slate-500 mt-4">
          Skip किए गए steps Profile → Settings में जाकर बाद में complete कर सकते हैं
        </p>
      </div>
    </div>
  );
}
