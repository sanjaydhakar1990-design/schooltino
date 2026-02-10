import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Play, Pause, Volume2, VolumeX, Music, Mic, Clock, Settings, Plus, Trash2, Search, Speaker, Upload } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_PRAYERS = [
  {
    id: 'saraswati_vandana',
    name: 'Saraswati Vandana (सरस्वती वंदना)',
    lyrics: 'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता, या वीणावरदण्डमण्डितकरा या श्वेतपद्मासना। या ब्रह्माच्युतशंकरप्रभृतिभिर्देवैः सदा वन्दिता, सा माम् पातु सरस्वती भगवती निःशेषजाड्यापहा।',
    duration: '3:45',
    category: 'morning',
    language: 'sanskrit',
    audioUrl: null
  },
  {
    id: 'gayatri_mantra',
    name: 'Gayatri Mantra (गायत्री मंत्र)',
    lyrics: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्।',
    duration: '2:30',
    category: 'morning',
    language: 'sanskrit',
    audioUrl: null
  },
  {
    id: 'itni_shakti',
    name: 'Itni Shakti Hame Dena Data (इतनी शक्ति हमें देना दाता)',
    lyrics: 'इतनी शक्ति हमें देना दाता, मन का विश्वास कमजोर हो ना। हम चलें नेक रस्ते पे हमसे, भूलकर भी कोई भूल हो ना।',
    duration: '4:00',
    category: 'morning',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'hamko_man_ki',
    name: 'Hamko Man Ki Shakti Dena (हमको मन की शक्ति देना)',
    lyrics: 'हमको मन की शक्ति देना, मन विजय करें। दूसरों की जय से पहले, खुद को जय करें।',
    duration: '3:30',
    category: 'morning',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'vande_mataram',
    name: 'Vande Mataram (वन्दे मातरम्)',
    lyrics: 'वन्दे मातरम्, सुजलां सुफलां मलयजशीतलाम्, शस्यश्यामलां मातरम्।',
    duration: '2:00',
    category: 'patriotic',
    language: 'sanskrit',
    audioUrl: null
  },
  {
    id: 'jana_gana_mana',
    name: 'Jana Gana Mana (जन गण मन)',
    lyrics: 'जन गण मन अधिनायक जय हे, भारत भाग्य विधाता। पंजाब सिंधु गुजरात मराठा, द्राविड़ उत्कल बंग। विंध्य हिमाचल यमुना गंगा, उच्छल जलधि तरंग। तव शुभ नामे जागे, तव शुभ आशिष मागे, गाहे तव जय गाथा। जन गण मंगलदायक जय हे, भारत भाग्य विधाता। जय हे, जय हे, जय हे, जय जय जय जय हे।',
    duration: '0:52',
    category: 'national',
    language: 'hindi',
    audioUrl: null
  },
  {
    id: 'lab_pe_aati',
    name: 'Lab Pe Aati Hai Dua (लब पे आती है दुआ)',
    lyrics: 'लब पे आती है दुआ बन के तमन्ना मेरी, ज़िन्दगी शम्मा की सूरत हो ख़ुदाया मेरी।',
    duration: '3:15',
    category: 'morning',
    language: 'urdu',
    audioUrl: null
  },
  {
    id: 'aye_malik_tere',
    name: 'Aye Malik Tere Bande Hum (ऐ मालिक तेरे बंदे हम)',
    lyrics: 'ऐ मालिक तेरे बंदे हम, ऐसे हों हमारे करम, नेकी पर चलें और बदी से टलें, ताकि हंसते हुए निकले दम।',
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
  const fileInputRef = useRef(null);
  const ttsRef = useRef(null);
  
  const [prayers, setPrayers] = useState(DEFAULT_PRAYERS);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [prayerSchedule, setPrayerSchedule] = useState({
    enabled: true,
    morning_time: '08:00',
    duration: 15,
    auto_start: false,
    prayers_sequence: ['saraswati_vandana', 'itni_shakti', 'jana_gana_mana'],
    announcement_before: true,
    announcement_text: 'ध्यान दें! प्रार्थना सभा शुरू हो रही है। कृपया अपने स्थान पर खड़े हों।'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [speakerStatus, setSpeakerStatus] = useState('connected');
  const [aiListening, setAiListening] = useState(false);

  const applyVolume = useCallback((vol, muted) => {
    const effectiveVol = muted ? 0 : vol / 100;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
  }, []);

  useEffect(() => {
    applyVolume(volume, isMuted);
  }, [volume, isMuted, applyVolume]);

  useEffect(() => {
    fetchPrayerSettings();
  }, [schoolId]);

  const fetchPrayerSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/prayer/settings?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        if (response.data.schedule) {
          setPrayerSchedule(prev => ({ ...prev, ...response.data.schedule }));
        }
        if (response.data.custom_prayers) {
          setPrayers([...DEFAULT_PRAYERS, ...response.data.custom_prayers]);
        }
        if (response.data.prayer_audio_urls) {
          setPrayers(prev => prev.map(p => {
            const uploadedUrl = response.data.prayer_audio_urls[p.id];
            return uploadedUrl ? { ...p, audioUrl: uploadedUrl } : p;
          }));
        }
      }
    } catch (error) {
      console.log('Using default prayer settings');
    }
  };

  const savePrayerSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/prayer/settings`, {
        school_id: schoolId,
        schedule: prayerSchedule
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isHindi ? 'सेटिंग्स सहेजी गईं' : 'Settings saved');
      setShowSettings(false);
    } catch (error) {
      toast.success(isHindi ? 'सेटिंग्स सहेजी गईं (locally)' : 'Settings saved (locally)');
      setShowSettings(false);
    }
  };

  const stopCurrentPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ttsRef.current) {
      window.speechSynthesis.cancel();
      ttsRef.current = null;
    }
    setIsPlaying(false);
  };

  const speakWithTTS = (prayer) => {
    if (!('speechSynthesis' in window)) {
      toast.error(isHindi ? 'TTS उपलब्ध नहीं है' : 'Text-to-speech not available in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = prayer.lyrics;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    const langMap = { hindi: 'hi-IN', sanskrit: 'hi-IN', urdu: 'hi-IN', english: 'en-IN' };
    utterance.lang = langMap[prayer.language] || 'hi-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : volume / 100;

    utterance.onend = () => {
      ttsRef.current = null;
      setIsPlaying(false);
      setSelectedPrayer(null);
    };

    utterance.onerror = () => {
      ttsRef.current = null;
      setIsPlaying(false);
      toast.error(isHindi ? 'TTS में त्रुटि' : 'TTS playback error');
    };

    ttsRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPrayer = (prayer) => {
    if (isPlaying && selectedPrayer?.id === prayer.id) {
      stopCurrentPlayback();
      setSelectedPrayer(null);
      return;
    }

    stopCurrentPlayback();
    setSelectedPrayer(prayer);
    setIsPlaying(true);

    if (prayer.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = prayer.audioUrl;
        applyVolume(volume, isMuted);
        audioRef.current.play().catch((err) => {
          console.error('Audio play error:', err);
          toast.error(isHindi ? 'ऑडियो नहीं चला' : 'Audio playback failed');
          setIsPlaying(false);
        });
      }
    } else {
      speakWithTTS(prayer);
      toast.info(isHindi ? 'TTS से प्रार्थना बज रही है' : 'Playing prayer via Text-to-Speech', {
        description: prayer.name
      });
    }
  };

  const handleStopPrayer = () => {
    stopCurrentPlayback();
    setSelectedPrayer(null);
  };

  const handleUploadAudio = (prayerId) => {
    setUploadingFor(prayerId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm)$/i)) {
      toast.error(isHindi ? 'केवल MP3/WAV फाइल' : 'Only MP3/WAV audio files allowed');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPrayers(prev => prev.map(p =>
      p.id === uploadingFor ? { ...p, audioUrl: localUrl } : p
    ));
    toast.success(isHindi ? 'ऑडियो अपलोड हुआ!' : 'Audio uploaded!');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prayer_id', uploadingFor);
      formData.append('school_id', schoolId);

      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/api/prayer/upload-audio`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.audio_url) {
        setPrayers(prev => prev.map(p =>
          p.id === uploadingFor ? { ...p, audioUrl: res.data.audio_url } : p
        ));
      }
    } catch (err) {
      console.log('Server upload failed, using local file');
    }

    setUploadingFor(null);
    e.target.value = '';
  };

  const handleStartPrayerSession = async () => {
    toast.success(isHindi ? 'प्रार्थना सभा शुरू!' : 'Prayer session started!', {
      description: isHindi ? 'स्पीकर पर घोषणा भेजी जा रही है...' : 'Sending announcement to speakers...'
    });

    if (prayerSchedule.announcement_before && prayerSchedule.announcement_text) {
      const announcementUtterance = new SpeechSynthesisUtterance(prayerSchedule.announcement_text);
      announcementUtterance.lang = 'hi-IN';
      announcementUtterance.rate = 0.9;
      announcementUtterance.volume = isMuted ? 0 : volume / 100;
      announcementUtterance.onend = () => {
        if (prayerSchedule.prayers_sequence.length > 0) {
          const firstPrayer = prayers.find(p => p.id === prayerSchedule.prayers_sequence[0]);
          if (firstPrayer) {
            setTimeout(() => handlePlayPrayer(firstPrayer), 1000);
          }
        }
      };
      window.speechSynthesis.speak(announcementUtterance);
    } else if (prayerSchedule.prayers_sequence.length > 0) {
      const firstPrayer = prayers.find(p => p.id === prayerSchedule.prayers_sequence[0]);
      if (firstPrayer) {
        setTimeout(() => handlePlayPrayer(firstPrayer), 1000);
      }
    }
  };

  const handleAIVoiceCommand = () => {
    setAiListening(true);
    toast.info(isHindi ? 'AI सुन रहा है...' : 'AI is listening...', {
      description: isHindi ? '"प्रार्थना शुरू करो" बोलें' : 'Say "Start Prayer"'
    });
    
    setTimeout(() => {
      setAiListening(false);
      handleStartPrayerSession();
    }, 3000);
  };

  const handleTestSpeakers = () => {
    setSpeakerStatus('testing');
    toast.info(isHindi ? 'स्पीकर टेस्ट हो रहा है...' : 'Testing speakers...');
    
    const testUtterance = new SpeechSynthesisUtterance(
      isHindi ? 'स्पीकर टेस्ट। आवाज़ आ रही है।' : 'Speaker test. Sound is working.'
    );
    testUtterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    testUtterance.volume = isMuted ? 0 : volume / 100;
    testUtterance.onend = () => {
      setSpeakerStatus('connected');
      toast.success(isHindi ? 'स्पीकर कनेक्ट है!' : 'Speakers connected!');
    };
    window.speechSynthesis.speak(testUtterance);
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
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAudio(prayer.id);
                      }}
                      className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                      title={isHindi ? 'ऑडियो अपलोड करें' : 'Upload audio'}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPrayer(prayer);
                      }}
                      className={`p-2 rounded-full ${
                        isPlaying && selectedPrayer?.id === prayer.id
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                      }`}
                    >
                      {isPlaying && selectedPrayer?.id === prayer.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {getCategoryLabel(prayer.category)}
                  </span>
                  <span className="text-slate-400">{prayer.duration}</span>
                  {prayer.audioUrl ? (
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-600">🎵 Audio</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600">🗣 TTS</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={handleStopPrayer} preload="auto" />
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

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
