import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import {
  School,
  GraduationCap,
  Users,
  UserPlus,
  Wallet,
  Globe,
  Video,
  Check,
  ChevronRight,
  Sparkles,
  Loader2,
  Play,
  MessageSquare,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEP_ICONS = {
  School: School,
  GraduationCap: GraduationCap,
  Users: Users,
  UserPlus: UserPlus,
  Wallet: Wallet,
  Globe: Globe,
  Video: Video
};

export default function SetupWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);
  const [aiGuide, setAiGuide] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);

  useEffect(() => {
    fetchWizardStatus();
    fetchAiGuide();
  }, []);

  const fetchWizardStatus = async () => {
    try {
      const res = await axios.get(`${API}/setup/wizard`);
      setWizard(res.data);
    } catch (error) {
      console.error('Error fetching wizard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiGuide = async () => {
    try {
      const res = await axios.get(`${API}/setup/ai-guide`);
      setAiGuide(res.data);
    } catch (error) {
      console.error('Error fetching AI guide:', error);
    }
  };

  const handleStepClick = (step) => {
    navigate(step.route);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user?.role !== 'director') {
    return (
      <div className="text-center py-20">
        <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only Director can access the Setup Wizard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="setup-wizard-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          🚀 School Setup Wizard
        </h1>
        <p className="text-slate-500 mt-2">
          Complete these steps to get your school fully configured
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Setup Progress</h2>
          <span className="text-2xl font-bold text-indigo-600">
            {wizard?.completion_percentage || 0}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${wizard?.completion_percentage || 0}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          {wizard?.is_completed
            ? '🎉 All steps completed!'
            : `${wizard?.steps?.filter(s => s.is_completed).length || 0} of ${wizard?.total_steps || 7} steps completed`
          }
        </p>
      </div>

      {/* AI Guide Card */}
      {aiGuide && !wizard?.is_completed && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">AI Setup Assistant</h3>
              <p className="text-indigo-100 mb-4">{aiGuide.message}</p>
              
              {aiGuide.instructions && (
                <ul className="space-y-2 mb-4">
                  {aiGuide.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-100">
                      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              )}

              {aiGuide.current_step && (
                <Button
                  onClick={() => handleStepClick(aiGuide.current_step)}
                  className="bg-white text-indigo-700 hover:bg-indigo-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start: {aiGuide.current_step.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Setup Steps */}
      <div className="space-y-4">
        {wizard?.steps?.map((step, idx) => {
          const IconComponent = STEP_ICONS[step.icon] || School;
          const isActive = wizard.current_step === step.step_number;
          
          return (
            <div
              key={step.step_number}
              className={`bg-white rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${
                step.is_completed
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : isActive
                  ? 'border-indigo-400 shadow-md'
                  : 'border-slate-200'
              }`}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  step.is_completed
                    ? 'bg-emerald-100'
                    : isActive
                    ? 'bg-indigo-100'
                    : 'bg-slate-100'
                }`}>
                  {step.is_completed ? (
                    <Check className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <IconComponent className={`w-6 h-6 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      step.is_completed ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      Step {step.step_number}
                    </span>
                    {step.is_completed && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                        Completed
                      </span>
                    )}
                    {isActive && !step.is_completed && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs animate-pulse">
                        Current
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold ${
                    step.is_completed ? 'text-emerald-800' : 'text-slate-800'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>

                <ChevronRight className={`w-5 h-5 ${
                  step.is_completed ? 'text-emerald-400' : 'text-slate-400'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Card */}
      {wizard?.is_completed && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">🎉 Setup Complete!</h2>
          <p className="text-emerald-100 mb-6">
            Your school is now fully configured and ready to use Schooltino.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-emerald-700 hover:bg-emerald-50"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/ai-paper')}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Try AI Features
            </Button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-700 mb-1">Need Help?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Our AI assistant is here to guide you through each step
        </p>
        <Button variant="outline" onClick={() => navigate('/voice-assistant')}>
          <Sparkles className="w-4 h-4 mr-2" />
          Talk to AI Assistant
        </Button>
      </div>
    </div>
  );
}
