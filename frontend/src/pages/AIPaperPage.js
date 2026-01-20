import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, FileText, Loader2, Download, ChevronRight, ChevronLeft, Check, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { BOARDS, BOARD_SUBJECTS, getChapters, BOARD_MARKS_PATTERN } from '../data/boardSyllabus';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIPaperPage() {
  const { t } = useTranslation();
  const { user, schoolId } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [schoolBoard, setSchoolBoard] = useState('CBSE'); // Default, will be fetched
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [marksPattern, setMarksPattern] = useState(BOARD_MARKS_PATTERN.CBSE);

  const [formData, setFormData] = useState({
    subject: '',
    class_name: '',
    selectedChapters: [],
    exam_name: '',
    difficulty: 'medium',
    question_types: ['mcq', 'short'],
    total_marks: 80,
    time_duration: 180,
    language: 'hindi',
    custom_marks: {}
  });

  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // Fetch school's board on mount
  useEffect(() => {
    const fetchSchoolBoard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/school/settings?school_id=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.board) {
          const board = response.data.board.toUpperCase();
          if (board.includes('MP') || board.includes('MPBSE')) {
            setSchoolBoard('MPBSE');
          } else if (board.includes('RBSE') || board.includes('RAJASTHAN')) {
            setSchoolBoard('RBSE');
          } else if (board.includes('NCERT')) {
            setSchoolBoard('NCERT');
          } else {
            setSchoolBoard('CBSE');
          }
        }
      } catch (error) {
        console.log('Using default board: CBSE');
      }
    };
    fetchSchoolBoard();
  }, [schoolId]);

  // Update marks pattern when board changes
  useEffect(() => {
    setMarksPattern(BOARD_MARKS_PATTERN[schoolBoard] || BOARD_MARKS_PATTERN.CBSE);
  }, [schoolBoard]);

  // Update subjects when class changes
  useEffect(() => {
    if (formData.class_name) {
      const subjects = BOARD_SUBJECTS[schoolBoard]?.[formData.class_name] || [];
      setAvailableSubjects(subjects);
      if (!subjects.includes(formData.subject)) {
        setFormData(prev => ({ ...prev, subject: '', selectedChapters: [] }));
        setAvailableChapters([]);
      }
    }
  }, [formData.class_name, schoolBoard]);

  // Get chapters when subject changes
  useEffect(() => {
    if (formData.class_name && formData.subject) {
      const chapters = getChapters(schoolBoard, formData.class_name, formData.subject);
      setAvailableChapters(chapters);
    }
  }, [formData.class_name, formData.subject, schoolBoard]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChapterToggle = (chapterName) => {
    setFormData(prev => {
      const current = prev.selectedChapters;
      if (current.includes(chapterName)) {
        return { ...prev, selectedChapters: current.filter(c => c !== chapterName) };
      } else {
        return { ...prev, selectedChapters: [...current, chapterName] };
      }
    });
  };

  const handleQuestionTypeToggle = (type) => {
    setFormData(prev => {
      const current = prev.question_types;
      if (current.includes(type)) {
        return { ...prev, question_types: current.filter(t => t !== type) };
      } else {
        return { ...prev, question_types: [...current, type] };
      }
    });
  };

  const handleCustomMarksChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      custom_marks: { ...prev.custom_marks, [type]: parseInt(value) || marksPattern[type]?.marks || 1 }
    }));
  };

  const selectAllChapters = () => {
    setFormData(prev => ({
      ...prev,
      selectedChapters: availableChapters.map(ch => ch.name)
    }));
  };

  const clearAllChapters = () => {
    setFormData(prev => ({ ...prev, selectedChapters: [] }));
  };

  const handleGenerate = async () => {
    if (formData.question_types.length === 0) {
      toast.error('कम से कम एक प्रश्न प्रकार चुनें');
      return;
    }
    if (!formData.exam_name) {
      toast.error('परीक्षा का नाम डालें');
      return;
    }
    if (formData.selectedChapters.length === 0) {
      toast.error('कम से कम एक अध्याय चुनें');
      return;
    }

    setLoading(true);
    try {
      const marksConfig = {};
      formData.question_types.forEach(type => {
        marksConfig[type] = formData.custom_marks[type] || marksPattern[type]?.marks || 1;
      });

      const payload = {
        subject: formData.subject,
        class_name: formData.class_name,
        chapter: formData.selectedChapters.join(', '),
        chapters: formData.selectedChapters,
        exam_name: formData.exam_name,
        difficulty: formData.difficulty,
        question_types: formData.question_types,
        total_marks: parseInt(formData.total_marks),
        time_duration: parseInt(formData.time_duration),
        language: formData.language,
        marks_config: marksConfig,
        syllabus_year: '2024-25',
        board: schoolBoard
      };

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/generate-paper`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPaper(response.data);
      setStep(3);
      toast.success('पेपर तैयार है!');
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'पेपर बनाने में समस्या हुई');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const questionTypes = Object.entries(marksPattern).map(([id, data]) => ({
    id,
    label: data.label,
    marks: data.marks,
  }));

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Board Info */}
      <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        <div>
          <p className="font-medium text-indigo-900">
            {BOARDS[schoolBoard]?.name || schoolBoard} - Session 2024-25
          </p>
          <p className="text-sm text-indigo-600">{BOARDS[schoolBoard]?.fullName}</p>
        </div>
        <select
          value={schoolBoard}
          onChange={(e) => setSchoolBoard(e.target.value)}
          className="ml-auto h-9 rounded-lg border border-indigo-300 px-2 text-sm bg-white"
        >
          {Object.entries(BOARDS).map(([key, val]) => (
            <option key={key} value={key}>{val.name}</option>
          ))}
        </select>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">कक्षा (Class) *</Label>
          <select
            name="class_name"
            value={formData.class_name}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-indigo-500"
            data-testid="paper-class-select"
          >
            <option value="">कक्षा चुनें</option>
            {classNames.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">विषय (Subject) *</Label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-indigo-500"
            data-testid="paper-subject-select"
            disabled={!formData.class_name}
          >
            <option value="">{formData.class_name ? 'विषय चुनें' : 'पहले कक्षा चुनें'}</option>
            {availableSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">परीक्षा का नाम (Exam Name) *</Label>
          <Input
            name="exam_name"
            value={formData.exam_name}
            onChange={handleChange}
            placeholder="जैसे: अर्धवार्षिक परीक्षा, Unit Test 1"
            className="h-11"
            data-testid="paper-exam-name-input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">भाषा (Language)</Label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3"
            data-testid="paper-language-select"
          >
            <option value="hindi">हिंदी</option>
            <option value="english">English</option>
            <option value="bilingual">द्विभाषी (Both)</option>
          </select>
        </div>
      </div>

      {/* Chapter Selection */}
      {formData.subject && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">अध्याय चुनें (Select Chapters) *</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllChapters}>
                सभी चुनें
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearAllChapters}>
                Clear
              </Button>
            </div>
          </div>
          
          {availableChapters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
              {availableChapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChapterToggle(ch.name)}
                  className={`p-3 rounded-lg border text-left transition-all text-sm flex items-center gap-2 ${
                    formData.selectedChapters.includes(ch.name)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                  data-testid={`chapter-${idx}`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    formData.selectedChapters.includes(ch.name) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                  }`}>
                    {formData.selectedChapters.includes(ch.name) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="flex-1">{ch.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">
                इस विषय के लिए {schoolBoard} syllabus में अध्याय उपलब्ध नहीं हैं।
              </span>
            </div>
          )}
          
          {formData.selectedChapters.length > 0 && (
            <p className="text-sm text-indigo-600 font-medium">
              ✓ {formData.selectedChapters.length} अध्याय चुने गए
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => setStep(2)}
          disabled={!formData.class_name || !formData.subject || !formData.exam_name || formData.selectedChapters.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="next-step-btn"
        >
          आगे बढ़ें <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Board-specific Question Types */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">प्रश्न प्रकार चुनें ({schoolBoard} Pattern) *</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questionTypes.map(type => (
            <div
              key={type.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.question_types.includes(type.id)
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleQuestionTypeToggle(type.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    formData.question_types.includes(type.id)
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-300'
                  }`}
                  data-testid={`question-type-${type.id}`}
                >
                  {formData.question_types.includes(type.id) && <Check className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1">
                  <p className="font-medium text-sm">{type.label}</p>
                  
                  {formData.question_types.includes(type.id) && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-600">अंक:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.custom_marks[type.id] || type.marks}
                        onChange={(e) => handleCustomMarksChange(type.id, e.target.value)}
                        className="w-16 h-7 text-sm border rounded px-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paper Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">कठिनाई स्तर</Label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3"
          >
            <option value="easy">आसान (Easy)</option>
            <option value="medium">मध्यम (Medium)</option>
            <option value="hard">कठिन (Hard)</option>
            <option value="mixed">मिश्रित (Mixed)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">कुल अंक *</Label>
          <Input
            name="total_marks"
            type="number"
            value={formData.total_marks}
            onChange={handleChange}
            className="h-11"
            data-testid="paper-marks-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">समय (Minutes) *</Label>
          <Input
            name="time_duration"
            type="number"
            value={formData.time_duration}
            onChange={handleChange}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ChevronLeft className="w-5 h-5 mr-2" /> पीछे जाएं
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={loading || formData.question_types.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="generate-paper-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              पेपर बन रहा है...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              पेपर बनाएं
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:p-0" data-testid="paper-preview">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          {paper?.exam_name && (
            <p className="text-lg font-bold text-indigo-700 mb-1">{paper.exam_name}</p>
          )}
          <h2 className="text-2xl font-bold">{paper?.subject} - {paper?.class_name}</h2>
          <p className="text-sm text-slate-500 mt-1">{BOARDS[schoolBoard]?.name} - Session 2024-25</p>
          <div className="flex justify-center gap-8 mt-3 text-sm">
            <span className="font-medium">कुल अंक: {paper?.total_marks}</span>
            <span className="font-medium">समय: {paper?.time_duration} मिनट</span>
          </div>
        </div>

        <div className="mb-6 p-3 bg-slate-50 rounded-lg text-sm">
          <p className="font-medium mb-1">सामान्य निर्देश:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>सभी प्रश्न अनिवार्य हैं।</li>
            <li>प्रत्येक प्रश्न के अंक उसके सामने दिए गए हैं।</li>
            <li>चित्र स्पष्ट और लेबल सहित बनाएं।</li>
          </ul>
        </div>

        <div className="space-y-6">
          {paper?.questions?.map((q, idx) => (
            <div key={idx} className="space-y-2" data-testid={`question-${idx}`}>
              <div className="flex items-start gap-2">
                <span className="font-bold min-w-[40px]">प्र.{idx + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <span className="text-sm text-slate-500 font-medium">[{q.marks} अंक]</span>
                  
                  {q.type === 'diagram' && (
                    <p className="text-sm text-indigo-600 mt-1">📐 चित्र बनाकर समझाइए</p>
                  )}
                </div>
              </div>
              
              {q.options && q.options.length > 0 && (
                <div className="ml-12 space-y-1">
                  {q.options.map((opt, i) => (
                    <p key={i} className="text-slate-700">
                      ({String.fromCharCode(97 + i)}) {opt}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
          <h3 className="text-lg font-bold mb-4">उत्तर कुंजी (Answer Key)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paper?.questions?.map((q, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-indigo-600">प्र.{idx + 1}:</span>
                <p className="text-sm text-slate-700 mt-1">{q.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between print:hidden">
        <Button variant="outline" onClick={() => { setPaper(null); setStep(1); }}>
          नया पेपर बनाएं
        </Button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="w-5 h-5 mr-2" />
          प्रिंट / डाउनलोड
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="ai-paper-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI प्रश्न पत्र जनरेटर</h1>
        <p className="text-slate-500 mt-1">{BOARDS[schoolBoard]?.name} 2024-25 Syllabus के अनुसार</p>
      </div>

      <div className="flex items-center justify-center gap-4 print:hidden">
        {[
          { num: 1, label: 'विषय चुनें' },
          { num: 2, label: 'प्रश्न सेट करें' },
          { num: 3, label: 'पेपर देखें' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className="text-xs mt-1 text-slate-500">{s.label}</span>
            </div>
            {s.num < 3 && <div className={`w-12 h-1 rounded ${step > s.num ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 print:shadow-none print:border-0 print:p-0">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
