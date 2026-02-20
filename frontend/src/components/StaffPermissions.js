import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import {
  Shield, Search, Loader2, Check, RotateCcw, Save,
  ChevronDown, User, Users, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const MODULE_LABELS = {
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  students: { en: 'Students', hi: 'छात्र' },
  staff: { en: 'Staff', hi: 'स्टाफ' },
  classes: { en: 'Classes', hi: 'कक्षाएं' },
  attendance: { en: 'Attendance', hi: 'उपस्थिति' },
  timetable: { en: 'Timetable', hi: 'समय सारणी' },
  exams_reports: { en: 'Exams & Reports', hi: 'परीक्षा और रिपोर्ट' },
  homework: { en: 'Homework', hi: 'होमवर्क' },
  syllabus_tracking: { en: 'Syllabus Tracking', hi: 'पाठ्यक्रम ट्रैकिंग' },
  digital_library: { en: 'Digital Library', hi: 'डिजिटल लाइब्रेरी' },
  live_classes: { en: 'Live Classes', hi: 'लाइव क्लासेस' },
  fee_management: { en: 'Fee Management', hi: 'शुल्क प्रबंधन' },
  admissions: { en: 'Admissions', hi: 'प्रवेश' },
  communication_hub: { en: 'Communication Hub', hi: 'संचार केंद्र' },
  front_office: { en: 'Front Office', hi: 'फ्रंट ऑफिस' },
  transport: { en: 'Transport', hi: 'परिवहन' },
  inventory: { en: 'Inventory', hi: 'इन्वेंटरी' },
  cctv: { en: 'CCTV', hi: 'सीसीटीवी' },
  calendar: { en: 'Calendar', hi: 'कैलेंडर' },
  ai_tools: { en: 'AI Tools', hi: 'AI टूल्स' },
  analytics: { en: 'Analytics', hi: 'एनालिटिक्स' },
  multi_branch: { en: 'Multi-Branch', hi: 'मल्टी-ब्रांच' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  login_credentials: { en: 'Login Credentials', hi: 'लॉगिन क्रेडेंशियल्स' },
  student_leave: { en: 'Student Leave Mgmt', hi: 'छात्र छुट्टी प्रबंधन' },
};

const MODULE_GROUPS = [
  { label: { en: 'Core', hi: 'मुख्य' }, keys: ['dashboard', 'students', 'staff', 'classes'] },
  { label: { en: 'Academics', hi: 'शैक्षणिक' }, keys: ['attendance', 'timetable', 'exams_reports', 'homework', 'syllabus_tracking', 'student_leave'] },
  { label: { en: 'Learning', hi: 'शिक्षण' }, keys: ['digital_library', 'live_classes', 'ai_tools'] },
  { label: { en: 'Administration', hi: 'प्रशासन' }, keys: ['fee_management', 'admissions', 'communication_hub', 'front_office', 'transport', 'inventory'] },
  { label: { en: 'System', hi: 'सिस्टम' }, keys: ['cctv', 'calendar', 'analytics', 'multi_branch', 'settings', 'login_credentials'] },
];

const ROLE_LABELS = {
  teacher: 'Teacher', principal: 'Principal', vice_principal: 'Vice Principal',
  accountant: 'Accountant', clerk: 'Clerk', admin_staff: 'Admin Staff',
  admission_staff: 'Admission Staff', co_director: 'Co-Director'
};

export default function StaffPermissions() {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchStaffPermissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/staff/module-permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(res.data || []);
    } catch (err) {
      toast.error(isHindi ? 'स्टाफ डेटा लोड नहीं हुआ' : 'Failed to load staff data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaffPermissions(); }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q) && !s.role?.toLowerCase().includes(q))
          return false;
      }
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      return true;
    });
  }, [staffList, search, roleFilter]);

  const roles = useMemo(() => {
    const r = new Set(staffList.map(s => s.role));
    return Array.from(r).sort();
  }, [staffList]);

  const selectStaffMember = (staff) => {
    setSelectedStaff(staff);
    setEditedPermissions({ ...staff.module_permissions });
    setHasChanges(false);
  };

  const togglePermission = (key) => {
    setEditedPermissions(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return updated;
    });
  };

  const selectAllInGroup = (keys, value) => {
    setEditedPermissions(prev => {
      const updated = { ...prev };
      keys.forEach(k => { updated[k] = value; });
      setHasChanges(true);
      return updated;
    });
  };

  const savePermissions = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      await axios.put(`${API}/staff/${selectedStaff.id}/module-permissions`, {
        module_permissions: editedPermissions
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${selectedStaff.name} ${isHindi ? 'की परमिशन अपडेट हो गई' : "'s permissions updated"}`);
      setHasChanges(false);
      const updatedList = staffList.map(s =>
        s.id === selectedStaff.id ? { ...s, module_permissions: editedPermissions, is_custom: true } : s
      );
      setStaffList(updatedList);
      setSelectedStaff(prev => ({ ...prev, module_permissions: editedPermissions, is_custom: true }));
    } catch (err) {
      toast.error(isHindi ? 'सेव करने में त्रुटि' : 'Failed to save permissions');
    }
    setSaving(false);
  };

  const resetToDefaults = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      const res = await axios.post(`${API}/staff/${selectedStaff.id}/reset-module-permissions`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const defaultPerms = res.data.module_permissions;
      setEditedPermissions(defaultPerms);
      setHasChanges(false);
      const updatedList = staffList.map(s =>
        s.id === selectedStaff.id ? { ...s, module_permissions: defaultPerms, is_custom: false } : s
      );
      setStaffList(updatedList);
      setSelectedStaff(prev => ({ ...prev, module_permissions: defaultPerms, is_custom: false }));
      toast.success(isHindi ? 'डिफॉल्ट परमिशन लागू हो गई' : 'Reset to default permissions');
    } catch (err) {
      toast.error(isHindi ? 'रीसेट विफल' : 'Failed to reset');
    }
    setSaving(false);
  };

  const enabledCount = Object.values(editedPermissions).filter(Boolean).length;
  const totalCount = Object.keys(editedPermissions).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isHindi ? 'स्टाफ खोजें...' : 'Search staff...'}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all">{isHindi ? 'सभी' : 'All'}</option>
                {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
            {filteredStaff.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {isHindi ? 'कोई स्टाफ नहीं मिला' : 'No staff found'}
              </div>
            ) : (
              filteredStaff.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => selectStaffMember(staff)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                    selectedStaff?.id === staff.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                    {staff.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800 truncate">{staff.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{ROLE_LABELS[staff.role] || staff.role}</span>
                      {staff.is_custom && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          {isHindi ? 'कस्टम' : 'Custom'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:w-2/3">
          {!selectedStaff ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-gray-400">
              <Shield className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium text-gray-500">
                {isHindi ? 'बाईं तरफ से स्टाफ चुनें' : 'Select a staff member from the left'}
              </p>
              <p className="text-sm mt-1">
                {isHindi ? 'उनकी मॉड्यूल परमिशन सेट करें' : 'Configure their module permissions'}
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedStaff.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedStaff.name}</h3>
                    <p className="text-xs text-gray-500">
                      {ROLE_LABELS[selectedStaff.role] || selectedStaff.role} • {selectedStaff.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                    {enabledCount}/{totalCount} {isHindi ? 'मॉड्यूल' : 'modules'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
                {MODULE_GROUPS.map(group => {
                  const allEnabled = group.keys.every(k => editedPermissions[k]);
                  const someEnabled = group.keys.some(k => editedPermissions[k]);
                  return (
                    <div key={group.label.en} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {isHindi ? group.label.hi : group.label.en}
                        </span>
                        <button
                          onClick={() => selectAllInGroup(group.keys, !allEnabled)}
                          className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                            allEnabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : someEnabled
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {allEnabled ? (isHindi ? 'सब हटाएं' : 'Uncheck All') : (isHindi ? 'सब चुनें' : 'Check All')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                        {group.keys.map(key => (
                          <label
                            key={key}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                              editedPermissions[key]
                                ? 'bg-green-50 text-green-800 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!editedPermissions[key]}
                              onChange={() => togglePermission(key)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium truncate">
                              {isHindi ? MODULE_LABELS[key]?.hi : MODULE_LABELS[key]?.en || key}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  disabled={saving}
                  className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isHindi ? 'डिफॉल्ट रीसेट' : 'Reset to Default'}
                </Button>
                <Button
                  size="sm"
                  onClick={savePermissions}
                  disabled={saving || !hasChanges}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isHindi ? 'परमिशन सेव करें' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}