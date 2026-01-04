/**
 * Voice Assistant Floating Action Button
 * - Female AI voice using ElevenLabs
 * - Speech-to-Text using Whisper
 * - Confirms actions before executing
 */
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Volume2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VoiceAssistantFAB() {
  const { user, schoolId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // Check service availability on mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const res = await axios.get(`${API}/voice-assistant/status`);
      setServiceStatus(res.data);
    } catch (err) {
      setServiceStatus({
        tts_available: false,
        stt_available: false,
        message: 'Voice service check failed'
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setTranscript('');
      setResponse(null);
      setPendingAction(null);
      
    } catch (err) {
      console.error('Microphone access denied:', err);
      toast.error('Microphone access denied. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', 'hi');

      const transcribeRes = await axios.post(`${API}/voice-assistant/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { transcribed_text, detected_command } = transcribeRes.data;
      setTranscript(transcribed_text);

      if (!transcribed_text || transcribed_text.trim() === '') {
        setResponse({ message: 'Kuch sun nahi paya. Kripya dobara bolein.', type: 'error' });
        speakResponse('Kuch sun nahi paya. Kripya dobara bolein.');
        return;
      }

      // Step 2: Process command
      const commandRes = await axios.post(`${API}/voice-assistant/process-command`, {
        command: transcribed_text,
        school_id: schoolId,
        user_id: user?.id || '',
        confirmed: false
      });

      const result = commandRes.data;
      setResponse({ message: result.message, type: 'success' });

      // If confirmation required, store pending action
      if (result.requires_confirmation) {
        setPendingAction(result.action);
      }

      // Play audio response
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      } else {
        speakResponse(result.message);
      }

      // Handle redirects
      if (result.data?.redirect) {
        setTimeout(() => {
          window.location.href = result.data.redirect;
        }, 2000);
      }

    } catch (err) {
      console.error('Processing failed:', err);
      const errorMsg = 'Kuch gadbad ho gayi. Kripya dobara try karein.';
      setResponse({ message: errorMsg, type: 'error' });
      speakResponse(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    
    setIsProcessing(true);
    
    try {
      const res = await axios.post(`${API}/voice-assistant/process-command`, {
        command: transcript,
        school_id: schoolId,
        user_id: user?.id || '',
        confirmed: true
      });

      const result = res.data;
      setResponse({ message: result.message, type: 'success' });
      setPendingAction(null);

      // Play audio response
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      } else {
        speakResponse(result.message);
      }

      // Handle redirects
      if (result.data?.redirect) {
        setTimeout(() => {
          window.location.href = result.data.redirect;
        }, 2000);
      }

      toast.success('Command executed successfully!');

    } catch (err) {
      console.error('Confirmation failed:', err);
      setResponse({ message: 'Action failed. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    const msg = 'Action cancel kar diya gaya hai.';
    setResponse({ message: msg, type: 'info' });
    speakResponse(msg);
  };

  const playAudio = (base64Audio) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      audio.play().catch(err => console.error('Audio play failed:', err));
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const speakResponse = async (text) => {
    // Fallback TTS using browser
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      
      // Try to get a female voice
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.lang.includes('hi') && v.name.toLowerCase().includes('female')
      ) || voices.find(v => v.lang.includes('hi'));
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  // Don't show for non-admin users
  if (!user || !['director', 'principal', 'vice_principal', 'co_director'].includes(user.role)) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all z-50 flex items-center justify-center"
        data-testid="voice-assistant-fab"
        title="Voice Assistant"
      >
        <Mic className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            data-testid="voice-assistant-modal"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Voice Assistant</h3>
                    <p className="text-xs text-white/80">Female Voice • Hindi/English</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopRecording();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  data-testid="close-voice-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Service Status */}
              {serviceStatus && !serviceStatus.tts_available && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Voice service limited. Some features may not work.
                </div>
              )}

              {/* Transcript Display */}
              {transcript && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Aapne kaha:</p>
                  <p className="text-slate-800 font-medium">"{transcript}"</p>
                </div>
              )}

              {/* Response Display */}
              {response && (
                <div className={`p-4 rounded-xl ${
                  response.type === 'error' ? 'bg-red-50 border border-red-200' :
                  response.type === 'success' ? 'bg-green-50 border border-green-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <p className="text-xs text-slate-500 mb-1">AI Response:</p>
                  <p className={`font-medium ${
                    response.type === 'error' ? 'text-red-800' :
                    response.type === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }`}>{response.message}</p>
                </div>
              )}

              {/* Confirmation Buttons */}
              {pendingAction && (
                <div className="flex gap-3">
                  <button
                    onClick={confirmAction}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2"
                    data-testid="confirm-action-btn"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Haan, Confirm
                  </button>
                  <button
                    onClick={cancelAction}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition flex items-center justify-center gap-2"
                    data-testid="cancel-action-btn"
                  >
                    <X className="w-5 h-5" />
                    Nahi, Cancel
                  </button>
                </div>
              )}

              {/* Main Mic Button */}
              {!pendingAction && (
                <div className="flex flex-col items-center py-4">
                  <button
                    onClick={isListening ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse' 
                        : isProcessing
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                    }`}
                    data-testid="mic-button"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : isListening ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                  
                  <p className="mt-3 text-sm text-slate-500 text-center">
                    {isProcessing ? 'Processing...' : 
                     isListening ? 'Listening... Tap to stop' : 
                     'Tap to speak'}
                  </p>
                </div>
              )}

              {/* Help Text */}
              <div className="text-center text-xs text-slate-400 space-y-1">
                <p>Try saying:</p>
                <p className="font-medium text-slate-600">"Sabhi classes banao"</p>
                <p className="font-medium text-slate-600">"Attendance dikha"</p>
                <p className="font-medium text-slate-600">"Fee status batao"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
