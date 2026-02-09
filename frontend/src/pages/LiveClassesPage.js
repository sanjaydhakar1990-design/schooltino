import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';
import {
  Video, Calendar, Users, Clock, Play, Download, Share2,
  Plus, Loader2, CheckCircle, XCircle, Monitor, Link2,
  Radio, Eye, Pause, FileDown, UserCheck, UserX, BarChart3,
  ExternalLink, Trash2, Search
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [classForm, setClassForm] = useState({
    title: '',
    subject: '',
    class_name: '',
    teacher: '',
    date: '',
    time: '',
    duration: '60',
    platform: 'Zoom',
    meeting_link: ''
  });

  const [scheduledClasses, setScheduledClasses] = useState([
    { id: 1, title: 'Mathematics - Trigonometry', subject: 'Mathematics', class_name: 'Class 10-A', teacher: 'Mr. Sharma', date: '2026-02-10', time: '10:00', duration: 60, platform: 'Zoom', meeting_link: 'https://zoom.us/j/123456', status: 'upcoming' },
    { id: 2, title: 'Physics - Laws of Motion', subject: 'Physics', class_name: 'Class 11-B', teacher: 'Mrs. Gupta', date: '2026-02-10', time: '11:30', duration: 45, platform: 'Google Meet', meeting_link: 'https://meet.google.com/abc-def', status: 'upcoming' },
    { id: 3, title: 'English - Essay Writing', subject: 'English', class_name: 'Class 9-A', teacher: 'Ms. Patel', date: '2026-02-11', time: '09:00', duration: 40, platform: 'Built-in', meeting_link: '', status: 'upcoming' },
    { id: 4, title: 'Chemistry - Periodic Table', subject: 'Chemistry', class_name: 'Class 12-A', teacher: 'Dr. Singh', date: '2026-02-11', time: '14:00', duration: 50, platform: 'Zoom', meeting_link: 'https://zoom.us/j/789012', status: 'upcoming' },
    { id: 5, title: 'Hindi - Kabir Ke Dohe', subject: 'Hindi', class_name: 'Class 8-B', teacher: 'Mrs. Verma', date: '2026-02-12', time: '10:30', duration: 35, platform: 'Google Meet', meeting_link: 'https://meet.google.com/xyz-abc', status: 'upcoming' },
  ]);

  const [ongoingClasses, setOngoingClasses] = useState([
    { id: 101, title: 'Biology - Cell Division', subject: 'Biology', class_name: 'Class 11-A', teacher: 'Dr. Mehta', platform: 'Zoom', attendees: 38, maxAttendees: 45, startedAt: new Date(Date.now() - 25 * 60000).toISOString(), duration: 60, meeting_link: 'https://zoom.us/j/345678' },
    { id: 102, title: 'Computer Science - Python', subject: 'Computer Science', class_name: 'Class 12-B', teacher: 'Mr. Kumar', platform: 'Built-in', attendees: 32, maxAttendees: 40, startedAt: new Date(Date.now() - 10 * 60000).toISOString(), duration: 45, meeting_link: '' },
  ]);

  const [recordings, setRecordings] = useState([
    { id: 201, title: 'Mathematics - Algebra Basics', subject: 'Mathematics', class_name: 'Class 9-A', teacher: 'Mr. Sharma', date: '2026-02-08', duration: '58:32', size: '245 MB', views: 127, status: 'available' },
    { id: 202, title: 'Science - Chemical Reactions', subject: 'Science', class_name: 'Class 10-B', teacher: 'Mrs. Gupta', date: '2026-02-07', duration: '42:15', size: '178 MB', views: 89, status: 'available' },
    { id: 203, title: 'Social Studies - Indian Constitution', subject: 'Social Studies', class_name: 'Class 8-A', teacher: 'Mr. Joshi', date: '2026-02-06', duration: '35:48', size: '156 MB', views: 64, status: 'available' },
    { id: 204, title: 'English - Grammar Workshop', subject: 'English', class_name: 'Class 7-B', teacher: 'Ms. Patel', date: '2026-02-05', duration: '40:22', size: '192 MB', views: 103, status: 'processing' },
  ]);

  const [attendanceData, setAttendanceData] = useState([
    { id: 301, class_name: 'Class 10-A', subject: 'Mathematics', date: '2026-02-08', totalStudents: 45, present: 41, absent: 4, teacher: 'Mr. Sharma', session: 'Trigonometry' },
    { id: 302, class_name: 'Class 11-B', subject: 'Physics', date: '2026-02-08', totalStudents: 40, present: 36, absent: 4, teacher: 'Mrs. Gupta', session: 'Laws of Motion' },
    { id: 303, class_name: 'Class 9-A', subject: 'English', date: '2026-02-07', totalStudents: 42, present: 39, absent: 3, teacher: 'Ms. Patel', session: 'Essay Writing' },
    { id: 304, class_name: 'Class 12-A', subject: 'Chemistry', date: '2026-02-07', totalStudents: 38, present: 35, absent: 3, teacher: 'Dr. Singh', session: 'Periodic Table' },
  ]);

  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showAttendanceDetail, setShowAttendanceDetail] = useState(false);

  const attendanceStudents = [
    { id: 's1', name: 'Aarav Patel', rollNo: 1, status: 'present', joinTime: '10:02', leaveTime: '10:58' },
    { id: 's2', name: 'Ananya Sharma', rollNo: 2, status: 'present', joinTime: '10:00', leaveTime: '10:58' },
    { id: 's3', name: 'Arjun Singh', rollNo: 3, status: 'absent', joinTime: '-', leaveTime: '-' },
    { id: 's4', name: 'Diya Gupta', rollNo: 4, status: 'present', joinTime: '10:05', leaveTime: '10:58' },
    { id: 's5', name: 'Ishaan Kumar', rollNo: 5, status: 'present', joinTime: '10:01', leaveTime: '10:55' },
    { id: 's6', name: 'Kavya Verma', rollNo: 6, status: 'absent', joinTime: '-', leaveTime: '-' },
    { id: 's7', name: 'Mohit Joshi', rollNo: 7, status: 'present', joinTime: '10:00', leaveTime: '10:58' },
    { id: 's8', name: 'Priya Mehta', rollNo: 8, status: 'present', joinTime: '10:03', leaveTime: '10:58' },
  ];

  const getElapsedMinutes = (startedAt) => {
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  };

  const handleCreateClass = () => {
    if (!classForm.title || !classForm.subject || !classForm.date || !classForm.time) {
      toast.error('Please fill all required fields');
      return;
    }
    const newClass = {
      id: Date.now(),
      ...classForm,
      duration: parseInt(classForm.duration),
      status: 'upcoming'
    };
    setScheduledClasses(prev => [newClass, ...prev]);
    toast.success('Live class scheduled successfully!');
    setShowCreateDialog(false);
    setClassForm({ title: '', subject: '', class_name: '', teacher: '', date: '', time: '', duration: '60', platform: 'Zoom', meeting_link: '' });
  };

  const handleDeleteScheduled = (id) => {
    setScheduledClasses(prev => prev.filter(c => c.id !== id));
    toast.success('Scheduled class removed');
  };

  const handleJoinClass = (cls) => {
    if (cls.meeting_link) {
      window.open(cls.meeting_link, '_blank');
    }
    toast.success(`Joining ${cls.title}...`);
  };

  const handleShareRecording = (rec) => {
    navigator.clipboard.writeText(`Check out: ${rec.title} - Live Class Recording`);
    toast.success('Recording link copied to clipboard!');
  };

  const handleDownloadReport = (att) => {
    toast.success(`Downloading attendance report for ${att.class_name} - ${att.session}`);
  };

  const viewAttendanceDetail = (att) => {
    setSelectedAttendance(att);
    setShowAttendanceDetail(true);
  };

  const platformIcon = (platform) => {
    switch (platform) {
      case 'Zoom': return <Badge className="bg-blue-100 text-blue-700">Zoom</Badge>;
      case 'Google Meet': return <Badge className="bg-green-100 text-green-700">Google Meet</Badge>;
      default: return <Badge className="bg-purple-100 text-purple-700">Built-in</Badge>;
    }
  };

  const stats = {
    totalScheduled: scheduledClasses.length,
    ongoingNow: ongoingClasses.length,
    totalRecordings: recordings.length,
    avgAttendance: attendanceData.length > 0 ? Math.round(attendanceData.reduce((sum, a) => sum + (a.present / a.totalStudents * 100), 0) / attendanceData.length) : 0
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Video className="w-8 h-8" />
              Live Classes
            </h1>
            <p className="text-red-100 mt-2">
              Go live or schedule — teach anytime, from anywhere
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalScheduled}</p>
              <p className="text-xs text-red-100">Scheduled</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.ongoingNow}</p>
              <p className="text-xs text-red-100">Live Now</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.totalRecordings}</p>
              <p className="text-xs text-red-100">Recordings</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
              <p className="text-xs text-red-100">Avg Attendance</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="flex items-center gap-2">
            <Radio className="w-4 h-4" /> Ongoing
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Play className="w-4 h-4" /> Recordings
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input placeholder="Search classes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> Schedule Class
            </Button>
          </div>
          <div className="space-y-3">
            {scheduledClasses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.subject.toLowerCase().includes(searchTerm.toLowerCase())).map(cls => (
              <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                        <Video className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {cls.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.time}</span>
                          <span>{cls.duration} min</span>
                          <span>{cls.class_name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Teacher: {cls.teacher}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {platformIcon(cls.platform)}
                      {cls.meeting_link && (
                        <Button size="sm" variant="outline" onClick={() => window.open(cls.meeting_link, '_blank')}>
                          <ExternalLink className="w-3 h-3 mr-1" /> Link
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteScheduled(cls.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {scheduledClasses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No classes scheduled. Click "Schedule Class" to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ongoing" className="mt-6">
          {ongoingClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingClasses.map(cls => {
                const elapsed = getElapsedMinutes(cls.startedAt);
                const remaining = cls.duration - elapsed;
                return (
                  <Card key={cls.id} className="border-0 shadow-md border-l-4 border-l-red-500">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <Badge className="bg-red-100 text-red-700">LIVE</Badge>
                          {platformIcon(cls.platform)}
                        </div>
                        <span className="text-sm text-gray-500">{elapsed} min elapsed</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">{cls.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{cls.class_name} • {cls.teacher}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" /> {cls.attendees}/{cls.maxAttendees}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" /> {remaining > 0 ? `${remaining} min left` : 'Overtime'}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((elapsed / cls.duration) * 100, 100)}%` }} />
                      </div>
                      <Button className="w-full mt-4 bg-red-600 hover:bg-red-700" onClick={() => handleJoinClass(cls)}>
                        <Monitor className="w-4 h-4 mr-2" /> Join Class
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No live classes right now. Check the schedule tab for upcoming classes.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recordings" className="mt-6">
          <div className="space-y-3">
            {recordings.map(rec => (
              <Card key={rec.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{rec.class_name}</span>
                          <span>{rec.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rec.duration}</span>
                          <span>{rec.size}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Teacher: {rec.teacher} • {rec.views} views</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.status === 'processing' ? (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                        </Badge>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Playing recording...')}>
                            <Play className="w-3 h-3 mr-1" /> Play
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Download started...')}>
                            <Download className="w-3 h-3 mr-1" /> Download
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleShareRecording(rec)}>
                            <Share2 className="w-4 h-4 text-gray-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <div className="space-y-3">
            {attendanceData.map(att => (
              <Card key={att.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => viewAttendanceDetail(att)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{att.session}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{att.class_name}</span>
                          <span>{att.subject}</span>
                          <span>{att.date}</span>
                          <span>Teacher: {att.teacher}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> {att.present} Present
                          </Badge>
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" /> {att.absent} Absent
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{Math.round(att.present / att.totalStudents * 100)}% attendance</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDownloadReport(att); }}>
                        <FileDown className="w-3 h-3 mr-1" /> Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-red-600" /> Schedule Live Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={classForm.title} onChange={(e) => setClassForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mathematics - Quadratic Equations" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={classForm.subject} onChange={(e) => setClassForm(f => ({ ...f, subject: e.target.value }))} placeholder="Mathematics" />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={classForm.class_name} onChange={(e) => setClassForm(f => ({ ...f, class_name: e.target.value }))} placeholder="Class 10-A" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Input value={classForm.teacher} onChange={(e) => setClassForm(f => ({ ...f, teacher: e.target.value }))} placeholder="Teacher name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={classForm.date} onChange={(e) => setClassForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={classForm.time} onChange={(e) => setClassForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={classForm.duration} onChange={(e) => setClassForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {['Zoom', 'Google Meet', 'Built-in'].map(p => (
                  <button key={p} type="button" onClick={() => setClassForm(f => ({ ...f, platform: p }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${classForm.platform === p ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {classForm.platform !== 'Built-in' && (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <Input value={classForm.meeting_link} onChange={(e) => setClassForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://zoom.us/j/..." />
              </div>
            )}
            <Button onClick={handleCreateClass} className="w-full bg-red-600 hover:bg-red-700">
              <Calendar className="w-4 h-4 mr-2" /> Schedule Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttendanceDetail} onOpenChange={setShowAttendanceDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" /> Attendance Detail — {selectedAttendance?.session}
            </DialogTitle>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{selectedAttendance.class_name}</span>
                <span>{selectedAttendance.subject}</span>
                <span>{selectedAttendance.date}</span>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Roll No</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Join Time</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Leave Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceStudents.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-3 text-sm">{s.rollNo}</td>
                        <td className="p-3 text-sm font-medium">{s.name}</td>
                        <td className="p-3">
                          <Badge className={s.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {s.status === 'present' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-500">{s.joinTime}</td>
                        <td className="p-3 text-sm text-gray-500">{s.leaveTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" onClick={() => handleDownloadReport(selectedAttendance)} className="w-full">
                <FileDown className="w-4 h-4 mr-2" /> Download Full Report
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}