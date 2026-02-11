import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Brain, BarChart3, Wallet, Shield, Fingerprint, BookOpen, Globe, Layers, Smartphone, ArrowRight, CheckCircle2, Zap, Cloud, Lock, Cpu, MessageSquare, Star, ChevronRight, Play, School, CalendarDays, ClipboardList, Bus, Camera, Megaphone, Settings, TrendingUp } from 'lucide-react';

const modules = [
  { icon: Users, title: 'Student Management', desc: 'Complete student lifecycle from admission to alumni tracking', color: 'bg-blue-500' },
  { icon: ClipboardList, title: 'Staff & HR', desc: 'Employee records, payroll, leave management & attendance', color: 'bg-emerald-500' },
  { icon: Wallet, title: 'Fee & Finance', desc: 'Online fee collection, receipts, concessions & payment tracking', color: 'bg-amber-500' },
  { icon: Fingerprint, title: 'Smart Attendance', desc: 'Digital attendance with geo-fencing & face recognition', color: 'bg-teal-500' },
  { icon: BookOpen, title: 'Exam & Results', desc: 'Question paper generation, marks entry & report cards', color: 'bg-purple-500' },
  { icon: CalendarDays, title: 'Timetable', desc: 'Auto-generate timetables with conflict detection', color: 'bg-pink-500' },
  { icon: Brain, title: 'AI Tools', desc: 'AI Paper Generator, Event Designer & Content Studio', color: 'bg-indigo-500' },
  { icon: MessageSquare, title: 'Communication', desc: 'SMS, WhatsApp, notices & parent messaging hub', color: 'bg-cyan-500' },
  { icon: School, title: 'Digital Library', desc: 'E-books, issue/return tracking & digital resources', color: 'bg-rose-500' },
  { icon: Bus, title: 'Transport', desc: 'Bus routes, GPS tracking & student transport management', color: 'bg-orange-500' },
  { icon: Camera, title: 'CCTV Integration', desc: 'Live camera feeds & security monitoring', color: 'bg-red-500' },
  { icon: TrendingUp, title: 'Analytics', desc: 'School-wide insights, reports & performance dashboards', color: 'bg-violet-500' },
];

const portals = [
  { name: 'SchoolTino', subtitle: 'Admin Portal', desc: '22+ modules for complete school administration', icon: '/icon-schooltino-192.png', color: 'from-blue-500 to-blue-600', features: ['Student & Staff Management', 'Fee Collection & Finance', 'AI-Powered Tools', 'Analytics Dashboard'] },
  { name: 'TeachTino', subtitle: 'Teacher Portal', desc: 'Everything teachers need in one place', icon: '/icon-teachtino-192.png', color: 'from-emerald-500 to-emerald-600', features: ['Class Management', 'Attendance Marking', 'Homework & Exams', 'Leave Management'] },
  { name: 'StudyTino', subtitle: 'Student & Parent Portal', desc: 'Stay connected with your child\'s progress', icon: '/icon-studytino-192.png', color: 'from-purple-500 to-purple-600', features: ['View Results & Attendance', 'Fee Payment Online', 'Homework Submissions', 'Digital Library Access'] },
];

const stats = [
  { value: '21,000+', label: 'Schools Empowered' },
  { value: '50L+', label: 'Students Managed' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'Support Available' },
];

const whyUs = [
  { icon: Cloud, title: 'Cloud-Based', desc: 'Access from anywhere, anytime. No installation needed.' },
  { icon: Lock, title: 'Bank-Grade Security', desc: 'Your data is encrypted and protected with enterprise security.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized for speed. No more waiting for pages to load.' },
  { icon: Cpu, title: 'AI-Powered', desc: 'Smart automation with Tino AI assistant built-in.' },
  { icon: Smartphone, title: 'Mobile Ready', desc: 'Works perfectly on phones, tablets and desktops.' },
  { icon: Globe, title: 'Multi-Language', desc: 'Support for Hindi, English and regional languages.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Schooltino</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
              <a href="#features" className="hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#modules" className="hover:text-blue-600 transition-colors font-medium">Modules</a>
              <a href="#portals" className="hover:text-blue-600 transition-colors font-medium">Portals</a>
              <a href="#why-us" className="hover:text-blue-600 transition-colors font-medium">Why Us</a>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">Sign In</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">Register School</button>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {mobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
              <a href="#features" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Features</a>
              <a href="#modules" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Modules</a>
              <a href="#portals" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>Portals</a>
              <button onClick={() => { setMobileMenu(false); navigate('/login'); }} className="block w-full text-left py-2 text-sm text-gray-600 hover:text-blue-600">Sign In</button>
            </div>
          )}
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Cloud className="w-4 h-4" /> Cloud-Based School ERP Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Complete School Management{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Made Simple.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              From admissions to analytics, automate your entire school with Schooltino's AI-powered K-12 Suite. Three portals, one platform — Admin, Teachers & Students, all connected.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                Register Your School Free <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2">
                Already Registered? Sign In
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white" id="portals">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Three Portals, One Platform</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Admin, Teachers, and Students — everyone gets their own dedicated portal with the tools they need.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {portals.map((portal, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <img src={portal.icon} alt={portal.name} className="w-12 h-12 rounded-xl" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{portal.name}</h3>
                    <p className="text-sm text-gray-500">{portal.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{portal.desc}</p>
                <ul className="space-y-2">
                  {portal.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50" id="modules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">25+ Powerful Modules</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything your school needs — from attendance to analytics, all in one integrated platform.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {modules.map((mod, i) => (
              <div key={i} className="bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-gray-100 group">
                <div className={`w-10 h-10 ${mod.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <mod.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{mod.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">AI-Powered School Management</h2>
              <p className="text-gray-600 text-lg mb-8">Schooltino's built-in AI assistant "Tino" helps you automate tasks, generate question papers, design event posters, and get instant insights about your school.</p>
              <div className="space-y-4">
                {[
                  { title: 'AI Paper Generator', desc: 'Generate exam papers with Sarvam AI — supports MP Board, RBSE, CBSE with NCERT syllabus' },
                  { title: 'Event Designer', desc: 'Create beautiful event posters, banners and certificates with AI templates' },
                  { title: 'Tino AI Chat', desc: 'Ask anything about your school data — attendance, fees, performance — get instant answers' },
                  { title: 'Smart Analytics', desc: 'AI-powered insights and predictions about student performance and school growth' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                      <p className="text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 lg:p-12">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">Tino AI Assistant</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-[80%]">Show me today's attendance summary</div>
                  <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white ml-auto max-w-[80%]">Today's attendance: 94.2% present (1,245 out of 1,321 students). Class 10-A has lowest at 88%.</div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-[80%]">Generate Math paper for Class 8</div>
                  <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white ml-auto max-w-[80%]">Generating... Your Class 8 Math paper with 5 sections is ready for download!</div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">Powered by Sarvam AI & Advanced Language Models</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50" id="why-us">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Schools Choose Schooltino</h2>
            <p className="text-gray-600 text-lg">Built for Indian schools, by educators who understand your needs.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {whyUs.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-5 lg:p-6 hover:shadow-lg transition-all border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your School?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">Join thousands of schools already using Schooltino. Register now and get 30 days free trial with all features.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              Register Your School <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-base hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2">
              Sign In
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Schooltino</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">AI-powered school management platform for modern Indian schools.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Portals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>SchoolTino (Admin)</li>
                <li>TeachTino (Teacher)</li>
                <li>StudyTino (Student)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>AI Paper Generator</li>
                <li>Smart Attendance</li>
                <li>Fee Management</li>
                <li>Communication Hub</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Training Videos</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>SchoolTino &middot; TeachTino &middot; StudyTino — One Platform, All Connected.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
