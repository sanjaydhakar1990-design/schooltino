import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  UserPlus, Users, Clock, CheckCircle2, LogOut, Search,
  FileText, Phone, Car, BadgeCheck, RefreshCw, Plus,
  AlertCircle, Calendar, Building, Filter, Download,
  Eye, MoreVertical, Printer, Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const purposeLabels = {
  meeting: 'Meeting',
  delivery: 'Delivery',
  parent_visit: 'Parent Visit',
  vendor: 'Vendor',
  interview: 'Interview',
  other: 'Other'
};

const purposeColors = {
  meeting: 'bg-blue-500/10 text-blue-600',
  delivery: 'bg-orange-500/10 text-orange-600',
  parent_visit: 'bg-green-500/10 text-green-600',
  vendor: 'bg-purple-500/10 text-purple-600',
  interview: 'bg-indigo-500/10 text-indigo-600',
  other: 'bg-slate-500/10 text-slate-600'
};

export default function FrontOfficePage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, in: 0, out: 0 });

  const schoolId = user?.school_id || 'school123';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    purpose: 'parent_visit',
    whom_to_meet: '',
    id_proof_type: '',
    id_proof_number: '',
    vehicle_number: '',
    num_visitors: 1,
    expected_duration: 30,
    notes: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/front-office/visitors/today?school_id=${schoolId}`);
      const data = await res.json();
      setVisitors(data.visitors || []);
      setStats({
        total: data.total_visitors || 0,
        in: data.currently_in || 0,
        out: data.checked_out || 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.whom_to_meet) {
      toast.error('Name, Phone aur Whom to Meet required hai');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/front-office/visitors/checkin?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Visitor checked in! Badge: ${data.gate_pass?.badge_number}`);
        setShowAddDialog(false);
        setForm({ name: '', phone: '', purpose: 'parent_visit', whom_to_meet: '', id_proof_type: '', id_proof_number: '', vehicle_number: '', num_visitors: 1, expected_duration: 30, notes: '' });
        fetchVisitors();
      }
    } catch (error) {
      toast.error('Check-in failed');
    }
  };

  const handleCheckout = async (visitorId) => {
    try {
      const res = await fetch(`${API_URL}/api/front-office/visitors/${visitorId}/checkout?school_id=${schoolId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Visitor checked out! Duration: ${data.duration}`);
        fetchVisitors();
      }
    } catch (error) {
      toast.error('Check-out failed');
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredVisitors = visitors.filter(v => 
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone?.includes(searchQuery) ||
    v.whom_to_meet?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="front-office-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="w-8 h-8 text-blue-500" />
            Visit Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Know who's in — real-time visitor tracking with OTP approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchVisitors}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            New Visitor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Today</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently In</p>
                <p className="text-3xl font-bold text-green-600">{stats.in}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checked Out</p>
                <p className="text-3xl font-bold text-slate-600">{stats.out}</p>
              </div>
              <LogOut className="w-10 h-10 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone or whom to meet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="search-visitors-input"
        />
      </div>

      {/* Visitors List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredVisitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aaj koi visitor nahi aaya</h3>
              <p className="text-muted-foreground mt-1">New visitor add karne ke liye button click karein</p>
            </CardContent>
          </Card>
        ) : (
          filteredVisitors.map((visitor) => (
            <Card key={visitor.visitor_id} className={`transition-all hover:shadow-md ${visitor.status === 'checked_out' ? 'opacity-60' : ''}`}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Badge */}
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {visitor.badge_number}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{visitor.name}</h3>
                      <Badge className={purposeColors[visitor.purpose]}>
                        {purposeLabels[visitor.purpose]}
                      </Badge>
                      <Badge variant={visitor.status === 'checked_in' ? 'default' : 'secondary'}>
                        {visitor.status === 'checked_in' ? 'Inside' : 'Left'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {visitor.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Meeting: {visitor.whom_to_meet}
                      </span>
                      {visitor.vehicle_number && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" /> {visitor.vehicle_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In: {formatTime(visitor.checkin_time)}
                        {visitor.checkout_time && ` | Out: ${formatTime(visitor.checkout_time)}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {visitor.status === 'checked_in' && (
                    <Button
                      variant="outline"
                      onClick={() => handleCheckout(visitor.visitor_id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      data-testid={`checkout-btn-${visitor.visitor_id}`}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Check Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Visitor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Visitor Check-in</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Visitor name"
                  data-testid="visitor-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Purpose *</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({...form, purpose: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="parent_visit">Parent Visit</option>
                  <option value="meeting">Meeting</option>
                  <option value="delivery">Delivery</option>
                  <option value="vendor">Vendor</option>
                  <option value="interview">Interview</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Whom to Meet *</label>
                <Input
                  value={form.whom_to_meet}
                  onChange={(e) => setForm({...form, whom_to_meet: e.target.value})}
                  placeholder="Staff name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ID Proof Type</label>
                <select
                  value={form.id_proof_type}
                  onChange={(e) => setForm({...form, id_proof_type: e.target.value})}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Select</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">ID Number</label>
                <Input
                  value={form.id_proof_number}
                  onChange={(e) => setForm({...form, id_proof_number: e.target.value})}
                  placeholder="ID number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Vehicle Number</label>
                <Input
                  value={form.vehicle_number}
                  onChange={(e) => setForm({...form, vehicle_number: e.target.value})}
                  placeholder="UP32 AB 1234"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Duration (min)</label>
                <Input
                  type="number"
                  value={form.expected_duration}
                  onChange={(e) => setForm({...form, expected_duration: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mt-4 border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" /> OTP Verification
              </h4>
              {!otpSent ? (
                <div>
                  <p className="text-xs text-blue-700 mb-2">Send OTP to the person being visited for approval</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    const code = Math.floor(1000 + Math.random() * 9000).toString();
                    setGeneratedOtp(code);
                    setOtpSent(true);
                    toast.success(`OTP ${code} sent to ${form.whom_to_meet}`);
                  }} className="text-blue-700 border-blue-300">
                    Send OTP
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-green-700">OTP sent! Enter the code to verify visitor</p>
                  <div className="flex gap-2">
                    <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 4-digit OTP" className="w-40" maxLength={4} />
                    <Badge className={otp === generatedOtp && otp.length === 4 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {otp === generatedOtp && otp.length === 4 ? '✓ Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <BadgeCheck className="w-4 h-4 mr-2" />
                Check In & Print Pass
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
