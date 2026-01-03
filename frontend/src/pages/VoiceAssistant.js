import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  Mic, MicOff, Loader2, Volume2, Send, 
  LayoutDashboard, Users, ClipboardCheck, Wallet,
  Bell, Sparkles, FileText, Settings
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VoiceAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'hi-IN'; // Hindi + English

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          processCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        toast.error('माइक एक्सेस नहीं मिला');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command) => {
    if (!command.trim()) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/ai/voice-command`, { command });
      const data = res.data;
      
      setResponse(data);
      setHistory(prev => [...prev, { command, response: data }]);
      
      // Speak response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.message);
        utterance.lang = 'hi-IN';
        window.speechSynthesis.speak(utterance);
      }
      
      // Handle navigation
      if (data.action === 'navigate' && data.data?.target) {
        setTimeout(() => {
          navigate(`/${data.data.target}`);
        }, 2000);
      }
      
    } catch (error) {
      toast.error('Command process नहीं हो पाया');
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { icon: LayoutDashboard, label: 'Dashboard dikhao', command: 'dashboard dikhao' },
    { icon: Users, label: 'Students list', command: 'students ki list dikhao' },
    { icon: ClipboardCheck, label: 'Attendance mark karo', command: 'attendance mark karna hai' },
    { icon: Wallet, label: 'Fee reminder bhejo', command: 'fee reminder bhejo sabko' },
    { icon: Bell, label: 'Notice publish karo', command: 'new notice publish karo' },
    { icon: Sparkles, label: 'Pamphlet banao', command: 'admission pamphlet banao' },
    { icon: FileText, label: 'Report card banao', command: 'report card generate karo' },
    { icon: Settings, label: 'Settings kholo', command: 'settings page kholo' },
  ];

  return (
    <div className="space-y-6" data-testid="voice-assistant">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Mic className="w-8 h-8" />
              AI Voice Assistant
            </h1>
            <p className="text-violet-100 mt-2">
              बोलो और करवाओ - Schooltino को voice से control करो
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-violet-200">Logged in as</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
        </div>
      </div>

      {/* Main Voice Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        {/* Mic Button */}
        <div className="relative inline-block mb-6">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-purple-500/50'
            }`}
          >
            {loading ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
          )}
        </div>

        {/* Status Text */}
        <p className="text-lg font-medium text-slate-700 mb-4">
          {isListening ? '🎙️ सुन रहा हूं...' : loading ? '🤔 समझ रहा हूं...' : '👆 Tap to speak'}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4 max-w-lg mx-auto">
            <p className="text-slate-600 text-sm mb-1">आपने कहा:</p>
            <p className="text-lg font-medium text-slate-900">"{transcript}"</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className={`rounded-xl p-4 mb-4 max-w-lg mx-auto ${
            response.action === 'error' ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'
          }`}>
            <div className="flex items-start gap-3">
              <Volume2 className={`w-5 h-5 mt-0.5 ${response.action === 'error' ? 'text-red-600' : 'text-emerald-600'}`} />
              <div className="text-left">
                <p className={`font-medium ${response.action === 'error' ? 'text-red-800' : 'text-emerald-800'}`}>
                  {response.message}
                </p>
                {response.action === 'navigate' && response.data?.target && (
                  <p className="text-sm text-emerald-600 mt-1">
                    ➡️ Redirecting to {response.data.target}...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Input */}
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="या यहाँ type करो..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && processCommand(transcript)}
          />
          <Button 
            onClick={() => processCommand(transcript)} 
            disabled={!transcript || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">⚡ Quick Commands</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(cmd.command);
                processCommand(cmd.command);
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all text-left"
            >
              <cmd.icon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">📜 Recent Commands</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {history.slice(-5).reverse().map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <Mic className="w-4 h-4 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-900">"{item.command}"</p>
                  <p className="text-xs text-slate-500">{item.response.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
        <h3 className="font-semibold text-violet-900 mb-3">💡 Tips</h3>
        <ul className="text-sm text-violet-700 space-y-1">
          <li>• Hindi, English या Hinglish में बोल सकते हो</li>
          <li>• "Dashboard dikhao", "Attendance mark karo" जैसे commands use करो</li>
          <li>• AI confirm करेगा action लेने से पहले</li>
          <li>• Voice response सुनने के लिए speaker on रखो</li>
        </ul>
      </div>
    </div>
  );
}
