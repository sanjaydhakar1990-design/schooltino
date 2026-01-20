import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, FileText, Loader2, Download, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// NCERT 2024-25 Rationalized Syllabus - Class wise subjects
const CLASS_SUBJECTS = {
  'Class 1': ['Hindi', 'English', 'Mathematics', 'EVS'],
  'Class 2': ['Hindi', 'English', 'Mathematics', 'EVS'],
  'Class 3': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
  'Class 4': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
  'Class 5': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
  'Class 6': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
  'Class 7': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
  'Class 8': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
  'Class 9': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Information Technology'],
  'Class 10': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Information Technology'],
  'Class 11': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science', 'Psychology', 'Physical Education'],
  'Class 12': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science', 'Psychology', 'Physical Education']
};

// NCERT 2024-25 Rationalized Syllabus Chapters (Latest Updated)
const NCERT_2024_25_CHAPTERS = {
  // Class 10 Mathematics - NCERT 2024-25
  '10_Mathematics': [
    { id: 'ch1', name: 'Real Numbers', deleted: false },
    { id: 'ch2', name: 'Polynomials', deleted: false },
    { id: 'ch3', name: 'Pair of Linear Equations in Two Variables', deleted: false },
    { id: 'ch4', name: 'Quadratic Equations', deleted: false },
    { id: 'ch5', name: 'Arithmetic Progressions', deleted: false },
    { id: 'ch6', name: 'Triangles', deleted: false },
    { id: 'ch7', name: 'Coordinate Geometry', deleted: false },
    { id: 'ch8', name: 'Introduction to Trigonometry', deleted: false },
    { id: 'ch9', name: 'Some Applications of Trigonometry', deleted: false },
    { id: 'ch10', name: 'Circles', deleted: false },
    { id: 'ch11', name: 'Areas Related to Circles', deleted: false },
    { id: 'ch12', name: 'Surface Areas and Volumes', deleted: false },
    { id: 'ch13', name: 'Statistics', deleted: false },
    { id: 'ch14', name: 'Probability', deleted: false },
  ],
  // Class 10 Science - NCERT 2024-25 (Rationalized)
  '10_Science': [
    { id: 'ch1', name: 'Chemical Reactions and Equations', deleted: false },
    { id: 'ch2', name: 'Acids, Bases and Salts', deleted: false },
    { id: 'ch3', name: 'Metals and Non-metals', deleted: false },
    { id: 'ch4', name: 'Carbon and its Compounds', deleted: false },
    { id: 'ch5', name: 'Life Processes', deleted: false },
    { id: 'ch6', name: 'Control and Coordination', deleted: false },
    { id: 'ch7', name: 'How do Organisms Reproduce', deleted: false },
    { id: 'ch8', name: 'Heredity', deleted: false },
    { id: 'ch9', name: 'Light - Reflection and Refraction', deleted: false },
    { id: 'ch10', name: 'Human Eye and Colourful World', deleted: false },
    { id: 'ch11', name: 'Electricity', deleted: false },
    { id: 'ch12', name: 'Magnetic Effects of Electric Current', deleted: false },
    { id: 'ch13', name: 'Our Environment', deleted: false },
  ],
  // Class 10 English - NCERT 2024-25
  '10_English': [
    { id: 'ch1', name: 'A Letter to God (First Flight)', deleted: false },
    { id: 'ch2', name: 'Nelson Mandela: Long Walk to Freedom', deleted: false },
    { id: 'ch3', name: 'Two Stories about Flying', deleted: false },
    { id: 'ch4', name: 'From the Diary of Anne Frank', deleted: false },
    { id: 'ch5', name: 'Glimpses of India', deleted: false },
    { id: 'ch6', name: 'Mijbil the Otter', deleted: false },
    { id: 'ch7', name: 'Madam Rides the Bus', deleted: false },
    { id: 'ch8', name: 'The Sermon at Benares', deleted: false },
    { id: 'ch9', name: 'The Proposal (Drama)', deleted: false },
    { id: 'poetry', name: 'Poetry Section', deleted: false },
    { id: 'grammar', name: 'Grammar & Writing Skills', deleted: false },
  ],
  // Class 10 Hindi - NCERT 2024-25
  '10_Hindi': [
    { id: 'ch1', name: 'सूरदास के पद', deleted: false },
    { id: 'ch2', name: 'राम-लक्ष्मण-परशुराम संवाद', deleted: false },
    { id: 'ch3', name: 'आत्मत्राण (कविता)', deleted: false },
    { id: 'ch4', name: 'बालगोबिन भगत', deleted: false },
    { id: 'ch5', name: 'नेताजी का चश्मा', deleted: false },
    { id: 'ch6', name: 'मानवीय करुणा की दिव्य चमक', deleted: false },
    { id: 'ch7', name: 'एक कहानी यह भी', deleted: false },
    { id: 'ch8', name: 'संस्कृति', deleted: false },
    { id: 'grammar', name: 'व्याकरण खंड', deleted: false },
    { id: 'writing', name: 'लेखन कौशल', deleted: false },
  ],
  // Class 10 Social Science
  '10_Social Science': [
    { id: 'hist1', name: 'The Rise of Nationalism in Europe', deleted: false },
    { id: 'hist2', name: 'Nationalism in India', deleted: false },
    { id: 'hist3', name: 'The Making of a Global World', deleted: false },
    { id: 'hist4', name: 'The Age of Industrialisation', deleted: false },
    { id: 'hist5', name: 'Print Culture and the Modern World', deleted: false },
    { id: 'geo1', name: 'Resources and Development', deleted: false },
    { id: 'geo2', name: 'Forest and Wildlife Resources', deleted: false },
    { id: 'geo3', name: 'Water Resources', deleted: false },
    { id: 'geo4', name: 'Agriculture', deleted: false },
    { id: 'geo5', name: 'Minerals and Energy Resources', deleted: false },
    { id: 'geo6', name: 'Manufacturing Industries', deleted: false },
    { id: 'geo7', name: 'Lifelines of National Economy', deleted: false },
    { id: 'pol1', name: 'Power Sharing', deleted: false },
    { id: 'pol2', name: 'Federalism', deleted: false },
    { id: 'pol3', name: 'Democracy and Diversity', deleted: false },
    { id: 'pol4', name: 'Gender, Religion and Caste', deleted: false },
    { id: 'pol5', name: 'Political Parties', deleted: false },
    { id: 'pol6', name: 'Outcomes of Democracy', deleted: false },
    { id: 'eco1', name: 'Development', deleted: false },
    { id: 'eco2', name: 'Sectors of Indian Economy', deleted: false },
    { id: 'eco3', name: 'Money and Credit', deleted: false },
    { id: 'eco4', name: 'Globalisation and the Indian Economy', deleted: false },
    { id: 'eco5', name: 'Consumer Rights', deleted: false },
  ],
  // Class 9 Mathematics
  '9_Mathematics': [
    { id: 'ch1', name: 'Number Systems', deleted: false },
    { id: 'ch2', name: 'Polynomials', deleted: false },
    { id: 'ch3', name: 'Coordinate Geometry', deleted: false },
    { id: 'ch4', name: 'Linear Equations in Two Variables', deleted: false },
    { id: 'ch5', name: 'Introduction to Euclid\'s Geometry', deleted: false },
    { id: 'ch6', name: 'Lines and Angles', deleted: false },
    { id: 'ch7', name: 'Triangles', deleted: false },
    { id: 'ch8', name: 'Quadrilaterals', deleted: false },
    { id: 'ch9', name: 'Circles', deleted: false },
    { id: 'ch10', name: 'Heron\'s Formula', deleted: false },
    { id: 'ch11', name: 'Surface Areas and Volumes', deleted: false },
    { id: 'ch12', name: 'Statistics', deleted: false },
  ],
  // Class 9 Science
  '9_Science': [
    { id: 'ch1', name: 'Matter in Our Surroundings', deleted: false },
    { id: 'ch2', name: 'Is Matter Around Us Pure', deleted: false },
    { id: 'ch3', name: 'Atoms and Molecules', deleted: false },
    { id: 'ch4', name: 'Structure of the Atom', deleted: false },
    { id: 'ch5', name: 'The Fundamental Unit of Life', deleted: false },
    { id: 'ch6', name: 'Tissues', deleted: false },
    { id: 'ch7', name: 'Motion', deleted: false },
    { id: 'ch8', name: 'Force and Laws of Motion', deleted: false },
    { id: 'ch9', name: 'Gravitation', deleted: false },
    { id: 'ch10', name: 'Work and Energy', deleted: false },
    { id: 'ch11', name: 'Sound', deleted: false },
    { id: 'ch12', name: 'Improvement in Food Resources', deleted: false },
  ],
};

// Board-wise Marks Pattern (CBSE 2024-25)
const MARKS_PATTERN = {
  mcq: { marks: 1, label: 'MCQ (1 mark)' },
  fill_blank: { marks: 1, label: 'Fill in Blanks (1 mark)' },
  vsaq: { marks: 2, label: 'Very Short Answer (2 marks)' },
  short: { marks: 3, label: 'Short Answer (3 marks)' },
  long: { marks: 4, label: 'Long Answer (4 marks)' },  // Changed from 5 to 4 as per latest
  diagram: { marks: 3, label: 'Diagram Based (3 marks)' },
  hots: { marks: 4, label: 'HOTS (4 marks)' },
  case_study: { marks: 4, label: 'Case Study (4 marks)' },
};

export default function AIPaperPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);

  const [formData, setFormData] = useState({
    subject: '',
    class_name: '',
    selectedChapters: [],
    exam_name: '',
    difficulty: 'medium',
    question_types: ['mcq', 'short'],
    total_marks: 80,
    time_duration: 180,
    language: 'english',
    custom_marks: {} // For manual marks override
  });

  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  
  const questionTypes = [
    { id: 'mcq', label: 'MCQ (1 अंक)', marks: 1, description: 'Multiple Choice Questions' },
    { id: 'fill_blank', label: 'रिक्त स्थान (1 अंक)', marks: 1, description: 'Fill in the blanks' },
    { id: 'vsaq', label: 'अति लघु उत्तर (2 अंक)', marks: 2, description: 'Very Short Answer' },
    { id: 'short', label: 'लघु उत्तर (3 अंक)', marks: 3, description: 'Short Answer - 50-60 words' },
    { id: 'long', label: 'दीर्घ उत्तर (4 अंक)', marks: 4, description: 'Long Answer - 100-120 words' },
    { id: 'diagram', label: 'चित्र आधारित (3 अंक)', marks: 3, description: 'Draw and label diagram' },
    { id: 'hots', label: 'HOTS (4 अंक)', marks: 4, description: 'Higher Order Thinking' },
    { id: 'case_study', label: 'केस स्टडी (4 अंक)', marks: 4, description: 'Case based questions' },
  ];

  // Update subjects when class changes
  useEffect(() => {
    if (formData.class_name) {
      const subjects = CLASS_SUBJECTS[formData.class_name] || [];
      setAvailableSubjects(subjects);
      if (!subjects.includes(formData.subject)) {
        setFormData(prev => ({ ...prev, subject: '', selectedChapters: [] }));
        setAvailableChapters([]);
      }
    }
  }, [formData.class_name]);

  // Get chapters when subject changes
  useEffect(() => {
    if (formData.class_name && formData.subject) {
      const classNum = formData.class_name.replace('Class ', '');
      const key = `${classNum}_${formData.subject}`;
      const chapters = NCERT_2024_25_CHAPTERS[key] || [];
      setAvailableChapters(chapters.filter(ch => !ch.deleted));
    }
  }, [formData.class_name, formData.subject]);

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
      custom_marks: { ...prev.custom_marks, [type]: parseInt(value) || MARKS_PATTERN[type]?.marks || 1 }
    }));
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
      // Build marks config
      const marksConfig = {};
      formData.question_types.forEach(type => {
        marksConfig[type] = formData.custom_marks[type] || MARKS_PATTERN[type]?.marks || 1;
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
        board: 'NCERT'
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

  // Calculate expected marks based on question types
  const calculateExpectedMarks = () => {
    let total = 0;
    formData.question_types.forEach(type => {
      const marks = formData.custom_marks[type] || MARKS_PATTERN[type]?.marks || 1;
      total += marks * 5; // Assuming 5 questions per type
    });
    return total;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
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
            placeholder="जैसे: Half Yearly, Unit Test 1, Final Exam"
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
            <option value="english">English</option>
            <option value="hindi">हिंदी</option>
            <option value="bilingual">द्विभाषी (Both)</option>
          </select>
        </div>
      </div>

      {/* Syllabus Info Badge */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Check className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-700 font-medium">
          NCERT 2024-25 Rationalized Syllabus के अनुसार अध्याय
        </span>
      </div>

      {/* Chapter Selection */}
      {formData.subject && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">अध्याय चुनें (Select Chapters) *</Label>
          
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
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
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
                इस विषय के लिए अध्याय उपलब्ध नहीं हैं। कृपया दूसरा विषय चुनें।
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
      {/* Question Types with Marks */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">प्रश्न प्रकार चुनें (Question Types) *</Label>
        <p className="text-xs text-slate-500">CBSE 2024-25 पैटर्न के अनुसार अंक</p>
        
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
                  <p className="text-xs text-slate-500">{type.description}</p>
                  
                  {/* Custom Marks Input */}
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
            data-testid="paper-difficulty-select"
          >
            <option value="easy">आसान (Easy)</option>
            <option value="medium">मध्यम (Medium)</option>
            <option value="hard">कठिन (Hard)</option>
            <option value="mixed">मिश्रित (Mixed)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">कुल अंक (Total Marks) *</Label>
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
            data-testid="paper-duration-input"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)} data-testid="prev-step-btn">
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
      {/* Paper Preview - Only show Exam Name, not chapters */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:p-0 print:shadow-none" data-testid="paper-preview">
        {/* Paper Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          {paper?.exam_name && (
            <p className="text-lg font-bold text-indigo-700 mb-1">{paper.exam_name}</p>
          )}
          <h2 className="text-2xl font-bold">{paper?.subject} - {paper?.class_name}</h2>
          <div className="flex justify-center gap-8 mt-3 text-sm">
            <span className="font-medium">कुल अंक: {paper?.total_marks}</span>
            <span className="font-medium">समय: {paper?.time_duration} मिनट</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">NCERT 2024-25 Syllabus</p>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-3 bg-slate-50 rounded-lg text-sm">
          <p className="font-medium mb-1">सामान्य निर्देश:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>सभी प्रश्न अनिवार्य हैं।</li>
            <li>प्रत्येक प्रश्न के अंक उसके सामने दिए गए हैं।</li>
            <li>चित्र स्पष्ट और लेबल सहित बनाएं।</li>
          </ul>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {paper?.questions?.map((q, idx) => (
            <div key={idx} className="space-y-2" data-testid={`question-${idx}`}>
              <div className="flex items-start gap-2">
                <span className="font-bold min-w-[40px]">प्र.{idx + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <span className="text-sm text-slate-500 font-medium">[{q.marks} अंक]</span>
                  
                  {/* Show if diagram required */}
                  {q.type === 'diagram' && (
                    <p className="text-sm text-indigo-600 mt-1">📐 चित्र बनाकर समझाइए (Draw diagram)</p>
                  )}
                </div>
              </div>
              
              {/* MCQ Options */}
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

        {/* Answer Key - Separate Page for Print */}
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

      {/* Actions */}
      <div className="flex justify-between print:hidden">
        <Button variant="outline" onClick={() => { setPaper(null); setStep(1); }} data-testid="new-paper-btn">
          नया पेपर बनाएं
        </Button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700" data-testid="print-paper-btn">
          <Download className="w-5 h-5 mr-2" />
          प्रिंट / डाउनलोड
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="ai-paper-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI प्रश्न पत्र जनरेटर</h1>
        <p className="text-slate-500 mt-1">NCERT 2024-25 Syllabus के अनुसार प्रश्न पत्र बनाएं</p>
      </div>

      {/* Stepper */}
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

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 print:shadow-none print:border-0 print:p-0">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
