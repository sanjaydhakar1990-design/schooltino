import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Users, Brain, BarChart3, Wallet, Shield, Fingerprint, BookOpen, Globe, Layers, Smartphone, ArrowRight, CheckCircle2, Zap, Cloud, Lock, Cpu, MessageSquare, Star, ChevronRight, Play, School, CalendarDays, ClipboardList, Bus, Camera, Megaphone, Settings, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const modules = [
    { icon: Users, title: t('student_management_title'), desc: t('student_management_desc'), color: 'bg-blue-500' },
    { icon: ClipboardList, title: t('staff_hr'), desc: t('staff_hr_desc'), color: 'bg-emerald-500' },
    { icon: Wallet, title: t('fee_finance'), desc: t('fee_finance_desc'), color: 'bg-amber-500' },
    { icon: Fingerprint, title: t('smart_attendance_title'), desc: t('smart_attendance_desc'), color: 'bg-teal-500' },
    { icon: BookOpen, title: t('exam_results'), desc: t('exam_results_desc'), color: 'bg-purple-500' },
    { icon: CalendarDays, title: t('timetable_module'), desc: t('timetable_module_desc'), color: 'bg-pink-500' },
    { icon: Brain, title: t('ai_tools_title'), desc: t('ai_tools_desc'), color: 'bg-indigo-500' },
    { icon: MessageSquare, title: t('communication_title'), desc: t('communication_desc'), color: 'bg-cyan-500' },
    { icon: School, title: t('digital_library_title'), desc: t('digital_library_desc'), color: 'bg-rose-500' },
    { icon: Bus, title: t('transport_title'), desc: t('transport_desc'), color: 'bg-orange-500' },
    { icon: Camera, title: t('cctv_title'), desc: t('cctv_desc'), color: 'bg-red-500' },
    { icon: TrendingUp, title: t('analytics_title'), desc: t('analytics_desc'), color: 'bg-violet-500' },
  ];

  const portals = [
    { name: 'SchoolTino', appLabel: t('admin_app'), subtitle: t('admin_portal'), desc: t('admin_portal_desc'), Icon: Shield, color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30', brandColor: 'text-blue-600', features: [t('admin_feature_1'), t('admin_feature_2'), t('admin_feature_3'), t('admin_feature_4')] },
    { name: 'TeachTino', appLabel: t('teacher_app'), subtitle: t('teacher_portal'), desc: t('teacher_portal_desc'), Icon: BookOpen, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', brandColor: 'text-emerald-600', features: [t('teacher_feature_1'), t('teacher_feature_2'), t('teacher_feature_3'), t('teacher_feature_4')] },
    { name: 'StudyTino', appLabel: t('student_app'), subtitle: t('student_parent_portal'), desc: t('student_portal_desc'), Icon: GraduationCap, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30', brandColor: 'text-violet-600', features: [t('student_feature_1'), t('student_feature_2'), t('student_feature_3'), t('student_feature_4')] },
  ];

  const stats = [
    { value: '21,000+', label: t('schools_empowered') },
    { value: '50L+', label: t('students_managed') },
    { value: '99.9%', label: t('uptime_guarantee') },
    { value: '24/7', label: t('support_available') },
  ];

  const whyUs = [
    { icon: Cloud, title: t('cloud_based'), desc: t('cloud_based_desc') },
    { icon: Lock, title: t('bank_grade_security'), desc: t('bank_grade_security_desc') },
    { icon: Zap, title: t('lightning_fast'), desc: t('lightning_fast_desc') },
    { icon: Cpu, title: t('ai_powered'), desc: t('ai_powered_desc') },
    { icon: Smartphone, title: t('mobile_ready'), desc: t('mobile_ready_desc') },
    { icon: Globe, title: t('multi_language'), desc: t('multi_language_desc') },
  ];

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
              <a href="#features" className="hover:text-blue-600 transition-colors font-medium">{t('features')}</a>
              <a href="#modules" className="hover:text-blue-600 transition-colors font-medium">{t('modules')}</a>
              <a href="#portals" className="hover:text-blue-600 transition-colors font-medium">{t('portals')}</a>
              <a href="#why-us" className="hover:text-blue-600 transition-colors font-medium">{t('why_us')}</a>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">{t('sign_in')}</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">{t('register_school')}</button>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {mobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
              <a href="#features" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>{t('features')}</a>
              <a href="#modules" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>{t('modules')}</a>
              <a href="#portals" className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setMobileMenu(false)}>{t('portals')}</a>
              <button onClick={() => { setMobileMenu(false); navigate('/login'); }} className="block w-full text-left py-2 text-sm text-gray-600 hover:text-blue-600">{t('sign_in')}</button>
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
              <Cloud className="w-4 h-4" /> {t('landing_cloud_badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              {t('landing_hero_title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('landing_hero_highlight')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              {t('landing_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                {t('landing_register_free')} <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2">
                {t('landing_already_registered')}
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('landing_three_portals')}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('landing_three_portals_desc')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {portals.map((portal, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.color} shadow-lg ${portal.glow} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                    <portal.Icon className="w-7 h-7 text-white" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10"></div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 leading-tight">{portal.appLabel}</p>
                    <h3 className={`font-bold text-lg ${portal.brandColor} leading-tight`}>{portal.name}</h3>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('landing_modules_title')}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('landing_modules_desc')}</p>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">{t('landing_ai_title')}</h2>
              <p className="text-gray-600 text-lg mb-8">{t('landing_ai_desc')}</p>
              <div className="space-y-4">
                {[
                  { title: t('ai_paper_generator'), desc: t('ai_paper_generator_desc') },
                  { title: t('ai_event_designer'), desc: t('ai_event_designer_desc') },
                  { title: t('ai_tino_chat'), desc: t('ai_tino_chat_desc') },
                  { title: t('ai_smart_analytics'), desc: t('ai_smart_analytics_desc') },
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
                  <span className="font-semibold text-sm text-gray-900">{t('tino_ai_assistant')}</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-[80%]">Show me today's attendance summary</div>
                  <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white ml-auto max-w-[80%]">Today's attendance: 94.2% present (1,245 out of 1,321 students). Class 10-A has lowest at 88%.</div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-[80%]">Generate Math paper for Class 8</div>
                  <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white ml-auto max-w-[80%]">Generating... Your Class 8 Math paper with 5 sections is ready for download!</div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">{t('ai_powered_by')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50" id="why-us">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('landing_why_title')}</h2>
            <p className="text-gray-600 text-lg">{t('landing_why_desc')}</p>
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing_cta_title')}</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">{t('landing_cta_desc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              {t('landing_cta_btn')} <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-base hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2">
              {t('sign_in')}
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
              <p className="text-sm text-gray-400 leading-relaxed">{t('landing_footer_desc')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t('portals')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>SchoolTino (Admin)</li>
                <li>TeachTino (Teacher)</li>
                <li>StudyTino (Student)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t('features')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('ai_paper_feature')}</li>
                <li>{t('smart_attendance_feature')}</li>
                <li>{t('fee_management_feature')}</li>
                <li>{t('communication_hub_feature')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t('support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('help_center')}</li>
                <li>{t('contact_us')}</li>
                <li>{t('training_videos')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>{t('landing_footer_tagline')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
