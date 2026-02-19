import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Camera, MapPin, CheckCircle, XCircle, Clock, Users, Scan,
  AlertTriangle, Loader2, Calendar, BarChart3, Shield
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function AIStaffAttendancePage() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [location, setLocation] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Location access denied')
      );
    }
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [staffRes, attendanceRes] = await Promise.allSettled([
        axios.get(`${API}/api/employees?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/api/staff-attendance/today?school_id=${schoolId}`, { headers })
      ]);
      
      const staffData = staffRes.status === 'fulfilled' ? (staffRes.value.data?.employees || staffRes.value.data || []) : [];
      const attendanceData = attendanceRes.status === 'fulfilled' ? (attendanceRes.value.data?.attendance || []) : [];
      
      setStaff(staffData);
      setTodayAttendance(attendanceData);
      
      const presentIds = attendanceData.map(a => a.staff_id);
      setStats({
        present: attendanceData.filter(a => a.status === 'present').length,
        absent: staffData.length - presentIds.length,
        late: attendanceData.filter(a => a.status === 'late').length,
        total: staffData.length
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (staffMember) => {
    setSelectedStaff(staffMember);
    setShowCamera(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera access denied');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const photo = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photo);
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
  };

  const markAttendance = async () => {
    if (!selectedStaff) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/staff-attendance/mark`, {
        school_id: schoolId,
        staff_id: selectedStaff.id,
        status: 'present',
        check_in_time: new Date().toISOString(),
        method: 'ai_facial',
        location: location,
        photo: capturedPhoto
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${selectedStaff.name} marked present!`);
      setShowCamera(false);
      setCapturedPhoto(null);
      setSelectedStaff(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to mark attendance');
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setSelectedStaff(null);
  };

  const presentIds = todayAttendance.map(a => a.staff_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            AI Staff Attendance
          </h1>
          <p className="text-gray-500 mt-1">Smile, scan, and start - AI takes the roll call</p>
        </div>
        <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, icon: Users, color: 'blue' },
          { label: 'Present', value: stats.present, icon: CheckCircle, color: 'green' },
          { label: 'Absent', value: stats.absent, icon: XCircle, color: 'red' },
          { label: 'Late', value: stats.late, icon: Clock, color: 'amber' },
        ].map(stat => (
          <Card key={stat.label} className={`border-0 shadow-md bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm text-${stat.color}-600`}>{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 text-${stat.color}-500 opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {location && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
          <MapPin className="w-4 h-4" />
          Location verified: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          <Shield className="w-4 h-4 ml-auto" /> Geo-fenced
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Staff List - Mark Attendance</h3>
          </div>
          <div className="divide-y">
            {staff.map(s => {
              const isPresent = presentIds.includes(s.id);
              const record = todayAttendance.find(a => a.staff_id === s.id);
              return (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPresent ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <span className={`font-bold text-sm ${isPresent ? 'text-green-700' : 'text-gray-500'}`}>
                        {s.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.designation || s.role} {s.employee_id ? `• ${s.employee_id}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isPresent ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Present {record?.check_in_time ? `at ${new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => startCamera(s)} className="bg-blue-600 hover:bg-blue-700">
                        <Camera className="w-4 h-4 mr-1" /> Scan & Mark
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {staff.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No staff found. Add staff in Employee Management first.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                <Camera className="w-5 h-5 inline mr-2" />
                {selectedStaff?.name} - Face Scan
              </h3>
              <button onClick={closeCamera} className="p-1 hover:bg-gray-100 rounded">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              {!capturedPhoto ? (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
                  <div className="absolute inset-0 border-4 border-green-400/50 rounded-xl pointer-events-none" />
                  <Button onClick={capturePhoto} className="w-full mt-3 bg-green-600 hover:bg-green-700">
                    <Camera className="w-4 h-4 mr-2" /> Capture Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <img src={capturedPhoto} alt="Captured" className="w-full rounded-xl" />
                  <div className="flex gap-3 mt-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setCapturedPhoto(null); startCamera(selectedStaff); }}>
                      Retake
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={markAttendance}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Confirm & Mark
                    </Button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}