/**
 * Unified Employee Management Page
 * - Staff + User combined in one place
 * - Employee details, designation, permissions all together
 * - Login enable/disable with one click
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Users, Plus, Search, Edit2, Trash2, UserCheck, UserX, Key,
  Shield, Loader2, Phone, Mail, Building, Award, Calendar,
  IndianRupee, CheckCircle, XCircle, Settings, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Default permissions for quick selection
const PERMISSION_PRESETS = {
  full_access: {
    label: "Full Access (Director)",
    permissions: { dashboard: true, students: true, attendance: true, fees: true, staff: true, reports: true, settings: true, user_management: true }
  },
  teacher: {
    label: "Teacher",
    permissions: { dashboard: true, students: true, attendance: true, reports: false, settings: false }
  },
  accountant: {
    label: "Accountant",
    permissions: { dashboard: true, fees: true, reports: true, students: false, attendance: false }
  },
  view_only: {
    label: "View Only",
    permissions: { dashboard: true }
  }
};

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterHasLogin, setFilterHasLogin] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    designation: 'teacher',
    department: '',
    qualification: '',
    joining_date: new Date().toISOString().split('T')[0],
    salary: '',
    create_login: true,
    password: '',
    role: 'teacher',
    custom_permissions: null
  });
  
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionPreset, setPermissionPreset] = useState('teacher');

  useEffect(() => {
    if (schoolId) {
      fetchEmployees();
      fetchDesignations();
    }
  }, [schoolId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ school_id: schoolId });
      if (filterDesignation) params.append('designation', filterDesignation);
      if (filterHasLogin) params.append('has_login', filterHasLogin);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/api/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Fallback to staff API
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/staff?school_id=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(response.data || []);
      } catch (e) {
        toast.error('Employees load करने में समस्या');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/employees/designations/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesignations(response.data || []);
    } catch (error) {
      // Use default designations
      setDesignations([
        { id: "principal", name: "Principal (प्रधानाचार्य)", default_role: "principal" },
        { id: "teacher", name: "Teacher (शिक्षक)", default_role: "teacher" },
        { id: "accountant", name: "Accountant (लेखाकार)", default_role: "admin_staff" },
        { id: "clerk", name: "Clerk (लिपिक)", default_role: "clerk" },
        { id: "peon", name: "Peon (चपरासी)", default_role: "peon" }
      ]);
    }
  };

  const handleSearch = () => {
    fetchEmployees();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      address: '',
      designation: 'teacher',
      department: '',
      qualification: '',
      joining_date: new Date().toISOString().split('T')[0],
      salary: '',
      create_login: true,
      password: '',
      role: 'teacher',
      custom_permissions: null
    });
    setEditingEmployee(null);
    setShowPermissions(false);
    setPermissionPreset('teacher');
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (employee) => {
    setFormData({
      name: employee.name || '',
      mobile: employee.mobile || '',
      email: employee.email || '',
      address: employee.address || '',
      designation: employee.designation || 'teacher',
      department: employee.department || '',
      qualification: employee.qualification || '',
      joining_date: employee.joining_date || '',
      salary: employee.salary || '',
      create_login: employee.has_login || false,
      password: '',
      role: employee.role || 'teacher',
      custom_permissions: employee.permissions || null
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDesignationChange = (designation) => {
    const des = designations.find(d => d.id === designation);
    setFormData(prev => ({
      ...prev,
      designation: designation,
      role: des?.default_role || 'teacher'
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile || !formData.email) {
      toast.error('Name, Mobile और Email जरूरी है');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        school_id: schoolId,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        password: formData.password || formData.mobile
      };
      
      if (editingEmployee) {
        await axios.put(`${API}/api/employees/${editingEmployee.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Employee updated!');
      } else {
        await axios.post(`${API}/api/employees`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Employee added!');
      }
      
      setShowForm(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error saving employee');
    } finally {
      setSaving(false);
    }
  };

  const toggleLogin = async (employee, enable) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/employees/${employee.id}/toggle-login`, 
        { enable, password: employee.mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(enable ? 'Login enabled! Default password: Mobile number' : 'Login disabled');
      fetchEmployees();
    } catch (error) {
      toast.error('Error toggling login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Employee Management
          </h1>
          <p className="text-gray-500 text-sm">Staff + Users एक जगह manage करें</p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name, ID, email, mobile..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2"
            value={filterDesignation}
            onChange={e => setFilterDesignation(e.target.value)}
          >
            <option value="">All Designations</option>
            {designations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            value={filterHasLogin}
            onChange={e => setFilterHasLogin(e.target.value)}
          >
            <option value="">Login Status</option>
            <option value="true">Has Login</option>
            <option value="false">No Login</option>
          </select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-700">{employees.length}</div>
          <div className="text-sm text-indigo-600">Total Employees</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">
            {employees.filter(e => e.has_login).length}
          </div>
          <div className="text-sm text-green-600">With Login</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-700">
            {employees.filter(e => e.designation?.toLowerCase().includes('teacher')).length}
          </div>
          <div className="text-sm text-amber-600">Teachers</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700">
            {employees.filter(e => !e.designation?.toLowerCase().includes('teacher')).length}
          </div>
          <div className="text-sm text-purple-600">Other Staff</div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Designation</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Login</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {emp.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{emp.designation}</div>
                    {emp.department && <div className="text-xs text-gray-500">{emp.department}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {emp.mobile}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {emp.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {emp.has_login ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        <UserX className="w-3 h-3" /> No Login
                      </span>
                    )}
                    {emp.role && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">{emp.role}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(emp)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {emp.has_login ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => toggleLogin(emp, false)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-green-600"
                          onClick={() => toggleLogin(emp, true)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No employees found. Click "Add Employee" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-lg font-bold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="Employee name"
                  />
                </div>
                <div>
                  <Label>Mobile *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={e => setFormData(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@school.com"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Employment Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Designation *</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={formData.designation}
                      onChange={e => handleDesignationChange(e.target.value)}
                    >
                      {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={formData.department}
                      onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g., Science, Arts, Admin"
                    />
                  </div>
                  <div>
                    <Label>Qualification</Label>
                    <Input
                      value={formData.qualification}
                      onChange={e => setFormData(f => ({ ...f, qualification: e.target.value }))}
                      placeholder="e.g., M.A., B.Ed"
                    />
                  </div>
                  <div>
                    <Label>Joining Date</Label>
                    <Input
                      type="date"
                      value={formData.joining_date}
                      onChange={e => setFormData(f => ({ ...f, joining_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Monthly Salary (₹)</Label>
                    <Input
                      type="number"
                      value={formData.salary}
                      onChange={e => setFormData(f => ({ ...f, salary: e.target.value }))}
                      placeholder="25000"
                    />
                  </div>
                </div>
              </div>

              {/* Login & Permissions */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Login & Permissions
                </h4>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.create_login}
                      onChange={e => setFormData(f => ({ ...f, create_login: e.target.checked }))}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <div className="font-medium">Create Login Account</div>
                      <div className="text-sm text-gray-500">Employee can login to system</div>
                    </div>
                  </label>
                  
                  {formData.create_login && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Role</Label>
                          <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.role}
                            onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                          >
                            <option value="principal">Principal</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin_staff">Admin Staff</option>
                            <option value="clerk">Clerk</option>
                            <option value="peon">Peon</option>
                          </select>
                        </div>
                        <div>
                          <Label>Password (Default: Mobile)</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                              placeholder="Leave empty for mobile as password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPermissions(!showPermissions)}
                        className="gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        {showPermissions ? 'Hide' : 'Show'} Permissions
                      </Button>
                      
                      {showPermissions && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => {
                                  setPermissionPreset(key);
                                  setFormData(f => ({ ...f, custom_permissions: preset.permissions }));
                                }}
                                className={`px-3 py-1 rounded-full text-xs border ${
                                  permissionPreset === key 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'bg-white hover:bg-gray-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Permissions are automatically set based on role. Use presets for quick selection.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingEmployee ? 'Update' : 'Add'} Employee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
