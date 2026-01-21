import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Calendar, Printer, Plus, Edit2, Trash2, Bell, ChevronLeft, ChevronRight, 
  MapPin, Phone, Mail, Globe, Image, Upload, Star, Quote, Sparkles, Loader2,
  X, Save, Camera, Check
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Government Holidays by State (2025-26)
const STATE_HOLIDAYS = {
  'Rajasthan': [
    { date: '2025-01-26', name: 'गणतंत्र दिवस (Republic Day)', type: 'national' },
    { date: '2025-03-14', name: 'होली (Holi)', type: 'festival' },
    { date: '2025-03-31', name: 'राजस्थान दिवस', type: 'state' },
    { date: '2025-04-14', name: 'अम्बेडकर जयंती', type: 'national' },
    { date: '2025-04-18', name: 'गुड फ्राइडे', type: 'national' },
    { date: '2025-05-12', name: 'बुद्ध पूर्णिमा', type: 'festival' },
    { date: '2025-08-15', name: 'स्वतंत्रता दिवस (Independence Day)', type: 'national' },
    { date: '2025-08-26', name: 'जन्माष्टमी (Janmashtami)', type: 'festival' },
    { date: '2025-10-02', name: 'गांधी जयंती', type: 'national' },
    { date: '2025-10-12', name: 'दशहरा (Dussehra)', type: 'festival' },
    { date: '2025-10-20', name: 'दीपावली अवकाश प्रारंभ', type: 'vacation' },
    { date: '2025-11-01', name: 'दीपावली (Diwali)', type: 'festival' },
    { date: '2025-11-05', name: 'गोवर्धन पूजा', type: 'festival' },
    { date: '2025-11-15', name: 'गुरु नानक जयंती', type: 'festival' },
    { date: '2025-12-25', name: 'क्रिसमस (Christmas)', type: 'festival' },
    { date: '2026-01-01', name: 'नव वर्ष (New Year)', type: 'festival' },
    { date: '2026-01-14', name: 'मकर संक्रांति', type: 'festival' },
    { date: '2026-01-26', name: 'गणतंत्र दिवस', type: 'national' },
    { date: '2026-03-03', name: 'होली (Holi)', type: 'festival' },
  ],
  'Madhya Pradesh': [
    { date: '2025-01-26', name: 'गणतंत्र दिवस', type: 'national' },
    { date: '2025-03-14', name: 'होली', type: 'festival' },
    { date: '2025-04-14', name: 'अम्बेडकर जयंती', type: 'national' },
    { date: '2025-05-01', name: 'मध्य प्रदेश स्थापना दिवस', type: 'state' },
    { date: '2025-08-15', name: 'स्वतंत्रता दिवस', type: 'national' },
    { date: '2025-08-26', name: 'जन्माष्टमी', type: 'festival' },
    { date: '2025-10-02', name: 'गांधी जयंती', type: 'national' },
    { date: '2025-10-12', name: 'दशहरा', type: 'festival' },
    { date: '2025-11-01', name: 'दीपावली', type: 'festival' },
    { date: '2025-11-15', name: 'गुरु नानक जयंती', type: 'festival' },
    { date: '2025-12-25', name: 'क्रिसमस', type: 'festival' },
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

// Summer/Winter Vacation Dates
const VACATION_DATES = {
  'Rajasthan': {
    summer: { start: '2025-05-01', end: '2025-06-30', name: 'ग्रीष्मकालीन अवकाश (Summer Vacation)' },
    winter: { start: '2025-12-25', end: '2026-01-05', name: 'शीतकालीन अवकाश (Winter Vacation)' },
    diwali: { start: '2025-10-20', end: '2025-11-05', name: 'दीपावली अवकाश (Diwali Vacation)' }
  },
  'Madhya Pradesh': {
    summer: { start: '2025-05-10', end: '2025-06-20', name: 'ग्रीष्मकालीन अवकाश' },
    winter: { start: '2025-12-24', end: '2026-01-02', name: 'शीतकालीन अवकाश' }
  }
};

export default function SchoolCalendarPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const calendarRef = useRef(null);
  const isHindi = i18n.language === 'hi';
  
  const [school, setSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  
  // Event Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ 
    date: '', name: '', type: 'school_event', description: '', photo: null 
  });
  
  // Photo Gallery States
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [calendarPhotos, setCalendarPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Testimonial States
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ text: '', author: '', designation: '', photo: null });
  
  // AI Calendar Generation
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [generatedCalendarImage, setGeneratedCalendarImage] = useState(null);
  
  const months = isHindi 
    ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDays = isHindi 
    ? ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch school data
      const schoolRes = await axios.get(`${API}/api/school/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchool(schoolRes.data);
      
      // Fetch events
      try {
        const eventsRes = await axios.get(`${API}/api/school/${schoolId}/calendar-events`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(eventsRes.data || []);
      } catch {
        setEvents([]);
      }
      
      // Fetch photos
      try {
        const photosRes = await axios.get(`${API}/api/school/${schoolId}/calendar-photos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCalendarPhotos(photosRes.data || []);
      } catch {
        setCalendarPhotos([]);
      }
      
      // Fetch testimonials
      try {
        const testRes = await axios.get(`${API}/api/school/${schoolId}/testimonials`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTestimonials(testRes.data || []);
      } catch {
        setTestimonials([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventForDate = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getAllEvents().find(e => e.date === dateStr);
  };

  // Event CRUD
  const handleSaveEvent = async () => {
    if (!eventForm.date || !eventForm.name) {
      toast.error(isHindi ? 'तारीख और नाम जरूरी है' : 'Date and name are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (editingEvent) {
        await axios.put(`${API}/api/school/${schoolId}/calendar-events/${editingEvent.id}`, eventForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(isHindi ? 'कार्यक्रम अपडेट हो गया' : 'Event updated');
      } else {
        await axios.post(`${API}/api/school/${schoolId}/calendar-events`, eventForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(isHindi ? 'कार्यक्रम जोड़ा गया' : 'Event added');
      }
      fetchData();
      closeEventModal();
    } catch (error) {
      // Local fallback
      if (editingEvent) {
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventForm } : e));
      } else {
        setEvents([...events, { ...eventForm, id: Date.now().toString() }]);
      }
      toast.success(isHindi ? 'कार्यक्रम सेव हो गया' : 'Event saved');
      closeEventModal();
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(isHindi ? 'क्या आप इस कार्यक्रम को हटाना चाहते हैं?' : 'Delete this event?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/school/${schoolId}/calendar-events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success(isHindi ? 'कार्यक्रम हटा दिया गया' : 'Event deleted');
    } catch {
      setEvents(events.filter(e => e.id !== eventId));
      toast.success(isHindi ? 'कार्यक्रम हटा दिया गया' : 'Event deleted');
    }
  };

  const openEventModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({ date: event.date, name: event.name, type: event.type, description: event.description || '', photo: event.photo });
    } else {
      setEditingEvent(null);
      setEventForm({ date: '', name: '', type: 'school_event', description: '', photo: null });
    }
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ date: '', name: '', type: 'school_event', description: '', photo: null });
  };

  // Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('school_id', schoolId);
      formData.append('type', 'calendar');
      
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      // Add to calendar photos
      const newPhoto = { id: Date.now().toString(), url: res.data.url, caption: '', uploaded_at: new Date().toISOString() };
      setCalendarPhotos([...calendarPhotos, newPhoto]);
      toast.success(isHindi ? 'फोटो अपलोड हो गई' : 'Photo uploaded');
    } catch (error) {
      // Local preview fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = { id: Date.now().toString(), url: e.target.result, caption: '', uploaded_at: new Date().toISOString() };
        setCalendarPhotos([...calendarPhotos, newPhoto]);
        toast.success(isHindi ? 'फोटो जोड़ी गई' : 'Photo added');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deletePhoto = (photoId) => {
    setCalendarPhotos(calendarPhotos.filter(p => p.id !== photoId));
    toast.success(isHindi ? 'फोटो हटाई गई' : 'Photo removed');
  };

  // Testimonials
  const handleSaveTestimonial = async () => {
    if (!testimonialForm.text || !testimonialForm.author) {
      toast.error(isHindi ? 'प्रशंसापत्र और नाम जरूरी है' : 'Testimonial and name required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (editingTestimonial) {
        await axios.put(`${API}/api/school/${schoolId}/testimonials/${editingTestimonial.id}`, testimonialForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/api/school/${schoolId}/testimonials`, testimonialForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchData();
      closeTestimonialModal();
      toast.success(isHindi ? 'प्रशंसापत्र सेव हो गया' : 'Testimonial saved');
    } catch {
      // Local fallback
      if (editingTestimonial) {
        setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? { ...t, ...testimonialForm } : t));
      } else {
        setTestimonials([...testimonials, { ...testimonialForm, id: Date.now().toString() }]);
      }
      closeTestimonialModal();
      toast.success(isHindi ? 'प्रशंसापत्र जोड़ा गया' : 'Testimonial added');
    }
  };

  const openTestimonialModal = (testimonial = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setTestimonialForm({ text: testimonial.text, author: testimonial.author, designation: testimonial.designation || '', photo: testimonial.photo });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({ text: '', author: '', designation: '', photo: null });
    }
    setShowTestimonialModal(true);
  };

  const closeTestimonialModal = () => {
    setShowTestimonialModal(false);
    setEditingTestimonial(null);
    setTestimonialForm({ text: '', author: '', designation: '', photo: null });
  };

  const deleteTestimonial = (id) => {
    setTestimonials(testimonials.filter(t => t.id !== id));
    toast.success(isHindi ? 'प्रशंसापत्र हटाया गया' : 'Testimonial removed');
  };

  // AI Calendar Generation with Nano Banana
  const generateAICalendar = async () => {
    setGeneratingCalendar(true);
    try {
      const token = localStorage.getItem('token');
      const eventsForPrompt = getAllEvents().slice(0, 10).map(e => `${e.date}: ${e.name}`).join(', ');
      
      const response = await axios.post(`${API}/api/calendar/generate-image`, {
        school_id: schoolId,
        school_name: school?.name || 'School',
        year: '2025-26',
        events: eventsForPrompt,
        state: school?.settings?.state || 'Rajasthan',
        language: i18n.language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.image_url) {
        setGeneratedCalendarImage(response.data.image_url);
        toast.success(isHindi ? 'AI कैलेंडर बन गया!' : 'AI Calendar generated!');
      }
    } catch (error) {
      console.error('AI Calendar generation error:', error);
      toast.error(isHindi ? 'AI कैलेंडर बनाने में समस्या' : 'Error generating AI calendar');
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getEventTypeColor = (type) => {
    const colors = {
      national: 'bg-orange-500 text-white',
      festival: 'bg-purple-500 text-white',
      state: 'bg-blue-500 text-white',
      vacation: 'bg-green-500 text-white',
      school_event: 'bg-indigo-500 text-white',
      exam: 'bg-red-500 text-white'
    };
    return colors[type] || 'bg-gray-500 text-white';
  };

  const getEventTypeBadge = (type) => {
    const colors = {
      national: 'bg-orange-100 text-orange-800 border-orange-300',
      festival: 'bg-purple-100 text-purple-800 border-purple-300',
      state: 'bg-blue-100 text-blue-800 border-blue-300',
      vacation: 'bg-green-100 text-green-800 border-green-300',
      school_event: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      exam: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      national: isHindi ? 'राष्ट्रीय' : 'National',
      festival: isHindi ? 'त्योहार' : 'Festival',
      state: isHindi ? 'राज्य' : 'State',
      vacation: isHindi ? 'छुट्टी' : 'Vacation',
      school_event: isHindi ? 'स्कूल' : 'School',
      exam: isHindi ? 'परीक्षा' : 'Exam'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="school-calendar-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            {isHindi ? 'विद्यालय कैलेंडर' : 'School Calendar'}
          </h1>
          <p className="text-slate-500">
            {school?.name || 'School'} • {isHindi ? 'शैक्षणिक सत्र' : 'Academic Session'} 2025-26
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowPhotoModal(true)} variant="outline" size="sm">
            <Image className="w-4 h-4 mr-2" />
            {isHindi ? 'फोटो' : 'Photos'} ({calendarPhotos.length})
          </Button>
          <Button onClick={() => openTestimonialModal()} variant="outline" size="sm">
            <Quote className="w-4 h-4 mr-2" />
            {isHindi ? 'प्रशंसापत्र' : 'Testimonials'}
          </Button>
          <Button onClick={() => openEventModal()} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {isHindi ? 'कार्यक्रम' : 'Event'}
          </Button>
          <Button 
            onClick={generateAICalendar} 
            disabled={generatingCalendar}
            variant="outline" 
            size="sm"
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
          >
            {generatingCalendar ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            )}
            {isHindi ? 'AI कैलेंडर' : 'AI Calendar'}
          </Button>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            {isHindi ? 'प्रिंट' : 'Print'}
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 print:hidden">
        <Button 
          variant={viewMode === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('month')}
        >
          {isHindi ? 'महीना' : 'Month View'}
        </Button>
        <Button 
          variant={viewMode === 'year' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setViewMode('year')}
        >
          {isHindi ? 'पूरा साल' : 'Year View'}
        </Button>
      </div>

      {/* Calendar Content */}
      <div ref={calendarRef}>
        {/* Print Header */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
          {school?.logo_url && <img src={school.logo_url} alt="" className="h-16 mx-auto mb-2" />}
          <h1 className="text-2xl font-bold">{school?.name || 'School Name'}</h1>
          <div className="flex justify-center gap-6 text-sm mt-2">
            {school?.address && <span><MapPin className="w-3 h-3 inline mr-1" />{school.address}</span>}
            {school?.phone && <span><Phone className="w-3 h-3 inline mr-1" />{school.phone}</span>}
          </div>
          <p className="text-lg font-semibold mt-2">
            {isHindi ? 'शैक्षणिक कैलेंडर' : 'Academic Calendar'} 2025-26
          </p>
        </div>

        {viewMode === 'month' ? (
          <>
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

            {/* Calendar Grid */}
            <Card className="mb-6">
              <CardContent className="p-4">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, idx) => (
                    <div key={idx} className={`text-center text-sm font-semibold p-2 ${idx === 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array(getFirstDayOfMonth(selectedMonth, selectedYear)).fill(null).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-20 md:h-24" />
                  ))}
                  
                  {/* Actual days */}
                  {Array(getDaysInMonth(selectedMonth, selectedYear)).fill(null).map((_, idx) => {
                    const day = idx + 1;
                    const event = getEventForDate(day, selectedMonth, selectedYear);
                    const isToday = new Date().getDate() === day && 
                                    new Date().getMonth() === selectedMonth && 
                                    new Date().getFullYear() === selectedYear;
                    const isSunday = new Date(selectedYear, selectedMonth, day).getDay() === 0;
                    
                    return (
                      <div 
                        key={day}
                        className={`h-20 md:h-24 border rounded-lg p-1 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isToday ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                        } ${isSunday ? 'bg-red-50' : ''}`}
                        onClick={() => {
                          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setEventForm({ ...eventForm, date: dateStr });
                          setShowEventModal(true);
                        }}
                      >
                        <div className={`text-sm font-semibold ${isSunday ? 'text-red-600' : ''} ${isToday ? 'text-indigo-600' : ''}`}>
                          {day}
                        </div>
                        {event && (
                          <div className={`text-xs p-1 rounded mt-1 truncate ${getEventTypeColor(event.type)}`}>
                            {event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Events List for Current Month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isHindi ? `${months[selectedMonth]} ${selectedYear} के कार्यक्रम` : `Events in ${months[selectedMonth]} ${selectedYear}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getMonthEvents(selectedMonth, selectedYear).length > 0 ? (
                    getMonthEvents(selectedMonth, selectedYear).map((event, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center justify-between ${getEventTypeBadge(event.type)}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg w-8">
                            {new Date(event.date).getDate()}
                          </span>
                          <div>
                            <p className="font-semibold">{event.name}</p>
                            <span className="text-xs opacity-80">{getEventTypeLabel(event.type)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm hidden md:block">
                            {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          {event.id && !['national', 'festival', 'state'].includes(event.type) && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEventModal(event); }}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}>
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
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
          </>
        ) : (
          /* Year View - All 12 Months */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-4">
            {months.map((month, monthIdx) => {
              const year = monthIdx >= 3 ? 2025 : 2026; // April 2025 to March 2026
              const monthEvents = getMonthEvents(monthIdx, year);
              
              return (
                <Card key={monthIdx} className="print:border print:shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">{month} {year}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {monthEvents.length > 0 ? (
                      <ul className="space-y-1">
                        {monthEvents.slice(0, 5).map((event, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getEventTypeColor(event.type).split(' ')[0]}`}></span>
                            <span>
                              <strong>{new Date(event.date).getDate()}</strong> - {event.name}
                            </span>
                          </li>
                        ))}
                        {monthEvents.length > 5 && (
                          <li className="text-xs text-slate-400">+{monthEvents.length - 5} more</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">-</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {['national', 'festival', 'state', 'vacation', 'school_event', 'exam'].map(type => (
            <span key={type} className={`px-3 py-1 rounded-full text-xs border ${getEventTypeBadge(type)}`}>
              {getEventTypeLabel(type)}
            </span>
          ))}
        </div>

        {/* Photos Section for Print */}
        {calendarPhotos.length > 0 && (
          <div className="mt-8 print:mt-6">
            <h3 className="text-lg font-bold mb-4 text-center">{isHindi ? 'फोटो गैलरी' : 'Photo Gallery'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
              {calendarPhotos.slice(0, 8).map((photo, idx) => (
                <img 
                  key={idx} 
                  src={photo.url} 
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg print:h-24"
                />
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Section for Print */}
        {testimonials.length > 0 && (
          <div className="mt-8 print:mt-6">
            <h3 className="text-lg font-bold mb-4 text-center">{isHindi ? 'प्रशंसापत्र' : 'Testimonials'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              {testimonials.slice(0, 4).map((test, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border italic print:p-2 print:text-sm">
                  <Quote className="w-5 h-5 text-indigo-400 mb-2" />
                  <p className="text-slate-700">"{test.text}"</p>
                  <p className="text-sm font-semibold mt-2 text-slate-600">- {test.author}</p>
                  {test.designation && <p className="text-xs text-slate-500">{test.designation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Generated Calendar Image */}
        {generatedCalendarImage && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4 text-center">{isHindi ? 'AI द्वारा बनाया गया कैलेंडर' : 'AI Generated Calendar'}</h3>
            <img 
              src={generatedCalendarImage} 
              alt="AI Generated Calendar"
              className="max-w-full mx-auto rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>Powered by Schooltino - Smart School Management System</p>
          <p>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingEvent ? (isHindi ? 'कार्यक्रम संपादित करें' : 'Edit Event') : (isHindi ? 'नया कार्यक्रम' : 'Add Event')}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeEventModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>{isHindi ? 'तारीख' : 'Date'} *</Label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label>{isHindi ? 'कार्यक्रम का नाम' : 'Event Name'} *</Label>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder={isHindi ? 'जैसे: वार्षिक उत्सव' : 'e.g., Annual Function'}
                />
              </div>
              <div>
                <Label>{isHindi ? 'प्रकार' : 'Type'}</Label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full h-10 rounded-md border border-slate-200 px-3"
                >
                  <option value="school_event">{isHindi ? 'स्कूल कार्यक्रम' : 'School Event'}</option>
                  <option value="exam">{isHindi ? 'परीक्षा' : 'Exam'}</option>
                  <option value="vacation">{isHindi ? 'छुट्टी' : 'Holiday/Vacation'}</option>
                  <option value="festival">{isHindi ? 'त्योहार' : 'Festival'}</option>
                </select>
              </div>
              <div>
                <Label>{isHindi ? 'विवरण' : 'Description'}</Label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  rows={3}
                  placeholder={isHindi ? 'अतिरिक्त जानकारी...' : 'Additional details...'}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveEvent} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                {isHindi ? 'सेव करें' : 'Save'}
              </Button>
              <Button variant="outline" onClick={closeEventModal} className="flex-1">
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{isHindi ? 'फोटो गैलरी' : 'Photo Gallery'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPhotoModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Upload Button */}
            <div className="mb-4">
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-slate-600">{isHindi ? 'फोटो अपलोड करें' : 'Upload Photo'}</span>
              </label>
            </div>
            
            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {calendarPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img src={photo.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {calendarPhotos.length === 0 && (
                <p className="col-span-full text-center text-slate-400 py-8">
                  {isHindi ? 'कोई फोटो नहीं' : 'No photos yet'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{isHindi ? 'प्रशंसापत्र' : 'Testimonials'}</h3>
              <Button variant="ghost" size="sm" onClick={closeTestimonialModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Existing Testimonials */}
            {testimonials.length > 0 && !editingTestimonial && (
              <div className="mb-4 space-y-3">
                {testimonials.map((test) => (
                  <div key={test.id} className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-sm italic">"{test.text}"</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold">- {test.author}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openTestimonialModal(test)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTestimonial(test.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add/Edit Form */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">
                {editingTestimonial ? (isHindi ? 'संपादित करें' : 'Edit') : (isHindi ? 'नया जोड़ें' : 'Add New')}
              </h4>
              <div>
                <Label>{isHindi ? 'प्रशंसापत्र' : 'Testimonial'} *</Label>
                <textarea
                  value={testimonialForm.text}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  rows={3}
                  placeholder={isHindi ? 'प्रशंसापत्र लिखें...' : 'Write testimonial...'}
                />
              </div>
              <div>
                <Label>{isHindi ? 'नाम' : 'Name'} *</Label>
                <Input
                  value={testimonialForm.author}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, author: e.target.value })}
                  placeholder={isHindi ? 'जैसे: रमेश कुमार' : 'e.g., Ramesh Kumar'}
                />
              </div>
              <div>
                <Label>{isHindi ? 'पद' : 'Designation'}</Label>
                <Input
                  value={testimonialForm.designation}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, designation: e.target.value })}
                  placeholder={isHindi ? 'जैसे: अभिभावक' : 'e.g., Parent'}
                />
              </div>
              <Button onClick={handleSaveTestimonial} className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                {isHindi ? 'सेव करें' : 'Save'}
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
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
