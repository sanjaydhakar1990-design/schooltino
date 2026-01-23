/**
 * Tino AI Command Center
 * Central AI Assistant for Schooltino - Hindi/English Voice & Text
 * "Tino - Your School's Intelligent Assistant"
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Brain, Send, Mic, MicOff, Loader2, Sparkles, 
  Users, GraduationCap, IndianRupee, Clock, FileText,
  MessageSquare, Calendar, Bell, ChevronRight, X,
  CheckCircle, AlertCircle, Zap, Bot, Volume2, VolumeX,
  TrendingUp, BookOpen, ClipboardCheck, Settings, RefreshCw,
  ArrowRight, Lightbulb, Star
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Quick command suggestions in Hindi
const QUICK_COMMANDS = [
  { text: "आज की attendance कितनी है?", icon: ClipboardCheck, color: "bg-blue-500" },
  { text: "आज कितनी fees collect हुई?", icon: IndianRupee, color: "bg-green-500" },
  { text: "कितने students absent हैं?", icon: Users, color: "bg-orange-500" },
  { text: "Fee defaulters की list दो", icon: AlertCircle, color: "bg-red-500" },
  { text: "इस महीने की summary दो", icon: TrendingUp, color: "bg-purple-500" },
  { text: "Pending leaves कितने हैं?", icon: Calendar, color: "bg-teal-500" },
];

// Tino capabilities showcase
const TINO_CAPABILITIES = [
  { 
    title: "Student Data", 
    icon: Users, 
    examples: ["Class 5 के students दिखाओ", "Rahul Kumar की details बताओ"],
    color: "from-blue-500 to-indigo-600"
  },
  { 
    title: "Fee Management", 
    icon: IndianRupee, 
    examples: ["आज की collection कितनी?", "Pending fees की list"],
    color: "from-green-500 to-emerald-600"
  },
  { 
    title: "Attendance", 
    icon: ClipboardCheck, 
    examples: ["आज कितने absent हैं?", "Class 8 की attendance"],
    color: "from-orange-500 to-amber-600"
  },
  { 
    title: "Reports", 
    icon: FileText, 
    examples: ["Monthly report बनाओ", "Fee collection summary"],
    color: "from-purple-500 to-pink-600"
  },
];

export default function TinoAICenter() {
  const { user, schoolId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stats, setStats] = useState(null);
  const [showCapabilities, setShowCapabilities] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch quick stats on load
  useEffect(() => {
    fetchQuickStats();
    // Add welcome message
    addTinoMessage("🎓 नमस्ते! मैं Tino हूं, आपका School Assistant। मुझसे कुछ भी पूछें - Hindi या English में!");
  }, []);

  const fetchQuickStats = async () => {
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

  const addTinoMessage = (text, data = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'tino',
      content: text,
      data,
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
  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    
    setShowCapabilities(false);
    addUserMessage(text);
    setInput('');
    setIsLoading(true);

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

      const { response: tinoResponse, data, suggestions } = response.data;
      addTinoMessage(tinoResponse, { suggestions });
      
      // Speak the response
      if (isSpeaking) {
        speakText(tinoResponse);
      }
      
    } catch (error) {
      console.error('Tino AI Error:', error);
      addTinoMessage("माफ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।");
      toast.error('Failed to get response from Tino');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'hi-IN'; // Hindi
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text to Speech
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Remove emojis for cleaner speech
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      synthRef.current.speak(utterance);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="tino-ai-center">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Tino AI
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by GPT-5.2
                </Badge>
              </h1>
              <p className="text-white/80 text-sm mt-1">
                आपका Intelligent School Assistant - Hindi & English में बात करें
              </p>
            </div>
          </div>
          
          {/* Stats Cards */}
          {stats && (
            <div className="hidden md:flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{stats.total_students || 0}</p>
                <p className="text-xs text-white/70">Students</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{stats.today_attendance?.present || 0}</p>
                <p className="text-xs text-white/70">Present Today</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">₹{(stats.today_fee_collection || 0).toLocaleString()}</p>
                <p className="text-xs text-white/70">Fee Today</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {showCapabilities && messages.length <= 1 && (
              <>
                {/* Quick Commands */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Commands - Click करके पूछें
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {QUICK_COMMANDS.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(cmd.text)}
                        className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-all text-sm"
                      >
                        <div className={`w-8 h-8 ${cmd.color} rounded-lg flex items-center justify-center`}>
                          <cmd.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-slate-700 line-clamp-1">{cmd.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Tino क्या-क्या कर सकता है
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TINO_CAPABILITIES.map((cap, idx) => (
                      <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => sendMessage(cap.examples[0])}>
                        <div className={`h-1 bg-gradient-to-r ${cap.color}`} />
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <cap.icon className="w-5 h-5 text-slate-600" />
                            <span className="font-medium text-sm">{cap.title}</span>
                          </div>
                          <div className="space-y-1">
                            {cap.examples.map((ex, i) => (
                              <p key={i} className="text-xs text-slate-500 line-clamp-1">"{ex}"</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'tino' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">Tino</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  
                  {/* Suggestions */}
                  {msg.data?.suggestions && msg.data.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">आगे पूछें:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.data.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(sug)}
                            className="text-xs bg-white hover:bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] mt-2 opacity-60">
                    {msg.timestamp.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-sm text-slate-600">Tino सोच रहा है...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              {/* Voice Toggle */}
              <Button
                variant={isSpeaking ? "default" : "outline"}
                size="icon"
                onClick={() => setIsSpeaking(!isSpeaking)}
                className="rounded-full"
                title="Toggle voice response"
              >
                {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              {/* Voice Input */}
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={isListening ? stopListening : startListening}
                className="rounded-full"
                title="Voice input (Hindi)"
              >
                {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tino से कुछ भी पूछें... (Hindi / English)"
                  className="pr-12 rounded-full bg-white border-slate-200 focus:border-indigo-400"
                  disabled={isLoading || isListening}
                />
                {isListening && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" />
                      <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse delay-75" />
                      <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Tino AI by Schooltino • Powered by GPT-5.2 • Hindi & English supported
            </p>
          </div>
        </div>

        {/* Right Sidebar - Stats & Actions */}
        <div className="hidden lg:block w-80 space-y-4">
          {/* Today's Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                आज की Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats ? (
                <>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Total Students</span>
                    </div>
                    <span className="font-bold text-blue-600">{stats.total_students}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Present Today</span>
                    </div>
                    <span className="font-bold text-green-600">{stats.today_attendance?.present || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Absent Today</span>
                    </div>
                    <span className="font-bold text-red-600">{stats.today_attendance?.absent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Fee Collection</span>
                    </div>
                    <span className="font-bold text-emerald-600">₹{(stats.today_fee_collection || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Pending Leaves</span>
                    </div>
                    <span className="font-bold text-orange-600">{stats.pending_leaves || 0}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading stats...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Popular Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Class 10 की result summary",
                "Fee defaulters को SMS भेजो",
                "इस week की attendance report",
                "New student add करो"
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(cmd)}
                  className="w-full text-left text-xs p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                  <span className="text-slate-600">{cmd}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={fetchQuickStats}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Stats
          </Button>
        </div>
      </div>
    </div>
  );
}
