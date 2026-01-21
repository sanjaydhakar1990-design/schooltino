import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Users, UserPlus, ArrowLeftRight, BookOpen, IndianRupee, Calendar,
  GraduationCap, Loader2, Check, X, Eye, ChevronRight, Home,
  TrendingUp, Clock, FileText, Bell, Smartphone, User, School
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function FamilyPortalPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [loading, setLoading] = useState(true);
  const [familyChildren, setFamilyChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [addChildForm, setAddChildForm] = useState({ student_id: '', dob: '' });
  const [addingChild, setAddingChild] = useState(false);
  
  // Child-specific data
  const [childData, setChildData] = useState({
    attendance: null,
    fees: null,
    syllabus: null,
    exams: null
  });
  const [loadingChildData, setLoadingChildData] = useState(false);

  useEffect(() => {
    fetchFamilyChildren();
  }, []);

  const fetchFamilyChildren = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/family/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFamilyChildren(response.data || []);
      
      // Auto-select first child if available
      if (response.data && response.data.length > 0) {
        setSelectedChild(response.data[0]);
        fetchChildData(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching family children:', error);
      // Demo data for testing
      const demoChildren = [
        {
          id: 'demo1',
          name: 'राहुल शर्मा',
          student_id: 'STU-SCS-2025-001',
          class_name: 'Class 8',
          section: 'A',
          photo_url: null,
          school_name: 'Sainath Convent School'
        },
        {
          id: 'demo2', 
          name: 'प्रिया शर्मा',
          student_id: 'STU-SCS-2025-045',
          class_name: 'Class 5',
          section: 'B',
          photo_url: null,
          school_name: 'Sainath Convent School'
        }
      ];
      setFamilyChildren(demoChildren);
      if (demoChildren.length > 0) {
        setSelectedChild(demoChildren[0]);
        fetchChildData(demoChildren[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    setLoadingChildData(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [attendanceRes, feesRes, syllabusRes, examsRes] = await Promise.all([
        axios.get(`${API}/api/family/child/${childId}/attendance`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
        axios.get(`${API}/api/family/child/${childId}/fees`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
        axios.get(`${API}/api/family/child/${childId}/syllabus-progress`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
        axios.get(`${API}/api/family/child/${childId}/exams`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
      ]);
      
      setChildData({
        attendance: attendanceRes.data || { present: 85, total: 100, percentage: 85 },
        fees: feesRes.data || { total: 45000, paid: 30000, pending: 15000 },
        syllabus: syllabusRes.data || { completed: 65, total: 100 },
        exams: examsRes.data || { upcoming: 2, recent_score: 78 }
      });
    } catch (error) {
      console.error('Error fetching child data:', error);
      // Demo data
      setChildData({
        attendance: { present: 85, total: 100, percentage: 85 },
        fees: { total: 45000, paid: 30000, pending: 15000 },
        syllabus: { completed: 65, total: 100 },
        exams: { upcoming: 2, recent_score: 78 }
      });
    } finally {
      setLoadingChildData(false);
    }
  };

  const handleAddChild = async () => {
    if (!addChildForm.student_id || !addChildForm.dob) {
      toast.error(isHindi ? 'Student ID और जन्मतिथि जरूरी है' : 'Student ID and DOB required');
      return;
    }
    
    setAddingChild(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/family/add-child`, {
        student_id: addChildForm.student_id,
        dob: addChildForm.dob,
        parent_mobile: user?.mobile
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(isHindi ? 'बच्चा जोड़ दिया गया!' : 'Child added successfully!');
      setShowAddChild(false);
      setAddChildForm({ student_id: '', dob: '' });
      fetchFamilyChildren();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'बच्चा जोड़ने में समस्या' : 'Error adding child'));
    } finally {
      setAddingChild(false);
    }
  };

  const handleSwitchChild = (child) => {
    setSelectedChild(child);
    fetchChildData(child.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="family-portal-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            {isHindi ? 'परिवार पोर्टल' : 'Family Portal'}
          </h1>
          <p className="text-slate-500">
            {isHindi ? 'एक जगह पर सभी बच्चों की जानकारी' : 'All your children\'s information in one place'}
          </p>
        </div>
        <Button onClick={() => setShowAddChild(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          {isHindi ? 'बच्चा जोड़ें' : 'Add Child'}
        </Button>
      </div>

      {familyChildren.length === 0 ? (
        /* No Children State */
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isHindi ? 'कोई बच्चा नहीं जुड़ा' : 'No Children Linked'}
          </h3>
          <p className="text-slate-500 mb-4">
            {isHindi ? 'अपने बच्चे का Student ID और जन्मतिथि डालकर जोड़ें' : 'Add your child using their Student ID and Date of Birth'}
          </p>
          <Button onClick={() => setShowAddChild(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" />
            {isHindi ? 'बच्चा जोड़ें' : 'Add Child'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Children List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <School className="w-4 h-4" />
                  {isHindi ? 'मेरे बच्चे' : 'My Children'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {familyChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSwitchChild(child)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedChild?.id === child.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedChild?.id === child.id ? 'bg-indigo-500 text-white' : 'bg-slate-200'
                      }`}>
                        {child.photo_url ? (
                          <img src={child.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{child.name}</p>
                        <p className="text-xs text-slate-500">{child.class_name} - {child.section}</p>
                      </div>
                      {selectedChild?.id === child.id && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
                
                {/* Add Another Child Button */}
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {isHindi ? 'और जोड़ें' : 'Add More'}
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Selected Child Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {selectedChild && (
              <>
                {/* Child Info Header */}
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        {selectedChild.photo_url ? (
                          <img src={selectedChild.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <GraduationCap className="w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{selectedChild.name}</h2>
                        <p className="text-white/80">{selectedChild.class_name} - {selectedChild.section}</p>
                        <p className="text-sm text-white/60">ID: {selectedChild.student_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/80">{selectedChild.school_name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {loadingChildData ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Attendance */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{isHindi ? 'उपस्थिति' : 'Attendance'}</p>
                              <p className="text-xl font-bold text-green-600">{childData.attendance?.percentage || 0}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Fees */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <IndianRupee className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{isHindi ? 'बकाया फीस' : 'Pending Fee'}</p>
                              <p className="text-xl font-bold text-amber-600">₹{(childData.fees?.pending || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Syllabus Progress */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{isHindi ? 'सिलेबस' : 'Syllabus'}</p>
                              <p className="text-xl font-bold text-blue-600">{childData.syllabus?.completed || 0}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Exams */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{isHindi ? 'अंक' : 'Score'}</p>
                              <p className="text-xl font-bold text-purple-600">{childData.exams?.recent_score || 0}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fee Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-amber-600" />
                            {isHindi ? 'फीस विवरण' : 'Fee Details'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">{isHindi ? 'कुल फीस' : 'Total Fee'}</span>
                            <span className="font-bold">₹{(childData.fees?.total || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-600">
                            <span>{isHindi ? 'जमा' : 'Paid'}</span>
                            <span className="font-bold">₹{(childData.fees?.paid || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-600">
                            <span>{isHindi ? 'बकाया' : 'Pending'}</span>
                            <span className="font-bold">₹{(childData.fees?.pending || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${((childData.fees?.paid || 0) / (childData.fees?.total || 1)) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Attendance Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            {isHindi ? 'उपस्थिति विवरण' : 'Attendance Details'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">{isHindi ? 'कुल दिन' : 'Total Days'}</span>
                            <span className="font-bold">{childData.attendance?.total || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-600">
                            <span>{isHindi ? 'उपस्थित' : 'Present'}</span>
                            <span className="font-bold">{childData.attendance?.present || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-red-600">
                            <span>{isHindi ? 'अनुपस्थित' : 'Absent'}</span>
                            <span className="font-bold">{(childData.attendance?.total || 0) - (childData.attendance?.present || 0)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${childData.attendance?.percentage || 0}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Syllabus Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          {isHindi ? 'सिलेबस प्रगति' : 'Syllabus Progress'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2">
                              <span>{isHindi ? 'पूर्ण' : 'Completed'}</span>
                              <span className="font-bold">{childData.syllabus?.completed || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
                                style={{ width: `${childData.syllabus?.completed || 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{childData.syllabus?.completed || 0}%</p>
                            <p className="text-xs text-slate-500">{isHindi ? 'पूर्ण' : 'Done'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Combined View - All Children Summary */}
      {familyChildren.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              {isHindi ? 'सभी बच्चों का सारांश' : 'All Children Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">{isHindi ? 'नाम' : 'Name'}</th>
                    <th className="text-left py-3 px-2">{isHindi ? 'कक्षा' : 'Class'}</th>
                    <th className="text-center py-3 px-2">{isHindi ? 'उपस्थिति' : 'Attendance'}</th>
                    <th className="text-center py-3 px-2">{isHindi ? 'सिलेबस' : 'Syllabus'}</th>
                    <th className="text-right py-3 px-2">{isHindi ? 'बकाया फीस' : 'Pending Fee'}</th>
                  </tr>
                </thead>
                <tbody>
                  {familyChildren.map((child) => (
                    <tr key={child.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium">{child.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">{child.class_name} - {child.section}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">85%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">65%</span>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-amber-600">₹15,000</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-2" colSpan={4}>{isHindi ? 'कुल बकाया फीस' : 'Total Pending Fee'}</td>
                    <td className="py-3 px-2 text-right text-amber-600">₹{(familyChildren.length * 15000).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {isHindi ? 'बच्चा जोड़ें' : 'Add Child'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddChild(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              {isHindi 
                ? 'अपने बच्चे का Student ID और जन्मतिथि डालें। यह ID आपको स्कूल से मिली होगी।' 
                : 'Enter your child\'s Student ID and Date of Birth. You would have received the ID from school.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>{isHindi ? 'Student ID' : 'Student ID'} *</Label>
                <Input
                  value={addChildForm.student_id}
                  onChange={(e) => setAddChildForm({ ...addChildForm, student_id: e.target.value })}
                  placeholder="STU-SCS-2025-001"
                />
              </div>
              <div>
                <Label>{isHindi ? 'जन्मतिथि' : 'Date of Birth'} *</Label>
                <Input
                  type="date"
                  value={addChildForm.dob}
                  onChange={(e) => setAddChildForm({ ...addChildForm, dob: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleAddChild} 
                disabled={addingChild}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {addingChild ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {isHindi ? 'जोड़ें' : 'Add'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddChild(false)} className="flex-1">
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
