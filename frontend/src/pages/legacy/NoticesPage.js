import { useState, useEffect } from 'react';
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
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import { Plus, Bell, Trash2, Loader2, AlertTriangle, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function NoticesPage() {
  const { t } = useTranslation();
  const { schoolId, hasPermission } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: ['all'],
    valid_till: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchNotices();
    }
  }, [schoolId]);

  const fetchNotices = async () => {
    try {
      const response = await axios.get(`${API}/notices?school_id=${schoolId}`);
      setNotices(response.data);
    } catch (error) {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/notices`, {
        ...formData,
        school_id: schoolId
      });
      toast.success(t('saved_successfully'));
      setIsDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        target_audience: ['all'],
        valid_till: ''
      });
      fetchNotices();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    
    try {
      await axios.delete(`${API}/notices/${id}`);
      toast.success(t('deleted_successfully'));
      fetchNotices();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAudienceChange = (audience) => {
    setFormData(prev => {
      const current = prev.target_audience;
      if (current.includes(audience)) {
        return { ...prev, target_audience: current.filter(a => a !== audience) };
      } else {
        return { ...prev, target_audience: [...current, audience] };
      }
    });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      default:
        return 'priority-low';
    }
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="notices-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('notices')}</h1>
          <p className="text-slate-500 mt-1">School announcements and updates</p>
        </div>
        {hasPermission(['director', 'principal', 'admin', 'teacher']) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-notice-btn">
                <Plus className="w-5 h-5 mr-2" />
                {t('create_notice')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('create_notice')}</DialogTitle>
                <DialogDescription className="sr-only">Notice form</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t('title')} *</Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    data-testid="notice-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('content')} *</Label>
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={4}
                    data-testid="notice-content-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('priority')}</Label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3"
                      data-testid="notice-priority-select"
                    >
                      <option value="low">{t('low')}</option>
                      <option value="normal">{t('normal')}</option>
                      <option value="high">{t('high')}</option>
                      <option value="urgent">{t('urgent')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Till</Label>
                    <Input
                      name="valid_till"
                      type="date"
                      value={formData.valid_till}
                      onChange={handleChange}
                      data-testid="notice-valid-till-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('target_audience')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'teachers', 'students', 'parents'].map(audience => (
                      <button
                        key={audience}
                        type="button"
                        onClick={() => handleAudienceChange(audience)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          formData.target_audience.includes(audience)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        data-testid={`audience-${audience}`}
                      >
                        {t(audience)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-notice-btn">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t('save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t('no_data')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`stat-card ${getPriorityClass(notice.priority)}`}
              data-testid={`notice-card-${notice.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getPriorityIcon(notice.priority)}
                  </div>
                  <div className="flex-1">
                    {/* Notice Header */}
                    {notice.school_name && (
                      <p className="text-sm font-medium text-indigo-600 mb-1">{notice.school_name}</p>
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">{notice.title}</h3>
                    <p className="text-slate-600 mt-2 whitespace-pre-wrap">{notice.content}</p>
                    
                    {/* Signature & Seal Section */}
                    {(notice.signature_url || notice.seal_url) && (
                      <div className="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between">
                        <div className="text-sm text-slate-500">
                          <p>By: {notice.created_by_name}</p>
                          <p>{new Date(notice.created_at).toLocaleDateString('hi-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {notice.signature_url && (
                            <div className="text-center">
                              <img 
                                src={`${(process.env.REACT_APP_BACKEND_URL || '')}${notice.signature_url}`}
                                alt="Signature"
                                className="h-12 object-contain"
                              />
                              <p className="text-xs text-slate-400 mt-1">Signature</p>
                            </div>
                          )}
                          {notice.seal_url && (
                            <div className="text-center">
                              <img 
                                src={`${(process.env.REACT_APP_BACKEND_URL || '')}${notice.seal_url}`}
                                alt="Seal"
                                className="h-14 object-contain"
                              />
                              <p className="text-xs text-slate-400 mt-1">School Seal</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Notice Footer */}
                    {!notice.signature_url && !notice.seal_url && (
                      <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                        <span>By: {notice.created_by_name}</span>
                        <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-1">
                          {notice.target_audience.map(a => (
                            <span key={a} className="badge badge-info capitalize">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {hasPermission(['director', 'principal', 'admin']) && (
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                    data-testid={`delete-notice-${notice.id}`}
                  >
                    <Trash2 className="w-5 h-5 text-rose-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
