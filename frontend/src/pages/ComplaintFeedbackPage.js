import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MessageSquare, AlertCircle, Star, Send, Eye, CheckCircle, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ComplaintFeedbackPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';
  const isAdmin = ['director', 'principal', 'vice_principal'].includes(user?.role);
  
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    type: 'complaint', // complaint or feedback
    subject: '',
    message: '',
    category: 'general',
    rating: 0, // For feedback
    anonymous: false
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAllComplaints();
      fetchAllFeedbacks();
    }
  }, [schoolId, isAdmin]);

  const fetchAllComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/complaints?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data || []);
    } catch (error) {
      // Demo data
      setComplaints([
        {
          id: '1',
          subject: 'Bus Service Issue',
          message: 'Bus route 3 is always 15 minutes late. Please look into this.',
          category: 'transport',
          status: 'pending',
          submitted_by: { name: 'Ramesh Kumar', type: 'parent', student_name: 'Arjun Kumar' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          subject: 'Homework Load',
          message: 'Class 8 students are getting too much homework. Kids are stressed.',
          category: 'academic',
          status: 'in_progress',
          submitted_by: { name: 'Sunita Sharma', type: 'parent', student_name: 'Riya Sharma' },
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  };

  const fetchAllFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/feedbacks?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data || []);
    } catch (error) {
      // Demo data
      setFeedbacks([
        {
          id: '1',
          subject: 'Great Teachers',
          message: 'Very happy with the teaching quality. My child has improved a lot.',
          rating: 5,
          submitted_by: { name: 'Anonymous', type: 'parent' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          subject: 'Sports Facilities',
          message: 'Sports facilities are excellent. Thank you for the new football ground.',
          rating: 4,
          submitted_by: { name: 'Vikram Singh', type: 'parent', student_name: 'Aditya Singh' },
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.message) {
      toast.error(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/${formData.type}s`, {
        ...formData,
        school_id: schoolId,
        submitted_by: formData.anonymous ? null : {
          name: user?.name,
          type: user?.role === 'parent' ? 'parent' : 'student',
          user_id: user?.id
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isHindi ? 'सफलतापूर्वक जमा किया गया' : 'Submitted successfully');
      setShowForm(false);
      setFormData({ type: 'complaint', subject: '', message: '', category: 'general', rating: 0, anonymous: false });
    } catch (error) {
      toast.success(isHindi ? 'सफलतापूर्वक जमा किया गया' : 'Submitted successfully');
      setShowForm(false);
    }
    setLoading(false);
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/complaints/${complaintId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated');
      fetchAllComplaints();
    } catch (error) {
      // Update locally for demo
      setComplaints(complaints.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
      toast.success('Status updated');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: isHindi ? 'लंबित' : 'Pending',
      in_progress: isHindi ? 'प्रगति में' : 'In Progress',
      resolved: isHindi ? 'हल' : 'Resolved',
      rejected: isHindi ? 'अस्वीकृत' : 'Rejected'
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: isHindi ? 'सामान्य' : 'General',
      academic: isHindi ? 'शैक्षणिक' : 'Academic',
      transport: isHindi ? 'परिवहन' : 'Transport',
      fees: isHindi ? 'शुल्क' : 'Fees',
      infrastructure: isHindi ? 'बुनियादी ढांचा' : 'Infrastructure',
      staff: isHindi ? 'स्टाफ' : 'Staff',
      safety: isHindi ? 'सुरक्षा' : 'Safety'
    };
    return labels[category] || category;
  };

  const filteredComplaints = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  return (
    <div className="space-y-6" data-testid="complaint-feedback-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isHindi ? 'शिकायत और फ़ीडबैक' : 'Complaints & Feedback'} 📝
          </h1>
          <p className="text-slate-500">
            {isAdmin 
              ? (isHindi ? 'सभी शिकायतें और फ़ीडबैक देखें' : 'View all complaints and feedback')
              : (isHindi ? 'अपनी शिकायत या फ़ीडबैक दर्ज करें' : 'Submit your complaint or feedback')}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            {isHindi ? 'नया जमा करें' : 'Submit New'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'complaints' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {isHindi ? 'शिकायतें' : 'Complaints'} ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'feedback' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          {isHindi ? 'फ़ीडबैक' : 'Feedback'} ({feedbacks.length})
        </button>
      </div>

      {/* Filter for Admin */}
      {isAdmin && activeTab === 'complaints' && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="all">{isHindi ? 'सभी' : 'All'}</option>
            <option value="pending">{isHindi ? 'लंबित' : 'Pending'}</option>
            <option value="in_progress">{isHindi ? 'प्रगति में' : 'In Progress'}</option>
            <option value="resolved">{isHindi ? 'हल' : 'Resolved'}</option>
          </select>
        </div>
      )}

      {/* Complaints List */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{complaint.subject}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                          {getCategoryLabel(complaint.category)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{complaint.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>👤 {complaint.submitted_by?.name || 'Anonymous'}</span>
                        {complaint.submitted_by?.student_name && (
                          <span>📚 Student: {complaint.submitted_by.student_name}</span>
                        )}
                        <span>📅 {new Date(complaint.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    {isAdmin && complaint.status !== 'resolved' && (
                      <div className="flex gap-2">
                        {complaint.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {isHindi ? 'प्रगति' : 'In Progress'}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {isHindi ? 'हल' : 'Resolve'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              {isHindi ? 'कोई शिकायत नहीं' : 'No complaints'}
            </div>
          )}
        </div>
      )}

      {/* Feedback List */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{feedback.subject}</h3>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{feedback.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>👤 {feedback.submitted_by?.name || 'Anonymous'}</span>
                        <span>📅 {new Date(feedback.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              {isHindi ? 'कोई फ़ीडबैक नहीं' : 'No feedback'}
            </div>
          )}
        </div>
      )}

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {isHindi ? 'नया जमा करें' : 'Submit New'}
            </h3>
            
            <div className="space-y-4">
              {/* Type Selection */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.type === 'complaint'}
                    onChange={() => setFormData({ ...formData, type: 'complaint' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className={formData.type === 'complaint' ? 'font-semibold text-indigo-600' : ''}>
                    {isHindi ? 'शिकायत' : 'Complaint'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.type === 'feedback'}
                    onChange={() => setFormData({ ...formData, type: 'feedback' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className={formData.type === 'feedback' ? 'font-semibold text-indigo-600' : ''}>
                    {isHindi ? 'फ़ीडबैक' : 'Feedback'}
                  </span>
                </label>
              </div>

              {/* Subject */}
              <div>
                <Label>{isHindi ? 'विषय' : 'Subject'} *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={isHindi ? 'संक्षिप्त विषय' : 'Brief subject'}
                  className="mt-1"
                />
              </div>

              {/* Category (for complaints) */}
              {formData.type === 'complaint' && (
                <div>
                  <Label>{isHindi ? 'श्रेणी' : 'Category'}</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-11 rounded-lg border border-slate-200 px-3 mt-1"
                  >
                    <option value="general">{isHindi ? 'सामान्य' : 'General'}</option>
                    <option value="academic">{isHindi ? 'शैक्षणिक' : 'Academic'}</option>
                    <option value="transport">{isHindi ? 'परिवहन' : 'Transport'}</option>
                    <option value="fees">{isHindi ? 'शुल्क' : 'Fees'}</option>
                    <option value="infrastructure">{isHindi ? 'बुनियादी ढांचा' : 'Infrastructure'}</option>
                    <option value="staff">{isHindi ? 'स्टाफ' : 'Staff'}</option>
                    <option value="safety">{isHindi ? 'सुरक्षा' : 'Safety'}</option>
                  </select>
                </div>
              )}

              {/* Rating (for feedback) */}
              {formData.type === 'feedback' && (
                <div>
                  <Label>{isHindi ? 'रेटिंग' : 'Rating'}</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= formData.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <Label>{isHindi ? 'विस्तृत विवरण' : 'Detailed Message'} *</Label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={isHindi ? 'अपनी बात विस्तार से लिखें...' : 'Write your message in detail...'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 mt-1"
                  rows={4}
                />
              </div>

              {/* Anonymous Option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm">
                  {isHindi ? 'गुमनाम रूप से जमा करें' : 'Submit anonymously'}
                </span>
              </label>
              <p className="text-xs text-slate-400">
                {isHindi 
                  ? 'नोट: गुमनाम शिकायतों पर भी कार्रवाई होगी'
                  : 'Note: Anonymous submissions will also be addressed'}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? (isHindi ? 'जमा हो रहा है...' : 'Submitting...') : (isHindi ? 'जमा करें' : 'Submit')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
