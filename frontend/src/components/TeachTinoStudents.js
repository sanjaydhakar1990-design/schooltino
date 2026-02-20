import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronDown, Loader2, Users, Search,
  Phone, User, GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function TeachTinoStudents({ onBack }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showClassFilter, setShowClassFilter] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-students`, { headers: getHeaders() });
      setStudents(res.data?.students || []);
      setClasses(res.data?.classes || []);
    } catch (e) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'all' || s.class_id === selectedClassId;
    const matchSearch = !search || 
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  const selectedClassName = selectedClassId === 'all' 
    ? `All Classes (${students.length})` 
    : (() => {
        const cls = classes.find(c => c.id === selectedClassId);
        return cls ? `${cls.name}${cls.section ? ' - ' + cls.section : ''} (${cls.student_count || 0})` : 'Unknown';
      })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-bold text-gray-800">My Students</h2>
        <div></div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowClassFilter(!showClassFilter)}
            className="p-2.5 bg-white border border-gray-200 rounded-lg text-sm flex items-center gap-1"
          >
            <Users className="w-4 h-4 text-gray-500" />
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          {showClassFilter && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              <button
                onClick={() => { setSelectedClassId('all'); setShowClassFilter(false); }}
                className={`w-full p-2.5 text-left text-sm hover:bg-green-50 border-b border-gray-50 ${selectedClassId === 'all' ? 'bg-green-50 font-medium' : ''}`}
              >
                All Classes ({students.length})
              </button>
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); setShowClassFilter(false); }}
                  className={`w-full p-2.5 text-left text-sm hover:bg-green-50 border-b border-gray-50 last:border-0 ${selectedClassId === cls.id ? 'bg-green-50 font-medium' : ''}`}
                >
                  {cls.name}{cls.section ? ` - ${cls.section}` : ''} ({cls.student_count || 0})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Users className="w-3 h-3" /> {selectedClassName} - {filteredStudents.length} students
      </div>

      {filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50 max-h-[65vh] overflow-y-auto">
            {filteredStudents.map((student, idx) => {
              const isExpanded = expandedStudent === student.id;
              return (
                <div key={student.id}>
                  <div 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                  >
                    <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{student.student_id || ''}</span>
                        {student.class_name && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {student.class_name}{student.class_section ? ` ${student.class_section}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {student.roll_number && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Roll #{student.roll_number}</span>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-3 pl-20">
                      <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                        {student.father_name && (
                          <div>
                            <span className="text-gray-400">Father:</span>
                            <span className="text-gray-700 ml-1">{student.father_name}</span>
                          </div>
                        )}
                        {student.mother_name && (
                          <div>
                            <span className="text-gray-400">Mother:</span>
                            <span className="text-gray-700 ml-1">{student.mother_name}</span>
                          </div>
                        )}
                        {(student.contact || student.phone || student.parent_phone) && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{student.contact || student.phone || student.parent_phone}</span>
                          </div>
                        )}
                        {student.gender && (
                          <div>
                            <span className="text-gray-400">Gender:</span>
                            <span className="text-gray-700 ml-1 capitalize">{student.gender}</span>
                          </div>
                        )}
                        {student.date_of_birth && (
                          <div>
                            <span className="text-gray-400">DOB:</span>
                            <span className="text-gray-700 ml-1">{student.date_of_birth}</span>
                          </div>
                        )}
                        {student.admission_date && (
                          <div>
                            <span className="text-gray-400">Admitted:</span>
                            <span className="text-gray-700 ml-1">{student.admission_date}</span>
                          </div>
                        )}
                        {student.address && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Address:</span>
                            <span className="text-gray-700 ml-1">{student.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {search ? 'No students match your search' : 'No students found'}
          </p>
        </div>
      )}
    </div>
  );
}
