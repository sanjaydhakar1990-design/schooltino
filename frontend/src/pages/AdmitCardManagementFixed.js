/**
 * FIXED ADMIT CARD MANAGEMENT
 * All issues resolved with proper error handling
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  FileText, Settings, Plus, Calendar, Users, Download, CheckCircle,
  AlertCircle, Percent, Eye, Printer, Upload, BookOpen, School,
  GraduationCap, Clock, MapPin, X, Edit, Trash2, Send, ExternalLink, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import AdmitCardPreviewComponent from '../components/AdmitCardPreviewComponent';
import BulkBoardAdmitCard from '../components/BulkBoardAdmitCard';

const API = process.env.REACT_APP_BACKEND_URL || '';

const AdmitCardManagementFixed = () => {
  const { user } = useAuth();
  const schoolId = user?.school_id;

  const [settings, setSettings] = useState({
    min_fee_percentage: 30,
    require_fee_clearance: true,
    show_photo: true,
    show_signature: true,
    show_seal: true,
    signature_authority: 'principal',
    enable_studytino_download: true
  });

  const [exams, setExams] = useState([]);
  const [boardExams, setBoardExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showBoardExamDialog, setShowBoardExamDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('school');
  
  const [editingExam, setEditingExam] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showBulkBoardDialog, setShowBulkBoardDialog] = useState(false);
  const [selectedBoardExam, setSelectedBoardExam] = useState(null);
  const [saving, setSaving] = useState(false);

  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: 'unit_test',
    start_date: '',
    end_date: '',
    classes: [],
    subjects: [],
    instructions: [
      'Admit card अनिवार्य है।',
      'Exam से 15 मिनट पहले पहुंचें।',
      'Mobile phone लाना मना है।'
    ],
    venue: ''
  });

  const [boardExamForm, setBoardExamForm] = useState({
    exam_name: '',
    board: 'CBSE',
    roll_number_prefix: '',
    centre_code: '',
    admit_card_file: null
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [settingsRes, examsRes, boardExamsRes, classesRes] = await Promise.allSettled([
        axios.get(`${API}/api/admit-card/settings/${schoolId}`, { headers }),
        axios.get(`${API}/api/admit-card/exams/${schoolId}?type=school`, { headers }),
        axios.get(`${API}/api/admit-card/exams/${schoolId}?type=board`, { headers }),
        axios.get(`${API}/api/classes?school_id=${schoolId}`, { headers })
      ]);

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data);
      }
      if (examsRes.status === 'fulfilled') {
        console.log('Fetched exams:', examsRes.value.data.exams);
        setExams(examsRes.value.data.exams || []);
      }
      if (boardExamsRes.status === 'fulfilled') {
        setBoardExams(boardExamsRes.value.data.exams || []);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Data load करने में समस्या');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admit-card/settings`, {
        school_id: schoolId,
        ...settings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Settings saved!');
      setShowSettingsDialog(false);
    } catch (err) {
      toast.error('Settings save failed');
    }
  };

  const createOrUpdateExam = async () => {
    if (!examForm.exam_name || !examForm.start_date || !examForm.end_date) {
      toast.error('Exam name and dates required');
      return;
    }

    if (examForm.classes.length === 0) {
      toast.error('कम से कम एक class select करें');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      if (editingExam) {
        // UPDATE
        console.log('UPDATE - Exam ID:', editingExam.id);
        console.log('UPDATE - School ID:', schoolId);
        console.log('UPDATE - Payload:', examForm);
        
        const response = await axios.put(
          `${API}/api/admit-card/exam/${editingExam.id}`,
          {
            school_id: schoolId,
            ...examForm
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('UPDATE Response:', response.data);
        toast.success(`✅ Exam updated!`);
      } else {
        // CREATE
        console.log('CREATE - Payload:', { school_id: schoolId, ...examForm });
        
        const response = await axios.post(
          `${API}/api/admit-card/exam`,
          {
            school_id: schoolId,
            ...examForm,
            exam_category: 'school',
            created_by: user?.id
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('CREATE Response:', response.data);
        toast.success(`✅ Exam created!`);
      }
      
      setShowExamDialog(false);
      setEditingExam(null);
      resetExamForm();
      fetchData();
    } catch (err) {
      console.error('Save Error Full:', err);
      console.error('Error Response:', err.response);
      toast.error(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const openEditExam = (exam) => {
    console.log('Opening edit for exam:', exam);
    setEditingExam(exam);
    setExamForm({
      exam_name: exam.exam_name || '',
      exam_type: exam.exam_type || 'unit_test',
      start_date: exam.start_date || '',
      end_date: exam.end_date || '',
      classes: exam.classes || [],
      subjects: exam.subjects || [],
      instructions: exam.instructions || [
        'Admit card अनिवार्य है।',
        'Exam से 15 मिनट पहले पहुंचें।',
        'Mobile phone लाना मना है।'
      ],
      venue: exam.venue || ''
    });
    setShowExamDialog(true);
  };

  const confirmDeleteExam = (exam) => {
    console.log('Delete confirmation for exam:', exam);
    setExamToDelete(exam);
    setShowDeleteDialog(true);
  };

  const deleteExam = async () => {
    if (!examToDelete) return;

    try {
      const token = localStorage.getItem('token');
      console.log('DELETE - Exam ID:', examToDelete.id);
      console.log('DELETE - School ID:', schoolId);
      console.log('DELETE - Full URL:', `${API}/api/admit-card/exam/${examToDelete.id}?school_id=${schoolId}`);
      
      const response = await axios.delete(
        `${API}/api/admit-card/exam/${examToDelete.id}?school_id=${schoolId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('DELETE Response:', response.data);
      toast.success(`✅ Exam deleted!`);
      setShowDeleteDialog(false);
      setExamToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Delete Error Full:', err);
      console.error('Error Response:', err.response);
      console.error('Error Data:', err.response?.data);
      toast.error(err.response?.data?.detail || err.message || 'Delete failed');
    }
  };

  const resetExamForm = () => {
    setExamForm({
      exam_name: '',
      exam_type: 'unit_test',
      start_date: '',
      end_date: '',
      classes: [],
      subjects: [],
      instructions: [
        'Admit card अनिवार्य है।',
        'Exam से 15 मिनट पहले पहुंचें।',
        'Mobile phone लाना मना है।'
      ],
      venue: ''
    });
  };

  const toggleClassSelection = (classId) => {
    setExamForm(prev => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter(id => id !== classId)
        : [...prev.classes, classId]
    }));
  };

  const addSubject = () => {
    setExamForm(prev => ({
      ...prev,
      subjects: [...prev.subjects, {
        subject_name: '',
        exam_date: '',
        exam_time: '',
        duration: '3 hours',
        max_marks: 100
      }]
    }));
  };

  const removeSubject = (index) => {
    setExamForm(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const updateSubject = (index, field, value) => {
    setExamForm(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => 
        i === index ? { ...subject, [field]: value } : subject
      )
    }));
  };

  const examTypes = [
    { value: 'unit_test', label: 'Unit Test', icon: '📝' },
    { value: 'quarterly', label: 'Quarterly', icon: '📚' },
    { value: 'half_yearly', label: 'Half Yearly', icon: '📖' },
    { value: 'annual', label: 'Annual', icon: '🎓' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8" />
          Admit Card Management
        </h1>
        <p className="text-indigo-100 mt-1">Create exams and manage admit cards</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{exams.length}</div>
          <div className="text-sm text-blue-700">School Exams</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{boardExams.length}</div>
          <div className="text-sm text-purple-700">Board Exams</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="text-3xl font-bold text-green-600">{settings.min_fee_percentage}%</div>
          <div className="text-sm text-green-700">Min Fee</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
          <div className="text-3xl font-bold text-amber-600">{classes.length}</div>
          <div className="text-sm text-amber-700">Classes</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowExamDialog(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create School Exam
        </Button>
        <Button 
          onClick={() => setShowBoardExamDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Board Exam
        </Button>
        <Button 
          variant="outline"
          onClick={() => setShowSettingsDialog(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">School Exams ({exams.length})</h2>
        
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No exams yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl border-2 p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{exam.exam_name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {examTypes.find(t => t.value === exam.exam_type)?.icon} {examTypes.find(t => t.value === exam.exam_type)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditExam(exam)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDeleteExam(exam)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {exam.start_date} - {exam.end_date}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {exam.classes?.length || 0} Classes
                  </p>
                  <Badge className={exam.status === 'upcoming' ? 'bg-blue-500' : exam.status === 'ongoing' ? 'bg-green-500' : 'bg-gray-500'}>
                    {exam.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline">
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-1" />
                    Publish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Board Exams */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Board Exams ({boardExams.length})</h2>
        
        {boardExams.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No board exams yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardExams.map((exam) => (
              <div key={exam.id} className="bg-purple-50 rounded-xl border-2 border-purple-200 p-5">
                <h3 className="font-bold text-lg">{exam.exam_name}</h3>
                <Badge className="mt-2">{exam.board}</Badge>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedBoardExam(exam);
                      setShowBulkBoardDialog(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Bulk Upload
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                    Publish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Exam Dialog */}
      <Dialog open={showExamDialog} onOpenChange={(open) => {
        setShowExamDialog(open);
        if (!open) {
          setEditingExam(null);
          resetExamForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {editingExam ? (
                <>
                  <Edit className="w-6 h-6 text-blue-600" />
                  Edit Exam
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6 text-indigo-600" />
                  Create Exam
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Name *</Label>
                <Input
                  placeholder="e.g., Unit Test 1"
                  value={examForm.exam_name}
                  onChange={(e) => setExamForm({...examForm, exam_name: e.target.value})}
                />
              </div>

              <div>
                <Label>Exam Type *</Label>
                <select
                  value={examForm.exam_type}
                  onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {examTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={examForm.start_date}
                  onChange={(e) => setExamForm({...examForm, start_date: e.target.value})}
                />
              </div>

              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm({...examForm, end_date: e.target.value})}
                />
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Select Classes * (कम से कम एक)
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                {classes.map(cls => (
                  <label 
                    key={cls.id} 
                    className="flex items-center gap-2 p-2 bg-white rounded hover:bg-indigo-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={examForm.classes.includes(cls.id)}
                      onChange={() => toggleClassSelection(cls.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{cls.name}</span>
                  </label>
                ))}
              </div>
              {examForm.classes.length > 0 && (
                <p className="text-xs text-green-600 mt-1">✅ {examForm.classes.length} selected</p>
              )}
            </div>

            {/* Subjects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Subjects Schedule (Optional)</Label>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSubject}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              </div>

              {examForm.subjects.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {examForm.subjects.map((subject, index) => (
                    <div key={index} className="p-2 border rounded-lg bg-gray-50 flex gap-2">
                      <Input
                        placeholder="Subject"
                        value={subject.subject_name}
                        onChange={(e) => updateSubject(index, 'subject_name', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Input
                        type="date"
                        value={subject.exam_date}
                        onChange={(e) => updateSubject(index, 'exam_date', e.target.value)}
                        className="w-36 text-sm"
                      />
                      <Input
                        type="time"
                        value={subject.exam_time}
                        onChange={(e) => updateSubject(index, 'exam_time', e.target.value)}
                        className="w-28 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExamDialog(false);
                  setEditingExam(null);
                  resetExamForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={createOrUpdateExam}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Delete Exam?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>"{examToDelete?.exam_name}"</strong>?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              ⚠️ This will delete all admit cards. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={deleteExam}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Minimum Fee Percentage (%)</Label>
              <Input
                type="number"
                value={settings.min_fee_percentage}
                onChange={(e) => setSettings({...settings, min_fee_percentage: parseFloat(e.target.value) || 0})}
              />
            </div>
            <Button onClick={saveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      {showPreviewDialog && previewData && (
        <AdmitCardPreviewComponent 
          admitCardData={previewData}
          onClose={() => {
            setShowPreviewDialog(false);
            setPreviewData(null);
          }}
        />
      )}

      {/* Bulk Board */}
      {showBulkBoardDialog && selectedBoardExam && (
        <BulkBoardAdmitCard
          boardExam={selectedBoardExam}
          schoolId={schoolId}
          onClose={() => {
            setShowBulkBoardDialog(false);
            setSelectedBoardExam(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdmitCardManagementFixed;
