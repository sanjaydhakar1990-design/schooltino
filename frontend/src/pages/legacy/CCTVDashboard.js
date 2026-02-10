import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  Video, VideoOff, AlertTriangle, Eye, Shield,
  Users, Camera, Bell, Activity, Loader2, RefreshCw,
  CheckCircle, XCircle, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CCTVDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/cctv/dashboard`);
      setDashboard(res.data);
    } catch (error) {
      toast.error('Failed to load CCTV dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!['director', 'principal', 'vice_principal', 'security'].includes(user?.role)) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">You don't have access to CCTV Dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="cctv-dashboard">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Video className="w-8 h-8" />
              CCTV & Security Dashboard
            </h1>
            <p className="text-slate-300 mt-2">
              AI-powered surveillance & monitoring system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
              🔧 Mock Mode - Ready for Hardware
            </span>
            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700" onClick={fetchDashboard}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{dashboard?.statistics?.total_cameras || 0}</p>
              <p className="text-sm text-slate-500">Total Cameras</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{dashboard?.statistics?.online || 0}</p>
              <p className="text-sm text-slate-500">Online</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{dashboard?.statistics?.offline || 0}</p>
              <p className="text-sm text-slate-500">Offline</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{dashboard?.statistics?.alerts_today || 0}</p>
              <p className="text-sm text-slate-500">Alerts Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-slate-600" />
            Camera Feeds
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dashboard?.cameras?.map(camera => (
              <div 
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedCamera?.id === camera.id ? 'border-blue-500' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Mock camera feed - just a placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  {camera.status === 'online' ? (
                    <Video className="w-8 h-8 text-slate-500" />
                  ) : (
                    <VideoOff className="w-8 h-8 text-rose-500" />
                  )}
                </div>
                {/* Status indicator */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  camera.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`} />
                {/* Camera info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                  <p className="text-white text-xs font-medium truncate">{camera.name}</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {camera.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & AI Features */}
        <div className="space-y-4">
          {/* Recent Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Recent Alerts
            </h3>
            <div className="space-y-2">
              {dashboard?.alerts?.map(alert => (
                <div key={alert.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 capitalize">{alert.type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">{alert.camera} • {alert.time}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      alert.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              AI Features
            </h3>
            <div className="space-y-2">
              {dashboard?.ai_features && Object.entries(dashboard.ai_features).map(([key, feature]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {feature.status === 'ready' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-700 capitalize">{key.replace('_', ' ')}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    feature.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {feature.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Camera View */}
      {selectedCamera && (
        <div className="bg-slate-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedCamera.name}</h3>
              <p className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {selectedCamera.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                selectedCamera.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {selectedCamera.status === 'online' ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                {selectedCamera.status}
              </span>
            </div>
          </div>
          
          {/* Large Mock Feed */}
          <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Live feed will be available after hardware integration</p>
              <p className="text-slate-500 text-sm mt-2">Camera ID: {selectedCamera.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">🔌 Hardware Integration</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="p-4 bg-white rounded-lg">
            <p className="font-medium text-slate-900 mb-2">Supported Cameras</p>
            <ul className="space-y-1">
              <li>• IP Cameras (RTSP)</li>
              <li>• Hikvision / Dahua</li>
              <li>• ONVIF compatible</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="font-medium text-slate-900 mb-2">AI Capabilities</p>
            <ul className="space-y-1">
              <li>• Face Recognition</li>
              <li>• Auto Attendance</li>
              <li>• Behavior Detection</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="font-medium text-slate-900 mb-2">Gate Access</p>
            <ul className="space-y-1">
              <li>• QR/RFID Integration</li>
              <li>• Auto Gate Control</li>
              <li>• Student Status Check</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
