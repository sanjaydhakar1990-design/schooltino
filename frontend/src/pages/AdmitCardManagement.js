/**
 * ADMIT CARD MANAGEMENT - Admin Panel
 * - Create/Edit Exams
 * - Set Fee Requirements
 * - Generate Bulk Admit Cards
 * - Configure Signature & Seal
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  AlertCircle, Percent, Stamp, PenTool, Eye, Printer, Search
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

const AdmitCardManagement = () => {
  const { user } = useAuth();
  const schoolId = user?.school_id;

  const [settings, setSettings] = useState({
    min_fee_percentage: 30,
    require_fee_clearance: true,
    show_photo: true,
    show_signature: true,
    show_seal: true,
    signature_authority: 'director'
  });
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [classes, setClasses] = useState([]);
  const [generationResult, setGenerationResult] = useState(null);

  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: 'half_yearly',
    start_date: '',
    end_date: '',
    classes: [],
    instructions: []
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, examsRes, classesRes] = await Promise.allSettled([
        axios.get(`${API}/admit-card/settings/${schoolId}`),
        axios.get(`${API}/admit-card/exams/${schoolId}`),
        axios.get(`${API}/classes/${schoolId}`)
      ]);

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data);
      }
      if (examsRes.status === 'fulfilled') {
        setExams(examsRes.value.data.exams || []);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post(`${API}/admit-card/settings`, {
        school_id: schoolId,
        ...settings
      });
      toast.success('Settings saved!');
      setShowSettingsDialog(false);
    } catch (err) {
      toast.error('Settings save failed');
    }
  };

  const createExam = async () => {
    try {
      const res = await axios.post(`${API}/admit-card/exam`, {
        school_id: schoolId,
        ...examForm,
        created_by: user?.id
      });
      toast.success(`Exam "${examForm.exam_name}" created!`);
      setShowExamDialog(false);
      setExamForm({
        exam_name: '',
        exam_type: 'half_yearly',
        start_date: '',
        end_date: '',
        classes: [],
        instructions: []
      });
      fetchData();
    } catch (err) {
      toast.error('Exam creation failed');
    }
  };

  const generateBulkAdmitCards = async (examId, classId) => {
    try {
      const res = await axios.post(`${API}/admit-card/generate-bulk`, {
        school_id: schoolId,
        exam_id: examId,
        class_id: classId
      });
      setGenerationResult(res.data);
      toast.success(`${res.data.generated_count} admit cards generated!`);
    } catch (err) {
      toast.error('Generation failed');
    }
  };

  const examTypes = [
    { value: 'unit_test', label: 'Unit Test' },
    { value: 'quarterly', label: 'Quarterly / त्रैमासिक' },
    { value: 'half_yearly', label: 'Half Yearly / अर्धवार्षिक' },
    { value: 'annual', label: 'Annual / वार्षिक' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Admit Card Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">Create exams and generate admit cards</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsDialog(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button 
            onClick={() => setShowExamDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Settings Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-500" />
              <span className="text-sm">Min Fee: <strong>{settings.min_fee_percentage}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Signature: <strong>{settings.signature_authority}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-green-500" />
              <span className="text-sm">Seal: <strong>{settings.show_seal ? 'Yes' : 'No'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              {settings.require_fee_clearance ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm">Fee Required: <strong>{settings.require_fee_clearance ? 'Yes' : 'No'}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Exams ({exams.length})
        </h2>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No exams created yet</p>
              <Button 
                onClick={() => setShowExamDialog(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Create First Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exam.exam_name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {examTypes.find(t => t.value === exam.exam_type)?.label || exam.exam_type}
                      </Badge>
                    </div>
                    <Badge className={exam.status === 'upcoming' ? 'bg-blue-500' : 'bg-green-500'}>
                      {exam.status}
                    </Badge>
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
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedExam(exam)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (exam.classes?.[0]) {
                          generateBulkAdmitCards(exam.id, exam.classes[0]);
                        }
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generation Result */}
      {generationResult && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-800 mb-2">Generation Complete!</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{generationResult.generated_count}</p>
                <p className="text-xs text-green-700">Generated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{generationResult.pending_fee_count}</p>
                <p className="text-xs text-amber-700">Pending Fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{generationResult.total_students}</p>
                <p className="text-xs text-gray-700">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admit Card Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Minimum Fee Percentage Required (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.min_fee_percentage}
                onChange={(e) => setSettings({...settings, min_fee_percentage: parseFloat(e.target.value)})}
              />
              <p className="text-xs text-gray-500 mt-1">Students must pay at least this % of fee to download admit card</p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Fee Clearance</Label>
              <input
                type="checkbox"
                checked={settings.require_fee_clearance}
                onChange={(e) => setSettings({...settings, require_fee_clearance: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div>
              <Label>Signature Authority</Label>
              <select
                value={settings.signature_authority}
                onChange={(e) => setSettings({...settings, signature_authority: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="director">Director</option>
                <option value="principal">Principal</option>
                <option value="class_teacher">Class Teacher</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Show School Seal</Label>
              <input
                type="checkbox"
                checked={settings.show_seal}
                onChange={(e) => setSettings({...settings, show_seal: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show Student Photo</Label>
              <input
                type="checkbox"
                checked={settings.show_photo}
                onChange={(e) => setSettings({...settings, show_photo: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <Button onClick={saveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Exam Dialog */}
      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Exam
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Exam Name</Label>
              <Input
                placeholder="e.g., Half Yearly 2026"
                value={examForm.exam_name}
                onChange={(e) => setExamForm({...examForm, exam_name: e.target.value})}
              />
            </div>

            <div>
              <Label>Exam Type</Label>
              <select
                value={examForm.exam_type}
                onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                {examTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={examForm.start_date}
                  onChange={(e) => setExamForm({...examForm, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm({...examForm, end_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Classes</Label>
              <Input
                placeholder="e.g., Class 10, Class 9"
                value={examForm.classes.join(', ')}
                onChange={(e) => setExamForm({...examForm, classes: e.target.value.split(',').map(c => c.trim())})}
              />
              <p className="text-xs text-gray-500 mt-1">Comma separated class names</p>
            </div>

            <Button 
              onClick={createExam} 
              disabled={!examForm.exam_name || !examForm.start_date}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Create Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmitCardManagement;
