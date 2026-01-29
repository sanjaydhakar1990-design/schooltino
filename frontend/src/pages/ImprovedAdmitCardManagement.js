/**
 * IMPROVED ADMIT CARD MANAGEMENT SYSTEM
 * ✅ School Exams + Board Exams
 * ✅ Subject-wise scheduling
 * ✅ Fee validation (percentage-based)
 * ✅ Preview & Download
 * ✅ StudyTino Integration
 * ✅ Better UI/UX
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
  GraduationCap, Clock, MapPin, X, Edit, Trash2, Send, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import AdmitCardPreviewComponent from '../components/AdmitCardPreviewComponent';
import BulkBoardAdmitCard from '../components/BulkBoardAdmitCard';

const API = process.env.REACT_APP_BACKEND_URL || '';

const ImprovedAdmitCardManagement = () => {
  const { user } = useAuth();
  const schoolId = user?.school_id;

  const [settings, setSettings] = useState({
    min_fee_percentage: 30,
    fee_requirement_type: 'percentage',  // 'no_requirement', 'percentage', 'all_clear'
    require_fee_clearance: true,
    show_photo: true,
    show_signature: true,
    show_seal: true,
    signature_authority: 'principal',
    enable_studytino_download: true,
    enable_online_payment: true,
    fee_deadline: null,
    auto_activate_after_deadline: false
  });

  const [exams, setExams] = useState([]);
  const [boardExams, setBoardExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showBoardExamDialog, setShowBoardExamDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('school'); // school or board
  
  // New states for edit, delete, cash fee
  const [editingExam, setEditingExam] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showCashFeeDialog, setShowCashFeeDialog] = useState(false);
  const [cashFeeStudent, setCashFeeStudent] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printExam, setPrintExam] = useState(null);
  const [showBulkBoardDialog, setShowBulkBoardDialog] = useState(false);
  const [selectedBoardExam, setSelectedBoardExam] = useState(null);

  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: 'unit_test',
    start_date: '',
    end_date: '',
    classes: [],
    subjects: [],
    instructions: [
      'Admit card अनिवार्य है। बिना admit card के exam में बैठने नहीं दिया जाएगा।',
      'Exam से 15 मिनट पहले पहुंचें।',
      'Mobile phone और calculator लाना मना है।'
    ],
    venue: ''
  });

  const [boardExamForm, setBoardExamForm] = useState({
    exam_name: '',
    board: 'CBSE',
    roll_number_prefix: '',
    centre_code: '',
    exam_schedule: [],
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

      // First, run migration to fix any old exams without exam_category
      try {
        await axios.post(`${API}/api/admit-card/migrate-exams`, { school_id: schoolId }, { headers });
      } catch (e) {
        console.log('Migration skipped:', e.message);
      }

      const [settingsRes, examsRes, boardExamsRes, classesRes, subjectsRes] = await Promise.allSettled([
        axios.get(`${API}/api/admit-card/settings/${schoolId}`, { headers }),
        axios.get(`${API}/api/admit-card/exams/${schoolId}?type=school`, { headers }),
        axios.get(`${API}/api/admit-card/exams/${schoolId}?type=board`, { headers }),
        axios.get(`${API}/api/classes?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/api/subjects?school_id=${schoolId}`, { headers })
      ]);

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data);
      }
      if (examsRes.status === 'fulfilled') {
        setExams(examsRes.value.data.exams || []);
      }
      if (boardExamsRes.status === 'fulfilled') {
        setBoardExams(boardExamsRes.value.data.exams || []);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data || []);
      }
      if (subjectsRes.status === 'fulfilled') {
        setSubjects(subjectsRes.value.data || []);
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

  const createExam = async () => {
    if (!examForm.exam_name || !examForm.start_date || !examForm.end_date) {
      toast.error('Exam name and dates are required');
      return;
    }

    if (examForm.classes.length === 0) {
      toast.error('कम से कम एक class select करें');
      return;
    }

    // If editing, call update instead
    if (editingExam) {
      return updateExam();
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admit-card/exam`, {
        school_id: schoolId,
        ...examForm,
        exam_category: 'school',
        created_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ Exam "${examForm.exam_name}" created!`);
      setShowExamDialog(false);
      resetExamForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Exam creation failed');
    }
  };

  const createBoardExam = async () => {
    if (!boardExamForm.exam_name || !boardExamForm.board) {
      toast.error('Exam name and board are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // If admit card file is provided, upload it first
      let admit_card_url = null;
      if (boardExamForm.admit_card_file) {
        const formData = new FormData();
        formData.append('file', boardExamForm.admit_card_file);
        formData.append('school_id', schoolId);
        
        const uploadRes = await axios.post(`${API}/api/admit-card/upload-board-admit-card`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        admit_card_url = uploadRes.data.file_url;
      }

      await axios.post(`${API}/api/admit-card/board-exam`, {
        school_id: schoolId,
        ...boardExamForm,
        admit_card_url,
        exam_category: 'board',
        created_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ Board Exam "${boardExamForm.exam_name}" created!`);
      setShowBoardExamDialog(false);
      resetBoardExamForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Board exam creation failed');
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
        'Admit card अनिवार्य है। बिना admit card के exam में बैठने नहीं दिया जाएगा।',
        'Exam से 15 मिनट पहले पहुंचें।',
        'Mobile phone और calculator लाना मना है।'
      ],
      venue: ''
    });
  };

  const resetBoardExamForm = () => {
    setBoardExamForm({
      exam_name: '',
      board: 'CBSE',
      roll_number_prefix: '',
      centre_code: '',
      exam_schedule: [],
      admit_card_file: null
    });
  };

  // Auto-fetch subjects and instructions when class is selected
  const fetchClassSubjectsAndInstructions = async (className) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [subjectsRes, instructionsRes] = await Promise.all([
        axios.get(`${API}/api/admit-card/class-subjects/${encodeURIComponent(className)}?school_id=${schoolId}`, { headers }),
        axios.get(`${API}/api/admit-card/class-instructions/${encodeURIComponent(className)}?school_id=${schoolId}`, { headers })
      ]);
      
      // Format subjects with default exam schedule
      const formattedSubjects = (subjectsRes.data.subjects || []).map(sub => ({
        subject_name: sub.name,
        subject_id: sub.id,
        exam_date: '',
        exam_time: '09:00 AM',
        duration: '3 hours',
        max_marks: 100
      }));
      
      return {
        subjects: formattedSubjects,
        instructions: instructionsRes.data.instructions || []
      };
    } catch (err) {
      console.error('Error fetching class data:', err);
      return null;
    }
  };

  const toggleClassSelection = async (classId) => {
    const isRemoving = examForm.classes.includes(classId);
    
    // First update the classes selection
    const newClasses = isRemoving
      ? examForm.classes.filter(id => id !== classId)
      : [...examForm.classes, classId];
    
    setExamForm(prev => ({
      ...prev,
      classes: newClasses
    }));
    
    // If adding first class, auto-populate subjects and instructions
    if (!isRemoving && examForm.classes.length === 0) {
      // Get class name from classes list or use classId directly
      const selectedClass = classes.find(c => c.id === classId);
      const className = selectedClass?.name || classId;
      
      console.log('Auto-populating for class:', className);
      
      try {
        const classData = await fetchClassSubjectsAndInstructions(className);
        if (classData && classData.subjects && classData.subjects.length > 0) {
          setExamForm(prev => ({
            ...prev,
            classes: [classId],
            subjects: classData.subjects,
            instructions: classData.instructions
          }));
          toast.success(`✅ ${className} के ${classData.subjects.length} subjects और ${classData.instructions.length} instructions auto-filled!`);
        } else {
          console.log('No class data received or empty subjects');
        }
      } catch (err) {
        console.error('Error fetching class data:', err);
      }
    }
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

  const addInstruction = () => {
    setExamForm(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index, value) => {
    setExamForm(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const removeInstruction = (index) => {
    setExamForm(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const generateBulkAdmitCards = async (examId, classes) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/api/admit-card/generate-bulk`, {
        school_id: schoolId,
        exam_id: examId,
        class_ids: classes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ ${res.data.generated_count} admit cards generated!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    }
  };

  const showPreview = async (exam) => {
    try {
      const token = localStorage.getItem('token');
      // Get first student from first class for preview
      const studentsRes = await axios.get(`${API}/api/students?school_id=${schoolId}&class_id=${exam.classes[0]}&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (studentsRes.data.length > 0) {
        const student = studentsRes.data[0];
        const previewRes = await axios.get(`${API}/api/admit-card/preview/${schoolId}/${exam.id}/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPreviewData(previewRes.data.preview || previewRes.data);
        setShowPreviewDialog(true);
      } else {
        toast.error('No students found for preview');
      }
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Preview generation failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const publishToStudyTino = async (examId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Call publish-and-notify which also sends notifications to class students
      const response = await axios.post(`${API}/api/admit-card/publish-and-notify`, {
        school_id: schoolId,
        exam_id: examId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = response.data;
      toast.success(
        `✅ Publish हो गया! ${result.students_notified || 0} students को notification भेजा गया।`,
        { duration: 5000 }
      );
      
      fetchData(); // Refresh to show updated status
    } catch (err) {
      toast.error('Publish failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Edit exam
  const openEditExam = (exam) => {
    setEditingExam(exam);
    setExamForm({
      exam_name: exam.exam_name || '',
      exam_type: exam.exam_type || 'unit_test',
      start_date: exam.start_date || '',
      end_date: exam.end_date || '',
      classes: exam.classes || [],
      subjects: exam.subjects || [],
      instructions: exam.instructions || [],
      venue: exam.venue || ''
    });
    setShowExamDialog(true);
  };

  // Update exam
  const updateExam = async () => {
    if (!examForm.exam_name || !examForm.start_date || !examForm.end_date) {
      toast.error('Exam name and dates are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Updating exam:', editingExam.id, examForm);
      
      const response = await axios.put(`${API}/api/admit-card/exam/${editingExam.id}`, {
        school_id: schoolId,
        ...examForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Update response:', response.data);
      toast.success(`✅ Exam "${examForm.exam_name}" updated!`);
      setShowExamDialog(false);
      setEditingExam(null);
      resetExamForm();
      fetchData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.detail || 'Exam update failed');
    }
  };

  // Delete exam
  const confirmDeleteExam = (exam) => {
    setExamToDelete(exam);
    setShowDeleteDialog(true);
  };

  const deleteExam = async () => {
    if (!examToDelete) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Deleting exam:', examToDelete.id);
      
      const response = await axios.delete(`${API}/api/admit-card/exam/${examToDelete.id}?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete response:', response.data);
      toast.success(`✅ Exam "${examToDelete.exam_name}" deleted!`);
      setShowDeleteDialog(false);
      setExamToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  // Cash fee collection
  const openCashFeeDialog = (exam) => {
    setPrintExam(exam);
    setShowCashFeeDialog(true);
  };

  const collectCashFee = async (studentId, amount) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admit-card/collect-cash-fee`, {
        school_id: schoolId,
        student_id: studentId,
        exam_id: printExam?.id,
        amount: parseFloat(amount),
        collected_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Cash fee collected successfully!');
    } catch (err) {
      toast.error('Fee collection failed');
    }
  };

  // Print admit card directly
  const printAdmitCardDirect = async (exam, studentId = null) => {
    try {
      const token = localStorage.getItem('token');
      
      // If student ID provided, print for that student
      // Otherwise, bulk print for all students
      if (studentId) {
        const previewRes = await axios.get(
          `${API}/api/admit-card/preview/${schoolId}/${exam.id}/${studentId}?force=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPreviewData(previewRes.data.preview);
        setShowPreviewDialog(true);
      } else {
        // Bulk print - get first student for demo
        const studentsRes = await axios.get(
          `${API}/api/students?school_id=${schoolId}&class_id=${exam.classes[0]}&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (studentsRes.data.length > 0) {
          const student = studentsRes.data[0];
          const previewRes = await axios.get(
            `${API}/api/admit-card/preview/${schoolId}/${exam.id}/${student.id}?force=true`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPreviewData(previewRes.data.preview);
          setShowPreviewDialog(true);
        } else {
          toast.error('No students found in selected classes');
        }
      }
    } catch (err) {
      toast.error('Failed to generate admit card');
    }
  };

  const examTypes = [
    { value: 'unit_test', label: 'Unit Test', icon: '📝' },
    { value: 'quarterly', label: 'Quarterly / त्रैमासिक', icon: '📚' },
    { value: 'half_yearly', label: 'Half Yearly / अर्धवार्षिक', icon: '📖' },
    { value: 'annual', label: 'Annual / वार्षिक', icon: '🎓' },
    { value: 'pre_board', label: 'Pre-Board', icon: '📋' }
  ];

  const boards = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'MP_BOARD', label: 'MP Board (MPBSE)' },
    { value: 'RAJASTHAN_BOARD', label: 'Rajasthan Board (RBSE)' },
    { value: 'UP_BOARD', label: 'UP Board' },
    { value: 'BIHAR_BOARD', label: 'Bihar Board' },
    { value: 'OTHER', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="w-8 h-8" />
              Admit Card Management
            </h1>
            <p className="text-indigo-100 mt-1">
              School Exams + Board Exams | Fee-based Download | StudyTino Integration
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsDialog(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 border-0"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{exams.length}</div>
          <div className="text-sm text-blue-700 mt-1">School Exams</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{boardExams.length}</div>
          <div className="text-sm text-purple-700 mt-1">Board Exams</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="text-3xl font-bold text-green-600">{settings.min_fee_percentage}%</div>
          <div className="text-sm text-green-700 mt-1">Min Fee Required</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
          <div className="text-3xl font-bold text-amber-600">{classes.length}</div>
          <div className="text-sm text-amber-700 mt-1">Total Classes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'school'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          <School className="w-5 h-5 inline mr-2" />
          School Exams ({exams.length})
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'board'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <GraduationCap className="w-5 h-5 inline mr-2" />
          Board Exams ({boardExams.length})
        </button>
      </div>

      {/* School Exams Tab */}
      {activeTab === 'school' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              School Exams (Internal)
            </h2>
            <Button 
              onClick={() => setShowExamDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No school exams created yet</p>
              <Button 
                onClick={() => setShowExamDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create First Exam
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <ExamCard 
                  key={exam.id}
                  exam={exam}
                  examTypes={examTypes}
                  onGenerate={() => generateBulkAdmitCards(exam.id, exam.classes)}
                  onPreview={() => showPreview(exam)}
                  onPublish={() => publishToStudyTino(exam.id)}
                  onEdit={() => openEditExam(exam)}
                  onDelete={() => confirmDeleteExam(exam)}
                  onPrint={() => printAdmitCardDirect(exam)}
                  onCashFee={() => openCashFeeDialog(exam)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board Exams Tab */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Board Exams (CBSE/ICSE/State Boards)
            </h2>
            <Button 
              onClick={() => setShowBoardExamDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Board Exam
            </Button>
          </div>

          {boardExams.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No board exams added yet</p>
              <Button 
                onClick={() => setShowBoardExamDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add First Board Exam
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardExams.map((exam) => (
                <BoardExamCard 
                  key={exam.id}
                  exam={exam}
                  onPublish={() => publishToStudyTino(exam.id)}
                  onBulkUpload={(exam) => {
                    setSelectedBoardExam(exam);
                    setShowBulkBoardDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-6 h-6 text-indigo-600" />
              Admit Card Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Fee Settings */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Fee Requirements
              </h3>
              <div className="space-y-4">
                {/* Fee Requirement Type */}
                <div>
                  <Label>Fee Requirement Type</Label>
                  <select
                    value={settings.fee_requirement_type || 'percentage'}
                    onChange={(e) => setSettings({...settings, fee_requirement_type: e.target.value})}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    <option value="no_requirement">❌ No Fee Required (सभी download कर सकते हैं)</option>
                    <option value="percentage">📊 Percentage Based (% pay करना होगा)</option>
                    <option value="all_clear">✅ All Dues Clear (पूरी fee pay करनी होगी)</option>
                  </select>
                  <p className="text-xs text-amber-700 mt-1">
                    Select करें कि admit card download के लिए fee की क्या condition होगी
                  </p>
                </div>

                {/* Percentage field - only show if percentage type selected */}
                {settings.fee_requirement_type === 'percentage' && (
                  <div>
                    <Label>Minimum Fee Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.min_fee_percentage}
                      onChange={(e) => setSettings({...settings, min_fee_percentage: parseFloat(e.target.value) || 0})}
                      className="mt-1"
                    />
                    <p className="text-xs text-amber-700 mt-1">
                      Students को कम से कम इतना % fee pay करना होगा admit card download के लिए
                    </p>
                  </div>
                )}

                {/* Fee Deadline */}
                <div>
                  <Label>Fee Deadline (Optional)</Label>
                  <Input
                    type="date"
                    value={settings.fee_deadline || ''}
                    onChange={(e) => setSettings({...settings, fee_deadline: e.target.value})}
                    className="mt-1"
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    इस date के बाद सभी students download कर पाएंगे (अगर auto-activate enabled है)
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Auto-activate after Deadline</Label>
                    <p className="text-xs text-gray-500">Deadline के बाद सभी के लिए enable</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_activate_after_deadline || false}
                    onChange={(e) => setSettings({...settings, auto_activate_after_deadline: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Enable Online Payment</Label>
                    <p className="text-xs text-gray-500">StudyTino पर online payment allow करें</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable_online_payment !== false}
                    onChange={(e) => setSettings({...settings, enable_online_payment: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Require Fee Clearance</Label>
                    <p className="text-xs text-gray-500">Enable fee validation before download</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_fee_clearance}
                    onChange={(e) => setSettings({...settings, require_fee_clearance: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">
                Display Options
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'show_photo', label: 'Show Student Photo' },
                  { key: 'show_signature', label: 'Show Authority Signature' },
                  { key: 'show_seal', label: 'Show School Seal' },
                  { key: 'enable_studytino_download', label: 'Enable StudyTino Download' }
                ].map(option => (
                  <div key={option.key} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <Label className="text-sm font-medium">{option.label}</Label>
                    <input
                      type="checkbox"
                      checked={settings[option.key]}
                      onChange={(e) => setSettings({...settings, [option.key]: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Authority */}
            <div>
              <Label>Signature Authority</Label>
              <select
                value={settings.signature_authority}
                onChange={(e) => setSettings({...settings, signature_authority: e.target.value})}
                className="w-full p-2 border rounded-lg mt-1"
              >
                <option value="director">Director</option>
                <option value="principal">Principal</option>
                <option value="vice_principal">Vice Principal</option>
                <option value="exam_controller">Exam Controller</option>
              </select>
            </div>

            <Button 
              onClick={saveSettings} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit School Exam Dialog */}
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
                  Create School Exam
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
                  placeholder="e.g., Half Yearly 2026"
                  value={examForm.exam_name}
                  onChange={(e) => setExamForm({...examForm, exam_name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Exam Type *</Label>
                <select
                  value={examForm.exam_type}
                  onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                  className="w-full p-2 border rounded-lg mt-1"
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
                  className="mt-1"
                />
              </div>

              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm({...examForm, end_date: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label>Exam Venue (Optional)</Label>
                <Input
                  placeholder="School Premises / Exam Hall"
                  value={examForm.venue}
                  onChange={(e) => setExamForm({...examForm, venue: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Select Classes * (कम से कम एक)</Label>
                {examForm.classes.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const firstClassId = examForm.classes[0];
                      const selectedClass = classes.find(c => c.id === firstClassId);
                      const className = selectedClass?.name || firstClassId;
                      const classData = await fetchClassSubjectsAndInstructions(className);
                      if (classData && classData.subjects.length > 0) {
                        setExamForm(prev => ({
                          ...prev,
                          subjects: classData.subjects,
                          instructions: classData.instructions
                        }));
                        toast.success(`✅ ${classData.subjects.length} subjects loaded!`);
                      }
                    }}
                    className="text-indigo-600 text-xs"
                  >
                    🔄 Load Class Subjects
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                {classes.length > 0 ? (
                  classes.map(cls => (
                    <label 
                      key={cls.id} 
                      className="flex items-center gap-2 p-2 bg-white rounded hover:bg-indigo-50 cursor-pointer border"
                    >
                      <input
                        type="checkbox"
                        checked={examForm.classes.includes(cls.id)}
                        onChange={() => toggleClassSelection(cls.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{cls.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="col-span-4 text-center text-gray-500 py-4">
                    No classes found. Add classes first.
                  </p>
                )}
              </div>
              {examForm.classes.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ {examForm.classes.length} classes selected
                </p>
              )}
            </div>

            {/* Subjects Schedule */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Exam Schedule (Subjects)</Label>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSubject}
                  className="text-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {examForm.subjects.map((subject, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Subject Name"
                          value={subject.subject_name}
                          onChange={(e) => updateSubject(index, 'subject_name', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          value={subject.exam_date}
                          onChange={(e) => updateSubject(index, 'exam_date', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={subject.exam_time}
                          onChange={(e) => updateSubject(index, 'exam_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Duration"
                          value={subject.duration}
                          onChange={(e) => updateSubject(index, 'duration', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="Marks"
                          value={subject.max_marks}
                          onChange={(e) => updateSubject(index, 'max_marks', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {examForm.subjects.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No subjects added yet. Click "Add Subject" to add exam schedule.
                  </p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Instructions</Label>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addInstruction}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Instruction
                </Button>
              </div>

              <div className="space-y-2">
                {examForm.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="Enter instruction"
                      className="text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowExamDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={createExam}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {editingExam ? 'Update Exam' : 'Create Exam'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Board Exam Dialog */}
      <Dialog open={showBoardExamDialog} onOpenChange={setShowBoardExamDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="w-6 h-6 text-purple-600" />
              Add Board Exam
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                📌 Board exams के लिए admit card upload करें या details enter करें। 
                Students StudyTino से download कर सकते हैं।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Name *</Label>
                <Input
                  placeholder="e.g., CBSE Class 10 Annual 2026"
                  value={boardExamForm.exam_name}
                  onChange={(e) => setBoardExamForm({...boardExamForm, exam_name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Board *</Label>
                <select
                  value={boardExamForm.board}
                  onChange={(e) => setBoardExamForm({...boardExamForm, board: e.target.value})}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  {boards.map(board => (
                    <option key={board.value} value={board.value}>{board.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Roll Number Prefix</Label>
                <Input
                  placeholder="e.g., 2026-10-"
                  value={boardExamForm.roll_number_prefix}
                  onChange={(e) => setBoardExamForm({...boardExamForm, roll_number_prefix: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Centre Code</Label>
                <Input
                  placeholder="e.g., 12345"
                  value={boardExamForm.centre_code}
                  onChange={(e) => setBoardExamForm({...boardExamForm, centre_code: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Upload Admit Card */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Upload Board Admit Card (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setBoardExamForm({...boardExamForm, admit_card_file: e.target.files[0]});
                      toast.success(`File selected: ${e.target.files[0].name}`);
                    }
                  }}
                  className="hidden"
                  id="board-admit-upload"
                />
                <label htmlFor="board-admit-upload" className="cursor-pointer">
                  <div className="text-sm text-gray-600">
                    Click to upload admit card template
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    PDF, JPG, PNG (Max 5MB)
                  </div>
                </label>
                {boardExamForm.admit_card_file && (
                  <div className="mt-3 text-sm text-green-600 font-medium">
                    ✅ {boardExamForm.admit_card_file.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowBoardExamDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={createBoardExam}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Board Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Delete Exam?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{examToDelete?.exam_name}</strong>?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ This will also delete all generated admit cards for this exam. This action cannot be undone.
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
                Delete Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {showPreviewDialog && previewData && (
        <AdmitCardPreviewComponent 
          admitCardData={previewData}
          onClose={() => {
            setShowPreviewDialog(false);
            setPreviewData(null);
          }}
        />
      )}

      {/* Bulk Board Admit Card Dialog */}
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

// Exam Card Component
const ExamCard = ({ exam, examTypes, onGenerate, onPreview, onPublish, onEdit, onDelete, onPrint, onCashFee }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{exam.exam_name}</h3>
          <Badge variant="outline" className="mt-1">
            {examTypes.find(t => t.value === exam.exam_type)?.icon} {examTypes.find(t => t.value === exam.exam_type)?.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={exam.status === 'upcoming' ? 'bg-blue-500' : exam.status === 'ongoing' ? 'bg-green-500' : 'bg-gray-500'}>
            {exam.status}
          </Badge>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onEdit(exam)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
            title="Edit Exam"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onDelete(exam)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
            title="Delete Exam"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          {exam.start_date} - {exam.end_date}
        </p>
        <p className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          {exam.classes?.length || 0} Classes
        </p>
        <p className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          {exam.subjects?.length || 0} Subjects
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onPreview(exam)}
          className="text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
        <Button 
          size="sm"
          onClick={() => onPrint(exam)}
          className="bg-indigo-600 hover:bg-indigo-700 text-xs"
        >
          <Printer className="w-3 h-3 mr-1" />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button 
          size="sm"
          variant="outline"
          onClick={() => onCashFee(exam)}
          className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs"
        >
          💵 Cash Fee
        </Button>
        <Button 
          size="sm"
          onClick={() => onPublish(exam.id)}
          className="bg-green-600 hover:bg-green-700 text-xs"
        >
          <Send className="w-3 h-3 mr-1" />
          Publish
        </Button>
      </div>
    </div>
  );
};

// Board Exam Card Component
const BoardExamCard = ({ exam, onPublish, onBulkUpload }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{exam.exam_name}</h3>
          <Badge variant="outline" className="mt-1 bg-white">
            {exam.board}
          </Badge>
        </div>
      </div>

      {exam.centre_code && (
        <div className="text-sm text-gray-600 mb-3">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            Centre: {exam.centre_code}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        {exam.admit_card_url && (
          <Button 
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => window.open(exam.admit_card_url, '_blank')}
          >
            <Download className="w-3 h-3 mr-1" />
            View
          </Button>
        )}
        <Button 
          size="sm"
          onClick={() => onBulkUpload(exam)}
          className="bg-purple-600 hover:bg-purple-700 text-xs"
        >
          <Upload className="w-3 h-3 mr-1" />
          Bulk Upload
        </Button>
      </div>

      <Button 
        size="sm"
        onClick={() => onPublish(exam.id)}
        className="w-full bg-green-600 hover:bg-green-700 text-xs"
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        Publish to StudyTino
      </Button>
    </div>
  );
};

export default ImprovedAdmitCardManagement;
