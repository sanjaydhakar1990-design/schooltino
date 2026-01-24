/**
 * Unified Tino AI Center
 * 
 * Features:
 * - Central Face (Male/Female) with lip-sync animation
 * - ElevenLabs voice integration (Hindi/English, Male/Female)
 * - Blue transparent theme (no pink/purple)
 * - Automatic language detection and response
 * - All Tino instances connected to same brain
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TinoFace from '../components/TinoFace';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  Users, IndianRupee, ClipboardCheck, Calendar, TrendingUp,
  RefreshCw, Zap, Settings2, User, UserCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Quick Actions with Blue theme
const QUICK_ACTIONS = [
  { 
    id: 'attendance', 
    icon: ClipboardCheck, 
    label: 'आज की Attendance', 
    query: 'आज की attendance कितनी है?', 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50/80'
  },
  { 
    id: 'fees', 
    icon: IndianRupee, 
    label: 'Fee Collection', 
    query: 'आज की fee collection कितनी है?', 
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50/80'
  },
  { 
    id: 'students', 
    icon: Users, 
    label: 'Total Students', 
    query: 'कितने students हैं?', 
    color: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-50/80'
  },
  { 
    id: 'summary', 
    icon: TrendingUp, 
    label: 'Daily Summary', 
    query: 'आज की पूरी summary दो', 
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50/80'
  },
];

export default function TinoAICenter() {
  const { user, schoolId, schoolData } = useAuth();
  const [aiState, setAiState] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Voice settings
  const [voiceGender, setVoiceGender] = useState('male'); // male, female
  const [voiceLanguage, setVoiceLanguage] = useState('hindi'); // hindi, english
  const [showSettings, setShowSettings] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Initial setup
  useEffect(() => {
    fetchStats();
    setTimeout(() => {
      addTinoMessage("🎓 नमस्ते! मैं Tino हूं - आपका AI School Assistant। मुझसे Hindi या English में कुछ भी पूछें!");
    }, 800);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/tino-ai/quick-stats/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const addTinoMessage = (text, suggestions = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'tino',
      content: text,
      suggestions,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }]);
  };

  // Detect language from text
  const detectLanguage = (text) => {
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars === 0) return 'english';
    const hindiRatio = hindiChars / totalChars;
    if (hindiRatio > 0.3) return 'hindi';
    if (hindiRatio > 0.1) return 'hinglish';
    return 'english';
  };

  // Text to Speech using ElevenLabs
  const speakWithElevenLabs = async (text) => {
    if (isMuted) {
      setAiState('idle');
      return;
    }

    try {
      setAiState('speaking');
      
      // Determine voice type based on detected language and selected gender
      const detectedLang = detectLanguage(text);
      const voiceType = `${voiceGender}_${detectedLang === 'english' ? 'english' : 'hindi'}`;
      
      const response = await axios.post(`${API}/tino-voice/tts`, {
        text: text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '').substring(0, 500),
        voice_type: voiceType,
        stability: 0.5,
        similarity_boost: 0.75
      });

      if (response.data.success && response.data.audio_base64) {
        // Play the audio
        const audioBlob = base64ToBlob(response.data.audio_base64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            setAiState('idle');
            URL.revokeObjectURL(audioUrl);
          };
          await audioRef.current.play();
        }
      } else {
        // Fallback to browser TTS
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      fallbackSpeak(text);
    }
  };

  // Convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  // Fallback browser TTS
  const fallbackSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = voiceLanguage === 'hindi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setAiState('idle');
      window.speechSynthesis.speak(utterance);
    } else {
      setAiState('idle');
    }
  };

  // Send message to Tino
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    addUserMessage(text);
    setInputText('');
    setAiState('thinking');
    setCurrentResponse('');

    try {
      const token = localStorage.getItem('token');
      const detectedLang = detectLanguage(text);
      
      const response = await axios.post(`${API}/tino-ai/chat`, {
        message: text,
        school_id: schoolId,
        user_id: user?.id,
        session_id: `tino_${schoolId}_${user?.id}`,
        language: detectedLang
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { response: tinoResponse, suggestions } = response.data;
      
      // Streaming effect
      setAiState('speaking');
      await streamResponse(tinoResponse);
      
      addTinoMessage(tinoResponse, suggestions);
      setCurrentResponse('');
      
      // Speak with ElevenLabs
      await speakWithElevenLabs(tinoResponse);
      
    } catch (error) {
      console.error('Tino error:', error);
      setAiState('idle');
      addTinoMessage("माफ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।");
    }
  };

  // Simulate text streaming
  const streamResponse = async (text) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      setCurrentResponse(prev => prev + (i > 0 ? ' ' : '') + words[i]);
      await new Promise(r => setTimeout(r, 40));
    }
  };

  // Voice recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = voiceLanguage === 'hindi' ? 'hi-IN' : 'en-US';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setAiState('listening');

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      if (event.results[0].isFinal) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current.onerror = () => setAiState('idle');
    recognitionRef.current.onend = () => {
      if (aiState === 'listening') setAiState('idle');
    };

    recognitionRef.current.start();
  }, [aiState, voiceLanguage]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setAiState('idle');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col" data-testid="tino-ai-center">
      {/* Hidden audio element for ElevenLabs playback */}
      <audio ref={audioRef} />
      
      {/* Main Container with Blue Transparent Theme */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Section - Tino Face & Chat */}
        <div className="flex-1 flex flex-col">
          {/* Hero Section with Face */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/90 to-slate-900 rounded-2xl p-6 mb-4">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
              
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>
            
            <div className="relative flex flex-col items-center">
              {/* Voice Settings Button */}
              <div className="absolute top-0 right-0 flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Settings2 className="w-4 h-4 mr-1" />
                  Voice Settings
                </Button>
              </div>

              {/* Voice Settings Panel */}
              {showSettings && (
                <div className="absolute top-12 right-0 bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-slate-700 z-10 min-w-[200px]">
                  <p className="text-white/70 text-xs mb-3 font-medium">Voice Preference</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Gender</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVoiceGender('male')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            voiceGender === 'male' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                          }`}
                        >
                          <User className="w-3 h-3 inline mr-1" />
                          Male
                        </button>
                        <button
                          onClick={() => setVoiceGender('female')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            voiceGender === 'female' 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                          }`}
                        >
                          <UserCircle2 className="w-3 h-3 inline mr-1" />
                          Female
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Default Language</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVoiceLanguage('hindi')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            voiceLanguage === 'hindi' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                          }`}
                        >
                          हिंदी
                        </button>
                        <button
                          onClick={() => setVoiceLanguage('english')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            voiceLanguage === 'english' 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-[10px] mt-3">
                    * Tino जिस भाषा में पूछें उसी में जवाब देगा
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-white">Tino AI</h1>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  GPT-5.2 + ElevenLabs
                </Badge>
              </div>

              {/* Central Face - MAIN FEATURE */}
              <div className="relative cursor-pointer mb-4" onClick={aiState === 'listening' ? stopListening : startListening}>
                <TinoFace 
                  state={aiState} 
                  gender={voiceGender}
                  size="xl"
                />
              </div>

              {/* Status Text */}
              <p className="text-white/60 text-sm text-center max-w-md mt-8">
                {aiState === 'listening' ? 'मैं सुन रहा हूं... बोलिए' :
                 aiState === 'thinking' ? 'सोच रहा हूं...' :
                 aiState === 'speaking' ? 'जवाब दे रहा हूं...' :
                 'Face पर click करें या नीचे type करें'}
              </p>

              {/* Quick Stats */}
              {stats && (
                <div className="flex gap-3 mt-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center text-white">
                    <p className="text-xl font-bold">{stats.total_students || 0}</p>
                    <p className="text-[10px] text-white/60">Students</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center text-white">
                    <p className="text-xl font-bold">{stats.today_attendance?.present || 0}</p>
                    <p className="text-[10px] text-white/60">Present</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center text-white">
                    <p className="text-xl font-bold">₹{((stats.today_fee_collection || 0) / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-white/60">Fee Today</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Quick Actions at Start */}
              {messages.length <= 1 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-blue-500" />
                    Quick Actions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => sendMessage(action.query)}
                        className={`flex items-center gap-2 p-3 ${action.bgColor} hover:shadow-md rounded-xl transition-all`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {msg.role === 'tino' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-blue-600">Tino</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    
                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <div className="flex flex-wrap gap-1">
                          {msg.suggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(sug)}
                              className="text-[10px] bg-white hover:bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {currentResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600">Tino</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{currentResponse}</p>
                    <span className="inline-block w-2 h-4 bg-blue-500 rounded-sm animate-pulse ml-1" />
                  </div>
                </div>
              )}

              {/* Thinking */}
              {aiState === 'thinking' && !currentResponse && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                    </div>
                    <span className="text-xs text-slate-500">Tino सोच रहा है...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <Button
                  variant={isMuted ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`rounded-full ${!isMuted ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* Main Voice Button */}
                <button
                  onClick={aiState === 'listening' ? stopListening : startListening}
                  disabled={aiState === 'thinking' || aiState === 'speaking'}
                  className={`relative w-14 h-14 rounded-full transition-all duration-300 ${
                    aiState === 'listening'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 scale-110 shadow-xl shadow-cyan-500/40'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 shadow-lg shadow-blue-500/30'
                  } ${(aiState === 'thinking' || aiState === 'speaking') ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {aiState === 'listening' ? (
                    <MicOff className="w-6 h-6 text-white mx-auto" />
                  ) : (
                    <Mic className="w-6 h-6 text-white mx-auto" />
                  )}
                  {aiState === 'listening' && (
                    <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
                  )}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStats}
                  className="rounded-full"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Text Input */}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tino से कुछ भी पूछें... (Hindi / English)"
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                  disabled={aiState === 'listening'}
                />
                <Button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || aiState === 'thinking'}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-[9px] text-slate-400 text-center mt-2">
                🎤 Face पर click करें या Voice बटन दबाएं • ElevenLabs Voice • GPT-5.2 AI
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-72 space-y-4">
          {/* Today's Summary */}
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                आज की Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats ? (
                <>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-xs">Students</span>
                    </div>
                    <span className="font-bold text-blue-600">{stats.total_students || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-cyan-600" />
                      <span className="text-xs">Present</span>
                    </div>
                    <span className="font-bold text-cyan-600">{stats.today_attendance?.present || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-teal-600" />
                      <span className="text-xs">Fee</span>
                    </div>
                    <span className="font-bold text-teal-600">₹{(stats.today_fee_collection || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs">Leaves</span>
                    </div>
                    <span className="font-bold text-indigo-600">{stats.pending_leaves || 0}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1" />
                  <p className="text-xs">Loading...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Info */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-medium text-blue-600">
                    {voiceGender === 'male' ? 'Male' : 'Female'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Language:</span>
                  <span className="font-medium text-blue-600">
                    {voiceLanguage === 'hindi' ? 'हिंदी' : 'English'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Voice Engine:</span>
                  <span className="font-medium text-cyan-600">ElevenLabs</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                * Auto-detect: जिस भाषा में पूछो उसी में जवाब
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
