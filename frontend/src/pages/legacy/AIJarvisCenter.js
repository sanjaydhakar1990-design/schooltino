/**
 * Tino AI - Complete Version with D-ID Animated Avatar
 * 
 * Features:
 * - Meeting Mode (Continuous talking)
 * - Hide Chat option
 * - D-ID Animated Avatar (Optional)
 * - ElevenLabs Voice
 * - 3 Avatar types: Mouse, Male, Female
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  Users, IndianRupee, ClipboardCheck, TrendingUp,
  RefreshCw, Settings2, User, UserCircle2, Mouse,
  Eye, EyeOff, Phone, PhoneOff, Video, VideoOff
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

// ❌ AVATARS DISABLED - Text-only mode (no images, no voice)
const AVATARS = {}; // Empty - no avatars

export default function TinoAICenter() {
  const { user, schoolId } = useAuth();
  const [aiState, setAiState] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(true); // Always muted
  const [stats, setStats] = useState(null);
  const [avatarType, setAvatarType] = useState('none'); // ❌ NO AVATAR
  const [showSettings, setShowSettings] = useState(false);
  
  // ❌ Meeting Mode DISABLED
  const [meetingMode, setMeetingMode] = useState(false);
  
  // Chat always visible (text-only)
  const [showChat, setShowChat] = useState(true);
  
  // ❌ VOICE COMPLETELY DISABLED
  const VOICE_ENABLED = false;
  
  // D-ID Video Avatar (Optional)
  const [useAnimatedAvatar, setUseAnimatedAvatar] = useState(false);
  const [didConfigured, setDidConfigured] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  useEffect(() => {
    fetchStats();
    checkDidStatus();
    addMessage('tino', "🎓 नमस्ते! मैं Tino हूं। बात करने के लिए mic button दबाएं या Meeting Mode ON करें!");
  }, []);

  // Meeting mode continuous listening
  useEffect(() => {
    if (meetingMode && aiState === 'idle') {
      const timer = setTimeout(() => {
        if (meetingMode && aiState === 'idle') {
          startListening();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [meetingMode, aiState]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/tino-ai/quick-stats/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  const checkDidStatus = async () => {
    try {
      const res = await axios.get(`${API}/did-avatar/status`);
      setDidConfigured(res.data.connected);
    } catch (e) {
      setDidConfigured(false);
    }
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { id: Date.now(), role, content, time: new Date() }]);
  };

  const detectLang = (text) => {
    const hindi = (text.match(/[\u0900-\u097F]/g) || []).length;
    const total = text.replace(/\s/g, '').length;
    if (total === 0) return 'en';
    return hindi / total > 0.3 ? 'hi' : 'en';
  };

  // D-ID Animated Avatar
  const createAnimatedAvatar = async (text) => {
    if (!useAnimatedAvatar || !didConfigured) return false;
    
    try {
      setVideoLoading(true);
      const res = await axios.post(`${API}/did-avatar/create-clip`, {
        text: text.substring(0, 300),
        avatar_type: avatarType,
        language: detectLang(text)
      });
      
      if (res.data.success && res.data.video_url) {
        setCurrentVideo(res.data.video_url);
        return true;
      }
      return false;
    } catch (e) {
      console.error('D-ID error:', e);
      return false;
    } finally {
      setVideoLoading(false);
    }
  };

  // ElevenLabs TTS
  const speak = async (text) => {
    if (isMuted) {
      setAiState('idle');
      return;
    }

    // Try D-ID animated avatar first
    if (useAnimatedAvatar && didConfigured) {
      const success = await createAnimatedAvatar(text);
      if (success) {
        setAiState('speaking');
        return;
      }
    }

    // Fallback to ElevenLabs
    try {
      setAiState('speaking');
      const lang = detectLang(text);
      const gender = avatarType === 'female' ? 'female' : 'male';
      const voiceType = `${gender}_${lang === 'en' ? 'english' : 'hindi'}`;
      
      const res = await axios.post(`${API}/tino-voice/tts`, {
        text: text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '').substring(0, 400),
        voice_type: voiceType
      });

      if (res.data.success && res.data.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${res.data.audio_base64}`);
        audio.onended = () => setAiState('idle');
        await audio.play();
      } else {
        fallbackSpeak(text);
      }
    } catch (e) {
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, ''));
      u.lang = detectLang(text) === 'hi' ? 'hi-IN' : 'en-US';
      u.rate = 0.9;
      u.onend = () => setAiState('idle');
      window.speechSynthesis.speak(u);
    } else {
      setAiState('idle');
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    addMessage('user', text);
    setInputText('');
    setAiState('thinking');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/tino-ai/chat`, {
        message: text,
        school_id: schoolId,
        user_id: user?.id,
        language: detectLang(text)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const response = res.data.response;
      addMessage('tino', response);
      await speak(response);
      
    } catch (e) {
      console.error('Chat error:', e);
      setAiState('idle');
      addMessage('tino', "माफ करें, error हो गया। कृपया दोबारा try करें।");
    }
  };

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.lang = 'hi-IN';
    recognitionRef.current.continuous = meetingMode;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setAiState('listening');
    
    recognitionRef.current.onresult = (e) => {
      const results = e.results;
      const latest = results[results.length - 1];
      const transcript = latest[0].transcript;
      setInputText(transcript);
      if (latest.isFinal && transcript.trim().length > 2) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current.onerror = () => {
      if (!meetingMode) setAiState('idle');
    };
    
    recognitionRef.current.onend = () => {
      if (!meetingMode && aiState === 'listening') setAiState('idle');
    };

    recognitionRef.current.start();
  }, [meetingMode, aiState]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setMeetingMode(false);
    setAiState('idle');
  };

  const toggleMeetingMode = () => {
    if (meetingMode) {
      stopListening();
      toast.info('Meeting Mode OFF');
    } else {
      setMeetingMode(true);
      startListening();
      toast.success('🎤 Meeting Mode ON - बोलते रहिए!');
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setCurrentVideo(null);
    setAiState('idle');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4" data-testid="tino-ai-center">
      {/* Left - Avatar Section */}
      <div className={`${showChat ? 'flex-1' : 'w-full'} bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900 rounded-2xl p-6 flex flex-col transition-all`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Tino AI</h1>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {useAnimatedAvatar && didConfigured ? 'D-ID + ElevenLabs' : 'ElevenLabs'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Hide/Show Chat */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChat(!showChat)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {showChat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="ml-1 text-xs hidden sm:inline">{showChat ? 'Hide' : 'Show'} Chat</span>
            </Button>
            
            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-800/90 rounded-xl p-4 mb-4 space-y-4">
            {/* Avatar Selection */}
            <div>
              <p className="text-white/60 text-xs mb-2">Avatar</p>
              <div className="flex gap-2">
                {[
                  { id: 'mouse', icon: Mouse, label: 'Mouse' },
                  { id: 'male', icon: User, label: 'Male' },
                  { id: 'female', icon: UserCircle2, label: 'Female' }
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAvatarType(a.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      avatarType === a.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                    }`}
                  >
                    <a.icon className="w-3 h-3 inline mr-1" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* D-ID Animated Avatar Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Animated Avatar (D-ID)</p>
                <p className="text-white/40 text-xs">
                  {didConfigured ? 'Lip-sync video enabled' : 'Not configured'}
                </p>
              </div>
              <Switch
                checked={useAnimatedAvatar}
                onCheckedChange={setUseAnimatedAvatar}
                disabled={!didConfigured}
              />
            </div>
          </div>
        )}

        {/* Avatar Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${
              aiState === 'speaking' ? 'bg-blue-500/40 scale-110' :
              aiState === 'listening' ? 'bg-cyan-400/40 scale-105' :
              aiState === 'thinking' ? 'bg-indigo-500/30' :
              meetingMode ? 'bg-green-400/30 animate-pulse' :
              'bg-blue-400/20'
            }`} />
            
            {/* Video or Image */}
            {currentVideo ? (
              <video
                ref={videoRef}
                src={currentVideo}
                autoPlay
                onEnded={handleVideoEnd}
                className="relative w-72 h-auto rounded-2xl shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))' }}
              />
            ) : (
              <img 
                src={AVATARS[avatarType]}
                alt="Tino"
                className={`relative w-72 h-auto object-contain drop-shadow-2xl transition-all duration-300 ${
                  aiState === 'speaking' ? 'scale-105' : ''
                } ${videoLoading ? 'opacity-50' : ''}`}
                style={{
                  filter: aiState === 'speaking' 
                    ? 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))' 
                    : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                }}
              />
            )}
            
            {/* Loading indicator */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
            
            {/* State indicator */}
            {aiState !== 'idle' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  aiState === 'listening' ? 'bg-cyan-500 text-white' :
                  aiState === 'speaking' ? 'bg-blue-500 text-white' :
                  'bg-indigo-500 text-white'
                }`}>
                  {aiState === 'listening' ? '🎤 सुन रहा हूं...' :
                   aiState === 'speaking' ? '🗣️ बोल रहा हूं...' :
                   '🧠 सोच रहा हूं...'}
                </span>
              </div>
            )}
            
            {/* Meeting Mode indicator */}
            {meetingMode && aiState === 'idle' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500 text-white animate-pulse">
                  🎤 Meeting Mode - बोलिए...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4">
          {/* Main Controls Row */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Meeting Mode Button */}
            <Button
              onClick={toggleMeetingMode}
              className={`rounded-full px-4 py-2 ${
                meetingMode 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {meetingMode ? <PhoneOff className="w-4 h-4 mr-1" /> : <Phone className="w-4 h-4 mr-1" />}
              <span className="text-sm">{meetingMode ? 'End Meeting' : 'Meeting Mode'}</span>
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={isMuted ? 'outline' : 'default'}
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-full ${!isMuted ? 'bg-blue-500 hover:bg-blue-600' : 'border-white/30 text-white'}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {!meetingMode && (
              <button
                onClick={aiState === 'listening' ? stopListening : startListening}
                disabled={aiState === 'thinking' || aiState === 'speaking'}
                className={`w-14 h-14 rounded-full transition-all ${
                  aiState === 'listening'
                    ? 'bg-cyan-500 scale-110 shadow-lg shadow-cyan-500/40'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                } ${aiState === 'thinking' || aiState === 'speaking' ? 'opacity-50' : ''}`}
              >
                {aiState === 'listening' ? <MicOff className="w-5 h-5 text-white mx-auto" /> : <Mic className="w-5 h-5 text-white mx-auto" />}
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              className="rounded-full border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-center gap-3 mt-4">
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center text-white">
              <p className="text-lg font-bold">{stats.total_students || 0}</p>
              <p className="text-[9px] text-white/60">Students</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center text-white">
              <p className="text-lg font-bold">{stats.today_attendance?.present || 0}</p>
              <p className="text-[9px] text-white/60">Present</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center text-white">
              <p className="text-lg font-bold">₹{((stats.today_fee_collection || 0) / 1000).toFixed(0)}K</p>
              <p className="text-[9px] text-white/60">Fee</p>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="text-white/50 text-xs text-center mt-3">
          {meetingMode 
            ? '🟢 Meeting Mode ON - बिना button दबाए बोलते रहिए' 
            : 'Mic button दबाएं या Meeting Mode ON करें'}
        </p>
      </div>

      {/* Right - Chat Section (Toggleable) */}
      {showChat && (
        <div className="w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {aiState === 'thinking' && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
                placeholder="Type here..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                disabled={aiState === 'listening'}
              />
              <Button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || aiState === 'thinking'}
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
