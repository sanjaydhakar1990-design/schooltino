import { useState, useRef, useEffect } from 'react';
import { 
  X, Loader2, CheckCircle, XCircle,
  Send, Sparkles, Settings, MessageSquare, History, Trash2, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function VoiceAssistantFAB({ isOpen: externalOpen, onClose }) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onClose ? (val) => { if(!val) onClose(); } : setInternalOpen;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const saveToHistory = () => {
    if (messages.length > 1) {
      const newSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        messages: messages.slice(1),
        preview: messages[1]?.text?.slice(0, 50) || 'Chat session'
      };
      const updatedHistory = [newSession, ...chatHistory].slice(0, 20);
      setChatHistory(updatedHistory);
      localStorage.setItem(`tino_chat_history_${user?.id}`, JSON.stringify(updatedHistory));
    }
  };

  const deleteSession = (sessionId) => {
    const updatedHistory = chatHistory.filter(s => s.id !== sessionId);
    setChatHistory(updatedHistory);
    localStorage.setItem(`tino_chat_history_${user?.id}`, JSON.stringify(updatedHistory));
    toast.success('Chat deleted');
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem(`tino_chat_history_${user?.id}`);
    toast.success('All chat history cleared');
  };

  const loadSession = (session) => {
    setMessages([{ type: 'ai', text: getGreeting(), time: new Date() }, ...session.messages]);
    setShowHistory(false);
    toast.success('Chat loaded');
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting();
      addMessage('ai', greeting);
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

  const processCommand = async (text) => {
    setIsProcessing(true);
    
    try {
      const res = await axios.post(`${API}/voice-assistant/chat`, {
        message: text,
        school_id: user?.school_id || 'default',
        user_id: user?.id || '',
        user_role: user?.role || 'director',
        user_name: user?.name || 'User'
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      
      if (result.requires_confirmation) {
        setPendingAction({
          action: result.action,
          message: result.message
        });
      }
      
      if (result.navigate_to) {
        toast.success(`Opening ${result.navigate_to}...`);
        setTimeout(() => {
          setIsOpen(false);
          window.location.href = result.navigate_to;
        }, 1500);
      }
      
      if (result.data?.redirect && !result.navigate_to) {
        setTimeout(() => {
          window.location.href = result.data.redirect;
        }, 2000);
      }
      
    } catch (err) {
      addMessage('ai', 'Kuch gadbad ho gayi. Dobara try karein.');
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
        confirmed: true
      });
      
      const result = res.data;
      addMessage('ai', result.message, result.data);
      setPendingAction(null);
      
      toast.success('Action completed!');
      
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    addMessage('ai', 'Action cancel kar diya.');
  };

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
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {showHistory ? 'Chat History' : 'Tino AI Chat'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {showHistory ? `${chatHistory.length} saved chats` : `Chat Mode • ${user?.role}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!showHistory && (
                  <>
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
                {showSettings && (
                  <div className="p-4 bg-slate-800/50 border-b border-slate-700 space-y-3">
                    <p className="text-xs text-slate-500">
                      Tino AI Chat - Text based assistant
                    </p>
                  </div>
                )}

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

                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      disabled={isProcessing}
                    />
                    
                    <Button
                      type="submit"
                      disabled={!textInput.trim() || isProcessing}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                  
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Type your message and press Enter or click Send
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
