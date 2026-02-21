/**
 * Notice Popup Component
 * Shows notices as popups on user screens
 * - Stays until manually dismissed
 * - Auto-expires based on notice expiry
 * - Shows for specific target users
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell, X, AlertTriangle, Info, CheckCircle, 
  Calendar, User, Clock, ChevronRight, ChevronLeft,
  Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

// Priority colors
const PRIORITY_STYLES = {
  urgent: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-700', light: 'bg-red-50' },
  high: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
  normal: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
  low: { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-700', light: 'bg-slate-50' }
};

export default function NoticePopup() {
  const { user, schoolId } = useAuth();
  const [notices, setNotices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissedNotices, setDismissedNotices] = useState(() => {
    const stored = localStorage.getItem('dismissed_notices');
    return stored ? JSON.parse(stored) : [];
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch unread notices for this user
  const fetchNotices = useCallback(async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API}/notices/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const unreadNotices = response.data.filter(
        notice => !dismissedNotices.includes(notice.id)
      );

      if (unreadNotices.length > 0) {
        setNotices(unreadNotices);
        setShowPopup(true);
        
        // Play notification sound for urgent notices
        if (soundEnabled && unreadNotices.some(n => n.priority === 'urgent' || n.priority === 'high')) {
          playNotificationSound();
        }
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    }
  }, [user, schoolId, dismissedNotices, soundEnabled]);

  // Poll for new notices every 30 seconds
  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 30000);
    return () => clearInterval(interval);
  }, [fetchNotices]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRclW5/cxJ');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Dismiss current notice
  const dismissNotice = async (noticeId) => {
    // Add to dismissed list
    const newDismissed = [...dismissedNotices, noticeId];
    setDismissedNotices(newDismissed);
    localStorage.setItem('dismissed_notices', JSON.stringify(newDismissed));

    // Mark as read on server
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notices/${noticeId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
    }

    // Move to next notice or close
    if (currentIndex < notices.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowPopup(false);
      setNotices([]);
      setCurrentIndex(0);
    }
  };

  // Dismiss all notices
  const dismissAll = async () => {
    const allIds = notices.map(n => n.id);
    const newDismissed = [...dismissedNotices, ...allIds];
    setDismissedNotices(newDismissed);
    localStorage.setItem('dismissed_notices', JSON.stringify(newDismissed));

    // Mark all as read
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        allIds.map(id => axios.post(`${API}/notices/${id}/mark-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }))
      );
    } catch (error) {
      console.error('Failed to mark notices as read:', error);
    }

    setShowPopup(false);
    setNotices([]);
    setCurrentIndex(0);
  };

  if (!showPopup || notices.length === 0) return null;

  const currentNotice = notices[currentIndex];
  if (!currentNotice) return null;

  const style = PRIORITY_STYLES[currentNotice.priority] || PRIORITY_STYLES.normal;

  return (
    <Dialog open={showPopup} onOpenChange={() => {}}>
      <DialogContent 
        className={`max-w-lg border-2 ${style.border} p-0 overflow-hidden`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className={`${style.bg} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span className="font-semibold">New Notice</span>
              {notices.length > 1 && (
                <Badge className="bg-white/20 text-white">
                  {currentIndex + 1} of {notices.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 hover:bg-white/20 rounded"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <Badge className={`${style.light} ${style.text}`}>
                {currentNotice.priority?.toUpperCase() || 'NORMAL'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {currentNotice.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {currentNotice.created_by_name || 'Admin'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(currentNotice.created_at).toLocaleDateString('hi-IN')}
            </span>
          </div>

          <div className={`${style.light} rounded-lg p-4 mb-4`}>
            <p className="text-slate-700 whitespace-pre-wrap">
              {currentNotice.content}
            </p>
          </div>

          {/* Target Info */}
          {currentNotice.target_type && (
            <div className="text-sm text-slate-500 mb-4">
              <span className="font-medium">For: </span>
              {currentNotice.target_type === 'all' && 'Everyone'}
              {currentNotice.target_type === 'students' && 'All Students'}
              {currentNotice.target_type === 'teachers' && 'All Teachers'}
              {currentNotice.target_type === 'class' && `Class ${currentNotice.target_class}`}
              {currentNotice.target_type === 'specific' && 'Specific Users'}
            </div>
          )}

          {/* Expiry */}
          {currentNotice.expires_at && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mb-4">
              <Clock className="w-4 h-4" />
              Expires: {new Date(currentNotice.expires_at).toLocaleDateString('hi-IN')}
            </div>
          )}

          {/* Attachments */}
          {currentNotice.attachments?.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {currentNotice.attachments.map((att, idx) => (
                  <a 
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    📎 {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            {/* Navigation for multiple notices */}
            {notices.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(notices.length - 1, currentIndex + 1))}
                  disabled={currentIndex === notices.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              {notices.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissAll}
                >
                  Dismiss All
                </Button>
              )}
              <Button
                className={style.bg}
                onClick={() => dismissNotice(currentNotice.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Got It
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mini notification badge for sidebar/header
export function NoticeNotificationBadge() {
  const { user, schoolId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${API}/notices/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user, schoolId]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
