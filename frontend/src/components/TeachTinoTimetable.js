import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronLeft, Loader2, Clock, BookOpen, Users
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

export default function TeachTinoTimetable({ onBack }) {
  const [slots, setSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 'monday' : DAYS[d - 1];
  });

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-timetable`, { headers: getHeaders() });
      setSlots(res.data?.slots || []);
      setTimeSlots(res.data?.time_slots || []);
    } catch (e) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const getDaySlots = (day) => {
    return slots
      .filter(s => s.day === day)
      .sort((a, b) => (a.period_id || 0) - (b.period_id || 0));
  };

  const getTimeForPeriod = (periodId) => {
    const ts = timeSlots.find(t => t.period_id === periodId);
    if (ts) return `${ts.start_time || ''} - ${ts.end_time || ''}`;
    return '';
  };

  const todaySlots = getDaySlots(activeDay);

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
              const timeStr = getTimeForPeriod(slot.period_id);
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    slot.is_homeroom ? 'bg-green-100' : 'bg-blue-50'
                  }`}>
                    <span className="text-xs font-bold text-gray-600">P{slot.period_id}</span>
                    {slot.is_homeroom && <span className="text-[8px] text-green-600">HR</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{slot.subject || (slot.is_homeroom ? 'Homeroom' : 'Free Period')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {slot.class_name && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="w-3 h-3" /> {slot.class_name}
                        </span>
                      )}
                      {timeStr && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" /> {timeStr}
                        </span>
                      )}
                    </div>
                  </div>
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
            const dayCount = getDaySlots(day).length;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`p-2 rounded-lg text-center transition-all ${
                  activeDay === day ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <p className="text-[10px] font-semibold text-gray-600">{DAY_LABELS[day]}</p>
                <p className="text-lg font-bold text-gray-800">{dayCount}</p>
                <p className="text-[9px] text-gray-400">periods</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
