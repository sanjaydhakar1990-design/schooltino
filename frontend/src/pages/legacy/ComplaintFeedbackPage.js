import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { MessageSquare, AlertCircle, Star, Send, Eye, CheckCircle, Clock, Filter, Plus, Loader2, FileText, User, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ComplaintFeedbackPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';
  const isAdmin = ['director', 'principal', 'vice_principal', 'admin'].includes(user?.role);
  
  const [activeTab, setActiveTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0, total: 0 });
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'academic',
    complaint_to: 'admin',
    is_anonymous: false
  });

  useEffect(() => {
    fetchComplaints();
    fetchClasses();
  }, [schoolId]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/classes?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(res.data || []);
    } catch (error) {
      setClasses([]);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (isAdmin) {
        const response = await axios.get(`${API}/complaints/school/${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(response.data?.complaints || []);
        setStats(response.data?.stats || { pending: 0, in_progress: 0, resolved: 0, total: 0 });
      } else {
        const studentId = user?.student_id || user?.id;
        if (studentId) {
          const response = await axios.get(`${API}/complaints/student/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComplaints(response.data?.complaints || []);
        }
      }
    } catch (error) {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.description) {
      toast.error(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/complaints/create`, {
        student_id: formData.is_anonymous ? 'anonymous' : (user?.student_id || user?.id || ''),
        student_name: formData.is_anonymous ? 'Anonymous' : (user?.name || ''),
        class_id: user?.class_id || '',
        class_name: user?.class_name || '',
        school_id: schoolId,
        complaint_to: formData.complaint_to,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        is_anonymous: formData.is_anonymous
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isHindi ? 'शिकायत सफलतापूर्वक जमा हो गई' : 'Complaint submitted successfully');
      setShowForm(false);
      setFormData({ subject: '', description: '', category: 'academic', complaint_to: 'admin', is_anonymous: false });
      fetchComplaints();
    } catch (error) {
      toast.error(isHindi ? 'शिकायत जमा करने में विफल' : 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus, notes) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/complaints/resolve`, {
        complaint_id: complaintId,
        resolved_by: user?.name || 'Admin',
        resolution_notes: notes || (newStatus === 'resolved' ? 'Resolved by admin' : 'In progress'),
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isHindi ? 'स्थिति अपडेट हो गई' : 'Status updated');
      fetchComplaints();
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus, resolution_notes: notes || prev?.resolution_notes }));
      }
    } catch (error) {
      setComplaints(complaints.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
      toast.success(isHindi ? 'स्थिति अपडेट हो गई' : 'Status updated');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdminRespond = async () => {
    if (!adminResponse.trim() || !selectedComplaint) return;
    await updateComplaintStatus(selectedComplaint.id, selectedComplaint.status === 'pending' ? 'in_progress' : selectedComplaint.status, adminResponse);
    setAdminResponse('');
    setShowDetailDialog(false);
    fetchComplaints();
  };

  const openComplaintDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setAdminResponse('');
    setShowDetailDialog(true);
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
      academic: isHindi ? 'शैक्षणिक' : 'Academic',
      bullying: isHindi ? 'धमकाना' : 'Bullying',
      facilities: isHindi ? 'सुविधाएं' : 'Facilities',
      teacher: isHindi ? 'शिक्षक' : 'Teacher',
      fees: isHindi ? 'शुल्क' : 'Fees',
      transport: isHindi ? 'परिवहन' : 'Transport',
      food: isHindi ? 'खाना' : 'Food',
      other: isHindi ? 'अन्य' : 'Other'
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComplaints = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  return (
    <div className="space-y-6" data-testid="complaint-feedback-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isHindi ? 'शिकायत प्रबंधन' : 'Complaint Management'} 📝
          </h1>
          <p className="text-slate-500">
            {isAdmin 
              ? (isHindi ? 'सभी शिकायतें देखें और प्रबंधित करें' : 'View and manage all complaints')
              : (isHindi ? 'अपनी शिकायत दर्ज करें' : 'Submit your complaint')}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            {isHindi ? 'नई शिकायत' : 'New Complaint'}
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{isHindi ? 'लंबित' : 'Pending'}</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{isHindi ? 'प्रगति में' : 'In Progress'}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{isHindi ? 'हल' : 'Resolved'}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-slate-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{isHindi ? 'कुल' : 'Total'}</p>
                  <p className="text-2xl font-bold text-slate-600">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white"
          >
            <option value="all">{isHindi ? 'सभी' : 'All'}</option>
            <option value="pending">{isHindi ? 'लंबित' : 'Pending'}</option>
            <option value="in_progress">{isHindi ? 'प्रगति में' : 'In Progress'}</option>
            <option value="resolved">{isHindi ? 'हल' : 'Resolved'}</option>
            <option value="rejected">{isHindi ? 'अस्वीकृत' : 'Rejected'}</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchComplaints}>
          {isHindi ? 'रिफ्रेश' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 hover:shadow-md transition-shadow ${
                complaint.status === 'pending' ? 'border-l-amber-500' :
                complaint.status === 'in_progress' ? 'border-l-blue-500' :
                complaint.status === 'resolved' ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{complaint.subject}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                          {getCategoryLabel(complaint.category)}
                        </span>
                        {complaint.priority && complaint.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{complaint.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {complaint.student_name || complaint.submitted_by?.name || 'Anonymous'}</span>
                        {complaint.class_name && <span>📚 {complaint.class_name}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : '-'}</span>
                        {complaint.complaint_to && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> To: {complaint.complaint_to}</span>}
                      </div>
                      {complaint.resolution_notes && (
                        <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-800">
                          <strong>{isHindi ? 'समाधान:' : 'Response:'}</strong> {complaint.resolution_notes}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4 flex-shrink-0 flex-col sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openComplaintDetail(complaint)}
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {isHindi ? 'देखें' : 'View'}
                        </Button>
                        {complaint.status !== 'resolved' && (
                          <>
                            {complaint.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {isHindi ? 'प्रगति' : 'Progress'}
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white rounded-xl shadow-sm border border-slate-100">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">
                  {isHindi ? 'कोई शिकायत नहीं मिली' : 'No complaints found'}
                </p>
                {!isAdmin && (
                  <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    {isHindi ? 'नई शिकायत दर्ज करें' : 'Submit New Complaint'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isAdmin && showDetailDialog && selectedComplaint && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {isHindi ? 'शिकायत विवरण' : 'Complaint Details'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{isHindi ? 'विषय' : 'Subject'}</p>
                  <p className="text-base font-semibold text-slate-900 mt-0.5">{selectedComplaint.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{isHindi ? 'विवरण' : 'Description'}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{selectedComplaint.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{isHindi ? 'प्रेषक' : 'From'}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedComplaint.student_name || selectedComplaint.submitted_by?.name || 'Anonymous'}</p>
                  {selectedComplaint.submitted_by?.role && (
                    <p className="text-xs text-slate-500 capitalize">{selectedComplaint.submitted_by.role}</p>
                  )}
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{isHindi ? 'कक्षा' : 'Class'}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedComplaint.class_name || '-'}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{isHindi ? 'श्रेणी' : 'Category'}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{getCategoryLabel(selectedComplaint.category)}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{isHindi ? 'दिनांक' : 'Date'}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isHindi ? 'स्थिति:' : 'Status:'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                  {getStatusLabel(selectedComplaint.status)}
                </span>
                {selectedComplaint.complaint_to && (
                  <>
                    <span className="text-xs text-slate-400 ml-2">{isHindi ? 'किसे:' : 'To:'}</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600 capitalize">{selectedComplaint.complaint_to}</span>
                  </>
                )}
              </div>

              {selectedComplaint.resolution_notes && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-medium mb-1">{isHindi ? 'प्रशासन प्रतिक्रिया' : 'Admin Response'}</p>
                  <p className="text-sm text-green-800">{selectedComplaint.resolution_notes}</p>
                </div>
              )}

              {selectedComplaint.status !== 'resolved' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <Label className="text-sm">{isHindi ? 'प्रतिक्रिया / नोट जोड़ें' : 'Add Response / Note'}</Label>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder={isHindi ? 'अपनी प्रतिक्रिया या नोट यहां लिखें...' : 'Write your response or note here...'}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    {adminResponse.trim() && (
                      <Button
                        onClick={handleAdminRespond}
                        disabled={updatingStatus}
                        className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                      >
                        {updatingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        {isHindi ? 'प्रतिक्रिया भेजें' : 'Send Response'}
                      </Button>
                    )}
                    {selectedComplaint.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => { updateComplaintStatus(selectedComplaint.id, 'in_progress', adminResponse || undefined); setShowDetailDialog(false); }}
                        disabled={updatingStatus}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        {isHindi ? 'प्रगति में' : 'Mark In Progress'}
                      </Button>
                    )}
                    <Button
                      onClick={() => { updateComplaintStatus(selectedComplaint.id, 'resolved', adminResponse || 'Resolved by admin'); setShowDetailDialog(false); }}
                      disabled={updatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {isHindi ? 'हल करें' : 'Resolve'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isHindi ? 'नई शिकायत दर्ज करें' : 'Submit New Complaint'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>{isHindi ? 'विषय' : 'Subject'} *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={isHindi ? 'संक्षिप्त विषय' : 'Brief subject'}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{isHindi ? 'श्रेणी' : 'Category'}</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1 text-sm"
                >
                  <option value="academic">{isHindi ? 'शैक्षणिक' : 'Academic'}</option>
                  <option value="bullying">{isHindi ? 'धमकाना' : 'Bullying'}</option>
                  <option value="facilities">{isHindi ? 'सुविधाएं' : 'Facilities'}</option>
                  <option value="teacher">{isHindi ? 'शिक्षक' : 'Teacher Related'}</option>
                  <option value="fees">{isHindi ? 'शुल्क' : 'Fees'}</option>
                  <option value="transport">{isHindi ? 'परिवहन' : 'Transport'}</option>
                  <option value="food">{isHindi ? 'खाना' : 'Food/Canteen'}</option>
                  <option value="other">{isHindi ? 'अन्य' : 'Other'}</option>
                </select>
              </div>

              <div>
                <Label>{isHindi ? 'शिकायत किसे' : 'Complaint To'}</Label>
                <select
                  value={formData.complaint_to}
                  onChange={(e) => setFormData({ ...formData, complaint_to: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1 text-sm"
                >
                  <option value="admin">{isHindi ? 'प्रशासन' : 'Admin'}</option>
                  <option value="teacher">{isHindi ? 'शिक्षक' : 'Teacher'}</option>
                  <option value="both">{isHindi ? 'दोनों' : 'Both'}</option>
                </select>
              </div>

              <div>
                <Label>{isHindi ? 'विस्तृत विवरण' : 'Description'} *</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isHindi ? 'अपनी शिकायत विस्तार से लिखें...' : 'Describe your complaint in detail...'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 mt-1 text-sm"
                  rows={4}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm">
                  {isHindi ? 'गुमनाम रूप से जमा करें' : 'Submit anonymously'}
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? (isHindi ? 'जमा हो रहा है...' : 'Submitting...') : (isHindi ? 'जमा करें' : 'Submit')}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}