import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Shield, Users, Search, ChevronRight, Check, X, 
  Loader2, UserCog, GraduationCap, Wallet, Bell,
  CalendarCheck, Settings, Eye, Edit, Lock, Unlock,
  AlertTriangle, RefreshCw, Crown, Star
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  "Dashboard & Analytics": [
    { key: "dashboard", label: "Dashboard", description: "View main dashboard" },
    { key: "school_analytics", label: "School Analytics", description: "View school reports & analytics" },
    { key: "reports", label: "Reports", description: "View detailed reports" },
  ],
  "User Management": [
    { key: "user_management", label: "User Management", description: "Create Principal, VP, Co-Director accounts" },
    { key: "staff", label: "Staff Management", description: "View and manage staff" },
  ],
  "Students & Classes": [
    { key: "students", label: "View Students", description: "View student list" },
    { key: "student_admission", label: "Student Admission", description: "Admit new students & generate IDs" },
    { key: "classes", label: "Classes", description: "View and manage classes" },
    { key: "class_assignment", label: "Teacher Assignment", description: "Assign teachers to classes" },
  ],
  "Attendance & Leave": [
    { key: "attendance", label: "Attendance", description: "Manage attendance" },
    { key: "leave_management", label: "Leave Management", description: "View leave applications" },
    { key: "leave_approval", label: "Leave Approval", description: "Approve/reject leaves" },
  ],
  "Fees & Finance": [
    { key: "fees", label: "View Fees", description: "View fee structure" },
    { key: "fee_collection", label: "Fee Collection", description: "Collect cash payments" },
    { key: "fee_approval", label: "Fee Approval", description: "Approve cash payments" },
  ],
  "Communication": [
    { key: "notices", label: "View Notices", description: "View notices" },
    { key: "notice_create", label: "Create Notices", description: "Create and send notices" },
    { key: "sms_center", label: "SMS Center", description: "Send SMS/WhatsApp" },
  ],
  "AI & Content": [
    { key: "ai_paper", label: "AI Paper Generator", description: "Generate question papers" },
    { key: "ai_content", label: "AI Content Studio", description: "Create banners & pamphlets" },
  ],
  "Security & Settings": [
    { key: "cctv", label: "CCTV Dashboard", description: "View CCTV feeds" },
    { key: "meetings", label: "Meetings", description: "Schedule & join meetings" },
    { key: "gallery", label: "Gallery", description: "Manage image gallery" },
    { key: "website_integration", label: "Website Integration", description: "Manage website sync" },
    { key: "audit_logs", label: "Audit Logs", description: "View audit history" },
    { key: "settings", label: "Settings", description: "System settings" },
  ]
};

export default function PermissionManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First get current user's school_id
      const meRes = await axios.get(`${API}/auth/me`);
      const schoolId = meRes.data.school_id || 'default';
      
      const res = await axios.get(`${API}/users/school/${schoolId}`);
      // Filter out teachers (they use TeachTino) and current director
      const adminUsers = res.data.filter(u => 
        ['principal', 'vice_principal', 'co_director', 'accountant', 'admission_staff', 'clerk'].includes(u.role)
      );
      setUsers(adminUsers);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openPermissions = async (userData) => {
    setSelectedUser(userData);
    try {
      const res = await axios.get(`${API}/users/${userData.id}/permissions`);
      setUserPermissions(res.data.permissions || {});
    } catch (error) {
      // Use default permissions for role
      setUserPermissions({});
    }
    setShowPermissionDialog(true);
  };

  const togglePermission = (key) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.put(`${API}/users/${selectedUser.id}/permissions`, {
        permissions: userPermissions
      });
      toast.success(`Permissions updated for ${selectedUser.name}`);
      setShowPermissionDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const grantFullAccess = async (userData) => {
    try {
      await axios.post(`${API}/users/${userData.id}/grant-full-access`);
      toast.success(`Full access granted to ${userData.name}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to grant access');
    }
  };

  const revokeAccess = async (userData) => {
    try {
      await axios.post(`${API}/users/${userData.id}/revoke-access`);
      toast.success(`Access revoked for ${userData.name}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'principal': return 'bg-blue-100 text-blue-700';
      case 'vice_principal': return 'bg-emerald-100 text-emerald-700';
      case 'co_director': return 'bg-purple-100 text-purple-700';
      case 'accountant': return 'bg-amber-100 text-amber-700';
      case 'admission_staff': return 'bg-pink-100 text-pink-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (user?.role !== 'director') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">Only Director can manage permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="permission-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Permission Manager
          </h1>
          <p className="text-slate-500">Control who can access what in Schooltino</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <Crown className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <p className="font-medium text-indigo-900">You are the Director</p>
          <p className="text-sm text-indigo-700">You have full access to all features. Manage permissions for Principal, VP, Co-Director, and Staff below.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Role</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Full Access</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No users found. Create Principal, VP, or Staff accounts first.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            userData.role === 'principal' ? 'bg-blue-500' :
                            userData.role === 'vice_principal' ? 'bg-emerald-500' :
                            userData.role === 'co_director' ? 'bg-purple-500' :
                            'bg-slate-500'
                          }`}>
                            {userData.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{userData.name}</p>
                            <p className="text-sm text-slate-500">{userData.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.role)}`}>
                          {userData.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          userData.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          userData.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {userData.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {userData.full_access_granted ? (
                          <span className="inline-flex items-center text-emerald-600">
                            <Star className="w-4 h-4 mr-1 fill-current" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPermissions(userData)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Permissions
                          </Button>
                          {!userData.full_access_granted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => grantFullAccess(userData)}
                            >
                              <Unlock className="w-3 h-3 mr-1" />
                              Full Access
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => revokeAccess(userData)}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Permissions for {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                selectedUser?.role === 'principal' ? 'bg-blue-500' :
                selectedUser?.role === 'vice_principal' ? 'bg-emerald-500' :
                'bg-slate-500'
              }`}>
                {selectedUser?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedUser?.name}</p>
                <p className="text-sm text-slate-500">{selectedUser?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(selectedUser?.role || '')}`}>
                  {selectedUser?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Permission Categories */}
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">{category}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {permissions.map((perm) => (
                    <div key={perm.key} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{perm.label}</p>
                        <p className="text-sm text-slate-500">{perm.description}</p>
                      </div>
                      <Switch
                        checked={userPermissions[perm.key] || false}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePermissions} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
