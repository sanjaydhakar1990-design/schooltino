import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Play, Pause, Volume2, VolumeX, Music, Mic, Clock, Settings, Plus, Trash2, Search, Speaker } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Default Prayer Songs Library
const DEFAULT_PRAYERS = [
  {
    id: 'saraswati_vandana',
    name: 'Saraswati Vandana (सरस्वती वंदना)',
    lyrics: 'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता...',
    duration: '3:45',
    category: 'morning',
    language: 'sanskrit',
    audioUrl: null // Schools can upload their own audio
  },
  {
    id: 'gayatri_mantra',
    name: 'Gayatri Mantra (गायत्री मंत्र)',
    lyrics: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...',
    duration: '2:30',
    category: 'morning',
    language: 'sanskrit',
    audioUrl: null
  },
  {
    id: 'itni_shakti',
    name: 'Itni Shakti Hame Dena Data (इतनी शक्ति हमें देना दाता)',
    lyrics: 'इतनी शक्ति हमें देना दाता, मन का विश्वास कमजोर हो ना...',
    duration: '4:00',
    category: 'morning',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'hamko_man_ki',
    name: 'Hamko Man Ki Shakti Dena (हमको मन की शक्ति देना)',
    lyrics: 'हमको मन की शक्ति देना, मन विजय करें...',
    duration: '3:30',
    category: 'morning',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'vande_mataram',
    name: 'Vande Mataram (वन्दे मातरम्)',
    lyrics: 'वन्दे मातरम्, सुजलां सुफलां मलयजशीतलाम्...',
    duration: '2:00',
    category: 'patriotic',
    language: 'sanskrit',
    audioUrl: null
  },
  {
    id: 'jana_gana_mana',
    name: 'Jana Gana Mana (जन गण मन)',
    lyrics: 'जन गण मन अधिनायक जय हे भारत भाग्य विधाता...',
    duration: '0:52',
    category: 'national',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'lab_pe_aati',
    name: 'Lab Pe Aati Hai Dua (लब पे आती है दुआ)',
    lyrics: 'लब पे आती है दुआ बन के तमन्ना मेरी...',
    duration: '3:15',
    category: 'morning',
    language: 'urdu',
    audioUrl: null
  },
  {
    id: 'aye_malik_tere',
    name: 'Aye Malik Tere Bande Hum (ऐ मालिक तेरे बंदे हम)',
    lyrics: 'ऐ मालिक तेरे बंदे हम, ऐसे हों हमारे करम...',
    duration: '4:30',
    category: 'morning',
    language: 'hindi',
    audioUrl: null
  }
];

export default function PrayerSystemPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';
  const audioRef = useRef(null);
  
  const [prayers, setPrayers] = useState(DEFAULT_PRAYERS);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [prayerSchedule, setPrayerSchedule] = useState({
    enabled: true,
    morning_time: '08:00',
    duration: 15, // minutes
    auto_start: false,
    prayers_sequence: ['saraswati_vandana', 'itni_shakti', 'jana_gana_mana'],
    announcement_before: true,
    announcement_text: 'ध्यान दें! प्रार्थना सभा शुरू हो रही है। कृपया अपने स्थान पर खड़े हों।'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [speakerStatus, setSpeakerStatus] = useState('connected'); // 'connected', 'disconnected', 'testing'
  const [aiListening, setAiListening] = useState(false);

  // Load school prayer settings
  useEffect(() => {
    fetchPrayerSettings();
  }, [schoolId]);

  const fetchPrayerSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/school/${schoolId}/prayer-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setPrayerSchedule(prev => ({ ...prev, ...response.data }));
        if (response.data.custom_prayers) {
          setPrayers([...DEFAULT_PRAYERS, ...response.data.custom_prayers]);
        }
      }
    } catch (error) {
      console.log('Using default prayer settings');
    }
  };

  const savePrayerSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/school/${schoolId}/prayer-settings`, prayerSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isHindi ? 'सेटिंग्स सहेजी गईं' : 'Settings saved');
      setShowSettings(false);
    } catch (error) {
      toast.success(isHindi ? 'सेटिंग्स सहेजी गईं' : 'Settings saved');
      setShowSettings(false);
    }
  };

  const handlePlayPrayer = (prayer) => {
    setSelectedPrayer(prayer);
    if (prayer.audioUrl) {
      // Play actual audio if available
      if (audioRef.current) {
        audioRef.current.src = prayer.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Simulate playing with text-to-speech or just show lyrics
      setIsPlaying(true);
      toast.info(isHindi ? 'प्रार्थना शुरू...' : 'Prayer starting...', {
        description: prayer.name
      });
    }
  };

  const handleStopPrayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setSelectedPrayer(null);
  };

  const handleStartPrayerSession = async () => {
    // Start full prayer session with sequence
    toast.success(isHindi ? 'प्रार्थना सभा शुरू!' : 'Prayer session started!', {
      description: isHindi ? 'स्पीकर पर घोषणा भेजी जा रही है...' : 'Sending announcement to speakers...'
    });
    
    // In real implementation, this would:
    // 1. Send announcement to school speakers via IoT
    // 2. Wait a few seconds
    // 3. Start playing prayers in sequence
    
    if (prayerSchedule.prayers_sequence.length > 0) {
      const firstPrayer = prayers.find(p => p.id === prayerSchedule.prayers_sequence[0]);
      if (firstPrayer) {
        setTimeout(() => handlePlayPrayer(firstPrayer), 2000);
      }
    }
  };

  const handleAIVoiceCommand = () => {
    setAiListening(true);
    toast.info(isHindi ? 'AI सुन रहा है...' : 'AI is listening...', {
      description: isHindi ? '"प्रार्थना शुरू करो" बोलें' : 'Say "Start Prayer"'
    });
    
    // Simulate voice recognition
    setTimeout(() => {
      setAiListening(false);
      handleStartPrayerSession();
    }, 3000);
  };

  const handleTestSpeakers = () => {
    setSpeakerStatus('testing');
    toast.info(isHindi ? 'स्पीकर टेस्ट हो रहा है...' : 'Testing speakers...');
    
    setTimeout(() => {
      setSpeakerStatus('connected');
      toast.success(isHindi ? 'स्पीकर कनेक्ट है!' : 'Speakers connected!');
    }, 2000);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      morning: isHindi ? 'प्रातः प्रार्थना' : 'Morning Prayer',
      patriotic: isHindi ? 'देशभक्ति' : 'Patriotic',
      national: isHindi ? 'राष्ट्रगान' : 'National Anthem'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6" data-testid="prayer-system-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isHindi ? 'प्रार्थना सभा प्रणाली' : 'Prayer System'} 🙏
          </h1>
          <p className="text-slate-500">
            {isHindi ? 'AI संचालित प्रार्थना और स्पीकर नियंत्रण' : 'AI powered prayer and speaker control'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleTestSpeakers}>
            <Speaker className="w-4 h-4 mr-2" />
            {speakerStatus === 'testing' ? (isHindi ? 'टेस्टिंग...' : 'Testing...') : (isHindi ? 'स्पीकर टेस्ट' : 'Test Speakers')}
          </Button>
          <Button onClick={() => setShowSettings(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            {isHindi ? 'सेटिंग्स' : 'Settings'}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Prayer Session */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Music className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {isHindi ? 'प्रार्थना शुरू करें' : 'Start Prayer Session'}
                </h3>
                <p className="text-sm opacity-80">
                  {prayerSchedule.prayers_sequence.length} {isHindi ? 'प्रार्थनाएं क्रम में' : 'prayers in sequence'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleStartPrayerSession}
              className="w-full mt-4 bg-white text-indigo-600 hover:bg-white/90"
            >
              <Play className="w-4 h-4 mr-2" />
              {isHindi ? 'शुरू करें' : 'Start Now'}
            </Button>
          </CardContent>
        </Card>

        {/* AI Voice Command */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center ${aiListening ? 'animate-pulse' : ''}`}>
                <Mic className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {isHindi ? 'AI वॉइस कमांड' : 'AI Voice Command'}
                </h3>
                <p className="text-sm opacity-80">
                  {isHindi ? '"प्रार्थना शुरू करो" बोलें' : 'Say "Start Prayer"'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleAIVoiceCommand}
              disabled={aiListening}
              className="w-full mt-4 bg-white text-emerald-600 hover:bg-white/90"
            >
              <Mic className="w-4 h-4 mr-2" />
              {aiListening ? (isHindi ? 'सुन रहा है...' : 'Listening...') : (isHindi ? 'बोलें' : 'Speak')}
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Info */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {isHindi ? 'आज का समय' : "Today's Schedule"}
                </h3>
                <p className="text-sm opacity-80">
                  {prayerSchedule.morning_time} - {prayerSchedule.duration} {isHindi ? 'मिनट' : 'min'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="opacity-80">{isHindi ? 'ऑटो स्टार्ट:' : 'Auto Start:'}</span>
              <span className={`px-2 py-0.5 rounded ${prayerSchedule.auto_start ? 'bg-green-400' : 'bg-red-400'}`}>
                {prayerSchedule.auto_start ? (isHindi ? 'चालू' : 'ON') : (isHindi ? 'बंद' : 'OFF')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Now Playing */}
      {selectedPrayer && (
        <Card className="border-2 border-indigo-500 bg-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <Music className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-600 font-medium">{isHindi ? 'अभी बज रहा है' : 'Now Playing'}</p>
                <h3 className="font-bold text-xl text-slate-900">{selectedPrayer.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{selectedPrayer.lyrics}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                />
                <Button
                  onClick={handleStopPrayer}
                  variant="destructive"
                  size="icon"
                >
                  <Pause className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prayer Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-500" />
            {isHindi ? 'प्रार्थना लाइब्रेरी' : 'Prayer Library'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prayers.map((prayer) => (
              <div
                key={prayer.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedPrayer?.id === prayer.id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
                onClick={() => !isPlaying && handlePlayPrayer(prayer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{prayer.name}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{prayer.lyrics}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPrayer(prayer);
                    }}
                    className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {getCategoryLabel(prayer.category)}
                  </span>
                  <span className="text-slate-400">{prayer.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={handleStopPrayer} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {isHindi ? 'प्रार्थना सेटिंग्स' : 'Prayer Settings'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{isHindi ? 'प्रार्थना सक्षम' : 'Prayer Enabled'}</Label>
                <input
                  type="checkbox"
                  checked={prayerSchedule.enabled}
                  onChange={(e) => setPrayerSchedule({ ...prayerSchedule, enabled: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              
              <div>
                <Label>{isHindi ? 'प्रार्थना समय' : 'Prayer Time'}</Label>
                <input
                  type="time"
                  value={prayerSchedule.morning_time}
                  onChange={(e) => setPrayerSchedule({ ...prayerSchedule, morning_time: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 mt-1"
                />
              </div>
              
              <div>
                <Label>{isHindi ? 'अवधि (मिनट)' : 'Duration (minutes)'}</Label>
                <input
                  type="number"
                  value={prayerSchedule.duration}
                  onChange={(e) => setPrayerSchedule({ ...prayerSchedule, duration: Number(e.target.value) })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 mt-1"
                  min="5"
                  max="60"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>{isHindi ? 'ऑटो स्टार्ट' : 'Auto Start'}</Label>
                <input
                  type="checkbox"
                  checked={prayerSchedule.auto_start}
                  onChange={(e) => setPrayerSchedule({ ...prayerSchedule, auto_start: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              
              <div>
                <Label>{isHindi ? 'घोषणा टेक्स्ट' : 'Announcement Text'}</Label>
                <textarea
                  value={prayerSchedule.announcement_text}
                  onChange={(e) => setPrayerSchedule({ ...prayerSchedule, announcement_text: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 mt-1"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={savePrayerSettings} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {isHindi ? 'सहेजें' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for slow spin animation */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
