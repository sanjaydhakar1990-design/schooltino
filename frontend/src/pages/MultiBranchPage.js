import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Building, Plus, Users, GraduationCap, Wallet, MapPin, Phone, Mail,
  BarChart3, ArrowUpRight, Edit, Trash2, Globe, Shield, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export default function MultiBranchPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const schoolId = user?.school_id;
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    principal_name: '', phone: '', email: '', code: ''
  });

  useEffect(() => {
    fetchBranches();
  }, [schoolId]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/branches?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data?.branches || []);
    } catch (err) {
      setBranches([{
        id: 'main',
        name: 'Main Campus',
        address: 'Main Branch',
        students: 0,
        staff: 0,
        is_main: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { ...form, school_id: schoolId };
      if (editingBranch) {
        await axios.put(`${API}/branches/${editingBranch.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Branch updated!');
      } else {
        await axios.post(`${API}/branches`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Branch added!');
      }
      setShowAddDialog(false);
      setEditingBranch(null);
      setForm({ name: '', address: '', city: '', state: '', pincode: '', principal_name: '', phone: '', email: '', code: '' });
      fetchBranches();
    } catch (err) {
      toast.error('Failed to save branch');
    }
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      principal_name: branch.principal_name || '',
      phone: branch.phone || '',
      email: branch.email || '',
      code: branch.code || ''
    });
    setShowAddDialog(true);
  };

  const totalStudents = branches.reduce((sum, b) => sum + (b.students || 0), 0);
  const totalStaff = branches.reduce((sum, b) => sum + (b.staff || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            {t('multi_branch')}
          </h1>
          <p className="text-gray-500 mt-1">Unify, monitor, and lead - stay smartly synced</p>
        </div>
        <Button onClick={() => { setEditingBranch(null); setForm({ name: '', address: '', city: '', state: '', pincode: '', principal_name: '', phone: '', email: '', code: '' }); setShowAddDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> {t('add_branch')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">{t('total_branches')}</p>
                <p className="text-3xl font-bold text-blue-900">{branches.length}</p>
              </div>
              <Building className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">{t('total_students')}</p>
                <p className="text-3xl font-bold text-green-900">{totalStudents}</p>
              </div>
              <GraduationCap className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">{t('total_staff')}</p>
                <p className="text-3xl font-bold text-purple-900">{totalStaff}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">{t('active')}</p>
                <p className="text-3xl font-bold text-amber-900">{branches.filter(b => b.is_active !== false).length}</p>
              </div>
              <Shield className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <Card key={branch.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{branch.name}</h3>
                      {branch.is_main && <Badge className="bg-blue-100 text-blue-700 text-[10px]">{t('main_branch')}</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(branch)}>
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
                {branch.address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {branch.address}{branch.city ? `, ${branch.city}` : ''}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{t('students')}</p>
                    <p className="text-lg font-bold text-gray-900">{branch.students || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{t('staff')}</p>
                    <p className="text-lg font-bold text-gray-900">{branch.staff || 0}</p>
                  </div>
                </div>
                {branch.principal_name && (
                  <p className="text-xs text-gray-500 mt-3">Principal: {branch.principal_name}</p>
                )}
                {branch.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {branch.phone}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBranch ? t('edit') : t('add_branch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('branch_name')} *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g., City Center Branch" />
              </div>
              <div>
                <Label>{t('branch_code')}</Label>
                <Input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} placeholder="e.g., BR-001" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} /></div>
              <div><Label>Pincode</Label><Input value={form.pincode} onChange={e => setForm(f => ({...f, pincode: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Principal Name</Label>
              <Input value={form.principal_name} onChange={e => setForm(f => ({...f, principal_name: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              <div><Label>{t('email')}</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">{editingBranch ? t('save') : t('add_branch')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}