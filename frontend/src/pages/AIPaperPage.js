import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, FileText, Loader2, Download, ChevronRight, ChevronLeft, Check, AlertCircle, BookOpen, Printer, Image } from 'lucide-react';
import { toast } from 'sonner';
import { BOARDS, BOARD_SUBJECTS, getChapters, BOARD_MARKS_PATTERN, CLASS_PAPER_DEFAULTS, DRAWING_PAPER_TYPES } from '../data/boardSyllabus';
import { getChaptersByMedium } from '../data/syllabusLatest2025';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUBJECT_MAP_HI_TO_EN = {
  'हिंदी': 'Hindi', 'गणित': 'Mathematics', 'विज्ञान': 'Science',
  'सामाजिक विज्ञान': 'Social Science', 'संस्कृत': 'Sanskrit',
  'पर्यावरण': 'EVS', 'पर्यावरण अध्ययन': 'EVS', 'चित्रकला': 'Drawing',
  'सामान्य ज्ञान': 'General Knowledge', 'भौतिक विज्ञान': 'Physics',
  'रसायन विज्ञान': 'Chemistry', 'जीव विज्ञान': 'Biology',
  'भौतिकी': 'Physics', 'रसायन शास्त्र': 'Chemistry',
  'वाणिज्य': 'Commerce', 'अर्थशास्त्र': 'Economics',
  'वाणिज्य शास्त्र': 'Commerce', 'लेखाशास्त्र': 'Accountancy',
  'राजस्थान अध्ययन': 'Rajasthan Studies',
};

const SUBJECT_MAP_EN_TO_HI = Object.fromEntries(
  Object.entries(SUBJECT_MAP_HI_TO_EN).map(([hi, en]) => [en, hi])
);

const getSubjectInLanguage = (subject, targetLang) => {
  if (targetLang === 'english') {
    return SUBJECT_MAP_HI_TO_EN[subject] || subject;
  } else if (targetLang === 'hindi') {
    return SUBJECT_MAP_EN_TO_HI[subject] || subject;
  }
  return subject;
};

const getSubjectsForLanguage = (subjects, language) => {
  if (language === 'english') {
    return subjects.map(s => ({
      original: s,
      display: SUBJECT_MAP_HI_TO_EN[s] || s,
    }));
  }
  return subjects.map(s => ({
    original: s,
    display: SUBJECT_MAP_EN_TO_HI[s] || s,
  }));
};

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
    section: 'खंड',
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
    section: 'Section',
  }
};

const SECTION_LABELS = {
  hindi: { A: 'अ', B: 'ब', C: 'स', D: 'द' },
  english: { A: 'A', B: 'B', C: 'C', D: 'D' },
};

const SECTION_NAMES = {
  hindi: {
    A: 'बहुविकल्पीय / रिक्त स्थान / सही-गलत',
    B: 'लघु उत्तरीय प्रश्न (1-2 अंक)',
    C: 'दीर्घ उत्तरीय प्रश्न (3-5 अंक)',
    D: 'अति दीर्घ उत्तरीय प्रश्न (5+ अंक)',
  },
  english: {
    A: 'MCQ / Fill in Blanks / True-False',
    B: 'Short Answer Questions (1-2 Marks)',
    C: 'Long Answer Questions (3-5 Marks)',
    D: 'Very Long Answer Questions (5+ Marks)',
  },
};

export default function AIPaperPage() {
  const { t, i18n } = useTranslation();
  const { user, schoolId } = useAuth();
  const { language: appLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [schoolBoard, setSchoolBoard] = useState('CBSE');
  const [useNcertSyllabus, setUseNcertSyllabus] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
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
    custom_marks: {},
    syllabus_source: 'auto'
  });

  const [answerImages, setAnswerImages] = useState({});
  const [generatingImage, setGeneratingImage] = useState(null);
  const [autoGeneratingImages, setAutoGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = useState('question_paper');
  const [printLayout, setPrintLayout] = useState('normal');

  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  const isAppHindi = appLanguage === 'hi' || i18n.language === 'hi';
  const langText = LANG_TEXT[formData.language] || LANG_TEXT.hindi;

  useEffect(() => {
    const fetchSchoolBoard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/school/settings?school_id=${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          const primaryBoard = response.data.primary_board || response.data.board;
          const useNcert = response.data.use_ncert_syllabus !== false;
          
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
      let subjects = BOARD_SUBJECTS[schoolBoard]?.[formData.class_name] || [];
      
      if (useNcertSyllabus && schoolBoard !== 'NCERT') {
        const ncertSubjects = BOARD_SUBJECTS['NCERT']?.[formData.class_name] || 
                              BOARD_SUBJECTS['CBSE']?.[formData.class_name] || [];
        const allSubjects = [...new Set([...subjects, ...ncertSubjects])];
        subjects = allSubjects;
      }
      
      if (subjects.length === 0) {
        const cbseSubjects = BOARD_SUBJECTS['CBSE']?.[formData.class_name] || [];
        subjects = cbseSubjects;
      }
      
      setAvailableSubjects(subjects);
      if (!subjects.includes(formData.subject)) {
        setFormData(prev => ({ ...prev, subject: '', selectedChapters: [] }));
        setAvailableChapters([]);
      }
    }
  }, [formData.class_name, schoolBoard, useNcertSyllabus]);

  const fetchChaptersFromAPI = useCallback(async (board, className, subject) => {
    const token = localStorage.getItem('token');
    const classNum = className.replace('Class ', '');
    
    const endpoints = [];
    
    if (board === 'MPBSE' || board === 'RBSE') {
      endpoints.push(`${API}/syllabus/${board.toLowerCase()}/syllabus/${classNum}?subject=${encodeURIComponent(subject)}`);
      endpoints.push(`${API}/syllabus/ncert/syllabus/${classNum}?subject=${encodeURIComponent(subject)}`);
    } else if (board === 'NCERT' || board === 'CBSE') {
      endpoints.push(`${API}/ncert/syllabus/${classNum}?subject=${encodeURIComponent(subject)}`);
      endpoints.push(`${API}/syllabus/ncert/syllabus/${classNum}?subject=${encodeURIComponent(subject)}`);
    }
    
    if (board === 'MPBSE') {
      endpoints.push(`${API}/mpbse/syllabus/${classNum}?subject=${encodeURIComponent(subject)}`);
    }
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000
        });
        
        if (response.data) {
          let chapters = [];
          
          if (response.data.subjects) {
            const subjectData = response.data.subjects[subject] || Object.values(response.data.subjects)[0];
            if (subjectData?.chapters) {
              chapters = subjectData.chapters.map((ch, idx) => ({
                id: ch.id || `ch${idx + 1}`,
                name: ch.name || ch.title || `Chapter ${idx + 1}`,
              }));
            }
          }
          
          if (chapters.length === 0 && response.data.chapters) {
            chapters = response.data.chapters.map((ch, idx) => ({
              id: ch.id || `ch${idx + 1}`,
              name: ch.name || ch.title || `Chapter ${idx + 1}`,
            }));
          }
          
          if (chapters.length > 0) {
            return chapters;
          }
        }
      } catch (e) {
        // silently continue to next endpoint
      }
    }
    
    return [];
  }, []);

  useEffect(() => {
    if (!formData.class_name || !formData.subject) return;
    
    let cancelled = false;
    
    const loadChapters = async () => {
      setChaptersLoading(true);
      let chapters = [];
      
      const latestChapters = getChaptersByMedium(
        formData.class_name,
        formData.subject,
        formData.language
      );
      
      if (latestChapters && latestChapters.length > 0) {
        chapters = latestChapters.map((name, idx) => ({ id: `ch${idx + 1}`, name }));
      }
      
      if (chapters.length === 0) {
        try {
          const apiChapters = await fetchChaptersFromAPI(schoolBoard, formData.class_name, formData.subject);
          if (!cancelled && apiChapters.length > 0) {
            chapters = apiChapters;
          }
        } catch (e) {
          console.log('API fetch failed, using local data');
        }
      }
      
      if (chapters.length === 0) {
        const localChapters = getChapters(schoolBoard, formData.class_name, formData.subject);
        if (localChapters && localChapters.length > 0) {
          chapters = localChapters;
        }
      }
      
      if (chapters.length === 0) {
        const cbseChapters = getChapters('CBSE', formData.class_name, formData.subject);
        if (cbseChapters && cbseChapters.length > 0) {
          chapters = cbseChapters;
        }
      }
      
      if (chapters.length === 0) {
        const ncertChapters = getChapters('NCERT', formData.class_name, formData.subject);
        if (ncertChapters && ncertChapters.length > 0) {
          chapters = ncertChapters;
        }
      }
      
      if (!cancelled) {
        setAvailableChapters(chapters);
        setChaptersLoading(false);
      }
    };
    
    loadChapters();
    
    return () => { cancelled = true; };
  }, [formData.class_name, formData.subject, formData.syllabus_source, formData.language, schoolBoard, useNcertSyllabus, fetchChaptersFromAPI]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'class_name' && value) {
      const defaults = CLASS_PAPER_DEFAULTS[value];
      if (defaults) {
        setFormData(prev => ({
          ...prev,
          class_name: value,
          total_marks: defaults.totalMarks,
          time_duration: defaults.time,
          question_types: prev.question_types.filter(qt => {
            if (!defaults.hasLong && ['long', 'very_long'].includes(qt)) {
              return false;
            }
            return true;
          })
        }));
        
        if (!defaults.hasLong) {
          toast.info(isAppHindi ? `${value}: दीर्घ उत्तरीय प्रश्न इस कक्षा के लिए उपलब्ध नहीं हैं` : `${value}: Long answer questions not available for this class`);
        }
      }
    }
    
    if (name === 'subject' && (value.includes('Drawing') || value.includes('चित्रकला') || value.includes('Art'))) {
      toast.info(isAppHindi ? 'चित्रकला पेपर में चित्र आधारित प्रश्न होंगे' : 'Drawing paper will include image-based questions');
    }
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
      toast.error(isAppHindi ? 'कम से कम एक प्रश्न प्रकार चुनें' : 'Select at least one question type');
      return;
    }
    if (!formData.exam_name) {
      toast.error(isAppHindi ? 'परीक्षा का नाम डालें' : 'Enter exam name');
      return;
    }
    if (formData.selectedChapters.length === 0) {
      toast.error(isAppHindi ? 'कम से कम एक अध्याय चुनें' : 'Select at least one chapter');
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
        syllabus_year: '2025-26',
        board: schoolBoard
      };

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/generate-paper`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPaper(response.data);
      setStep(3);
      toast.success(isAppHindi ? 'पेपर तैयार है!' : 'Paper is ready!');
      
      const diagramQuestions = response.data.questions
        ?.map((q, idx) => ({ ...q, idx }))
        .filter(q => q.type === 'diagram' || q.type === 'draw_color' || q.type === 'scenery' || q.requires_drawing || q.hasDrawing) || [];
      
      if (diagramQuestions.length > 0) {
        toast.info(`${diagramQuestions.length} ${isAppHindi ? 'चित्र generate हो रहे हैं...' : 'images being generated...'}`);
        autoGenerateImages(diagramQuestions, response.data.subject);
      }
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : (isAppHindi ? 'पेपर बनाने में समस्या हुई' : 'Error generating paper'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const autoGenerateImages = async (diagramQuestions, subject) => {
    setAutoGeneratingImages(true);
    setImageProgress({ current: 0, total: diagramQuestions.length });
    
    const token = localStorage.getItem('token');
    
    for (let i = 0; i < diagramQuestions.length; i++) {
      const q = diagramQuestions[i];
      setImageProgress({ current: i + 1, total: diagramQuestions.length });
      
      try {
        const response = await axios.post(`${API}/ai/generate-answer-image`, {
          question: q.question,
          answer: q.answer || q.drawing_guide || q.diagram_description || 'Draw as described',
          subject: subject,
          question_type: q.type
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000
        });
        
        if (response.data.success && response.data.image_url) {
          setAnswerImages(prev => ({
            ...prev,
            [q.idx]: response.data.image_url
          }));
        }
      } catch (error) {
        console.error(`Image generation failed for Q${q.idx + 1}:`, error);
      }
    }
    
    setAutoGeneratingImages(false);
    toast.success(isAppHindi ? 'सभी चित्र तैयार हैं!' : 'All images ready!');
  };

  const generateAnswerImage = async (questionIdx, question) => {
    if (generatingImage === questionIdx) return;
    
    setGeneratingImage(questionIdx);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/generate-answer-image`, {
        question: question.question,
        answer: question.answer,
        subject: formData.subject,
        question_type: question.type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.image_url) {
        setAnswerImages(prev => ({
          ...prev,
          [questionIdx]: response.data.image_url
        }));
        toast.success(isAppHindi ? 'चित्र बन गया!' : 'Image generated!');
      } else {
        toast.error(isAppHindi ? 'चित्र नहीं बन पाया' : 'Image generation failed');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(isAppHindi ? 'चित्र बनाने में समस्या हुई' : 'Error generating image');
    } finally {
      setGeneratingImage(null);
    }
  };

  const questionTypes = Object.entries(marksPattern).map(([id, data]) => ({
    id,
    label: data.label,
    marks: data.marks,
    section: data.section,
  }));

  const getQuestionsGroupedBySections = () => {
    if (!paper?.questions) return [];
    
    const currentPattern = BOARD_MARKS_PATTERN[schoolBoard] || BOARD_MARKS_PATTERN.CBSE;
    const sectionMap = {};
    
    paper.questions.forEach((q, idx) => {
      let section = 'A';
      const qType = q.type?.toLowerCase() || '';
      
      if (['mcq', 'fill_blank', 'fill_blanks', 'true_false', 'objective'].includes(qType)) {
        section = 'A';
      } else if (['short', 'vsaq', 'very_short', 'ati_laghu'].includes(qType)) {
        section = 'B';
      } else if (['long', 'laghu', 'dirgha', 'diagram', 'hots', 'case_study'].includes(qType)) {
        section = 'C';
      } else if (['very_long', 'nibandh', 'essay'].includes(qType)) {
        section = 'D';
      } else if (q.marks) {
        if (q.marks <= 1) section = 'A';
        else if (q.marks <= 2) section = 'B';
        else if (q.marks <= 4) section = 'C';
        else section = 'D';
      }
      
      if (!sectionMap[section]) {
        sectionMap[section] = [];
      }
      sectionMap[section].push({ ...q, originalIdx: idx });
    });
    
    const orderedSections = ['A', 'B', 'C', 'D'].filter(s => sectionMap[s]?.length > 0);
    return orderedSections.map(section => ({
      section,
      label: SECTION_LABELS[formData.language]?.[section] || section,
      name: SECTION_NAMES[formData.language]?.[section] || '',
      questions: sectionMap[section],
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <div className="flex-1">
            <p className="font-medium text-indigo-900">
              {BOARDS[schoolBoard]?.name || schoolBoard} - {isAppHindi ? 'सत्र' : 'Session'} 2025-26
            </p>
            <p className="text-sm text-indigo-600">
              {useNcertSyllabus && schoolBoard !== 'NCERT' ? 
                `${schoolBoard} + NCERT ${isAppHindi ? 'संयुक्त पाठ्यक्रम' : 'Combined Syllabus'}` : 
                BOARDS[schoolBoard]?.fullName}
            </p>
          </div>
          <select
            value={schoolBoard}
            onChange={(e) => {
              setSchoolBoard(e.target.value);
              setFormData(prev => ({ ...prev, subject: '', selectedChapters: [], class_name: '' }));
              setAvailableChapters([]);
              setAvailableSubjects([]);
            }}
            className="h-9 rounded-lg border border-indigo-300 px-2 text-sm bg-white"
          >
            {Object.entries(BOARDS).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-3 border-t border-indigo-200">
          <span className="text-xs text-indigo-700 font-medium mr-2">{isAppHindi ? 'पाठ्यक्रम स्रोत:' : 'Syllabus Source:'}</span>
          {['auto', 'ncert', 'state_board'].map(src => (
            <label key={src} className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                name="syllabus_source"
                value={src}
                checked={formData.syllabus_source === src}
                onChange={(e) => setFormData(prev => ({ ...prev, syllabus_source: e.target.value }))}
                className="w-3 h-3"
              />
              <span className={formData.syllabus_source === src ? 'text-indigo-900 font-semibold' : 'text-indigo-600'}>
                {src === 'auto' ? (isAppHindi ? 'स्वचालित (अनुशंसित)' : 'Auto (Recommended)') :
                 src === 'ncert' ? (isAppHindi ? 'केवल NCERT' : 'NCERT Only') :
                 (isAppHindi ? `केवल ${schoolBoard}` : `${schoolBoard} Only`)}
              </span>
            </label>
          ))}
        </div>
      </div>

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
            {availableSubjects.map(s => {
              const displayName = formData.language === 'english' ? getSubjectInLanguage(s, 'english') : getSubjectInLanguage(s, 'hindi');
              return <option key={s} value={s}>{displayName !== s ? `${displayName} (${s})` : s}</option>;
            })}
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

      {formData.subject && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {isAppHindi ? 'अध्याय चुनें (Select Chapters)' : 'Select Chapters'} *
              {chaptersLoading && <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />}
            </Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllChapters} disabled={chaptersLoading}>
                {isAppHindi ? 'सभी चुनें' : 'Select All'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearAllChapters}>
                {isAppHindi ? 'हटाएं' : 'Clear'}
              </Button>
            </div>
          </div>
          
          {chaptersLoading ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                {isAppHindi ? 'अध्याय लोड हो रहे हैं...' : 'Loading chapters...'}
              </span>
            </div>
          ) : availableChapters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
              {availableChapters.map((ch, idx) => (
                <button
                  key={ch.id || idx}
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
                {isAppHindi 
                  ? `इस विषय के लिए ${schoolBoard} syllabus में अध्याय उपलब्ध नहीं हैं।`
                  : `No chapters available for this subject in ${schoolBoard} syllabus.`}
              </span>
            </div>
          )}
          
          {formData.selectedChapters.length > 0 && (
            <p className="text-sm text-indigo-600 font-medium">
              ✓ {formData.selectedChapters.length} {isAppHindi ? 'अध्याय चुने गए' : 'chapters selected'}
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
          {isAppHindi ? 'आगे बढ़ें' : 'Next'} <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">{isAppHindi ? 'प्रश्न प्रकार चुनें' : 'Select Question Types'} ({schoolBoard} {isAppHindi ? 'पैटर्न' : 'Pattern'}) *</Label>
        
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
                  {type.section && (
                    <span className="text-xs text-slate-500">
                      {langText.section} {SECTION_LABELS[formData.language]?.[type.section] || type.section}
                    </span>
                  )}
                  
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
          <Label className="text-sm font-medium">{isAppHindi ? 'कठिनाई स्तर' : 'Difficulty Level'}</Label>
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
          <ChevronLeft className="w-5 h-5 mr-2" /> {isAppHindi ? 'पीछे जाएं' : 'Go Back'}
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

  const printSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Print</title>
      <style>@page{margin:15mm;size:A4}*{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .paper-header{text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px}
      .paper-header h1{font-size:16pt;margin-bottom:4px}.paper-header h2{font-size:14pt}
      .paper-header .meta{font-size:10pt;color:#444;margin-top:4px}
      .paper-header .marks-time{display:flex;justify-content:center;gap:40px;margin-top:8px;font-size:11pt;font-weight:bold}
      .instructions{border:1px solid #999;padding:8px 12px;margin-bottom:16px;font-size:10pt}
      .instructions p{font-weight:bold;margin-bottom:4px}
      .section-header{background:#f0f0f0;padding:6px 12px;font-weight:bold;font-size:12pt;margin:16px 0 8px;border:1px solid #ccc}
      .question{margin-bottom:10px;padding-left:8px}.question .q-num{font-weight:bold;min-width:40px;display:inline-block}
      .question .q-marks{font-size:9pt;color:#666}.options{margin-left:50px;margin-top:4px}
      .options p{margin-bottom:2px}
      .answer-item{border-bottom:1px solid #ddd;padding:8px 0;margin-bottom:4px}
      .answer-item .q-num{font-weight:bold;color:#1e40af;min-width:40px;display:inline-block}
      .answer-item .marking-points{margin-left:40px;margin-top:4px;font-size:10pt}
      .answer-item .marking-points li{margin-bottom:2px}
      .diagram-box{border:1px solid #ccc;padding:8px;margin-top:6px;background:#f9f9f9;border-radius:4px}
      .diagram-box p{font-size:10pt}.diagram-box img{max-width:100%;height:auto;max-height:200px}
      .page-break{page-break-before:always}
      </style></head><body>${el.innerHTML}
      <script>window.onload=function(){setTimeout(function(){window.print();},500);}<\/script></body></html>`);
    printWindow.document.close();
  };

  const renderStep3 = () => {
    const sections = getQuestionsGroupedBySections();
    const qp = paper?.question_paper;
    const ak = paper?.answer_paper;
    const displaySubject = formData.language === 'english' ? getSubjectInLanguage(paper?.subject, 'english') : paper?.subject;
    
    return (
      <div className="space-y-6">
        {autoGeneratingImages && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 print:hidden">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <div className="flex-1">
                <p className="font-medium text-purple-800">
                  {isAppHindi ? 'चित्र बन रहे हैं...' : 'Generating diagrams...'} ({imageProgress.current}/{imageProgress.total})
                </p>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${imageProgress.total > 0 ? (imageProgress.current / imageProgress.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
          <Button variant="outline" onClick={() => { setPaper(null); setStep(1); setAnswerImages({}); setViewMode('question_paper'); }}>
            {formData.language === 'hindi' ? 'नया पेपर बनाएं' : 'Create New Paper'}
          </Button>
          
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('question_paper')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'question_paper' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}>
              {formData.language === 'hindi' ? 'प्रश्न पत्र' : 'Question Paper'}
            </button>
            <button onClick={() => setViewMode('answer_key')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'answer_key' ? 'bg-white shadow text-green-700' : 'text-slate-600 hover:text-slate-900'}`}>
              {formData.language === 'hindi' ? 'उत्तर कुंजी' : 'Answer Key'}
            </button>
          </div>
          
          <Button onClick={() => printSection(viewMode === 'question_paper' ? 'printable-question-paper' : 'printable-answer-key')} className="bg-indigo-600 hover:bg-indigo-700" disabled={autoGeneratingImages}>
            <Printer className="w-5 h-5 mr-2" />
            {viewMode === 'question_paper' 
              ? (formData.language === 'hindi' ? 'प्रश्न पत्र प्रिंट' : 'Print Question Paper')
              : (formData.language === 'hindi' ? 'उत्तर कुंजी प्रिंट' : 'Print Answer Key')}
          </Button>
        </div>

        {viewMode === 'question_paper' && (
          <div className="bg-white rounded-xl border border-slate-200" data-testid="paper-preview" id="printable-question-paper">
            <div className="p-8">
              <div className="paper-header text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-xl font-bold mb-1">{paper?.exam_name || (formData.language === 'hindi' ? 'परीक्षा' : 'Examination')}</h1>
                <h2 className="text-lg font-semibold">{displaySubject} - {paper?.class_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{BOARDS[schoolBoard]?.name} | 2025-26</p>
                <div className="flex justify-center gap-12 mt-3 text-sm font-medium">
                  <span>{langText.totalMarks}: {paper?.total_marks}</span>
                  <span>{langText.time}: {paper?.time_duration} {langText.minutes}</span>
                </div>
              </div>

              <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                <p className="font-semibold mb-2">{langText.instructions}:</p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li>{langText.inst1}</li>
                  <li>{langText.inst2}</li>
                  <li>{langText.inst3}</li>
                </ol>
              </div>

              <div className="space-y-6">
                {sections.length > 0 ? (
                  sections.map((sec) => {
                    const prevSectionsCounts = sections
                      .slice(0, sections.indexOf(sec))
                      .reduce((sum, s) => sum + s.questions.length, 0);
                    
                    return (
                      <div key={sec.section} className="mb-4">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg mb-4 border border-gray-300">
                          <h3 className="font-bold text-base">
                            {langText.section} - {sec.label} : {sec.name}
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              ({sec.questions.reduce((s, q) => s + (q.marks || 0), 0)} {langText.marks})
                            </span>
                          </h3>
                        </div>
                        
                        <div className="space-y-4 pl-2">
                          {sec.questions.map((q, qIdx) => {
                            const globalNum = prevSectionsCounts + qIdx + 1;
                            return (
                              <div key={q.originalIdx} className="pb-3">
                                <div className="flex items-start gap-2">
                                  <span className="font-bold min-w-[45px]">{langText.questionPrefix}{globalNum}.</span>
                                  <div className="flex-1">
                                    <p className="font-medium">{q.question || q.q_text}</p>
                                    <span className="text-sm text-gray-600">[{q.marks} {langText.marks}]</span>
                                    {(q.type === 'diagram' || q.requires_drawing || q.diagram_required) && (
                                      <p className="text-sm text-gray-600 mt-1 italic">{langText.drawDiagram}</p>
                                    )}
                                    {q.internal_choice && q.choice_question && (
                                      <div className="mt-2 pl-4 border-l-2 border-amber-300">
                                        <p className="text-sm text-amber-700 font-medium">{formData.language === 'hindi' ? 'अथवा (OR)' : 'OR'}</p>
                                        <p className="font-medium mt-1">{q.choice_question}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {q.options && q.options.length > 0 && (
                                  <div className="ml-12 mt-2 space-y-1">
                                    {q.options.map((opt, i) => {
                                      const cleanOption = opt.replace(/^[a-d][\)\.\s]+\s*/i, '').replace(/^\([a-d]\)\s*/i, '');
                                      const prefix = String.fromCharCode(97 + i);
                                      return <p key={i} className="text-gray-800">({prefix}) {cleanOption}</p>;
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  paper?.questions?.map((q, idx) => (
                    <div key={idx} className="pb-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold min-w-[45px]">{langText.questionPrefix}{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{q.question}</p>
                          <span className="text-sm text-gray-600">[{q.marks} {langText.marks}]</span>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="ml-12 mt-2 space-y-1">
                          {q.options.map((opt, i) => {
                            const cleanOption = opt.replace(/^[a-d][\)\.\s]+\s*/i, '').replace(/^\([a-d]\)\s*/i, '');
                            const prefix = String.fromCharCode(97 + i);
                            return <p key={i} className="text-gray-800">({prefix}) {cleanOption}</p>;
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
                *** {formData.language === 'hindi' ? 'शुभकामनाएँ' : 'Best of Luck'} ***
              </div>
            </div>
          </div>
        )}

        {viewMode === 'answer_key' && (
          <div className="bg-white rounded-xl border border-green-200" id="printable-answer-key">
            <div className="p-8">
              <div className="text-center border-b-2 border-green-600 pb-4 mb-6">
                <h1 className="text-xl font-bold text-green-800 mb-1">
                  {formData.language === 'hindi' ? 'उत्तर कुंजी / मार्किंग स्कीम' : 'ANSWER KEY / MARKING SCHEME'}
                </h1>
                <h2 className="text-lg font-semibold">{paper?.exam_name} - {displaySubject} - {paper?.class_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{BOARDS[schoolBoard]?.name} | 2025-26 | {langText.totalMarks}: {paper?.total_marks}</p>
              </div>

              <div className="space-y-4">
                {(ak?.answers || paper?.questions || []).map((item, idx) => {
                  const q = paper?.questions?.[idx] || {};
                  const answer = item.model_answer || item.correct_answer || item.answer || q.answer || '';
                  const qNum = item.q_no || idx + 1;
                  const marks = item.marks || q.marks || 0;
                  const qType = item.type || q.type || '';
                  
                  return (
                    <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-green-700 min-w-[50px]">
                          {langText.questionPrefix}{qNum}:
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1 italic">{q.question}</p>
                          <p className="text-gray-800 font-medium">{answer}</p>
                          <span className="text-xs text-green-600">[{marks} {langText.marks}]</span>
                          
                          {item.explanation && (
                            <p className="text-sm text-blue-700 mt-1 italic">{formData.language === 'hindi' ? 'व्याख्या: ' : 'Explanation: '}{item.explanation}</p>
                          )}

                          {item.marking_points && item.marking_points.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-green-300">
                              <p className="text-xs font-semibold text-green-700 mb-1">{formData.language === 'hindi' ? 'अंक विभाजन:' : 'Marking Points:'}</p>
                              <ul className="text-sm text-gray-700 space-y-0.5">
                                {item.marking_points.map((pt, pi) => <li key={pi}>• {pt}</li>)}
                              </ul>
                            </div>
                          )}

                          {item.diagram_steps && item.diagram_steps.length > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-semibold text-blue-700 mb-1">{formData.language === 'hindi' ? 'चित्र निर्देश:' : 'Diagram Steps:'}</p>
                              <ol className="text-sm text-gray-700 space-y-0.5 list-decimal list-inside">
                                {item.diagram_steps.map((st, si) => <li key={si}>{st}</li>)}
                              </ol>
                            </div>
                          )}

                          {(qType === 'diagram' || q.diagram_description) && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm border border-blue-200">
                              <p className="font-medium text-blue-800">{langText.diagramAnswer}</p>
                              <p className="text-blue-700">{q.diagram_description || q.drawing_guide || ''}</p>
                            </div>
                          )}

                          {answerImages[idx] && (
                            <div className="mt-3">
                              <img src={answerImages[idx]} alt={`Diagram Q${qNum}`} className="max-w-full h-auto rounded-lg border shadow-sm max-h-64 object-contain" />
                            </div>
                          )}
                          
                          {(qType === 'diagram' || qType === 'long' || qType === 'very_long' || q.requires_drawing) && !answerImages[idx] && (
                            <Button variant="outline" size="sm" onClick={() => generateAnswerImage(idx, q)} disabled={generatingImage === idx} className="mt-2 print:hidden">
                              {generatingImage === idx ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isAppHindi ? 'चित्र बना रहा...' : 'Generating...'}</>
                              ) : (
                                <><Image className="w-4 h-4 mr-2" />{isAppHindi ? 'AI चित्र बनाएं' : 'Generate AI Diagram'}</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 print:space-y-0" data-testid="ai-paper-page">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">
          {isAppHindi ? 'AI प्रश्न पत्र जनरेटर' : 'AI Question Paper Generator'}
        </h1>
        <p className="text-slate-500 mt-1">{BOARDS[schoolBoard]?.name} 2025-26 {isAppHindi ? 'पाठ्यक्रम' : 'Syllabus'}</p>
      </div>

      <div className="flex items-center justify-center gap-4 print:hidden">
        {[
          { num: 1, label: isAppHindi ? 'विषय चुनें' : 'Select Subject' },
          { num: 2, label: isAppHindi ? 'प्रश्न सेट करें' : 'Set Questions' },
          { num: 3, label: isAppHindi ? 'पेपर देखें' : 'View Paper' }
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

      <div className="bg-white rounded-xl border border-slate-200 p-6 print:p-0 print:border-0 print:shadow-none">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
