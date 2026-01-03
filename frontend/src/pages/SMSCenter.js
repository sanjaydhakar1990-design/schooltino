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
} from '../components/ui/dialog';
import { 
  MessageSquare, Send, Users, GraduationCap, Loader2,
  Check, AlertCircle, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SMSCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [form, setForm] = useState({
    recipient_type: 'all_parents',
    class_id: '',
    student_id: '',
    mobile: '',
    message: '',
    template: ''
  });

  useEffect(() => {
    fetchTemplates();
    fetchClasses();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API}/sms/templates`);
      setTemplates(res.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/classes`);
      setClasses(res.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const handleTemplateSelect = (template) => {
    setForm(f => ({
      ...f,
      template: template.id,
      message: template.message
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const res = await axios.post(`${API}/sms/send`, form);
      setSendResult(res.data);
      setShowResultDialog(true);
      toast.success(`SMS sent to ${res.data.recipients_count} recipients!`);
    } catch (error) {
      toast.error('Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const handleWhatsAppBroadcast = () => {
    const text = encodeURIComponent(form.message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6" data-testid="sms-center">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              SMS & WhatsApp Center
            </h1>
            <p className="text-green-100 mt-2">
              Parents को SMS या WhatsApp भेजो - Fee reminders, notices, alerts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMS Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Compose Message</h3>
          
          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient Type */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, recipient_type: 'all_parents' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.recipient_type === 'all_parents' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-green-200'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">All Parents</p>
                  <p className="text-xs text-slate-500">Send to everyone</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, recipient_type: 'class' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.recipient_type === 'class' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-green-200'
                  }`}
                >
                  <GraduationCap className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">By Class</p>
                  <p className="text-xs text-slate-500">Select a class</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, recipient_type: 'individual' }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.recipient_type === 'individual' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-green-200'
                  }`}
                >
                  <Phone className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Individual</p>
                  <p className="text-xs text-slate-500">Single number</p>
                </button>
              </div>
            </div>

            {/* Class Selection */}
            {form.recipient_type === 'class' && (
              <div className="space-y-2">
                <Label>Select Class</Label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))}
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

            {/* Individual Mobile */}
            {form.recipient_type === 'individual' && (
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
                  placeholder="9876543210"
                  required
                />
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Type your message here..."
                rows={4}
                required
              />
              <p className="text-xs text-slate-500">{form.message.length}/160 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send SMS
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleWhatsAppBroadcast}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 mr-2" />
                Share via WhatsApp
              </Button>
            </div>
          </form>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">📋 Quick Templates</h3>
          <div className="space-y-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full p-3 rounded-lg text-left border transition-all ${
                  form.template === template.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 hover:border-green-200'
                }`}
              >
                <p className="font-medium text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.message}</p>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2">💡 Tips</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Use {'{student_name}'} for personalization</li>
              <li>• Keep SMS under 160 chars for 1 SMS cost</li>
              <li>• WhatsApp is FREE for broadcasts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              SMS Sent Successfully!
            </DialogTitle>
          </DialogHeader>
          {sendResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                <p className="text-3xl font-bold text-green-600">{sendResult.recipients_count}</p>
                <p className="text-green-700">Recipients</p>
              </div>
              <div className="text-center text-slate-600">
                <p>Message ID: {sendResult.id}</p>
                <p className="text-sm">Sent at: {new Date(sendResult.sent_at).toLocaleString()}</p>
              </div>
              <Button onClick={() => setShowResultDialog(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SMS Info Note */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium">Note: SMS Integration</p>
            <p>SMS feature is currently in demo mode. For production, integrate with Twilio or MSG91 for actual SMS delivery. WhatsApp sharing works directly!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
