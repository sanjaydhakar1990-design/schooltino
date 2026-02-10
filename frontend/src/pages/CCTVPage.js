import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Video, Camera, Monitor, Settings, Plus, RefreshCw, Eye, Trash2, Edit2, MapPin } from 'lucide-react';

const CCTVPage = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', location: '', stream_url: '', type: 'ip' });

  useEffect(() => {
    fetchCameras();
  }, [user?.school_id]);

  const fetchCameras = async () => {
    if (!user?.school_id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL || ''}/api/cctv/cameras?school_id=${user.school_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCameras(res.data?.cameras || []);
    } catch (err) {
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  const addCamera = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/cctv/cameras`, {
        ...newCamera, school_id: user?.school_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddForm(false);
      setNewCamera({ name: '', location: '', stream_url: '', type: 'ip' });
      fetchCameras();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add camera');
    }
  };

  const deleteCamera = async (id) => {
    if (!window.confirm('Delete this camera?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL || ''}/api/cctv/cameras/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCameras();
    } catch (err) {
      alert('Failed to delete camera');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CCTV Integration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor security cameras</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCameras} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Camera
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Camera</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Camera Name</label>
              <input type="text" value={newCamera.name} onChange={e => setNewCamera({ ...newCamera, name: e.target.value })} placeholder="e.g. Main Gate Camera" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={newCamera.location} onChange={e => setNewCamera({ ...newCamera, location: e.target.value })} placeholder="e.g. Main Entrance" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream URL / IP</label>
              <input type="text" value={newCamera.stream_url} onChange={e => setNewCamera({ ...newCamera, stream_url: e.target.value })} placeholder="rtsp://... or http://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={newCamera.type} onChange={e => setNewCamera({ ...newCamera, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ip">IP Camera</option>
                <option value="usb">USB Camera</option>
                <option value="nvr">NVR</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addCamera} disabled={!newCamera.name || !newCamera.stream_url} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Save Camera</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : cameras.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">No Cameras Added</h3>
            <p className="text-sm text-gray-500 mt-1">Add CCTV cameras to start monitoring</p>
          </div>
        ) : (
          cameras.map(cam => (
            <div key={cam.id || cam._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-900 flex items-center justify-center relative">
                <Monitor className="w-10 h-10 text-gray-600" />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-white/70">{cam.status || 'offline'}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm">{cam.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{cam.location}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" />Live View
                  </button>
                  <button onClick={() => deleteCamera(cam.id || cam._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CCTVPage;
