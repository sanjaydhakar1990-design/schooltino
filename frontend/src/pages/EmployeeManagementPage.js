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
  IndianRupee, CheckCircle, XCircle, Settings, Eye, EyeOff, CreditCard, Printer,
  FileUp, Heart, Briefcase, GraduationCap, MapPin, User, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import EmployeeIDCard from '../components/EmployeeIDCard';
import BulkImport from '../components/BulkImport';

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
  
  // Form Tab state
  const [activeFormTab, setActiveFormTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    mobile: '',
    email: '',
    designation: 'teacher',
    department: '',
    joining_date: new Date().toISOString().split('T')[0],
    // Personal Info
    gender: 'male',
    dob: '',
    blood_group: '',
    marital_status: '',
    father_name: '',
    spouse_name: '',
    nationality: 'Indian',
    // Address
    address: '',
    permanent_address: '',
    city: '',
    state: '',
    pincode: '',
    // Identity Documents
    aadhar_no: '',
    pan_number: '',
    uan_number: '', // EPF
    esi_number: '',
    voter_id: '',
    driving_license: '',
    // Qualification
    qualification: '',
    specialization: '',
    experience_years: '',
    previous_employer: '',
    // Bank Details
    bank_name: '',
    bank_account_no: '',
    ifsc_code: '',
    bank_branch: '',
    // Salary
    salary: '',
    salary_type: 'monthly', // monthly/daily
    pf_applicable: false,
    esi_applicable: false,
    tds_applicable: false,
    // Contact
    emergency_contact: '',
    emergency_contact_name: '',
    emergency_relation: '',
    // Login
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
        <div className="flex gap-2 flex-wrap">
          {/* Bulk Import Button */}
          <BulkImport 
            type="employee" 
            schoolId={schoolId} 
            onImportComplete={fetchEmployees}
          />
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
          <Button onClick={openAddForm} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-600" />
              {editingEmployee ? '✏️ Edit Employee' : '👤 Add New Employee'}
            </h3>
            
            {/* Form Tabs Navigation */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 overflow-x-auto">
              {[
                { id: 'basic', label: '📋 Basic Info' },
                { id: 'personal', label: '👤 Personal' },
                { id: 'identity', label: '🆔 ID & Docs' },
                { id: 'qualification', label: '🎓 Qualification' },
                { id: 'bank', label: '🏦 Bank & Salary' },
                { id: 'contact', label: '📞 Contact' },
                { id: 'documents', label: '📄 Documents' },
                { id: 'login', label: '🔐 Login Access' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    activeFormTab === tab.id 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Tab 1: Basic Info */}
              {activeFormTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">📋 Basic Information (मूल जानकारी)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Name * (नाम)</Label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full Name"
                        data-testid="employee-name-input"
                      />
                    </div>
                    <div>
                      <Label>Designation * (पदनाम)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.designation}
                        onChange={e => handleDesignationChange(e.target.value)}
                        data-testid="designation-select"
                      >
                        {designations.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Department (विभाग)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.department}
                        onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                      >
                        <option value="">Select Department</option>
                        <option value="Administration">Administration (प्रशासन)</option>
                        <option value="Academic">Academic (शैक्षणिक)</option>
                        <option value="Science">Science (विज्ञान)</option>
                        <option value="Arts">Arts (कला)</option>
                        <option value="Commerce">Commerce (वाणिज्य)</option>
                        <option value="Sports">Sports (खेलकूद)</option>
                        <option value="IT">IT (आईटी)</option>
                        <option value="Accounts">Accounts (लेखा)</option>
                        <option value="Transport">Transport (परिवहन)</option>
                        <option value="Hostel">Hostel (छात्रावास)</option>
                        <option value="Library">Library (पुस्तकालय)</option>
                        <option value="Lab">Lab (प्रयोगशाला)</option>
                        <option value="Other">Other (अन्य)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Mobile * (मोबाइल)</Label>
                      <Input
                        value={formData.mobile}
                        onChange={e => setFormData(f => ({ ...f, mobile: e.target.value }))}
                        placeholder="9876543210"
                        data-testid="employee-mobile-input"
                      />
                    </div>
                    <div>
                      <Label>Email * (ईमेल)</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@school.com"
                        data-testid="employee-email-input"
                      />
                    </div>
                    <div>
                      <Label>Joining Date (नियुक्ति तिथि)</Label>
                      <Input
                        type="date"
                        value={formData.joining_date}
                        onChange={e => setFormData(f => ({ ...f, joining_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Personal Details */}
              {activeFormTab === 'personal' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">👤 Personal Details (व्यक्तिगत जानकारी)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Gender (लिंग)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.gender}
                        onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="male">Male (पुरुष)</option>
                        <option value="female">Female (महिला)</option>
                        <option value="other">Other (अन्य)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Date of Birth (जन्म तिथि)</Label>
                      <Input
                        type="date"
                        value={formData.dob}
                        onChange={e => setFormData(f => ({ ...f, dob: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Blood Group (रक्त समूह)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.blood_group || ''}
                        onChange={e => setFormData(f => ({ ...f, blood_group: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => 
                          <option key={bg} value={bg}>{bg}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <Label>Marital Status (वैवाहिक स्थिति)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.marital_status}
                        onChange={e => setFormData(f => ({ ...f, marital_status: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="Single">Single (अविवाहित)</option>
                        <option value="Married">Married (विवाहित)</option>
                        <option value="Divorced">Divorced (तलाकशुदा)</option>
                        <option value="Widowed">Widowed (विधवा/विधुर)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Father Name (पिता का नाम)</Label>
                      <Input
                        value={formData.father_name}
                        onChange={e => setFormData(f => ({ ...f, father_name: e.target.value }))}
                        placeholder="Father's name"
                      />
                    </div>
                    <div>
                      <Label>Spouse Name (पति/पत्नी का नाम)</Label>
                      <Input
                        value={formData.spouse_name}
                        onChange={e => setFormData(f => ({ ...f, spouse_name: e.target.value }))}
                        placeholder="If married"
                      />
                    </div>
                    <div>
                      <Label>Nationality (राष्ट्रीयता)</Label>
                      <Input
                        value={formData.nationality}
                        onChange={e => setFormData(f => ({ ...f, nationality: e.target.value }))}
                        placeholder="Indian"
                      />
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="border-t pt-4 mt-4">
                    <h5 className="font-medium text-slate-700 mb-3">🏠 Address (पता)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Current Address (वर्तमान पता)</Label>
                        <Input
                          value={formData.address}
                          onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                          placeholder="Full current address"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Permanent Address (स्थायी पता)</Label>
                        <Input
                          value={formData.permanent_address}
                          onChange={e => setFormData(f => ({ ...f, permanent_address: e.target.value }))}
                          placeholder="Full permanent address"
                        />
                      </div>
                      <div>
                        <Label>City (शहर)</Label>
                        <Input
                          value={formData.city}
                          onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>State (राज्य)</Label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 h-10"
                          value={formData.state}
                          onChange={e => setFormData(f => ({ ...f, state: e.target.value }))}
                        >
                          <option value="">Select State</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Bihar">Bihar</option>
                          <option value="Chhattisgarh">Chhattisgarh</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label>Pincode (पिनकोड)</Label>
                        <Input
                          value={formData.pincode}
                          onChange={e => setFormData(f => ({ ...f, pincode: e.target.value }))}
                          placeholder="6 digit pincode"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Identity Documents */}
              {activeFormTab === 'identity' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">🆔 Identity Documents (पहचान दस्तावेज़)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Aadhar Number (आधार नंबर)</Label>
                      <Input
                        value={formData.aadhar_no}
                        onChange={e => setFormData(f => ({ ...f, aadhar_no: e.target.value }))}
                        placeholder="12 digit Aadhar"
                      />
                    </div>
                    <div>
                      <Label>PAN Number (पैन नंबर)</Label>
                      <Input
                        value={formData.pan_number}
                        onChange={e => setFormData(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div>
                      <Label>Voter ID (मतदाता पहचान पत्र)</Label>
                      <Input
                        value={formData.voter_id}
                        onChange={e => setFormData(f => ({ ...f, voter_id: e.target.value }))}
                        placeholder="Voter ID number"
                      />
                    </div>
                    <div>
                      <Label>Driving License (ड्राइविंग लाइसेंस)</Label>
                      <Input
                        value={formData.driving_license}
                        onChange={e => setFormData(f => ({ ...f, driving_license: e.target.value }))}
                        placeholder="DL number"
                      />
                    </div>
                    <div>
                      <Label>UAN Number (EPF)</Label>
                      <Input
                        value={formData.uan_number}
                        onChange={e => setFormData(f => ({ ...f, uan_number: e.target.value }))}
                        placeholder="Universal Account Number"
                      />
                    </div>
                    <div>
                      <Label>ESI Number (ESI नंबर)</Label>
                      <Input
                        value={formData.esi_number}
                        onChange={e => setFormData(f => ({ ...f, esi_number: e.target.value }))}
                        placeholder="ESI number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Qualification */}
              {activeFormTab === 'qualification' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">🎓 Qualification & Experience (योग्यता और अनुभव)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Highest Qualification (उच्चतम योग्यता)</Label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 h-10"
                        value={formData.qualification}
                        onChange={e => setFormData(f => ({ ...f, qualification: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="10th Pass">10th Pass (दसवीं पास)</option>
                        <option value="12th Pass">12th Pass (बारहवीं पास)</option>
                        <option value="Graduate">Graduate (स्नातक)</option>
                        <option value="Post Graduate">Post Graduate (स्नातकोत्तर)</option>
                        <option value="B.Ed">B.Ed</option>
                        <option value="M.Ed">M.Ed</option>
                        <option value="PhD">PhD</option>
                        <option value="ITI">ITI</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Specialization (विशेषज्ञता)</Label>
                      <Input
                        value={formData.specialization}
                        onChange={e => setFormData(f => ({ ...f, specialization: e.target.value }))}
                        placeholder="e.g., Mathematics, Physics, Hindi"
                      />
                    </div>
                    <div>
                      <Label>Total Experience (Years) (कुल अनुभव वर्ष)</Label>
                      <Input
                        type="number"
                        value={formData.experience_years}
                        onChange={e => setFormData(f => ({ ...f, experience_years: e.target.value }))}
                        placeholder="Years of experience"
                      />
                    </div>
                    <div>
                      <Label>Previous Employer (पिछला नियोक्ता)</Label>
                      <Input
                        value={formData.previous_employer}
                        onChange={e => setFormData(f => ({ ...f, previous_employer: e.target.value }))}
                        placeholder="Previous school/company name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Bank & Salary */}
              {activeFormTab === 'bank' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">🏦 Bank & Salary Details (बैंक और वेतन)</h4>
                  
                  {/* Salary Section */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-3">💰 Salary Details (वेतन विवरण)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Monthly Salary (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salary}
                          onChange={e => setFormData(f => ({ ...f, salary: e.target.value }))}
                          placeholder="25000"
                        />
                      </div>
                      <div>
                        <Label>Salary Type</Label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 h-10"
                          value={formData.salary_type}
                          onChange={e => setFormData(f => ({ ...f, salary_type: e.target.value }))}
                        >
                          <option value="monthly">Monthly (मासिक)</option>
                          <option value="daily">Daily (दैनिक)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.pf_applicable}
                          onChange={e => setFormData(f => ({ ...f, pf_applicable: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        PF Applicable (PF लागू)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.esi_applicable}
                          onChange={e => setFormData(f => ({ ...f, esi_applicable: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        ESI Applicable (ESI लागू)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.tds_applicable}
                          onChange={e => setFormData(f => ({ ...f, tds_applicable: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        TDS Applicable (TDS लागू)
                      </label>
                    </div>
                  </div>
                  
                  {/* Bank Section */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-3">🏦 Bank Details (बैंक विवरण)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={formData.bank_name}
                          onChange={e => setFormData(f => ({ ...f, bank_name: e.target.value }))}
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={formData.bank_account_no}
                          onChange={e => setFormData(f => ({ ...f, bank_account_no: e.target.value }))}
                          placeholder="Account number"
                        />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input
                          value={formData.ifsc_code}
                          onChange={e => setFormData(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))}
                          placeholder="SBIN0001234"
                        />
                      </div>
                      <div>
                        <Label>Branch Name</Label>
                        <Input
                          value={formData.bank_branch}
                          onChange={e => setFormData(f => ({ ...f, bank_branch: e.target.value }))}
                          placeholder="Branch name"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Contact */}
              {activeFormTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">📞 Emergency Contact (आपातकालीन संपर्क)</h4>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 mb-3">🆘 Emergency contact ID card पर भी दिखेगा</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Emergency Contact Name</Label>
                        <Input
                          value={formData.emergency_contact_name}
                          onChange={e => setFormData(f => ({ ...f, emergency_contact_name: e.target.value }))}
                          placeholder="Family member name"
                        />
                      </div>
                      <div>
                        <Label>Emergency Contact Number</Label>
                        <Input
                          value={formData.emergency_contact || ''}
                          onChange={e => setFormData(f => ({ ...f, emergency_contact: e.target.value }))}
                          placeholder="10 digit mobile"
                        />
                      </div>
                      <div>
                        <Label>Relation (रिश्ता)</Label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 h-10"
                          value={formData.emergency_relation}
                          onChange={e => setFormData(f => ({ ...f, emergency_relation: e.target.value }))}
                        >
                          <option value="">Select</option>
                          <option value="Spouse">Spouse (पति/पत्नी)</option>
                          <option value="Father">Father (पिता)</option>
                          <option value="Mother">Mother (माता)</option>
                          <option value="Brother">Brother (भाई)</option>
                          <option value="Sister">Sister (बहन)</option>
                          <option value="Son">Son (पुत्र)</option>
                          <option value="Daughter">Daughter (पुत्री)</option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Documents Upload */}
              {activeFormTab === 'documents' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">📄 Documents Upload (दस्तावेज़ अपलोड)</h4>
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    💡 Employee documents payroll और verification के लिए जरूरी हैं।
                  </p>
                  
                  {editingEmployee ? (
                    <DocumentUpload 
                      personId={editingEmployee.id}
                      personType="employee"
                      schoolId={schoolId}
                      existingDocuments={[]}
                    />
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">📁</div>
                      <h4 className="font-medium text-blue-800 mb-2">Documents बाद में Upload करें</h4>
                      <p className="text-sm text-blue-600">
                        Employee add होने के बाद Edit करके documents upload कर सकते हैं।
                      </p>
                    </div>
                  )}
                  
                  {/* Document Checklist */}
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-slate-700 mb-3">📋 Required Documents Checklist:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { icon: '🆔', name: 'Aadhar Card (आधार कार्ड)' },
                        { icon: '💳', name: 'PAN Card (पैन कार्ड)' },
                        { icon: '📄', name: 'Resume/CV (बायोडाटा)' },
                        { icon: '📷', name: 'Passport Photo' },
                        { icon: '🎓', name: 'Degree Certificate' },
                        { icon: '📋', name: 'Experience Letter' },
                        { icon: '📝', name: 'Relieving Letter' },
                        { icon: '🚔', name: 'Police Verification' },
                        { icon: '🏥', name: 'Medical Certificate' },
                        { icon: '🏦', name: 'Bank Account Details' },
                        { icon: '🏠', name: 'Address Proof' },
                        { icon: '📁', name: 'Other Documents' },
                      ].map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded">
                          <span>{doc.icon}</span>
                          <span className="text-slate-600">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 8: Login Access */}
              {activeFormTab === 'login' && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-semibold text-slate-800 border-b pb-2">🔐 Login Access (लॉगिन एक्सेस)</h4>
                  
                  {/* Role Selection */}
                  <div>
                    <Label>System Role * (सिस्टम भूमिका)</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 h-10 bg-white"
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
                                  type="button"
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
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Individual Permissions */}
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🔐 Individual Permissions:</p>
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
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit} disabled={saving}>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deleteEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
              <Trash2 className="w-6 h-6" />
              ⚠️ DANGER: Permanent Delete
            </h3>
            
            {/* Risk Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-bold text-red-800 mb-2">🚨 महत्वपूर्ण चेतावनी:</h4>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>यह action UNDO नहीं किया जा सकता</li>
                <li>Employee का सारा data हमेशा के लिए delete हो जाएगा</li>
                <li>Salary records, Attendance, Leave records सब delete हो जाएंगे</li>
                <li>Login access भी permanently remove हो जाएगा</li>
              </ul>
            </div>
            
            {/* Employee Info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-lg">{deleteEmployee.name}</p>
              <p className="text-sm text-slate-500">
                {deleteEmployee.designation} • {deleteEmployee.department || 'General'}
              </p>
              <p className="text-sm text-slate-500">
                📞 {deleteEmployee.mobile}
              </p>
            </div>
            
            {/* Confirmation Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-slate-700">
                Confirm करने के लिए <span className="text-red-600 font-bold">DELETE</span> type करें:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE here"
                className="border-red-200 focus:border-red-400"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel (रद्द करें)
              </Button>
              <Button 
                onClick={handleDeleteEmployee}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
