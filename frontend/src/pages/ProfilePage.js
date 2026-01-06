import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import axios from 'axios';
import { 
  User, Mail, Phone, Building2, Shield, Key, 
  Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  Camera, Edit, Lock, Upload, Video, Mic, Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, token, logout, schoolId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Photo & AI states
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

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" data-testid="profile-page">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50">
                  <Camera className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Name & Role */}
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.label}
              </span>

              {/* Contact Info */}
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user?.email}
                </div>
                {user?.mobile && (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {user.mobile}
                  </div>
                )}
                {user?.school_id && (
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    School ID: {user.school_id}
                  </div>
                )}
              </div>
            </div>
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
            {/* Change Password Button */}
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

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">User ID</span>
                <span className="font-mono text-slate-700">{user?.id?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Role</span>
                <span className="font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Status</span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Member Since</span>
                <span className="text-slate-700">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
