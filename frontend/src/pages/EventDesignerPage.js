import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Sparkles, Download, Printer, Image, Calendar, 
  PartyPopper, GraduationCap, Trophy, Music, Heart,
  Loader2, Palette, RefreshCw, Copy, Share2, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Event Templates
const EVENT_TEMPLATES = [
  { id: 'annual_function', name: 'Annual Function (वार्षिक उत्सव)', icon: PartyPopper, color: 'from-purple-500 to-pink-500' },
  { id: 'sports_day', name: 'Sports Day (खेल दिवस)', icon: Trophy, color: 'from-green-500 to-emerald-500' },
  { id: 'graduation', name: 'Graduation Ceremony', icon: GraduationCap, color: 'from-blue-500 to-indigo-500' },
  { id: 'cultural_fest', name: 'Cultural Fest (सांस्कृतिक कार्यक्रम)', icon: Music, color: 'from-orange-500 to-red-500' },
  { id: 'parents_meet', name: 'Parent-Teacher Meet', icon: Heart, color: 'from-rose-500 to-pink-500' },
  { id: 'custom', name: 'Custom Event', icon: Calendar, color: 'from-slate-500 to-slate-700' }
];

// Design Styles
const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern & Minimal', preview: '🎨' },
  { id: 'traditional', name: 'Traditional Indian', preview: '🪔' },
  { id: 'festive', name: 'Festive & Colorful', preview: '🎊' },
  { id: 'elegant', name: 'Elegant & Premium', preview: '✨' },
  { id: 'playful', name: 'Playful & Fun', preview: '🎈' }
];

export default function EventDesignerPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';
  const previewRef = useRef(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [designType, setDesignType] = useState('pamphlet'); // 'pamphlet' or 'invitation'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  
  const [eventDetails, setEventDetails] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    chiefGuest: '',
    description: '',
    contactNumber: '',
    specialNote: ''
  });

  const [school, setSchool] = useState({
    name: user?.school_name || 'School Name',
    logo: null,
    address: 'School Address',
    phone: ''
  });

  const handleInputChange = (e) => {
    setEventDetails(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const generateAIDesign = async () => {
    if (!selectedTemplate) {
      toast.error(isHindi ? 'पहले event type चुनें' : 'Please select event type first');
      return;
    }
    if (!eventDetails.eventName || !eventDetails.eventDate) {
      toast.error(isHindi ? 'Event name और date जरूरी है' : 'Event name and date are required');
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/events/generate-design`, {
        school_id: schoolId,
        template_type: selectedTemplate,
        design_style: selectedStyle,
        design_type: designType,
        event_details: eventDetails,
        school_info: school,
        language: i18n.language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGeneratedDesign(response.data);
      toast.success(isHindi ? 'Design तैयार है!' : 'Design generated successfully!');
    } catch (error) {
      console.error('Design generation error:', error);
      // Generate a local preview design instead
      generateLocalDesign();
    } finally {
      setIsGenerating(false);
    }
  };

  // Local design generation (fallback)
  const generateLocalDesign = () => {
    const template = EVENT_TEMPLATES.find(t => t.id === selectedTemplate);
    const styleConfig = getStyleConfig(selectedStyle);
    
    setGeneratedDesign({
      type: designType,
      template: selectedTemplate,
      style: selectedStyle,
      event: eventDetails,
      school: school,
      colors: styleConfig.colors,
      generated_at: new Date().toISOString()
    });
    toast.success(isHindi ? 'Design तैयार है!' : 'Design ready!');
  };

  const getStyleConfig = (style) => {
    const configs = {
      modern: { colors: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#DBEAFE', text: '#1F2937' } },
      traditional: { colors: { primary: '#DC2626', secondary: '#B91C1C', accent: '#FEF3C7', text: '#7C2D12' } },
      festive: { colors: { primary: '#F59E0B', secondary: '#D97706', accent: '#FEF3C7', text: '#92400E' } },
      elegant: { colors: { primary: '#1F2937', secondary: '#111827', accent: '#F3F4F6', text: '#1F2937' } },
      playful: { colors: { primary: '#EC4899', secondary: '#DB2777', accent: '#FCE7F3', text: '#831843' } }
    };
    return configs[style] || configs.modern;
  };

  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${eventDetails.eventName} - ${designType === 'pamphlet' ? 'Pamphlet' : 'Invitation'}</title>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
          .design-container { width: 210mm; min-height: 297mm; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    // For now, trigger print which allows saving as PDF
    handlePrint();
    toast.info(isHindi ? 'Print dialog में "Save as PDF" चुनें' : 'Select "Save as PDF" in print dialog');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventDetails.eventName,
          text: `${school.name} की ओर से ${eventDetails.eventName} का निमंत्रण`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${school.name} - ${eventDetails.eventName}\nDate: ${eventDetails.eventDate}\nVenue: ${eventDetails.venue}`);
      toast.success(isHindi ? 'Details clipboard पर copy हो गई' : 'Details copied to clipboard');
    }
  };

  // WhatsApp Share function
  const handleWhatsAppShare = () => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('hi-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Create invitation message
    const message = `🎉 *${eventDetails.eventName || 'Event'}*

🏫 *${school.name}*

📅 *दिनांक:* ${formatDate(eventDetails.eventDate)}
${eventDetails.eventTime ? `🕐 *समय:* ${formatTime(eventDetails.eventTime)}` : ''}
${eventDetails.venue ? `📍 *स्थान:* ${eventDetails.venue}` : ''}
${eventDetails.chiefGuest ? `👤 *मुख्य अतिथि:* ${eventDetails.chiefGuest}` : ''}

${eventDetails.description || ''}

${eventDetails.specialNote ? `✨ *${eventDetails.specialNote}*` : 'आपका सहर्ष स्वागत है।'}

${eventDetails.contactNumber ? `📞 संपर्क: ${eventDetails.contactNumber}` : ''}

_Powered by Schooltino_`;

    // Encode for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success(isHindi ? 'WhatsApp खुल रहा है...' : 'Opening WhatsApp...');
  };

  return (
    <div className="space-y-6" data-testid="event-designer-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-500" />
            {isHindi ? 'AI Event Designer' : 'AI Event Designer'} 
          </h1>
          <p className="text-slate-500">
            {isHindi ? 'AI से Pamphlets और Invitation Cards बनाएं' : 'Create beautiful pamphlets & invitation cards with AI'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {/* Design Type Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Design प्रकार' : 'Design Type'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  onClick={() => setDesignType('pamphlet')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    designType === 'pamphlet' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <Image className={`w-8 h-8 mx-auto mb-2 ${designType === 'pamphlet' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <p className="font-medium text-center">Pamphlet</p>
                  <p className="text-xs text-slate-500 text-center">{isHindi ? 'पोस्टर / फ्लायर' : 'Poster / Flyer'}</p>
                </button>
                <button
                  onClick={() => setDesignType('invitation')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    designType === 'invitation' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <Heart className={`w-8 h-8 mx-auto mb-2 ${designType === 'invitation' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <p className="font-medium text-center">Invitation Card</p>
                  <p className="text-xs text-slate-500 text-center">{isHindi ? 'निमंत्रण पत्र' : 'Invite Card'}</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Event Type Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Event का प्रकार' : 'Event Type'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EVENT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{template.name}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Design Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                {isHindi ? 'Design Style' : 'Design Style'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DESIGN_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                      selectedStyle === style.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <span>{style.preview}</span>
                    <span className="text-sm font-medium">{style.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Details Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Event Details' : 'Event Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'Event का नाम' : 'Event Name'} *</Label>
                  <Input
                    name="eventName"
                    value={eventDetails.eventName}
                    onChange={handleInputChange}
                    placeholder={isHindi ? 'जैसे: वार्षिक उत्सव 2026' : 'e.g., Annual Function 2026'}
                    data-testid="event-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'तारीख' : 'Date'} *</Label>
                  <Input
                    name="eventDate"
                    type="date"
                    value={eventDetails.eventDate}
                    onChange={handleInputChange}
                    data-testid="event-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'समय' : 'Time'}</Label>
                  <Input
                    name="eventTime"
                    type="time"
                    value={eventDetails.eventTime}
                    onChange={handleInputChange}
                    data-testid="event-time-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'स्थान' : 'Venue'}</Label>
                  <Input
                    name="venue"
                    value={eventDetails.venue}
                    onChange={handleInputChange}
                    placeholder={isHindi ? 'जैसे: स्कूल प्रांगण' : 'e.g., School Auditorium'}
                    data-testid="venue-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'मुख्य अतिथि' : 'Chief Guest'}</Label>
                  <Input
                    name="chiefGuest"
                    value={eventDetails.chiefGuest}
                    onChange={handleInputChange}
                    placeholder={isHindi ? 'जैसे: श्रीमान राज शर्मा, विधायक' : 'e.g., Hon. MLA Raj Sharma'}
                    data-testid="chief-guest-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'विवरण / संदेश' : 'Description / Message'}</Label>
                  <textarea
                    name="description"
                    value={eventDetails.description}
                    onChange={handleInputChange}
                    className="w-full h-20 rounded-lg border border-slate-200 px-3 py-2"
                    placeholder={isHindi ? 'Event के बारे में कुछ लिखें...' : 'Write something about the event...'}
                    data-testid="description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'संपर्क नंबर' : 'Contact Number'}</Label>
                  <Input
                    name="contactNumber"
                    value={eventDetails.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    data-testid="contact-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'विशेष नोट' : 'Special Note'}</Label>
                  <Input
                    name="specialNote"
                    value={eventDetails.specialNote}
                    onChange={handleInputChange}
                    placeholder={isHindi ? 'जैसे: पधारना अनिवार्य है' : 'e.g., Your presence is mandatory'}
                    data-testid="special-note-input"
                  />
                </div>
              </div>

              <Button
                onClick={generateAIDesign}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="generate-design-btn"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isHindi ? 'AI Design बना रहा है...' : 'Generating AI Design...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isHindi ? 'AI से Design बनाएं' : 'Generate AI Design'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{isHindi ? 'Preview' : 'Preview'}</CardTitle>
              {generatedDesign && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateAIDesign}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {isHindi ? 'Regenerate' : 'Regenerate'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedDesign ? (
                <div ref={previewRef}>
                  {/* Rendered Design Preview */}
                  <DesignPreview 
                    design={generatedDesign}
                    designType={designType}
                    selectedStyle={selectedStyle}
                    eventDetails={eventDetails}
                    school={school}
                    template={EVENT_TEMPLATES.find(t => t.id === selectedTemplate)}
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <div className="text-center text-slate-400">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">{isHindi ? 'Design यहाँ दिखेगा' : 'Design preview will appear here'}</p>
                    <p className="text-sm">{isHindi ? 'Details भरें और Generate करें' : 'Fill details and generate'}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {generatedDesign && (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button onClick={handlePrint} variant="outline" className="w-full">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button onClick={handleShare} variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  {/* WhatsApp Share - Prominent Button */}
                  <Button 
                    onClick={handleWhatsAppShare} 
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    data-testid="whatsapp-share-btn"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {isHindi ? 'WhatsApp पर भेजें' : 'Share on WhatsApp'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Design Preview Component
function DesignPreview({ design, designType, selectedStyle, eventDetails, school, template }) {
  const styleConfig = {
    modern: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      header: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      accent: 'border-blue-500',
      text: 'text-slate-800'
    },
    traditional: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-100',
      header: 'bg-gradient-to-r from-red-600 to-orange-600',
      accent: 'border-red-500',
      text: 'text-amber-900'
    },
    festive: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
      header: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      accent: 'border-amber-500',
      text: 'text-amber-900'
    },
    elegant: {
      bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
      header: 'bg-gradient-to-r from-slate-800 to-slate-900',
      accent: 'border-slate-700',
      text: 'text-slate-900'
    },
    playful: {
      bg: 'bg-gradient-to-br from-pink-50 to-purple-100',
      header: 'bg-gradient-to-r from-pink-500 to-purple-500',
      accent: 'border-pink-500',
      text: 'text-purple-900'
    }
  };

  const style = styleConfig[selectedStyle] || styleConfig.modern;
  const Icon = template?.icon || Calendar;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hi-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (designType === 'invitation') {
    // Invitation Card Design
    return (
      <div className={`aspect-[4/5] ${style.bg} rounded-xl overflow-hidden shadow-lg border-4 ${style.accent}`}>
        {/* Header with school name */}
        <div className={`${style.header} text-white p-4 text-center`}>
          <p className="text-xs opacity-80 tracking-widest uppercase">आप सादर आमंत्रित हैं</p>
          <h3 className="text-lg font-bold mt-1">{school.name}</h3>
        </div>
        
        {/* Main Content */}
        <div className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${style.header} flex items-center justify-center`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <h2 className={`text-2xl font-bold ${style.text} mb-3`}>
            {eventDetails.eventName || 'Event Name'}
          </h2>
          
          {eventDetails.description && (
            <p className={`text-sm ${style.text} opacity-75 mb-4`}>
              {eventDetails.description}
            </p>
          )}
          
          <div className={`space-y-2 ${style.text}`}>
            <p className="font-semibold">
              📅 {formatDate(eventDetails.eventDate)}
            </p>
            {eventDetails.eventTime && (
              <p>🕐 {formatTime(eventDetails.eventTime)}</p>
            )}
            {eventDetails.venue && (
              <p>📍 {eventDetails.venue}</p>
            )}
          </div>
          
          {eventDetails.chiefGuest && (
            <div className={`mt-4 p-3 bg-white/50 rounded-lg ${style.text}`}>
              <p className="text-xs opacity-70">मुख्य अतिथि</p>
              <p className="font-bold">{eventDetails.chiefGuest}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`${style.header} text-white p-3 text-center text-sm mt-auto`}>
          {eventDetails.specialNote || 'आपका सहर्ष स्वागत है।'}
          {eventDetails.contactNumber && (
            <p className="text-xs opacity-80 mt-1">संपर्क: {eventDetails.contactNumber}</p>
          )}
        </div>
      </div>
    );
  }

  // Pamphlet Design
  return (
    <div className={`aspect-[3/4] ${style.bg} rounded-xl overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className={`${style.header} text-white p-6 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full" />
        </div>
        <div className="relative">
          <p className="text-sm opacity-90 tracking-wide mb-1">{school.name}</p>
          <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide">
            {eventDetails.eventName || 'Event Name'}
          </h1>
        </div>
      </div>
      
      {/* Content */}
      <div className={`p-6 ${style.text}`}>
        {eventDetails.description && (
          <p className="text-center mb-6 opacity-80">
            {eventDetails.description}
          </p>
        )}
        
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 bg-white/70 rounded-lg border-l-4 ${style.accent}`}>
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs opacity-70">दिनांक / Date</p>
              <p className="font-bold">{formatDate(eventDetails.eventDate)}</p>
            </div>
          </div>
          
          {eventDetails.eventTime && (
            <div className={`flex items-center gap-3 p-3 bg-white/70 rounded-lg border-l-4 ${style.accent}`}>
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-xs opacity-70">समय / Time</p>
                <p className="font-bold">{formatTime(eventDetails.eventTime)}</p>
              </div>
            </div>
          )}
          
          {eventDetails.venue && (
            <div className={`flex items-center gap-3 p-3 bg-white/70 rounded-lg border-l-4 ${style.accent}`}>
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-xs opacity-70">स्थान / Venue</p>
                <p className="font-bold">{eventDetails.venue}</p>
              </div>
            </div>
          )}
          
          {eventDetails.chiefGuest && (
            <div className={`flex items-center gap-3 p-3 bg-white/70 rounded-lg border-l-4 ${style.accent}`}>
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-xs opacity-70">मुख्य अतिथि / Chief Guest</p>
                <p className="font-bold">{eventDetails.chiefGuest}</p>
              </div>
            </div>
          )}
        </div>
        
        {eventDetails.specialNote && (
          <div className={`mt-4 p-3 ${style.header} text-white rounded-lg text-center`}>
            <p className="text-sm">{eventDetails.specialNote}</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className={`px-6 pb-4 ${style.text} text-center text-sm opacity-70`}>
        {eventDetails.contactNumber && <p>📞 {eventDetails.contactNumber}</p>}
        <p className="mt-1">{school.address}</p>
      </div>
    </div>
  );
}
