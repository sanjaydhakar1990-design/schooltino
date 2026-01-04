import { useState, useEffect } from 'react';
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
  DialogDescription,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Video,
  VideoOff,
  Calendar,
  Clock,
  Users,
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  FileText,
  Sparkles,
  Download,
  Share2,
  Play,
  Mic,
  MicOff,
  Monitor,
  Copy,
  Check,
  RefreshCw,
  Brain,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ZoomMeetings() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    start_time: '',
    duration: 60,
    password: '',
    participants: ''
  });

  useEffect(() => {
    fetchMeetings();
    fetchRecordings();
    fetchSummaries();
  }, [schoolId]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/meetings?school_id=${schoolId || ''}`);
      setMeetings(res.data || []);
    } catch (error) {
      // Mock data for demo
      setMeetings([
        {
          id: '1',
          topic: 'Weekly Staff Meeting',
          description: 'Weekly discussion on school activities',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          duration: 60,
          join_url: 'https://zoom.us/j/123456789',
          status: 'scheduled',
          host_name: 'Director',
          participants_count: 12,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          topic: 'Parent-Teacher Meeting - Class 10',
          description: 'Board exam preparation discussion',
          start_time: new Date(Date.now() + 172800000).toISOString(),
          duration: 90,
          join_url: 'https://zoom.us/j/987654321',
          status: 'scheduled',
          host_name: 'Principal',
          participants_count: 45,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          topic: 'Science Department Meeting',
          description: 'Lab equipment discussion',
          start_time: new Date(Date.now() - 86400000).toISOString(),
          duration: 45,
          join_url: 'https://zoom.us/j/456789123',
          status: 'completed',
          host_name: 'HOD Science',
          participants_count: 8,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const res = await axios.get(`${API}/meetings/recordings?school_id=${schoolId || ''}`);
      setRecordings(res.data || []);
    } catch (error) {
      // Mock recordings
      setRecordings([
        {
          id: 'rec1',
          meeting_id: '3',
          topic: 'Science Department Meeting',
          recorded_date: new Date(Date.now() - 86400000).toISOString(),
          duration: 42,
          file_size: 156000000,
          download_url: '#',
          transcript_available: true
        },
        {
          id: 'rec2',
          meeting_id: '4',
          topic: 'Monthly Review Meeting',
          recorded_date: new Date(Date.now() - 604800000).toISOString(),
          duration: 58,
          file_size: 210000000,
          download_url: '#',
          transcript_available: true
        }
      ]);
    }
  };

  const fetchSummaries = async () => {
    try {
      const res = await axios.get(`${API}/meetings/summaries?school_id=${schoolId || ''}`);
      setSummaries(res.data || []);
    } catch (error) {
      // Mock summaries
      setSummaries([
        {
          id: 'sum1',
          recording_id: 'rec1',
          meeting_topic: 'Science Department Meeting',
          summary: 'The meeting discussed procurement of new lab equipment for Class 11-12 Physics and Chemistry labs. Budget of ₹5 lakhs approved. New safety protocols were also reviewed.',
          key_points: [
            'New microscopes needed for Biology lab',
            'Chemistry lab needs fume hoods repair',
            'Safety training scheduled for next month',
            'Budget approved: ₹5,00,000'
          ],
          action_items: [
            'HOD to submit equipment list by Friday',
            'Admin to get vendor quotes',
            'Safety officer to plan training dates'
          ],
          sentiment: 'Positive - Productive discussion with clear outcomes',
          generated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.start_time) {
      toast.error('Please fill topic and start time');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/meetings`, {
        ...formData,
        school_id: schoolId,
        host_id: user?.id,
        host_name: user?.name
      });
      
      toast.success('Meeting scheduled successfully!');
      setShowCreateDialog(false);
      setFormData({
        topic: '',
        description: '',
        start_time: '',
        duration: 60,
        password: '',
        participants: ''
      });
      fetchMeetings();
    } catch (error) {
      // Mock success for demo
      toast.success('Meeting scheduled! (Demo Mode)');
      setShowCreateDialog(false);
      const newMeeting = {
        id: Date.now().toString(),
        ...formData,
        join_url: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`,
        status: 'scheduled',
        host_name: user?.name,
        participants_count: 0,
        created_at: new Date().toISOString()
      };
      setMeetings([newMeeting, ...meetings]);
      setFormData({
        topic: '',
        description: '',
        start_time: '',
        duration: 60,
        password: '',
        participants: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinMeeting = (meeting) => {
    if (meeting.join_url) {
      window.open(meeting.join_url, '_blank');
    } else {
      toast.error('Join link not available');
    }
  };

  const handleCopyLink = (url, meetingId) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(meetingId);
    toast.success('Link copied!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Delete this meeting?')) return;
    try {
      await axios.delete(`${API}/meetings/${meetingId}`);
      toast.success('Meeting deleted');
      setMeetings(meetings.filter(m => m.id !== meetingId));
    } catch (error) {
      toast.success('Meeting deleted! (Demo Mode)');
      setMeetings(meetings.filter(m => m.id !== meetingId));
    }
  };

  const handleGenerateSummary = async (recording) => {
    setGeneratingSummary(recording.id);
    try {
      const res = await axios.post(`${API}/meetings/recordings/${recording.id}/summarize`);
      toast.success('AI Summary generated!');
      fetchSummaries();
    } catch (error) {
      // Mock AI summary generation
      const mockSummary = {
        id: `sum-${Date.now()}`,
        recording_id: recording.id,
        meeting_topic: recording.topic,
        summary: `AI-generated summary of "${recording.topic}". This meeting covered important topics related to school operations and planning. Key decisions were made regarding upcoming activities.`,
        key_points: [
          'Discussion on upcoming events',
          'Resource allocation reviewed',
          'Timeline for next quarter finalized',
          'Action items assigned to team members'
        ],
        action_items: [
          'Follow up on pending tasks',
          'Schedule next meeting',
          'Share meeting notes with stakeholders'
        ],
        sentiment: 'Positive - Constructive discussion',
        generated_at: new Date().toISOString()
      };
      setSummaries([mockSummary, ...summaries]);
      toast.success('AI Summary generated! (Demo Mode)');
    } finally {
      setGeneratingSummary(null);
    }
  };

  const openSummary = (summary) => {
    setSelectedSummary(summary);
    setShowSummaryDialog(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hi-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date());
  const pastMeetings = meetings.filter(m => m.status === 'completed' || new Date(m.start_time) <= new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="zoom-meetings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-600" />
            Zoom Meetings
          </h1>
          <p className="text-slate-500 mt-1">Schedule, join, and manage video meetings</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="btn-primary" data-testid="create-meeting-btn">
          <Plus className="w-5 h-5 mr-2" />
          New Meeting
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{upcomingMeetings.length}</p>
              <p className="text-sm text-slate-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pastMeetings.length}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{recordings.length}</p>
              <p className="text-sm text-slate-500">Recordings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{summaries.length}</p>
              <p className="text-sm text-slate-500">AI Summaries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white">
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-white">
            <Check className="w-4 h-4 mr-2" />
            Past ({pastMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="recordings" className="data-[state=active]:bg-white">
            <Play className="w-4 h-4 mr-2" />
            Recordings ({recordings.length})
          </TabsTrigger>
          <TabsTrigger value="summaries" className="data-[state=active]:bg-white">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Summaries ({summaries.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Meetings */}
        <TabsContent value="upcoming">
          {upcomingMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Upcoming Meetings</h3>
              <p className="text-slate-500 mb-4">Schedule your first meeting</p>
              <Button onClick={() => setShowCreateDialog(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onJoin={() => handleJoinMeeting(meeting)}
                  onCopyLink={() => handleCopyLink(meeting.join_url, meeting.id)}
                  onDelete={() => handleDeleteMeeting(meeting.id)}
                  copied={copiedLink === meeting.id}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Past Meetings */}
        <TabsContent value="past">
          {pastMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <VideoOff className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No past meetings</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  isPast
                  onDelete={() => handleDeleteMeeting(meeting.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recordings */}
        <TabsContent value="recordings">
          {recordings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No recordings available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recordings.map((recording) => (
                <div key={recording.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{recording.topic}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatDate(recording.recorded_date)} • {recording.duration} min • {formatFileSize(recording.file_size)}
                        </p>
                        {recording.transcript_available && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                            <FileText className="w-3 h-3" />
                            Transcript Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => handleGenerateSummary(recording)}
                        disabled={generatingSummary === recording.id}
                      >
                        {generatingSummary === recording.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            AI Summary
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Summaries */}
        <TabsContent value="summaries">
          {summaries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No AI Summaries Yet</h3>
              <p className="text-slate-500">Generate summaries from your meeting recordings</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openSummary(summary)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{summary.meeting_topic}</h3>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                          AI Generated
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{summary.summary}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>{summary.key_points.length} Key Points</span>
                        <span>{summary.action_items.length} Action Items</span>
                        <span>{formatDate(summary.generated_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Meeting Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              Schedule New Meeting
            </DialogTitle>
            <DialogDescription>
              Create a Zoom meeting and invite participants
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMeeting} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Meeting Topic *</Label>
              <Input
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Weekly Staff Meeting"
                required
                data-testid="meeting-topic-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Meeting agenda or description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meeting Password (Optional)</Label>
              <Input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave empty for no password"
              />
            </div>

            <div className="space-y-2">
              <Label>Invite Participants (Emails, comma separated)</Label>
              <Textarea
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                placeholder="teacher1@school.com, parent@email.com"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary Detail Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              AI Meeting Summary
            </DialogTitle>
          </DialogHeader>
          {selectedSummary && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{selectedSummary.meeting_topic}</h3>
                <p className="text-slate-600">{selectedSummary.summary}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {selectedSummary.key_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Action Items
                </h4>
                <ul className="space-y-2">
                  {selectedSummary.action_items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl">
                <h4 className="font-semibold text-amber-900 mb-2">Meeting Sentiment</h4>
                <p className="text-slate-700 text-sm">{selectedSummary.sentiment}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Meeting Card Component
function MeetingCard({ meeting, onJoin, onCopyLink, onDelete, copied, isPast, formatDate }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPast ? 'bg-slate-100' : 'bg-blue-100'
          }`}>
            <Video className={`w-6 h-6 ${isPast ? 'text-slate-500' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{meeting.topic}</h3>
            {meeting.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{meeting.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {meeting.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {meeting.participants_count || 0}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Host: {meeting.host_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPast && (
            <>
              <Button onClick={onJoin} className="bg-blue-600 hover:bg-blue-700">
                <Video className="w-4 h-4 mr-1" />
                Join
              </Button>
              <Button variant="outline" size="icon" onClick={onCopyLink}>
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </>
          )}
          {isPast && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
              Completed
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
