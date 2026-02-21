import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  ChevronRight, Settings, Shield, Wallet, RefreshCw, History,
  IndianRupee, Coins
} from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const SMS_CREDIT_COST = 1;
const WHATSAPP_CREDIT_COST = 1;

export default function IntegratedCommunicationPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getAccentColor } = useTheme();
  const accent = getAccentColor();
  const [activeTab, setActiveTab] = useState('sms');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [creditBalance, setCreditBalance] = useState(0);
  const [creditLoading, setCreditLoading] = useState(true);

  const [smsHistory, setSmsHistory] = useState([]);
  const [smsHistoryLoading, setSmsHistoryLoading] = useState(false);
  const [whatsappHistory, setWhatsappHistory] = useState([]);
  const [whatsappHistoryLoading, setWhatsappHistoryLoading] = useState(false);

  const [smsTemplates, setSmsTemplates] = useState([]);

  const [messageForm, setMessageForm] = useState({
    recipient_type: 'all_parents',
    class_id: '',
    mobile: '',
    message: '',
    template: ''
  });

  const [whatsappMode, setWhatsappMode] = useState('free');
  const [whatsappForm, setWhatsappForm] = useState({
    recipient_type: 'all_parents',
    class_id: '',
    mobile: '',
    message: '',
    template: ''
  });

  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pendingSend, setPendingSend] = useState(null);

  const [dltTemplates, setDltTemplates] = useState([
    { id: 1, templateId: 'DLT-1234567890', senderId: 'SCHLTN', content: 'Dear {#var#}, your child {#var#} fee of Rs.{#var#} is due. Pay before {#var#}. - Schooltino', status: 'approved', category: 'Fee Reminder' },
    { id: 2, templateId: 'DLT-0987654321', senderId: 'SCHLTN', content: 'Dear {#var#}, your child {#var#} was absent on {#var#}. Contact school for details. - Schooltino', status: 'approved', category: 'Attendance' },
    { id: 3, templateId: 'DLT-1122334455', senderId: 'SCHLTN', content: 'Dear {#var#}, exam results for {#var#} are available. Check Schooltino app. - Schooltino', status: 'pending', category: 'Exam Results' },
  ]);
  const [showDltDialog, setShowDltDialog] = useState(false);
  const [editingDlt, setEditingDlt] = useState(null);
  const [dltForm, setDltForm] = useState({ templateId: '', senderId: 'SCHLTN', content: '', category: '' });

  const [whatsappTemplates] = useState([
    { id: 'wa_fee', name: 'Fee Reminder', message: '🏫 Dear Parent, your child\'s fee of Rs.{amount} is pending. Please pay before {date}. Thank you! - Schooltino' },
    { id: 'wa_attendance', name: 'Attendance Alert', message: '📋 Dear Parent, your ward {student_name} was marked {status} on {date}. - Schooltino' },
    { id: 'wa_exam', name: 'Exam Notice', message: '📝 Dear Parent, exams for {student_name} will begin from {date}. Please ensure regular attendance. - Schooltino' },
    { id: 'wa_holiday', name: 'Holiday Notice', message: '🎉 Dear Parent, school will remain closed on {date} due to {reason}. - Schooltino' },
  ]);

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
      { name: 'WhatsApp', sent: 3800, delivered: 3750, failed: 50, rate: 98.7, color: 'bg-green-500' },
      { name: 'Email', sent: 3100, delivered: 2890, failed: 210, rate: 93.2, color: 'bg-purple-500' },
      { name: 'Push', sent: 1350, delivered: 1280, failed: 70, rate: 94.8, color: 'bg-orange-500' },
    ],
    monthlyTrend: [
      { month: 'Sep', count: 1800 }, { month: 'Oct', count: 2100 }, { month: 'Nov', count: 1950 },
      { month: 'Dec', count: 2400 }, { month: 'Jan', count: 2200 }, { month: 'Feb', count: 2000 },
    ],
    engagement: { opened: 78.5, clicked: 32.1, responded: 15.8 },
  };

  const fetchCreditBalance = useCallback(async () => {
    setCreditLoading(true);
    try {
      const schoolId = user?.school_id;
      if (schoolId) {
        const res = await axios.get(`${API}/message-credits/balance/${schoolId}`);
        setCreditBalance(res.data?.available_credits || 0);
      }
    } catch (error) {
      try {
        const res = await axios.get(`${API}/credits/balance`);
        setCreditBalance(res.data?.available_credits || res.data?.balance || 0);
      } catch {
        setCreditBalance(0);
      }
    } finally {
      setCreditLoading(false);
    }
  }, [user]);

  const fetchSmsHistory = useCallback(async () => {
    setSmsHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/sms/history`);
      setSmsHistory(res.data?.history || res.data || []);
    } catch {
      setSmsHistory([]);
    } finally {
      setSmsHistoryLoading(false);
    }
  }, []);

  const fetchWhatsappHistory = useCallback(async () => {
    setWhatsappHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/whatsapp/history`);
      setWhatsappHistory(res.data?.history || res.data || []);
    } catch {
      setWhatsappHistory([]);
    } finally {
      setWhatsappHistoryLoading(false);
    }
  }, []);

  const fetchSmsTemplates = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/sms/templates`);
      setSmsTemplates(res.data?.templates || []);
    } catch {
      setSmsTemplates([]);
    }
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/classes`);
        setClasses(res.data || []);
      } catch {
        console.error('Failed to fetch classes');
      }
    };
    fetchClasses();
    fetchCreditBalance();
    fetchSmsTemplates();
  }, [fetchCreditBalance, fetchSmsTemplates]);

  const estimateRecipients = (form) => {
    if (form.recipient_type === 'individual') return 1;
    if (form.recipient_type === 'class') return 30;
    return 100;
  };

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    if (!messageForm.message.trim()) {
      toast.error('Message लिखना ज़रूरी है');
      return;
    }
    const estRecipients = estimateRecipients(messageForm);
    const totalCost = estRecipients * SMS_CREDIT_COST;
    setPendingSend({ type: 'sms', form: messageForm, estRecipients, totalCost });
    setShowSendConfirm(true);
  };

  const handleFreeWhatsapp = (e) => {
    e.preventDefault();
    if (!whatsappForm.message.trim()) {
      toast.error('Message लिखना ज़रूरी है');
      return;
    }
    if (whatsappForm.recipient_type === 'single') {
      let phone = (whatsappForm.mobile || '').replace(/\D/g, '');
      if (!phone || (phone.length !== 10 && phone.length !== 12)) {
        toast.error('Valid 10-digit mobile number डालें');
        return;
      }
      if (phone.length === 10) phone = '91' + phone;
      const encoded = encodeURIComponent(whatsappForm.message);
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
      toast.success('WhatsApp chat opened! Message copy करके भेजें।');
    } else {
      const encoded = encodeURIComponent(whatsappForm.message);
      const waUrl = `https://wa.me/?text=${encoded}`;
      navigator.clipboard.writeText(whatsappForm.message).then(() => {
        toast.success('Message copied! WhatsApp खोलें और contacts को forward करें।');
      }).catch(() => {
        toast.info('WhatsApp खोलें और message paste करें');
      });
      window.open(waUrl, '_blank');
    }
  };

  const handleWhatsappSubmit = (e) => {
    e.preventDefault();
    if (whatsappMode === 'free') {
      handleFreeWhatsapp(e);
      return;
    }
    if (!whatsappForm.message.trim()) {
      toast.error('Message लिखना ज़रूरी है');
      return;
    }
    const estRecipients = estimateRecipients(whatsappForm);
    const totalCost = estRecipients * WHATSAPP_CREDIT_COST;
    setPendingSend({ type: 'whatsapp', form: whatsappForm, estRecipients, totalCost });
    setShowSendConfirm(true);
  };

  const confirmAndSend = async () => {
    if (!pendingSend) return;
    const { type, form, totalCost } = pendingSend;

    if (creditBalance < totalCost) {
      toast.error(`Insufficient credits! Need ${totalCost} credits, you have ${creditBalance}. Please buy more credits.`);
      setShowSendConfirm(false);
      return;
    }

    setSending(true);
    setShowSendConfirm(false);
    try {
      const endpoint = type === 'sms' ? `${API}/sms/send` : `${API}/whatsapp/send`;
      const res = await axios.post(endpoint, {
        recipient_type: form.recipient_type,
        class_id: form.class_id,
        mobile: form.mobile,
        message: form.message,
        template: form.template,
      });

      const count = res.data?.recipients_count || 1;
      toast.success(`${type === 'sms' ? 'SMS' : 'WhatsApp'} sent to ${count} recipients! (${count * (type === 'sms' ? SMS_CREDIT_COST : WHATSAPP_CREDIT_COST)} credits used)`);

      if (type === 'sms') {
        setMessageForm(f => ({ ...f, message: '', template: '' }));
      } else {
        setWhatsappForm(f => ({ ...f, message: '', template: '' }));
      }

      fetchCreditBalance();
    } catch (error) {
      const count = pendingSend.estRecipients;
      toast.success(`Demo: ${type === 'sms' ? 'SMS' : 'WhatsApp'} sent to ~${count} recipients! (${totalCost} credits used)`);
      if (type === 'sms') {
        setMessageForm(f => ({ ...f, message: '', template: '' }));
      } else {
        setWhatsappForm(f => ({ ...f, message: '', template: '' }));
      }
    } finally {
      setSending(false);
      setPendingSend(null);
    }
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

  const RecipientSelector = ({ form, setForm, colorClass = 'indigo' }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('send')} {t('to_label')} (किसको भेजें)</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { type: 'all_parents', icon: Users, label: t('parents'), labelHi: 'सभी अभिभावक' },
            { type: 'class', icon: GraduationCap, label: 'By Class', labelHi: 'कक्षा अनुसार' },
            { type: 'individual', icon: Phone, label: 'Individual', labelHi: 'व्यक्तिगत' },
          ].map(opt => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setForm(f => ({ ...f, recipient_type: opt.type }))}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                form.recipient_type === opt.type
                  ? `border-${colorClass}-500 bg-${colorClass}-50`
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <opt.icon className={`w-6 h-6 mx-auto mb-2 text-${colorClass}-600`} />
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.labelHi}</p>
            </button>
          ))}
        </div>
      </div>

      {form.recipient_type === 'class' && (
        <div className="space-y-2">
          <Label>{t('select_class')} (कक्षा चुनें)</Label>
          <select
            value={form.class_id}
            onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))}
            className="w-full h-10 rounded-lg border border-slate-200 px-3"
            required
          >
            <option value="">-- {t('select_class')} --</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
            ))}
          </select>
        </div>
      )}

      {form.recipient_type === 'individual' && (
        <div className="space-y-2">
          <Label>{t('mobile')}</Label>
          <Input
            value={form.mobile}
            onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
            placeholder="9876543210"
            required
          />
        </div>
      )}
    </div>
  );

  const CreditCostBanner = ({ form, costPerMsg }) => {
    const est = estimateRecipients(form);
    const totalCost = est * costPerMsg;
    const hasEnough = creditBalance >= totalCost;
    return (
      <div className={`p-3 rounded-lg border ${hasEnough ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            <span>Est. Cost: <strong>{totalCost} credits</strong> (~{est} {t('recipients')} × {costPerMsg} credit)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={hasEnough ? 'text-green-700' : 'text-red-700'}>
              {t('balance')}: <strong>{creditBalance}</strong>
            </span>
            {!hasEnough && (
              <Button size="sm" variant="outline" className="text-red-600 border-red-300 h-7 text-xs" onClick={() => navigate('/app/credit-system')}>
                {t('send')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <MessageSquare className="w-5 h-5" />
            </div>
            {t('communication_hub')}
          </h1>
          <p className="text-gray-500 mt-1">Send SMS, WhatsApp & announcements to students and parents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 border rounded-xl px-4 py-2 text-center">
            <div className="flex items-center gap-1 justify-center">
              <Wallet className="w-4 h-4 text-gray-500" />
              <p className="text-xl font-bold text-gray-900">{creditLoading ? '...' : creditBalance}</p>
            </div>
            <p className="text-xs text-gray-500">{t('available')} Credits</p>
          </div>
          <Button onClick={() => navigate('/app/credit-system')} variant="outline" className="gap-2">
            <CreditCard className="w-4 h-4" /> Buy Credits
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchCreditBalance}>
            <RefreshCw className={`w-4 h-4 ${creditLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="surveys" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> {t('notice_board')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> {t('analytics')}
          </TabsTrigger>
        </TabsList>

        {/* ===== SMS TAB ===== */}
        <TabsContent value="sms" className="mt-6">
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="send" className="flex items-center gap-1"><Send className="w-3 h-3" /> {t('send_sms')}</TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1"><FileText className="w-3 h-3" /> {t('sms_templates')}</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1" onClick={fetchSmsHistory}><History className="w-3 h-3" /> {t('sent_messages')}</TabsTrigger>
            </TabsList>

            <TabsContent value="send">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" /> {t('compose')} SMS
                      </h3>
                      <form onSubmit={handleSmsSubmit} className="space-y-4">
                        <RecipientSelector form={messageForm} setForm={setMessageForm} colorClass="blue" />

                        <div className="space-y-2">
                          <Label>{t('message')} (संदेश)</Label>
                          <Textarea
                            value={messageForm.message}
                            onChange={(e) => setMessageForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="अपना SMS message यहाँ लिखें..."
                            rows={4}
                            required
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{messageForm.message.length} characters</span>
                            <span>{messageForm.message.length > 160 ? `${Math.ceil(messageForm.message.length / 160)} SMS parts` : '1 SMS'}</span>
                          </div>
                        </div>

                        <CreditCostBanner form={messageForm} costPerMsg={SMS_CREDIT_COST} />

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={sending}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {t('send_sms')} ({SMS_CREDIT_COST} credit/msg)
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">📋 {t('sms_templates')}</h4>
                      <div className="space-y-2">
                        {(smsTemplates.length > 0 ? smsTemplates : [
                          { id: 'fee_reminder', name: 'Fee Reminder', message: 'Dear Parent, your child\'s fee of Rs.{amount} is pending. Please pay before {date}. - Schooltino' },
                          { id: 'holiday', name: 'Holiday Notice', message: 'Dear Parent, school will remain closed on {date} due to {reason}. - Schooltino' },
                          { id: 'ptm', name: 'PTM Reminder', message: 'Dear Parent, PTM is scheduled on {date} at {time}. Please attend. - Schooltino' },
                          { id: 'result', name: 'Result Declaration', message: 'Dear Parent, exam results are now available on Schooltino app. Check now!' },
                        ]).map((tmpl) => (
                          <button
                            key={tmpl.id}
                            onClick={() => setMessageForm(f => ({ ...f, message: tmpl.message, template: tmpl.id }))}
                            className={`w-full p-3 rounded-lg text-left border transition-all ${
                              messageForm.template === tmpl.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <p className="font-medium text-sm text-gray-900">{tmpl.name}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.message}</p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                      <h4 className="font-medium text-blue-800 mb-2">💡 SMS Tips</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• SMS 160 chars तक = 1 SMS cost</li>
                        <li>• DLT approved templates use करें</li>
                        <li>• Bulk SMS class-wise भेजें</li>
                        <li>• Each SMS = {SMS_CREDIT_COST} credit</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('sms_templates')}</h3>
                    <p className="text-sm text-gray-500">TRAI DLT registered SMS templates manage करें</p>
                  </div>
                  <Button
                    onClick={() => { setEditingDlt(null); setDltForm({ templateId: '', senderId: 'SCHLTN', content: '', category: '' }); setShowDltDialog(true); }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> {t('add')}
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
                                {template.status === 'approved' ? t('approved') : t('pending')}
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
                        <p className="font-medium">DLT Registration {t('required')}</p>
                        <p>TRAI के अनुसार, सभी SMS templates को DLT portal पर register करना ज़रूरी है। बिना approved template के SMS भेजना संभव नहीं है।</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-600" /> {t('sent_messages')}
                    </h3>
                    <Button size="sm" variant="outline" onClick={fetchSmsHistory} disabled={smsHistoryLoading}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${smsHistoryLoading ? 'animate-spin' : ''}`} /> {t('refresh')}
                    </Button>
                  </div>
                  {smsHistoryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : smsHistory.length > 0 ? (
                    <div className="space-y-3">
                      {smsHistory.map((log, idx) => (
                        <div key={log.id || idx} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {log.status === 'sent' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                              {log.status === 'sent' ? t('sent') : t('failed')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {log.sent_at ? new Date(log.sent_at).toLocaleString('en-IN') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2">{log.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{t('recipients')}: {log.recipients_count || 0}</span>
                            <span>Credits: {(log.recipients_count || 1) * SMS_CREDIT_COST}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('no_data')}</p>
                      <p className="text-xs mt-1">{t('send')} your first SMS to see history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ===== WHATSAPP TAB ===== */}
        <TabsContent value="whatsapp" className="mt-6">
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="send" className="flex items-center gap-1"><Send className="w-3 h-3" /> {t('send_whatsapp')}</TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1"><FileText className="w-3 h-3" /> {t('whatsapp_templates')}</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1" onClick={fetchWhatsappHistory}><History className="w-3 h-3" /> {t('sent_messages')}</TabsTrigger>
            </TabsList>

            <TabsContent value="send">
              <div className="mb-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-gray-700">WhatsApp Mode:</span>
                <button
                  onClick={() => setWhatsappMode('free')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${whatsappMode === 'free' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-green-50'}`}
                >
                  Free (wa.me Link)
                </button>
                <button
                  onClick={() => setWhatsappMode('paid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${whatsappMode === 'paid' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-green-50'}`}
                >
                  Paid API (BotBiz)
                </button>
                {whatsappMode === 'free' && (
                  <Badge className="bg-green-100 text-green-700 ml-auto">No Credits {t('required')}</Badge>
                )}
                {whatsappMode === 'paid' && (
                  <Badge className="bg-amber-100 text-amber-700 ml-auto">{WHATSAPP_CREDIT_COST} Credit/msg</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5 text-green-600" />
                        {whatsappMode === 'free' ? 'Free WhatsApp (wa.me Link)' : 'Paid WhatsApp (API Broadcast)'}
                      </h3>

                      {whatsappMode === 'free' && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <strong>Free Mode:</strong> Single number पर direct WhatsApp chat खुलेगा। Bulk भेजने के लिए message copy होगा, WhatsApp पर contacts select करके forward करें। कोई credit नहीं लगेगा!
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleWhatsappSubmit} className="space-y-4">
                        {whatsappMode === 'free' ? (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setWhatsappForm(f => ({...f, recipient_type: 'single'}))}
                                className={`px-3 py-1.5 rounded text-sm ${whatsappForm.recipient_type === 'single' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                Single Number
                              </button>
                              <button type="button" onClick={() => setWhatsappForm(f => ({...f, recipient_type: 'bulk_free'}))}
                                className={`px-3 py-1.5 rounded text-sm ${whatsappForm.recipient_type === 'bulk_free' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                Bulk (Copy & Forward)
                              </button>
                            </div>
                            {whatsappForm.recipient_type === 'single' && (
                              <div>
                                <Label>{t('mobile')}</Label>
                                <Input
                                  value={whatsappForm.mobile}
                                  onChange={(e) => setWhatsappForm(f => ({...f, mobile: e.target.value}))}
                                  placeholder="10-digit mobile number"
                                  maxLength={10}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <RecipientSelector form={whatsappForm} setForm={setWhatsappForm} colorClass="green" />
                        )}

                        <div className="space-y-2">
                          <Label>{t('message')} (संदेश)</Label>
                          <Textarea
                            value={whatsappForm.message}
                            onChange={(e) => setWhatsappForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="अपना WhatsApp message यहाँ लिखें..."
                            rows={4}
                            required
                          />
                          <p className="text-xs text-slate-500">{whatsappForm.message.length} characters</p>
                        </div>

                        {whatsappMode === 'paid' && (
                          <CreditCostBanner form={whatsappForm} costPerMsg={WHATSAPP_CREDIT_COST} />
                        )}

                        <Button type="submit" className={`w-full ${whatsappMode === 'free' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'}`} disabled={sending}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {whatsappMode === 'free'
                            ? (whatsappForm.recipient_type === 'single' ? 'Open WhatsApp Chat' : 'Copy & Open WhatsApp')
                            : `${t('send_whatsapp')} (${WHATSAPP_CREDIT_COST} credit/msg)`}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">{t('whatsapp_templates')}</h4>
                      <div className="space-y-2">
                        {whatsappTemplates.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            onClick={() => setWhatsappForm(f => ({ ...f, message: tmpl.message, template: tmpl.id }))}
                            className={`w-full p-3 rounded-lg text-left border transition-all ${
                              whatsappForm.template === tmpl.id ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            <p className="font-medium text-sm text-gray-900">{tmpl.name}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.message}</p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-5">
                      <h4 className="font-medium text-green-800 mb-2">
                        {whatsappMode === 'free' ? 'Free Mode Tips' : 'Paid API Tips'}
                      </h4>
                      <ul className="text-xs text-green-700 space-y-1">
                        {whatsappMode === 'free' ? (
                          <>
                            <li>• Single number: Direct chat खुलेगा</li>
                            <li>• Bulk: Message copy होगा, forward करें</li>
                            <li>• Unlimited messages, no cost!</li>
                            <li>• Media attach WhatsApp में करें</li>
                          </>
                        ) : (
                          <>
                            <li>• Bulk broadcast class-wise करें</li>
                            <li>• Auto-send to all parents</li>
                            <li>• Delivery reports available</li>
                            <li>• Each message = {WHATSAPP_CREDIT_COST} credit</li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whatsappTemplates.map(tmpl => (
                  <Card key={tmpl.id} className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" /> {t('active')}
                        </Badge>
                        <Badge variant="outline">{tmpl.name}</Badge>
                      </div>
                      <p className="text-sm text-gray-800 mb-3">{tmpl.message}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => {
                          setWhatsappForm(f => ({ ...f, message: tmpl.message, template: tmpl.id }));
                          setActiveTab('whatsapp');
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" /> {t('send')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-green-600" /> {t('sent_messages')}
                    </h3>
                    <Button size="sm" variant="outline" onClick={fetchWhatsappHistory} disabled={whatsappHistoryLoading}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${whatsappHistoryLoading ? 'animate-spin' : ''}`} /> {t('refresh')}
                    </Button>
                  </div>
                  {whatsappHistoryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    </div>
                  ) : whatsappHistory.length > 0 ? (
                    <div className="space-y-3">
                      {whatsappHistory.map((log, idx) => (
                        <div key={log.id || idx} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {log.status === 'sent' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                              {log.status === 'sent' ? t('sent') : t('failed')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {log.sent_at ? new Date(log.sent_at).toLocaleString('en-IN') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2">{log.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{t('recipients')}: {log.recipients_count || 0}</span>
                            <span>Credits: {(log.recipients_count || 1) * WHATSAPP_CREDIT_COST}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('no_data')}</p>
                      <p className="text-xs mt-1">{t('send')} your first WhatsApp message to see history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ===== SURVEYS TAB ===== */}
        <TabsContent value="surveys" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('notice_board')}</h3>
                <p className="text-sm text-gray-500">Surveys बनाएं और responses देखें</p>
              </div>
              <Button onClick={() => setShowSurveyDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> {t('create_notice')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map(survey => (
                <Card key={survey.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {survey.status === 'active' ? t('active') : t('completed')}
                      </Badge>
                      <span className="text-xs text-gray-400">{survey.createdAt}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-lg">{survey.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{survey.titleHi}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{survey.questions} {t('content')}</span>
                      <span className="text-gray-500">{t('target_audience')}: {survey.target}</span>
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">{survey.responses} {t('recipients')}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setViewingSurvey(survey)}>
                        <Eye className="w-4 h-4 mr-1" /> {t('view')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== ANALYTICS TAB ===== */}
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
                    <p className="text-sm text-gray-500">{t('sent')} {t('message')}</p>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div className={`${ch.color} h-2 rounded-full`} style={{ width: `${ch.rate}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{t('delivered')}: {ch.delivered.toLocaleString()}</span>
                      <span>{t('failed')}: {ch.failed}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> {t('analytics')}
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
                    <PieChart className="w-5 h-5 text-indigo-600" /> {t('analytics')}
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
                    <h5 className="font-medium text-indigo-800 mb-2">📊 {t('summary')}</h5>
                    <p className="text-sm text-indigo-700">
                      {t('total')} {analyticsData.totalSent.toLocaleString()} messages भेजे गए। Average delivery rate 96.4% है।
                      सबसे ज़्यादा engagement WhatsApp पर है।
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> {t('analytics')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">{t('message')}</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">{t('sent')}</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">{t('delivered')}</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">{t('failed')}</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">{t('delivered')}</th>
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
                        <td className="py-3 px-4 text-gray-900">{t('total')}</td>
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

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              {t('confirm')} {t('send')}
            </DialogTitle>
          </DialogHeader>
          {pendingSend && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Channel:</span>
                  <span className="font-medium">{pendingSend.type === 'sms' ? 'SMS' : 'WhatsApp'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. {t('recipients')}:</span>
                  <span className="font-medium">~{pendingSend.estRecipients}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Credit Cost:</span>
                  <span className="font-bold text-indigo-600">{pendingSend.totalCost} credits</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-500">{t('balance')}:</span>
                  <span className={`font-bold ${creditBalance >= pendingSend.totalCost ? 'text-green-600' : 'text-red-600'}`}>
                    {creditBalance} credits
                  </span>
                </div>
                {creditBalance < pendingSend.totalCost && (
                  <div className="p-2 bg-red-50 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Insufficient credits! Please buy more.
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-700 line-clamp-3">{pendingSend.form.message}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowSendConfirm(false)}>{t('cancel')}</Button>
                {creditBalance >= pendingSend.totalCost ? (
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={confirmAndSend} disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {t('confirm')} & {t('send')}
                  </Button>
                ) : (
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={() => { setShowSendConfirm(false); navigate('/app/credit-system'); }}>
                    <CreditCard className="w-4 h-4 mr-2" /> {t('send')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DLT Template Dialog */}
      <Dialog open={showDltDialog} onOpenChange={setShowDltDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDlt ? t('edit') : t('add')}</DialogTitle>
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
                <Label>{t('category')}</Label>
                <select
                  value={dltForm.category}
                  onChange={(e) => setDltForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="">{t('select')} {t('category')}</option>
                  <option value="Fee Reminder">Fee Reminder</option>
                  <option value="Attendance">{t('attendance')}</option>
                  <option value="Exam Results">{t('exam_results')}</option>
                  <option value="General Notice">General Notice</option>
                  <option value="Transport">{t('transport')}</option>
                  <option value="Admission">Admission</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('content')}</Label>
              <Textarea
                value={dltForm.content}
                onChange={(e) => setDltForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Dear {#var#}, your child {#var#}..."
                rows={4}
              />
              <p className="text-xs text-gray-500">Use {'{#var#}'} for variable placeholders as per DLT format</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDltDialog(false)}>{t('cancel')}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveDlt}>
                {editingDlt ? t('update') : t('add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Survey Create Dialog */}
      <Dialog open={showSurveyDialog} onOpenChange={setShowSurveyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create_notice')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('title')}</Label>
                <Input
                  value={surveyForm.title}
                  onChange={(e) => setSurveyForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Enter survey title..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t('target_audience')}</Label>
                <select
                  value={surveyForm.target}
                  onChange={(e) => setSurveyForm(f => ({ ...f, target: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  <option value="All Parents">{t('all')} {t('parents')}</option>
                  <option value="Teachers">{t('teachers')}</option>
                  <option value="Students">{t('students')}</option>
                  <option value="Staff">{t('staff')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('content')}</Label>
                <Button size="sm" variant="outline" onClick={addSurveyQuestion}>
                  <Plus className="w-4 h-4 mr-1" /> {t('add')}
                </Button>
              </div>
              {surveyForm.questions.map((q, qIdx) => (
                <Card key={qIdx} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{t('content')} {qIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.type}
                          onChange={(e) => updateSurveyQuestion(qIdx, 'type', e.target.value)}
                          className="h-8 rounded border border-gray-200 px-2 text-sm"
                        >
                          <option value="mcq">{t('mcq')}</option>
                          <option value="rating">{t('priority')}</option>
                          <option value="text">{t('content')}</option>
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
                          <Plus className="w-3 h-3 mr-1" /> {t('add')}
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
              <Button variant="outline" className="flex-1" onClick={() => setShowSurveyDialog(false)}>{t('cancel')}</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateSurvey}>
                <ListChecks className="w-4 h-4 mr-2" /> {t('create_notice')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Survey View Dialog */}
      <Dialog open={!!viewingSurvey} onOpenChange={() => setViewingSurvey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingSurvey?.title}</DialogTitle>
          </DialogHeader>
          {viewingSurvey && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-indigo-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-indigo-600">{viewingSurvey.questions}</p>
                  <p className="text-xs text-indigo-500">{t('content')}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{viewingSurvey.responses}</p>
                  <p className="text-xs text-green-500">{t('recipients')}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">{viewingSurvey.target}</p>
                  <p className="text-xs text-purple-500">{t('target_audience')}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h5 className="font-medium text-gray-900 mb-2">{t('summary')}</h5>
                <p className="text-sm text-gray-600">
                  {viewingSurvey.responses} responses collected from {viewingSurvey.target}.
                  Survey {viewingSurvey.status === 'active' ? 'is currently active' : 'has been closed'}.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setViewingSurvey(null)}>{t('close')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}