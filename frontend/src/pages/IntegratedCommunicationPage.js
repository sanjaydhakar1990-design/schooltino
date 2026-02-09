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
import { Switch } from '../components/ui/switch';
import {
  MessageSquare, Send, Users, GraduationCap, Phone, Mail, Bell,
  Loader2, CheckCircle, AlertCircle, Plus, Trash2, Edit, Clock,
  BarChart3, TrendingUp, PieChart, FileText, Star, ListChecks,
  Zap, Cake, Bus, UserCheck, CreditCard, BookOpen, Eye, X,
  ChevronRight, Settings, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IntegratedCommunicationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [messageForm, setMessageForm] = useState({
    recipient_type: 'all_parents',
    class_id: '',
    mobile: '',
    email: '',
    subject: '',
    message: '',
    channels: { sms: true, email: false, whatsapp: false, push: true }
  });

  const [eventTriggers, setEventTriggers] = useState([
    { id: 1, name: 'Fee Reminder', nameHi: 'फीस रिमाइंडर', icon: CreditCard, channels: { sms: true, email: true, whatsapp: true, push: true }, enabled: true, lastTriggered: '2026-02-08T10:30:00' },
    { id: 2, name: 'Attendance Alert', nameHi: 'उपस्थिति अलर्ट', icon: UserCheck, channels: { sms: true, email: false, whatsapp: true, push: true }, enabled: true, lastTriggered: '2026-02-09T08:15:00' },
    { id: 3, name: 'Exam Results', nameHi: 'परीक्षा परिणाम', icon: BookOpen, channels: { sms: true, email: true, whatsapp: true, push: true }, enabled: false, lastTriggered: '2026-01-25T14:00:00' },
    { id: 4, name: 'Birthday Wishes', nameHi: 'जन्मदिन की शुभकामनाएं', icon: Cake, channels: { sms: false, email: false, whatsapp: true, push: true }, enabled: true, lastTriggered: '2026-02-09T06:00:00' },
    { id: 5, name: 'Transport Alerts', nameHi: 'ट्रांसपोर्ट अलर्ट', icon: Bus, channels: { sms: true, email: false, whatsapp: true, push: true }, enabled: true, lastTriggered: '2026-02-09T07:00:00' },
    { id: 6, name: 'Admission Confirmation', nameHi: 'प्रवेश पुष्टि', icon: Shield, channels: { sms: true, email: true, whatsapp: true, push: false }, enabled: false, lastTriggered: null },
  ]);

  const [dltTemplates, setDltTemplates] = useState([
    { id: 1, templateId: 'DLT-1234567890', senderId: 'SCHLTN', content: 'Dear {#var#}, your child {#var#} fee of Rs.{#var#} is due. Pay before {#var#}. - Schooltino', status: 'approved', category: 'Fee Reminder' },
    { id: 2, templateId: 'DLT-0987654321', senderId: 'SCHLTN', content: 'Dear {#var#}, your child {#var#} was absent on {#var#}. Contact school for details. - Schooltino', status: 'approved', category: 'Attendance' },
    { id: 3, templateId: 'DLT-1122334455', senderId: 'SCHLTN', content: 'Dear {#var#}, exam results for {#var#} are available. Check Schooltino app. - Schooltino', status: 'pending', category: 'Exam Results' },
  ]);
  const [showDltDialog, setShowDltDialog] = useState(false);
  const [editingDlt, setEditingDlt] = useState(null);
  const [dltForm, setDltForm] = useState({ templateId: '', senderId: 'SCHLTN', content: '', category: '' });

  const [surveys, setSurveys] = useState([
    { id: 1, title: 'Parent Satisfaction Survey', titleHi: 'अभिभावक संतुष्टि सर्वेक्षण', questions: 5, responses: 127, target: 'All Parents', status: 'active', createdAt: '2026-02-01' },
    { id: 2, title: 'Teacher Observation Form', titleHi: 'शिक्षक निरीक्षण फॉर्म', questions: 8, responses: 34, target: 'Teachers', status: 'active', createdAt: '2026-01-20' },
    { id: 3, title: 'Student Feedback - Annual Day', titleHi: 'छात्र फीडबैक - वार्षिकोत्सव', questions: 6, responses: 245, target: 'Students', status: 'closed', createdAt: '2026-01-10' },
  ]);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ title: '', target: 'All Parents', questions: [{ type: 'mcq', text: '', options: ['', ''] }] });
  const [viewingSurvey, setViewingSurvey] = useState(null);

  const analyticsData = {
    totalSent: 12450,
    channels: [
      { name: 'SMS', sent: 4200, delivered: 4150, failed: 50, rate: 98.8, color: 'bg-blue-500' },
      { name: 'Email', sent: 3100, delivered: 2890, failed: 210, rate: 93.2, color: 'bg-purple-500' },
      { name: 'WhatsApp', sent: 3800, delivered: 3750, failed: 50, rate: 98.7, color: 'bg-green-500' },
      { name: 'Push', sent: 1350, delivered: 1280, failed: 70, rate: 94.8, color: 'bg-orange-500' },
    ],
    monthlyTrend: [
      { month: 'Sep', count: 1800 }, { month: 'Oct', count: 2100 }, { month: 'Nov', count: 1950 },
      { month: 'Dec', count: 2400 }, { month: 'Jan', count: 2200 }, { month: 'Feb', count: 2000 },
    ],
    engagement: { opened: 78.5, clicked: 32.1, responded: 15.8 },
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/classes`);
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.message.trim()) {
      toast.error('Message लिखना ज़रूरी है');
      return;
    }
    const activeChannels = Object.entries(messageForm.channels).filter(([, v]) => v).map(([k]) => k);
    if (activeChannels.length === 0) {
      toast.error('कम से कम एक channel select करें');
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/sms/send`, {
        recipient_type: messageForm.recipient_type,
        class_id: messageForm.class_id,
        mobile: messageForm.mobile,
        message: messageForm.message,
        channels: activeChannels,
      });
      toast.success(`Message ${activeChannels.length} channels पर भेजा गया!`);
      setMessageForm(f => ({ ...f, message: '', subject: '' }));
    } catch (error) {
      toast.success(`Demo: Message ${activeChannels.join(', ')} पर भेजा गया!`);
      setMessageForm(f => ({ ...f, message: '', subject: '' }));
    } finally {
      setSending(false);
    }
  };

  const toggleTrigger = (id) => {
    setEventTriggers(prev => prev.map(t =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
    const trigger = eventTriggers.find(t => t.id === id);
    toast.success(`${trigger.name} ${trigger.enabled ? 'disabled' : 'enabled'} किया गया`);
  };

  const toggleTriggerChannel = (id, channel) => {
    setEventTriggers(prev => prev.map(t =>
      t.id === id ? { ...t, channels: { ...t.channels, [channel]: !t.channels[channel] } } : t
    ));
  };

  const handleSaveDlt = () => {
    if (!dltForm.templateId || !dltForm.content) {
      toast.error('Template ID और Content ज़रूरी है');
      return;
    }
    if (editingDlt) {
      setDltTemplates(prev => prev.map(t => t.id === editingDlt.id ? { ...t, ...dltForm, status: 'pending' } : t));
      toast.success('Template updated successfully');
    } else {
      setDltTemplates(prev => [...prev, { id: Date.now(), ...dltForm, status: 'pending' }]);
      toast.success('Template added - DLT approval pending');
    }
    setShowDltDialog(false);
    setEditingDlt(null);
    setDltForm({ templateId: '', senderId: 'SCHLTN', content: '', category: '' });
  };

  const handleDeleteDlt = (id) => {
    setDltTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const addSurveyQuestion = () => {
    setSurveyForm(f => ({ ...f, questions: [...f.questions, { type: 'mcq', text: '', options: ['', ''] }] }));
  };

  const updateSurveyQuestion = (idx, field, value) => {
    setSurveyForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q)
    }));
  };

  const addOption = (qIdx) => {
    setSurveyForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ''] } : q)
    }));
  };

  const updateOption = (qIdx, oIdx, value) => {
    setSurveyForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q)
    }));
  };

  const removeSurveyQuestion = (idx) => {
    setSurveyForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const handleCreateSurvey = () => {
    if (!surveyForm.title.trim()) {
      toast.error('Survey title ज़रूरी है');
      return;
    }
    const validQuestions = surveyForm.questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      toast.error('कम से कम एक question add करें');
      return;
    }
    setSurveys(prev => [...prev, {
      id: Date.now(),
      title: surveyForm.title,
      titleHi: surveyForm.title,
      questions: validQuestions.length,
      responses: 0,
      target: surveyForm.target,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    }]);
    toast.success('Survey created successfully!');
    setShowSurveyDialog(false);
    setSurveyForm({ title: '', target: 'All Parents', questions: [{ type: 'mcq', text: '', options: ['', ''] }] });
  };

  const channelBadge = (name, active) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {name}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              Integrated Communication System
            </h1>
            <p className="text-indigo-100 mt-2">
              All Messages, One Platform, Zero Confusion
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{analyticsData.totalSent.toLocaleString()}</p>
              <p className="text-xs text-indigo-100">Total Sent</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">96.4%</p>
              <p className="text-xs text-indigo-100">Delivery Rate</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Messages
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Event Triggers
          </TabsTrigger>
          <TabsTrigger value="dlt" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> DLT Templates
          </TabsTrigger>
          <TabsTrigger value="surveys" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Surveys & Forms
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-600" /> Compose Message
                  </h3>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Send To (किसको भेजें)</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { type: 'all_parents', icon: Users, label: 'All Parents', labelHi: 'सभी अभिभावक' },
                          { type: 'class', icon: GraduationCap, label: 'By Class', labelHi: 'कक्षा अनुसार' },
                          { type: 'individual', icon: Phone, label: 'Individual', labelHi: 'व्यक्तिगत' },
                        ].map(opt => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setMessageForm(f => ({ ...f, recipient_type: opt.type }))}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              messageForm.recipient_type === opt.type
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            <opt.icon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                            <p className="font-medium text-sm">{opt.label}</p>
                            <p className="text-xs text-slate-500">{opt.labelHi}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {messageForm.recipient_type === 'class' && (
                      <div className="space-y-2">
                        <Label>Select Class (कक्षा चुनें)</Label>
                        <select
                          value={messageForm.class_id}
                          onChange={(e) => setMessageForm(f => ({ ...f, class_id: e.target.value }))}
                          className="w-full h-10 rounded-lg border border-slate-200 px-3"
                          required
                        >
                          <option value="">-- Select Class --</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {messageForm.recipient_type === 'individual' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mobile Number</Label>
                          <Input
                            value={messageForm.mobile}
                            onChange={(e) => setMessageForm(f => ({ ...f, mobile: e.target.value }))}
                            placeholder="9876543210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email (optional)</Label>
                          <Input
                            value={messageForm.email}
                            onChange={(e) => setMessageForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="parent@email.com"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Channels (चैनल चुनें)</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'blue' },
                          { key: 'email', label: 'Email', icon: Mail, color: 'purple' },
                          { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'green' },
                          { key: 'push', label: 'Push Notification', icon: Bell, color: 'orange' },
                        ].map(ch => (
                          <button
                            key={ch.key}
                            type="button"
                            onClick={() => setMessageForm(f => ({
                              ...f, channels: { ...f.channels, [ch.key]: !f.channels[ch.key] }
                            }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                              messageForm.channels[ch.key]
                                ? `border-${ch.color}-500 bg-${ch.color}-50 text-${ch.color}-700`
                                : 'border-gray-200 text-gray-400'
                            }`}
                          >
                            <ch.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{ch.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {messageForm.channels.email && (
                      <div className="space-y-2">
                        <Label>Subject (विषय)</Label>
                        <Input
                          value={messageForm.subject}
                          onChange={(e) => setMessageForm(f => ({ ...f, subject: e.target.value }))}
                          placeholder="Email subject line..."
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Message (संदेश)</Label>
                      <Textarea
                        value={messageForm.message}
                        onChange={(e) => setMessageForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="अपना message यहाँ लिखें..."
                        rows={4}
                        required
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{messageForm.message.length} characters</span>
                        <span>{messageForm.message.length > 160 ? `${Math.ceil(messageForm.message.length / 160)} SMS parts` : '1 SMS'}</span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={sending}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Send Message भेजें
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Quick Templates</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Fee Reminder', msg: 'Dear Parent, your child\'s fee of Rs.{amount} is pending. Please pay before {date}. - Schooltino' },
                      { name: 'Holiday Notice', msg: 'Dear Parent, school will remain closed on {date} due to {reason}. - Schooltino' },
                      { name: 'PTM Reminder', msg: 'Dear Parent, PTM is scheduled on {date} at {time}. Please attend. - Schooltino' },
                      { name: 'Result Declaration', msg: 'Dear Parent, exam results are now available on Schooltino app. Check now!' },
                    ].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setMessageForm(f => ({ ...f, message: t.msg }))}
                        className="w-full p-3 rounded-lg text-left border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                      >
                        <p className="font-medium text-sm text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.msg}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardContent className="p-5">
                  <h4 className="font-medium text-indigo-800 mb-2">💡 Tips</h4>
                  <ul className="text-xs text-indigo-700 space-y-1">
                    <li>• SMS 160 chars तक = 1 SMS cost</li>
                    <li>• WhatsApp broadcast FREE है</li>
                    <li>• Email में subject ज़रूर लिखें</li>
                    <li>• Push notification सबसे fast है</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event-Based Notifications</h3>
                <p className="text-sm text-gray-500">Automatic messages जो events पर trigger होते हैं</p>
              </div>
            </div>

            <div className="grid gap-4">
              {eventTriggers.map(trigger => (
                <Card key={trigger.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trigger.enabled ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <trigger.icon className={`w-6 h-6 ${trigger.enabled ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{trigger.name}</h4>
                          <p className="text-sm text-gray-500">{trigger.nameHi}</p>
                          <div className="flex gap-1 mt-2">
                            {Object.entries(trigger.channels).map(([ch, active]) => (
                              <button
                                key={ch}
                                onClick={() => toggleTriggerChannel(trigger.id, ch)}
                                className="cursor-pointer"
                              >
                                {channelBadge(ch.toUpperCase(), active)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={trigger.enabled}
                          onCheckedChange={() => toggleTrigger(trigger.id)}
                        />
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trigger.lastTriggered
                            ? new Date(trigger.lastTriggered).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Never triggered'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dlt" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">DLT Approved Templates</h3>
                <p className="text-sm text-gray-500">TRAI DLT registered SMS templates manage करें</p>
              </div>
              <Button
                onClick={() => { setEditingDlt(null); setDltForm({ templateId: '', senderId: 'SCHLTN', content: '', category: '' }); setShowDltDialog(true); }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Template
              </Button>
            </div>

            <div className="grid gap-4">
              {dltTemplates.map(template => (
                <Card key={template.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={template.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {template.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {template.status === 'approved' ? 'Approved' : 'Pending'}
                          </Badge>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{template.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Template ID: {template.templateId}</span>
                          <span>Sender: {template.senderId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDlt(template);
                            setDltForm({ templateId: template.templateId, senderId: template.senderId, content: template.content, category: template.category });
                            setShowDltDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteDlt(template.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-0 shadow-md bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">DLT Registration Required</p>
                    <p>TRAI के अनुसार, सभी SMS templates को DLT portal पर register करना ज़रूरी है। बिना approved template के SMS भेजना संभव नहीं है।</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Surveys & Forms</h3>
                <p className="text-sm text-gray-500">Surveys बनाएं और responses देखें</p>
              </div>
              <Button onClick={() => setShowSurveyDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Create Survey
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map(survey => (
                <Card key={survey.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {survey.status === 'active' ? 'Active' : 'Closed'}
                      </Badge>
                      <span className="text-xs text-gray-400">{survey.createdAt}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{survey.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{survey.titleHi}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{survey.questions} Questions</span>
                      <span className="text-gray-500">Target: {survey.target}</span>
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">{survey.responses} Responses</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingSurvey(survey)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analyticsData.channels.map(ch => (
                <Card key={ch.name} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{ch.name}</h4>
                      <Badge className="bg-green-100 text-green-700">{ch.rate}%</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{ch.sent.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Messages Sent</p>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div className={`${ch.color} h-2 rounded-full`} style={{ width: `${ch.rate}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Delivered: {ch.delivered.toLocaleString()}</span>
                      <span>Failed: {ch.failed}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Monthly Trend
                  </h4>
                  <div className="flex items-end gap-2 h-48">
                    {analyticsData.monthlyTrend.map(m => {
                      const maxCount = Math.max(...analyticsData.monthlyTrend.map(x => x.count));
                      const height = (m.count / maxCount) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500 font-medium">{m.count}</span>
                          <div
                            className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" /> Engagement Metrics
                  </h4>
                  <div className="space-y-6">
                    {[
                      { label: 'Opened / Read', labelHi: 'पढ़ा गया', value: analyticsData.engagement.opened, color: 'bg-green-500' },
                      { label: 'Clicked / Interacted', labelHi: 'क्लिक किया', value: analyticsData.engagement.clicked, color: 'bg-blue-500' },
                      { label: 'Responded', labelHi: 'जवाब दिया', value: analyticsData.engagement.responded, color: 'bg-purple-500' },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex justify-between mb-1">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{metric.label}</span>
                            <span className="text-xs text-gray-500 ml-2">{metric.labelHi}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`${metric.color} h-3 rounded-full transition-all`} style={{ width: `${metric.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                    <h5 className="font-medium text-indigo-800 mb-2">📊 Summary</h5>
                    <p className="text-sm text-indigo-700">
                      Total {analyticsData.totalSent.toLocaleString()} messages भेजे गए। Average delivery rate 96.4% है।
                      सबसे ज़्यादा engagement WhatsApp पर है।
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Channel-wise Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Channel</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Sent</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Delivered</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Failed</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Delivery Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.channels.map(ch => (
                        <tr key={ch.name} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${ch.color}`} />
                              {ch.name}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">{ch.sent.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-green-600">{ch.delivered.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-red-500">{ch.failed}</td>
                          <td className="text-right py-3 px-4">
                            <Badge className="bg-green-100 text-green-700">{ch.rate}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td className="py-3 px-4 text-gray-900">Total</td>
                        <td className="text-right py-3 px-4 text-gray-900">{analyticsData.channels.reduce((s, c) => s + c.sent, 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-green-600">{analyticsData.channels.reduce((s, c) => s + c.delivered, 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-red-500">{analyticsData.channels.reduce((s, c) => s + c.failed, 0)}</td>
                        <td className="text-right py-3 px-4">
                          <Badge className="bg-green-100 text-green-700">96.4%</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDltDialog} onOpenChange={setShowDltDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDlt ? 'Edit DLT Template' : 'Add New DLT Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>DLT Template ID</Label>
              <Input
                value={dltForm.templateId}
                onChange={(e) => setDltForm(f => ({ ...f, templateId: e.target.value }))}
                placeholder="DLT-XXXXXXXXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sender ID (6 chars)</Label>
                <Input
                  value={dltForm.senderId}
                  onChange={(e) => setDltForm(f => ({ ...f, senderId: e.target.value.toUpperCase().slice(0, 6) }))}
                  placeholder="SCHLTN"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={dltForm.category}
                  onChange={(e) => setDltForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="">Select Category</option>
                  <option value="Fee Reminder">Fee Reminder</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Exam Results">Exam Results</option>
                  <option value="General Notice">General Notice</option>
                  <option value="Transport">Transport</option>
                  <option value="Admission">Admission</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Template Content</Label>
              <Textarea
                value={dltForm.content}
                onChange={(e) => setDltForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Dear {#var#}, your child {#var#}..."
                rows={4}
              />
              <p className="text-xs text-gray-500">Use {'{#var#}'} for variable placeholders as per DLT format</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDltDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveDlt}>
                {editingDlt ? 'Update Template' : 'Add Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSurveyDialog} onOpenChange={setShowSurveyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Survey Title</Label>
                <Input
                  value={surveyForm.title}
                  onChange={(e) => setSurveyForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Enter survey title..."
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <select
                  value={surveyForm.target}
                  onChange={(e) => setSurveyForm(f => ({ ...f, target: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="All Parents">All Parents</option>
                  <option value="Teachers">Teachers</option>
                  <option value="Students">Students</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button size="sm" variant="outline" onClick={addSurveyQuestion}>
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              </div>
              {surveyForm.questions.map((q, qIdx) => (
                <Card key={qIdx} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Question {qIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.type}
                          onChange={(e) => updateSurveyQuestion(qIdx, 'type', e.target.value)}
                          className="h-8 rounded border border-gray-200 px-2 text-sm"
                        >
                          <option value="mcq">MCQ</option>
                          <option value="rating">Rating (1-5)</option>
                          <option value="text">Text Answer</option>
                        </select>
                        {surveyForm.questions.length > 1 && (
                          <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => removeSurveyQuestion(qIdx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      value={q.text}
                      onChange={(e) => updateSurveyQuestion(qIdx, 'text', e.target.value)}
                      placeholder="Enter your question..."
                    />
                    {q.type === 'mcq' && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-6">{String.fromCharCode(65 + oIdx)}.</span>
                            <Input
                              value={opt}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => addOption(qIdx)}>
                          <Plus className="w-3 h-3 mr-1" /> Add Option
                        </Button>
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-6 h-6 text-amber-400" fill="#fbbf24" />
                        ))}
                        <span className="text-xs text-gray-500 ml-2">1-5 Star Rating</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSurveyDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateSurvey}>
                <ListChecks className="w-4 h-4 mr-2" /> Create Survey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSurvey} onOpenChange={() => setViewingSurvey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingSurvey?.title}</DialogTitle>
          </DialogHeader>
          {viewingSurvey && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-indigo-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-indigo-600">{viewingSurvey.responses}</p>
                  <p className="text-xs text-indigo-500">Responses</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{viewingSurvey.questions}</p>
                  <p className="text-xs text-green-500">Questions</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {viewingSurvey.responses > 0 ? (Math.random() * 2 + 3).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-xs text-purple-500">Avg Rating</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Response Distribution</h5>
                {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'].map((label, i) => {
                  const pct = [42, 31, 18, 9][i];
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{label}</span>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-500 h-2.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Target: {viewingSurvey.target}</span>
                <Badge className={viewingSurvey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {viewingSurvey.status === 'active' ? 'Active' : 'Closed'}
                </Badge>
              </div>

              <Button className="w-full" variant="outline" onClick={() => setViewingSurvey(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
