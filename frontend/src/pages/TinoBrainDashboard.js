/**
 * TINO BRAIN - Unified AI Dashboard (Light Theme)
 * Single AI that manages everything
 * Clean, Simple, Professional Design
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Brain, Mic, MicOff, Send, AlertTriangle, CheckCircle, XCircle,
  Users, MapPin, Video, Shield, Bell, Activity, Eye, Sparkles,
  Settings, User, Clock, TrendingUp, Loader2, Trash2, History,
  Volume2, Camera, Target, Heart, Zap, RefreshCw, ArrowLeft,
  BookOpen, Wallet, CalendarCheck, ChevronRight, MessageSquare
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
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchChatSessions();
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
        axios.get(`${API}/tino-brain/dashboard-insights/${schoolId || 'default'}?role=${user?.role}`),
        axios.get(`${API}/tino-brain/alerts/${schoolId || 'default'}`),
        axios.get(`${API}/tino-brain/location-tracking/${schoolId || 'default'}`)
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

  // Fetch chat sessions/history
  const fetchChatSessions = async () => {
    try {
      const res = await axios.get(`${API}/tino-brain/chat-sessions/${user?.id}?school_id=${schoolId || 'default'}`);
      setChatSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Chat sessions fetch error:', err);
    }
  };

  // Clear all chat history
  const clearChatHistory = async () => {
    if (!window.confirm('Kya aap puri chat history delete karna chahte hain?')) return;
    try {
      await axios.delete(`${API}/tino-brain/chat-history/${user?.id}/clear?school_id=${schoolId || 'default'}`);
      setMessages([]);
      setChatSessions([]);
      toast.success('Chat history cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  // Load a specific session's messages
  const loadChatSession = async (date) => {
    try {
      const res = await axios.get(`${API}/tino-brain/chat-history/${user?.id}?school_id=${schoolId || 'default'}&limit=100`);
      const session = res.data.sessions?.find(s => s.date === date);
      if (session) {
        setMessages(session.messages.map(m => ({
          type: m.is_user ? 'user' : 'ai',
          text: m.message,
          time: new Date(m.timestamp),
          id: m.id
        })));
        setShowHistory(false);
      }
    } catch (err) {
      toast.error('Failed to load session');
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
        school_id: schoolId || 'default',
        user_id: user?.id || '',
        user_role: user?.role || 'director',
        user_name: user?.name || 'User',
        voice_gender: voiceGender
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      }
      
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

  // Improved Push-to-Talk: Press mic → Speak → Release → Auto execute
  const startRecording = useCallback(async () => {
    if (isProcessing) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        // Auto process voice - command will execute automatically
        await processVoice(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      toast.info('🎤 Bol rahe ho... Chhod do jab ho jaye', { duration: 2000 });
    } catch (err) {
      toast.error('Microphone access denied');
    }
  }, [isProcessing]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      toast.info('🔄 Processing...', { duration: 1000 });
    }
  }, []);

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
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-600 mx-auto animate-pulse" />
          <p className="mt-4 text-slate-700 font-medium">Loading Tino Brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-4 md:p-6" data-testid="tino-brain-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/dashboard')}
            className="text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Tino Brain
              <Badge className="bg-green-500 text-white text-xs">
                {brainStatus?.status === 'active' ? 'Active' : 'Online'}
              </Badge>
            </h1>
            <p className="text-slate-500 text-sm">Your School's AI Intelligence System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceGender(v => v === 'male' ? 'female' : 'male')}
          >
            <User className="w-4 h-4 mr-2" />
            {voiceGender === 'male' ? 'Male Voice' : 'Female Voice'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Overview & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs">Students</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {insights?.school_overview?.total_students || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs">Attendance</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {insights?.school_overview?.today_attendance?.percentage || 85}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs">Active Alerts</p>
                    <p className="text-2xl font-bold text-rose-600">
                      {alerts.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs">Tracking</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {locationTracking.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'School Status', query: 'school ka pura status batao', icon: Activity, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Absent Today', query: 'aaj kaun absent hai', icon: Users, color: 'bg-rose-50 text-rose-700' },
                  { label: 'Fee Status', query: 'pending fees kitni hai', icon: Wallet, color: 'bg-amber-50 text-amber-700' },
                  { label: 'Check Alerts', query: 'koi alert hai kya', icon: Bell, color: 'bg-purple-50 text-purple-700' },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => quickQuery(action.query)}
                    className={`${action.color} p-4 rounded-xl hover:shadow-md transition-all text-left`}
                  >
                    <action.icon className="w-5 h-5 mb-2" />
                    <p className="font-medium text-sm">{action.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights?.insights?.length > 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        insight.type === 'critical' ? 'bg-red-50 border-red-200' :
                        insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{insight.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => quickQuery(insight.action)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
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
                  <p className="text-slate-500">No active alerts. All systems normal!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Badge className={PRIORITY_COLORS[alert.priority]}>
                            {alert.priority}
                          </Badge>
                          <div>
                            <h4 className="font-medium text-slate-900">{alert.title}</h4>
                            <p className="text-sm text-slate-500">{alert.description}</p>
                            {alert.location && (
                              <p className="text-xs text-slate-400 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {alert.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
        </div>

        {/* Right Column - AI Chat */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-0 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Ask Tino Brain
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    title="Chat History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  {messages.length > 0 && (
                    <button
                      onClick={clearChatHistory}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      title="Clear Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <CardDescription className="text-slate-500 text-xs">
                🎤 Mic dabao → Bolo → Chhodo → Auto execute!
              </CardDescription>
            </CardHeader>

            {/* Chat History Panel */}
            {showHistory && chatSessions.length > 0 && (
              <div className="border-b bg-slate-50 p-3 max-h-[200px] overflow-y-auto">
                <p className="text-xs font-medium text-slate-600 mb-2">Previous Chats</p>
                {chatSessions.map((session, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadChatSession(session.date)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white text-xs mb-1 border border-transparent hover:border-slate-200"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">{session.date}</span>
                      <span className="text-slate-400">{session.message_count} msgs</span>
                    </div>
                    <p className="text-slate-500 truncate">{session.preview}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px] max-h-[450px] bg-slate-50">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    Namaste! Main Tino Brain hoon.<br/>
                    Mujhse school ke baare mein kuch bhi puchho!
                  </p>
                  <div className="mt-4 text-xs text-slate-400">
                    <p className="font-medium mb-1">Try bolke:</p>
                    <p>"Notice bhejo ki kal chutti hai"</p>
                    <p>"Aaj kaun absent hai"</p>
                    <p>"Fee reminder bhejo"</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* Show action data if available */}
                    {msg.data && msg.type !== 'user' && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        {msg.data.marked_count !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>{msg.data.marked_count} students marked</span>
                          </div>
                        )}
                        {msg.data.absent_count !== undefined && (
                          <div className="text-xs text-rose-600 mt-1">
                            <span className="font-medium">{msg.data.absent_count} absent</span>
                            {msg.data.absent_students?.slice(0, 5).map((s, i) => (
                              <span key={i} className="block text-slate-500">• {s.name} ({s.class})</span>
                            ))}
                          </div>
                        )}
                        {msg.data.reminders_sent !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <Bell className="w-3 h-3" />
                            <span>{msg.data.reminders_sent} reminders sent</span>
                          </div>
                        )}
                        {msg.data.total_pending !== undefined && (
                          <div className="text-xs text-amber-600 font-medium">
                            ₹{msg.data.total_pending?.toLocaleString()} pending
                          </div>
                        )}
                        {msg.data.notice_id && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Notice created successfully</span>
                          </div>
                        )}
                        {msg.data.sent_count !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Send className="w-3 h-3" />
                            <span>{msg.data.sent_count} messages queued</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 rounded-bl-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-xs text-slate-500">Tino soch raha hai...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type karo ya bolo..."
                  className="flex-1 text-sm"
                  disabled={isProcessing || isListening}
                />
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={isListening ? stopRecording : undefined}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isProcessing}
                  className={`p-2 rounded-lg transition-all select-none ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse scale-110' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-red-500 active:text-white active:scale-110'
                  }`}
                  title="Press & hold to speak"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Capabilities Grid */}
      <Card className="mt-6 bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Tino Brain Capabilities</CardTitle>
          <CardDescription>What Tino AI can do for your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Eye, label: 'CCTV Monitor', desc: 'Real-time surveillance', color: 'bg-blue-50 text-blue-600' },
              { icon: Users, label: 'Face Track', desc: 'Who is where', color: 'bg-purple-50 text-purple-600' },
              { icon: AlertTriangle, label: 'Auto Alerts', desc: 'Proactive warnings', color: 'bg-rose-50 text-rose-600' },
              { icon: Target, label: 'Behavior AI', desc: 'Student analysis', color: 'bg-amber-50 text-amber-600' },
              { icon: Bell, label: 'Notifications', desc: 'Instant alerts', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Heart, label: 'Counseling', desc: 'AI-assisted', color: 'bg-pink-50 text-pink-600' }
            ].map((cap, idx) => (
              <div 
                key={idx}
                className={`p-4 ${cap.color} rounded-xl text-center hover:shadow-md transition-all cursor-pointer`}
              >
                <cap.icon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-sm">{cap.label}</p>
                <p className="text-xs opacity-70">{cap.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
