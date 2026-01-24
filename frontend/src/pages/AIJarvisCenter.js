/**
 * Unified Tino AI Center - Complete Redesign
 * 
 * Features:
 * - 3 Avatar Types: Male, Female, Mouse (all with TINO label)
 * - Full face display (no circle crop)
 * - Continuous Meeting Mode - One click activation
 * - Chat On/Off Toggle - Focus on face only
 * - ElevenLabs voice integration
 * - Auto language detection (Hindi/English/Hinglish)
 * - Expressions & Emotions on avatar
 * - Proactive suggestions mode
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import TinoAvatar from '../components/TinoAvatar';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  Users, IndianRupee, ClipboardCheck, Calendar, TrendingUp,
  RefreshCw, Zap, Settings2, User, UserCircle2, MessageSquare,
  Eye, EyeOff, Radio, Phone, PhoneOff, Mouse
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Quick Actions
const QUICK_ACTIONS = [
  { id: 'attendance', icon: ClipboardCheck, label: 'Attendance', query: 'आज की attendance कितनी है?', color: 'from-blue-500 to-cyan-500' },
  { id: 'fees', icon: IndianRupee, label: 'Fee Collection', query: 'आज की fee collection?', color: 'from-cyan-500 to-teal-500' },
  { id: 'students', icon: Users, label: 'Students', query: 'कितने students हैं?', color: 'from-sky-500 to-blue-500' },
  { id: 'summary', icon: TrendingUp, label: 'Summary', query: 'आज की summary दो', color: 'from-indigo-500 to-blue-500' },
];

export default function TinoAICenter() {
  const { user, schoolId } = useAuth();
  const [aiState, setAiState] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Avatar & Voice settings
  const [avatarType, setAvatarType] = useState('mouse'); // male, female, mouse
  const [voiceLanguage, setVoiceLanguage] = useState('hindi');
  const [showSettings, setShowSettings] = useState(false);
  
  // Meeting Mode - Continuous listening
  const [meetingMode, setMeetingMode] = useState(false);
  
  // Chat visibility toggle
  const [showChat, setShowChat] = useState(true);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to latest
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentResponse, showChat]);

  // Initial setup
  useEffect(() => {
    fetchStats();
    setTimeout(() => {
      addTinoMessage("🎓 नमस्ते! मैं Tino हूं। मुझसे कुछ भी पूछें या Meeting Mode ON करें!");
    }, 800);
  }, []);

  // Meeting mode continuous listening
  useEffect(() => {
    if (meetingMode && aiState === 'idle') {
      // Auto restart listening after response in meeting mode
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

  // Detect language
  const detectLanguage = (text) => {
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars === 0) return 'english';
    const hindiRatio = hindiChars / totalChars;
    if (hindiRatio > 0.3) return 'hindi';
    if (hindiRatio > 0.1) return 'hinglish';
    return 'english';
  };

  // Text to Speech
  const speakWithElevenLabs = async (text) => {
    if (isMuted) {
      setAiState('idle');
      return;
    }

    try {
      setAiState('speaking');
      
      const detectedLang = detectLanguage(text);
      const gender = avatarType === 'female' ? 'female' : 'male';
      const voiceType = `${gender}_${detectedLang === 'english' ? 'english' : 'hindi'}`;
      
      const response = await axios.post(`${API}/tino-voice/tts`, {
        text: text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '').substring(0, 500),
        voice_type: voiceType,
        stability: 0.5,
        similarity_boost: 0.75
      });

      if (response.data.success && response.data.audio_base64) {
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
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error('TTS error:', error);
      fallbackSpeak(text);
    }
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  };

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

  // Send message
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
      
      setAiState('speaking');
      await streamResponse(tinoResponse);
      
      addTinoMessage(tinoResponse, suggestions);
      setCurrentResponse('');
      
      await speakWithElevenLabs(tinoResponse);
      
    } catch (error) {
      console.error('Tino error:', error);
      setAiState('idle');
      addTinoMessage("माफ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।");
    }
  };

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
      toast.error('Voice not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = voiceLanguage === 'hindi' ? 'hi-IN' : 'en-US';
    recognitionRef.current.continuous = meetingMode; // Continuous in meeting mode
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setAiState('listening');

    recognitionRef.current.onresult = (event) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      const transcript = latestResult[0].transcript;
      
      setInputText(transcript);
      
      if (latestResult.isFinal && transcript.trim().length > 2) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current.onerror = (e) => {
      console.error('Recognition error:', e);
      if (!meetingMode) setAiState('idle');
    };
    
    recognitionRef.current.onend = () => {
      if (!meetingMode) {
        setAiState('idle');
      }
    };

    recognitionRef.current.start();
  }, [voiceLanguage, meetingMode]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setMeetingMode(false);
    setAiState('idle');
  };

  // Toggle meeting mode
  const toggleMeetingMode = () => {
    if (meetingMode) {
      stopListening();
    } else {
      setMeetingMode(true);
      startListening();
      toast.success('Meeting Mode ON - बोलते रहिए!');
    }
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    if (aiState === 'listening') {
      if (!meetingMode) stopListening();
    } else if (aiState === 'idle') {
      startListening();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col" data-testid="tino-ai-center">
      <audio ref={audioRef} />
      
      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        {/* Main Section - Avatar */}
        <div className="flex-1 flex flex-col">
          {/* Hero Section with Avatar */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/90 to-slate-900 rounded-2xl p-6 flex-1 min-h-[400px]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>
            
            <div className="relative flex flex-col items-center h-full">
              {/* Top Bar - Settings & Controls */}
              <div className="w-full flex items-center justify-between mb-4">
                {/* Left - Title */}
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">Tino AI</h1>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    GPT-5.2
                  </Badge>
                </div>

                {/* Right - Controls */}
                <div className="flex items-center gap-2">
                  {/* Chat Toggle */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowChat(!showChat)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {showChat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="ml-1 text-xs">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
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
                <div className="absolute top-16 right-4 bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-slate-700 z-20 min-w-[220px]">
                  <p className="text-white/70 text-xs mb-3 font-medium">Avatar & Voice</p>
                  
                  {/* Avatar Selection */}
                  <div className="mb-3">
                    <label className="text-white/60 text-xs mb-2 block">Character</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAvatarType('mouse')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          avatarType === 'mouse' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                        }`}
                      >
                        <Mouse className="w-3 h-3 inline mr-1" />
                        Mouse
                      </button>
                      <button
                        onClick={() => setAvatarType('male')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          avatarType === 'male' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                        }`}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        Male
                      </button>
                      <button
                        onClick={() => setAvatarType('female')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          avatarType === 'female' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                        }`}
                      >
                        <UserCircle2 className="w-3 h-3 inline mr-1" />
                        Female
                      </button>
                    </div>
                  </div>
                  
                  {/* Language */}
                  <div>
                    <label className="text-white/60 text-xs mb-2 block">Language</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVoiceLanguage('hindi')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          voiceLanguage === 'hindi' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        onClick={() => setVoiceLanguage('english')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          voiceLanguage === 'english' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-[10px] mt-3">
                    * Auto-detect: जिस भाषा में बोलो उसी में जवाब
                  </p>
                </div>
              )}

              {/* Central Avatar - MAIN FEATURE */}
              <div className="flex-1 flex items-center justify-center">
                <div 
                  className={`cursor-pointer transition-all duration-300 ${
                    meetingMode ? 'animate-continuous-pulse rounded-full' : ''
                  }`}
                  onClick={handleAvatarClick}
                >
                  <TinoAvatar 
                    state={aiState} 
                    avatarType={avatarType}
                    size="xl"
                    showLabel={true}
                  />
                </div>
              </div>

              {/* Status & Controls */}
              <div className="w-full mt-4">
                {/* Meeting Mode Button */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    onClick={toggleMeetingMode}
                    className={`rounded-full px-6 py-2 transition-all ${
                      meetingMode 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 animate-meeting-mode' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                    }`}
                  >
                    {meetingMode ? (
                      <>
                        <PhoneOff className="w-4 h-4 mr-2" />
                        Meeting OFF
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Meeting Mode
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isMuted ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`rounded-full ${!isMuted ? 'bg-blue-500 hover:bg-blue-600' : 'border-white/30 text-white hover:bg-white/10'}`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>

                  {!meetingMode && (
                    <Button
                      onClick={aiState === 'listening' ? stopListening : startListening}
                      disabled={aiState === 'thinking' || aiState === 'speaking'}
                      className={`rounded-full px-6 ${
                        aiState === 'listening'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                    >
                      {aiState === 'listening' ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {aiState === 'listening' ? 'Stop' : 'Talk'}
                    </Button>
                  )}
                </div>

                {/* Quick Stats */}
                {stats && (
                  <div className="flex justify-center gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center text-white">
                      <p className="text-lg font-bold">{stats.total_students || 0}</p>
                      <p className="text-[9px] text-white/60">Students</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center text-white">
                      <p className="text-lg font-bold">{stats.today_attendance?.present || 0}</p>
                      <p className="text-[9px] text-white/60">Present</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center text-white">
                      <p className="text-lg font-bold">₹{((stats.today_fee_collection || 0) / 1000).toFixed(0)}K</p>
                      <p className="text-[9px] text-white/60">Fee</p>
                    </div>
                  </div>
                )}

                {/* Status Text */}
                <p className="text-white/60 text-xs text-center mt-3">
                  {meetingMode ? '🎤 Meeting Mode ON - बोलते रहिए, Tino सुन रहा है' :
                   aiState === 'listening' ? '🎤 सुन रहा हूं...' :
                   aiState === 'thinking' ? '🧠 सोच रहा हूं...' :
                   aiState === 'speaking' ? '🗣️ जवाब दे रहा हूं...' :
                   'Avatar पर click करें या Talk बटन दबाएं'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Chat (Toggleable) */}
        {showChat && (
          <div className="lg:w-96 flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px] max-h-[500px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Quick Actions */}
                {messages.length <= 1 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => sendMessage(action.query)}
                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                          <action.icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-slate-600">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                      
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                          {msg.suggestions.slice(0, 2).map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(sug)}
                              className="text-[9px] bg-white/80 hover:bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Streaming */}
                {currentResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-xl px-3 py-2 bg-slate-100">
                      <p className="whitespace-pre-wrap text-xs">{currentResponse}</p>
                      <span className="inline-block w-1.5 h-3 bg-blue-500 rounded-sm animate-pulse ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Thinking */}
                {aiState === 'thinking' && !currentResponse && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200" />
                      </div>
                      <span className="text-[10px] text-slate-500">सोच रहा है...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type here..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-xs"
                    disabled={aiState === 'listening'}
                  />
                  <Button
                    onClick={() => sendMessage(inputText)}
                    disabled={!inputText.trim() || aiState === 'thinking'}
                    size="sm"
                    className="rounded-lg bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
