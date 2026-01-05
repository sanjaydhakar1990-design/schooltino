/**
 * TINO BRAIN - Unified AI Dashboard
 * Single AI that manages everything
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Brain, Mic, MicOff, Send, AlertTriangle, CheckCircle, XCircle,
  Users, MapPin, Video, Shield, Bell, Activity, Eye, Sparkles,
  Settings, User, Clock, TrendingUp, TrendingDown, Loader2,
  Volume2, Camera, Target, Heart, Zap, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Alert priority colors
const PRIORITY_COLORS = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white'
};

export default function TinoBrainDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [brainStatus, setBrainStatus] = useState(null);
  const [insights, setInsights] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [locationTracking, setLocationTracking] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceGender, setVoiceGender] = useState(() => localStorage.getItem('tino_voice_gender') || 'female');
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      const [statusRes, insightsRes, alertsRes, trackingRes] = await Promise.allSettled([
        axios.get(`${API}/tino-brain/status`),
        axios.get(`${API}/tino-brain/dashboard-insights/${user?.school_id || 'default'}?role=${user?.role}`),
        axios.get(`${API}/tino-brain/alerts/${user?.school_id || 'default'}`),
        axios.get(`${API}/tino-brain/location-tracking/${user?.school_id || 'default'}`)
      ]);

      if (statusRes.status === 'fulfilled') setBrainStatus(statusRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.alerts || []);
      if (trackingRes.status === 'fulfilled') setLocationTracking(trackingRes.value.data.tracking || []);
      
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (type, text, data = null) => {
    setMessages(prev => [...prev, { type, text, data, time: new Date() }]);
  };

  const queryTinoBrain = async (query) => {
    setIsProcessing(true);
    
    try {
      const res = await axios.post(`${API}/tino-brain/query`, {
        query,
        school_id: user?.school_id || 'default',
        user_id: user?.id || '',
        user_role: user?.role || 'director',
        user_name: user?.name || 'User',
        voice_gender: voiceGender
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      
      // Play audio if available
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      }
      
      // Refresh data if action was taken
      if (result.action_taken) {
        fetchData();
      }
      
    } catch (err) {
      addMessage('ai', 'Kuch gadbad ho gayi. Dobara try karein.');
      toast.error('Query failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (base64Audio) => {
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      audio.play().catch(console.error);
    } catch (err) {
      console.error('Audio error:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    
    addMessage('user', inputText);
    queryTinoBrain(inputText);
    setInputText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoice(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoice = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', 'hi');
      
      const transcribeRes = await axios.post(`${API}/voice-assistant/transcribe`, formData);
      const userText = transcribeRes.data.transcribed_text;
      
      if (userText?.trim()) {
        addMessage('user', userText);
        await queryTinoBrain(userText);
      } else {
        addMessage('ai', 'Sun nahi paya. Dobara bolein.');
      }
    } catch (err) {
      addMessage('ai', 'Voice processing mein problem hui.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await axios.post(`${API}/tino-brain/alerts/${alertId}/resolve`);
      toast.success('Alert resolved');
      fetchData();
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  const quickQuery = (query) => {
    addMessage('user', query);
    queryTinoBrain(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-500 mx-auto animate-pulse" />
          <p className="mt-4 text-white font-medium">Loading Tino Brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6" data-testid="tino-brain-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Tino Brain
              <Badge className="bg-green-500 text-white text-xs">
                {brainStatus?.status === 'active' ? 'Active' : 'Offline'}
              </Badge>
            </h1>
            <p className="text-slate-400 text-sm">Unified AI Intelligence System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceGender(v => v === 'male' ? 'female' : 'male')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <User className="w-4 h-4 mr-2" />
            {voiceGender === 'male' ? 'Male' : 'Female'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Overview & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Students</p>
                    <p className="text-2xl font-bold text-white">
                      {insights?.school_overview?.total_students || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Attendance</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {insights?.school_overview?.today_attendance?.percentage || 0}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-400">
                      {alerts.length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Tracking</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {locationTracking.length}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {insights?.insights?.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        insight.type === 'critical' ? 'bg-red-500/10 border-red-500/50' :
                        insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/50' :
                        'bg-blue-500/10 border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white">{insight.title}</h4>
                          <p className="text-sm text-slate-300">{insight.message}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-white"
                          onClick={() => quickQuery(insight.action)}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-400" />
                Active Alerts
                {alerts.length > 0 && (
                  <Badge variant="destructive">{alerts.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-400">No active alerts. All systems normal!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Badge className={PRIORITY_COLORS[alert.priority]}>
                            {alert.priority}
                          </Badge>
                          <div>
                            <h4 className="font-medium text-white">{alert.title}</h4>
                            <p className="text-sm text-slate-400">{alert.description}</p>
                            {alert.location && (
                              <p className="text-xs text-slate-500 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {alert.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Tracking */}
          {locationTracking.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Live Tracking (Face Recognition)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {locationTracking.map((person, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium truncate">
                            {person.person_id?.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-slate-400">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {person.last_location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - AI Chat */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-slate-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Ask Tino Brain
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Sab kuch puchho - AI sab jaanta hai
              </CardDescription>
            </CardHeader>
            
            {/* Quick Actions */}
            <div className="p-3 border-b border-slate-700 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => quickQuery('school ka pura status batao')}
              >
                School Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => quickQuery('aaj kaun absent hai')}
              >
                Absent List
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => quickQuery('pending fees kitni hai')}
              >
                Fee Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => quickQuery('koi alert hai kya')}
              >
                Alerts
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    Namaste! Main Tino Brain hoon.<br/>
                    Mujhse kuch bhi puchho!
                  </p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.type === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-sm' 
                      : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-2xl px-4 py-2 rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-700">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type karo ya bolo..."
                  className="flex-1 bg-slate-900 border-slate-600 text-white text-sm"
                  disabled={isProcessing || isListening}
                />
                <button
                  type="button"
                  onClick={isListening ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Capabilities */}
      <Card className="mt-6 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tino Brain Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Eye, label: 'CCTV Monitor', desc: 'Real-time surveillance' },
              { icon: Users, label: 'Face Track', desc: 'Who is where' },
              { icon: AlertTriangle, label: 'Auto Alerts', desc: 'Proactive warnings' },
              { icon: Target, label: 'Behavior AI', desc: 'Student analysis' },
              { icon: Bell, label: 'Notifications', desc: 'Instant alerts' },
              { icon: Heart, label: 'Counseling', desc: 'AI-assisted' }
            ].map((cap, idx) => (
              <div 
                key={idx}
                className="p-4 bg-slate-900/50 rounded-xl text-center hover:bg-slate-700/50 transition-all cursor-pointer"
              >
                <cap.icon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <p className="text-white text-sm font-medium">{cap.label}</p>
                <p className="text-slate-500 text-xs">{cap.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
