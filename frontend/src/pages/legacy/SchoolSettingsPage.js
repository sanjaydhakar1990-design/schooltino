import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Clock,
  Calendar,
  MapPin,
  School,
  Save,
  AlertCircle,
  Check,
  Loader2,
  Settings,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

// State-wise Government School Timings (2024-25)
const STATE_TIMINGS = {
  'Rajasthan': {
    summer: { start: '07:30', end: '13:00' },
    winter: { start: '09:00', end: '15:00' },
    summerMonths: [4, 5, 6], // April, May, June
    board: 'RBSE'
  },
  'Madhya Pradesh': {
    summer: { start: '07:30', end: '12:30' },
    winter: { start: '10:00', end: '16:00' },
    summerMonths: [4, 5, 6],
    board: 'MPBSE'
  },
  'Uttar Pradesh': {
    summer: { start: '07:00', end: '12:30' },
    winter: { start: '09:00', end: '15:00' },
    summerMonths: [4, 5, 6],
    board: 'UP Board'
  },
  'Delhi': {
    summer: { start: '08:00', end: '14:00' },
    winter: { start: '08:00', end: '14:00' },
    summerMonths: [],
    board: 'CBSE'
  },
  'Gujarat': {
    summer: { start: '07:00', end: '12:00' },
    winter: { start: '10:30', end: '17:00' },
    summerMonths: [4, 5, 6],
    board: 'GSEB'
  },
  'Maharashtra': {
    summer: { start: '07:30', end: '12:30' },
    winter: { start: '10:00', end: '16:00' },
    summerMonths: [4, 5, 6],
    board: 'MSBSHSE'
  },
  'Custom': {
    summer: { start: '08:00', end: '14:00' },
    winter: { start: '09:00', end: '15:00' },
    summerMonths: [4, 5, 6],
    board: 'CBSE'
  }
};

// Government Holidays 2024-25
const GOVERNMENT_HOLIDAYS_2024_25 = [
  { date: '2024-08-15', name: 'Independence Day', type: 'national' },
  { date: '2024-08-26', name: 'Janmashtami', type: 'restricted' },
  { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2024-10-12', name: 'Dussehra', type: 'gazetted' },
  { date: '2024-10-31', name: 'Diwali', type: 'gazetted' },
  { date: '2024-11-01', name: 'Diwali Holiday', type: 'gazetted' },
  { date: '2024-11-15', name: 'Guru Nanak Jayanti', type: 'gazetted' },
  { date: '2024-12-25', name: 'Christmas', type: 'gazetted' },
  { date: '2025-01-14', name: 'Makar Sankranti', type: 'restricted' },
  { date: '2025-01-26', name: 'Republic Day', type: 'national' },
  { date: '2025-03-14', name: 'Holi', type: 'gazetted' },
  { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2025-04-18', name: 'Good Friday', type: 'restricted' },
  { date: '2025-05-01', name: 'May Day', type: 'restricted' },
];

// Academic Session Options
const ACADEMIC_SESSIONS = [
  { value: 'april', label: 'April to March (Standard)', startMonth: 4 },
  { value: 'july', label: 'July to June (Some States)', startMonth: 7 },
  { value: 'june', label: 'June to May (Some Boards)', startMonth: 6 },
];

export default function SchoolSettingsPage() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('timing');
  
  const [settings, setSettings] = useState({
    // School Timing Settings
    state: 'Rajasthan',
    primary_board: 'RBSE', // Main State Board
    secondary_board: 'NCERT', // Most schools follow NCERT for core subjects
    use_ncert_syllabus: true, // Use NCERT syllabus for main subjects
    board: 'RBSE', // Backward compatibility
    school_start_time: '08:00',
    school_end_time: '14:00',
    use_government_timing: true,
    
    // Prayer Time Settings (NEW)
    prayer_enabled: true,
    prayer_start_time: '08:00', // Prayer starts when school opens
    prayer_duration: 15, // Prayer duration in minutes
    attendance_after_prayer: true, // Take attendance only after prayer
    
    // Grace Period Settings
    late_grace_period: 15, // minutes
    early_leave_grace: 10, // minutes
    half_day_after: 4, // hours
    
    // Academic Year Settings
    academic_session: 'april',
    session_start_date: '2024-07-01',
    current_session: '2024-25',
    
    // Attendance Settings
    attendance_mode: 'auto', // 'auto' or 'manual'
    allow_manual_edit: true,
    require_approval_for_edit: true,
    
    // AI Settings (NEW)
    ai_learning_mode: true, // AI learns school schedule
    ai_auto_attendance: false, // AI can mark attendance automatically
    ai_voice_monitoring: false, // AI CCTV voice alerts in classroom
    ai_silent_mode: true, // AI sends notifications silently (no voice)
    ai_classroom_alerts: 'notification', // 'voice', 'notification', 'both', 'off'
    
    // Custom Holidays
    custom_holidays: [],
    
    // Syllabus Settings
    syllabus_manual_progress: false, // Allow manual syllabus progress entry
    syllabus_photo_upload: true, // Allow photo upload to verify progress
  });

  const [customHoliday, setCustomHoliday] = useState({ date: '', name: '', type: 'custom' });

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/school/settings?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/school/settings`, {
        school_id: schoolId,
        ...settings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStateChange = (state) => {
    const stateData = STATE_TIMINGS[state];
    const currentMonth = new Date().getMonth() + 1;
    const isSummer = stateData.summerMonths.includes(currentMonth);
    
    setSettings(prev => ({
      ...prev,
      state,
      primary_board: stateData.board,
      secondary_board: 'NCERT', // Most Indian schools use NCERT for core subjects
      use_ncert_syllabus: true,
      board: stateData.board, // Backward compatibility
      school_start_time: isSummer ? stateData.summer.start : stateData.winter.start,
      school_end_time: isSummer ? stateData.summer.end : stateData.winter.end,
    }));
  };

  const addCustomHoliday = () => {
    if (!customHoliday.date || !customHoliday.name) {
      toast.error('Please fill date and name');
      return;
    }
    setSettings(prev => ({
      ...prev,
      custom_holidays: [...prev.custom_holidays, { ...customHoliday, id: Date.now() }]
    }));
    setCustomHoliday({ date: '', name: '', type: 'custom' });
    toast.success('Holiday added');
  };

  const removeCustomHoliday = (id) => {
    setSettings(prev => ({
      ...prev,
      custom_holidays: prev.custom_holidays.filter(h => h.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="school-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Settings</h1>
          <p className="text-slate-500">School timing, calendar, और attendance settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timing">
            <Clock className="w-4 h-4 mr-2" /> School Timing
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Check className="w-4 h-4 mr-2" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="academic">
            <School className="w-4 h-4 mr-2" /> Academic
          </TabsTrigger>
        </TabsList>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                State & Board Selection
              </CardTitle>
              <CardDescription>
                Government timings automatically apply based on state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <select
                    value={settings.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 px-3"
                    data-testid="state-select"
                  >
                    {Object.keys(STATE_TIMINGS).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Board (State Board)</Label>
                  <select
                    value={settings.primary_board}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_board: e.target.value, board: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-slate-200 px-3"
                    data-testid="primary-board-select"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="MPBSE">MP Board (MPBSE)</option>
                    <option value="RBSE">RBSE (Rajasthan Board)</option>
                    <option value="UP Board">UP Board</option>
                    <option value="GSEB">Gujarat Board (GSEB)</option>
                    <option value="MSBSHSE">Maharashtra Board</option>
                    <option value="NCERT">NCERT Only</option>
                  </select>
                </div>
              </div>

              {/* Secondary Board - NCERT for core subjects */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">📚 NCERT Syllabus (Core Subjects)</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Most state board schools follow NCERT syllabus for Hindi, English, Maths, Science
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.use_ncert_syllabus}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        use_ncert_syllabus: e.target.checked,
                        secondary_board: e.target.checked ? 'NCERT' : prev.primary_board
                      }))}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-amber-700">Enable NCERT</span>
                  </label>
                </div>
                {settings.use_ncert_syllabus && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>Selected Boards:</strong> {settings.primary_board} + NCERT
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      • AI Paper Generator will show chapters from both boards<br/>
                      • {settings.primary_board} chapters for board-specific subjects<br/>
                      • NCERT chapters for Hindi, English, Maths, Science
                    </p>
                  </div>
                )}
              </div>

              {/* Government Timing Info */}
              {settings.state !== 'Custom' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 mb-2">
                    {settings.state} Government School Timing:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Summer:</span>
                      <span className="ml-2">{STATE_TIMINGS[settings.state].summer.start} - {STATE_TIMINGS[settings.state].summer.end}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Winter:</span>
                      <span className="ml-2">{STATE_TIMINGS[settings.state].winter.start} - {STATE_TIMINGS[settings.state].winter.end}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Start Time *</Label>
                  <Input
                    type="time"
                    value={settings.school_start_time}
                    onChange={(e) => setSettings(prev => ({ ...prev, school_start_time: e.target.value }))}
                    className="h-11"
                    data-testid="start-time-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>School End Time *</Label>
                  <Input
                    type="time"
                    value={settings.school_end_time}
                    onChange={(e) => setSettings(prev => ({ ...prev, school_end_time: e.target.value }))}
                    className="h-11"
                    data-testid="end-time-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grace Period Settings</CardTitle>
              <CardDescription>
                Late आने पर छूट का समय set करें
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Late Grace Period (minutes) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.late_grace_period}
                    onChange={(e) => setSettings(prev => ({ ...prev, late_grace_period: parseInt(e.target.value) }))}
                    className="h-11"
                    data-testid="grace-period-input"
                  />
                  <p className="text-xs text-slate-500">
                    इतने minutes late आने पर भी Present mark होगा
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Early Leave Grace (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.early_leave_grace}
                    onChange={(e) => setSettings(prev => ({ ...prev, early_leave_grace: parseInt(e.target.value) }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Half Day After (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={settings.half_day_after}
                    onChange={(e) => setSettings(prev => ({ ...prev, half_day_after: parseInt(e.target.value) }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-base font-medium">Attendance Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, attendance_mode: 'auto' }))}
                    className={`p-4 rounded-lg border-2 text-left ${
                      settings.attendance_mode === 'auto' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <p className="font-medium">AI Automatic</p>
                    <p className="text-sm text-slate-500">CCTV/Biometric से auto attendance</p>
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, attendance_mode: 'manual' }))}
                    className={`p-4 rounded-lg border-2 text-left ${
                      settings.attendance_mode === 'manual' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    <p className="font-medium">Manual Entry</p>
                    <p className="text-sm text-slate-500">Teacher manually marks attendance</p>
                  </button>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_manual_edit}
                      onChange={(e) => setSettings(prev => ({ ...prev, allow_manual_edit: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm">Allow Manual Edit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_approval_for_edit}
                      onChange={(e) => setSettings(prev => ({ ...prev, require_approval_for_edit: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm">Require Approval for Edit</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab - Redirect to Full Calendar */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>School Calendar</CardTitle>
              <CardDescription>
                सभी holidays, events और AI calendar features यहाँ मिलेंगे
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
              <p className="text-slate-600 mb-4">
                Full Calendar में Government Holidays, Custom Holidays, Events और AI Calendar Generation सब एक जगह है।
              </p>
              <Button 
                onClick={() => window.location.href = '/app/school-calendar'}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Open Full Calendar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Year Settings</CardTitle>
              <CardDescription>
                Mid-year adoption के लिए manual entry enable करें
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Academic Session</Label>
                  <select
                    value={settings.academic_session}
                    onChange={(e) => setSettings(prev => ({ ...prev, academic_session: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-slate-200 px-3"
                  >
                    {ACADEMIC_SESSIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Session Start Date</Label>
                  <Input
                    type="date"
                    value={settings.session_start_date}
                    onChange={(e) => setSettings(prev => ({ ...prev, session_start_date: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Session</Label>
                  <Input
                    value={settings.current_session}
                    onChange={(e) => setSettings(prev => ({ ...prev, current_session: e.target.value }))}
                    className="h-11"
                    placeholder="2024-25"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Mid-Year Adoption?</p>
                    <p className="text-sm text-amber-700 mt-1">
                      अगर school mid-year में join कर रहा है, तो नीचे options enable करें:
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={settings.syllabus_manual_progress}
                    onChange={(e) => setSettings(prev => ({ ...prev, syllabus_manual_progress: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300"
                  />
                  <div>
                    <p className="font-medium">Allow Manual Syllabus Progress</p>
                    <p className="text-sm text-slate-500">
                      Teachers can manually set syllabus completion percentage
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={settings.syllabus_photo_upload}
                    onChange={(e) => setSettings(prev => ({ ...prev, syllabus_photo_upload: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300"
                  />
                  <div>
                    <p className="font-medium">Photo Upload for Syllabus Update</p>
                    <p className="text-sm text-slate-500">
                      Allow photo upload to verify syllabus progress (useful for mid-year)
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
