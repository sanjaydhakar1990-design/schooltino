import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Camera,
  Wifi,
  WifiOff,
  Plus,
  Search,
  Settings,
  Trash2,
  Play,
  RefreshCw,
  Loader2,
  MapPin,
  Monitor,
  CheckCircle,
  AlertCircle,
  Eye,
  Scan,
  Server,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function CCTVManagement() {
  const { user, schoolId } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  
  const [newCamera, setNewCamera] = useState({
    name: '',
    ip_address: '',
    port: 554,
    username: '',
    password: '',
    location: '',
    camera_type: 'ip'
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (schoolId) {
      fetchCameras();
      fetchSettings();
    }
  }, [schoolId]);

  const fetchCameras = async () => {
    try {
      const res = await axios.get(`${API}/cctv/cameras/${schoolId}`, { headers });
      setCameras(res.data || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/cctv/recording-settings/${schoolId}`, { headers });
      setRecordingSettings(res.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleAutoDetect = async () => {
    setScanning(true);
    setScanResults(null);
    
    try {
      const res = await axios.post(`${API}/cctv/auto-detect`, {
        school_id: schoolId,
        ip_range_start: '192.168.1.1',
        ip_range_end: '192.168.1.254'
      }, { headers });
      
      setScanResults(res.data);
      toast.success(`AI detected ${res.data.detected_cameras} cameras!`);
      fetchCameras();
    } catch (error) {
      toast.error('Failed to scan network');
    } finally {
      setScanning(false);
    }
  };

  const handleAddCamera = async () => {
    if (!newCamera.name || !newCamera.ip_address || !newCamera.location) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await axios.post(`${API}/cctv/cameras`, {
        ...newCamera,
        school_id: schoolId
      }, { headers });
      
      toast.success('Camera added successfully!');
      setShowAddDialog(false);
      setNewCamera({
        name: '',
        ip_address: '',
        port: 554,
        username: '',
        password: '',
        location: '',
        camera_type: 'ip'
      });
      fetchCameras();
    } catch (error) {
      toast.error('Failed to add camera');
    }
  };

  const handleActivateCamera = async (cameraId) => {
    try {
      await axios.post(`${API}/cctv/cameras/${cameraId}/activate`, {}, { headers });
      toast.success('Camera activated!');
      fetchCameras();
    } catch (error) {
      toast.error('Failed to activate camera');
    }
  };

  const handleDeleteCamera = async (cameraId) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) return;
    
    try {
      await axios.delete(`${API}/cctv/cameras/${cameraId}`, { headers });
      toast.success('Camera deleted');
      fetchCameras();
    } catch (error) {
      toast.error('Failed to delete camera');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.post(`${API}/cctv/recording-settings`, {
        ...recordingSettings,
        school_id: schoolId
      }, { headers });
      toast.success('Settings saved!');
      setShowSettingsDialog(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-emerald-500';
      case 'offline': return 'text-red-500';
      case 'detected': return 'text-amber-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <Wifi className="w-5 h-5 text-emerald-500" />;
      case 'offline': return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'detected': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Monitor className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="cctv-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Camera className="w-7 h-7 text-indigo-600" />
            CCTV Management
          </h1>
          <p className="text-slate-500 mt-1">AI-powered camera detection & management</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleAutoDetect}
            disabled={scanning}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {scanning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
            ) : (
              <><Scan className="w-4 h-4 mr-2" /> AI Auto-Detect</>
            )}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Camera
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
        </div>
      </div>

      {/* Scan Results Banner */}
      {scanResults && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-indigo-900">{scanResults.message}</p>
              <p className="text-sm text-indigo-600">
                Scan ID: {scanResults.scan_id?.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{cameras.length}</p>
              <p className="text-sm text-slate-500">Total Cameras</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {cameras.filter(c => c.status === 'online').length}
              </p>
              <p className="text-sm text-slate-500">Online</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {cameras.filter(c => c.status === 'detected').length}
              </p>
              <p className="text-sm text-slate-500">Pending Activation</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {cameras.filter(c => c.status === 'offline').length}
              </p>
              <p className="text-sm text-slate-500">Offline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Cameras Found</h3>
          <p className="text-slate-500 mb-4">
            Click "AI Auto-Detect" to scan your network or add cameras manually
          </p>
          <Button onClick={handleAutoDetect}>
            <Scan className="w-4 h-4 mr-2" /> Start Auto-Detection
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Camera Preview Placeholder */}
              <div className="h-40 bg-slate-900 relative flex items-center justify-center">
                <Camera className="w-12 h-12 text-slate-700" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {getStatusIcon(camera.status)}
                  <span className={`text-sm font-medium ${getStatusColor(camera.status)}`}>
                    {camera.status?.toUpperCase()}
                  </span>
                </div>
                {camera.auto_detected && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-purple-500 text-white text-xs rounded">
                    AI Detected
                  </div>
                )}
              </div>
              
              {/* Camera Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">{camera.name}</h3>
                <div className="space-y-1 text-sm text-slate-500 mb-3">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {camera.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Server className="w-4 h-4" /> {camera.ip_address}:{camera.port}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  {camera.status === 'detected' ? (
                    <Button
                      size="sm"
                      onClick={() => handleActivateCamera(camera.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Activate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" /> View Live
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCamera(camera.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Camera Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Camera Manually
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Camera Name *</label>
              <Input
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                placeholder="e.g., Main Gate Camera"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Location *</label>
              <Input
                value={newCamera.location}
                onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                placeholder="e.g., Main Gate, Classroom 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">IP Address *</label>
                <Input
                  value={newCamera.ip_address}
                  onChange={(e) => setNewCamera({ ...newCamera, ip_address: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Port</label>
                <Input
                  type="number"
                  value={newCamera.port}
                  onChange={(e) => setNewCamera({ ...newCamera, port: parseInt(e.target.value) })}
                  placeholder="554"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Username</label>
                <Input
                  value={newCamera.username}
                  onChange={(e) => setNewCamera({ ...newCamera, username: e.target.value })}
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  value={newCamera.password}
                  onChange={(e) => setNewCamera({ ...newCamera, password: e.target.value })}
                  placeholder="••••••"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Camera Type</label>
              <select
                value={newCamera.camera_type}
                onChange={(e) => setNewCamera({ ...newCamera, camera_type: e.target.value })}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
              >
                <option value="ip">Generic IP Camera</option>
                <option value="hikvision">Hikvision</option>
                <option value="dahua">Dahua</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCamera}>
              Add Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recording Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Recording Settings
            </DialogTitle>
          </DialogHeader>
          
          {recordingSettings && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Recording Enabled</label>
                <input
                  type="checkbox"
                  checked={recordingSettings.recording_enabled}
                  onChange={(e) => setRecordingSettings({
                    ...recordingSettings,
                    recording_enabled: e.target.checked
                  })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Retention Days</label>
                <Input
                  type="number"
                  value={recordingSettings.retention_days}
                  onChange={(e) => setRecordingSettings({
                    ...recordingSettings,
                    retention_days: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Motion Detection</label>
                <input
                  type="checkbox"
                  checked={recordingSettings.motion_detection}
                  onChange={(e) => setRecordingSettings({
                    ...recordingSettings,
                    motion_detection: e.target.checked
                  })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Alert on Motion</label>
                <input
                  type="checkbox"
                  checked={recordingSettings.alert_on_motion}
                  onChange={(e) => setRecordingSettings({
                    ...recordingSettings,
                    alert_on_motion: e.target.checked
                  })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Cloud Backup</label>
                <input
                  type="checkbox"
                  checked={recordingSettings.cloud_backup_enabled}
                  onChange={(e) => setRecordingSettings({
                    ...recordingSettings,
                    cloud_backup_enabled: e.target.checked
                  })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
