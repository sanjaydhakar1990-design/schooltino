import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ChevronLeft, Loader2, Clock, BookOpen, Users, Play, Timer, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function TeachTinoTimetable({ onBack }) {
  const [slots, setSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayFromServer, setTodayFromServer] = useState('');
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 'monday' : DAYS[d - 1];
  });
  const [activeLecture, setActiveLecture] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchTimetable(); }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-timetable`, { headers: getHeaders() });
      const slotsData = res.data?.slots || [];
      setSlots(slotsData);
      setTimeSlots(res.data?.time_slots || []);
      if (res.data?.today) setTodayFromServer(res.data.today);

      const currentSlot = slotsData.find(s => s.is_current);
      if (currentSlot) {
        startLectureTimer(currentSlot);
      }
    } catch (e) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const startLectureTimer = (slot) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveLecture(slot);

    const endMins = parseTime(slot.end_time);
    if (!endMins) return;

    const updateCountdown = () => {
      const nowMins = getNowMinutes();
      const nowSecs = new Date().getSeconds();
      const remainingSecs = (endMins - nowMins) * 60 - nowSecs;
      if (remainingSecs <= 0) {
        setCountdown(0);
        setActiveLecture(null);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.success('Period ended!');
      } else {
        setCountdown(remainingSecs);
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
  };

  const startTeaching = (slot) => {
    startLectureTimer(slot);
    toast.success(`Started: ${slot.subject} - ${slot.class_name}`);
  };

  const getDaySlots = (day) => {
    return slots
      .filter(s => s.day === day)
      .sort((a, b) => (a.period_id || 0) - (b.period_id || 0));
  };

  const todaySlots = getDaySlots(activeDay);
  const isToday = activeDay === (todayFromServer || (() => {
    const d = new Date().getDay();
    return d === 0 ? 'sunday' : DAYS[d - 1];
  })());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-bold text-gray-800">My Timetable</h2>
        <div></div>
      </div>

      {activeLecture && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-white/80">NOW TEACHING</p>
                <p className="font-bold text-lg">{activeLecture.subject || 'Class'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Timer className="w-3 h-3" />
                <span>Time Remaining</span>
              </div>
              <p className="text-2xl font-mono font-bold">{formatCountdown(countdown)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {activeLecture.class_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activeLecture.start_time} - {activeLecture.end_time}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" /> {activeLecture.duration_minutes || 0} min
            </span>
          </div>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all"
              style={{
                width: `${activeLecture.duration_minutes > 0
                  ? Math.max(0, 100 - (countdown / (activeLecture.duration_minutes * 60)) * 100)
                  : 0}%`
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
              activeDay === day
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50'
            }`}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {todaySlots.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 capitalize">{activeDay}'s Schedule</h3>
            <p className="text-[10px] text-gray-400">{todaySlots.length} periods</p>
          </div>
          <div className="divide-y divide-gray-50">
            {todaySlots.map((slot, idx) => {
              const isCurrent = slot.is_current;
              const isUpcoming = slot.is_upcoming;
              const isActiveLecture = activeLecture?.period_id === slot.period_id && activeLecture?.class_id === slot.class_id && activeLecture?.day === slot.day;

              return (
                <div key={idx} className={`flex items-center gap-3 px-4 py-3 transition-all ${
                  isActiveLecture ? 'bg-green-50 border-l-4 border-green-500' :
                  isCurrent ? 'bg-green-50/50' :
                  isUpcoming ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    isActiveLecture ? 'bg-green-500 text-white' :
                    slot.is_homeroom ? 'bg-green-100' : 'bg-blue-50'
                  }`}>
                    <span className={`text-xs font-bold ${isActiveLecture ? 'text-white' : 'text-gray-600'}`}>P{slot.period_id}</span>
                    {slot.is_homeroom && <span className="text-[8px] text-green-600">HR</span>}
                    {slot.duration_minutes > 0 && (
                      <span className={`text-[8px] ${isActiveLecture ? 'text-white/80' : 'text-gray-400'}`}>{slot.duration_minutes}m</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{slot.subject || (slot.is_homeroom ? 'Homeroom' : 'Free Period')}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {slot.class_name && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="w-3 h-3" /> {slot.class_name}
                        </span>
                      )}
                      {slot.start_time && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" /> {slot.start_time} - {slot.end_time}
                        </span>
                      )}
                    </div>
                  </div>
                  {isToday && !slot.is_homeroom && slot.subject && !isActiveLecture && (
                    <button
                      onClick={() => startTeaching(slot)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all ${
                        isCurrent
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                          : isUpcoming
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Play className="w-3 h-3" /> Start
                    </button>
                  )}
                  {isActiveLecture && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-green-600">{formatCountdown(countdown)}</span>
                      <span className="text-[9px] text-green-500">LIVE</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No periods on {activeDay}</p>
          <p className="text-xs text-gray-400 mt-1">Check other days or ask admin to set up timetable</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Weekly Overview</h3>
        </div>
        <div className="p-3 grid grid-cols-6 gap-1">
          {DAYS.map(day => {
            const daySlots = getDaySlots(day);
            const daySubjects = [...new Set(daySlots.map(s => s.subject).filter(Boolean))];
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`p-2 rounded-lg text-center transition-all ${
                  activeDay === day ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <p className="text-[10px] font-semibold text-gray-600">{DAY_LABELS[day]}</p>
                <p className="text-lg font-bold text-gray-800">{daySlots.length}</p>
                <p className="text-[9px] text-gray-400">periods</p>
              </button>
            );
          })}
        </div>
      </div>

      {slots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">My Subjects & Classes</h3>
          </div>
          <div className="p-3 space-y-2">
            {(() => {
              const subjectClassMap = {};
              slots.forEach(s => {
                if (!s.subject) return;
                if (!subjectClassMap[s.subject]) subjectClassMap[s.subject] = new Set();
                if (s.class_name) subjectClassMap[s.subject].add(s.class_name);
              });
              return Object.entries(subjectClassMap).map(([subject, classSet]) => (
                <div key={subject} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{subject}</p>
                    <p className="text-[10px] text-gray-400">{[...classSet].join(', ')}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                    {slots.filter(s => s.subject === subject).length} periods/week
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
