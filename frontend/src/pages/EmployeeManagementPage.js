/**
 * Unified Employee Management Page
 * - Staff + User combined in one place
 * - Employee details, designation, permissions all together
 * - Login enable/disable with one click
 * - Employee ID Card generation
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
  IndianRupee, CheckCircle, XCircle, Settings, Eye, EyeOff, CreditCard, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import EmployeeIDCard from '../components/EmployeeIDCard';

const API = process.env.REACT_APP_BACKEND_URL;

// Default permissions for quick selection
const PERMISSION_PRESETS = {
  full_access: {
    label: "🔓 Full Access (Director)",
    description: "Sabhi modules ka access",
    permissions: { 
      dashboard: true, students: true, attendance: true, fees: true, 
      staff: true, reports: true, settings: true, user_management: true,
      tino_brain: true, ai_tools: true, notices: true, transport: true,
      cash_collection: true, admit_cards: true, calendar: true
    }
  },
  principal: {
    label: "👨‍💼 Principal",
    description: "User management chhodke sab",
    permissions: { 
      dashboard: true, students: true, attendance: true, fees: true, 
      staff: true, reports: true, settings: false, user_management: false,
      tino_brain: true, ai_tools: true, notices: true, transport: true,
      cash_collection: false, admit_cards: true, calendar: true
    }
  },
  teacher: {
    label: "👨‍🏫 Teacher",
    description: "Students aur attendance manage",
    permissions: { 
      dashboard: true, students: true, attendance: true, reports: false, 
      settings: false, fees: false, staff: false, user_management: false,
      tino_brain: true, ai_tools: true, notices: true, transport: false,
      cash_collection: false, admit_cards: true, calendar: true
    }
  },
  accountant: {
    label: "💰 Accountant",
    description: "Fees aur cash collection",
    permissions: { 
      dashboard: true, fees: true, reports: true, students: true, 
      attendance: false, settings: false, staff: false, user_management: false,
      tino_brain: false, ai_tools: false, notices: true, transport: false,
      cash_collection: true, admit_cards: true, calendar: false
    }
  },
  front_office: {
    label: "🏢 Front Office",
    description: "Basic student info aur notices",
    permissions: { 
      dashboard: true, students: true, attendance: false, fees: false, 
      reports: false, settings: false, staff: false, user_management: false,
      tino_brain: false, ai_tools: false, notices: true, transport: false,
      cash_collection: false, admit_cards: false, calendar: true
    }
  },
  transport_incharge: {
    label: "🚌 Transport Incharge",
    description: "Transport management",
    permissions: { 
      dashboard: true, transport: true, students: true, attendance: false,
      fees: false, reports: false, settings: false, staff: false,
      tino_brain: false, ai_tools: false, notices: true, cash_collection: false
    }
  },
  view_only: {
    label: "👁️ View Only",
    description: "Sirf dekhne ka access",
    permissions: { dashboard: true }
  }
};

// All available permissions with descriptions
const ALL_PERMISSIONS = {
  dashboard: { label: "Dashboard", icon: "📊" },
  students: { label: "Students", icon: "👨‍🎓" },
  attendance: { label: "Attendance", icon: "✅" },
  fees: { label: "Fees Management", icon: "💰" },
  staff: { label: "Staff Management", icon: "👥" },
  reports: { label: "Reports", icon: "📈" },
  settings: { label: "School Settings", icon: "⚙️" },
  user_management: { label: "User/Login Management", icon: "🔐" },
  tino_brain: { label: "Tino Brain AI", icon: "🧠" },
  ai_tools: { label: "AI Tools", icon: "🤖" },
  notices: { label: "Notices", icon: "📢" },
  transport: { label: "Transport", icon: "🚌" },
  cash_collection: { label: "Cash Collection", icon: "💵" },
  admit_cards: { label: "Admit Cards", icon: "🎫" },
  calendar: { label: "Calendar/Events", icon: "📅" }
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
  
  // ID Card state
  const [showIDCard, setShowIDCard] = useState(false);
  const [selectedEmployeeForID, setSelectedEmployeeForID] = useState(null);
  const [school, setSchool] = useState(null);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
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
    custom_permissions: null,
    blood_group: '',
    emergency_contact: '' // Family phone for ID card
  });
  
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionPreset, setPermissionPreset] = useState('teacher');

  useEffect(() => {
    if (schoolId) {
      fetchEmployees();
      fetchDesignations();
      fetchSchool();
    }
  }, [schoolId]);

  const fetchSchool = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchool(response.data);
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

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
      role: des?.default_role || prev.role || 'teacher'  // Don't override if already set
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

  // Delete Employee Permanently (Admin/Director only)
  const handleDeleteEmployee = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/users/${deleteEmployee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee data permanently deleted');
      setShowDeleteDialog(false);
      setDeleteEmployee(null);
      setDeleteConfirmText('');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (employee) => {
    setDeleteEmployee(employee);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  // Bulk Print Employee ID Cards
  const handleBulkPrintIDCards = async () => {
    if (employees.length === 0) {
      toast.error('No employees to print');
      return;
    }
    
    setBulkPrinting(true);
    toast.info('Generating ID cards...');
    
    try {
      const token = localStorage.getItem('token');
      const cardDataList = [];
      
      // Fetch all card data first
      for (const emp of employees) {
        try {
          const res = await axios.get(API + '/api/id-card/generate/' + (emp.role || 'teacher') + '/' + emp.id, {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (res.data?.id_card) {
            cardDataList.push({
              card: res.data.id_card,
              school: res.data.school
            });
          }
        } catch (e) {
          console.error('Error fetching card for', emp.name);
        }
      }
      
      // Generate HTML and open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked - please allow popups');
        setBulkPrinting(false);
        return;
      }
      
      // Build cards HTML
      let cardsHtml = cardDataList.map(item => {
        const card = item.card;
        const sch = item.school;
        const roleColor = card.role_color || '#1e40af';
        const isHigher = card.is_higher_authority;
        const logoImg = sch?.logo_url ? '<div class="watermark"><img src="' + sch.logo_url + '" alt=""/></div>' : '';
        const headerLogo = sch?.logo_url ? '<div class="header-logo"><img src="' + sch.logo_url + '" alt=""/></div>' : '';
        const cardStyle = 'background:linear-gradient(135deg,' + roleColor + ' 0%,' + roleColor + 'cc 50%,' + roleColor + ' 100%);' + (isHigher ? 'border:2px solid #fbbf24;' : '');
        const cardTypeStyle = isHigher ? 'background:rgba(251,191,36,0.3);border:1px solid rgba(251,191,36,0.5);' : '';
        
        return '<div class="id-card" style="' + cardStyle + '">' + logoImg + 
          '<div class="content"><div class="header">' + headerLogo +
          '<div class="header-text"><div class="school-name">' + (sch?.name || 'School') + '</div>' +
          '<div class="card-type" style="' + cardTypeStyle + '">' + card.card_type + '</div></div></div>' +
          '<div class="body"><div class="photo"><span>Photo</span></div>' +
          '<div class="details"><div class="name">' + card.name + '</div>' +
          '<div class="detail-row"><span class="label">Designation:</span><span class="value">' + card.designation + (card.designation_hindi ? ' / ' + card.designation_hindi : '') + '</span></div>' +
          (card.department ? '<div class="detail-row"><span class="label">Dept:</span><span class="value">' + card.department + '</span></div>' : '') +
          (card.blood_group ? '<div class="detail-row"><span class="label">Blood:</span><span class="value">' + card.blood_group + '</span></div>' : '') +
          (card.phone ? '<div class="contact">📞 ' + card.phone + '</div>' : '') +
          (card.emergency_contact ? '<div class="contact" style="margin-top:1mm">🆘 ' + card.emergency_contact + '</div>' : '') +
          '</div></div><div class="footer">Valid: ' + (card.valid_until || (new Date().getFullYear() + 1)) + '</div></div></div>';
      }).join('');
      
      const pageHtml = '<!DOCTYPE html><html><head><title>Bulk Employee ID Cards</title>' +
        '<style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}' +
        'body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10mm;padding:10mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        '.id-card{width:85.6mm;height:54mm;border-radius:4mm;overflow:hidden;position:relative;color:white;padding:3mm;page-break-inside:avoid}' +
        '.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.15;width:25mm;height:25mm}.watermark img{width:100%;height:100%;object-fit:contain}' +
        '.content{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
        '.header{display:flex;align-items:center;gap:2mm;padding-bottom:2mm;border-bottom:0.3mm solid rgba(255,255,255,0.3);margin-bottom:2mm}' +
        '.header-logo{width:7mm;height:7mm;background:white;border-radius:50%;padding:0.5mm}.header-logo img{width:100%;height:100%;object-fit:contain;border-radius:50%}' +
        '.header-text{flex:1;text-align:center}.school-name{font-size:8pt;font-weight:bold;text-transform:uppercase}' +
        '.card-type{font-size:5pt;background:rgba(255,255,255,0.25);padding:0.5mm 2mm;border-radius:2mm;display:inline-block;margin-top:1mm}' +
        '.body{display:flex;gap:2mm;flex:1}.photo{width:16mm;height:20mm;background:white;border-radius:2mm;display:flex;align-items:center;justify-content:center;color:#999;font-size:6pt}' +
        '.details{flex:1;font-size:6pt}.name{font-size:9pt;font-weight:bold;color:#fef08a;margin-bottom:1mm}' +
        '.detail-row{margin-bottom:0.5mm}.label{opacity:0.8;width:18mm;display:inline-block}.value{font-weight:600}' +
        '.contact{background:rgba(255,255,255,0.2);padding:1mm;border-radius:1mm;margin-top:1mm;font-size:5.5pt}' +
        '.footer{font-size:4pt;opacity:0.8;text-align:right;margin-top:auto}</style></head>' +
        '<body>' + cardsHtml + '<script>window.onload=function(){setTimeout(function(){window.print()},1000)}</script></body></html>';
      
      printWindow.document.write(pageHtml);
      printWindow.document.close();
      toast.success(cardDataList.length + ' ID cards ready to print!');
    } catch (error) {
      toast.error('Error generating bulk ID cards');
    } finally {
      setBulkPrinting(false);
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Employee Management
          </h1>
          <p className="text-gray-500 text-sm">Staff + Users एक जगह manage करें</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleBulkPrintIDCards}
            disabled={bulkPrinting || employees.length === 0}
            className="gap-2"
            data-testid="bulk-print-employee-btn"
          >
            {bulkPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Bulk Print ID Cards
          </Button>
          <Button onClick={openAddForm} className="gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-indigo-600"
                        onClick={() => {
                          setSelectedEmployeeForID(emp);
                          setShowIDCard(true);
                        }}
                        title="Print ID Card"
                      >
                        <CreditCard className="w-4 h-4" />
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
                      {/* Delete Button - Admin/Director only */}
                      {(user?.role === 'director' || user?.role === 'admin') && emp.role !== 'director' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(emp)}
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No employees found. Click &quot;Add Employee&quot; to add one.
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
                <div>
                  <Label>Blood Group</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.blood_group || ''}
                    onChange={e => setFormData(f => ({ ...f, blood_group: e.target.value }))}
                  >
                    <option value="">Select Blood Group</option>
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
                  <Label>Emergency Contact (Family Phone) 🆘</Label>
                  <Input
                    value={formData.emergency_contact || ''}
                    onChange={e => setFormData(f => ({ ...f, emergency_contact: e.target.value }))}
                    placeholder="Family member ka number - ID card pe dikhega"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ye number ID card pe dikhega emergency ke liye</p>
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
                  <Key className="w-4 h-4" /> Role & Login Settings
                </h4>
                
                <div className="space-y-4">
                  {/* Role Selection - Always visible */}
                  <div>
                    <Label>System Role *</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                      value={formData.role}
                      onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                    >
                      <option value="director">Director (निदेशक)</option>
                      <option value="principal">Principal (प्रधानाचार्य)</option>
                      <option value="vice_principal">Vice Principal (उप-प्रधानाचार्य)</option>
                      <option value="teacher">Teacher (शिक्षक)</option>
                      <option value="admin_staff">Admin Staff</option>
                      <option value="accountant">Accountant (लेखाकार)</option>
                      <option value="clerk">Clerk (लिपिक)</option>
                      <option value="librarian">Librarian (पुस्तकालयाध्यक्ष)</option>
                      <option value="peon">Peon (चपरासी)</option>
                      <option value="driver">Driver (चालक)</option>
                      <option value="guard">Guard (सुरक्षा)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Role determines ID card color and permissions</p>
                  </div>
                  
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
                      <div>
                        <Label>Password (Default: Mobile Number)</Label>
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
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          {/* Permission Presets */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">🎯 Quick Permission Presets:</p>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setPermissionPreset(key);
                                    setFormData(f => ({ ...f, custom_permissions: { ...preset.permissions } }));
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                                    permissionPreset === key 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                      : 'bg-white hover:bg-indigo-50 hover:border-indigo-300'
                                  }`}
                                >
                                  <div className="font-medium">{preset.label}</div>
                                  {preset.description && (
                                    <div className={`text-[10px] mt-0.5 ${permissionPreset === key ? 'text-indigo-200' : 'text-gray-400'}`}>
                                      {preset.description}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Individual Permissions */}
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🔐 Individual Permissions (Custom):</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(ALL_PERMISSIONS).map(([key, perm]) => (
                                <label 
                                  key={key} 
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                    formData.custom_permissions?.[key] 
                                      ? 'bg-green-50 border border-green-200' 
                                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.custom_permissions?.[key] || false}
                                    onChange={(e) => {
                                      setPermissionPreset('custom');
                                      setFormData(f => ({
                                        ...f,
                                        custom_permissions: {
                                          ...f.custom_permissions,
                                          [key]: e.target.checked
                                        }
                                      }));
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                                  />
                                  <span className="text-sm">
                                    {perm.icon} {perm.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          {/* Active Permissions Summary */}
                          {formData.custom_permissions && (
                            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                              <p className="text-xs font-medium text-indigo-700 mb-1">
                                ✅ Active Permissions ({Object.values(formData.custom_permissions).filter(Boolean).length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(formData.custom_permissions)
                                  .filter(([_, v]) => v)
                                  .map(([key]) => (
                                    <span key={key} className="px-2 py-0.5 bg-white rounded text-xs text-indigo-600 border border-indigo-200">
                                      {ALL_PERMISSIONS[key]?.icon} {ALL_PERMISSIONS[key]?.label || key}
                                    </span>
                                  ))
                                }
                              </div>
                            </div>
                          )}
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

      {/* Employee ID Card Modal */}
      {showIDCard && selectedEmployeeForID && (
        <EmployeeIDCard 
          employee={selectedEmployeeForID}
          school={school}
          onClose={() => {
            setShowIDCard(false);
            setSelectedEmployeeForID(null);
          }}
        />
      )}
    </div>
  );
}
