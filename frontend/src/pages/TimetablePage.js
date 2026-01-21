import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Calendar, Clock, Users, BookOpen, Plus, RefreshCw,
  Wand2, AlertTriangle, CheckCircle2, User, Settings,
  Repeat, ArrowRight, Download, Printer
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_COLORS = [
  'bg-blue-500/10 border-blue-500/30',
  'bg-green-500/10 border-green-500/30',
  'bg-purple-500/10 border-purple-500/30',
  'bg-amber-500/10 border-amber-500/30',
  'bg-pink-500/10 border-pink-500/30',
  'bg-indigo-500/10 border-indigo-500/30',
  'bg-red-500/10 border-red-500/30',
  'bg-teal-500/10 border-teal-500/30',
];

export default function TimetablePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [showProxyDialog, setShowProxyDialog] = useState(false);

  const schoolId = user?.school_id || 'SCH-DEMO-2026';

  const [allocationForm, setAllocationForm] = useState({
    subject: '',
    teacher_id: '',
    periods_per_week: 5
  });

  const [proxyForm, setProxyForm] = useState({
    original_teacher_id: '',
    substitute_teacher_id: '',
    date: new Date().toISOString().split('T')[0],
    periods: [],
    reason: ''
  });

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/classes?school_id=${schoolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClasses(data.classes || data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [schoolId]);

  const fetchTimetable = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [ttRes, allocRes] = await Promise.all([
        fetch(`${API_URL}/api/timetable/${classId}?school_id=${schoolId}`, { headers }),
        fetch(`${API_URL}/api/timetable/allocations/${classId}?school_id=${schoolId}`, { headers })
      ]);
      
      const ttData = await ttRes.json();
      const allocData = await allocRes.json();
      
      setTimetable(ttData.exists ? ttData : null);
      setAllocations(allocData.allocations || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [analyticsRes, conflictsRes] = await Promise.all([
        fetch(`${API_URL}/api/timetable/analytics?school_id=${schoolId}`, { headers }),
        fetch(`${API_URL}/api/timetable/conflicts?school_id=${schoolId}`, { headers })
      ]);
      
      setAnalytics(await analyticsRes.json());
      setConflicts((await conflictsRes.json()).conflicts || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchClasses();
    fetchAnalytics();
  }, [fetchClasses, fetchAnalytics]);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
    }
  }, [selectedClass, fetchTimetable]);

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast.error('Pehle class select karein');
      return;
    }

    if (allocations.length === 0) {
      toast.error('Pehle subjects aur teachers allocate karein');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/timetable/generate?class_id=${selectedClass}&school_id=${schoolId}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Timetable generated!');
        fetchTimetable(selectedClass);
        fetchAnalytics();
      } else {
        toast.error(data.detail || 'Generation failed');
      }
    } catch (error) {
      toast.error('Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddAllocation = async (e) => {
    e.preventDefault();
    if (!selectedClass || !allocationForm.subject || !allocationForm.teacher_id) {
      toast.error('Subject aur teacher required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/timetable/allocations?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          ...allocationForm
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Allocation added!');
        setShowAllocationDialog(false);
        setAllocationForm({ subject: '', teacher_id: '', periods_per_week: 5 });
        fetchTimetable(selectedClass);
      }
    } catch (error) {
      toast.error('Failed to add allocation');
    }
  };

  const handleRequestProxy = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/timetable/proxy?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Proxy assigned!');
        setShowProxyDialog(false);
      }
    } catch (error) {
      toast.error('Failed to assign proxy');
    }
  };

  const getSubjectColor = (subject) => {
    const index = allocations.findIndex(a => a.subject === subject);
    return PERIOD_COLORS[index % PERIOD_COLORS.length];
  };

  return (
    <div className="space-y-6" data-testid="timetable-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-500" />
            Timetable Management
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-Powered Auto Timetable Scheduler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowProxyDialog(true)}>
            <Repeat className="w-4 h-4 mr-2" />
            Proxy
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Classes with Timetable</p>
                  <p className="text-2xl font-bold">{analytics.classes_with_timetable}</p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Allocations</p>
                  <p className="text-2xl font-bold">{analytics.total_allocations}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today Proxies</p>
                  <p className="text-2xl font-bold">{analytics.today_proxies}</p>
                </div>
                <Repeat className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className={conflicts.length > 0 ? 'border-red-500' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conflicts</p>
                  <p className={`text-2xl font-bold ${conflicts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {conflicts.length}
                  </p>
                </div>
                {conflicts.length > 0 ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class Selection */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="">Select a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowAllocationDialog(true)} disabled={!selectedClass}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedClass || generating || allocations.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Auto Generate</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Tabs defaultValue="timetable" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="allocations">Subject Allocations ({allocations.length})</TabsTrigger>
          </TabsList>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : !timetable ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Koi timetable nahi</h3>
                  <p className="text-muted-foreground mt-1">Subjects allocate karke &quot;Auto Generate&quot; click karein</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4 overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="p-2 text-left font-medium text-muted-foreground">Period</th>
                        {DAYS.map(day => (
                          <th key={day} className="p-2 text-center font-medium">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }, (_, i) => i + 1).map(periodNum => (
                        <tr key={periodNum}>
                          <td className="p-2 font-medium text-muted-foreground">{periodNum}</td>
                          {DAYS.map(day => {
                            const period = timetable.schedule?.[day]?.find(p => p.period === periodNum);
                            if (!period) return <td key={day} className="p-2" />;
                            
                            if (period.type === 'break' || period.type === 'lunch') {
                              return (
                                <td key={day} className="p-2">
                                  <div className="p-2 rounded-lg bg-slate-100 text-center text-sm text-muted-foreground">
                                    {period.subject}
                                  </div>
                                </td>
                              );
                            }
                            
                            return (
                              <td key={day} className="p-2">
                                <div className={`p-2 rounded-lg border ${getSubjectColor(period.subject)}`}>
                                  <p className="font-medium text-sm">{period.subject}</p>
                                  <p className="text-xs text-muted-foreground">{period.teacher_name}</p>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="mt-4">
            {allocations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Koi subject allocate nahi</h3>
                  <p className="text-muted-foreground mt-1">Pehle subjects aur teachers add karein</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allocations.map((alloc, idx) => (
                  <Card key={alloc.id || idx} className={`border-l-4 ${PERIOD_COLORS[idx % PERIOD_COLORS.length].split(' ')[0].replace('/10', '/50')}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{alloc.subject}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> {alloc.teacher_name}
                          </p>
                        </div>
                        <Badge variant="outline">{alloc.periods_per_week} periods/week</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Add Allocation Dialog */}
      <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Subject Allocation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAllocation} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={allocationForm.subject}
                onChange={(e) => setAllocationForm({...allocationForm, subject: e.target.value})}
                placeholder="Mathematics, Science, English..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teacher ID *</label>
              <Input
                value={allocationForm.teacher_id}
                onChange={(e) => setAllocationForm({...allocationForm, teacher_id: e.target.value})}
                placeholder="Teacher ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Periods per Week</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={allocationForm.periods_per_week}
                onChange={(e) => setAllocationForm({...allocationForm, periods_per_week: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAllocationDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Allocation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Proxy Dialog */}
      <Dialog open={showProxyDialog} onOpenChange={setShowProxyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Proxy/Substitute</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestProxy} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Original Teacher ID</label>
                <Input
                  value={proxyForm.original_teacher_id}
                  onChange={(e) => setProxyForm({...proxyForm, original_teacher_id: e.target.value})}
                  placeholder="Teacher on leave"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Substitute Teacher ID</label>
                <Input
                  value={proxyForm.substitute_teacher_id}
                  onChange={(e) => setProxyForm({...proxyForm, substitute_teacher_id: e.target.value})}
                  placeholder="Proxy teacher"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={proxyForm.date}
                onChange={(e) => setProxyForm({...proxyForm, date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={proxyForm.reason}
                onChange={(e) => setProxyForm({...proxyForm, reason: e.target.value})}
                placeholder="Sick leave, training, etc."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowProxyDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                <Repeat className="w-4 h-4 mr-2" />
                Assign Proxy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
