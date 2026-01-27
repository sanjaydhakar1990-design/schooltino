import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { 
  Sparkles, 
  FileText, 
  Loader2, 
  Download, 
  Eye,
  Settings,
  CheckCircle2,
  ChevronRight,
  School,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Complete Syllabus Data with Hindi Support
const COMPLETE_SYLLABUS_2025 = {
  CBSE: {
    'Class 6': {
      'हिंदी': ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व'],
      'English': ['Who Did Patricks Homework', 'How the Dog Found Himself', 'Taros Reward', 'Kalpana Chawla'],
      'गणित': ['संख्याओं को जानना', 'पूर्ण संख्याएँ', 'संख्याओं के साथ खेलना', 'आधारभूत ज्यामितीय विचार'],
      'Mathematics': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas'],
      'विज्ञान': ['भोजन: यह कहाँ से आता है', 'भोजन के घटक', 'रेशे से वस्त्र', 'पदार्थों का समूहों में वर्गीकरण'],
      'Science': ['Food Where Does it Come From', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials'],
      'सामाजिक विज्ञान': ['क्या, कब, कहाँ और कैसे', 'आखेट-खाद्य संग्रह से भोजन उत्पादन', 'आरंभिक नगर'],
      'Social Science': ['What Where How and When', 'From Hunting to Growing Food', 'In the Earliest Cities'],
      'संस्कृत': ['शब्दपरिचयः', 'सर्वनाम-शब्दाः', 'विशेषणम्', 'धातुपरिचयः'],
      'Sanskrit': ['Shabd Parichay', 'Sarvanam Shabdah', 'Visheshan', 'Dhatu Parichay'],
    },
    'Class 8': {
      'हिंदी': ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया'],
      'English': ['The Best Christmas Present', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhurys Lapse'],
      'गणित': ['परिमेय संख्याएँ', 'एक चर वाले रैखिक समीकरण', 'चतुर्भुजों को समझना', 'आँकड़ों का प्रबंधन'],
      'Mathematics': ['Rational Numbers', 'Linear Equations', 'Understanding Quadrilaterals', 'Data Handling'],
      'विज्ञान': ['फसल उत्पादन एवं प्रबंध', 'सूक्ष्मजीव: मित्र एवं शत्रु', 'कोयला और पेट्रोलियम', 'दहन और ज्वाला'],
      'Science': ['Crop Production', 'Microorganisms Friend and Foe', 'Coal and Petroleum', 'Combustion and Flame'],
      'सामाजिक विज्ञान': ['कैसे, कब और कहाँ', 'व्यापार से साम्राज्य तक', 'ग्रामीण क्षेत्र पर शासन'],
      'Social Science': ['How When and Where', 'From Trade to Territory', 'Ruling the Countryside'],
      'संस्कृत': ['सुभाषितानि', 'बिलस्य वाणी', 'डिजीभारतम्', 'सदैव पुरतो निधेहि'],
      'Sanskrit': ['Subhashitani', 'Bilasya Vani', 'DigiIndia', 'Keep Moving Forward'],
    },
  }
};

export default function AIPaperGeneratorNew() {
  const { user, schoolId } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({
    name: '',
    logo: ''
  });

  const [formData, setFormData] = useState({
    board: 'CBSE',
    class: 'Class 6',
    subject: '',
    chapters: [],
    medium: 'hindi',
    examName: '',
    academicYear: '2025-26',
    duration: 180,
    totalMarks: 80,
    difficulty: 'moderate',
    questionTypes: {
      mcq: true,
      veryShort: true,
      short: true,
      long: true,
      diagram: true,
      caseStudy: false
    }
  });

  const boards = ['CBSE', 'MP Board', 'RBSE'];
  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  
  const getSubjects = () => {
    const classData = COMPLETE_SYLLABUS_2025[formData.board]?.[formData.class];
    return classData ? Object.keys(classData) : [];
  };

  const getChapters = () => {
    const classData = COMPLETE_SYLLABUS_2025[formData.board]?.[formData.class];
    return classData?.[formData.subject] || [];
  };

  const handleGenerate = async () => {
    if (!formData.subject || formData.chapters.length === 0 || !formData.examName) {
      toast.error('कृपया सभी आवश्यक फ़ील्ड भरें');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/generate-paper`, {
        subject: formData.subject,
        class_name: formData.class,
        chapter: formData.chapters.join(', '),
        exam_name: formData.examName,
        difficulty: formData.difficulty,
        question_types: Object.keys(formData.questionTypes).filter(k => formData.questionTypes[k]),
        total_marks: formData.totalMarks,
        time_duration: formData.duration,
        language: formData.medium,
        school_name: schoolSettings.name || 'School Name',
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setPaper(response.data);
      setShowPreview(true);
      toast.success('Paper generated successfully!');
    } catch (error) {
      toast.error('Error generating paper: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SchoolTino ULTRA AI Paper Generator
              </h1>
              <p className="text-slate-600 mt-1">Professional Board-Level Question Papers - Academic Year 2025-26</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Basic Info */}
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-bold">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Board</Label>
                <select 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.board}
                  onChange={(e) => setFormData({...formData, board: e.target.value})}
                >
                  {boards.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <Label>Class</Label>
                <select 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.class}
                  onChange={(e) => setFormData({...formData, class: e.target.value, subject: '', chapters: []})}
                >
                  {classes.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label>Subject</Label>
                <select 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value, chapters: []})}
                >
                  <option value="">Select Subject</option>
                  {getSubjects().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <Label>Medium</Label>
                <select 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.medium}
                  onChange={(e) => setFormData({...formData, medium: e.target.value})}
                >
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="english">English</option>
                </select>
              </div>

              <div>
                <Label>Exam Name</Label>
                <Input 
                  placeholder="e.g., Unit Test 1, Half Yearly"
                  value={formData.examName}
                  onChange={(e) => setFormData({...formData, examName: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Academic Year</Label>
                <Input 
                  value="2025-26"
                  disabled
                  className="mt-1 bg-slate-100"
                />
              </div>
            </div>
          </Card>

          {/* Step 2: Select Chapters */}
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-bold">Select Chapters</h2>
            </div>

            {formData.subject ? (
              <div className="space-y-3">
                <div className="flex gap-2 mb-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setFormData({...formData, chapters: getChapters()})}
                  >
                    Select All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setFormData({...formData, chapters: []})}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {getChapters().map((chapter, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.chapters.includes(chapter)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        if (formData.chapters.includes(chapter)) {
                          setFormData({...formData, chapters: formData.chapters.filter(c => c !== chapter)});
                        } else {
                          setFormData({...formData, chapters: [...formData.chapters, chapter]});
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.chapters.includes(chapter)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{chapter}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-slate-600 mt-3">
                  {formData.chapters.length} chapters selected
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Please select a subject first</p>
            )}
          </Card>

          {/* Step 3: Paper Settings */}
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <h2 className="text-xl font-bold">Paper Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label>Total Marks</Label>
                <Input 
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({...formData, totalMarks: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input 
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Difficulty</Label>
                <select 
                  className="w-full mt-1 px-4 py-2 border rounded-lg"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="board-standard">Board Standard</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Question Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.questionTypes).map(([type, enabled]) => (
                  <div 
                    key={type}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      enabled ? 'border-green-500 bg-green-50' : 'border-slate-200'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      questionTypes: {...formData.questionTypes, [type]: !enabled}
                    })}
                  >
                    <input 
                      type="checkbox" 
                      checked={enabled}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium capitalize">{type.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={loading || !formData.subject || formData.chapters.length === 0}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Professional Paper...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Question Paper
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Info & Preview */}
        <div className="space-y-6">
          {/* School Branding */}
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <School className="w-6 h-6" />
              <h3 className="font-bold">School Branding</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-white text-sm">School Name</Label>
                <Input 
                  placeholder="Enter school name"
                  value={schoolSettings.name}
                  onChange={(e) => setSchoolSettings({...schoolSettings, name: e.target.value})}
                  className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                />
              </div>
            </div>
          </Card>

          {/* Paper Preview */}
          {paper && (
            <Card className="p-6 bg-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Paper Preview
                </h3>
                <Button size="sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showPreview && (
                <div className="border rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto text-sm">
                  <div className="text-center mb-4 border-b pb-3">
                    <p className="font-bold">{schoolSettings.name || 'SCHOOL NAME'}</p>
                    <p className="text-xs">{formData.board} Board - {formData.academicYear}</p>
                    <p className="font-bold mt-2">{formData.examName}</p>
                    <p className="text-xs">Class: {formData.class} | Subject: {formData.subject}</p>
                    <p className="text-xs">Time: {formData.duration} min | Max Marks: {formData.totalMarks}</p>
                  </div>
                  
                  <p className="text-xs text-slate-600">
                    Preview of {paper.questions?.length || 0} questions generated...
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Question Paper (PDF)
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Answer Key (PDF)
                </Button>
                <Button className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Both
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="font-bold mb-4">Selected Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Board:</span>
                <span className="font-medium">{formData.board}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Class:</span>
                <span className="font-medium">{formData.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Subject:</span>
                <span className="font-medium">{formData.subject || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Chapters:</span>
                <span className="font-medium">{formData.chapters.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Medium:</span>
                <span className="font-medium">{formData.medium === 'hindi' ? 'हिंदी' : 'English'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
