import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import {
  ChevronLeft, ChevronDown, Loader2, Clipboard, Plus,
  Calendar, BookOpen, Send, X, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function TeachTinoHomework({ onBack }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [form, setForm] = useState({
    subject: '', description: '', due_date: '', chapter: '', topic: ''
  });

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher/my-classes`, { headers: getHeaders() });
      const cls = Array.isArray(res.data) ? res.data : [];
      setClasses(cls);
      if (cls.length === 1) selectClass(cls[0]);
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const getClassNum = (className) => {
    if (!className) return '1';
    const match = className.match(/(\d+)/);
    return match ? match[1] : '1';
  };

  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setShowClassPicker(false);
    setLoading(true);
    try {
      const [hwRes, subjRes] = await Promise.allSettled([
        axios.get(`${API}/homework?class_id=${cls.id}`, { headers: getHeaders() }),
        axios.get(`${API}/syllabus-subjects?class_num=${getClassNum(cls.name)}&board=NCERT`, { headers: getHeaders() })
      ]);
      if (hwRes.status === 'fulfilled') {
        setHomeworkList(Array.isArray(hwRes.value.data) ? hwRes.value.data : []);
      }
      if (subjRes.status === 'fulfilled') {
        setSubjects(subjRes.value.data?.subjects || []);
      }
    } catch (e) {
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subject) => {
    if (!selectedClass || !subject) return;
    try {
      const classNum = getClassNum(selectedClass.name);
      const res = await axios.get(`${API}/syllabus-chapters?class_num=${classNum}&subject=${subject}&board=NCERT`, { headers: getHeaders() });
      setChapters(res.data?.chapters || []);
    } catch (e) {
      setChapters([]);
    }
  };

  const handleSubjectChange = (subject) => {
    setForm(prev => ({ ...prev, subject, chapter: '', topic: '' }));
    loadChapters(subject);
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.description) {
      toast.error('Please fill subject and description');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/homework`, {
        school_id: user?.school_id,
        class_id: selectedClass.id,
        subject: form.subject,
        description: form.description,
        due_date: form.due_date || null,
        assigned_by: user?.name || user?.id,
        assigned_date: new Date().toISOString().split('T')[0],
        chapter: form.chapter || null,
        topic: form.topic || null,
        board: 'NCERT'
      }, { headers: getHeaders() });

      toast.success('Homework assigned!');
      setShowForm(false);
      setForm({ subject: '', description: '', due_date: '', chapter: '', topic: '' });
      selectClass(selectedClass);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to assign homework');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedClass) {
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
        <h2 className="text-base font-bold text-gray-800">Homework</h2>
        <div></div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <button
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between"
          >
            <span className={selectedClass ? 'text-gray-800 font-medium' : 'text-gray-400'}>
              {selectedClass ? `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ''}` : 'Select Class'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showClassPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {classes.map(cls => (
                <button key={cls.id} onClick={() => selectClass(cls)} className="w-full p-2.5 text-left text-sm hover:bg-green-50 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-800">{cls.name}</span>
                  {cls.section && <span className="text-gray-400 ml-1">- {cls.section}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedClass && (
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-1">
            <Plus className="w-4 h-4" /> Assign
          </Button>
        )}
      </div>

      {showForm && selectedClass && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">New Homework</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject *</label>
            <select
              value={form.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select Subject</option>
              {subjects.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {chapters.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Chapter (Optional)</label>
              <select
                value={form.chapter}
                onChange={(e) => setForm(prev => ({ ...prev, chapter: e.target.value }))}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select Chapter</option>
                {chapters.map((ch, i) => (
                  <option key={i} value={ch.name || ch.chapter_name}>
                    Ch {ch.chapter_number || ch.number || i + 1}: {ch.name || ch.chapter_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Topic (Optional)</label>
            <input
              value={form.topic}
              onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Enter topic name"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe the homework..."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {submitting ? 'Assigning...' : 'Assign Homework'}
          </Button>
        </div>
      )}

      {selectedClass && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Assigned Homework ({homeworkList.length})
            </h3>
          </div>
          {homeworkList.length === 0 ? (
            <div className="p-8 text-center">
              <Clipboard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No homework assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap "Assign" to create homework</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[50vh] overflow-y-auto">
              {homeworkList.map((hw) => (
                <div key={hw.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{hw.subject}</span>
                        {hw.chapter && <span className="text-[10px] text-gray-400">{hw.chapter}</span>}
                      </div>
                      <p className="text-sm text-gray-800">{hw.description}</p>
                      {hw.topic && <p className="text-[10px] text-gray-500 mt-0.5">Topic: {hw.topic}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {hw.due_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{hw.due_date}</span>
                        </div>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                        hw.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {hw.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
