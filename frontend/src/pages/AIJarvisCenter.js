/**
 * Tino AI - Simple Working Version
 * 
 * Features:
 * - Simple face/avatar display
 * - ElevenLabs voice for speaking
 * - Voice recognition for listening
 * - Chat interface
 * - Working and reliable
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  Users, IndianRupee, ClipboardCheck, TrendingUp,
  RefreshCw, Settings2, User, UserCircle2, Mouse
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Avatar images
const AVATARS = {
  mouse: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/n5ydts5x_file_00000000791472098b8ae0c774846f1e.png",
  male: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/zun0ltqf_file_0000000025187209a5652c1654e41827.png",
  female: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/0xijk3by_file_00000000a4b87209bd803c4c7b66fdb1.png"
};

export default function TinoAICenter() {
  const { user, schoolId } = useAuth();
  const [aiState, setAiState] = useState('idle'); // idle, listening, thinking, speaking
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState(null);
  const [avatarType, setAvatarType] = useState('mouse');
  const [showSettings, setShowSettings] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchStats();
    addMessage('tino', "🎓 नमस्ते! मैं Tino हूं। मुझसे कुछ भी पूछें!");
  }, []);

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

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { id: Date.now(), role, content, time: new Date() }]);
  };

  // Detect language
  const detectLang = (text) => {
    const hindi = (text.match(/[\u0900-\u097F]/g) || []).length;
    const total = text.replace(/\s/g, '').length;
    if (total === 0) return 'english';
    return hindi / total > 0.3 ? 'hindi' : 'english';
  };

  // ElevenLabs TTS
  const speak = async (text) => {
    if (isMuted) {
      setAiState('idle');
      return;
    }

    try {
      setAiState('speaking');
      const lang = detectLang(text);
      const gender = avatarType === 'female' ? 'female' : 'male';
      const voiceType = `${gender}_${lang === 'english' ? 'english' : 'hindi'}`;
      
      const res = await axios.post(`${API}/tino-voice/tts`, {
        text: text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '').substring(0, 400),
        voice_type: voiceType
      });

      if (res.data.success && res.data.audio_base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${res.data.audio_base64}`);
        audio.onended = () => setAiState('idle');
        audio.onerror = () => {
          fallbackSpeak(text);
        };
        await audio.play();
      } else {
        fallbackSpeak(text);
      }
    } catch (e) {
      console.error('TTS error:', e);
      fallbackSpeak(text);
    }
  };

  // Browser TTS fallback
  const fallbackSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, ''));
      u.lang = detectLang(text) === 'hindi' ? 'hi-IN' : 'en-US';
      u.rate = 0.9;
      u.onend = () => setAiState('idle');
      window.speechSynthesis.speak(u);
    } else {
      setAiState('idle');
    }
  };

  // Send message to Tino
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

  // Voice recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.lang = 'hi-IN';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setAiState('listening');
    
    recognitionRef.current.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      if (e.results[0].isFinal) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current.onerror = () => setAiState('idle');
    recognitionRef.current.onend = () => {
      if (aiState === 'listening') setAiState('idle');
    };

    recognitionRef.current.start();
  }, [aiState]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setAiState('idle');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4" data-testid="tino-ai-center">
      {/* Left - Avatar Section */}
      <div className="flex-1 bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900 rounded-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Tino AI</h1>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              ElevenLabs
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="bg-slate-800/90 rounded-xl p-4 mb-4">
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
        )}

        {/* Avatar Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect based on state */}
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${
              aiState === 'speaking' ? 'bg-blue-500/40 scale-110' :
              aiState === 'listening' ? 'bg-cyan-400/40 scale-105' :
              aiState === 'thinking' ? 'bg-indigo-500/30' :
              'bg-blue-400/20'
            }`} />
            
            {/* Avatar Image */}
            <img 
              src={AVATARS[avatarType]}
              alt="Tino"
              className={`relative w-64 h-auto object-contain drop-shadow-2xl transition-all duration-300 ${
                aiState === 'speaking' ? 'scale-105' : ''
              }`}
              style={{
                filter: aiState === 'speaking' 
                  ? 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))' 
                  : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
              }}
            />
            
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
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant={isMuted ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-full ${!isMuted ? 'bg-blue-500 hover:bg-blue-600' : 'border-white/30 text-white'}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <button
            onClick={aiState === 'listening' ? stopListening : startListening}
            disabled={aiState === 'thinking' || aiState === 'speaking'}
            className={`w-16 h-16 rounded-full transition-all ${
              aiState === 'listening'
                ? 'bg-cyan-500 scale-110 shadow-lg shadow-cyan-500/40'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
            } ${aiState === 'thinking' || aiState === 'speaking' ? 'opacity-50' : ''}`}
          >
            {aiState === 'listening' ? <MicOff className="w-6 h-6 text-white mx-auto" /> : <Mic className="w-6 h-6 text-white mx-auto" />}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="rounded-full border-white/30 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
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
      </div>

      {/* Right - Chat Section */}
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
    </div>
  );
}
