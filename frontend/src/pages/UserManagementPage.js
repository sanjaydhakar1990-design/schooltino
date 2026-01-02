import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Plus, UserPlus, Check, X, Loader2, Shield, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { schoolId, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    mobile: ''
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
      setUsers(usersRes.data);
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
        // If Principal creates, status is pending. If Director creates, status is active
        status: user.role === 'director' ? 'active' : 'pending'
      });
      
      toast.success(user.role === 'director' 
        ? 'User created successfully! उन्हें login credentials share करें।' 
        : 'User created! Director approval के बाद active होगा।'
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
      toast.success('User approved! अब वो login कर सकते हैं।');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user?')) return;
    try {
      await axios.post(`${API}/users/${userId}/reject`);
      toast.success('User rejected');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await axios.post(`${API}/users/${userId}/deactivate`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
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
                  : 'User Director approval के बाद active होगा।'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  data-testid="user-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@school.com"
                  required
                  data-testid="user-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="flex gap-2">
                  <Input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
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
        <h3 className="font-semibold text-indigo-900 mb-2">Login Process:</h3>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>1. आप यहाँ user account create करें (email + password)</li>
          <li>2. User को email और password share करें</li>
          <li>3. User same login page पर जाकर login करे</li>
          <li>4. उन्हें automatically उनके school का access मिलेगा</li>
        </ul>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="active-users-tab">
            <Users className="w-4 h-4 mr-2" />
            Active Users ({users.length})
          </TabsTrigger>
          {user?.role === 'director' && (
            <TabsTrigger value="pending" data-testid="pending-users-tab">
              <Clock className="w-4 h-4 mr-2" />
              Pending Approval ({pendingUsers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner w-10 h-10" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No users yet</p>
              <p className="text-sm text-slate-400">Create user accounts for your staff</p>
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
                    <TableHead>Created</TableHead>
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
                      <TableCell className="text-sm text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {u.role !== 'director' && user?.role === 'director' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => handleDeactivate(u.id)}
                            data-testid={`deactivate-${u.id}`}
                          >
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

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
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
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
      </Tabs>
    </div>
  );
}
