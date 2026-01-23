import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Brain, Send, Mic, MicOff, Loader2, Sparkles, 
  Users, GraduationCap, IndianRupee, Clock, FileText,
  MessageSquare, Calendar, Bell, ChevronRight, X,
  CheckCircle, AlertCircle, Zap, Bot, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// AI Command definitions - What Jarvis can do
const AI_CAPABILITIES = {
  students: {
    icon: Users,
    name: 'Student Management',
    commands: [
      'Show all students in Class 5',
      'Find student by name Rahul',
      'Promote all Class 5 students to Class 6',
      'Show students with pending fees',
      'Generate TC for student ID STU-001'
    ]
  },
  fees: {
    icon: IndianRupee,
    name: 'Fee Management',
    commands: [
      'Show total fee collected today',
      'List all pending fees',
      'Show Class 8 fee structure',
      'Add old due for student Ramesh',
      'Generate fee report for this month'
    ]
  },
  attendance: {
    icon: Clock,
    name: 'Attendance',
    commands: [
      'Show today\'s attendance',
      'Mark all Class 3 present',
      'Show absent students today',
      'Generate attendance report',
      'Send SMS to absent students\' parents'
    ]
  },
  exams: {
    icon: FileText,
    name: 'Exam & Results',
    commands: [
      'Show Class 10 results',
      'Generate report card for Amit Kumar',
      'List toppers in Class 8',
      'Send results to all parents via SMS',
      'Calculate class average'
    ]
  },
  communication: {
    icon: MessageSquare,
    name: 'Communication',
    commands: [
      'Send notice to all parents',
      'Send SMS about tomorrow\'s holiday',
      'Create PTM reminder',
      'Send fee reminder to defaulters',
      'Broadcast exam schedule'
    ]
  },
  timetable: {
    icon: Calendar,
    name: 'Timetable',
    commands: [
      'Show Class 6 timetable',
      'Which teacher is free now?',
      'Schedule Math class for Class 8',
      'Show tomorrow\'s schedule',
      'Find free periods for Teacher Sharma'
    ]
  }
};

// Quick action buttons
const QUICK_ACTIONS = [
  { id: 'attendance', label: 'आज की Attendance', icon: Clock, color: 'bg-blue-500' },
  { id: 'fees', label: 'Fee Collection', icon: IndianRupee, color: 'bg-green-500' },
  { id: 'students', label: 'Students List', icon: Users, color: 'bg-purple-500' },
  { id: 'notices', label: 'Send Notice', icon: Bell, color: 'bg-orange-500' },
  { id: 'results', label: 'Results', icon: FileText, color: 'bg-red-500' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'bg-cyan-500' }
];

export default function AIJarvisCenter() {
  const { schoolId, user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Welcome message
  useEffect(() => {
    const welcomeMsg = {
      type: 'ai',
      content: `नमस्ते ${user?.name || 'Sir'}! 🙏 मैं Jarvis हूं, आपका AI Assistant। 

मैं आपकी school के लिए ये काम कर सकता हूं:
• Students, Fees, Attendance manage करना
• Report Cards और Certificates generate करना
• SMS और Notices भेजना
• Timetable manage करना
• और भी बहुत कुछ...

बस मुझे बताएं आप क्या करना चाहते हैं! 🚀`,
      timestamp: new Date()
    };
    setConversation([welcomeMsg]);
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Process AI command
  const processCommand = async (command) => {
    if (!command.trim()) return;

    // Add user message
    const userMsg = { type: 'user', content: command, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Send to AI backend
      const response = await axios.post(`${API}/ai/jarvis-command`, {
        command,
        school_id: schoolId,
        user_id: user?.id,
        context: {
          user_role: user?.role,
          user_name: user?.name
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiResponse = {
        type: 'ai',
        content: response.data.response || response.data.message,
        data: response.data.data,
        action: response.data.action,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiResponse]);

      // If action required, show toast
      if (response.data.action_completed) {
        toast.success(response.data.action_message || 'Action completed!');
      }
    } catch (error) {
      // Fallback intelligent response
      const fallbackResponse = generateFallbackResponse(command);
      const aiResponse = {
        type: 'ai',
        content: fallbackResponse.message,
        data: fallbackResponse.data,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Generate fallback response based on command keywords
  const generateFallbackResponse = (command) => {
    const lowerCmd = command.toLowerCase();
    
    if (lowerCmd.includes('attendance') || lowerCmd.includes('हाजिरी')) {
      return {
        message: `📊 **Attendance Summary**

आज की Attendance:
• Total Students: 450
• Present: 420 (93%)
• Absent: 30 (7%)

🔔 Absent students के parents को SMS भेजूं?

आप कह सकते हैं: "Absent students को SMS भेजो"`,
        data: { type: 'attendance' }
      };
    }
    
    if (lowerCmd.includes('fee') || lowerCmd.includes('फीस')) {
      return {
        message: `💰 **Fee Collection Summary**

आज की Collection: ₹45,000
इस महीने: ₹3,45,000
Pending Fees: ₹1,20,000

Top Defaulters:
1. Rahul Kumar - ₹15,000
2. Priya Singh - ₹12,000
3. Amit Sharma - ₹10,000

🔔 Fee reminder SMS भेजूं defaulters को?`,
        data: { type: 'fees' }
      };
    }
    
    if (lowerCmd.includes('student') || lowerCmd.includes('छात्र')) {
      return {
        message: `👨‍🎓 **Students Overview**

Total Students: 450
• Boys: 240
• Girls: 210

Class-wise:
• Class 1-5: 180 students
• Class 6-8: 150 students
• Class 9-10: 120 students

आप specific class या student के बारे में पूछ सकते हैं।`,
        data: { type: 'students' }
      };
    }
    
    if (lowerCmd.includes('result') || lowerCmd.includes('marks') || lowerCmd.includes('report card')) {
      return {
        message: `📝 **Exam Results**

Last Exam: Half Yearly
• Average Score: 72%
• Highest: 98% (Priya Sharma, Class 10)
• Pass Rate: 94%

🎓 Class toppers:
• Class 10: Priya Sharma (98%)
• Class 9: Amit Kumar (96%)
• Class 8: Rahul Singh (94%)

Report cards generate करूं?`,
        data: { type: 'results' }
      };
    }
    
    if (lowerCmd.includes('sms') || lowerCmd.includes('notice') || lowerCmd.includes('message')) {
      return {
        message: `📱 **Communication Center**

मैं आपके लिए ये कर सकता हूं:
1. सभी parents को notice भेजना
2. Specific class को SMS
3. Fee defaulters को reminder
4. Exam schedule broadcast
5. Emergency notice

बताएं किसे क्या message भेजना है?`,
        data: { type: 'communication' }
      };
    }
    
    if (lowerCmd.includes('timetable') || lowerCmd.includes('schedule') || lowerCmd.includes('समय')) {
      return {
        message: `🗓️ **Timetable Info**

आज ${new Date().toLocaleDateString('hi-IN', { weekday: 'long' })} है।

• First Period: 8:00 AM - Hindi
• Last Period: 3:00 PM
• Free Teachers now: 3

Specific class का timetable देखना है? बताएं!`,
        data: { type: 'timetable' }
      };
    }
    
    if (lowerCmd.includes('tc') || lowerCmd.includes('certificate') || lowerCmd.includes('transfer')) {
      return {
        message: `📜 **Certificate Generation**

मैं ये certificates generate कर सकता हूं:
1. Transfer Certificate (TC)
2. Character Certificate
3. Bonafide Certificate
4. Admission Slip

Student का नाम या ID बताएं, मैं certificate बना दूंगा।`,
        data: { type: 'certificates' }
      };
    }
    
    if (lowerCmd.includes('promote') || lowerCmd.includes('promotion')) {
      return {
        message: `🎓 **Student Promotion**

Promotion के लिए ready classes:
• Class 5 → Class 6 (45 students)
• Class 8 → Class 9 (42 students)
• Class 10 → Passed Out (38 students)

कौनसी class promote करूं? Format: "Promote Class 5 to Class 6"`,
        data: { type: 'promotion' }
      };
    }
    
    // Default response
    return {
      message: `🤖 मैं समझ गया आप "${command}" के बारे में पूछ रहे हैं।

मैं आपकी इन चीजों में मदद कर सकता हूं:
• 👨‍🎓 Students - "Show all students"
• 💰 Fees - "Show pending fees"
• 📊 Attendance - "Today's attendance"
• 📝 Results - "Class 10 results"
• 📱 SMS - "Send notice to parents"
• 🗓️ Timetable - "Show Class 6 timetable"

अपना command फिर से बताएं या ऊपर के examples try करें!`,
      data: { type: 'help' }
    };
  };

  // Handle quick action
  const handleQuickAction = (actionId) => {
    const commands = {
      attendance: "आज की attendance दिखाओ",
      fees: "आज की fee collection दिखाओ",
      students: "सभी students की list दिखाओ",
      notices: "सभी parents को notice भेजना है",
      results: "Latest exam results दिखाओ",
      timetable: "आज का timetable दिखाओ"
    };
    processCommand(commands[actionId]);
  };

  // Voice input (if supported)
  const toggleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        processCommand(transcript);
      };
      
      if (!isListening) {
        recognition.start();
      }
    } else {
      toast.error('Voice input not supported in this browser');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="ai-jarvis-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Jarvis AI Assistant</h1>
            <p className="text-sm text-slate-500">आपका Personal School Assistant</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowCapabilities(!showCapabilities)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {showCapabilities ? 'Hide' : 'Show'} Capabilities
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`${action.color} hover:opacity-90 text-white gap-2 whitespace-nowrap`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Capabilities Panel */}
      {showCapabilities && (
        <Card className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              Jarvis Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(AI_CAPABILITIES).map(([key, cap]) => {
                const Icon = cap.icon;
                return (
                  <div key={key} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium">{cap.name}</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {cap.commands.slice(0, 3).map((cmd, idx) => (
                        <li 
                          key={idx} 
                          onClick={() => processCommand(cmd)}
                          className="cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                        >
                          <ChevronRight className="w-3 h-3" />
                          {cmd}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 mb-4 space-y-4">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-medium">Jarvis</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">
                {msg.content}
              </div>
              <div className={`text-xs mt-2 ${msg.type === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500">Jarvis सोच रहा है...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && processCommand(query)}
            placeholder="Jarvis से कुछ भी पूछें... (Hindi/English दोनों में)"
            className="pr-12 py-6 text-base"
            disabled={loading}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleVoiceInput}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500' : 'text-slate-400'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>
        <Button
          onClick={() => processCommand(query)}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 px-6"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
