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
import { Plus, Search, Edit, Trash2, Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StaffPage() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    designation: 'Teacher',
    department: '',
    qualification: '',
    joining_date: '',
    mobile: '',
    email: '',
    address: '',
    salary: ''
  });

  const designations = ['Teacher', 'Principal', 'Vice Principal', 'Accountant', 'Librarian', 'Clerk', 'Peon', 'Driver', 'Guard'];

  useEffect(() => {
    if (schoolId) {
      fetchStaff();
    }
  }, [schoolId, search, selectedDesignation]);

  const fetchStaff = async () => {
    try {
      let url = `${API}/staff?school_id=${schoolId}`;
      if (search) url += `&search=${search}`;
      if (selectedDesignation) url += `&designation=${selectedDesignation}`;
      const response = await axios.get(url);
      setStaff(response.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { 
        ...formData, 
        school_id: schoolId,
        salary: formData.salary ? parseFloat(formData.salary) : null
      };
      
      if (editingStaff) {
        await axios.put(`${API}/staff/${editingStaff.id}`, payload);
        toast.success(t('saved_successfully'));
      } else {
        await axios.post(`${API}/staff`, payload);
        toast.success(t('saved_successfully'));
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : t('something_went_wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      employee_id: member.employee_id,
      designation: member.designation,
      department: member.department || '',
      qualification: member.qualification,
      joining_date: member.joining_date,
      mobile: member.mobile,
      email: member.email,
      address: member.address,
      salary: member.salary || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    
    try {
      await axios.delete(`${API}/staff/${id}`);
      toast.success(t('deleted_successfully'));
      fetchStaff();
    } catch (error) {
      toast.error(t('something_went_wrong'));
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      employee_id: '',
      designation: 'Teacher',
      department: '',
      qualification: '',
      joining_date: '',
      mobile: '',
      email: '',
      address: '',
      salary: ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="staff-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{t('staff')}</h1>
          <p className="text-slate-500 mt-1">Manage staff and teachers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-staff-btn">
              <Plus className="w-5 h-5 mr-2" />
              {t('add_staff')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? t('edit') : t('add_staff')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="staff-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('employee_id')} *</Label>
                  <Input
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                    data-testid="employee-id-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('designation')} *</Label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-lg border border-slate-200 px-3"
                    data-testid="designation-select"
                  >
                    {designations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('department')}</Label>
                  <Input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Science, Arts"
                    data-testid="department-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('qualification')} *</Label>
                  <Input
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    required
                    placeholder="e.g., B.Ed, M.A."
                    data-testid="qualification-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('joining_date')} *</Label>
                  <Input
                    name="joining_date"
                    type="date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    required
                    data-testid="joining-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('mobile')} *</Label>
                  <Input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    data-testid="staff-mobile-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('email')} *</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="staff-email-input"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t('address')} *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    data-testid="staff-address-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('salary')}</Label>
                  <Input
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="Monthly salary"
                    data-testid="salary-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" className="btn-primary" disabled={submitting} data-testid="save-staff-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="staff-search-input"
          />
        </div>
        <select
          value={selectedDesignation}
          onChange={(e) => setSelectedDesignation(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 min-w-[150px]"
          data-testid="filter-designation"
        >
          <option value="">All Designations</option>
          {designations.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-10 h-10" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{t('no_data')}</p>
        </div>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee_id')}</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>{t('designation')}</TableHead>
                <TableHead>{t('qualification')}</TableHead>
                <TableHead>{t('mobile')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id} data-testid={`staff-row-${member.id}`}>
                  <TableCell className="font-mono text-sm">{member.employee_id}</TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <span className="badge badge-info">{member.designation}</span>
                  </TableCell>
                  <TableCell>{member.qualification}</TableCell>
                  <TableCell>{member.mobile}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        data-testid={`edit-staff-${member.id}`}
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        data-testid={`delete-staff-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
