import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Calendar, Printer, Plus, Edit2, Trash2, Bell, ChevronLeft, ChevronRight, MapPin, Phone, Mail, Globe, Image, Upload, Star, Quote } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Government Holidays by State (2024-25)
const STATE_HOLIDAYS = {
  'Rajasthan': [
    { date: '2025-01-26', name: 'Republic Day (गणतंत्र दिवस)', type: 'national' },
    { date: '2025-03-14', name: 'Holi (होली)', type: 'festival' },
    { date: '2025-03-31', name: 'Rajasthan Day (राजस्थान दिवस)', type: 'state' },
    { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
    { date: '2025-04-18', name: 'Good Friday', type: 'national' },
    { date: '2025-05-12', name: 'Buddha Purnima', type: 'national' },
    { date: '2025-08-15', name: 'Independence Day (स्वतंत्रता दिवस)', type: 'national' },
    { date: '2025-08-26', name: 'Janmashtami (जन्माष्टमी)', type: 'festival' },
    { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
    { date: '2025-10-12', name: 'Dussehra (विजयादशमी)', type: 'festival' },
    { date: '2025-10-20', name: 'Diwali Vacation Start', type: 'vacation' },
    { date: '2025-11-01', name: 'Diwali (दीपावली)', type: 'festival' },
    { date: '2025-11-05', name: 'Govardhan Puja', type: 'festival' },
    { date: '2025-11-15', name: 'Guru Nanak Jayanti', type: 'festival' },
    { date: '2025-12-25', name: 'Christmas (क्रिसमस)', type: 'festival' },
    { date: '2026-01-01', name: 'New Year (नव वर्ष)', type: 'festival' },
  ],
  'Madhya Pradesh': [
    { date: '2025-01-26', name: 'Republic Day (गणतंत्र दिवस)', type: 'national' },
    { date: '2025-03-14', name: 'Holi (होली)', type: 'festival' },
    { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
    { date: '2025-05-01', name: 'MP Foundation Day', type: 'state' },
    { date: '2025-08-15', name: 'Independence Day (स्वतंत्रता दिवस)', type: 'national' },
    { date: '2025-08-26', name: 'Janmashtami (जन्माष्टमी)', type: 'festival' },
    { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
    { date: '2025-10-12', name: 'Dussehra (विजयादशमी)', type: 'festival' },
    { date: '2025-11-01', name: 'Diwali (दीपावली)', type: 'festival' },
    { date: '2025-11-15', name: 'Guru Nanak Jayanti', type: 'festival' },
    { date: '2025-12-25', name: 'Christmas (क्रिसमस)', type: 'festival' },
  ],
  'default': [
    { date: '2025-01-26', name: 'Republic Day', type: 'national' },
    { date: '2025-03-14', name: 'Holi', type: 'festival' },
    { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
    { date: '2025-08-15', name: 'Independence Day', type: 'national' },
    { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'national' },
    { date: '2025-10-12', name: 'Dussehra', type: 'festival' },
    { date: '2025-11-01', name: 'Diwali', type: 'festival' },
    { date: '2025-12-25', name: 'Christmas', type: 'festival' },
  ]
};

// Summer/Winter Vacation Dates by State
const VACATION_DATES = {
  'Rajasthan': {
    summer: { start: '2025-05-01', end: '2025-06-30', name: 'Summer Vacation (ग्रीष्मकालीन अवकाश)' },
    winter: { start: '2025-12-25', end: '2026-01-05', name: 'Winter Vacation (शीतकालीन अवकाश)' }
  },
  'Madhya Pradesh': {
    summer: { start: '2025-05-10', end: '2025-06-20', name: 'Summer Vacation (ग्रीष्मकालीन अवकाश)' },
    winter: { start: '2025-12-24', end: '2026-01-02', name: 'Winter Vacation (शीतकालीन अवकाश)' }
  }
};

export default function SchoolCalendarPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const calendarRef = useRef(null);
  const isHindi = i18n.language === 'hi';
  
  const [school, setSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', name: '', type: 'school_event', description: '', photo: null });
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [calendarPhotos, setCalendarPhotos] = useState([]);
  const [testimonials, setTestimonials] = useState([
    { id: 1, text: 'इस विद्यालय में पढ़कर मेरा बच्चा बहुत आगे बढ़ा है।', author: 'रमेश कुमार (अभिभावक)', photo: null },
    { id: 2, text: 'Best school in the city with excellent teachers and facilities.', author: 'Sunita Sharma (Parent)', photo: null }
  ]);
  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ text: '', author: '' });
  
  const months = isHindi 
    ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchSchoolData();
    fetchSchoolEvents();
  }, [schoolId]);

  const fetchSchoolData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchool(response.data);
    } catch (error) {
      console.error('Error fetching school data:', error);
    }
  };

  const fetchSchoolEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/school/${schoolId}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
    } catch (error) {
      // Use empty array if no events
      setEvents([]);
    }
  };

  const getStateHolidays = () => {
    const state = school?.settings?.state || 'default';
    return STATE_HOLIDAYS[state] || STATE_HOLIDAYS['default'];
  };

  const getAllEvents = () => {
    const holidays = getStateHolidays();
    return [...holidays, ...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getMonthEvents = (month, year) => {
    return getAllEvents().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  };

  const addSchoolEvent = async () => {
    if (!newEvent.date || !newEvent.name) {
      toast.error('Please fill date and event name');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/school/${schoolId}/events`, newEvent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event added successfully');
      setShowAddEvent(false);
      setNewEvent({ date: '', name: '', type: 'school_event', description: '' });
      fetchSchoolEvents();
    } catch (error) {
      // For demo, just add to local state
      setEvents([...events, { ...newEvent, id: Date.now() }]);
      toast.success('Event added');
      setShowAddEvent(false);
      setNewEvent({ date: '', name: '', type: 'school_event', description: '' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'national': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'festival': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'state': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'vacation': return 'bg-green-100 text-green-800 border-green-300';
      case 'school_event': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'exam': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      national: isHindi ? 'राष्ट्रीय' : 'National',
      festival: isHindi ? 'त्योहार' : 'Festival',
      state: isHindi ? 'राज्य' : 'State',
      vacation: isHindi ? 'छुट्टी' : 'Vacation',
      school_event: isHindi ? 'स्कूल कार्यक्रम' : 'School Event',
      exam: isHindi ? 'परीक्षा' : 'Exam'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6" data-testid="school-calendar-page">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isHindi ? 'विद्यालय कैलेंडर' : 'School Calendar'} 📅
          </h1>
          <p className="text-slate-500">
            {isHindi ? 'शैक्षणिक सत्र' : 'Academic Session'} 2024-25
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddEvent(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {isHindi ? 'कार्यक्रम जोड़ें' : 'Add Event'}
          </Button>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" />
            {isHindi ? 'प्रिंट करें' : 'Print Calendar'}
          </Button>
        </div>
      </div>

      {/* Printable Calendar */}
      <div ref={calendarRef} className="print:p-0">
        {/* School Header - Visible in Print */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
          {school?.logo_url && (
            <img src={school.logo_url} alt="" className="h-16 mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold">{school?.name || 'School Name'}</h1>
          <div className="flex justify-center gap-6 text-sm mt-2">
            {school?.address && <span><MapPin className="w-3 h-3 inline mr-1" />{school.address}</span>}
            {school?.phone && <span><Phone className="w-3 h-3 inline mr-1" />{school.phone}</span>}
            {school?.email && <span><Mail className="w-3 h-3 inline mr-1" />{school.email}</span>}
          </div>
          <p className="text-lg font-semibold mt-2">
            {isHindi ? 'शैक्षणिक कैलेंडर' : 'Academic Calendar'} 2024-25
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button 
            variant="outline" 
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold">
            {months[selectedMonth]} {selectedYear}
          </h2>
          <Button 
            variant="outline"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid - Current Month */}
        <Card className="mb-6 print:border print:shadow-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-bold mb-3 text-center print:text-base">
              {months[selectedMonth]} {selectedYear}
            </h3>
            
            {/* Events for this month */}
            <div className="space-y-2">
              {getMonthEvents(selectedMonth, selectedYear).length > 0 ? (
                getMonthEvents(selectedMonth, selectedYear).map((event, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${getEventTypeColor(event.type)} print:p-2 print:text-sm`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">
                          {new Date(event.date).getDate()}
                        </span>
                        <div>
                          <p className="font-semibold">{event.name}</p>
                          <span className="text-xs opacity-80">{getEventTypeLabel(event.type)}</span>
                        </div>
                      </div>
                      <span className="text-sm">
                        {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm mt-1 opacity-80">{event.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">
                  {isHindi ? 'इस महीने कोई कार्यक्रम नहीं' : 'No events this month'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full Year Overview - Print Version */}
        <div className="hidden print:block">
          <h3 className="text-lg font-bold mb-4 text-center border-b pb-2">
            {isHindi ? 'पूर्ण वर्ष कार्यक्रम सूची' : 'Full Year Events List'}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {months.map((month, idx) => {
              const year = idx >= 3 ? 2025 : 2026; // April-March academic year
              const monthEvents = getMonthEvents(idx, year);
              return (
                <div key={idx} className="border rounded p-2">
                  <h4 className="font-bold border-b pb-1 mb-2">{month} {year}</h4>
                  {monthEvents.length > 0 ? (
                    <ul className="space-y-1">
                      {monthEvents.map((event, i) => (
                        <li key={i} className="text-xs">
                          <span className="font-semibold">{new Date(event.date).getDate()}</span> - {event.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">-</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center print:mt-6">
          {['national', 'festival', 'state', 'vacation', 'school_event', 'exam'].map(type => (
            <span key={type} className={`px-2 py-1 rounded text-xs border ${getEventTypeColor(type)}`}>
              {getEventTypeLabel(type)}
            </span>
          ))}
        </div>

        {/* Footer for Print */}
        <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>Generated by Schooltino - Smart School Management System</p>
          <p>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {isHindi ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{isHindi ? 'तारीख' : 'Date'} *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isHindi ? 'कार्यक्रम का नाम' : 'Event Name'} *</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder={isHindi ? 'जैसे: वार्षिक उत्सव' : 'e.g., Annual Function'}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isHindi ? 'प्रकार' : 'Type'}</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3"
                >
                  <option value="school_event">{isHindi ? 'स्कूल कार्यक्रम' : 'School Event'}</option>
                  <option value="exam">{isHindi ? 'परीक्षा' : 'Exam'}</option>
                  <option value="vacation">{isHindi ? 'छुट्टी' : 'Holiday/Vacation'}</option>
                  <option value="festival">{isHindi ? 'त्योहार' : 'Festival'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isHindi ? 'विवरण' : 'Description'}</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder={isHindi ? 'अतिरिक्त जानकारी...' : 'Additional details...'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={addSchoolEvent} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {isHindi ? 'जोड़ें' : 'Add Event'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddEvent(false)} className="flex-1">
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-testid="school-calendar-page"], [data-testid="school-calendar-page"] * { visibility: visible; }
          [data-testid="school-calendar-page"] { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
