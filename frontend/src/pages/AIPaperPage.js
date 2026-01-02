import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, FileText, Loader2, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIPaperPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    class_name: '',
    chapter: '',
    difficulty: 'medium',
    question_types: ['mcq', 'short'],
    total_marks: 50,
    time_duration: 60,
    language: 'english'
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];
  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const questionTypes = [
    { id: 'mcq', label: t('mcq') },
    { id: 'short', label: t('short_answer') },
    { id: 'long', label: t('long_answer') },
    { id: 'fill_blank', label: t('fill_blanks') }
  ];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  const handleGenerate = async () => {
    if (formData.question_types.length === 0) {
      toast.error('Please select at least one question type');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/generate-paper`, formData);
      setPaper(response.data);
      setStep(3);
      toast.success(t('paper_ready'));
    } catch (error) {
      const msg = error.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to generate paper');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>{t('class_name')} *</Label>
          <select
            name="class_name"
            value={formData.class_name}
            onChange={handleChange}
            className="w-full h-12 rounded-lg border border-slate-200 px-3"
            data-testid="paper-class-select"
          >
            <option value="">Select Class</option>
            {classNames.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t('subject')} *</Label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full h-12 rounded-lg border border-slate-200 px-3"
            data-testid="paper-subject-select"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t('chapter')} *</Label>
          <Input
            name="chapter"
            value={formData.chapter}
            onChange={handleChange}
            placeholder="Enter chapter or topic name"
            data-testid="paper-chapter-input"
          />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full h-12 rounded-lg border border-slate-200 px-3"
            data-testid="paper-language-select"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => setStep(2)}
          disabled={!formData.class_name || !formData.subject || !formData.chapter}
          className="btn-primary"
          data-testid="next-step-btn"
        >
          Next <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>{t('question_types')} *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {questionTypes.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleQuestionTypeToggle(type.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.question_types.includes(type.id)
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid={`question-type-${type.id}`}
            >
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>{t('difficulty')}</Label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full h-12 rounded-lg border border-slate-200 px-3"
            data-testid="paper-difficulty-select"
          >
            <option value="easy">{t('easy')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="hard">{t('hard')}</option>
            <option value="mixed">{t('mixed')}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t('total_marks')} *</Label>
          <Input
            name="total_marks"
            type="number"
            value={formData.total_marks}
            onChange={handleChange}
            data-testid="paper-marks-input"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('duration')} *</Label>
          <Input
            name="time_duration"
            type="number"
            value={formData.time_duration}
            onChange={handleChange}
            data-testid="paper-duration-input"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)} data-testid="prev-step-btn">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={loading || formData.question_types.length === 0}
          className="btn-primary"
          data-testid="generate-paper-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t('generating')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {t('generate_paper')}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Paper Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:p-0" data-testid="paper-preview">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h2 className="text-2xl font-bold">{paper?.subject} - {paper?.class_name}</h2>
          <p className="text-slate-600 mt-1">{paper?.chapter}</p>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <span>Total Marks: {paper?.total_marks}</span>
            <span>Time: {paper?.time_duration} minutes</span>
          </div>
        </div>

        <div className="space-y-6">
          {paper?.questions?.map((q, idx) => (
            <div key={idx} className="space-y-2" data-testid={`question-${idx}`}>
              <div className="flex items-start gap-2">
                <span className="font-bold">Q{idx + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <span className="text-sm text-slate-500">[{q.marks} marks]</span>
                </div>
              </div>
              {q.options && (
                <div className="ml-8 space-y-1">
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

        {/* Answer Key */}
        <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
          <h3 className="text-lg font-bold mb-4">Answer Key</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paper?.questions?.map((q, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">Q{idx + 1}:</span> {q.answer}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between print:hidden">
        <Button variant="outline" onClick={() => { setPaper(null); setStep(1); }} data-testid="new-paper-btn">
          Generate New Paper
        </Button>
        <Button onClick={handlePrint} className="btn-primary" data-testid="print-paper-btn">
          <Download className="w-5 h-5 mr-2" />
          {t('print')} / {t('download')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8" data-testid="ai-paper-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900">{t('ai_paper')}</h1>
        <p className="text-slate-500 mt-1">Generate question papers with AI</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 print:hidden">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="stat-card print:shadow-none print:border-0 print:p-0">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
