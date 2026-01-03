import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, UserPlus, Check, X, Loader2, Shield, Users, Clock, 
  Ban, RefreshCw, ArrowRightLeft, MoreVertical, Eye, AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    mobile: ''
  });

  const [suspendForm, setSuspendForm] = useState({
    reason: 'fees_pending',
    reason_details: '',
    suspend_until: ''
  });

  const [transferForm, setTransferForm] = useState({
    new_user_name: '',
    new_user_email: '',
    new_user_mobile: '',
    new_password: '',
    transfer_reason: ''
  });

  // Roles that Director can create
  const directorCanCreate = ['co_director', 'principal', 'vice_principal', 'accountant', 'exam_controller', 'teacher', 'librarian'];
  
  // Roles that Principal can create (need Director approval)
  const principalCanCreate = ['teacher', 'librarian', 'clerk'];

  const roleLabels = {
    director: 'Director (निदेशक)',
    co_director: 'Co-Director (सह-निदेशक)',
    principal: 'Principal (प्राचार्य)',
    vice_principal: 'Vice Principal (उप-प्राचार्य)',
    accountant: 'Accountant (लेखाकार)',
    exam_controller: 'Exam Controller (परीक्षा नियंत्रक)',
    teacher: 'Teacher (शिक्षक)',
    librarian: 'Librarian (पुस्तकालयाध्यक्ष)',
    clerk: 'Clerk (लिपिक)'
  };

  const suspendReasons = {
    fees_pending: 'Fees Pending (शुल्क बकाया)',
    misconduct: 'Misconduct (अनुशासनहीनता)',
    document_pending: 'Document Pending (दस्तावेज़ लंबित)',
    other: 'Other (अन्य)'
  };

  const allowedRoles = user?.role === 'director' ? directorCanCreate : principalCanCreate;

  useEffect(() => {
    if (schoolId) {
      fetchUsers();
    }
  }, [schoolId]);

  const fetchUsers = async () => {
    try {
      const [usersRes, pendingRes] = await Promise.all([
        axios.get(`${API}/users/school/${schoolId}`),
        axios.get(`${API}/users/pending/${schoolId}`)
      ]);
      
      // Separate active and suspended users
      const activeUsers = usersRes.data.filter(u => u.status === 'active');
      const suspended = usersRes.data.filter(u => u.status === 'suspended');
      
      setUsers(activeUsers);
      setSuspendedUsers(suspended);
      setPendingUsers(pendingRes.data);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/users/create`, {
        ...formData,
        school_id: schoolId,
        created_by: user.id,
        status: user.role === 'director' ? 'active' : 'pending'
      });
      
      toast.success(user.role === 'director' 
        ? 'User created! Login credentials share करें।' 
        : 'User created! Director approval pending।'
      );
      
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'teacher', mobile: '' });
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(`${API}/users/${userId}/approve`);
      toast.success('User approved!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this user?')) return;
    try {
      await axios.post(`${API}/users/${userId}/reject`);
      toast.success('User rejected');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      await axios.post(`${API}/users/${selectedUser.id}/suspend`, suspendForm);
      toast.success('User suspended');
      setIsSuspendDialogOpen(false);
      setSuspendForm({ reason: 'fees_pending', reason_details: '', suspend_until: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsuspend = async (userId) => {
    try {
      await axios.post(`${API}/users/${userId}/unsuspend`);
      toast.success('User unsuspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unsuspend user');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user? वो login नहीं कर पाएगा।')) return;
    try {
      await axios.post(`${API}/users/${userId}/deactivate`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await axios.post(`${API}/users/${userId}/reactivate`);
      toast.success('User reactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reactivate user');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      await axios.post(`${API}/users/${selectedUser.id}/transfer`, transferForm);
      toast.success(`Account transferred from ${selectedUser.name} to ${transferForm.new_user_name}`);
      setIsTransferDialogOpen(false);
      setTransferForm({ new_user_name: '', new_user_email: '', new_user_mobile: '', new_password: '', transfer_reason: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to transfer account');
    } finally {
      setSubmitting(false);
    }
  };

  const openSuspendDialog = (u) => {
    setSelectedUser(u);
    setIsSuspendDialogOpen(true);
  };

  const openTransferDialog = (u) => {
    setSelectedUser(u);
    setTransferForm({ new_user_name: '', new_user_email: '', new_user_mobile: '', new_password: '', transfer_reason: '' });
    setIsTransferDialogOpen(true);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const generateTransferPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTransferForm(prev => ({ ...prev, new_password: password }));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-warning';
      case 'deactivated': return 'badge-error';
      case 'pending': return 'badge-info';
      default: return 'badge-info';
    }
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  if (!['director', 'principal', 'vice_principal'].includes(user?.role)) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">You don't have permission to access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">स्टाफ के login accounts manage करें</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="create-user-btn">
              <UserPlus className="w-5 h-5 mr-2" />
              Create User Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create User Account</DialogTitle>
              <DialogDescription>
                {user?.role === 'director' 
                  ? 'User तुरंत active होगा।' 
                  : 'Director approval के बाद active होगा।'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                  data-testid="user-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@school.com"
                  required
                  data-testid="user-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Set password"
                    required
                    data-testid="user-password-input"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-slate-500">यह password user को share करें</p>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  required
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                  data-testid="user-role-select"
                >
                  {allowedRoles.map(role => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="Mobile number"
                  data-testid="user-mobile-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-user-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="font-semibold text-indigo-900 mb-2">📋 Login System:</h3>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>1. Director यहाँ user account create करे (email + password)</li>
          <li>2. User को credentials share करे</li>
          <li>3. सभी users <strong>same login page</strong> पर login करें</li>
          <li>4. System automatically role के हिसाब से access देगा</li>
        </ul>
      </div>

      {/* Authority Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card bg-emerald-50 border-emerald-200">
          <h4 className="font-semibold text-emerald-800">Director Powers</h4>
          <p className="text-sm text-emerald-600 mt-1">Create, Suspend, Deactivate, Reactivate, Transfer</p>
        </div>
        <div className="stat-card bg-amber-50 border-amber-200">
          <h4 className="font-semibold text-amber-800">Principal Powers</h4>
          <p className="text-sm text-amber-600 mt-1">Create (needs approval), Suspend</p>
        </div>
        <div className="stat-card bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800">Transfer Account</h4>
          <p className="text-sm text-blue-600 mt-1">Teacher बदलने पर ID transfer करें</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="active-users-tab">
            <Users className="w-4 h-4 mr-2" />
            Active ({users.length})
          </TabsTrigger>
          {user?.role === 'director' && (
            <TabsTrigger value="pending" data-testid="pending-users-tab">
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pendingUsers.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="suspended" data-testid="suspended-users-tab">
            <Ban className="w-4 h-4 mr-2" />
            Suspended ({suspendedUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Users Tab */}
        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner w-10 h-10" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No active users</p>
            </div>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className="badge badge-info capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{u.mobile || '-'}</TableCell>
                      <TableCell>
                        <span className={`badge ${getStatusBadge(u.status)}`}>
                          {u.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.role !== 'director' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openSuspendDialog(u)}>
                                <Ban className="w-4 h-4 mr-2 text-amber-500" />
                                Suspend (अस्थायी रोक)
                              </DropdownMenuItem>
                              {user?.role === 'director' && (
                                <>
                                  <DropdownMenuItem onClick={() => openTransferDialog(u)}>
                                    <ArrowRightLeft className="w-4 h-4 mr-2 text-blue-500" />
                                    Transfer Account
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeactivate(u.id)}
                                    className="text-rose-600"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Deactivate (स्थायी बंद)
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Pending Users Tab */}
        {user?.role === 'director' && (
          <TabsContent value="pending">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No pending approvals</p>
              </div>
            ) : (
              <div className="data-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((u) => (
                      <TableRow key={u.id} className="bg-amber-50" data-testid={`pending-row-${u.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <span className="badge badge-warning capitalize">
                            {u.role.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{u.created_by_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApprove(u.id)}
                              data-testid={`approve-${u.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-200"
                              onClick={() => handleReject(u.id)}
                              data-testid={`reject-${u.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}

        {/* Suspended Users Tab */}
        <TabsContent value="suspended">
          {suspendedUsers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Ban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No suspended users</p>
            </div>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspendedUsers.map((u) => (
                    <TableRow key={u.id} className="bg-amber-50" data-testid={`suspended-row-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className="badge badge-warning capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-amber-700">{suspendReasons[u.suspension_reason] || u.suspension_reason}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleUnsuspend(u.id)}
                          data-testid={`unsuspend-${u.id}`}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Unsuspend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.name} को temporarily suspend करें
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSuspend} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <select
                value={suspendForm.reason}
                onChange={(e) => setSuspendForm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
                required
              >
                {Object.entries(suspendReasons).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={suspendForm.reason_details}
                onChange={(e) => setSuspendForm(prev => ({ ...prev, reason_details: e.target.value }))}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Suspend Until (optional)</Label>
              <Input
                type="date"
                value={suspendForm.suspend_until}
                onChange={(e) => setSuspendForm(prev => ({ ...prev, suspend_until: e.target.value }))}
              />
              <p className="text-xs text-slate-500">खाली रहने पर manually unsuspend करना होगा</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Suspend User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-500" />
              Transfer Account
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.name} ({selectedUser?.role}) की ID नए व्यक्ति को transfer करें
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4 mt-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> इससे role/ID same रहेगा, बस person बदल जाएगा। 
                पुराने data (syllabus, attendance records) इसी ID से linked रहेगा।
              </p>
            </div>
            <div className="space-y-2">
              <Label>New Person Name *</Label>
              <Input
                value={transferForm.new_user_name}
                onChange={(e) => setTransferForm(prev => ({ ...prev, new_user_name: e.target.value }))}
                placeholder="New teacher/staff name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>New Email *</Label>
              <Input
                type="email"
                value={transferForm.new_user_email}
                onChange={(e) => setTransferForm(prev => ({ ...prev, new_user_email: e.target.value }))}
                placeholder="newemail@school.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>New Mobile</Label>
              <Input
                value={transferForm.new_user_mobile}
                onChange={(e) => setTransferForm(prev => ({ ...prev, new_user_mobile: e.target.value }))}
                placeholder="Mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password *</Label>
              <div className="flex gap-2">
                <Input
                  value={transferForm.new_password}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Set password"
                  required
                />
                <Button type="button" variant="outline" onClick={generateTransferPassword}>
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transfer Reason *</Label>
              <Input
                value={transferForm.transfer_reason}
                onChange={(e) => setTransferForm(prev => ({ ...prev, transfer_reason: e.target.value }))}
                placeholder="e.g., Teacher resignation, Transfer"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Transfer Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
