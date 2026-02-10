import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Brain, FileText, Calendar, Palette, Sparkles, Send, Loader2, Download, ChevronRight } from 'lucide-react';

const tabs = [
  { id: 'paper', label: 'AI Paper Generator', icon: FileText, desc: 'Generate exam papers with AI' },
  { id: 'event', label: 'Event Designer', icon: Palette, desc: 'Design event posters & invitations' },
  { id: 'calendar', label: 'Calendar AI', icon: Calendar, desc: 'AI-powered academic calendar planning' },
];

const AIPaperGenerator = ({ user }) => {
  const [form, setForm] = useState({ subject: '', class_name: '', topic: '', difficulty: 'medium', num_questions: 10, question_types: 'mixed', language: 'english' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/ai/generate-paper`, {
        ...form, school_id: user?.school_id, user_id: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Failed to generate paper' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <input type="text" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} placeholder="e.g. Class 10" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <input type="text" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Algebra, Trigonometry" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
          <input type="number" value={form.num_questions} onChange={e => setForm({ ...form, num_questions: parseInt(e.target.value) || 10 })} min="5" max="50" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Types</label>
          <select value={form.question_types} onChange={e => setForm({ ...form, question_types: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="mixed">Mixed</option>
            <option value="mcq">MCQ Only</option>
            <option value="short">Short Answer</option>
            <option value="long">Long Answer</option>
          </select>
        </div>
      </div>
      <button onClick={generate} disabled={loading || !form.subject || !form.class_name} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Generating...' : 'Generate Paper'}
      </button>
      {result && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          {result.error ? (
            <p className="text-red-500 text-sm">{result.error}</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Generated Paper</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{result.paper || result.content || JSON.stringify(result, null, 2)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EventDesigner = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/ai/design-event`, {
        prompt, school_id: user?.school_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Failed to generate design' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Describe your event</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="e.g. Annual Day celebration poster with blue theme, school logo, date 15th March 2026..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button onClick={generate} disabled={loading || !prompt.trim()} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
        {loading ? 'Designing...' : 'Generate Design'}
      </button>
      {result && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6">
          {result.error ? (
            <p className="text-red-500 text-sm">{result.error}</p>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{result.design || result.content || JSON.stringify(result, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
};

const CalendarAI = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/ai/generate-calendar`, {
        prompt, school_id: user?.school_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Failed to generate calendar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Describe your calendar requirements</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="e.g. Generate academic calendar for 2026-27 session with holidays, exam schedule, PTM dates..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button onClick={generate} disabled={loading || !prompt.trim()} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        {loading ? 'Planning...' : 'Generate Calendar'}
      </button>
      {result && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6">
          {result.error ? (
            <p className="text-red-500 text-sm">{result.error}</p>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{result.calendar || result.content || JSON.stringify(result, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
};

const AIToolsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('paper');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered tools for content creation and planning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${activeTab === tab.id ? 'text-blue-900' : 'text-gray-900'}`}>{tab.label}</p>
                <p className="text-xs text-gray-500">{tab.desc}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-300'}`} />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'paper' && <AIPaperGenerator user={user} />}
        {activeTab === 'event' && <EventDesigner user={user} />}
        {activeTab === 'calendar' && <CalendarAI user={user} />}
      </div>
    </div>
  );
};

export default AIToolsPage;
