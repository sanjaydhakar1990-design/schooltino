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
  Loader2, Download, Copy, Check, Wand2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIContentStudio() {
  const { t } = useTranslation();
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('pamphlet');

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

  const generateContent = async (contentType, formData) => {
    setLoading(true);
    try {
      const payload = {
        content_type: contentType,
        school_name: formData.school_name,
        details: { ...formData },
        language: formData.language
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              AI Content Studio
            </h1>
            <p className="text-purple-100 mt-2">
              Generate professional pamphlets, banners, and posters for your school
            </p>
          </div>
          <div className="hidden md:block">
            <Wand2 className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      {/* Content Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="pamphlet" className="py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <FileImage className="w-4 h-4 mr-2" />
            Admission Pamphlet
          </TabsTrigger>
          <TabsTrigger value="topper" className="py-3 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Topper Banner
          </TabsTrigger>
          <TabsTrigger value="event" className="py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Event Poster
          </TabsTrigger>
          <TabsTrigger value="activity" className="py-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white">
            <Megaphone className="w-4 h-4 mr-2" />
            Activity Banner
          </TabsTrigger>
        </TabsList>

        {/* Admission Pamphlet Form */}
        <TabsContent value="pamphlet">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
              <Button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Pamphlet Content
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Topper Banner Form */}
        <TabsContent value="topper">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                Generate Topper Banner
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Event Poster Form */}
        <TabsContent value="event">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                Generate Event Poster
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Activity Banner Form */}
        <TabsContent value="activity">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                Generate Activity Banner
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generated Content
            </DialogTitle>
          </DialogHeader>
          {generatedContent && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 text-sm leading-relaxed">
                    {generatedContent.text_content}
                  </pre>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Content'}
                </Button>
                <Button onClick={() => setShowResultDialog(false)} className="btn-primary flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Use This Content
                </Button>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> Copy this content and use it in Canva, Photoshop, or any design tool to create visual pamphlets and banners.
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
          <li>1. Select the type of content you want to generate</li>
          <li>2. Fill in the required details about your school</li>
          <li>3. Click Generate - AI will create professional content</li>
          <li>4. Copy the content and use it in your design tools (Canva, Photoshop)</li>
          <li>5. Print or share digitally on WhatsApp, Social Media</li>
        </ol>
      </div>
    </div>
  );
}
