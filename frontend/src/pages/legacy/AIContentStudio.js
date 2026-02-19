import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Sparkles, FileImage, Trophy, Calendar, Megaphone,
  Loader2, Download, Copy, Check, Wand2, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function AIContentStudio() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('pamphlet');
  const [generateImage, setGenerateImage] = useState(true);

  // Form states for different content types
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

  // Advanced content writing form
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

      const res = await axios.post(`${API}/ai/generate-content`, payload);
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
      {/* Header */}
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

      {/* Image Generation Toggle */}
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

      {/* Content Types */}
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

        {/* Admission Pamphlet Form */}
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
                  <Input
                    value={pamphletForm.school_name}
                    onChange={(e) => setPamphletForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="ABC Public School"
                    required
                    data-testid="pamphlet-school-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input
                    value={pamphletForm.academic_year}
                    onChange={(e) => setPamphletForm(p => ({ ...p, academic_year: e.target.value }))}
                    placeholder="2025-26"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classes Offered</Label>
                  <Input
                    value={pamphletForm.classes}
                    onChange={(e) => setPamphletForm(p => ({ ...p, classes: e.target.value }))}
                    placeholder="Nursery to 12th"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={pamphletForm.contact}
                    onChange={(e) => setPamphletForm(p => ({ ...p, contact: e.target.value }))}
                    placeholder="Phone/WhatsApp"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Key Features (comma separated)</Label>
                  <Textarea
                    value={pamphletForm.features}
                    onChange={(e) => setPamphletForm(p => ({ ...p, features: e.target.value }))}
                    placeholder="Smart Classes, Sports, Labs, Transport..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={pamphletForm.language}
                    onChange={(e) => setPamphletForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
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

        {/* Topper Banner Form */}
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
                  <Input
                    value={topperForm.school_name}
                    onChange={(e) => setTopperForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="ABC Public School"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Student Name *</Label>
                  <Input
                    value={topperForm.student_name}
                    onChange={(e) => setTopperForm(p => ({ ...p, student_name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input
                    value={topperForm.class}
                    onChange={(e) => setTopperForm(p => ({ ...p, class: e.target.value }))}
                    placeholder="Class 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marks/Percentage</Label>
                  <Input
                    value={topperForm.marks}
                    onChange={(e) => setTopperForm(p => ({ ...p, marks: e.target.value }))}
                    placeholder="98.5%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Achievement</Label>
                  <select
                    value={topperForm.achievement}
                    onChange={(e) => setTopperForm(p => ({ ...p, achievement: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
                    <option value="Class Topper">Class Topper</option>
                    <option value="School Topper">School Topper</option>
                    <option value="Board Topper">Board Topper</option>
                    <option value="Subject Topper">Subject Topper</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={topperForm.language}
                    onChange={(e) => setTopperForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
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

        {/* Event Poster Form */}
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
                  <Input
                    value={eventForm.school_name}
                    onChange={(e) => setEventForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="ABC Public School"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input
                    value={eventForm.event_name}
                    onChange={(e) => setEventForm(p => ({ ...p, event_name: e.target.value }))}
                    placeholder="Annual Day / Sports Day"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    value={eventForm.venue}
                    onChange={(e) => setEventForm(p => ({ ...p, venue: e.target.value }))}
                    placeholder="School Auditorium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Event Description</Label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of the event..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={eventForm.language}
                    onChange={(e) => setEventForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
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

        {/* Activity Banner Form */}
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
                  <Input
                    value={activityForm.school_name}
                    onChange={(e) => setActivityForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="ABC Public School"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activity Name *</Label>
                  <Input
                    value={activityForm.activity}
                    onChange={(e) => setActivityForm(p => ({ ...p, activity: e.target.value }))}
                    placeholder="Science Exhibition / Art Workshop"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Activity Details</Label>
                  <Textarea
                    value={activityForm.details}
                    onChange={(e) => setActivityForm(p => ({ ...p, details: e.target.value }))}
                    placeholder="Describe the activity, timing, who can participate..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={activityForm.language}
                    onChange={(e) => setActivityForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
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

        {/* AI Writer - Advanced Content Writing */}
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
              {/* Content Type Selection */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {contentTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setContentWritingForm(p => ({ ...p, content_type: type.value }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      contentWritingForm.content_type === type.value 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title/Subject */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Title / Subject *</Label>
                  <Input
                    value={contentWritingForm.title}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Annual Day Celebration Notice, Fee Reminder for December..."
                    required
                    data-testid="writing-title"
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <select
                    value={contentWritingForm.target_audience}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, target_audience: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
                    {audienceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label>Tone of Writing</Label>
                  <select
                    value={contentWritingForm.tone}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, tone: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
                    {toneOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <select
                    value={contentWritingForm.length}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, length: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
                    {lengthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={contentWritingForm.language}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>

                {/* Key Points */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Key Points to Include</Label>
                  <Textarea
                    value={contentWritingForm.key_points}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, key_points: e.target.value }))}
                    placeholder="Enter key points separated by comma or new line. AI will elaborate these points professionally.&#10;&#10;Example:&#10;- Event date: 25th December&#10;- Time: 10 AM&#10;- Dress code: Formal&#10;- Parents are invited"
                    rows={4}
                  />
                </div>

                {/* Include Call to Action */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="cta"
                    checked={contentWritingForm.include_call_to_action}
                    onChange={(e) => setContentWritingForm(p => ({ ...p, include_call_to_action: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="cta" className="cursor-pointer">Include Call-to-Action (e.g., "Please confirm attendance")</Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate Professional Content
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setContentWritingForm({
                    content_type: 'notice',
                    title: '',
                    target_audience: 'parents',
                    tone: 'formal',
                    length: 'medium',
                    key_points: '',
                    include_call_to_action: true,
                    language: 'english'
                  })}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Tips Section */}
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

      {/* Result Dialog */}
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
              {/* Generated Image */}
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
                    <img 
                      src={`data:image/png;base64,${generatedContent.image_base64}`}
                      alt="Generated content"
                      className="w-full h-auto rounded-lg shadow-lg max-h-[400px] object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
              
              {/* Text Content */}
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
              
              {/* Action Buttons */}
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
                    <Button 
                      onClick={() => {
                        // Create a temporary link for WhatsApp
                        const text = encodeURIComponent(`${generatedContent.text_content?.substring(0, 200)}...\n\n🎓 Generated by Schooltino AI`);
                        window.open(`https://wa.me/?text=${text}`, '_blank');
                        toast.success('Opening WhatsApp...');
                      }} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4 mr-2" />
                      WhatsApp Share
                    </Button>
                  </>
                )}
              </div>
              
              {/* Tips */}
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

      {/* Info Section */}
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
