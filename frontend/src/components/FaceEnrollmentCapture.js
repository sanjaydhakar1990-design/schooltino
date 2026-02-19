import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  Camera, Upload, CheckCircle, XCircle, AlertTriangle, Loader2,
  RotateCcw, ChevronRight, User, Smartphone, Monitor, Eye,
  Scan, Shield, RefreshCw, Image, Trash2, Info
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

const PHOTO_TYPES = [
  { id: 'passport', label: 'Passport Photo', icon: User, description: 'Front facing, neutral expression', required: true },
  { id: 'front', label: 'Front View', icon: Eye, description: 'Direct front view', required: false },
  { id: 'left', label: 'Left Profile', icon: User, description: 'Left side (30-45°)', required: false },
  { id: 'right', label: 'Right Profile', icon: User, description: 'Right side (30-45°)', required: false },
  { id: 'full_body', label: 'Full Body', icon: User, description: 'Full body with face visible', required: false },
];

export default function FaceEnrollmentCapture({ 
  studentId, 
  schoolId, 
  studentName,
  onComplete,
  onSkip,
  isOpen,
  onClose
}) {
  const [currentPhotoType, setCurrentPhotoType] = useState('passport');
  const [uploadedPhotos, setUploadedPhotos] = useState({});
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [captureMode, setCaptureMode] = useState('camera'); // camera, upload
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [showWarning, setShowWarning] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch enrollment status
  useEffect(() => {
    if (studentId && isOpen) {
      fetchEnrollmentStatus();
    }
  }, [studentId, isOpen]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await fetch(`${API}/api/face-recognition/enrollment-status/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollmentStatus(data);
        
        // Pre-populate uploaded photos
        const uploaded = {};
        data.photos_uploaded?.forEach(type => {
          uploaded[type] = { uploaded: true };
        });
        setUploadedPhotos(uploaded);
      }
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
    }
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraActive(true);
      toast.success('Camera started! Position your face properly.');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Camera access denied. Please allow camera permission or upload photos.');
      setCaptureMode('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    // Upload photo
    await uploadPhoto(base64);
    
    setCapturing(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Max 10MB allowed.');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      await uploadPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (base64) => {
    setUploading(true);
    setQualityAnalysis(null);
    
    try {
      const res = await fetch(`${API}/api/face-recognition/upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          school_id: schoolId,
          photo_base64: base64,
          photo_type: currentPhotoType,
          capture_device: captureMode === 'camera' ? 'webcam' : 'upload'
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || 'Photo uploaded successfully!');
        setQualityAnalysis(data.analysis);
        
        // Update uploaded photos
        setUploadedPhotos(prev => ({
          ...prev,
          [currentPhotoType]: {
            uploaded: true,
            quality: data.quality_score,
            photoId: data.photo_id
          }
        }));
        
        // Auto-advance to next photo type
        const currentIndex = PHOTO_TYPES.findIndex(p => p.id === currentPhotoType);
        if (currentIndex < PHOTO_TYPES.length - 1) {
          setCurrentPhotoType(PHOTO_TYPES[currentIndex + 1].id);
        }
        
        // Refresh enrollment status
        fetchEnrollmentStatus();
        
      } else {
        // Handle errors
        if (data.warning === 'TWIN_OR_SIBLING_DETECTED') {
          setShowWarning({
            type: 'twin',
            similar_student: data.similar_student,
            similarity: data.similarity,
            message: data.message
          });
        } else {
          toast.error(data.error || 'Failed to upload photo');
          setQualityAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const res = await fetch(`${API}/api/face-recognition/skip-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          school_id: schoolId,
          skip_face: true,
          skip_biometric: true,
          reason: 'Skipped during admission - will complete later'
        })
      });
      
      if (res.ok) {
        toast.info('Face enrollment skipped. Can be completed later.');
        onSkip?.();
        onClose?.();
      }
    } catch (error) {
      console.error('Skip error:', error);
    }
  };

  const handleComplete = () => {
    stopCamera();
    onComplete?.();
    onClose?.();
  };

  const getPhotoTypeStatus = (photoType) => {
    if (uploadedPhotos[photoType]?.uploaded) {
      return 'complete';
    }
    if (photoType === currentPhotoType) {
      return 'current';
    }
    return 'pending';
  };

  const uploadedCount = Object.keys(uploadedPhotos).filter(k => uploadedPhotos[k]?.uploaded).length;
  const progress = (uploadedCount / 3) * 100; // 3 photos = 100%
  const canComplete = uploadedPhotos['passport']?.uploaded && uploadedCount >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-6 h-6 text-indigo-600" />
            AI Face Enrollment - {studentName}
          </DialogTitle>
          <DialogDescription>
            4-5 photos chahiye (1 passport + angles) for accurate face recognition
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          {/* Left: Photo Types Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-slate-500">{uploadedCount}/5 photos</span>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            
            {PHOTO_TYPES.map((type) => {
              const status = getPhotoTypeStatus(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => setCurrentPhotoType(type.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    status === 'complete' 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : status === 'current'
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  data-testid={`photo-type-${type.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'complete' ? 'bg-emerald-500' : 
                      status === 'current' ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}>
                      {status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <type.icon className={`w-4 h-4 ${status === 'current' ? 'text-white' : 'text-slate-500'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${status === 'complete' ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {type.label} {type.required && <span className="text-red-500">*</span>}
                      </p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                    {status === 'complete' && uploadedPhotos[type.id]?.quality && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        {uploadedPhotos[type.id].quality}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center: Camera/Upload Area */}
          <div className="md:col-span-2 space-y-4">
            {/* Capture Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={captureMode === 'camera' ? 'default' : 'outline'}
                onClick={() => {
                  setCaptureMode('camera');
                  if (!cameraActive) startCamera();
                }}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button
                variant={captureMode === 'upload' ? 'default' : 'outline'}
                onClick={() => {
                  setCaptureMode('upload');
                  stopCamera();
                }}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* Camera View */}
            {captureMode === 'camera' && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-slate-900">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Face Guide Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`border-4 border-dashed rounded-full w-48 h-64 ${
                        currentPhotoType === 'full_body' ? 'w-32 h-80' : ''
                      } ${cameraActive ? 'border-white/50' : 'border-slate-500'}`}></div>
                    </div>
                    
                    {/* Photo Type Label */}
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {PHOTO_TYPES.find(p => p.id === currentPhotoType)?.label}
                    </div>
                    
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                        <Button onClick={startCamera} size="lg">
                          <Camera className="w-5 h-5 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Capture Button */}
                  {cameraActive && (
                    <div className="p-4 bg-slate-100 flex justify-center gap-4">
                      <Button
                        size="lg"
                        onClick={capturePhoto}
                        disabled={capturing || uploading}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="capture-photo-btn"
                      >
                        {capturing || uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Camera className="w-5 h-5 mr-2" />
                        )}
                        {uploading ? 'Analyzing...' : 'Capture Photo'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={stopCamera}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload Area */}
            {captureMode === 'upload' && (
              <Card className="border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors">
                <CardContent className="p-8">
                  <div 
                    className="flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-lg font-medium text-slate-700">
                      Click to upload {PHOTO_TYPES.find(p => p.id === currentPhotoType)?.label}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      JPG, PNG up to 10MB - High resolution recommended
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="photo-upload-input"
                    />
                    
                    {uploading && (
                      <div className="mt-4 flex items-center gap-2 text-indigo-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>AI analyzing photo...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quality Analysis Result */}
            {qualityAnalysis && (
              <Card className={`${
                qualityAnalysis.quality_score >= 80 ? 'border-emerald-300 bg-emerald-50' :
                qualityAnalysis.quality_score >= 60 ? 'border-amber-300 bg-amber-50' :
                'border-red-300 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {qualityAnalysis.quality_score >= 80 ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    ) : qualityAnalysis.quality_score >= 60 ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Quality Score: {qualityAnalysis.quality_score}/100</span>
                        {qualityAnalysis.face_detected && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Face Detected</span>
                        )}
                      </div>
                      
                      {qualityAnalysis.issues?.length > 0 && (
                        <div className="text-sm text-slate-600">
                          <strong>Issues:</strong> {qualityAnalysis.issues.join(', ')}
                        </div>
                      )}
                      
                      {qualityAnalysis.recommendations?.length > 0 && (
                        <div className="text-sm text-slate-600 mt-1">
                          <strong>Tips:</strong> {qualityAnalysis.recommendations.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Twin Warning Dialog */}
        {showWarning?.type === 'twin' && (
          <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-800">⚠️ Similar Face Detected!</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This face is {showWarning.similarity}% similar to: <strong>{showWarning.similar_student?.name}</strong>
                  {showWarning.similar_student?.class && ` (Class ${showWarning.similar_student.class})`}
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <strong>Kya ye student twin/sibling hai?</strong> Please verify carefully before proceeding.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setShowWarning(null)}>
                    Re-take Photo
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => {
                      setShowWarning(null);
                      toast.success('Verified as different person. Continue enrollment.');
                    }}
                  >
                    Yes, Different Person - Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} className="text-slate-500">
            Skip for now
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={!canComplete}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="complete-enrollment-btn"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Enrollment
            </Button>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Tips for best results:</strong>
            <ul className="list-disc ml-4 mt-1">
              <li>Good lighting - face clearly visible</li>
              <li>Remove glasses if possible</li>
              <li>Neutral expression for passport photo</li>
              <li>Different angles help AI identify student accurately</li>
              <li>Full body photo helps even if face is partially visible</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
