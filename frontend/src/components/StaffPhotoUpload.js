import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Camera, Upload, CheckCircle, XCircle, Loader2, 
  User, RefreshCw, Trash2, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function StaffPhotoUpload({ staffId, staffName, schoolId, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);
  const [stream, setStream] = useState(null);
  const [photos, setPhotos] = useState({});
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [currentPhotoType, setCurrentPhotoType] = useState('passport');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const photoTypes = [
    { id: 'passport', label: 'Passport Photo', description: 'Front facing, clear face', required: true },
    { id: 'front', label: 'Front View', description: 'Natural expression', required: true },
    { id: 'left', label: 'Left Profile', description: '30-45 degree left turn', required: false },
    { id: 'right', label: 'Right Profile', description: '30-45 degree right turn', required: false },
  ];

  useEffect(() => {
    if (staffId) {
      fetchEnrollmentStatus();
    }
    return () => {
      stopCamera();
    };
  }, [staffId]);

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await fetch(`${API}/api/face-recognition/staff/enrollment-status/${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollmentStatus(data);
        // Populate existing photos
        if (data.photos) {
          setPhotos(data.photos);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCaptureMode(true);
    } catch (error) {
      toast.error('Camera access denied. Please allow camera permission.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCaptureMode(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    await uploadPhoto(photoBase64);
  };

  const uploadPhoto = async (photoBase64) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/face-recognition/staff/upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          school_id: schoolId,
          photo_base64: photoBase64,
          photo_type: currentPhotoType,
          capture_device: 'webcam'
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Photo uploaded successfully!');
        setPhotos(prev => ({
          ...prev,
          [currentPhotoType]: {
            id: data.photo_id,
            quality_score: data.quality_score
          }
        }));
        
        // Move to next photo type
        const currentIndex = photoTypes.findIndex(t => t.id === currentPhotoType);
        if (currentIndex < photoTypes.length - 1) {
          setCurrentPhotoType(photoTypes[currentIndex + 1].id);
        } else {
          stopCamera();
          toast.success('Sabhi photos upload ho gaye! 🎉');
          onComplete?.();
        }
        
        fetchEnrollmentStatus();
      } else {
        toast.error(data.error || 'Photo upload failed');
        if (data.action === 'retake') {
          toast.info(data.recommendations?.join('. ') || 'Please try again with better lighting');
        }
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(',')[1];
      await uploadPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = async (photoId, photoType) => {
    try {
      const res = await fetch(`${API}/api/face-recognition/staff/photo/${photoId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success('Photo deleted');
        setPhotos(prev => {
          const newPhotos = { ...prev };
          delete newPhotos[photoType];
          return newPhotos;
        });
        fetchEnrollmentStatus();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const completedCount = Object.keys(photos).length;
  const requiredCount = photoTypes.filter(t => t.required).length;
  const progress = Math.min((completedCount / requiredCount) * 100, 100);

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Face Recognition Setup
        </CardTitle>
        <CardDescription>
          {staffName || 'Staff'} ke liye photos upload karein AI recognition ke liye
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Enrollment Progress</span>
            <span className="font-medium text-blue-600">{completedCount}/{photoTypes.length} photos</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(completedCount / photoTypes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Photo Type Grid */}
        <div className="grid grid-cols-2 gap-3">
          {photoTypes.map((type) => {
            const isCompleted = photos[type.id];
            const isCurrent = currentPhotoType === type.id;
            
            return (
              <div
                key={type.id}
                onClick={() => !isCompleted && setCurrentPhotoType(type.id)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  isCompleted 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : isCurrent 
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    {type.label}
                  </span>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : type.required ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Required</span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">{type.description}</p>
                {isCompleted && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-emerald-600">
                      Quality: {photos[type.id]?.quality_score || 'N/A'}%
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photos[type.id].id, type.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Camera View */}
        {captureMode ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-dashed border-white/30 m-8 rounded-full" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {currentPhotoType.replace('_', ' ').toUpperCase()} - Face center mein rakhein
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Capture Photo
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={startCamera}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
            <label className="flex-1">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* AI Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-800">AI Face Recognition</p>
              <p className="text-xs text-indigo-600 mt-1">
                Ye photos AI ko aapko recognize karne mein help karenge. 
                Jab aap school mein enter karenge, AI automatically aapko greet karega!
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment Status */}
        {enrollmentStatus && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Recognition Ready:</span>
              <span className={`font-medium ${
                enrollmentStatus.can_use_recognition ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {enrollmentStatus.can_use_recognition ? 'Yes ✓' : 'More photos needed'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
