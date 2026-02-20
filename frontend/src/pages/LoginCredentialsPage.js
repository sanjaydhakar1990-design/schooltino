import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Key, Search, Copy, Eye, EyeOff, Users, GraduationCap, RefreshCw,
  Loader2, Shield, Download, Mail, Phone, User, Check, AlertTriangle,
  Filter, ChevronDown, ChevronRight, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function LoginCredentialsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ staff: [], students: [] });
  const [search, setSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [resetDialog, setResetDialog] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [expandedClasses, setExpandedClasses] = useState({});

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const params = { type: 'all' };
      const res = await axios.get(`${API}/api/admin/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCredentials(res.data);
    } catch (err) {
      toast.error(isHindi ? 'डेटा लोड करने में त्रुटि' : 'Failed to load credentials');
    }
    setLoading(false);
  }, [token, isHindi]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const classList = useMemo(() => {
    const classes = new Map();
    credentials.students.forEach(s => {
      const cn = s.class_name || (isHindi ? 'बिना कक्षा' : 'No Class');
      if (!classes.has(cn)) {
        classes.set(cn, 0);
      }
      classes.set(cn, classes.get(cn) + 1);
    });
    const sorted = Array.from(classes.entries()).sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, '')) || 999;
      const numB = parseInt(b[0].replace(/\D/g, '')) || 999;
      if (numA !== numB) return numA - numB;
      return a[0].localeCompare(b[0]);
    });
    return sorted;
  }, [credentials.students, isHindi]);

  const roleList = useMemo(() => {
    const roles = new Map();
    credentials.staff.forEach(s => {
      const r = s.role || 'unknown';
      if (!roles.has(r)) roles.set(r, 0);
      roles.set(r, roles.get(r) + 1);
    });
    return Array.from(roles.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [credentials.staff]);

  const studentsGroupedByClass = useMemo(() => {
    const groups = {};
    const filtered = credentials.students.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) &&
            !s.student_id?.toLowerCase().includes(q) &&
            !s.father_name?.toLowerCase().includes(q))
          return false;
      }
      if (selectedClass !== 'all') {
        const cn = s.class_name || (isHindi ? 'बिना कक्षा' : 'No Class');
        if (cn !== selectedClass) return false;
      }
      return true;
    });

    filtered.forEach(s => {
      const cn = s.class_name || (isHindi ? 'बिना कक्षा' : 'No Class');
      if (!groups[cn]) groups[cn] = [];
      groups[cn].push(s);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 999;
      const numB = parseInt(b.replace(/\D/g, '')) || 999;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    return sortedKeys.map(k => ({ className: k, students: groups[k] }));
  }, [credentials.students, search, selectedClass, isHindi]);

  const filteredStaff = useMemo(() => {
    return credentials.staff.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) &&
            !s.email?.toLowerCase().includes(q) &&
            !s.role?.toLowerCase().includes(q))
          return false;
      }
      if (selectedRole !== 'all' && s.role !== selectedRole) return false;
      return true;
    });
  }, [credentials.staff, search, selectedRole]);

  const totalFilteredStudents = useMemo(() =>
    studentsGroupedByClass.reduce((sum, g) => sum + g.students.length, 0),
    [studentsGroupedByClass]
  );

  const togglePassword = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`${label} ${isHindi ? 'कॉपी किया' : 'copied'}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      toast.error(isHindi ? 'पासवर्ड कम से कम 4 अक्षर का होना चाहिए' : 'Password must be at least 4 characters');
      return;
    }
    setResetting(true);
    try {
      const endpoint = resetDialog.type === 'staff'
        ? `${API}/api/employees/${resetDialog.employee_id}/reset-password`
        : `${API}/api/students/${resetDialog.id}/reset-password`;

      await axios.put(endpoint, { new_password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${resetDialog.name} ${isHindi ? 'का पासवर्ड रीसेट हो गया' : "'s password reset successfully"}`);
      setResetDialog(null);
      setNewPassword('');
      fetchCredentials();
    } catch (err) {
      toast.error(err.response?.data?.detail || (isHindi ? 'पासवर्ड रीसेट विफल' : 'Password reset failed'));
    }
    setResetting(false);
  };

  const exportCredentials = () => {
    const data = activeTab === 'staff' ? filteredStaff : credentials.students.filter(s => {
      if (selectedClass !== 'all') {
        const cn = s.class_name || (isHindi ? 'बिना कक्षा' : 'No Class');
        return cn === selectedClass;
      }
      return true;
    });
    if (!data.length) {
      toast.error(isHindi ? 'कोई डेटा नहीं' : 'No data to export');
      return;
    }

    let csv = '';
    if (activeTab === 'staff') {
      csv = 'Name,Email (Login ID),Role,Password\n';
      data.forEach(s => {
        csv += `"${s.name}","${s.email}","${s.role}","${s.password || 'Not Available'}"\n`;
      });
    } else {
      csv = 'Name,Student ID (Login ID),Class,Password,Father Name,Mobile\n';
      data.forEach(s => {
        csv += `"${s.name}","${s.student_id}","${s.class_name}","${s.password || 'Not Available'}","${s.father_name || ''}","${s.mobile || ''}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_credentials${selectedClass !== 'all' ? `_${selectedClass.replace(/\s/g, '_')}` : ''}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isHindi ? 'CSV डाउनलोड हो गया' : 'CSV downloaded');
  };

  const toggleClassExpand = (className) => {
    setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }));
  };

  const expandAll = () => {
    const all = {};
    studentsGroupedByClass.forEach(g => { all[g.className] = true; });
    setExpandedClasses(all);
  };

  const collapseAll = () => {
    setExpandedClasses({});
  };

  if (user?.role !== 'director') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isHindi ? 'पहुँच अस्वीकृत' : 'Access Denied'}
          </h2>
          <p className="text-gray-500">
            {isHindi ? 'केवल डायरेक्टर इस पेज को देख सकते हैं' : 'Only Director can access this page'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-6 h-6 text-amber-600" />
              {isHindi ? 'लॉगिन क्रेडेंशियल्स' : 'Login Credentials'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isHindi ? 'सभी स्टाफ और छात्रों के लॉगिन विवरण देखें और प्रबंधित करें'
                : 'View and manage login details for all staff and students'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCredentials}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {isHindi ? 'रिफ्रेश' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCredentials}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              {isHindi ? 'CSV डाउनलोड' : 'Download CSV'}
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {isHindi
              ? 'यह संवेदनशील जानकारी है। पासवर्ड केवल अधिकृत व्यक्तियों के साथ साझा करें।'
              : 'This is sensitive information. Only share passwords with authorized individuals.'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 rounded-xl p-1.5">
        <button
          onClick={() => { setActiveTab('staff'); setSearch(''); setSelectedClass('all'); setSelectedRole('all'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'staff'
              ? 'bg-white shadow-sm text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          {isHindi ? 'स्टाफ / टीचर' : 'Staff / Teachers'}
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {credentials.staff.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('students'); setSearch(''); setSelectedClass('all'); setSelectedRole('all'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'students'
              ? 'bg-white shadow-sm text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          {isHindi ? 'छात्र' : 'Students'}
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
            {credentials.students.length}
          </span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isHindi
              ? (activeTab === 'staff' ? 'नाम, ईमेल या रोल से खोजें...' : 'नाम, Student ID या पिता के नाम से खोजें...')
              : (activeTab === 'staff' ? 'Search by name, email, or role...' : 'Search by name, Student ID, or father name...')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {activeTab === 'students' && classList.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">{isHindi ? 'सभी कक्षाएं' : 'All Classes'} ({credentials.students.length})</option>
              {classList.map(([cn, count]) => (
                <option key={cn} value={cn}>{cn} ({count})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {activeTab === 'staff' && roleList.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">{isHindi ? 'सभी भूमिकाएं' : 'All Roles'} ({credentials.staff.length})</option>
              {roleList.map(([role, count]) => (
                <option key={role} value={role} className="capitalize">{role} ({count})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : activeTab === 'staff' ? (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">{isHindi ? 'नाम' : 'Name'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">{isHindi ? 'लॉगिन ID (ईमेल)' : 'Login ID (Email)'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">{isHindi ? 'भूमिका' : 'Role'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">{isHindi ? 'पासवर्ड' : 'Password'}</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-blue-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{emp.name}</span>
                          {emp.mobile && <p className="text-xs text-gray-400">{emp.mobile}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">{emp.email || '-'}</code>
                        {emp.email && (
                          <button
                            onClick={() => copyToClipboard(emp.email, `email-${emp.id}`, 'Login ID')}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            {copiedId === `email-${emp.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.password ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded font-mono text-gray-800">
                            {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                          </code>
                          <button onClick={() => togglePassword(emp.id)} className="text-gray-400 hover:text-gray-600 p-1">
                            {visiblePasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(emp.password, `pwd-${emp.id}`, 'Password')}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            {copiedId === `pwd-${emp.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          {isHindi ? 'उपलब्ध नहीं' : 'Not available'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          setResetDialog({ ...emp, type: 'staff' });
                          setNewPassword('');
                        }}
                      >
                        <Key className="w-3 h-3" />
                        {isHindi ? 'रीसेट' : 'Reset'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>{isHindi ? 'कोई स्टाफ नहीं मिला' : 'No staff found'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isHindi
                ? `${studentsGroupedByClass.length} कक्षाओं में ${totalFilteredStudents} छात्र`
                : `${totalFilteredStudents} students in ${studentsGroupedByClass.length} classes`}
            </p>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                {isHindi ? 'सभी खोलें' : 'Expand All'}
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={collapseAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                {isHindi ? 'सभी बंद करें' : 'Collapse All'}
              </button>
            </div>
          </div>

          {studentsGroupedByClass.map(group => (
            <div key={group.className} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => toggleClassExpand(group.className)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedClasses[group.className]
                    ? <ChevronDown className="w-4 h-4 text-purple-600" />
                    : <ChevronRight className="w-4 h-4 text-purple-600" />
                  }
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-purple-800 text-sm">{group.className}</span>
                  <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
                    {group.students.length} {isHindi ? 'छात्र' : 'students'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const allVisible = group.students.every(s => visiblePasswords[s.id]);
                      const newState = {};
                      group.students.forEach(s => { newState[s.id] = !allVisible; });
                      setVisiblePasswords(prev => ({ ...prev, ...newState }));
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-purple-100"
                  >
                    <Eye className="w-3 h-3" />
                    {isHindi ? 'सभी पासवर्ड' : 'Toggle All'}
                  </button>
                </div>
              </button>

              {expandedClasses[group.className] && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">#</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">{isHindi ? 'नाम' : 'Name'}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">{isHindi ? 'Student ID (लॉगिन)' : 'Student ID (Login)'}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">{isHindi ? 'पासवर्ड' : 'Password'}</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">{isHindi ? 'पिता का नाम' : 'Father'}</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-slate-600 text-xs">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map((stu, idx) => (
                        <tr key={stu.id} className="border-b border-slate-50 hover:bg-purple-50/30">
                          <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs">
                                {stu.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-slate-800 text-sm">{stu.name}</span>
                                {stu.mobile && <p className="text-xs text-gray-400">{stu.mobile}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">{stu.student_id}</code>
                              <button
                                onClick={() => copyToClipboard(stu.student_id, `sid-${stu.id}`, 'Student ID')}
                                className="text-blue-500 hover:text-blue-700 p-1"
                              >
                                {copiedId === `sid-${stu.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {stu.password ? (
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded font-mono text-gray-800">
                                  {visiblePasswords[stu.id] ? stu.password : '••••••••'}
                                </code>
                                <button onClick={() => togglePassword(stu.id)} className="text-gray-400 hover:text-gray-600 p-1">
                                  {visiblePasswords[stu.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(stu.password, `pwd-${stu.id}`, 'Password')}
                                  className="text-blue-500 hover:text-blue-700 p-1"
                                >
                                  {copiedId === `pwd-${stu.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                {isHindi ? 'उपलब्ध नहीं' : 'Not available'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{stu.father_name || '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                setResetDialog({ ...stu, type: 'student' });
                                setNewPassword('');
                              }}
                            >
                              <Key className="w-3 h-3" />
                              {isHindi ? 'रीसेट' : 'Reset'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {studentsGroupedByClass.length === 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-10 text-center text-slate-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{isHindi ? 'कोई छात्र नहीं मिला' : 'No students found'}</p>
            </div>
          )}
        </div>
      )}

      {resetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setResetDialog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-600" />
              {isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-900">{resetDialog.name}</p>
              <p className="text-sm text-slate-500">
                {resetDialog.type === 'staff'
                  ? `${resetDialog.email} • ${resetDialog.role}`
                  : `${resetDialog.student_id} • ${resetDialog.class_name || ''}`}
              </p>
              {resetDialog.password && (
                <p className="text-xs text-amber-600 mt-1">
                  {isHindi ? 'वर्तमान पासवर्ड' : 'Current password'}: <code className="bg-amber-50 px-1.5 py-0.5 rounded">{resetDialog.password}</code>
                </p>
              )}
            </div>
            <div className="space-y-3 mb-4">
              <Label className="text-gray-700">{isHindi ? 'नया पासवर्ड' : 'New Password'}</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={isHindi ? 'नया पासवर्ड डालें' : 'Enter new password'}
                className="text-gray-900 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResetDialog(null)}
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleResetPassword}
                disabled={resetting || !newPassword}
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Password'}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}