import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen, ChevronLeft, ChevronDown, ChevronRight, Loader2,
  CheckCircle, Clock, XCircle, SkipForward, AlertTriangle,
  Save, BookMarked, ListChecks
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const STATUS_CONFIG = {
  completed: { label: 'Taught', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  in_progress: { label: 'Partially Taught', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  skipped: { label: 'Skipped', color: 'bg-red-100 text-red-700 border-red-200', icon: SkipForward },
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: BookOpen },
};

export default function TeachTinoSyllabus({ onBack }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);

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
    setSelectedSubject(null);
    setChapters([]);
    setShowClassPicker(false);
    setLoading(true);
    try {
      const classNum = getClassNum(cls.name || cls.class_name);
      const res = await axios.get(`${API}/syllabus-subjects?class_num=${classNum}&board=NCERT`, { headers: getHeaders() });
      const subjs = res.data?.subjects || [];
      setSubjects(subjs);
    } catch (e) {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const selectSubject = async (subj) => {
    setSelectedSubject(subj);
    setLoading(true);
    try {
      const classNum = getClassNum(selectedClass?.name || selectedClass?.class_name);
      const [chaptersRes, progressRes] = await Promise.allSettled([
        axios.get(`${API}/syllabus-chapters?class_num=${classNum}&subject=${subj.name}&board=NCERT`, { headers: getHeaders() }),
        axios.get(`${API}/syllabus-progress/class/${user?.school_id}/${selectedClass.id}?subject=${subj.name}`, { headers: getHeaders() })
      ]);

      let chapterList = [];
      if (chaptersRes.status === 'fulfilled') {
        chapterList = chaptersRes.value.data?.chapters || [];
      }
      setChapters(chapterList);

      const map = {};
      if (progressRes.status === 'fulfilled') {
        const subjectData = progressRes.value.data?.subjects || [];
        const thisSubject = subjectData.find(s => s.subject === subj.name);
        if (thisSubject) {
          thisSubject.chapters.forEach(ch => {
            map[ch.chapter_number] = {
              status: ch.status,
              topics_covered: ch.topics_covered || [],
              notes: ch.notes || ''
            };
          });
        }
      }
      setProgressMap(map);
    } catch (e) {
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const cycleStatus = (chapterNum) => {
    setProgressMap(prev => {
      const current = prev[chapterNum]?.status || 'not_started';
      const order = ['not_started', 'in_progress', 'completed', 'skipped'];
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      return {
        ...prev,
        [chapterNum]: {
          ...(prev[chapterNum] || {}),
          status: order[nextIdx],
          topics_covered: prev[chapterNum]?.topics_covered || [],
          notes: prev[chapterNum]?.notes || ''
        }
      };
    });
  };

  const saveProgress = async () => {
    if (!selectedClass || !selectedSubject) return;
    setSaving(true);
    try {
      const classNum = getClassNum(selectedClass?.name || selectedClass?.class_name);
      const chaptersToSave = Object.entries(progressMap)
        .filter(([_, data]) => data.status !== 'not_started')
        .map(([chNum, data]) => {
          const chapter = chapters.find(c => (c.chapter_number || c.number) === parseInt(chNum));
          return {
            chapter_number: parseInt(chNum),
            chapter_name: chapter?.name || chapter?.chapter_name || `Chapter ${chNum}`,
            status: data.status,
            topics_covered: data.topics_covered || [],
            notes: data.notes || ''
          };
        });

      for (const ch of chaptersToSave) {
        await axios.post(`${API}/syllabus-progress/update`, {
          school_id: user?.school_id,
          class_id: selectedClass.id,
          class_name: `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ''}`,
          subject: selectedSubject.name,
          board: 'NCERT',
          chapter_number: ch.chapter_number,
          chapter_name: ch.chapter_name,
          status: ch.status,
          topics_covered: ch.topics_covered,
          notes: ch.notes
        }, { headers: getHeaders() });
      }

      toast.success('Syllabus progress saved!');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const total = chapters.length;
    const completed = Object.values(progressMap).filter(p => p.status === 'completed').length;
    const inProgress = Object.values(progressMap).filter(p => p.status === 'in_progress').length;
    const skipped = Object.values(progressMap).filter(p => p.status === 'skipped').length;
    const notStarted = total - completed - inProgress - skipped;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, skipped, notStarted, percent };
  };

  if (loading && !selectedClass) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-bold text-gray-800">Syllabus Tracker</h2>
        <div></div>
      </div>

      <div className="relative">
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

      {selectedClass && subjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Subjects</h3>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subjects.map((subj, idx) => (
              <button
                key={idx}
                onClick={() => selectSubject(subj)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedSubject?.name === subj.name
                    ? 'bg-green-50 border-green-200 ring-1 ring-green-300'
                    : 'bg-gray-50 border-gray-100 hover:bg-green-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-800 truncate">{subj.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{subj.total_chapters || 0} chapters</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedClass && subjects.length === 0 && !loading && (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No subjects found for this class</p>
          <p className="text-xs text-gray-400 mt-1">Syllabus data may not be available yet</p>
        </div>
      )}

      {selectedSubject && chapters.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">{selectedSubject.name} Progress</h3>
              <span className="text-lg font-bold text-green-600">{stats.percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${stats.percent}%` }}></div>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {stats.completed} Taught</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> {stats.inProgress} Partial</span>
              <span className="flex items-center gap-1"><SkipForward className="w-3 h-3 text-red-500" /> {stats.skipped} Skipped</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-gray-400" /> {stats.notStarted} Pending</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Chapters</h3>
              <p className="text-[10px] text-gray-400">Tap status to change</p>
            </div>
            <div className="divide-y divide-gray-50">
              {chapters.map((chapter, idx) => {
                const chNum = chapter.chapter_number || chapter.number || idx + 1;
                const progress = progressMap[chNum] || { status: 'not_started' };
                const statusCfg = STATUS_CONFIG[progress.status] || STATUS_CONFIG.not_started;
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={chNum} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-500">{chNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {chapter.name || chapter.chapter_name || `Chapter ${chNum}`}
                      </p>
                      {chapter.topics && (
                        <p className="text-[10px] text-gray-400 truncate">{Array.isArray(chapter.topics) ? chapter.topics.length : 0} topics</p>
                      )}
                    </div>
                    <button
                      onClick={() => cycleStatus(chNum)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${statusCfg.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={saveProgress}
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Progress</>
            )}
          </Button>
        </>
      )}

      {loading && selectedClass && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      )}
    </div>
  );
}
