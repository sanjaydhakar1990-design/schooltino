/**
 * Tino AI Agent - Real AI Conversation Interface
 * Inspired by ElevenLabs Agents
 * 
 * Features:
 * - Visual orb with state animations (idle, listening, thinking, speaking)
 * - Continuous voice conversation
 * - Real-time text streaming
 * - Natural conversation flow
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import TinoOrb from '../components/TinoOrb';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Minimize2, Maximize2,
  Send, Settings, RefreshCw, MessageSquare, Sparkles,
  Users, IndianRupee, GraduationCap, ClipboardCheck, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Quick action buttons
const QUICK_ACTIONS = [
  { id: 'attendance', icon: ClipboardCheck, label: 'आज की attendance', query: 'आज की attendance कितनी है?', color: 'text-blue-500' },
  { id: 'fees', icon: IndianRupee, label: 'Fee collection', query: 'आज की fee collection कितनी है?', color: 'text-emerald-500' },
  { id: 'students', icon: Users, label: 'Total students', query: 'कितने students हैं?', color: 'text-purple-500' },
  { id: 'summary', icon: Calendar, label: 'आज की summary', query: 'आज की पूरी summary दो', color: 'text-orange-500' },
];

export default function TinoAIAgent() {
  const { user, schoolId } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [aiState, setAiState] = useState('idle'); // idle, thinking (NO listening, NO speaking - text only)
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [inputText, setInputText] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // ❌ VOICE DISABLED
  const [isMuted, setIsMuted] = useState(true); // ❌ ALWAYS MUTED (no audio)
  const [stats, setStats] = useState(null);
  
  // ❌ NO voice recognition - text only
  const recognitionRef = useRef(null);
  const synthRef = useRef(null); // ❌ NO speech synthesis
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Fetch quick stats
  useEffect(() => {
    fetchStats();
    // Welcome message
    setTimeout(() => {
      addTinoMessage("🎓 नमस्ते! मैं Tino हूं - आपका AI School Assistant। मुझसे Hindi या English में कुछ भी पूछें।");
    }, 500);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/tino-ai/quick-stats/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const addTinoMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'tino',
      content: text,
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

  // Send message to Tino AI
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

      const { response: tinoResponse } = response.data;
      
      // Simulate streaming effect
      setAiState('speaking');
      await streamResponse(tinoResponse);
      
      addTinoMessage(tinoResponse);
      setCurrentResponse('');
      
      // Speak the response
      if (!isMuted) {
        speakText(tinoResponse);
      }
      
    } catch (error) {
      console.error('Tino AI Error:', error);
      setAiState('idle');
      addTinoMessage("माफ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।");
    }
  };

  // Simulate streaming text effect
  const streamResponse = async (text) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      setCurrentResponse(prev => prev + (i > 0 ? ' ' : '') + words[i]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  // Voice Recognition
  // ❌ VOICE DISABLED - Text chat only
  const startListening = useCallback(() => {
    toast.info('🔇 Voice disabled. Please type your message.');
    return;
  }, []);

  const stopListening = () => {
    setAiState('idle');
  };

  const speakText = (text) => {
    // No voice output - text only
    setAiState('idle');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleQuickAction = (query) => {
    sendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" data-testid="tino-ai-agent">
      <Card className={`tino-panel w-full max-w-2xl transition-all duration-300 ${isMinimized ? 'h-20' : 'h-[85vh] max-h-[700px]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <TinoOrb state={aiState} size="sm" />
            </div>
            <div className="ml-4">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Tino AI
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  GPT-5.2
                </Badge>
              </h2>
              <p className="text-xs text-slate-500">
                {aiState === 'listening' ? '🎤 सुन रहा हूं...' :
                 aiState === 'thinking' ? '🧠 सोच रहा हूं...' :
                 aiState === 'speaking' ? '🗣️ बोल रहा हूं...' :
                 'आपका Intelligent School Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Main Content Area */}
            <CardContent className="flex-1 flex flex-col p-0 h-[calc(100%-140px)]">
              {/* Stats Bar */}
              {stats && (
                <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                  <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{stats.total_students || 0}</span>
                    <span className="text-slate-500">Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">{stats.today_attendance?.present || 0}</span>
                    <span className="text-slate-500">Present</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <IndianRupee className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">₹{(stats.today_fee_collection || 0).toLocaleString()}</span>
                    <span className="text-slate-500">Today</span>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick Actions - Show when few messages */}
                {messages.length <= 2 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.query)}
                        className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-left"
                      >
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                        <span className="text-sm text-slate-700">{action.label}</span>
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-60">
                        {msg.timestamp.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Current streaming response */}
                {currentResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-100 text-slate-800">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{currentResponse}</p>
                      <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1" />
                    </div>
                  </div>
                )}

                {/* Thinking indicator */}
                {aiState === 'thinking' && !currentResponse && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-slate-500">Tino सोच रहा है...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
              {/* Voice/Mute Controls */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <Button
                  variant={isMuted ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`rounded-full ${!isMuted ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* ❌ MICROPHONE DISABLED - Text-only mode
                <button className="hidden">Voice Disabled</button>
                */}
                
                {/* Text-only notice */}
                <div className="text-center text-sm text-slate-500 mb-2">
                  📝 Text Chat Only (Voice Disabled)
                </div>

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
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  disabled={aiState === 'listening'}
                />
                <Button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || aiState === 'thinking'}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-[10px] text-center text-slate-400 mt-2">
                🎤 Voice बटन दबाएं या टाइप करें • Powered by GPT-5.2
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
