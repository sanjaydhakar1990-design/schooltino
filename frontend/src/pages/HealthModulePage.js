import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Heart, Activity, Syringe, AlertTriangle, Plus, RefreshCw,
  Search, User, Calendar, FileText, Thermometer, Eye,
  Stethoscope, Pill, Scale, Ruler, Droplet, ClipboardList
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const severityColors = {
  low: 'bg-green-500/10 text-green-600',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-orange-500/10 text-orange-600',
  emergency: 'bg-red-500/10 text-red-600'
};

const incidentTypes = {
  injury: 'Injury',
  illness: 'Illness',
  allergic_reaction: 'Allergic Reaction',
  fever: 'Fever',
  other: 'Other'
};

export default function HealthModulePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [checkups, setCheckups] = useState([]);
  const [dueImmunizations, setDueImmunizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showHealthRecordDialog, setShowHealthRecordDialog] = useState(false);
  const [showCheckupDialog, setShowCheckupDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = user?.school_id || 'school123';

  const [incidentForm, setIncidentForm] = useState({
    student_id: '',
    incident_type: 'illness',
    description: '',
    severity: 'low',
    treatment_given: '',
    sent_home: false,
    parent_notified: false
  });

  const [healthForm, setHealthForm] = useState({
    student_id: '',
    blood_group: '',
    height_cm: '',
    weight_kg: '',
    allergies: '',
    chronic_conditions: '',
    notes: ''
  });

  const [checkupForm, setCheckupForm] = useState({
    title: '',
    checkup_type: 'general',
    scheduled_date: '',
    doctor_name: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, incidentsRes, checkupsRes, dueRes] = await Promise.all([
        fetch(`${API_URL}/api/health/analytics?school_id=${schoolId}`),
        fetch(`${API_URL}/api/health/incidents/today?school_id=${schoolId}`),
        fetch(`${API_URL}/api/health/checkups?school_id=${schoolId}`),
        fetch(`${API_URL}/api/health/immunizations/due?school_id=${schoolId}`)
      ]);
      
      setAnalytics(await analyticsRes.json());
      const incData = await incidentsRes.json();
      setIncidents(incData.incidents || []);
      const checkData = await checkupsRes.json();
      setCheckups(checkData.checkups || []);
      const dueData = await dueRes.json();
      setDueImmunizations(dueData.due_immunizations || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.student_id || !incidentForm.description) {
      toast.error('Student ID aur description required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/health/incidents?school_id=${schoolId}&reported_by=${user?.name || 'Admin'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Incident reported!');
        setShowIncidentDialog(false);
        setIncidentForm({ student_id: '', incident_type: 'illness', description: '', severity: 'low', treatment_given: '', sent_home: false, parent_notified: false });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to report incident');
    }
  };

  const handleSaveHealthRecord = async (e) => {
    e.preventDefault();
    if (!healthForm.student_id) {
      toast.error('Student ID required hai');
      return;
    }

    try {
      const payload = {
        student_id: healthForm.student_id,
        blood_group: healthForm.blood_group || null,
        height_cm: healthForm.height_cm ? parseFloat(healthForm.height_cm) : null,
        weight_kg: healthForm.weight_kg ? parseFloat(healthForm.weight_kg) : null,
        allergies: healthForm.allergies ? healthForm.allergies.split(',').map(a => a.trim()) : [],
        chronic_conditions: healthForm.chronic_conditions ? healthForm.chronic_conditions.split(',').map(c => c.trim()) : [],
        notes: healthForm.notes || null
      };

      const res = await fetch(`${API_URL}/api/health/records?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Health record saved!');
        setShowHealthRecordDialog(false);
        setHealthForm({ student_id: '', blood_group: '', height_cm: '', weight_kg: '', allergies: '', chronic_conditions: '', notes: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to save health record');
    }
  };

  const handleScheduleCheckup = async (e) => {
    e.preventDefault();
    if (!checkupForm.title || !checkupForm.scheduled_date) {
      toast.error('Title aur date required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/health/checkups?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkupForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Checkup scheduled!');
        setShowCheckupDialog(false);
        setCheckupForm({ title: '', checkup_type: 'general', scheduled_date: '', doctor_name: '', notes: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to schedule checkup');
    }
  };

  return (
    <div className="space-y-6" data-testid="health-module-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Health Module
          </h1>
          <p className="text-muted-foreground mt-1">
            Student Health Records, Immunizations & Medical Incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Records</p>
                  <p className="text-3xl font-bold">{analytics.total_health_records}</p>
                </div>
                <FileText className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Allergies</p>
                  <p className="text-3xl font-bold">{analytics.students_with_allergies}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Incidents (Month)</p>
                  <p className="text-3xl font-bold">{analytics.incidents_this_month}</p>
                </div>
                <Activity className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Checkups</p>
                  <p className="text-3xl font-bold">{analytics.upcoming_checkups}</p>
                </div>
                <Stethoscope className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="records">Health Records</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="checkups">Checkups</TabsTrigger>
        </TabsList>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Today's Medical Incidents</h3>
            <Button onClick={() => setShowIncidentDialog(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </div>
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aaj koi incident nahi</h3>
                <p className="text-muted-foreground mt-1">Koi medical incident report nahi hui aaj</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <Card key={incident.id} className={`border-l-4 ${incident.severity === 'emergency' ? 'border-l-red-500' : incident.severity === 'high' ? 'border-l-orange-500' : 'border-l-amber-500'}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{incident.student_name}</h3>
                          <Badge variant="outline">{incident.class_name}</Badge>
                          <Badge className={severityColors[incident.severity]}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{incidentTypes[incident.incident_type]}</p>
                        <p className="text-sm">{incident.description}</p>
                        {incident.treatment_given && (
                          <p className="text-sm mt-2"><strong>Treatment:</strong> {incident.treatment_given}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        {incident.sent_home && <Badge variant="outline" className="text-red-600">Sent Home</Badge>}
                        {incident.parent_notified && <Badge variant="outline" className="text-green-600">Parent Notified</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Health Records Tab */}
        <TabsContent value="records" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Student Health Records</h3>
            <Button onClick={() => setShowHealthRecordDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add/Update Record
            </Button>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Health Records</h3>
              <p className="text-muted-foreground mt-1">
                {analytics?.total_health_records || 0} students ke health records stored hain
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Student ID search karke individual record dekh sakte hain
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Immunizations Tab */}
        <TabsContent value="immunizations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-blue-500" />
                Upcoming Immunizations
              </CardTitle>
              <CardDescription>Students with immunizations due in next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {dueImmunizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Koi immunization due nahi hai
                </div>
              ) : (
                <div className="space-y-3">
                  {dueImmunizations.map((imm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{imm.student_name}</h4>
                        <p className="text-sm text-muted-foreground">{imm.vaccine_name} - Dose {imm.dose_number}</p>
                      </div>
                      <Badge variant="outline">{imm.next_due_date}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkups Tab */}
        <TabsContent value="checkups" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Scheduled Health Checkups</h3>
            <Button onClick={() => setShowCheckupDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Checkup
            </Button>
          </div>
          {checkups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Koi checkup scheduled nahi</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {checkups.map((checkup) => (
                <Card key={checkup.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-green-500/10">
                        <Stethoscope className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{checkup.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{checkup.checkup_type} Checkup</p>
                      </div>
                      <Badge variant={checkup.status === 'scheduled' ? 'default' : 'secondary'}>
                        {checkup.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {checkup.scheduled_date}
                      </span>
                      {checkup.doctor_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {checkup.doctor_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Incident Dialog */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Medical Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReportIncident} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Student ID *</label>
              <Input
                value={incidentForm.student_id}
                onChange={(e) => setIncidentForm({...incidentForm, student_id: e.target.value})}
                placeholder="STD-2026-XXXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Incident Type</label>
                <select
                  value={incidentForm.incident_type}
                  onChange={(e) => setIncidentForm({...incidentForm, incident_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="illness">Illness</option>
                  <option value="injury">Injury</option>
                  <option value="fever">Fever</option>
                  <option value="allergic_reaction">Allergic Reaction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <select
                  value={incidentForm.severity}
                  onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})}
                placeholder="Describe the incident..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Treatment Given</label>
              <Input
                value={incidentForm.treatment_given}
                onChange={(e) => setIncidentForm({...incidentForm, treatment_given: e.target.value})}
                placeholder="First aid, medication, etc."
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={incidentForm.sent_home}
                  onChange={(e) => setIncidentForm({...incidentForm, sent_home: e.target.checked})}
                />
                <span className="text-sm">Sent Home</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={incidentForm.parent_notified}
                  onChange={(e) => setIncidentForm({...incidentForm, parent_notified: e.target.checked})}
                />
                <span className="text-sm">Parent Notified</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowIncidentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Report Incident
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Health Record Dialog */}
      <Dialog open={showHealthRecordDialog} onOpenChange={setShowHealthRecordDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add/Update Health Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveHealthRecord} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Student ID *</label>
              <Input
                value={healthForm.student_id}
                onChange={(e) => setHealthForm({...healthForm, student_id: e.target.value})}
                placeholder="STD-2026-XXXXX"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Blood Group</label>
                <select
                  value={healthForm.blood_group}
                  onChange={(e) => setHealthForm({...healthForm, blood_group: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Height (cm)</label>
                <Input
                  type="number"
                  value={healthForm.height_cm}
                  onChange={(e) => setHealthForm({...healthForm, height_cm: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input
                  type="number"
                  value={healthForm.weight_kg}
                  onChange={(e) => setHealthForm({...healthForm, weight_kg: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Allergies (comma separated)</label>
              <Input
                value={healthForm.allergies}
                onChange={(e) => setHealthForm({...healthForm, allergies: e.target.value})}
                placeholder="Peanuts, Dust, Milk..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Chronic Conditions</label>
              <Input
                value={healthForm.chronic_conditions}
                onChange={(e) => setHealthForm({...healthForm, chronic_conditions: e.target.value})}
                placeholder="Asthma, Diabetes..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowHealthRecordDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Checkup Dialog */}
      <Dialog open={showCheckupDialog} onOpenChange={setShowCheckupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Health Checkup</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleCheckup} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Checkup Title *</label>
              <Input
                value={checkupForm.title}
                onChange={(e) => setCheckupForm({...checkupForm, title: e.target.value})}
                placeholder="Annual Health Checkup"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Checkup Type</label>
                <select
                  value={checkupForm.checkup_type}
                  onChange={(e) => setCheckupForm({...checkupForm, checkup_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="general">General</option>
                  <option value="dental">Dental</option>
                  <option value="eye">Eye</option>
                  <option value="ear">Ear</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={checkupForm.scheduled_date}
                  onChange={(e) => setCheckupForm({...checkupForm, scheduled_date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Doctor Name</label>
              <Input
                value={checkupForm.doctor_name}
                onChange={(e) => setCheckupForm({...checkupForm, doctor_name: e.target.value})}
                placeholder="Dr. Name"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCheckupDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
