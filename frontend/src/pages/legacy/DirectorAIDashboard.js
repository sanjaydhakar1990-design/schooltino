import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Brain, Activity, Users, Wallet, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Clock, Send, Mic, Volume2,
  ClipboardCheck, DoorOpen, Bus, Heart, Fingerprint, Calendar,
  ChevronRight, RefreshCw, MessageSquare, Sparkles, Shield,
  Eye, Target, Zap, BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const API_URL = (process.env.REACT_APP_BACKEND_URL || '');

const priorityColors = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-green-500/10 text-green-600 border-green-500/30'
};

const healthColors = {
  green: 'from-emerald-500 to-green-500',
  blue: 'from-blue-500 to-indigo-500',
  yellow: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-pink-500'
};

const departmentIcons = {
  'clipboard-check': ClipboardCheck,
  'wallet': Wallet,
  'door-open': DoorOpen,
  'bus': Bus,
  'heart': Heart,
  'fingerprint': Fingerprint
};

export default function DirectorAIDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [askingAi, setAskingAi] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const schoolId = user?.school_id || 'school123';

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, deptRes] = await Promise.all([
        fetch(`${API_URL}/api/director-ai/dashboard?school_id=${schoolId}`),
        fetch(`${API_URL}/api/director-ai/department-status?school_id=${schoolId}`)
      ]);
      
      setDashboard(await dashRes.json());
      const deptData = await deptRes.json();
      setDepartments(deptData.departments || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Dashboard load nahi ho paya');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAskingAi(true);
    try {
      const res = await fetch(`${API_URL}/api/director-ai/ask?question=${encodeURIComponent(question)}&school_id=${schoolId}`, {
        method: 'POST'
      });
      const data = await res.json();
      setAiResponse(data);
      setQuestion('');
    } catch (error) {
      toast.error('AI response nahi mila');
    } finally {
      setAskingAi(false);
    }
  };

  const handleVoiceBriefing = async () => {
    try {
      setSpeaking(true);
      const res = await fetch(`${API_URL}/api/director-ai/voice-briefing?school_id=${schoolId}`);
      const data = await res.json();
      
      // Use browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.briefing_text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      } else {
        toast.error('Voice not supported in this browser');
        setSpeaking(false);
      }
    } catch (error) {
      toast.error('Voice briefing failed');
      setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto text-indigo-500 animate-pulse" />
          <p className="mt-4 text-lg">Director AI Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="director-ai-dashboard">
      {/* Header with AI Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur">
              <Brain className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Director AI</h1>
              <p className="text-white/80 text-sm md:text-base">{dashboard?.greeting}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={speaking ? stopSpeaking : handleVoiceBriefing}
              variant="secondary"
              className={`gap-2 ${speaking ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
            >
              {speaking ? (
                <><Volume2 className="w-4 h-4 animate-pulse" /> Stop</>
              ) : (
                <><Volume2 className="w-4 h-4" /> Voice Briefing</>
              )}
            </Button>
            <Button onClick={fetchDashboard} variant="secondary" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Health Score */}
        {dashboard?.health_score && (
          <div className="relative mt-6 p-4 bg-white/10 backdrop-blur rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">School Health Score</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-bold">{dashboard.health_score.score}</span>
                  <span className="text-xl">/100</span>
                  <Badge className={`bg-white/20 text-white`}>
                    {dashboard.health_score.status}
                  </Badge>
                </div>
              </div>
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${healthColors[dashboard.health_score.color]} flex items-center justify-center`}>
                <Shield className="w-10 h-10" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students Present</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard?.school_pulse?.today_attendance || 0}</p>
                <p className="text-xs text-muted-foreground">{dashboard?.school_pulse?.attendance_percentage}% attendance</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today Collection</p>
                <p className="text-2xl font-bold text-green-600">₹{(dashboard?.school_pulse?.today_collection || 0).toLocaleString()}</p>
              </div>
              <Wallet className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <p className="text-2xl font-bold text-amber-600">₹{(dashboard?.school_pulse?.pending_fees || 0).toLocaleString()}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-3xl font-bold text-purple-600">{(dashboard?.school_pulse?.total_teachers || 0) + (dashboard?.school_pulse?.total_staff || 0)}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              Aaj Ki Priority Orders
            </CardTitle>
            <CardDescription>Director AI ke orders - follow karein</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard?.daily_orders?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sab kuch theek hai! Koi urgent order nahi.</p>
            ) : (
              dashboard?.daily_orders?.map((order, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${priorityColors[order.priority]} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => order.action_link && navigate(order.action_link)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center font-bold text-sm">
                      {order.order_no}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{order.command}</span>
                        <Badge variant="outline" className="text-xs">{order.priority_label}</Badge>
                      </div>
                      <p className="text-sm opacity-80">{order.reason}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Insights
            </CardTitle>
            <CardDescription>Automatic analysis by Director AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard?.insights?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sab normal hai. Koi special insight nahi.</p>
            ) : (
              dashboard?.insights?.map((insight, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => insight.action_link && navigate(insight.action_link)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={priorityColors[insight.priority]}>{insight.title}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                  {insight.action && (
                    <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                      {insight.action} <ChevronRight className="w-3 h-3" />
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {dashboard?.alerts?.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts - Immediate Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="font-medium text-red-700">{alert.title}</p>
                  <p className="text-sm text-red-600">{alert.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            Department Status - Live Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept, idx) => {
              const IconComponent = departmentIcons[dept.icon] || Activity;
              return (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border text-center hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                    <IconComponent className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-medium text-sm">{dept.name}</h4>
                  <p className="text-2xl font-bold text-indigo-600">{dept.metric}</p>
                  <p className="text-xs text-muted-foreground">{dept.metric_label}</p>
                  <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 inline-block" />
                    Active
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ask Director AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Ask Director AI
          </CardTitle>
          <CardDescription>Kuch bhi poochho - attendance, fees, students, teachers...</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAskAI} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Aaj kitne students present hain?"
              className="flex-1"
              disabled={askingAi}
            />
            <Button type="submit" disabled={askingAi || !question.trim()}>
              {askingAi ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          
          {aiResponse && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-indigo-900">{aiResponse.response}</p>
                  {aiResponse.action_suggestion && (
                    <Button variant="link" className="p-0 h-auto text-indigo-600 mt-2">
                      {aiResponse.action_suggestion} <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
