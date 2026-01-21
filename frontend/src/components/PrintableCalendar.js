import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from './ui/button';
import { 
  Printer, Download, ChevronLeft, ChevronRight, 
  Calendar, Star, Award, Trophy, Image as ImageIcon
} from 'lucide-react';

// Government Holidays 2025-26 with Hindi names
const GOVT_HOLIDAYS_2025_26 = {
  1: [ // January 2026
    { date: 1, name: 'नव वर्ष', type: 'festival' },
    { date: 14, name: 'मकर संक्रांति', type: 'festival' },
    { date: 23, name: 'नेताजी जयंती', type: 'national' },
    { date: 26, name: 'गणतंत्र दिवस', type: 'national' },
  ],
  2: [ // February 2026
    { date: 3, name: 'बसंत पंचमी', type: 'festival' },
    { date: 19, name: 'शिवाजी जयंती', type: 'state' },
    { date: 26, name: 'महाशिवरात्रि', type: 'festival' },
  ],
  3: [ // March 2026
    { date: 3, name: 'होली', type: 'festival' },
    { date: 4, name: 'धूलंडी', type: 'festival' },
    { date: 31, name: 'राजस्थान दिवस', type: 'state' },
  ],
  4: [ // April 2026
    { date: 6, name: 'राम नवमी', type: 'festival' },
    { date: 14, name: 'अम्बेडकर जयंती', type: 'national' },
    { date: 21, name: 'महावीर जयंती', type: 'festival' },
  ],
  5: [ // May 2026
    { date: 1, name: 'मजदूर दिवस', type: 'national' },
    { date: 7, name: 'बुद्ध पूर्णिमा', type: 'festival' },
    { date: 10, name: 'ग्रीष्मावकाश प्रारंभ', type: 'vacation' },
  ],
  6: [ // June 2026
    { date: 21, name: 'अंतर्राष्ट्रीय योग दिवस', type: 'national' },
    { date: 30, name: 'ग्रीष्मावकाश समाप्त', type: 'vacation' },
  ],
  7: [ // July 2026
    { date: 1, name: 'विद्यालय पुनः प्रारंभ', type: 'school' },
    { date: 17, name: 'मुहर्रम', type: 'festival' },
  ],
  8: [ // August 2026
    { date: 11, name: 'रक्षाबंधन', type: 'festival' },
    { date: 15, name: 'स्वतंत्रता दिवस', type: 'national' },
    { date: 19, name: 'जन्माष्टमी', type: 'festival' },
  ],
  9: [ // September 2026
    { date: 5, name: 'शिक्षक दिवस', type: 'national' },
    { date: 16, name: 'ईद-उल-जुहा (बकरीद)', type: 'festival' },
    { date: 25, name: 'मुहर्रम', type: 'festival' },
  ],
  10: [ // October 2026
    { date: 2, name: 'गांधी जयंती', type: 'national' },
    { date: 7, name: 'नवरात्रि प्रारंभ', type: 'festival' },
    { date: 15, name: 'दशहरा', type: 'festival' },
  ],
  11: [ // November 2026
    { date: 1, name: 'छोटी दीपावली', type: 'festival' },
    { date: 2, name: 'दीपावली', type: 'festival' },
    { date: 3, name: 'गोवर्धन पूजा', type: 'festival' },
    { date: 4, name: 'भाई दूज', type: 'festival' },
    { date: 14, name: 'बाल दिवस', type: 'national' },
    { date: 17, name: 'गुरु नानक जयंती', type: 'festival' },
  ],
  12: [ // December 2026
    { date: 25, name: 'क्रिसमस', type: 'festival' },
    { date: 26, name: 'शीतकालीन अवकाश प्रारंभ', type: 'vacation' },
  ]
};

// Hindi month names
const HINDI_MONTHS = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Hindi weekdays
const HINDI_DAYS = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const ENGLISH_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function PrintableCalendar({ school, customEvents = [], testimonials = [], photos = [], achievements = [] }) {
  const printRef = useRef();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(2026);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${school?.name || 'School'}_Calendar_${currentMonth}_${currentYear}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `
  });

  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month - 1, 1).getDay();

  const getHolidaysForMonth = (month) => {
    return GOVT_HOLIDAYS_2025_26[month] || [];
  };

  const getCustomEventsForMonth = (month, year) => {
    return customEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  };

  const getAllEventsForDate = (day, month, year) => {
    const holidays = getHolidaysForMonth(month).filter(h => h.date === day);
    const custom = getCustomEventsForMonth(month, year).filter(e => new Date(e.date).getDate() === day);
    return [...holidays, ...custom];
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-gray-200"></div>);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const events = getAllEventsForDate(day, currentMonth, currentYear);
      const isSunday = (firstDay + day - 1) % 7 === 0;
      const hasHoliday = events.some(e => e.type === 'national' || e.type === 'festival');
      
      days.push(
        <div 
          key={day} 
          className={`h-16 border border-gray-200 p-1 text-center relative ${
            isSunday || hasHoliday ? 'bg-red-50' : 'bg-white'
          }`}
        >
          <span className={`text-lg font-bold ${isSunday || hasHoliday ? 'text-red-600' : 'text-gray-900'}`}>
            {day}
          </span>
          {events.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 text-[8px] leading-tight px-0.5 truncate text-red-600 font-medium">
              {events[0].name}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // Get events list for current month
  const getMonthEventsList = () => {
    const holidays = getHolidaysForMonth(currentMonth);
    const custom = getCustomEventsForMonth(currentMonth, currentYear);
    return [...holidays, ...custom].sort((a, b) => (a.date || new Date(a.date).getDate()) - (b.date || new Date(b.date).getDate()));
  };

  return (
    <div className="space-y-4">
      {/* Controls - No Print */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {HINDI_MONTHS[currentMonth - 1]} / {ENGLISH_MONTHS[currentMonth - 1]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Calendar
          </Button>
        </div>
      </div>

      {/* Printable Calendar */}
      <div ref={printRef} className="bg-white">
        {/* A4 Page */}
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-4 shadow-lg print:shadow-none print:p-2">
          
          {/* Header - School Branding */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {school?.logo_url && (
                  <img src={school.logo_url} alt="" className="w-16 h-16 rounded-full border-2 border-white" />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{school?.name || 'APS Science School'}</h1>
                  <p className="text-sm opacity-90">{school?.motto || 'Excellence in Education'}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p>📞 {school?.phone || '+91 XXXXX XXXXX'}</p>
                <p>📧 {school?.email || 'info@school.com'}</p>
                <p>🌐 {school?.website_url || 'www.school.com'}</p>
              </div>
            </div>
          </div>

          {/* Month Title */}
          <div className="bg-gradient-to-r from-orange-500 via-white to-green-500 p-2 text-center">
            <h2 className="text-3xl font-bold text-blue-900">
              {HINDI_MONTHS[currentMonth - 1]} / {ENGLISH_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
          </div>

          {/* Calendar Grid */}
          <div className="mt-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-blue-900 text-white">
              {HINDI_DAYS.map((day, idx) => (
                <div key={idx} className={`text-center py-2 font-bold ${idx === 0 ? 'text-red-300' : ''}`}>
                  <div>{day}</div>
                  <div className="text-xs">{ENGLISH_DAYS[idx]}</div>
                </div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {generateCalendarDays()}
            </div>
          </div>

          {/* Events List */}
          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              महत्वपूर्ण तिथियाँ / Important Dates
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {getMonthEventsList().map((event, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${
                  event.type === 'national' ? 'text-orange-700' : 
                  event.type === 'festival' ? 'text-purple-700' : 
                  event.type === 'vacation' ? 'text-green-700' : 'text-blue-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    event.type === 'national' ? 'bg-orange-500' : 
                    event.type === 'festival' ? 'bg-purple-500' : 
                    event.type === 'vacation' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></span>
                  <span className="font-bold">{event.date || new Date(event.date).getDate()}</span>
                  <span>{event.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Achievements Section */}
          {achievements.length > 0 && (
            <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border-2 border-yellow-400">
              <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                🏆 हमारे गौरव / Our Achievers - "Diamonds of School"
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {achievements.slice(0, 8).map((ach, idx) => (
                  <div key={idx} className="text-center p-2 bg-white rounded-lg shadow-sm">
                    {ach.photo && (
                      <img src={ach.photo} alt="" className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-yellow-400" />
                    )}
                    <p className="text-xs font-bold">{ach.name}</p>
                    <p className="text-[10px] text-gray-600">{ach.achievement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div className="mt-3 bg-blue-50 p-3 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                प्रशंसापत्र / Testimonials
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {testimonials.slice(0, 2).map((t, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg text-sm italic border-l-4 border-blue-500">
                    "{t.text}" <br/>
                    <span className="font-bold not-italic">- {t.author}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* School Photos */}
          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photos.slice(0, 4).map((photo, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden h-24">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-2 border-t-2 border-blue-900 text-center text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span>📍 {school?.address || 'School Address'}</span>
              <span className="font-bold text-blue-900">Powered by Schooltino.in</span>
              <span>Affiliation: {school?.affiliation || 'RBSE/CBSE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="no-print bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <h4 className="font-bold text-yellow-800 mb-2">📋 Print Instructions / प्रिंट निर्देश:</h4>
        <ul className="space-y-1 text-yellow-700">
          <li>• <strong>Print Settings:</strong> A4 Size, Portrait, Color</li>
          <li>• <strong>Margins:</strong> Set to "None" or "Minimum" for best results</li>
          <li>• <strong>Scale:</strong> 100% or "Fit to Page"</li>
          <li>• Print each month separately for wall calendar</li>
        </ul>
      </div>
    </div>
  );
}
