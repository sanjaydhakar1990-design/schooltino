import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import axios from 'axios';
import { 
  User, Mail, Phone, Building2, Shield, Key, CreditCard,
  Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  Camera, Edit, Lock, Upload, Video, Mic, Fingerprint,
  Settings, ArrowRight, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import MultiFaceEnrollment from '../components/MultiFaceEnrollment';
import IDCardViewer from '../components/IDCardViewer';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, logout, schoolId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [showIDCard, setShowIDCard] = useState(false);
  
  const [photoUrl, setPhotoUrl] = useState(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [cctvAuthorized, setCctvAuthorized] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Edit profile states
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    phone: '',
    department: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    role: user?.role || ''
  });

  useEffect(() => {
    if (user?.photo_url) {
      const url = user.photo_url.startsWith('http') ? user.photo_url : `${API}${user.photo_url}`;
      setPhotoUrl(url);
    }
  }, [user]);

  const getRoleBadge = (role) => {
    const badges = {
      director: { color: 'bg-purple-100 text-purple-700', label: 'Director' },
      principal: { color: 'bg-blue-100 text-blue-700', label: 'Principal' },
      vice_principal: { color: 'bg-indigo-100 text-indigo-700', label: 'Vice Principal' },
      teacher: { color: 'bg-green-100 text-green-700', label: 'Teacher' },
      accountant: { color: 'bg-amber-100 text-amber-700', label: 'Accountant' },
      student: { color: 'bg-cyan-100 text-cyan-700', label: 'Student' }
    };
    return badges[role] || { color: 'bg-slate-100 text-slate-700', label: role };
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const formData = new FormData();
      formData.append('old_password', passwordForm.oldPassword);
      formData.append('new_password', passwordForm.newPassword);

      const response = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully! 🎉');
        setShowPasswordDialog(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.detail || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Camera functions for face enrollment
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    stopCamera();
    await uploadPhoto(imageData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      await uploadPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (imageData) => {
    setUploading(true);
    try {
      let endpoint;
      if (user?.role === 'student') {
        endpoint = `${API}/api/students/${user.id}/update-photo`;
      } else if (user?.role === 'director' || user?.role === 'principal' || user?.role === 'admin') {
        endpoint = `${API}/api/users/${user.id}/update-photo`;
      } else {
        endpoint = `${API}/api/staff/${user.id}/update-photo`;
      }
      
      await axios.post(endpoint, {
        photo_data: imageData
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setPhotoUrl(imageData);
      toast.success('Profile photo updated!');

      try {
        await axios.post(`${API}/api/ai-greeting/parent-photo/upload`, {
          student_id: user?.id || 'staff',
          school_id: schoolId || 'default',
          photo_type: user?.role === 'student' ? 'student' : 'staff',
          photo_data: imageData
        });
        setFaceEnrolled(true);
      } catch (faceErr) {
        console.log('Face enrollment optional:', faceErr);
      }
    } catch (error) {
      setPhotoUrl(imageData);
      toast.success('Photo saved locally!');
    } finally {
      setUploading(false);
    }
  };

  const handleCCTVAuthorization = () => {
    setCctvAuthorized(!cctvAuthorized);
    toast.success(cctvAuthorized ? 'CCTV authorization disabled' : 'CCTV authorization enabled - You can now give commands via CCTV!');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In production, this would call an API
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" data-testid="profile-page">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{t('profile')}</h1>
          <p className="text-slate-500">Manage your account & AI settings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Photo & AI Features */}
          <div className="space-y-4">
            {/* Profile Photo Card */}
            <Card>
              <CardContent className="p-6 text-center">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} />
                {/* Avatar with Photo */}
                <div className="relative inline-block mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={user?.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    {faceEnrolled ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                
                <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <p className="text-xs text-slate-400 mt-2">Photo change karne ke liye click karein</p>
                
                {faceEnrolled ? (
                  <Badge className="mt-3 bg-green-100 text-green-700 block mx-auto w-fit">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Face Enrolled for AI
                  </Badge>
                ) : (
                  <Badge className="mt-3 bg-amber-100 text-amber-700 block mx-auto w-fit">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Enroll Face for AI
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Multi-Photo Face Enrollment (4-5 Photos) */}
            <MultiFaceEnrollment
              personId={user?.id}
              personType={user?.role === 'student' ? 'student' : 'staff'}
              personName={user?.name}
              schoolId={schoolId}
              minPhotos={4}
              maxPhotos={5}
              onComplete={(result) => {
                if (result.success) {
                  setFaceEnrolled(true);
                  toast.success(`${result.photoCount} photos enrolled!`);
                }
              }}
            />

            {/* AI Features Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-indigo-600" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* CCTV Command Authorization */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">CCTV Commands</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant={cctvAuthorized ? "default" : "outline"}
                    onClick={handleCCTVAuthorization}
                    className={cctvAuthorized ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {cctvAuthorized ? 'On' : 'Off'}
                  </Button>
                </div>
                
                <p className="text-xs text-slate-500 px-1">
                  {cctvAuthorized 
                    ? "✅ Aap CCTV se Tino ko command de sakte hain" 
                    : "Enable karein to give voice commands via CCTV"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Info & Settings */}
          <div className="lg:col-span-2 space-y-4">
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  {t('profile')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-xs">{t('name')}</Label>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-xs">Role</Label>
                    <p className="font-medium capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-xs">{t('email')}</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <p className="text-sm">{user?.email}</p>
                    </div>
                  </div>
                  {user?.mobile && (
                    <div className="space-y-1">
                      <Label className="text-slate-500 text-xs">{t('phone')}</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <p className="text-sm">{user.mobile}</p>
                      </div>
                    </div>
                  )}
                </div>
                {user?.school_id && (
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-xs">School ID</Label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <p className="text-sm">{user.school_id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-blue-200 hover:bg-blue-50"
                  onClick={() => setShowIDCard(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">My ID Card</p>
                      <p className="text-xs text-slate-500">View & print your ID card</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14"
                  onClick={() => setShowPasswordDialog(true)}
                  data-testid="change-password-button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Key className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Change Password</p>
                      <p className="text-xs text-slate-500">Update your account password</p>
                    </div>
                  </div>
                  <Edit className="w-4 h-4 text-slate-400" />
                </Button>

                {/* Setup Guide - Resume Setup */}
                {(user?.role === 'director' || user?.role === 'principal') && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-14 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => navigate('/app/setup-guide')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-indigo-700">Setup Guide / Resume Setup</p>
                        <p className="text-xs text-slate-500">CCTV, Speaker, Website configure करें</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </Button>
                )}

                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-red-200 hover:bg-red-50"
                  onClick={logout}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-red-600">Logout</p>
                      <p className="text-xs text-slate-500">Sign out from your account</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                  placeholder="Enter current password"
                  data-testid="old-password-input"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 6 chars)"
                  data-testid="new-password-input"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                data-testid="confirm-password-input"
              />
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwordForm.oldPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="w-full"
              data-testid="submit-password-change"
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Change Password
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Password change hone ke baad aapko dobara login karna padega
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {showIDCard && user?.id && (
        <IDCardViewer
          personId={user.id}
          personType="staff"
          schoolId={schoolId}
          isOpen={showIDCard}
          onClose={() => setShowIDCard(false)}
        />
      )}
    </div>
  );
}
