import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowLeft, Loader2, CheckCircle2, Copy, Eye, EyeOff, School, User, Mail, Phone, MapPin, BookOpen, ArrowRight, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const boards = [
  'CBSE', 'ICSE', 'MP Board', 'RBSE', 'UP Board', 'Bihar Board',
  'Maharashtra Board', 'Tamil Nadu Board', 'Karnataka Board', 'AP Board',
  'Telangana Board', 'Gujarat Board', 'Other State Board'
];

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Other'
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser, setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState('');

  const [form, setForm] = useState({
    school_name: '',
    school_board: '',
    school_city: '',
    school_state: '',
    school_phone: '',
    director_name: '',
    director_email: '',
    director_mobile: '',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/register-school`, {
        school_name: form.school_name,
        school_board: form.school_board,
        school_city: form.school_city,
        school_state: form.school_state,
        school_phone: form.school_phone,
        director_name: form.director_name,
        director_email: form.director_email,
        director_mobile: form.director_mobile,
      });

      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || t('registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    if (success?.access_token) {
      localStorage.setItem('token', success.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: success.director.id,
        name: success.director.name,
        email: success.director.email,
        role: 'director',
        school_id: success.school.id,
      }));
      setToken(success.access_token);
      setUser({
        id: success.director.id,
        name: success.director.name,
        email: success.director.email,
        role: 'director',
        school_id: success.school.id,
      });
      axios.defaults.headers.common['Authorization'] = `Bearer ${success.access_token}`;
      navigate('/app/dashboard');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('registration_successful')}</h2>
            <p className="text-sm text-gray-500">{t('save_login_details')}</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-3 flex items-center gap-2">
              <School className="w-4 h-4" /> {t('school_details')}
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('school_name')}</span>
                <span className="font-medium text-gray-900">{success.school.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('school_id')}</span>
                <button onClick={() => handleCopy(success.school.id, 'School ID')} className="font-mono font-medium text-blue-600 flex items-center gap-1 hover:text-blue-700">
                  {success.school.id} <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('board')}</span>
                <span className="font-medium text-gray-900">{success.school.board}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('trial')}</span>
                <span className="font-medium text-green-600">{t('days_free')}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
            <h3 className="font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> {t('login_credentials_save')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('email')}</span>
                <button onClick={() => handleCopy(success.director.email, 'Email')} className="font-medium text-gray-900 flex items-center gap-1 hover:text-blue-600">
                  {success.director.email} <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('password')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">
                    {showPassword ? success.generated_password : '••••••••'}
                  </span>
                  <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleCopy(success.generated_password, 'Password')} className="text-blue-600 hover:text-blue-700">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('role')}</span>
                <span className="font-medium text-gray-900">{t('director_admin')}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-red-500 text-center mb-4 font-medium">{t('save_password_note')}</p>

          <button onClick={handleGoToDashboard} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
            {t('go_to_dashboard')} <ArrowRight className="w-4 h-4" />
          </button>

          <button onClick={() => navigate('/login')} className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            {t('or_sign_in_later')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Schooltino</span>
              </div>
            </button>
            <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-blue-600 font-medium">
              {t('already_registered_sign_in')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('register_your_school')}</h1>
          <p className="text-gray-600 text-sm">{t('fill_basic_details')}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium mt-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('password_auto_generated')}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600" /> {t('school_information')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('school_name')} *</label>
                  <input name="school_name" value={form.school_name} onChange={handleChange} placeholder="e.g. Delhi Public School" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('board')} *</label>
                    <select name="school_board" value={form.school_board} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">{t('select_board')}</option>
                      {boards.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('state')} *</label>
                    <select name="school_state" value={form.school_state} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">{t('select_state')}</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')} *</label>
                    <input name="school_city" value={form.school_city} onChange={handleChange} placeholder="e.g. Bhopal" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                    <input name="school_phone" value={form.school_phone} onChange={handleChange} placeholder="School phone" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> {t('director_admin_details')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('director_name')} *</label>
                  <input name="director_name" value={form.director_name} onChange={handleChange} placeholder={t('full_name')} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} *</label>
                  <input name="director_email" type="email" value={form.director_email} onChange={handleChange} placeholder="director@school.com" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">{t('login_email_note')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('mobile_number')}</label>
                  <input name="director_mobile" value={form.director_mobile} onChange={handleChange} placeholder="10-digit mobile" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t('secure_password_note')}</span>
            </div>

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('register_school')} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('already_have_account')}{' '}
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700 font-medium">{t('sign_in')}</button>
        </p>
      </div>
    </div>
  );
}
