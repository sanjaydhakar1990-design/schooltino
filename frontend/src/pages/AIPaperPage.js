import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, FileText, Loader2, Download, ChevronRight, ChevronLeft, Check, AlertCircle, BookOpen, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { BOARDS, BOARD_SUBJECTS, getChapters, BOARD_MARKS_PATTERN } from '../data/boardSyllabus';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Language-specific text
const LANG_TEXT = {
  hindi: {
    questionPrefix: 'प्र.',
    marks: 'अंक',
    totalMarks: 'पूर्णांक',
    time: 'समय',
    minutes: 'मिनट',
    instructions: 'सामान्य निर्देश',
    inst1: 'सभी प्रश्न अनिवार्य हैं।',
    inst2: 'प्रत्येक प्रश्न के अंक उसके सामने दिए गए हैं।',
    inst3: 'चित्र स्पष्ट और लेबल सहित बनाएं।',
    answerKey: 'उत्तर कुंजी',
    drawDiagram: '(चित्र सहित उत्तर दीजिए)',
    diagramAnswer: 'चित्र विवरण:',
  },
  english: {
    questionPrefix: 'Q.',
    marks: 'Marks',
    totalMarks: 'Total Marks',
    time: 'Time',
    minutes: 'Minutes',
    instructions: 'General Instructions',
    inst1: 'All questions are compulsory.',
    inst2: 'Marks for each question are indicated against it.',
    inst3: 'Draw neat and labeled diagrams wherever required.',
    answerKey: 'Answer Key',
    drawDiagram: '(Answer with diagram)',
    diagramAnswer: 'Diagram Description:',
  }
};

export default function AIPaperPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const { language: appLanguage } = useLanguage(); // Get app language from header toggle
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [schoolBoard, setSchoolBoard] = useState('CBSE');
  const [useNcertSyllabus, setUseNcertSyllabus] = useState(true); // Dual board support
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
    language: 'hindi', // Paper language (separate from app UI language)
    custom_marks: {},
    syllabus_source: 'auto' // 'auto', 'ncert', 'state_board'
  });

  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // UI text based on app language (header toggle)
  const isAppHindi = appLanguage === 'hi' || i18n.language === 'hi';
  
  // Get current paper language text
  const langText = LANG_TEXT[formData.language] || LANG_TEXT.hindi;

  // Fetch school's board on mount
  useEffect(() => {
    const fetchSchoolBoard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/school/settings?school_id=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          // Check for dual board system
          const primaryBoard = response.data.primary_board || response.data.board;
          const useNcert = response.data.use_ncert_syllabus !== false; // Default true
          
          if (primaryBoard) {
            const board = primaryBoard.toUpperCase();
            if (board.includes('MP') || board.includes('MPBSE')) setSchoolBoard('MPBSE');
            else if (board.includes('RBSE') || board.includes('RAJASTHAN')) setSchoolBoard('RBSE');
            else if (board.includes('NCERT')) setSchoolBoard('NCERT');
            else setSchoolBoard('CBSE');
          }
          setUseNcertSyllabus(useNcert);
        }
      } catch (error) {
        console.log('Using default board: CBSE with NCERT');
      }
    };
    fetchSchoolBoard();
  }, [schoolId]);

  useEffect(() => {
    setMarksPattern(BOARD_MARKS_PATTERN[schoolBoard] || BOARD_MARKS_PATTERN.CBSE);
  }, [schoolBoard]);

  useEffect(() => {
    if (formData.class_name) {
      // Get subjects from primary board
      let subjects = BOARD_SUBJECTS[schoolBoard]?.[formData.class_name] || [];
      
      // If using NCERT syllabus, merge with NCERT subjects
      if (useNcertSyllabus && schoolBoard !== 'NCERT') {
        const ncertSubjects = BOARD_SUBJECTS['NCERT']?.[formData.class_name] || 
                              BOARD_SUBJECTS['CBSE']?.[formData.class_name] || [];
        // Merge unique subjects (state board subjects + NCERT core subjects)
        const allSubjects = [...new Set([...subjects, ...ncertSubjects])];
        subjects = allSubjects;
      }
      
      setAvailableSubjects(subjects);
      if (!subjects.includes(formData.subject)) {
        setFormData(prev => ({ ...prev, subject: '', selectedChapters: [] }));
        setAvailableChapters([]);
      }
    }
  }, [formData.class_name, schoolBoard, useNcertSyllabus]);

  useEffect(() => {
    if (formData.class_name && formData.subject) {
      // Determine which board's chapters to use
      let chapters = [];
      
      // Check if this is a core subject that typically follows NCERT
      const ncertCoreSubjects = ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'EVS', 
                                  'हिंदी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'पर्यावरण'];
      const isNcertSubject = ncertCoreSubjects.some(s => 
        formData.subject.toLowerCase().includes(s.toLowerCase()) || 
        s.toLowerCase().includes(formData.subject.toLowerCase())
      );
      
      // Get chapters based on syllabus source selection or auto-detect
      if (formData.syllabus_source === 'ncert' || (formData.syllabus_source === 'auto' && useNcertSyllabus && isNcertSubject)) {
        // Use NCERT chapters for core subjects
        chapters = getChapters('NCERT', formData.class_name, formData.subject);
        if (chapters.length === 0) {
          chapters = getChapters('CBSE', formData.class_name, formData.subject);
        }
      }
      
      // If no NCERT chapters or using state board
      if (chapters.length === 0 || formData.syllabus_source === 'state_board') {
        chapters = getChapters(schoolBoard, formData.class_name, formData.subject);
      }
      
      // Fallback to CBSE if nothing found
      if (chapters.length === 0) {
        chapters = getChapters('CBSE', formData.class_name, formData.subject);
      }
      
      setAvailableChapters(chapters);
    }
  }, [formData.class_name, formData.subject, formData.syllabus_source, schoolBoard, useNcertSyllabus]);

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
        language: formData.language, // Pass selected language
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
      {/* Board Info with Dual Board Support */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <div className="flex-1">
            <p className="font-medium text-indigo-900">
              {BOARDS[schoolBoard]?.name || schoolBoard} - {isAppHindi ? 'सत्र' : 'Session'} 2024-25
            </p>
            <p className="text-sm text-indigo-600">
              {useNcertSyllabus && schoolBoard !== 'NCERT' ? 
                `${schoolBoard} + NCERT ${isAppHindi ? 'संयुक्त पाठ्यक्रम' : 'Combined Syllabus'}` : 
                BOARDS[schoolBoard]?.fullName}
            </p>
          </div>
          <select
            value={schoolBoard}
            onChange={(e) => setSchoolBoard(e.target.value)}
            className="h-9 rounded-lg border border-indigo-300 px-2 text-sm bg-white"
          >
            {Object.entries(BOARDS).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>
        
        {/* Syllabus Source Selection */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-indigo-200">
          <span className="text-xs text-indigo-700 font-medium mr-2">{isAppHindi ? 'पाठ्यक्रम स्रोत:' : 'Syllabus Source:'}</span>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="radio"
              name="syllabus_source"
              value="auto"
              checked={formData.syllabus_source === 'auto'}
              onChange={(e) => setFormData(prev => ({ ...prev, syllabus_source: e.target.value }))}
              className="w-3 h-3"
            />
            <span className={formData.syllabus_source === 'auto' ? 'text-indigo-900 font-semibold' : 'text-indigo-600'}>
              {isAppHindi ? 'स्वचालित (अनुशंसित)' : 'Auto (Recommended)'}
            </span>
          </label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="radio"
              name="syllabus_source"
              value="ncert"
              checked={formData.syllabus_source === 'ncert'}
              onChange={(e) => setFormData(prev => ({ ...prev, syllabus_source: e.target.value }))}
              className="w-3 h-3"
            />
            <span className={formData.syllabus_source === 'ncert' ? 'text-indigo-900 font-semibold' : 'text-indigo-600'}>
              {isAppHindi ? 'केवल NCERT' : 'NCERT Only'}
            </span>
          </label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="radio"
              name="syllabus_source"
              value="state_board"
              checked={formData.syllabus_source === 'state_board'}
              onChange={(e) => setFormData(prev => ({ ...prev, syllabus_source: e.target.value }))}
              className="w-3 h-3"
            />
            <span className={formData.syllabus_source === 'state_board' ? 'text-indigo-900 font-semibold' : 'text-indigo-600'}>
              {isAppHindi ? `केवल ${schoolBoard}` : `${schoolBoard} Only`}
            </span>
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isAppHindi ? 'कक्षा (Class)' : 'Class'} *</Label>
          <select
            name="class_name"
            value={formData.class_name}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-indigo-500"
            data-testid="paper-class-select"
          >
            <option value="">{isAppHindi ? 'कक्षा चुनें' : 'Select Class'}</option>
            {classNames.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isAppHindi ? 'विषय (Subject)' : 'Subject'} *</Label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-indigo-500"
            data-testid="paper-subject-select"
            disabled={!formData.class_name}
          >
            <option value="">{formData.class_name ? (isAppHindi ? 'विषय चुनें' : 'Select Subject') : (isAppHindi ? 'पहले कक्षा चुनें' : 'First select class')}</option>
            {availableSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{isAppHindi ? 'परीक्षा का नाम (Exam Name)' : 'Exam Name'} *</Label>
          <Input
            name="exam_name"
            value={formData.exam_name}
            onChange={handleChange}
            placeholder={isAppHindi ? 'जैसे: अर्धवार्षिक परीक्षा, Unit Test 1' : 'e.g., Half Yearly, Unit Test 1'}
            className="h-11"
            data-testid="paper-exam-name-input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{isAppHindi ? 'पेपर की भाषा (Paper Language)' : 'Paper Language'} *</Label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3 font-medium"
            data-testid="paper-language-select"
          >
            <option value="hindi">🇮🇳 {isAppHindi ? 'पूर्ण हिंदी (Full Hindi)' : 'Hindi'}</option>
            <option value="english">🇬🇧 {isAppHindi ? 'Full English' : 'English'}</option>
          </select>
          <p className="text-xs text-slate-500">
            {formData.language === 'hindi' 
              ? (isAppHindi ? 'पूरा पेपर हिंदी में बनेगा' : 'Complete paper in Hindi')
              : (isAppHindi ? 'पूरा पेपर English में बनेगा' : 'Complete paper in English')}
          </p>
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
                      <span className="text-xs text-slate-600">{langText.marks}:</span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">कठिनाई स्तर</Label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full h-11 rounded-lg border border-slate-200 px-3"
          >
            <option value="easy">{formData.language === 'hindi' ? 'आसान' : 'Easy'}</option>
            <option value="medium">{formData.language === 'hindi' ? 'मध्यम' : 'Medium'}</option>
            <option value="hard">{formData.language === 'hindi' ? 'कठिन' : 'Hard'}</option>
            <option value="mixed">{formData.language === 'hindi' ? 'मिश्रित' : 'Mixed'}</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">{langText.totalMarks} *</Label>
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
          <Label className="text-sm font-medium">{langText.time} ({langText.minutes}) *</Label>
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
              {formData.language === 'hindi' ? 'पेपर बन रहा है...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {formData.language === 'hindi' ? 'पेपर बनाएं' : 'Generate Paper'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Action buttons - hidden in print */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => { setPaper(null); setStep(1); }}>
          {formData.language === 'hindi' ? 'नया पेपर बनाएं' : 'Create New Paper'}
        </Button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
          <Printer className="w-5 h-5 mr-2" />
          {formData.language === 'hindi' ? 'प्रिंट करें' : 'Print Paper'}
        </Button>
      </div>

      {/* PRINTABLE PAPER - Clean design for printing */}
      <div 
        className="bg-white rounded-xl border border-slate-200 print:border-0 print:shadow-none print:rounded-none" 
        data-testid="paper-preview"
        id="printable-paper"
      >
        {/* Paper Header */}
        <div className="p-8 print:p-4">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold mb-1">{paper?.exam_name}</h1>
            <h2 className="text-lg font-semibold">{paper?.subject} - {paper?.class_name}</h2>
            <div className="flex justify-center gap-12 mt-3 text-sm font-medium">
              <span>{langText.totalMarks}: {paper?.total_marks}</span>
              <span>{langText.time}: {paper?.time_duration} {langText.minutes}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm print:bg-transparent print:border print:border-gray-300">
            <p className="font-semibold mb-2">{langText.instructions}:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1">
              <li>{langText.inst1}</li>
              <li>{langText.inst2}</li>
              <li>{langText.inst3}</li>
            </ol>
          </div>

          {/* Questions */}
          <div className="space-y-5">
            {paper?.questions?.map((q, idx) => (
              <div key={idx} className="pb-3" data-testid={`question-${idx}`}>
                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[45px]">{langText.questionPrefix}{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="font-medium">{q.question}</p>
                    <span className="text-sm text-gray-600">[{q.marks} {langText.marks}]</span>
                    
                    {q.type === 'diagram' && (
                      <p className="text-sm text-gray-600 mt-1 italic">{langText.drawDiagram}</p>
                    )}
                  </div>
                </div>
                
                {/* MCQ Options */}
                {q.options && q.options.length > 0 && (
                  <div className="ml-12 mt-2 space-y-1">
                    {q.options.map((opt, i) => (
                      <p key={i} className="text-gray-800">
                        ({String.fromCharCode(97 + i)}) {opt}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Answer Key - New Page in Print */}
          <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-400 print:break-before-page print:pt-4 print:mt-0 print:border-0">
            <h2 className="text-lg font-bold mb-4 text-center border-b pb-2">{langText.answerKey}</h2>
            <div className="space-y-4">
              {paper?.questions?.map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg print:bg-transparent print:border-b print:rounded-none print:p-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700 print:text-black min-w-[45px]">
                      {langText.questionPrefix}{idx + 1}:
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800">{q.answer}</p>
                      
                      {/* Diagram answer description */}
                      {q.type === 'diagram' && q.diagram_description && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm print:bg-transparent print:border print:border-gray-300">
                          <p className="font-medium text-blue-800 print:text-black">{langText.diagramAnswer}</p>
                          <p className="text-blue-700 print:text-gray-700">{q.diagram_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles - Injected CSS */}
      <style>{`
        @media print {
          /* Hide everything except the paper */
          body * {
            visibility: hidden;
          }
          #printable-paper, #printable-paper * {
            visibility: visible;
          }
          #printable-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            font-size: 12pt;
          }
          /* Remove browser headers/footers */
          @page {
            margin: 15mm;
            size: A4;
          }
          /* Ensure clean page breaks */
          .print\\:break-before-page {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="space-y-6 print:space-y-0" data-testid="ai-paper-page">
      {/* Header - Hidden in print */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">
          {formData.language === 'hindi' ? 'AI प्रश्न पत्र जनरेटर' : 'AI Question Paper Generator'}
        </h1>
        <p className="text-slate-500 mt-1">{BOARDS[schoolBoard]?.name} 2024-25 Syllabus</p>
      </div>

      {/* Stepper - Hidden in print */}
      <div className="flex items-center justify-center gap-4 print:hidden">
        {[
          { num: 1, label: formData.language === 'hindi' ? 'विषय चुनें' : 'Select Subject' },
          { num: 2, label: formData.language === 'hindi' ? 'प्रश्न सेट करें' : 'Set Questions' },
          { num: 3, label: formData.language === 'hindi' ? 'पेपर देखें' : 'View Paper' }
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

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 print:p-0 print:border-0 print:shadow-none">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
