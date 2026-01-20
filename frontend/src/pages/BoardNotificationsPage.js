import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Bell,
  ExternalLink,
  RefreshCw,
  Check,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  Sparkles,
  BookOpen,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Board websites and notification sources
const BOARD_INFO = {
  CBSE: {
    name: 'CBSE',
    fullName: 'Central Board of Secondary Education',
    website: 'https://www.cbse.gov.in',
    notificationUrl: 'https://www.cbse.gov.in/cbsenew/cbse.html',
    color: 'bg-blue-500'
  },
  MPBSE: {
    name: 'MP Board',
    fullName: 'Madhya Pradesh Board of Secondary Education',
    website: 'https://mpbse.nic.in',
    notificationUrl: 'https://mpbse.nic.in/notice.htm',
    color: 'bg-orange-500'
  },
  RBSE: {
    name: 'RBSE',
    fullName: 'Rajasthan Board of Secondary Education',
    website: 'https://rajeduboard.rajasthan.gov.in',
    notificationUrl: 'https://rajeduboard.rajasthan.gov.in/',
    color: 'bg-pink-500'
  },
  NCERT: {
    name: 'NCERT',
    fullName: 'National Council of Educational Research and Training',
    website: 'https://ncert.nic.in',
    notificationUrl: 'https://ncert.nic.in/announcement.php',
    color: 'bg-green-500'
  }
};

// Sample notifications (In real app, these would be fetched from backend which scrapes board websites)
const SAMPLE_NOTIFICATIONS = {
  CBSE: [
    {
      id: 'cbse-1',
      title: 'CBSE Date Sheet 2025 Released',
      description: 'Class 10 & 12 Board Exams starting from 15th February 2025',
      type: 'exam',
      date: '2025-01-15',
      important: true,
      url: 'https://www.cbse.gov.in/cbsenew/datesheet.html',
      autoApply: true,
      applyTo: ['calendar', 'exam_schedule']
    },
    {
      id: 'cbse-2',
      title: 'Practical Exam Guidelines 2024-25',
      description: 'Updated guidelines for conducting practical exams in schools',
      type: 'circular',
      date: '2025-01-10',
      important: false,
      url: 'https://www.cbse.gov.in/cbsenew/circular.html'
    },
    {
      id: 'cbse-3',
      title: 'Syllabus Rationalization Notice',
      description: 'Deleted portions for Class 10 & 12 for session 2024-25',
      type: 'syllabus',
      date: '2025-01-05',
      important: true,
      url: 'https://www.cbse.gov.in/cbsenew/curriculum.html',
      autoApply: true,
      applyTo: ['syllabus']
    }
  ],
  MPBSE: [
    {
      id: 'mp-1',
      title: 'MP Board परीक्षा समय सारणी 2025',
      description: 'कक्षा 10वीं एवं 12वीं की परीक्षाएं 17 फरवरी से प्रारंभ',
      type: 'exam',
      date: '2025-01-14',
      important: true,
      url: 'https://mpbse.nic.in/time_table.htm',
      autoApply: true,
      applyTo: ['calendar', 'exam_schedule']
    },
    {
      id: 'mp-2',
      title: 'प्रायोगिक परीक्षा दिशा-निर्देश',
      description: 'आंतरिक मूल्यांकन एवं प्रायोगिक परीक्षा हेतु निर्देश',
      type: 'circular',
      date: '2025-01-08',
      important: false,
      url: 'https://mpbse.nic.in/notice.htm'
    }
  ],
  RBSE: [
    {
      id: 'rbse-1',
      title: 'RBSE Time Table 2025 घोषित',
      description: 'राजस्थान बोर्ड परीक्षा 20 फरवरी से शुरू',
      type: 'exam',
      date: '2025-01-12',
      important: true,
      url: 'https://rajeduboard.rajasthan.gov.in/',
      autoApply: true,
      applyTo: ['calendar', 'exam_schedule']
    },
    {
      id: 'rbse-2',
      title: 'पाठ्यक्रम में संशोधन 2024-25',
      description: 'कक्षा 9-12 के लिए संशोधित पाठ्यक्रम जारी',
      type: 'syllabus',
      date: '2025-01-06',
      important: true,
      url: 'https://rajeduboard.rajasthan.gov.in/',
      autoApply: true,
      applyTo: ['syllabus']
    }
  ],
  NCERT: [
    {
      id: 'ncert-1',
      title: 'NCERT New Textbooks 2024-25',
      description: 'Updated textbooks available for download',
      type: 'resource',
      date: '2025-01-10',
      important: false,
      url: 'https://ncert.nic.in/textbook.php'
    }
  ]
};

export default function BoardNotificationsPage() {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolBoard, setSchoolBoard] = useState('CBSE');
  const [notifications, setNotifications] = useState([]);
  const [appliedNotifications, setAppliedNotifications] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    fetchSchoolBoard();
  }, [schoolId]);

  const fetchSchoolBoard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/school/settings?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let board = 'CBSE';
      if (response.data?.board) {
        const b = response.data.board.toUpperCase();
        if (b.includes('MP') || b.includes('MPBSE')) board = 'MPBSE';
        else if (b.includes('RBSE') || b.includes('RAJASTHAN')) board = 'RBSE';
        else if (b.includes('NCERT')) board = 'NCERT';
        else board = 'CBSE';
      }
      
      setSchoolBoard(board);
      setNotifications(SAMPLE_NOTIFICATIONS[board] || []);
      
      // Fetch applied notifications
      const appliedRes = await axios.get(`${API}/board/applied-notifications?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] }));
      
      setAppliedNotifications(appliedRes.data?.map(n => n.notification_id) || []);
    } catch (error) {
      console.error('Error fetching board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('Board notifications check हो रहा है...');
    
    // Simulate API call to scrape board website
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would call backend which scrapes board website
    setNotifications(SAMPLE_NOTIFICATIONS[schoolBoard] || []);
    setRefreshing(false);
    toast.success('Latest notifications loaded!');
  };

  const handleApplyNotification = async (notification) => {
    setApplyingId(notification.id);
    
    try {
      const token = localStorage.getItem('token');
      
      // Apply to school system
      await axios.post(`${API}/board/apply-notification`, {
        school_id: schoolId,
        notification_id: notification.id,
        notification_type: notification.type,
        title: notification.title,
        apply_to: notification.applyTo || [],
        data: notification
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAppliedNotifications(prev => [...prev, notification.id]);
      toast.success(`"${notification.title}" system में apply हो गया!`);
    } catch (error) {
      toast.error('Apply करने में error हुआ');
    } finally {
      setApplyingId(null);
    }
  };

  const handleAutoApplyAll = async () => {
    const autoApplyNotifications = notifications.filter(n => n.autoApply && !appliedNotifications.includes(n.id));
    
    if (autoApplyNotifications.length === 0) {
      toast.info('सभी auto-apply notifications पहले से apply हैं');
      return;
    }
    
    for (const notification of autoApplyNotifications) {
      await handleApplyNotification(notification);
    }
    
    toast.success(`${autoApplyNotifications.length} notifications auto-apply हो गए!`);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'exam': return <Calendar className="w-4 h-4" />;
      case 'syllabus': return <BookOpen className="w-4 h-4" />;
      case 'circular': return <FileText className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      exam: 'bg-red-100 text-red-700',
      syllabus: 'bg-blue-100 text-blue-700',
      circular: 'bg-purple-100 text-purple-700',
      resource: 'bg-green-100 text-green-700'
    };
    const labels = {
      exam: 'परीक्षा',
      syllabus: 'पाठ्यक्रम',
      circular: 'सर्कुलर',
      resource: 'संसाधन'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const boardInfo = BOARD_INFO[schoolBoard];

  return (
    <div className="space-y-6" data-testid="board-notifications-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Board Notifications</h1>
          <p className="text-slate-500">{boardInfo?.fullName} की latest updates</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleAutoApplyAll}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Auto Apply
          </Button>
        </div>
      </div>

      {/* Board Info Card */}
      <Card className={`border-l-4 ${boardInfo?.color === 'bg-blue-500' ? 'border-l-blue-500' : boardInfo?.color === 'bg-orange-500' ? 'border-l-orange-500' : boardInfo?.color === 'bg-pink-500' ? 'border-l-pink-500' : 'border-l-green-500'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${boardInfo?.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                {boardInfo?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg">{boardInfo?.name}</p>
                <p className="text-sm text-slate-500">{boardInfo?.fullName}</p>
              </div>
            </div>
            <a
              href={boardInfo?.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"
            >
              Official Website <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Latest Notifications</h2>
        
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">कोई नई notification नहीं है</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => {
              const isApplied = appliedNotifications.includes(notification.id);
              
              return (
                <Card key={notification.id} className={`transition-all ${notification.important ? 'ring-2 ring-amber-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        notification.type === 'exam' ? 'bg-red-100 text-red-600' :
                        notification.type === 'syllabus' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeBadge(notification.type)}
                              {notification.important && (
                                <Badge className="bg-amber-100 text-amber-700">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Important
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{notification.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {notification.date}
                              </span>
                              {notification.autoApply && (
                                <span className="flex items-center gap-1 text-indigo-500">
                                  <Sparkles className="w-3 h-3" />
                                  Auto-Apply Available
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 items-end">
                            <a
                              href={notification.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                            
                            {notification.autoApply && (
                              <Button
                                size="sm"
                                variant={isApplied ? "outline" : "default"}
                                disabled={isApplied || applyingId === notification.id}
                                onClick={() => handleApplyNotification(notification)}
                                className={isApplied ? 'text-green-600' : ''}
                              >
                                {applyingId === notification.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isApplied ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Applied
                                  </>
                                ) : (
                                  'Apply to System'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">AI Auto-Apply कैसे काम करता है?</p>
              <p className="text-sm text-slate-500 mt-1">
                जब आप "AI Auto Apply" click करते हो, तो system automatically:
              </p>
              <ul className="text-sm text-slate-500 mt-2 space-y-1 list-disc list-inside">
                <li>परीक्षा dates को school calendar में add करता है</li>
                <li>Syllabus updates को system में reflect करता है</li>
                <li>Important circulars को staff को notify करता है</li>
              </ul>
              <p className="text-sm text-indigo-600 mt-2">
                Admin approval के बाद ही changes apply होते हैं।
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
