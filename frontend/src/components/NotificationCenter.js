/**
 * UNIVERSAL NOTIFICATION CENTER
 * For Admin, Teachers, Students
 * - Leave approvals
 * - Substitute assignments
 * - Notices
 * - Real-time updates
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Bell, X, CheckSquare, XCircle, Clock, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationCenter({ userId, userType, schoolId }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId && schoolId) {
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, schoolId]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/notifications?user_id=${userId}&school_id=${schoolId}&user_type=${userType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const notifs = response.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notifications/${notifId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleAction = async (notifId, action, actionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notifications/${notifId}/action`, {
        action,
        ...actionData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(action === 'approve' ? '✅ Approved!' : action === 'reject' ? '❌ Rejected!' : '✅ Done!');
      fetchNotifications();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setShowPanel(true)}
        className="relative p-2 hover:bg-gray-100 rounded-lg"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel Overlay */}
      {showPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowPanel(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6" />
                <h3 className="font-bold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 ${
                        !notif.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      {/* Notification Content */}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notif.type === 'leave' ? 'bg-blue-100' :
                          notif.type === 'substitute' ? 'bg-amber-100' :
                          notif.type === 'notice' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {notif.type === 'leave' ? <Calendar className="w-5 h-5 text-blue-600" /> :
                           notif.type === 'substitute' ? <User className="w-5 h-5 text-amber-600" /> :
                           <Bell className="w-5 h-5 text-gray-600" />}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{notif.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          {notif.data && (
                            <div className="text-xs text-gray-500 mt-2">
                              {notif.data.dates && <span>📅 {notif.data.dates}</span>}
                              {notif.data.class && <span className="ml-2">🎓 {notif.data.class}</span>}
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {notif.actions && notif.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(notif.id, 'approve', notif.action_data);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckSquare className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(notif.id, 'reject', notif.action_data);
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notif.created_at).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
