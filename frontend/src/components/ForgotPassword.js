import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Mail, Phone, Key, Loader2, CheckCircle, ArrowLeft, 
  Lock, Eye, EyeOff, User, GraduationCap, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function ForgotPassword({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter email/id, 2: Enter OTP, 3: New password
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('email'); // email, mobile, student_id
  
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [demoOtp, setDemoOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');

  const handleRequestOTP = async () => {
    if (!identifier) {
      toast.error('Please enter your email, mobile or student ID');
      return;
    }

    setLoading(true);
    try {
      const payload = {};
      if (method === 'email') payload.email = identifier;
      else if (method === 'mobile') payload.mobile = identifier;
      else payload.student_id = identifier;

      const res = await fetch(`${API}/api/password-reset/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'OTP sent successfully!');
        setDemoOtp(data.demo_otp || '');
        setUserName(data.user_name || '');
        setUserType(data.user_type || '');
        setStep(2);
      } else {
        toast.error(data.detail || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = { otp };
      if (method === 'email') payload.email = identifier;
      else if (method === 'mobile') payload.mobile = identifier;
      else payload.student_id = identifier;

      const res = await fetch(`${API}/api/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('OTP verified!');
        setResetToken(data.reset_token);
        setStep(3);
      } else {
        toast.error(data.detail || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Password reset successfully! 🎉');
        onSuccess?.();
        handleClose();
      } else {
        toast.error(data.detail || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIdentifier('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setDemoOtp('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter OTP'}
            {step === 3 && 'Set New Password'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Enter Email/Mobile/Student ID */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter your registered email, mobile number or student ID to receive OTP
            </p>

            {/* Method Selection */}
            <div className="flex gap-2">
              {[
                { id: 'email', icon: Mail, label: 'Email' },
                { id: 'mobile', icon: Phone, label: 'Mobile' },
                { id: 'student_id', icon: GraduationCap, label: 'Student ID' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setIdentifier(''); }}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    method === m.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <m.icon className={`w-5 h-5 mx-auto mb-1 ${
                    method === m.id ? 'text-indigo-600' : 'text-slate-400'
                  }`} />
                  <p className={`text-xs font-medium ${
                    method === m.id ? 'text-indigo-700' : 'text-slate-600'
                  }`}>{m.label}</p>
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  method === 'email' ? 'Enter your email address' :
                  method === 'mobile' ? 'Enter your mobile number' :
                  'Enter your Student ID'
                }
                type={method === 'email' ? 'email' : 'text'}
              />
            </div>

            <Button 
              onClick={handleRequestOTP} 
              disabled={loading || !identifier}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send OTP
            </Button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium text-emerald-800">OTP Sent!</p>
              {userName && <p className="text-sm text-emerald-600">Hi {userName}</p>}
            </div>

            {/* Demo OTP Display (Remove in production) */}
            {demoOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium">Demo Mode - OTP:</p>
                <p className="text-2xl font-bold text-amber-800 tracking-widest">{demoOtp}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Production mein yeh SMS/Email se aayega
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Enter 6-Digit OTP</label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Verify OTP
              </Button>
            </div>

            <button 
              onClick={handleRequestOTP}
              className="w-full text-sm text-indigo-600 hover:underline"
            >
              Resend OTP
            </button>
          </div>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium text-emerald-800">OTP Verified!</p>
              <p className="text-sm text-emerald-600">Ab naya password set karein</p>
            </div>

            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Passwords match nahi ho rahe</p>
            )}

            <Button 
              onClick={handleResetPassword} 
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Reset Password
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
