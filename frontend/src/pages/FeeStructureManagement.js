import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Settings, Plus, Save, Loader2, Trash2, Edit, CheckCircle,
  BookOpen, Bus, Home, Beaker, Library, Trophy, Shirt, 
  GraduationCap, FileText, Users, IndianRupee, AlertCircle,
  Award, Shield, Heart, UserCheck, Baby
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Fee types with icons
const FEE_TYPES = [
  { type: 'tuition', label: 'Tuition Fee', icon: BookOpen, color: 'blue' },
  { type: 'exam', label: 'Exam Fee', icon: FileText, color: 'purple' },
  { type: 'transport', label: 'Transport/Bus Fee', icon: Bus, color: 'green', optional: true },
  { type: 'hostel', label: 'Hostel Fee', icon: Home, color: 'orange', optional: true },
  { type: 'lab', label: 'Lab Fee', icon: Beaker, color: 'cyan', optional: true },
  { type: 'library', label: 'Library Fee', icon: Library, color: 'amber' },
  { type: 'sports', label: 'Sports Fee', icon: Trophy, color: 'red', optional: true },
  { type: 'uniform', label: 'Uniform Fee', icon: Shirt, color: 'slate' },
  { type: 'books', label: 'Books & Stationery', icon: BookOpen, color: 'indigo' },
  { type: 'development', label: 'Development Fee', icon: Settings, color: 'gray' },
  { type: 'admission', label: 'Admission Fee', icon: GraduationCap, color: 'emerald' },
  { type: 'annual', label: 'Annual Fee', icon: FileText, color: 'rose' },
];

// Government schemes
const GOVT_SCHEMES = [
  { code: 'RTE', name: 'Right to Education (RTE)', exemption: 100, icon: Shield },
  { code: 'SC_ST_SCHOLARSHIP', name: 'SC/ST Scholarship', exemption: 100, icon: Award },
  { code: 'OBC_SCHOLARSHIP', name: 'OBC Scholarship', exemption: 50, icon: Award },
  { code: 'MERIT_SCHOLARSHIP', name: 'Merit Scholarship', exemption: 25, icon: Trophy },
  { code: 'BPL', name: 'BPL Scheme', exemption: 75, icon: Heart },
  { code: 'GIRL_CHILD', name: 'Girl Child Scheme', exemption: 25, icon: Baby },
  { code: 'STAFF_CHILD', name: 'Staff Child Concession', exemption: 50, icon: UserCheck },
  { code: 'SIBLING_DISCOUNT', name: 'Sibling Discount', exemption: 10, icon: Users },
];

export default function FeeStructureManagement() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structure');
  const [feeStructures, setFeeStructures] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [showAddFee, setShowAddFee] = useState(false);
  const [showStudentServices, setShowStudentServices] = useState(false);
  const [showSchemeDialog, setShowSchemeDialog] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [newFee, setNewFee] = useState({
    fee_type: '',
    amount: '',
    frequency: 'monthly',
    due_day: 10,
    description: '',
    is_optional: false
  });

  const [studentServices, setStudentServices] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const schoolId = user?.school_id || 'school1';
  const classes = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  useEffect(() => {
    fetchFeeStructures();
    fetchStudents();
  }, [schoolId]);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/fee-management/structure/all/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setFeeStructures(data.structures_by_class || {});
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API}/api/students?school_id=${schoolId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const saveFeeStructure = async () => {
    if (!selectedClass || !newFee.fee_type || !newFee.amount) {
      toast.error('Class, Fee Type aur Amount required hai');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/fee-management/structure/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          class_id: selectedClass,
          ...newFee,
          amount: parseFloat(newFee.amount)
        })
      });

      if (res.ok) {
        toast.success('Fee structure saved! ✅');
        setShowAddFee(false);
        setNewFee({ fee_type: '', amount: '', frequency: 'monthly', due_day: 10, description: '', is_optional: false });
        fetchFeeStructures();
      } else {
        toast.error('Save failed');
      }
    } catch (error) {
      toast.error('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const deleteFeeStructure = async (feeId) => {
    try {
      const res = await fetch(`${API}/api/fee-management/structure/${feeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Fee removed');
        fetchFeeStructures();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const updateStudentServices = async () => {
    if (!selectedStudent) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/fee-management/student/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id || selectedStudent.student_id,
          school_id: schoolId,
          services: studentServices
        })
      });

      if (res.ok) {
        toast.success('Student services updated! ✅');
        setShowStudentServices(false);
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const assignScheme = async () => {
    if (!selectedStudent || !selectedScheme) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/fee-management/scheme/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedStudent.id || selectedStudent.student_id,
          school_id: schoolId,
          scheme_name: selectedScheme.code,
          scheme_type: selectedScheme.exemption === 100 ? 'full_exemption' : 'partial_exemption',
          exemption_percentage: selectedScheme.exemption,
          monthly_stipend: 0,
          valid_from: new Date().toISOString().split('T')[0],
          valid_until: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        toast.success(`${selectedScheme.name} assigned! 🎉`);
        setShowSchemeDialog(false);
        setSelectedScheme(null);
      } else {
        const errData = await res.json();
        toast.error(errData.detail || 'Assignment failed');
      }
    } catch (error) {
      toast.error('Scheme assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service) => {
    setStudentServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" data-testid="fee-structure-management">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-600" />
          </div>
          Fee Structure Management
        </h1>
        <p className="text-slate-500 mt-2">
          Class-wise fee setup, Student services, Government schemes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg mb-6">
          <TabsTrigger value="structure">📋 Fee Structure</TabsTrigger>
          <TabsTrigger value="services">🚌 Student Services</TabsTrigger>
          <TabsTrigger value="schemes">🎓 Govt Schemes</TabsTrigger>
        </TabsList>

        {/* Fee Structure Tab */}
        <TabsContent value="structure">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {classes.map(cls => (
                    <Button
                      key={cls}
                      variant={selectedClass === cls ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedClass(cls)}
                      className={selectedClass === cls ? "bg-indigo-600" : ""}
                    >
                      {cls}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fee List for Selected Class */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedClass ? `Class ${selectedClass} Fee Structure` : 'Select a Class'}
                  </CardTitle>
                  {selectedClass && (
                    <Button onClick={() => setShowAddFee(true)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Fee
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedClass && feeStructures[selectedClass]?.length > 0 ? (
                  <div className="space-y-3">
                    {feeStructures[selectedClass].map((fee, idx) => {
                      const feeType = FEE_TYPES.find(f => f.type === fee.fee_type);
                      const Icon = feeType?.icon || FileText;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${feeType?.color || 'slate'}-100 rounded-lg flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 text-${feeType?.color || 'slate'}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{fee.description || fee.fee_type}</p>
                              <p className="text-xs text-slate-500">
                                {fee.frequency} {fee.is_optional && '• Optional'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">₹{fee.amount}</span>
                            <Button variant="ghost" size="icon" onClick={() => deleteFeeStructure(fee.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t flex justify-between">
                      <span className="font-medium">Total Monthly</span>
                      <span className="font-bold text-indigo-600">
                        ₹{feeStructures[selectedClass]
                          .filter(f => f.frequency === 'monthly' && !f.is_optional)
                          .reduce((sum, f) => sum + f.amount, 0)}
                      </span>
                    </div>
                  </div>
                ) : selectedClass ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No fee structure for Class {selectedClass}</p>
                    <Button className="mt-4" onClick={() => setShowAddFee(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Fee
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>← Select a class to view/edit fee structure</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Student Services Management</CardTitle>
              <CardDescription>
                Assign services like Bus, Hostel, Lab to individual students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search student by name or ID..."
                  className="max-w-md"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.slice(0, 12).map((student, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        setSelectedStudent(student);
                        setStudentServices(student.services || []);
                        setShowStudentServices(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-slate-500">
                            {student.student_id || student.id} • Class {student.class_id}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {student.uses_transport && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Bus</span>
                        )}
                        {student.uses_hostel && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Hostel</span>
                        )}
                        {student.has_scheme && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{student.scheme_name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Government Schemes Tab */}
        <TabsContent value="schemes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Government Schemes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {GOVT_SCHEMES.map((scheme, idx) => {
                    const Icon = scheme.icon;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{scheme.name}</p>
                            <p className="text-xs text-slate-500">{scheme.exemption}% exemption</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assign Scheme to Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {students.slice(0, 6).map((student, idx) => (
                      <Button
                        key={idx}
                        variant={selectedStudent?.id === student.id ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </Button>
                    ))}
                  </div>
                  
                  {selectedStudent && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">
                        Select scheme for {selectedStudent.name}:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {GOVT_SCHEMES.map((scheme, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="justify-start text-xs"
                            onClick={() => {
                              setSelectedScheme(scheme);
                              setShowSchemeDialog(true);
                            }}
                          >
                            {scheme.code}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Fee Dialog */}
      <Dialog open={showAddFee} onOpenChange={setShowAddFee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fee for Class {selectedClass}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Fee Type</label>
              <select
                value={newFee.fee_type}
                onChange={(e) => {
                  const type = FEE_TYPES.find(f => f.type === e.target.value);
                  setNewFee(f => ({ 
                    ...f, 
                    fee_type: e.target.value,
                    is_optional: type?.optional || false,
                    description: type?.label || ''
                  }));
                }}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="">Select Fee Type</option>
                {FEE_TYPES.map(type => (
                  <option key={type.type} value={type.type}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                value={newFee.amount}
                onChange={(e) => setNewFee(f => ({ ...f, amount: e.target.value }))}
                placeholder="2500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                value={newFee.frequency}
                onChange={(e) => setNewFee(f => ({ ...f, frequency: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Due Day (of month)</label>
              <Input
                type="number"
                value={newFee.due_day}
                onChange={(e) => setNewFee(f => ({ ...f, due_day: parseInt(e.target.value) }))}
                min="1"
                max="28"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newFee.is_optional}
                onChange={(e) => setNewFee(f => ({ ...f, is_optional: e.target.checked }))}
                className="rounded"
              />
              <label className="text-sm">Optional Service (Bus, Hostel, etc.)</label>
            </div>
            <Button onClick={saveFeeStructure} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Fee Structure
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Services Dialog */}
      <Dialog open={showStudentServices} onOpenChange={setShowStudentServices}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Services for {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Select services this student is using:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'transport', label: 'Bus/Transport', icon: Bus },
                { id: 'hostel', label: 'Hostel', icon: Home },
                { id: 'lab', label: 'Lab', icon: Beaker },
                { id: 'library', label: 'Library', icon: Library },
                { id: 'sports', label: 'Sports', icon: Trophy },
              ].map(service => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    studentServices.includes(service.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <service.icon className={`w-5 h-5 ${
                      studentServices.includes(service.id) ? 'text-green-600' : 'text-slate-400'
                    }`} />
                    <span className="font-medium">{service.label}</span>
                  </div>
                  {studentServices.includes(service.id) && (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                  )}
                </div>
              ))}
            </div>
            <Button onClick={updateStudentServices} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Update Services
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scheme Assignment Dialog */}
      <Dialog open={showSchemeDialog} onOpenChange={setShowSchemeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign {selectedScheme?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="font-medium text-purple-900">{selectedScheme?.name}</p>
              <p className="text-sm text-purple-700 mt-1">
                Fee Exemption: {selectedScheme?.exemption}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">Assigning to:</p>
              <p className="font-medium">{selectedStudent?.name}</p>
              <p className="text-xs text-slate-500">
                {selectedStudent?.student_id || selectedStudent?.id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSchemeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={assignScheme} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirm Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
