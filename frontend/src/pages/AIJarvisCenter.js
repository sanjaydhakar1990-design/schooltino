/**
 * Tino AI Command Center - Real AI Agent Interface
 * Inspired by ElevenLabs Conversational AI
 * 
 * Features:
 * - Central AI Orb with state animations
 * - Voice-first interaction with visual feedback
 * - Real-time text streaming
 * - Natural conversation flow - feels like talking to a real person
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import TinoOrb from '../components/TinoOrb';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  Users, IndianRupee, ClipboardCheck, Calendar, TrendingUp,
  RefreshCw, ChevronRight, Zap, MessageSquare, Star,
  ArrowRight, AlertCircle, CheckCircle, History
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Quick action cards
const QUICK_ACTIONS = [
  { 
    id: 'attendance', 
    icon: ClipboardCheck, 
    label: 'आज की Attendance', 
    query: 'आज की attendance कितनी है?', 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50'
  },
  { 
    id: 'fees', 
    icon: IndianRupee, 
    label: 'Fee Collection', 
    query: 'आज की fee collection कितनी है?', 
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50'
  },
  { 
    id: 'absent', 
    icon: AlertCircle, 
    label: 'Absent Students', 
    query: 'आज कितने students absent हैं?', 
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50'
  },
  { 
    id: 'summary', 
    icon: TrendingUp, 
    label: 'Daily Summary', 
    query: 'आज की पूरी summary दो', 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50'
  },
];

// Conversation history
const SUGGESTED_QUERIES = [
  "Class 10 की result summary",
  "Fee defaulters की list दो",
  "इस week की attendance report",
  "Pending leaves कितने हैं?",
  "New student add करने का process",
];

export default function TinoAICenter() {
  const { user, schoolId, schoolData } = useAuth();
  const [aiState, setAiState] = useState('idle'); // idle, listening, thinking, speaking
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Initial setup
  useEffect(() => {
    fetchStats();
    // Add welcome message after brief delay
    const timer = setTimeout(() => {
      addTinoMessage("🎓 नमस्ते! मैं Tino हूं - आपका AI School Assistant। मुझसे कुछ भी पूछें Hindi या English में!");
    }, 800);
    return () => clearTimeout(timer);
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

  // Send message to Tino
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    addUserMessage(text);
    setInputText('');
    setAiState('thinking');
    setCurrentResponse('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/tino-ai/chat`, {
        message: text,
        school_id: schoolId,
        user_id: user?.id,
        session_id: `tino_${schoolId}_${user?.id}`,
        language: 'hi'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { response: tinoResponse, suggestions } = response.data;
      
      // Streaming effect
      setAiState('speaking');
      await streamResponse(tinoResponse);
      
      addTinoMessage(tinoResponse, suggestions);
      setCurrentResponse('');
      
      // Text to speech
      if (!isMuted) {
        speakText(tinoResponse);
      } else {
        setAiState('idle');
      }
      
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
    recognitionRef.current.lang = 'hi-IN';
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
  }, [aiState]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setAiState('idle');
  };

  // Text to speech
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/\*\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.onend = () => setAiState('idle');
      synthRef.current.speak(utterance);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="tino-ai-center">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-6">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Main Tino Orb */}
            <div className="relative">
              <TinoOrb state={aiState} size="lg" />
            </div>
            
            <div className="text-white">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Tino AI
                <Badge className="bg-white/20 text-white border-0 text-sm">
                  <Sparkles className="w-4 h-4 mr-1" />
                  GPT-5.2
                </Badge>
              </h1>
              <p className="text-white/80 mt-1 text-lg">
                {aiState === 'listening' ? '🎤 मैं सुन रहा हूं... बोलिए' :
                 aiState === 'thinking' ? '🧠 सोच रहा हूं...' :
                 aiState === 'speaking' ? '🗣️ जवाब दे रहा हूं...' :
                 'आपका Intelligent School Assistant'}
              </p>
              <p className="text-white/60 text-sm mt-1">
                Hindi & English में बात करें • Voice + Text supported
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="hidden md:flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center text-white">
                <p className="text-3xl font-bold">{stats.total_students || 0}</p>
                <p className="text-xs text-white/70">Students</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center text-white">
                <p className="text-3xl font-bold">{stats.today_attendance?.present || 0}</p>
                <p className="text-xs text-white/70">Present</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center text-white">
                <p className="text-3xl font-bold">₹{((stats.today_fee_collection || 0) / 1000).toFixed(0)}K</p>
                <p className="text-xs text-white/70">Fee Today</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Quick Actions - Show at start */}
            {messages.length <= 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions - Click करके पूछें
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.query)}
                      className={`flex items-center gap-3 p-4 ${action.bgColor} hover:shadow-md rounded-xl transition-all group`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-medium text-slate-700 block">{action.label}</span>
                        <span className="text-xs text-slate-500">पूछें →</span>
                      </div>
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
                  className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.role === 'tino' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">Tino</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                      <p className="text-xs text-slate-500 mb-2">आगे पूछें:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(sug)}
                            className="text-xs bg-white hover:bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] mt-2 opacity-50">
                    {msg.timestamp.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {currentResponse && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">Tino</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{currentResponse}</p>
                  <span className="inline-block w-2 h-5 bg-indigo-500 rounded-sm animate-pulse ml-1" />
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {aiState === 'thinking' && !currentResponse && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-slate-500">Tino सोच रहा है...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant={isMuted ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`rounded-full ${!isMuted ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="ml-1 text-xs">{isMuted ? 'Muted' : 'Sound'}</span>
              </Button>

              {/* Main Voice Button */}
              <button
                onClick={aiState === 'listening' ? stopListening : startListening}
                disabled={aiState === 'thinking' || aiState === 'speaking'}
                className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
                  aiState === 'listening'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 scale-110 shadow-xl shadow-pink-500/40'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 shadow-lg shadow-indigo-500/30'
                } ${(aiState === 'thinking' || aiState === 'speaking') ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {aiState === 'listening' ? (
                  <MicOff className="w-8 h-8 text-white mx-auto" />
                ) : (
                  <Mic className="w-8 h-8 text-white mx-auto" />
                )}
                {aiState === 'listening' && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping" />
                    <span className="absolute inset-2 rounded-full bg-pink-500/20 animate-ping delay-150" />
                  </>
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                className="rounded-full"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="ml-1 text-xs">Refresh</span>
              </Button>
            </div>

            {/* Text Input */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tino से कुछ भी पूछें... (Hindi / English)"
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all pr-12"
                  disabled={aiState === 'listening'}
                />
                {aiState === 'listening' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-4 bg-pink-500 rounded-full animate-pulse" />
                      <div className="w-1 h-6 bg-pink-500 rounded-full animate-pulse delay-75" />
                      <div className="w-1 h-3 bg-pink-500 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || aiState === 'thinking'}
                size="lg"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              🎤 Voice बटन दबाकर बोलें या टाइप करें • Tino AI by Schooltino • GPT-5.2 Powered
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-80 space-y-4">
          {/* Today's Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                आज की Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">Total Students</span>
                    </div>
                    <span className="font-bold text-blue-600">{stats.total_students || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Present Today</span>
                    </div>
                    <span className="font-bold text-emerald-600">{stats.today_attendance?.present || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">Absent Today</span>
                    </div>
                    <span className="font-bold text-orange-600">{stats.today_attendance?.absent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">Fee Collection</span>
                    </div>
                    <span className="font-bold text-purple-600">₹{(stats.today_fee_collection || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <span className="text-sm">Pending Leaves</span>
                    </div>
                    <span className="font-bold text-amber-600">{stats.pending_leaves || 0}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Queries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Popular Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED_QUERIES.map((query, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(query)}
                  className="w-full text-left text-xs p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl flex items-center gap-2 transition-all group"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  <span className="text-slate-600">{query}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
