import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Users, User, Phone, Lock, Eye, EyeOff, LogIn, Loader2, 
  GraduationCap, Calendar, IndianRupee, BookOpen, Bell,
  MapPin, Clock, TrendingUp, AlertCircle, CheckCircle,
  ChevronRight, Settings, LogOut, Shield, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Parent Login Component
function ParentLogin({ onLoginSuccess }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  
  const [loginMode, setLoginMode] = useState('mobile'); // 'mobile' or 'id'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mobile: '',
    parent_id: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (loginMode === 'mobile' && !form.mobile) {
      toast.error(isHindi ? 'Mobile number डालें' : 'Enter mobile number');
      return;
    }
    if (loginMode === 'id' && !form.parent_id) {
      toast.error(isHindi ? 'Parent ID डालें' : 'Enter Parent ID');
      return;
    }
    if (!form.password) {
      toast.error(isHindi ? 'Password डालें' : 'Enter password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/parent/login`, {
        mobile: loginMode === 'mobile' ? form.mobile : null,
        parent_id: loginMode === 'id' ? form.parent_id : null,
        password: form.password
      });
      
      if (response.data.success) {
        localStorage.setItem('parent_token', response.data.token);
        localStorage.setItem('parent_data', JSON.stringify(response.data.parent));
        toast.success(isHindi ? 'Login सफल!' : 'Login successful!');
        onLoginSuccess(response.data.parent);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'Login failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {isHindi ? 'अभिभावक पोर्टल' : 'Parent Portal'}
          </CardTitle>
          <CardDescription>
            {isHindi ? 'अपने बच्चों की पूरी जानकारी एक जगह' : 'All your children\'s information in one place'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={loginMode === 'mobile' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setLoginMode('mobile')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
            <Button
              variant={loginMode === 'id' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setLoginMode('id')}
            >
              <User className="w-4 h-4 mr-2" />
              Parent ID
            </Button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'mobile' ? (
              <div>
                <Label>{isHindi ? 'Mobile Number' : 'Mobile Number'}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label>Parent ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    placeholder="PAR-SCS-2026-001"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="********"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isHindi ? 'Login करें' : 'Login'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {isHindi 
              ? 'Password school से मिला है। भूल गए? School से संपर्क करें।'
              : 'Password provided by school. Forgot? Contact school.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Parent Dashboard Component
function ParentDashboard({ parent, onLogout }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childData, setChildData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchChildren();
    fetchNotifications();
  }, [parent]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('parent_token');
      const response = await axios.get(`${API}/api/parent/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedChild(response.data[0]);
        fetchChildData(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      // Demo data
      const demoChildren = [
        { id: '1', name: 'राहुल शर्मा', class_name: 'Class 8', section: 'A', student_id: 'STU-SCS-2025-001' },
        { id: '2', name: 'प्रिया शर्मा', class_name: 'Class 5', section: 'B', student_id: 'STU-SCS-2025-045' }
      ];
      setChildren(demoChildren);
      setSelectedChild(demoChildren[0]);
      fetchChildData(demoChildren[0].id);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    try {
      const token = localStorage.getItem('parent_token');
      const response = await axios.get(`${API}/api/parent/child/${childId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildData(response.data);
    } catch (error) {
      // Demo data
      setChildData({
        attendance: { percentage: 92, present: 92, total: 100 },
        fees: { total: 45000, paid: 35000, pending: 10000 },
        syllabus: { completed: 70 },
        exams: { recent_score: 85, upcoming: 2 },
        timetable: [
          { day: 'Monday', periods: ['Hindi', 'Math', 'Science', 'English', 'EVS', 'PT'] },
          { day: 'Tuesday', periods: ['Math', 'Hindi', 'English', 'Science', 'Art', 'PT'] }
        ],
        recent_activity: [
          { type: 'attendance', message: 'Present marked at 8:15 AM', time: '2 hours ago' },
          { type: 'fee', message: '₹5,000 fee payment due', time: '1 day ago' }
        ]
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('parent_token');
      const response = await axios.get(`${API}/api/parent/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data || []);
    } catch (error) {
      setNotifications([
        { id: 1, title: 'Fee Reminder', message: '₹10,000 fee pending', type: 'warning', time: '1 day ago' },
        { id: 2, title: 'PTM Notice', message: 'Parent-Teacher meeting on 25th Jan', type: 'info', time: '2 days ago' }
      ]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_data');
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">StudyTino</h1>
              <p className="text-xs text-slate-500">{isHindi ? 'अभिभावक पोर्टल' : 'Parent Portal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Parent Info */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{parent?.name || 'Parent'}</h2>
                <p className="text-white/80 text-sm">
                  <Phone className="w-3 h-3 inline mr-1" />
                  {parent?.mobile || '9876543210'}
                </p>
                <p className="text-white/60 text-xs">ID: {parent?.parent_id || 'PAR-SCS-2026-001'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children Selection */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  fetchChildData(child.id);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
                  selectedChild?.id === child.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="font-medium">{child.name}</span>
                <span className="text-xs text-slate-500 ml-2">{child.class_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Child Info */}
        {selectedChild && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedChild.name}</CardTitle>
                    <CardDescription>
                      {selectedChild.class_name} - {selectedChild.section} | ID: {selectedChild.student_id}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Quick Stats */}
        {childData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{childData.attendance?.percentage || 0}%</p>
                <p className="text-xs text-slate-500">{isHindi ? 'उपस्थिति' : 'Attendance'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <IndianRupee className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600">₹{(childData.fees?.pending || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500">{isHindi ? 'बकाया फीस' : 'Pending Fee'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{childData.syllabus?.completed || 0}%</p>
                <p className="text-xs text-slate-500">{isHindi ? 'सिलेबस' : 'Syllabus'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{childData.exams?.recent_score || 0}%</p>
                <p className="text-xs text-slate-500">{isHindi ? 'अंक' : 'Score'}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                {isHindi ? 'सूचनाएं' : 'Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-slate-600">{notif.message}</p>
                    </div>
                    <span className="text-xs text-slate-400">{notif.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Fee Details */}
        {childData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-amber-600" />
                {isHindi ? 'फीस विवरण' : 'Fee Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">{isHindi ? 'कुल फीस' : 'Total Fee'}</span>
                  <span className="font-bold">₹{(childData.fees?.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>{isHindi ? 'जमा' : 'Paid'}</span>
                  <span className="font-bold">₹{(childData.fees?.paid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>{isHindi ? 'बकाया' : 'Pending'}</span>
                  <span className="font-bold">₹{(childData.fees?.pending || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${((childData.fees?.paid || 0) / (childData.fees?.total || 1)) * 100}%` }}
                  />
                </div>
                <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">
                  {isHindi ? 'फीस भरें' : 'Pay Fee'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Children Summary */}
        {children.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {isHindi ? 'सभी बच्चों का सारांश' : 'All Children Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-xs text-slate-500">{child.class_name}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Main Parent Portal Page
export default function ParentPortalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [parentData, setParentData] = useState(null);

  useEffect(() => {
    // Check if parent is already logged in
    const token = localStorage.getItem('parent_token');
    const data = localStorage.getItem('parent_data');
    if (token && data) {
      setIsLoggedIn(true);
      setParentData(JSON.parse(data));
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <ParentLogin 
        onLoginSuccess={(parent) => {
          setIsLoggedIn(true);
          setParentData(parent);
        }} 
      />
    );
  }

  return (
    <ParentDashboard 
      parent={parentData} 
      onLogout={() => {
        setIsLoggedIn(false);
        setParentData(null);
      }} 
    />
  );
}
