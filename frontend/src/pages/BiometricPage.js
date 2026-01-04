import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Fingerprint, Scan, Users, Clock, CheckCircle2, XCircle,
  Plus, RefreshCw, Signal, SignalZero, AlertCircle, 
  UserPlus, Activity, BarChart3, Wifi, WifiOff,
  Calendar, Download, Settings
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

const deviceTypeLabels = {
  fingerprint: 'Fingerprint Scanner',
  face: 'Face Recognition',
  card: 'RFID Card',
  multi: 'Multi-Modal'
};

export default function BiometricPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [liveAttendance, setLiveAttendance] = useState(null);
  const [todayPunches, setTodayPunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const schoolId = user?.school_id || 'school123';

  const [deviceForm, setDeviceForm] = useState({
    device_name: '',
    device_type: 'fingerprint',
    location: 'main_gate',
    ip_address: '',
    serial_number: ''
  });

  const [enrollForm, setEnrollForm] = useState({
    person_id: '',
    person_type: 'student',
    biometric_type: 'fingerprint',
    device_id: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [devicesRes, analyticsRes, liveRes, punchesRes] = await Promise.all([
        fetch(`${API_URL}/api/biometric/devices?school_id=${schoolId}`),
        fetch(`${API_URL}/api/biometric/analytics?school_id=${schoolId}`),
        fetch(`${API_URL}/api/biometric/attendance/live?school_id=${schoolId}`),
        fetch(`${API_URL}/api/biometric/punches/today?school_id=${schoolId}`)
      ]);
      
      setDevices((await devicesRes.json()).devices || []);
      setAnalytics(await analyticsRes.json());
      setLiveAttendance(await liveRes.json());
      setTodayPunches((await punchesRes.json()).punches || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!deviceForm.device_name || !deviceForm.location) {
      toast.error('Device name aur location required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/biometric/devices?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Device added!');
        setShowAddDevice(false);
        setDeviceForm({ device_name: '', device_type: 'fingerprint', location: 'main_gate', ip_address: '', serial_number: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to add device');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.person_id || !enrollForm.device_id) {
      toast.error('Person ID aur Device select karein');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/biometric/enroll?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Biometric enrolled! Template: ${data.template_id}`);
        setShowEnrollDialog(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Enrollment failed');
      }
    } catch (error) {
      toast.error('Enrollment failed');
    }
  };

  const handleSync = async (deviceId) => {
    try {
      await fetch(`${API_URL}/api/biometric/sync?device_id=${deviceId}&school_id=${schoolId}`, {
        method: 'POST'
      });
      toast.success('Device synced!');
      fetchData();
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6" data-testid="biometric-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Fingerprint className="w-8 h-8 text-emerald-500" />
            Biometric Attendance
          </h1>
          <p className="text-muted-foreground mt-1">
            Fingerprint & Face Recognition Attendance System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowEnrollDialog(true)} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll
          </Button>
          <Button onClick={() => setShowAddDevice(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      {liveAttendance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students Present</p>
                  <p className="text-3xl font-bold text-emerald-600">{liveAttendance.summary?.students_present || 0}</p>
                </div>
                <Users className="w-10 h-10 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teachers Present</p>
                  <p className="text-3xl font-bold text-blue-600">{liveAttendance.summary?.teachers_present || 0}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staff Present</p>
                  <p className="text-3xl font-bold text-purple-600">{liveAttendance.summary?.staff_present || 0}</p>
                </div>
                <Users className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Devices Online</p>
                  <p className="text-3xl font-bold text-amber-600">{analytics?.devices?.online || 0}/{analytics?.devices?.total || 0}</p>
                </div>
                <Wifi className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="punches">Live Punches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-4">
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Fingerprint className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Koi biometric device nahi</h3>
                <p className="text-muted-foreground mt-1">Device add karke biometric attendance start karein</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <Card key={device.id} className={`border-l-4 ${device.status === 'online' ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Fingerprint className="w-6 h-6 text-emerald-600" />
                      </div>
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                        {device.status === 'online' ? <><Wifi className="w-3 h-3 mr-1" /> Online</> : <><WifiOff className="w-3 h-3 mr-1" /> Offline</>}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{device.device_name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{deviceTypeLabels[device.device_type]} • {device.location?.replace('_', ' ')}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today: {device.today_punches} punches</span>
                      <Button size="sm" variant="ghost" onClick={() => handleSync(device.id)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Biometric hardware integration is SIMULATED. Connect real ZKTeco/eSSL devices for production.
            </p>
          </div>
        </TabsContent>

        {/* Live Punches Tab */}
        <TabsContent value="punches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                Live Attendance Feed
              </CardTitle>
              <CardDescription>Real-time biometric punches</CardDescription>
            </CardHeader>
            <CardContent>
              {todayPunches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aaj koi punch nahi hui
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {todayPunches.slice(0, 20).map((punch) => (
                    <div key={punch.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${punch.punch_type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {punch.punch_type === 'in' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{punch.person_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{punch.person_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={punch.punch_type === 'in' ? 'default' : 'secondary'}>
                          {punch.punch_type.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(punch.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          {analytics && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Total Enrollments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{analytics.enrollments?.total || 0}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Students: {analytics.enrollments?.students || 0}</span>
                      <span>Staff: {analytics.enrollments?.staff || 0}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Device Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{analytics.devices?.online || 0} / {analytics.devices?.total || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {analytics.devices?.offline || 0} devices offline
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">7-Day Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-16">
                      {analytics.attendance_trend?.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-emerald-500 rounded-t"
                            style={{ height: `${Math.max((day.present / 100) * 100, 10)}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).charAt(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Device Dialog */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Biometric Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDevice} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Device Name *</label>
              <Input
                value={deviceForm.device_name}
                onChange={(e) => setDeviceForm({...deviceForm, device_name: e.target.value})}
                placeholder="Main Gate Fingerprint"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Device Type</label>
                <select
                  value={deviceForm.device_type}
                  onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="fingerprint">Fingerprint Scanner</option>
                  <option value="face">Face Recognition</option>
                  <option value="card">RFID Card</option>
                  <option value="multi">Multi-Modal</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location *</label>
                <select
                  value={deviceForm.location}
                  onChange={(e) => setDeviceForm({...deviceForm, location: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="main_gate">Main Gate</option>
                  <option value="back_gate">Back Gate</option>
                  <option value="staff_room">Staff Room</option>
                  <option value="office">Office</option>
                  <option value="classroom">Classroom</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">IP Address</label>
                <Input
                  value={deviceForm.ip_address}
                  onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Serial Number</label>
                <Input
                  value={deviceForm.serial_number}
                  onChange={(e) => setDeviceForm({...deviceForm, serial_number: e.target.value})}
                  placeholder="ZK-123456"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDevice(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Add Device
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enroll Biometric</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Person ID *</label>
              <Input
                value={enrollForm.person_id}
                onChange={(e) => setEnrollForm({...enrollForm, person_id: e.target.value})}
                placeholder="STD-2026-XXXXX or Staff ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Person Type</label>
                <select
                  value={enrollForm.person_type}
                  onChange={(e) => setEnrollForm({...enrollForm, person_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Biometric Type</label>
                <select
                  value={enrollForm.biometric_type}
                  onChange={(e) => setEnrollForm({...enrollForm, biometric_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="fingerprint">Fingerprint</option>
                  <option value="face">Face</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Device *</label>
              <select
                value={enrollForm.device_id}
                onChange={(e) => setEnrollForm({...enrollForm, device_id: e.target.value})}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="">Select Device</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.device_name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEnrollDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Fingerprint className="w-4 h-4 mr-2" />
                Enroll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
