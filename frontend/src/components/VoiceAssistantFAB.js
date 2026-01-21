/**
 * Tino AI Assistant - Voice + Text + JARVIS MODE
 * - Male/Female voice toggle with avatar change
 * - ElevenLabs TTS for high quality voice
 * - Text input + Voice input
 * - Role-based commands
 * - JARVIS MODE: Continuous listening for meetings
 */
import { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, X, Volume2, Loader2, CheckCircle, XCircle,
  Send, User, Sparkles, Settings, MessageSquare, History, Trash2, ChevronLeft, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Avatar images based on gender
const AVATARS = {
  male: 'https://api.dicebear.com/7.x/personas/svg?seed=TinoMale&backgroundColor=4f46e5&hair=short01&clothingColor=4f46e5',
  female: 'https://api.dicebear.com/7.x/personas/svg?seed=TinoFemale&backgroundColor=ec4899&hair=long01&clothingColor=ec4899'
};

export default function VoiceAssistantFAB({ isOpen: externalOpen, onClose }) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onClose ? (val) => { if(!val) onClose(); } : setInternalOpen;
  
  // Voice settings
  const [voiceGender, setVoiceGender] = useState(() => {
    return localStorage.getItem('tino_voice_gender') || 'female';
  });
  
  // States
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // JARVIS MODE - Continuous Listening
  const [jarvisMode, setJarvisMode] = useState(false);
  const [jarvisSilenceTimer, setJarvisSilenceTimer] = useState(null);
  const jarvisRecognitionRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save voice preference
  useEffect(() => {
    localStorage.setItem('tino_voice_gender', voiceGender);
  }, [voiceGender]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`tino_chat_history_${user?.id}`);
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load chat history');
      }
    }
  }, [user?.id]);

  // Save messages to history when conversation ends
  const saveToHistory = () => {
    if (messages.length > 1) {
      const newSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        messages: messages.slice(1), // Skip greeting
        preview: messages[1]?.text?.slice(0, 50) || 'Chat session'
      };
      const updatedHistory = [newSession, ...chatHistory].slice(0, 20); // Keep last 20
      setChatHistory(updatedHistory);
      localStorage.setItem(`tino_chat_history_${user?.id}`, JSON.stringify(updatedHistory));
    }
  };

  // Delete a chat session
  const deleteSession = (sessionId) => {
    const updatedHistory = chatHistory.filter(s => s.id !== sessionId);
    setChatHistory(updatedHistory);
    localStorage.setItem(`tino_chat_history_${user?.id}`, JSON.stringify(updatedHistory));
    toast.success('Chat deleted');
  };

  // Clear all history
  const clearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem(`tino_chat_history_${user?.id}`);
    toast.success('All chat history cleared');
  };

  // Load a previous session
  const loadSession = (session) => {
    setMessages([{ type: 'ai', text: getGreeting(), time: new Date() }, ...session.messages]);
    setShowHistory(false);
    toast.success('Chat loaded');
  };

  // ============== JARVIS MODE - Continuous Listening ==============
  // Start Jarvis Mode - Always listening like a meeting assistant
  const startJarvisMode = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Jarvis Mode requires Chrome browser');
      return;
    }
    
    setJarvisMode(true);
    addMessage('ai', '🤖 Jarvis Mode ON! Main ab hamesha sun raha hoon. Meeting mein help ke liye ready hoon. "Tino" bolke mujhe address karein.', { isJarvisNotification: true });
    speakText('Jarvis Mode activated. Main ab aapki meeting mein help ke liye ready hoon.');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';
    
    let finalTranscript = '';
    let silenceTimeout = null;
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Clear previous silence timeout
      if (silenceTimeout) clearTimeout(silenceTimeout);
      
      // Set new silence timeout - process after 2 seconds of silence
      silenceTimeout = setTimeout(async () => {
        if (finalTranscript.trim()) {
          const text = finalTranscript.trim().toLowerCase();
          
          // Check if user addressed Tino
          if (text.includes('tino') || text.includes('टीनो') || text.includes('ai') || text.includes('assistant')) {
            addMessage('user', finalTranscript.trim());
            await processJarvisCommand(finalTranscript.trim());
          } else {
            // Passively listen - maybe offer suggestion
            if (text.length > 50 && (text.includes('problem') || text.includes('issue') || text.includes('समस्या') || text.includes('help'))) {
              const suggestionMsg = 'Sir, agar mujhe address karein "Tino" bol kar, to main help kar sakti hoon.';
              addMessage('ai', suggestionMsg, { isJarvisSuggestion: true });
              // Don't speak to avoid interrupting meeting
            }
          }
          finalTranscript = '';
        }
      }, 2000);
    };
    
    recognition.onerror = (event) => {
      console.error('Jarvis recognition error:', event.error);
      if (event.error !== 'no-speech') {
        // Restart on error (except no-speech)
        setTimeout(() => {
          if (jarvisMode) recognition.start();
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if Jarvis mode is still on
      if (jarvisMode) {
        setTimeout(() => recognition.start(), 500);
      }
    };
    
    recognition.start();
    jarvisRecognitionRef.current = recognition;
    
    toast.success('Jarvis Mode: Meeting Assistant Ready! 🤖');
  };
  
  // Stop Jarvis Mode
  const stopJarvisMode = () => {
    setJarvisMode(false);
    if (jarvisRecognitionRef.current) {
      jarvisRecognitionRef.current.stop();
      jarvisRecognitionRef.current = null;
    }
    addMessage('ai', '🔴 Jarvis Mode OFF. Push-to-talk mode mein wapas aa gaye.', { isJarvisNotification: true });
    speakText('Jarvis Mode deactivated.');
    toast.info('Jarvis Mode OFF');
  };
  
  // Process Jarvis command (when user addresses Tino in continuous mode)
  const processJarvisCommand = async (text) => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/voice-assistant/chat`, {
        message: text,
        school_id: user?.school_id || 'default',
        user_id: user?.id,
        user_role: user?.role,
        voice_gender: voiceGender,
        is_jarvis_mode: true,
        context: 'meeting_assistant'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = response.data;
      
      // Polite response style for Jarvis mode
      let aiResponse = result.message;
      if (!aiResponse.includes('Sir') && !aiResponse.includes('sir')) {
        aiResponse = 'Sir, ' + aiResponse;
      }
      
      addMessage('ai', aiResponse, { 
        navigate: result.navigate_to,
        action: result.action,
        isJarvisResponse: true
      });
      
      // Speak the response
      speakText(aiResponse);
      
      // Handle navigation
      if (result.navigate_to) {
        setTimeout(() => {
          window.location.href = result.navigate_to;
        }, 2000);
      }
      
    } catch (error) {
      console.error('Jarvis command error:', error);
      addMessage('ai', 'Sir, kuch technical issue aa gaya. Kripya dobara try karein.');
    } finally {
      setIsProcessing(false);
    }
  };
  // ============== END JARVIS MODE ==============

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting();
      addMessage('ai', greeting);
      speakText(greeting);
    }
  }, [isOpen]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Namaste';
    
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 17) timeGreeting = 'Good Afternoon';
    else if (hour < 21) timeGreeting = 'Good Evening';
    else timeGreeting = 'Good Night';
    
    const name = user?.name?.split(' ')[0] || 'User';
    const role = user?.role || 'user';
    
    let roleHelp = 'school management mein help';
    if (role === 'teacher') roleHelp = 'teaching aur class management mein help';
    if (role === 'student') roleHelp = 'padhai aur school activities mein help';
    if (role === 'accountant') roleHelp = 'fee aur salary management mein help';
    
    return `${timeGreeting}, ${name}! Main Tino hoon, aapka AI assistant. Aap mujhse ${roleHelp} le sakte hain. Kya help chahiye?`;
  };

  const addMessage = (type, text, data = null) => {
    setMessages(prev => [...prev, { 
      type, 
      text, 
      data,
      time: new Date() 
    }]);
  };

  const toggleVoiceGender = () => {
    const newGender = voiceGender === 'male' ? 'female' : 'male';
    setVoiceGender(newGender);
    const msg = newGender === 'male' 
      ? 'Main ab male voice mein bolunga.' 
      : 'Main ab female voice mein bolungi.';
    addMessage('ai', msg);
    speakText(msg);
  };

  // Text-to-Speech
  const speakText = async (text) => {
    try {
      const res = await axios.post(`${API}/voice-assistant/tts`, {
        text: text,
        voice_gender: voiceGender
      });
      
      if (res.data.audio_base64) {
        playAudio(res.data.audio_base64);
      }
    } catch (err) {
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const playAudio = (base64Audio) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      audio.play().catch(console.error);
    } catch (err) {
      console.error('Audio play failed:', err);
    }
  };

  // Voice Recording
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
      // Transcribe
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', 'hi');
      
      const transcribeRes = await axios.post(`${API}/voice-assistant/transcribe`, formData);
      const userText = transcribeRes.data.transcribed_text;
      
      if (!userText?.trim()) {
        const msg = 'Kuch sun nahi paya. Dobara bolein.';
        addMessage('ai', msg);
        speakText(msg);
        return;
      }
      
      addMessage('user', userText);
      await processCommand(userText);
      
    } catch (err) {
      const msg = 'Voice processing mein problem hui. Text mein type karein.';
      addMessage('ai', msg);
      speakText(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process text/voice command
  const processCommand = async (text) => {
    setIsProcessing(true);
    
    try {
      const res = await axios.post(`${API}/voice-assistant/chat`, {
        message: text,
        school_id: user?.school_id || 'default',
        user_id: user?.id || '',
        user_role: user?.role || 'director',
        user_name: user?.name || 'User',
        voice_gender: voiceGender
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      
      // Handle confirmation
      if (result.requires_confirmation) {
        setPendingAction({
          action: result.action,
          message: result.message
        });
      }
      
      // Play audio
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      } else {
        speakText(result.message);
      }
      
      // Handle NAVIGATION - Actually navigate to the page
      if (result.navigate_to) {
        toast.success(`Opening ${result.navigate_to}...`);
        setTimeout(() => {
          setIsOpen(false); // Close the assistant
          window.location.href = result.navigate_to;
        }, 1500);
      }
      
      // Handle legacy redirect
      if (result.data?.redirect && !result.navigate_to) {
        setTimeout(() => {
          window.location.href = result.data.redirect;
        }, 2000);
      }
      
    } catch (err) {
      const msg = 'Kuch gadbad ho gayi. Dobara try karein.';
      addMessage('ai', msg);
      speakText(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    addMessage('user', textInput);
    processCommand(textInput);
    setTextInput('');
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsProcessing(true);
    
    try {
      const res = await axios.post(`${API}/voice-assistant/execute-command`, {
        command: pendingAction.action,
        school_id: user?.school_id || 'default',
        user_id: user?.id || '',
        user_role: user?.role || 'director',
        voice_gender: voiceGender,
        confirmed: true
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      setPendingAction(null);
      
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      } else {
        speakText(result.message);
      }
      
      toast.success('Action completed!');
      
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    const msg = 'Action cancel kar diya.';
    addMessage('ai', msg);
    speakText(msg);
  };

  // Check if user can use assistant
  const allowedRoles = ['director', 'principal', 'vice_principal', 'co_director', 'teacher', 'admin_staff', 'accountant', 'student'];
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col border border-slate-700"
            data-testid="tino-assistant-modal"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                {showHistory ? (
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="relative">
                    <img 
                      src={AVATARS[voiceGender]} 
                      alt="Tino AI"
                      className="w-12 h-12 rounded-full border-2 border-indigo-500"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      voiceGender === 'male' ? 'bg-indigo-500' : 'bg-pink-500'
                    }`} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {showHistory ? 'Chat History' : 'Tino AI'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {showHistory ? `${chatHistory.length} saved chats` : `${voiceGender === 'male' ? 'Male Voice' : 'Female Voice'} • ${user?.role}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!showHistory && (
                  <>
                    {/* Jarvis Mode Toggle */}
                    <button
                      onClick={jarvisMode ? stopJarvisMode : startJarvisMode}
                      className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                        jarvisMode 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 animate-pulse' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title={jarvisMode ? 'Stop Jarvis Mode' : 'Start Jarvis Mode (Meeting Assistant)'}
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">{jarvisMode ? 'LIVE' : 'Jarvis'}</span>
                    </button>
                    <button
                      onClick={() => setShowHistory(true)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                      title="Chat History"
                    >
                      <History className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </>
                )}
                {showHistory && chatHistory.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Clear All"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    saveToHistory();
                    setIsOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat History View */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">Koi saved chat nahi hai</p>
                  </div>
                ) : (
                  chatHistory.map((session) => (
                    <div 
                      key={session.id}
                      className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => loadSession(session)}
                        >
                          <p className="text-white text-sm font-medium truncate">
                            {session.preview}...
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(session.date).toLocaleDateString('hi-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Settings Panel */}
                {showSettings && (
                  <div className="p-4 bg-slate-800/50 border-b border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Voice Gender</span>
                  <button
                    onClick={toggleVoiceGender}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      voiceGender === 'male' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-pink-600 text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {voiceGender === 'male' ? 'Male' : 'Female'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Voice change karte hi avatar bhi change ho jayega
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-md' 
                      : 'bg-slate-700 text-slate-100 rounded-bl-md'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    {msg.data && msg.data.redirect && (
                      <p className="text-xs mt-2 opacity-75">
                        Redirecting...
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 rounded-2xl px-4 py-3 rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span className="text-sm text-slate-300">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Pending Action Confirmation */}
            {pendingAction && (
              <div className="p-4 bg-amber-500/10 border-t border-amber-500/30">
                <p className="text-sm text-amber-200 mb-3">{pendingAction.message}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={confirmAction}
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Haan, Karein
                  </Button>
                  <Button
                    onClick={cancelAction}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  disabled={isProcessing || isListening}
                />
                
                {/* Voice Button - Push to Talk */}
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={isListening ? stopRecording : undefined}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isProcessing}
                  className={`p-3 rounded-xl transition-all select-none ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse scale-110' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:bg-red-500 active:scale-110'
                  }`}
                  data-testid="push-to-talk-btn"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              
              <p className="text-xs text-slate-500 mt-2 text-center">
                {isListening ? '🎙️ Bol rahe hain... Chhod do jab ho jaye' : 
                 '🎤 Mic button dabake bolo, chhod do - reply aayega'}
              </p>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Button - Only show if not controlled externally */}
      {externalOpen === undefined && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40 flex items-center justify-center"
          data-testid="tino-fab"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
