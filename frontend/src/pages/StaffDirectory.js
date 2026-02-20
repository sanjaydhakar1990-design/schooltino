import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Users, Phone, Mail, MapPin, Search, User, 
  Building2, GraduationCap, Shield, Briefcase,
  ArrowLeft, Loader2, School
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

export default function StaffDirectory() {
  const { user, token, schoolId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [school, setSchool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const userRole = user?.role || 'student';
  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher';
  const isAdmin = ['director', 'principal', 'vice_principal', 'admin'].includes(userRole);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch school details
      try {
        const schoolRes = await fetch(`${API}/api/schools/${schoolId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchool(schoolData);
        }
      } catch (e) {
        console.log('School fetch error');
      }

      // Fetch staff (only if not student)
      if (!isStudent) {
        try {
          const staffRes = await fetch(`${API}/api/staff?school_id=${schoolId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaff(staffData.staff || staffData || []);
          }
        } catch (e) {
          // Try users endpoint
          const usersRes = await fetch(`${API}/api/users/school/${schoolId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setStaff(usersData.users || usersData || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'director': return Shield;
      case 'principal': return GraduationCap;
      case 'vice_principal': return GraduationCap;
      case 'teacher': return User;
      case 'accountant': return Briefcase;
      default: return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-700';
      case 'principal': return 'bg-blue-100 text-blue-700';
      case 'vice_principal': return 'bg-indigo-100 text-indigo-700';
      case 'teacher': return 'bg-green-100 text-green-700';
      case 'accountant': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'director': 'Director',
      'principal': 'Principal',
      'vice_principal': 'Vice Principal',
      'co_director': 'Co-Director',
      'teacher': 'Teacher',
      'accountant': 'Accountant',
      'admission_staff': 'Admission',
      'clerk': 'Clerk',
      'staff': 'Staff'
    };
    return labels[role] || role;
  };

  // Filter staff based on search and role
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || s.role === selectedRole;
    
    // Teachers can't see other teachers' personal contact (optional - can remove this)
    // if (isTeacher && s.role === 'teacher') return false;
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const availableRoles = [...new Set(staff.map(s => s.role))];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="staff-directory">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                {isStudent ? 'School Contact' : 'Staff Directory'}
              </h1>
              <p className="text-indigo-200 text-sm">
                {isStudent ? 'School se contact karein' : 'School ke sabhi staff members'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* School Contact Card - Always Visible */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <School className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {school?.name || 'School Name'}
                </h2>
                
                <div className="mt-3 space-y-2">
                  {school?.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm">{school.address}</span>
                    </div>
                  )}
                  
                  {school?.phone && (
                    <a 
                      href={`tel:${school.phone}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-indigo-600"
                    >
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{school.phone}</span>
                    </a>
                  )}
                  
                  {school?.email && (
                    <a 
                      href={`mailto:${school.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-indigo-600"
                    >
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{school.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff List - Hidden for Students */}
        {!isStudent && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 px-3 bg-white"
              >
                <option value="all">All Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{getRoleLabel(role)}</option>
                ))}
              </select>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member, idx) => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Photo */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.photo_url ? (
                            <img 
                              src={member.photo_url} 
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {member.name}
                          </h3>
                          
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(member.role)}`}>
                            <RoleIcon className="w-3 h-3" />
                            {getRoleLabel(member.role)}
                          </span>
                          
                          {/* Contact - Visible for Admin, Limited for Teachers */}
                          <div className="mt-2 space-y-1">
                            {(isAdmin || (isTeacher && member.role !== 'teacher')) && member.mobile && (
                              <a 
                                href={`tel:${member.mobile}`}
                                className="flex items-center gap-2 text-xs text-slate-600 hover:text-green-600"
                              >
                                <Phone className="w-3 h-3" />
                                {member.mobile}
                              </a>
                            )}
                            
                            {isAdmin && member.email && (
                              <a 
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 truncate"
                              >
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No staff members found</p>
              </div>
            )}
          </>
        )}

        {/* Student View - Only School Contact */}
        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Quick Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Kisi bhi query ke liye school se contact karein:
              </p>
              
              {school?.phone && (
                <a 
                  href={`tel:${school.phone}`}
                  className="flex items-center justify-center gap-2 w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl text-green-700 font-medium"
                >
                  <Phone className="w-5 h-5" />
                  Call School: {school.phone}
                </a>
              )}
              
              {school?.email && (
                <a 
                  href={`mailto:${school.email}`}
                  className="flex items-center justify-center gap-2 w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 font-medium"
                >
                  <Mail className="w-5 h-5" />
                  Email: {school.email}
                </a>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500 text-center">
                  Office Hours: Monday - Saturday, 8:00 AM - 4:00 PM
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}