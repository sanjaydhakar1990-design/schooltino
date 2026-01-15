/**
 * SETUP GUIDE PAGE - Comprehensive Hardware & Software Setup
 * - CCTV Setup Guide (All Brands)
 * - Speaker Connection Guide
 * - Website Integration (AI Auto + Manual)
 * - Data Import from Other Software
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
import {
  Camera, Volume2, Globe, Database, ChevronRight, CheckCircle,
  SkipForward, ArrowRight, Loader2, AlertCircle, Play, Settings,
  Wifi, Monitor, Mic, HelpCircle, ExternalLink, FileText, Upload,
  Smartphone, Server, Link2, Zap, RefreshCw
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
      'Configuration → Network → Advanced Settings → Integration Protocol',
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
      'Setup → Network → Connection में RTSP port check करें',
      'Main stream या sub stream select करें'
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
      'Web login: admin/123456 (default)',
      'Setup → Network → Port में RTSP verify करें'
    ],
    defaultPort: 554,
    supportsSpeaker: true
  },
  {
    name: 'Honeywell',
    logo: '🟡',
    popular: false,
    rtspFormat: 'rtsp://username:password@{ip}:554/h264',
    steps: [
      'IP Scanner tool use करें',
      'Web interface access करें',
      'Network settings में streaming options check करें',
      'RTSP enable करें'
    ],
    defaultPort: 554,
    supportsSpeaker: false
  },
  {
    name: 'Other/Generic',
    logo: '⚪',
    popular: false,
    rtspFormat: 'rtsp://username:password@{ip}:554/stream1',
    steps: [
      'Camera manual check करें RTSP URL के लिए',
      'Usually: rtsp://IP:554/stream or /live',
      'VLC Player से test करें: Media → Open Network Stream',
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
    type: 'integrated',
    description: 'अगर CCTV में built-in speaker है',
    setup: [
      'CCTV settings में Audio Output enable करें',
      'Two-way audio ON करें',
      'Volume level adjust करें',
      'Schooltino में Audio enabled select करें'
    ]
  },
  {
    name: 'External PA System',
    type: 'pa_system',
    description: 'School PA System से connect करें',
    setup: [
      'Audio output device को CCTV से connect करें (3.5mm/RCA)',
      'Amplifier ON करें',
      'Volume balance set करें',
      'Test: Schooltino → CCTV → Test Audio button'
    ]
  },
  {
    name: 'Bluetooth Speaker',
    type: 'bluetooth',
    description: 'Wireless Bluetooth speaker',
    setup: [
      'Bluetooth speaker को Tino device से pair करें',
      'Speaker को classroom में place करें',
      'Volume appropriately set करें',
      'Connection stable रखने के लिए range में रखें'
    ]
  },
  {
    name: 'USB/Computer Speaker',
    type: 'usb',
    description: 'Computer/Laptop speakers through Tino device',
    setup: [
      'Speaker को PC/Laptop से connect करें',
      'Schooltino website open करें browser में',
      'Browser audio permissions allow करें',
      'Volume settings adjust करें'
    ]
  }
];

export default function SetupGuidePage() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState({
    cctv: { completed: false, skipped: false },
    speaker: { completed: false, skipped: false },
    website: { completed: false, skipped: false },
    dataImport: { completed: false, skipped: false }
  });
  
  // Form states
  const [selectedCCTVBrand, setSelectedCCTVBrand] = useState(null);
  const [cctvConfig, setCctvConfig] = useState({
    ip: '',
    port: '554',
    username: 'admin',
    password: '',
    channel: '1'
  });
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteOption, setWebsiteOption] = useState(null); // 'existing', 'new', 'skip'
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [importSource, setImportSource] = useState(null);

  useEffect(() => {
    fetchSetupStatus();
  }, [schoolId]);

  const fetchSetupStatus = async () => {
    if (!schoolId) return;
    try {
      const res = await axios.get(`${API}/api/school-setup/wizard/status/${schoolId}`);
      // Map response to our status format
    } catch (err) {
      console.error('Error fetching setup status:', err);
    }
  };

  const steps = [
    { id: 'cctv', title: 'CCTV Setup', icon: Camera, description: 'Camera connection' },
    { id: 'speaker', title: 'Speaker Setup', icon: Volume2, description: 'Audio output' },
    { id: 'website', title: 'Website Integration', icon: Globe, description: 'School website' },
    { id: 'dataImport', title: 'Data Import', icon: Database, description: 'Existing data' }
  ];

  const handleSkip = (stepId) => {
    setSetupStatus(prev => ({
      ...prev,
      [stepId]: { completed: false, skipped: true }
    }));
    
    // Save skip status to backend
    saveSetupProgress(stepId, 'skipped');
    
    // Move to next step
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeSetup();
    }
    
    toast.info(`${steps[activeStep].title} skipped. आप बाद में Profile में जाकर complete कर सकते हैं।`);
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
    
    toast.success(`${steps[activeStep].title} setup complete!`);
  };

  const saveSetupProgress = async (stepId, status) => {
    try {
      await axios.post(`${API}/api/school-setup/progress`, {
        school_id: schoolId,
        step: stepId,
        status: status,
        config: stepId === 'cctv' ? cctvConfig : 
                stepId === 'speaker' ? { type: selectedSpeaker?.type } :
                stepId === 'website' ? { url: websiteUrl, option: websiteOption } : {}
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const completeSetup = () => {
    toast.success('🎉 Setup Complete! अब Schooltino पूरी तरह से ready है!');
    navigate('/app/dashboard');
  };

  // Website AI extraction
  const handleWebsiteExtract = async () => {
    if (!websiteUrl) {
      toast.error('Website URL enter करें');
      return;
    }
    
    setExtracting(true);
    try {
      const res = await axios.post(`${API}/api/school-setup/extract-from-website`, {
        website_url: websiteUrl,
        school_id: schoolId
      });
      
      if (res.data.success) {
        setExtractedData(res.data.extracted_data);
        toast.success('Website data extracted successfully!');
      } else {
        toast.error(res.data.message || 'Extraction failed');
      }
    } catch (err) {
      toast.error('Website se data extract nahi ho paya. Manual entry karein.');
    } finally {
      setExtracting(false);
    }
  };

  // Test CCTV connection
  const testCCTVConnection = async () => {
    if (!cctvConfig.ip) {
      toast.error('Camera IP address enter करें');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/face-recognition/cctv/test`, {
        ip: cctvConfig.ip,
        port: parseInt(cctvConfig.port),
        username: cctvConfig.username,
        password: cctvConfig.password,
        brand: selectedCCTVBrand?.name
      });
      
      if (res.data.success) {
        toast.success('CCTV Connection Successful! ✅');
      } else {
        toast.error('Connection failed: ' + (res.data.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('CCTV connection test failed. Settings check करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            🚀 Schooltino Setup Guide
          </h1>
          <p className="text-slate-600">
            Step-by-step guide से अपना system configure करें
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
                className={`flex flex-col items-center min-w-[80px] cursor-pointer ${
                  idx < activeStep ? 'opacity-50' : ''
                }`}
                onClick={() => idx <= activeStep && setActiveStep(idx)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isSkipped ? 'bg-amber-400 text-white' :
                  isActive ? 'bg-indigo-600 text-white' :
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
                <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
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
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* CCTV Setup */}
            {activeStep === 0 && (
              <div className="space-y-6">
                <p className="text-slate-600">
                  CCTV camera connect करने से Face Recognition, Gate Greeting, और Class Intelligence features enable होंगे।
                </p>

                {/* Brand Selection */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">1. अपना CCTV Brand Select करें:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CCTV_BRANDS.map((brand) => (
                      <button
                        key={brand.name}
                        onClick={() => {
                          setSelectedCCTVBrand(brand);
                          setCctvConfig(prev => ({ ...prev, port: brand.defaultPort.toString() }));
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedCCTVBrand?.name === brand.name
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{brand.logo}</span>
                          <span className="font-medium">{brand.name}</span>
                          {brand.popular && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Popular</Badge>
                          )}
                        </div>
                        {brand.supportsSpeaker && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Speaker supported
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Setup Instructions */}
                {selectedCCTVBrand && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      {selectedCCTVBrand.name} Setup Steps:
                    </h3>
                    <ol className="space-y-2">
                      {selectedCCTVBrand.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-600">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">RTSP URL Format:</p>
                      <code className="text-xs text-blue-600 break-all">
                        {selectedCCTVBrand.rtspFormat}
                      </code>
                    </div>
                  </div>
                )}

                {/* Configuration Form */}
                {selectedCCTVBrand && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">2. Camera Details Enter करें:</h3>
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
                    </div>
                    
                    <Button
                      onClick={testCCTVConnection}
                      disabled={loading || !cctvConfig.ip}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Wifi className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                )}

                {/* Need Help */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">Need Help?</p>
                      <p className="text-xs text-amber-700 mt-1">
                        CCTV setup में problem हो तो हमें WhatsApp करें: <strong>+91 78799 67616</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Speaker Setup */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <p className="text-slate-600">
                  Speaker setup से Tino AI आपसे और students से बात कर सकेगा - Gate Greeting, Announcements, etc.
                </p>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Speaker Type Select करें:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
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
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium">{speaker.name}</span>
                        </div>
                        <p className="text-xs text-slate-500">{speaker.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSpeaker && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      {selectedSpeaker.name} Setup Steps:
                    </h3>
                    <ol className="space-y-2">
                      {selectedSpeaker.setup.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-600">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Test Audio */}
                {selectedSpeaker && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        // Play test audio
                        const utterance = new SpeechSynthesisUtterance('Namaste! Schooltino speaker test successful!');
                        utterance.lang = 'hi-IN';
                        speechSynthesis.speak(utterance);
                        toast.success('Audio test playing...');
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Test Audio
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Website Integration */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <p className="text-slate-600">
                  School website connect करने से auto data import, branding, और seamless integration होगी।
                </p>

                {/* Options */}
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setWebsiteOption('existing')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      websiteOption === 'existing' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <Globe className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="font-medium">Already Have Website</p>
                    <p className="text-xs text-slate-500 mt-1">AI से auto connect</p>
                  </button>
                  
                  <button
                    onClick={() => setWebsiteOption('new')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      websiteOption === 'new' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-medium">Need New Website</p>
                    <p className="text-xs text-slate-500 mt-1">हम बना देंगे</p>
                  </button>
                  
                  <button
                    onClick={() => setWebsiteOption('skip')}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      websiteOption === 'skip' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    <SkipForward className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-medium">Skip for Now</p>
                    <p className="text-xs text-slate-500 mt-1">बाद में करेंगे</p>
                  </button>
                </div>

                {/* Existing Website - AI Extract */}
                {websiteOption === 'existing' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Website URL Enter करें:</label>
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
                    </div>

                    {extractedData && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Data Extracted!</span>
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

                    {/* Manual Steps */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium text-slate-800 mb-2">Manual Integration Steps:</h4>
                      <ol className="space-y-1 text-sm text-slate-600">
                        <li>1. Website admin panel में जाएं</li>
                        <li>2. Schooltino script add करें (we provide)</li>
                        <li>3. API key connect करें</li>
                        <li>4. Test करें - student/parent login</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* New Website */}
                {websiteOption === 'new' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                    <Globe className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Website बनवाएं</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Modern, mobile-friendly school website - Schooltino integrated
                    </p>
                    <a
                      href="https://wa.me/917879967616?text=Hi!%20I%20want%20to%20get%20a%20school%20website%20built"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium"
                    >
                      WhatsApp पर Contact करें
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Data Import */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <p className="text-slate-600">
                  अगर आप किसी और software use कर रहे थे, तो data यहाँ import कर सकते हैं।
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setImportSource('excel')}
                    className={`p-4 rounded-xl border-2 text-left ${
                      importSource === 'excel' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-medium">Excel/CSV Import</p>
                    <p className="text-xs text-slate-500">Students, Staff data upload</p>
                  </button>
                  
                  <button
                    onClick={() => setImportSource('other')}
                    className={`p-4 rounded-xl border-2 text-left ${
                      importSource === 'other' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <Database className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="font-medium">Other Software</p>
                    <p className="text-xs text-slate-500">API integration</p>
                  </button>
                  
                  <button
                    onClick={() => setImportSource('fresh')}
                    className={`p-4 rounded-xl border-2 text-left ${
                      importSource === 'fresh' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <RefreshCw className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="font-medium">Start Fresh</p>
                    <p className="text-xs text-slate-500">No existing data</p>
                  </button>
                  
                  <button
                    onClick={() => setImportSource('skip')}
                    className={`p-4 rounded-xl border-2 text-left ${
                      importSource === 'skip' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    <SkipForward className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="font-medium">Skip for Now</p>
                    <p className="text-xs text-slate-500">बाद में करेंगे</p>
                  </button>
                </div>

                {importSource === 'excel' && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-medium text-slate-800 mb-3">Excel Import Steps:</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 flex-shrink-0">1</span>
                        Download करें sample template
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 flex-shrink-0">2</span>
                        Data fill करें (Students, Staff, Classes)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 flex-shrink-0">3</span>
                        Upload करें filled Excel
                      </li>
                    </ol>
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Excel File
                    </Button>
                  </div>
                )}

                {importSource === 'other' && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-medium text-slate-800 mb-2">Supported Software:</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge>Tally</Badge>
                      <Badge>Fedena</Badge>
                      <Badge>Entab</Badge>
                      <Badge>Other ERP</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      हमारी team help करेगी data migration में। WhatsApp करें: +91 78799 67616
                    </p>
                  </div>
                )}
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
