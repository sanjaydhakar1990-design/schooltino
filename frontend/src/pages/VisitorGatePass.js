import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Users, Plus, Search, Loader2, LogIn, LogOut, Clock, 
  User, Phone, Car, Printer, CheckCircle, AlertCircle,
  Building2, Calendar, FileText, QrCode, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Visitor purposes
const VISIT_PURPOSES = [
  'Meeting with Principal',
  'Meeting with Teacher',
  'Student Pickup',
  'Fee Payment',
  'Admission Inquiry',
  'Document Submission',
  'Document Collection',
  'Vendor/Supplier',
  'Interview',
  'Official Work',
  'Other'
];

export default function VisitorGatePass() {
  const { schoolId, user } = useAuth();
  
  // Data states
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('checkin');
  const [search, setSearch] = useState('');
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Check-in form
  const [checkinForm, setCheckinForm] = useState({
    name: '',
    phone: '',
    purpose: 'Meeting with Principal',
    to_meet: '',
    to_meet_type: 'staff', // staff or student
    id_type: 'Aadhar',
    id_number: '',
    vehicle_number: '',
    visitors_count: 1,
    remarks: ''
  });

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId, filterDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [visitorsRes, studentsRes, staffRes] = await Promise.all([
        axios.get(`${API}/visitors?school_id=${schoolId}&date=${filterDate}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/students?school_id=${schoolId}&status=active`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/staff?school_id=${schoolId}`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setVisitors(visitorsRes.data || []);
      setStudents(studentsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter visitors
  const filteredVisitors = visitors.filter(v => 
    !search || 
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search)
  );

  const activeVisitors = filteredVisitors.filter(v => !v.checkout_time);
  const completedVisitors = filteredVisitors.filter(v => v.checkout_time);

  // Check in visitor
  const handleCheckin = async () => {
    if (!checkinForm.name || !checkinForm.phone) {
      toast.error('कृपया name और phone भरें');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visitors/checkin`, {
        ...checkinForm,
        school_id: schoolId,
        checkin_by: user?.id,
        checkin_time: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Visitor checked in!');
      setShowCheckinDialog(false);
      setCheckinForm({
        name: '', phone: '', purpose: 'Meeting with Principal', to_meet: '',
        to_meet_type: 'staff', id_type: 'Aadhar', id_number: '',
        vehicle_number: '', visitors_count: 1, remarks: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to check in visitor');
    } finally {
      setSaving(false);
    }
  };

  // Check out visitor
  const handleCheckout = async (visitorId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visitors/checkout/${visitorId}`, {
        checkout_by: user?.id,
        checkout_time: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Visitor checked out!');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to check out visitor');
    }
  };

  // Print gate pass
  const handlePrintPass = (visitor) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Visitor Pass - ${visitor.pass_number}</title>
        <style>
          body { font-family: Arial; padding: 20px; max-width: 400px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .pass-number { font-size: 24px; font-weight: bold; color: #1e40af; }
          .info { margin: 15px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; }
          .qr { text-align: center; margin: 15px 0; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>VISITOR PASS</h2>
          <div class="pass-number">${visitor.pass_number}</div>
        </div>
        <div class="info">
          <div class="row"><span>Name:</span><span><b>${visitor.name}</b></span></div>
          <div class="row"><span>Phone:</span><span>${visitor.phone}</span></div>
          <div class="row"><span>Purpose:</span><span>${visitor.purpose}</span></div>
          <div class="row"><span>To Meet:</span><span>${visitor.to_meet_name || '-'}</span></div>
          <div class="row"><span>ID Type:</span><span>${visitor.id_type}</span></div>
          <div class="row"><span>ID Number:</span><span>${visitor.id_number || '-'}</span></div>
          <div class="row"><span>Vehicle:</span><span>${visitor.vehicle_number || 'N/A'}</span></div>
          <div class="row"><span>Check-in:</span><span>${new Date(visitor.checkin_time).toLocaleString('en-IN')}</span></div>
        </div>
        <div class="footer">
          <p>Please return this pass at exit</p>
          <p style="font-size: 12px;">Valid for today only</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Stats
  const todayTotal = visitors.length;
  const currentlyInside = activeVisitors.length;
  const checkedOut = completedVisitors.length;

  return (
    <div className="space-y-6" data-testid="visitor-gate-pass">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Visitor Management
          </h1>
          <p className="text-slate-500 mt-1">Gate pass, check-in/out tracking</p>
        </div>
        <Button onClick={() => setShowCheckinDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <LogIn className="w-4 h-4" />
          New Check-in
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Today's Visitors</p>
              <p className="text-2xl font-bold">{todayTotal}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Currently Inside</p>
              <p className="text-2xl font-bold text-green-600">{currentlyInside}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <LogOut className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Checked Out</p>
              <p className="text-2xl font-bold">{checkedOut}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="checkin" className="gap-2">
            <LogIn className="w-4 h-4" />
            Active ({currentlyInside})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            History ({checkedOut})
          </TabsTrigger>
        </TabsList>

        {/* Active Visitors Tab */}
        <TabsContent value="checkin" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  Currently Inside
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search visitors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : activeVisitors.length > 0 ? (
                <div className="space-y-3">
                  {activeVisitors.map(visitor => (
                    <div key={visitor.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {visitor.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{visitor.name}</p>
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <Phone className="w-3 h-3" /> {visitor.phone}
                            </p>
                            <p className="text-sm text-slate-500">
                              {visitor.purpose} • To meet: {visitor.to_meet_name || '-'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Pass No.</p>
                            <p className="font-bold text-blue-600">{visitor.pass_number}</p>
                            <p className="text-xs text-slate-500">
                              In: {new Date(visitor.checkin_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintPass(visitor)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleCheckout(visitor.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <LogOut className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No visitors currently inside</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              {completedVisitors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pass No.</TableHead>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedVisitors.map(visitor => {
                      const duration = visitor.checkout_time 
                        ? Math.round((new Date(visitor.checkout_time) - new Date(visitor.checkin_time)) / 60000)
                        : '-';
                      return (
                        <TableRow key={visitor.id}>
                          <TableCell className="font-medium">{visitor.pass_number}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{visitor.name}</p>
                              <p className="text-xs text-slate-500">{visitor.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{visitor.purpose}</TableCell>
                          <TableCell>{new Date(visitor.checkin_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell>{new Date(visitor.checkout_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell>{duration} mins</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No visit history for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              Visitor Check-in
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visitor Name *</Label>
                <Input
                  value={checkinForm.name}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={checkinForm.phone}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Mobile number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Purpose of Visit</Label>
              <select
                value={checkinForm.purpose}
                onChange={(e) => setCheckinForm(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {VISIT_PURPOSES.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meeting With</Label>
                <select
                  value={checkinForm.to_meet_type}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, to_meet_type: e.target.value, to_meet: '' }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="staff">Staff/Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Select Person</Label>
                <select
                  value={checkinForm.to_meet}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, to_meet: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select --</option>
                  {(checkinForm.to_meet_type === 'student' ? students : staff).map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Type</Label>
                <select
                  value={checkinForm.id_type}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, id_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={checkinForm.id_number}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, id_number: e.target.value }))}
                  placeholder="ID number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  value={checkinForm.vehicle_number}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, vehicle_number: e.target.value }))}
                  placeholder="e.g., MP-09-AB-1234"
                />
              </div>
              <div className="space-y-2">
                <Label>No. of Visitors</Label>
                <Input
                  type="number"
                  value={checkinForm.visitors_count}
                  onChange={(e) => setCheckinForm(prev => ({ ...prev, visitors_count: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCheckinDialog(false)}>Cancel</Button>
              <Button onClick={handleCheckin} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
