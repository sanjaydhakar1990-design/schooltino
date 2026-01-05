/**
 * Tino AI Assistant - Voice + Text
 * - Male/Female voice toggle with avatar change
 * - ElevenLabs TTS for high quality voice
 * - Text input + Voice input
 * - Role-based commands
 */
import { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, X, Volume2, Loader2, CheckCircle, XCircle,
  Send, User, Sparkles, Settings, MessageSquare
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
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Tino AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    {voiceGender === 'male' ? 'Male Voice' : 'Female Voice'} • {user?.role}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                
                {/* Voice Button */}
                <button
                  type="button"
                  onClick={isListening ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`p-3 rounded-xl transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
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
                {isListening ? '🎙️ Bol rahe hain... Stop karne ke liye click karein' : 
                 'Type karein ya mic button dabayein'}
              </p>
            </div>
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
