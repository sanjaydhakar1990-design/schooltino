import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Sparkles, FileImage, Trophy, Calendar, Megaphone,
  Loader2, Download, Copy, Check, Wand2, Image as ImageIcon, RefreshCw,
  Printer, PartyPopper, GraduationCap, Music, Heart,
  Palette, Share2, MessageCircle, Image, Trash2,
  FileText, BookOpen, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import SYLLABUS_DATA from '../data/syllabusData';

const API_CONTENT = `${process.env.REACT_APP_BACKEND_URL}/api`;
const API_EVENT = process.env.REACT_APP_BACKEND_URL;

const EVENT_TEMPLATES = [
  { id: 'annual_function', name: 'Annual Function (वार्षिक उत्सव)', icon: PartyPopper, color: 'from-purple-500 to-pink-500' },
  { id: 'sports_day', name: 'Sports Day (खेल दिवस)', icon: Trophy, color: 'from-green-500 to-emerald-500' },
  { id: 'graduation', name: 'Graduation Ceremony', icon: GraduationCap, color: 'from-blue-500 to-indigo-500' },
  { id: 'cultural_fest', name: 'Cultural Fest (सांस्कृतिक कार्यक्रम)', icon: Music, color: 'from-orange-500 to-red-500' },
  { id: 'parents_meet', name: 'Parent-Teacher Meet', icon: Heart, color: 'from-rose-500 to-pink-500' },
  { id: 'custom', name: 'Custom Event', icon: Calendar, color: 'from-slate-500 to-slate-700' }
];

const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern & Minimal', preview: '🎨' },
  { id: 'traditional', name: 'Traditional Indian', preview: '🪔' },
  { id: 'festive', name: 'Festive & Colorful', preview: '🎊' },
  { id: 'elegant', name: 'Elegant & Premium', preview: '✨' },
  { id: 'playful', name: 'Playful & Fun', preview: '🎈' }
];

function AIContentStudioTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('pamphlet');
  const [generateImage, setGenerateImage] = useState(true);

  const [pamphletForm, setPamphletForm] = useState({
    school_name: '',
    academic_year: '2025-26',
    classes: 'Nursery to 12th',
    features: 'Smart Classes, Sports, Computer Lab, Science Lab',
    contact: '',
    language: 'english'
  });

  const [topperForm, setTopperForm] = useState({
    school_name: '',
    student_name: '',
    class: '',
    marks: '',
    achievement: 'Class Topper',
    language: 'english'
  });

  const [eventForm, setEventForm] = useState({
    school_name: '',
    event_name: '',
    date: '',
    venue: 'School Auditorium',
    description: '',
    language: 'english'
  });

  const [activityForm, setActivityForm] = useState({
    school_name: '',
    activity: '',
    details: '',
    language: 'english'
  });

  const [contentWritingForm, setContentWritingForm] = useState({
    content_type: 'notice',
    title: '',
    target_audience: 'parents',
    tone: 'formal',
    length: 'medium',
    key_points: '',
    include_call_to_action: true,
    language: 'english'
  });

  const contentTypes = [
    { value: 'notice', label: 'School Notice' },
    { value: 'circular', label: 'Circular' },
    { value: 'letter', label: 'Parent Letter' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'report', label: 'Progress Report Summary' },
    { value: 'newsletter', label: 'Newsletter Content' },
    { value: 'invitation', label: 'Event Invitation' },
    { value: 'appreciation', label: 'Appreciation Letter' },
    { value: 'reminder', label: 'Fee/Event Reminder' },
    { value: 'speech', label: 'Speech/Address' }
  ];

  const audienceOptions = [
    { value: 'parents', label: 'Parents' },
    { value: 'students', label: 'Students' },
    { value: 'teachers', label: 'Teachers' },
    { value: 'all', label: 'All Stakeholders' },
    { value: 'community', label: 'Community/Public' }
  ];

  const toneOptions = [
    { value: 'formal', label: 'Formal & Professional' },
    { value: 'friendly', label: 'Warm & Friendly' },
    { value: 'urgent', label: 'Urgent & Important' },
    { value: 'celebratory', label: 'Celebratory & Positive' },
    { value: 'informative', label: 'Informative & Neutral' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (50-100 words)' },
    { value: 'medium', label: 'Medium (150-250 words)' },
    { value: 'long', label: 'Long (300-500 words)' },
    { value: 'detailed', label: 'Detailed (500+ words)' }
  ];

  const generateContent = async (contentType, formData) => {
    setLoading(true);
    try {
      const payload = {
        content_type: contentType,
        school_name: formData.school_name,
        details: { ...formData },
        language: formData.language,
        generate_image: generateImage
      };

      const res = await axios.post(`${API_CONTENT}/ai/generate-content`, payload);
      setGeneratedContent(res.data);
      setShowResultDialog(true);
      toast.success('Content generated successfully!');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to generate content';
      toast.error(typeof msg === 'string' ? msg : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent?.text_content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleDownloadImage = () => {
    if (!generatedContent?.image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedContent.image_base64}`;
    link.download = `schooltino-${generatedContent.content_type}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  if (!['director', 'principal', 'vice_principal'].includes(user?.role)) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">You don't have access to AI Content Studio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-content-studio">
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              AI Content Studio
            </h1>
            <p className="text-purple-100 mt-2">
              Generate professional pamphlets, banners & posters with AI 🎨
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Wand2 className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">AI Image Generation</p>
            <p className="text-sm text-slate-500">Generate actual poster/banner image using Gemini AI (FREE)</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={generateImage}
            onChange={(e) => setGenerateImage(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-slate-100">
          <TabsTrigger value="pamphlet" className="py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <FileImage className="w-4 h-4 mr-2" />
            Admission
          </TabsTrigger>
          <TabsTrigger value="topper" className="py-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Topper
          </TabsTrigger>
          <TabsTrigger value="event" className="py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Event
          </TabsTrigger>
          <TabsTrigger value="activity" className="py-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white">
            <Megaphone className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="writing" className="py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Wand2 className="w-4 h-4 mr-2" />
            AI Writer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pamphlet">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileImage className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Admission Pamphlet Generator</h3>
                <p className="text-sm text-slate-500">Create attractive admission pamphlets for new session</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); generateContent('admission_pamphlet', pamphletForm); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input value={pamphletForm.school_name} onChange={(e) => setPamphletForm(p => ({ ...p, school_name: e.target.value }))} placeholder="ABC Public School" required data-testid="pamphlet-school-name" />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input value={pamphletForm.academic_year} onChange={(e) => setPamphletForm(p => ({ ...p, academic_year: e.target.value }))} placeholder="2025-26" />
                </div>
                <div className="space-y-2">
                  <Label>Classes Offered</Label>
                  <Input value={pamphletForm.classes} onChange={(e) => setPamphletForm(p => ({ ...p, classes: e.target.value }))} placeholder="Nursery to 12th" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input value={pamphletForm.contact} onChange={(e) => setPamphletForm(p => ({ ...p, contact: e.target.value }))} placeholder="Phone/WhatsApp" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Key Features (comma separated)</Label>
                  <Textarea value={pamphletForm.features} onChange={(e) => setPamphletForm(p => ({ ...p, features: e.target.value }))} placeholder="Smart Classes, Sports, Labs, Transport..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select value={pamphletForm.language} onChange={(e) => setPamphletForm(p => ({ ...p, language: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish (Mixed)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="btn-primary" disabled={loading} data-testid="generate-pamphlet-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {generateImage ? 'Generate Pamphlet + Image' : 'Generate Pamphlet Text'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="topper">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Topper Congratulation Banner</h3>
                <p className="text-sm text-slate-500">Celebrate your school toppers with beautiful banners</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); generateContent('topper_banner', topperForm); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input value={topperForm.school_name} onChange={(e) => setTopperForm(p => ({ ...p, school_name: e.target.value }))} placeholder="ABC Public School" required />
                </div>
                <div className="space-y-2">
                  <Label>Student Name *</Label>
                  <Input value={topperForm.student_name} onChange={(e) => setTopperForm(p => ({ ...p, student_name: e.target.value }))} placeholder="Full name" required />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input value={topperForm.class} onChange={(e) => setTopperForm(p => ({ ...p, class: e.target.value }))} placeholder="Class 10" />
                </div>
                <div className="space-y-2">
                  <Label>Marks/Percentage</Label>
                  <Input value={topperForm.marks} onChange={(e) => setTopperForm(p => ({ ...p, marks: e.target.value }))} placeholder="98.5%" />
                </div>
                <div className="space-y-2">
                  <Label>Achievement</Label>
                  <select value={topperForm.achievement} onChange={(e) => setTopperForm(p => ({ ...p, achievement: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="Class Topper">Class Topper</option>
                    <option value="School Topper">School Topper</option>
                    <option value="Board Topper">Board Topper</option>
                    <option value="Subject Topper">Subject Topper</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select value={topperForm.language} onChange={(e) => setTopperForm(p => ({ ...p, language: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                {generateImage ? 'Generate Banner + Image' : 'Generate Banner Text'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="event">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Event Poster Generator</h3>
                <p className="text-sm text-slate-500">Create engaging posters for school events</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); generateContent('event_poster', eventForm); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input value={eventForm.school_name} onChange={(e) => setEventForm(p => ({ ...p, school_name: e.target.value }))} placeholder="ABC Public School" required />
                </div>
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input value={eventForm.event_name} onChange={(e) => setEventForm(p => ({ ...p, event_name: e.target.value }))} placeholder="Annual Day / Sports Day" required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={eventForm.date} onChange={(e) => setEventForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={eventForm.venue} onChange={(e) => setEventForm(p => ({ ...p, venue: e.target.value }))} placeholder="School Auditorium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Event Description</Label>
                  <Textarea value={eventForm.description} onChange={(e) => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the event..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select value={eventForm.language} onChange={(e) => setEventForm(p => ({ ...p, language: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                {generateImage ? 'Generate Poster + Image' : 'Generate Poster Text'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Activity Announcement Banner</h3>
                <p className="text-sm text-slate-500">Create banners for school activities and announcements</p>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); generateContent('activity_banner', activityForm); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input value={activityForm.school_name} onChange={(e) => setActivityForm(p => ({ ...p, school_name: e.target.value }))} placeholder="ABC Public School" required />
                </div>
                <div className="space-y-2">
                  <Label>Activity Name *</Label>
                  <Input value={activityForm.activity} onChange={(e) => setActivityForm(p => ({ ...p, activity: e.target.value }))} placeholder="Science Exhibition / Art Workshop" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Activity Details</Label>
                  <Textarea value={activityForm.details} onChange={(e) => setActivityForm(p => ({ ...p, details: e.target.value }))} placeholder="Describe the activity, timing, who can participate..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select value={activityForm.language} onChange={(e) => setActivityForm(p => ({ ...p, language: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
                {generateImage ? 'Generate Banner + Image' : 'Generate Banner Text'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="writing">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Content Writer</h3>
                <p className="text-sm text-slate-500">Generate professional notices, letters, circulars & more with advanced parameters</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              generateContent('content_writing', {
                ...contentWritingForm,
                school_name: pamphletForm.school_name || 'School'
              });
            }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {contentTypes.map(type => (
                  <button key={type.value} type="button" onClick={() => setContentWritingForm(p => ({ ...p, content_type: type.value }))} className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${contentWritingForm.content_type === type.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title / Subject *</Label>
                  <Input value={contentWritingForm.title} onChange={(e) => setContentWritingForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Annual Day Celebration Notice, Fee Reminder for December..." required data-testid="writing-title" />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <select value={contentWritingForm.target_audience} onChange={(e) => setContentWritingForm(p => ({ ...p, target_audience: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    {audienceOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tone of Writing</Label>
                  <select value={contentWritingForm.tone} onChange={(e) => setContentWritingForm(p => ({ ...p, tone: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    {toneOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <select value={contentWritingForm.length} onChange={(e) => setContentWritingForm(p => ({ ...p, length: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    {lengthOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select value={contentWritingForm.language} onChange={(e) => setContentWritingForm(p => ({ ...p, language: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 px-3">
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Key Points to Include</Label>
                  <Textarea value={contentWritingForm.key_points} onChange={(e) => setContentWritingForm(p => ({ ...p, key_points: e.target.value }))} placeholder={"Enter key points separated by comma or new line. AI will elaborate these points professionally.\n\nExample:\n- Event date: 25th December\n- Time: 10 AM\n- Dress code: Formal\n- Parents are invited"} rows={4} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="cta" checked={contentWritingForm.include_call_to_action} onChange={(e) => setContentWritingForm(p => ({ ...p, include_call_to_action: e.target.checked }))} className="w-4 h-4 rounded border-slate-300" />
                  <Label htmlFor="cta" className="cursor-pointer">Include Call-to-Action (e.g., "Please confirm attendance")</Label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate Professional Content
                </Button>
                <Button type="button" variant="outline" onClick={() => setContentWritingForm({ content_type: 'notice', title: '', target_audience: 'parents', tone: 'formal', length: 'medium', key_points: '', include_call_to_action: true, language: 'english' })}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-2">💡 Pro Tips for Better Results:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Be specific with the title - include event name, date, or purpose</li>
                <li>• Add key points for AI to elaborate professionally</li>
                <li>• Choose the right tone based on content type</li>
                <li>• Use "Urgent" tone for fee reminders or important deadlines</li>
                <li>• Use "Celebratory" tone for achievements and event invitations</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generated Content
            </DialogTitle>
          </DialogHeader>
          {generatedContent && (
            <div className="space-y-6 mt-4">
              {generatedContent.image_base64 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      Generated Image
                    </h4>
                    <Button onClick={handleDownloadImage} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="relative bg-slate-100 rounded-xl p-2 overflow-hidden">
                    <img src={`data:image/png;base64,${generatedContent.image_base64}`} alt="Generated content" className="w-full h-auto rounded-lg shadow-lg max-h-[400px] object-contain mx-auto" />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Text Content</h4>
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 text-sm leading-relaxed">
                    {generatedContent.text_content}
                  </pre>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button onClick={() => setShowResultDialog(false)} variant="outline" className="flex-1">
                  Close
                </Button>
                {generatedContent.image_base64 && (
                  <>
                    <Button onClick={handleDownloadImage} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={() => {
                      const text = encodeURIComponent(`${generatedContent.text_content?.substring(0, 200)}...\n\n🎓 Generated by Schooltino AI`);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                      toast.success('Opening WhatsApp...');
                    }} className="flex-1 bg-green-600 hover:bg-green-700">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp Share
                    </Button>
                  </>
                )}
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>💡 Tips:</strong>
                  {generatedContent.image_base64
                    ? ' Download the image and share on WhatsApp, Facebook, or print directly!'
                    : ' Copy the text and use it in Canva or any design tool.'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">💡 How to Use</h3>
        <ol className="text-sm text-slate-600 space-y-2">
          <li><span className="font-medium text-slate-900">1.</span> Select the type of content (Admission, Topper, Event, Activity)</li>
          <li><span className="font-medium text-slate-900">2.</span> Fill in your school details</li>
          <li><span className="font-medium text-slate-900">3.</span> Enable "AI Image Generation" toggle for visual output</li>
          <li><span className="font-medium text-slate-900">4.</span> Click Generate - AI will create text + image!</li>
          <li><span className="font-medium text-slate-900">5.</span> Download image directly or copy text for editing</li>
        </ol>
      </div>
    </div>
  );
}

function EventDesignerTab() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';
  const previewRef = useRef(null);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [designType, setDesignType] = useState('pamphlet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [showSavedTab, setShowSavedTab] = useState(false);

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

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!schoolId) return;
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [schoolRes, eventsRes] = await Promise.all([
          axios.get(`${API_EVENT}/api/schools/${schoolId}`, { headers }).catch(() => null),
          axios.get(`${API_EVENT}/api/events?school_id=${schoolId}`, { headers }).catch(() => null),
        ]);
        if (schoolRes?.data) {
          setSchool({
            name: schoolRes.data.name || 'School Name',
            logo: schoolRes.data.logo_url || null,
            address: schoolRes.data.address || 'School Address',
            phone: schoolRes.data.phone || ''
          });
        }
        if (eventsRes?.data?.length > 0) {
          setSavedEvents(eventsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch details:', error);
      }
    };
    fetchSchoolDetails();
  }, [schoolId]);

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
      const response = await axios.post(`${API_EVENT}/api/events/generate-design`, {
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
      generateLocalDesign();
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleSaveEvent = async () => {
    if (!eventDetails.eventName) {
      toast.error(isHindi ? 'Event name ज़रूरी है' : 'Event name is required');
      return;
    }
    const eventToSave = {
      id: Date.now(),
      ...eventDetails,
      template: selectedTemplate,
      style: selectedStyle,
      designType,
      school_id: schoolId,
      created_at: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_EVENT}/api/events`, eventToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.id) eventToSave.id = res.data.id;
    } catch {
      console.log('Saved event locally');
    }

    setSavedEvents(prev => [eventToSave, ...prev]);
    toast.success(isHindi ? 'Event design save हो गया!' : 'Event design saved!');
  };

  const handleLoadEvent = (event) => {
    setEventDetails({
      eventName: event.eventName || '',
      eventDate: event.eventDate || '',
      eventTime: event.eventTime || '',
      venue: event.venue || '',
      chiefGuest: event.chiefGuest || '',
      description: event.description || '',
      contactNumber: event.contactNumber || '',
      specialNote: event.specialNote || ''
    });
    if (event.template) setSelectedTemplate(event.template);
    if (event.style) setSelectedStyle(event.style);
    if (event.designType) setDesignType(event.designType);
    setShowSavedTab(false);
    toast.success(isHindi ? 'Event load हो गया' : 'Event loaded');
  };

  const handleDeleteSavedEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_EVENT}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      console.log('Deleted locally');
    }
    setSavedEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success(isHindi ? 'Event हटा दिया गया' : 'Event deleted');
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
      navigator.clipboard.writeText(`${school.name} - ${eventDetails.eventName}\nDate: ${eventDetails.eventDate}\nVenue: ${eventDetails.venue}`);
      toast.success(isHindi ? 'Details clipboard पर copy हो गई' : 'Details copied to clipboard');
    }
  };

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

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    toast.success(isHindi ? 'WhatsApp खुल रहा है...' : 'Opening WhatsApp...');
  };

  return (
    <div className="space-y-6" data-testid="event-designer-page">
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSavedTab(!showSavedTab)} className="gap-2">
            <Calendar className="w-4 h-4" />
            {isHindi ? 'सेव किए गए' : 'Saved'} ({savedEvents.length})
          </Button>
          <Button onClick={handleSaveEvent} className="bg-purple-600 hover:bg-purple-700 gap-2">
            <Download className="w-4 h-4" />
            {isHindi ? 'सेव करें' : 'Save Design'}
          </Button>
        </div>
      </div>

      {showSavedTab && savedEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{isHindi ? 'सेव किए गए Events' : 'Saved Event Designs'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedEvents.map(event => (
                <div key={event.id} className="p-3 border rounded-xl hover:border-purple-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{event.eventName}</p>
                      <p className="text-xs text-gray-500">{event.eventDate} | {event.designType}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {EVENT_TEMPLATES.find(t => t.id === event.template)?.name || 'Custom'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleLoadEvent(event)} className="h-7 w-7 p-0">
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSavedEvent(event.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Design प्रकार' : 'Design Type'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button onClick={() => setDesignType('pamphlet')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${designType === 'pamphlet' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
                  <Image className={`w-8 h-8 mx-auto mb-2 ${designType === 'pamphlet' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <p className="font-medium text-center">Pamphlet</p>
                  <p className="text-xs text-slate-500 text-center">{isHindi ? 'पोस्टर / फ्लायर' : 'Poster / Flyer'}</p>
                </button>
                <button onClick={() => setDesignType('invitation')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${designType === 'invitation' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
                  <Heart className={`w-8 h-8 mx-auto mb-2 ${designType === 'invitation' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <p className="font-medium text-center">Invitation Card</p>
                  <p className="text-xs text-slate-500 text-center">{isHindi ? 'निमंत्रण पत्र' : 'Invite Card'}</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Event का प्रकार' : 'Event Type'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EVENT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`p-3 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
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
                  <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${selectedStyle === style.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-purple-300'}`}>
                    <span>{style.preview}</span>
                    <span className="text-sm font-medium">{style.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isHindi ? 'Event Details' : 'Event Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'Event का नाम' : 'Event Name'} *</Label>
                  <Input name="eventName" value={eventDetails.eventName} onChange={handleInputChange} placeholder={isHindi ? 'जैसे: वार्षिक उत्सव 2026' : 'e.g., Annual Function 2026'} data-testid="event-name-input" />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'तारीख' : 'Date'} *</Label>
                  <Input name="eventDate" type="date" value={eventDetails.eventDate} onChange={handleInputChange} data-testid="event-date-input" />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'समय' : 'Time'}</Label>
                  <Input name="eventTime" type="time" value={eventDetails.eventTime} onChange={handleInputChange} data-testid="event-time-input" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'स्थान' : 'Venue'}</Label>
                  <Input name="venue" value={eventDetails.venue} onChange={handleInputChange} placeholder={isHindi ? 'जैसे: स्कूल प्रांगण' : 'e.g., School Auditorium'} data-testid="venue-input" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'मुख्य अतिथि' : 'Chief Guest'}</Label>
                  <Input name="chiefGuest" value={eventDetails.chiefGuest} onChange={handleInputChange} placeholder={isHindi ? 'जैसे: श्रीमान राज शर्मा, विधायक' : 'e.g., Hon. MLA Raj Sharma'} data-testid="chief-guest-input" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{isHindi ? 'विवरण / संदेश' : 'Description / Message'}</Label>
                  <textarea name="description" value={eventDetails.description} onChange={handleInputChange} className="w-full h-20 rounded-lg border border-slate-200 px-3 py-2" placeholder={isHindi ? 'Event के बारे में कुछ लिखें...' : 'Write something about the event...'} data-testid="description-input" />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'संपर्क नंबर' : 'Contact Number'}</Label>
                  <Input name="contactNumber" value={eventDetails.contactNumber} onChange={handleInputChange} placeholder="+91 98765 43210" data-testid="contact-input" />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'विशेष नोट' : 'Special Note'}</Label>
                  <Input name="specialNote" value={eventDetails.specialNote} onChange={handleInputChange} placeholder={isHindi ? 'जैसे: पधारना अनिवार्य है' : 'e.g., Your presence is mandatory'} data-testid="special-note-input" />
                </div>
              </div>

              <Button onClick={generateAIDesign} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="generate-design-btn">
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
                  <Button onClick={handleWhatsAppShare} className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid="whatsapp-share-btn">
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
    return (
      <div className={`aspect-[4/5] ${style.bg} rounded-xl overflow-hidden shadow-lg border-4 ${style.accent}`}>
        <div className={`${style.header} text-white p-4 text-center`}>
          <p className="text-xs opacity-80 tracking-widest uppercase">आप सादर आमंत्रित हैं</p>
          <h3 className="text-lg font-bold mt-1">{school.name}</h3>
        </div>
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
        <div className={`${style.header} text-white p-3 text-center text-sm mt-auto`}>
          {eventDetails.specialNote || 'आपका सहर्ष स्वागत है।'}
          {eventDetails.contactNumber && (
            <p className="text-xs opacity-80 mt-1">संपर्क: {eventDetails.contactNumber}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-[3/4] ${style.bg} rounded-xl overflow-hidden shadow-lg`}>
      <div className={`${style.header} text-white p-6 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full" />
        </div>
        <div className="relative">
          <p className="text-sm opacity-90 tracking-wide mb-1">{school.name}</p>
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide">
            {eventDetails.eventName || 'Event Name'}
          </h1>
        </div>
      </div>
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
      <div className={`px-6 pb-4 ${style.text} text-center text-sm opacity-70`}>
        {eventDetails.contactNumber && <p>📞 {eventDetails.contactNumber}</p>}
        <p className="mt-1">{school.address}</p>
      </div>
    </div>
  );
}

function AIPaperGeneratorTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [activeView, setActiveView] = useState('questions');

  const [paperForm, setPaperForm] = useState({
    board: '',
    class_name: '',
    subject: '',
    chapter: '',
    chapters: [],
    exam_name: 'Unit Test',
    difficulty: 'medium',
    question_types: ['mcq', 'short', 'long'],
    total_marks: 50,
    time_duration: 120,
    language: 'english',
    include_all_chapters: false
  });

  const boards = Object.keys(SYLLABUS_DATA).map(key => ({
    value: key,
    label: SYLLABUS_DATA[key].name
  }));

  const subjectHindiNames = {
    'English': 'English (अंग्रेजी)',
    'Hindi': 'Hindi (हिंदी)',
    'Mathematics': 'Mathematics (गणित)',
    'Science': 'Science (विज्ञान)',
    'Social Science': 'Social Science (सामाजिक विज्ञान)',
    'EVS': 'EVS (पर्यावरण अध्ययन)',
    'Sanskrit': 'Sanskrit (संस्कृत)',
    'Drawing': 'Drawing (चित्रकला)',
    'Physics': 'Physics (भौतिक विज्ञान)',
    'Chemistry': 'Chemistry (रसायन विज्ञान)',
    'Biology': 'Biology (जीव विज्ञान)',
    'Computer Science': 'Computer Science (कंप्यूटर विज्ञान)',
    'Geography': 'Geography (भूगोल)',
    'History': 'History (इतिहास)',
    'Political Science': 'Political Science (राजनीति विज्ञान)',
    'Economics': 'Economics (अर्थशास्त्र)',
    'GK': 'GK (सामान्य ज्ञान)',
    'Moral Science': 'Moral Science (नैतिक शिक्षा)',
    'Art & Craft': 'Art & Craft (कला एवं शिल्प)',
    'Physical Education': 'Physical Education (शारीरिक शिक्षा)',
  };

  const boardData = SYLLABUS_DATA[paperForm.board];
  const classes = boardData ? Object.keys(boardData.classes) : [];
  const classData = boardData?.classes[paperForm.class_name];
  const subjects = classData ? Object.keys(classData.subjects) : [];
  const chapters = classData?.subjects[paperForm.subject] || [];

  const getSubjectLabel = (subject) => {
    if (paperForm.language === 'hindi' || paperForm.language === 'bilingual') {
      return subjectHindiNames[subject] || subject;
    }
    return subject;
  };

  const handleBoardChange = (board) => {
    setPaperForm(prev => ({ ...prev, board, class_name: '', subject: '', chapter: '', chapters: [] }));
  };

  const handleClassChange = (class_name) => {
    setPaperForm(prev => ({ ...prev, class_name, subject: '', chapter: '', chapters: [] }));
  };

  const handleSubjectChange = (subject) => {
    setPaperForm(prev => ({ ...prev, subject, chapter: '', chapters: [] }));
  };

  const toggleChapter = (ch) => {
    setPaperForm(prev => {
      const exists = prev.chapters.includes(ch);
      const newChapters = exists ? prev.chapters.filter(c => c !== ch) : [...prev.chapters, ch];
      return { ...prev, chapters: newChapters, chapter: newChapters.join(', ') };
    });
  };

  const selectAllChapters = () => {
    setPaperForm(prev => ({
      ...prev,
      chapters: [...chapters],
      chapter: chapters.join(', '),
      include_all_chapters: true
    }));
  };

  const clearChapters = () => {
    setPaperForm(prev => ({ ...prev, chapters: [], chapter: '', include_all_chapters: false }));
  };

  const toggleQuestionType = (type) => {
    setPaperForm(prev => {
      const exists = prev.question_types.includes(type);
      if (exists && prev.question_types.length === 1) return prev;
      const newTypes = exists ? prev.question_types.filter(t => t !== type) : [...prev.question_types, type];
      return { ...prev, question_types: newTypes };
    });
  };

  const handleGenerate = async () => {
    if (!paperForm.board || !paperForm.class_name || !paperForm.subject || !paperForm.chapter) {
      toast.error('Please select Board, Class, Subject, and at least one Chapter');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_CONTENT}/ai/generate-paper`, paperForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedPaper(response.data);
      setShowPaperDialog(true);
      toast.success('Paper generated successfully!');
    } catch (error) {
      console.error('Paper generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate paper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('paper-print-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Question Paper - ${paperForm.subject} ${paperForm.class_name}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 18px; margin: 5px 0; }
        .header p { font-size: 14px; margin: 2px 0; }
        .section { margin: 15px 0; }
        .section h3 { font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .question { margin: 10px 0; padding-left: 25px; text-indent: -25px; }
        .question-marks { float: right; font-weight: bold; }
        .options { padding-left: 40px; }
        .option { margin: 3px 0; }
        @media print { body { margin: 15mm; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const questionTypeOptions = [
    { value: 'mcq', label: 'MCQ (1 mark)' },
    { value: 'fill_blank', label: 'Fill in Blanks (1 mark)' },
    { value: 'short', label: 'Short Answer (2-3 marks)' },
    { value: 'long', label: 'Long Answer (4-5 marks)' },
    { value: 'diagram', label: 'Diagram Based (3 marks)' },
    { value: 'hots', label: 'HOTS (4 marks)' }
  ];

  const examTypes = ['Unit Test', 'Half Yearly', 'Annual Exam', 'Weekly Test', 'Monthly Test', 'Pre-Board', 'Practice Paper'];
  const difficultyLevels = ['easy', 'medium', 'hard', 'mixed'];
  const marksOptions = [20, 25, 30, 40, 50, 60, 70, 75, 80, 100];
  const durationOptions = [30, 45, 60, 90, 120, 150, 180];

  const renderPaperContent = () => {
    if (!generatedPaper) return null;
    const paper = generatedPaper;
    const questions = paper.questions || [];
    const questionPaper = paper.question_paper;
    const answerPaper = paper.answer_paper;

    if (activeView === 'questions') {
      if (questionPaper && questionPaper.sections) {
        return (
          <div id="paper-print-content">
            <div className="header text-center mb-6 border-b-2 border-black pb-3">
              <h1 className="text-xl font-bold">{questionPaper.header?.school_name || '__________ School'}</h1>
              <p className="text-sm">{questionPaper.header?.exam_name} ({questionPaper.header?.academic_year})</p>
              <div className="flex justify-between text-sm mt-2">
                <span>Class: {questionPaper.header?.class}</span>
                <span>Subject: {questionPaper.header?.subject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time: {questionPaper.header?.time}</span>
                <span>Max Marks: {questionPaper.header?.max_marks}</span>
              </div>
            </div>
            {questionPaper.general_instructions && (
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                <strong>General Instructions:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {questionPaper.general_instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                </ul>
              </div>
            )}
            {questionPaper.sections.map((section, si) => (
              <div key={si} className="mb-6">
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-3">{section.section_name} ({section.total_marks} marks)</h3>
                {section.questions.map((q, qi) => (
                  <div key={qi} className="mb-3 pl-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Q{q.q_no || qi + 1}. {q.question}</span>
                      <span className="text-sm font-bold text-gray-600 ml-2 whitespace-nowrap">[{q.marks} marks]</span>
                    </div>
                    {q.options && (
                      <div className="pl-6 mt-1 grid grid-cols-2 gap-1">
                        {q.options.map((opt, oi) => <span key={oi} className="text-sm">{opt}</span>)}
                      </div>
                    )}
                    {q.internal_choice && q.choice_question && (
                      <p className="text-sm text-gray-500 pl-6 mt-1 italic">OR: {q.choice_question}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div id="paper-print-content">
          <div className="header text-center mb-6 border-b-2 border-black pb-3">
            <h1 className="text-xl font-bold">__________ School</h1>
            <p className="text-sm">{paper.exam_name || 'Examination'} (2025-2026)</p>
            <div className="flex justify-between text-sm mt-2">
              <span>Class: {paper.class_name}</span>
              <span>Subject: {paper.subject}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Time: {paper.time_duration} min</span>
              <span>Max Marks: {paper.total_marks}</span>
            </div>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="mb-3 pl-2">
              <div className="flex justify-between">
                <span className="font-medium">Q{q.q_no || i + 1}. {q.question}</span>
                <span className="text-sm font-bold text-gray-600 ml-2 whitespace-nowrap">[{q.marks} marks]</span>
              </div>
              {q.options && (
                <div className="pl-6 mt-1 grid grid-cols-2 gap-1">
                  {q.options.map((opt, oi) => <span key={oi} className="text-sm">{opt}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (activeView === 'answers') {
      if (answerPaper && answerPaper.answers) {
        return (
          <div>
            <h2 className="text-lg font-bold text-center mb-4 border-b-2 pb-2">ANSWER KEY / MARKING SCHEME</h2>
            {answerPaper.answers.map((a, i) => (
              <div key={i} className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-green-800">Q{a.q_no || i + 1}. [{a.marks} marks]</span>
                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded">{a.type}</span>
                </div>
                {a.correct_answer && <p className="mt-1 text-green-700 font-medium">Answer: {a.correct_answer}</p>}
                {a.model_answer && <p className="mt-1 text-green-700">{a.model_answer}</p>}
                {a.explanation && <p className="mt-1 text-sm text-gray-600 italic">{a.explanation}</p>}
                {a.marking_points && (
                  <ul className="mt-1 text-sm list-disc pl-5 text-gray-700">
                    {a.marking_points.map((p, pi) => <li key={pi}>{p}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div>
          <h2 className="text-lg font-bold text-center mb-4">ANSWER KEY</h2>
          {questions.map((q, i) => (
            <div key={i} className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="font-bold text-green-800">Q{q.q_no || i + 1}.</span>
              <p className="mt-1 text-green-700">{q.answer || q.correct_answer || 'Answer not available'}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            AI Paper Generator (Sarvam AI)
          </CardTitle>
          <p className="text-sm text-gray-500">Generate board-wise exam papers with latest 2025-26 syllabus. Supports MP Board, RBSE, and CBSE.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Board</Label>
              <select
                value={paperForm.board}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="">Select Board</option>
                {boards.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Class</Label>
              <select
                value={paperForm.class_name}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                disabled={!paperForm.board}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Subject</Label>
              <select
                value={paperForm.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                disabled={!paperForm.class_name}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s} value={s}>{getSubjectLabel(s)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Exam Type</Label>
              <select
                value={paperForm.exam_name}
                onChange={(e) => setPaperForm(prev => ({ ...prev, exam_name: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                {examTypes.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {paperForm.subject && chapters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">
                Chapters {paperForm.language !== 'english' ? '(अध्याय)' : ''} ({paperForm.chapters.length}/{chapters.length} selected)
              </Label>
                <div className="flex gap-2">
                  <button onClick={selectAllChapters} className="text-xs text-blue-600 hover:underline">Select All</button>
                  <button onClick={clearChapters} className="text-xs text-red-500 hover:underline">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => toggleChapter(ch)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      paperForm.chapters.includes(ch)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 font-medium'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className="mr-1 text-xs text-gray-400">{i + 1}.</span> {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Total Marks</Label>
              <select
                value={paperForm.total_marks}
                onChange={(e) => setPaperForm(prev => ({ ...prev, total_marks: parseInt(e.target.value) }))}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                {marksOptions.map(m => <option key={m} value={m}>{m} Marks</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Time Duration</Label>
              <select
                value={paperForm.time_duration}
                onChange={(e) => setPaperForm(prev => ({ ...prev, time_duration: parseInt(e.target.value) }))}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                {durationOptions.map(d => <option key={d} value={d}>{d} minutes ({d/60} hrs)</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Difficulty</Label>
              <select
                value={paperForm.difficulty}
                onChange={(e) => setPaperForm(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                {difficultyLevels.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Question Types</Label>
              <div className="flex flex-wrap gap-2">
                {questionTypeOptions.map(qt => (
                  <button
                    key={qt.value}
                    onClick={() => toggleQuestionType(qt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      paperForm.question_types.includes(qt.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Paper Language (भाषा माध्यम)</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'english', label: 'English Medium', icon: '🇬🇧' },
                  { value: 'hindi', label: 'Hindi Medium (हिंदी)', icon: '🇮🇳' },
                  { value: 'bilingual', label: 'Bilingual (द्विभाषी)', icon: '🔄' }
                ].map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => setPaperForm(prev => ({ ...prev, language: lang.value }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      paperForm.language === lang.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {paperForm.language === 'hindi' ? 'पेपर पूरी तरह हिंदी में जनरेट होगा। अध्याय चुनें - प्रश्न हिंदी में बनेंगे।' : 
                 paperForm.language === 'bilingual' ? 'Questions English + Hindi दोनों में होंगे। Select chapters - questions will be bilingual.' : 
                 'Paper will be generated fully in English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !paperForm.board || !paperForm.class_name || !paperForm.subject || !paperForm.chapter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Paper...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Paper
                </>
              )}
            </Button>
            {paperForm.board && paperForm.class_name && paperForm.subject && (
              <span className="text-sm text-gray-500">
                {SYLLABUS_DATA[paperForm.board]?.name} | {paperForm.class_name} | {paperForm.subject} | {paperForm.chapters.length} chapters
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPaperDialog} onOpenChange={setShowPaperDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Generated Paper - {generatedPaper?.subject} ({generatedPaper?.class_name})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('questions')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeView === 'questions' ? 'bg-white shadow text-blue-700 font-medium' : 'text-gray-600'
                  }`}
                >
                  Question Paper
                </button>
                <button
                  onClick={() => setActiveView('answers')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeView === 'answers' ? 'bg-white shadow text-green-700 font-medium' : 'text-gray-600'
                  }`}
                >
                  Answer Key
                </button>
              </div>
              <div className="ml-auto flex gap-2">
                <Button onClick={handlePrint} variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
                <Button
                  onClick={() => {
                    const el = document.getElementById('paper-print-content');
                    if (el) {
                      navigator.clipboard.writeText(el.innerText);
                      toast.success('Copied to clipboard!');
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              </div>
            </div>
            {generatedPaper && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="bg-blue-50 px-2 py-1 rounded">Board: {paperForm.board}</span>
                <span className="bg-green-50 px-2 py-1 rounded">Marks: {generatedPaper.total_marks} ({generatedPaper.marks_verified ? 'Verified' : `Actual: ${generatedPaper.actual_marks}`})</span>
                <span className="bg-purple-50 px-2 py-1 rounded">Questions: {generatedPaper.questions?.length || 0}</span>
              </div>
            )}
            <div className="border rounded-lg p-4 bg-white text-sm" style={{ fontFamily: "'Times New Roman', serif" }}>
              {renderPaperContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const AIToolsPage = () => {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState('paper-generator');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('ai_tools')}</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered tools for paper generation, content creation and event design</p>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="paper-generator" className="py-3 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-1.5" />
            {t('paper_generator')}
          </TabsTrigger>
          <TabsTrigger value="event-designer" className="py-3 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">
            <Palette className="w-4 h-4 mr-1.5" />
            {t('event_designer')}
          </TabsTrigger>
          <TabsTrigger value="content-studio" className="py-3 text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-1.5" />
            AI Content Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paper-generator">
          <AIPaperGeneratorTab />
        </TabsContent>

        <TabsContent value="event-designer">
          <EventDesignerTab />
        </TabsContent>

        <TabsContent value="content-studio">
          <AIContentStudioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIToolsPage;
