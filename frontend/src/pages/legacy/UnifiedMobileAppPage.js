import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Smartphone, Shield, Users, GraduationCap, Bus, UserCheck,
  CheckCircle, Download, Cloud, RefreshCw, Wifi, WifiOff,
  Fingerprint, Globe, Bell, BookOpen, ClipboardList, Eye,
  MessageCircle, FileText, Calendar, Activity, MapPin, CreditCard
} from 'lucide-react';

const roleCards = [
  {
    title: 'Admin / Management',
    subtitle: 'Monitor fees, attendance, operations anytime',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    features: ['Real-time dashboards', 'Fee collection tracking', 'Staff management', 'Instant notifications']
  },
  {
    title: 'Teachers',
    subtitle: 'Manage lectures, planning, homework, exams',
    icon: BookOpen,
    color: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    features: ['Digital lesson plans', 'Homework assignment', 'Student performance tracking', 'Attendance marking']
  },
  {
    title: 'Parents',
    subtitle: 'Handle daily school tasks with ease',
    icon: Users,
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    features: ['Fee payments', 'Attendance tracking', 'Report card viewing', 'Direct messaging with teachers']
  },
  {
    title: 'Students',
    subtitle: 'Access all learning in one place',
    icon: GraduationCap,
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    features: ['Homework submissions', 'Study materials', 'Exam schedules', 'Activity feed']
  },
  {
    title: 'Vehicle Attenders',
    subtitle: 'Real-time tracking without additional hardware',
    icon: Bus,
    color: 'from-teal-500 to-cyan-600',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-600',
    features: ['NFC-based attendance', 'Route tracking', 'Student boarding log', 'Parent notifications']
  },
  {
    title: 'Security Guards',
    subtitle: 'Manage visitor entries without a computer',
    icon: UserCheck,
    color: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
    textColor: 'text-red-600',
    features: ['Visitor registration', 'OTP verification', 'Badge printing', 'Entry/exit logs']
  }
];

const stats = [
  { label: '6 Roles', icon: Users },
  { label: '1 App', icon: Smartphone },
  { label: '100% Cloud', icon: Cloud },
  { label: 'Real-time Sync', icon: RefreshCw }
];

const highlights = [
  { label: 'Works Offline', icon: WifiOff },
  { label: 'Biometric Login', icon: Fingerprint },
  { label: 'Multi-language', icon: Globe },
  { label: 'Push Notifications', icon: Bell }
];

export default function UnifiedMobileAppPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Unified Mobile App</h1>
            <p className="text-emerald-100 text-lg mt-1">One app. All roles. Total convenience.</p>
          </div>
        </div>
        <p className="text-emerald-100 text-sm max-w-2xl">
          एक ही app में सभी roles — Admin, Teacher, Parent, Student, Vehicle Attender और Security Guard सबके लिए powerful features।
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">सभी Roles के लिए Features</h2>
        <p className="text-sm text-gray-500 mb-5">Every stakeholder gets a tailored experience</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleCards.map((role, idx) => (
            <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-r ${role.color} p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{role.title}</h3>
                      <p className="text-white/80 text-xs">{role.subtitle}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {role.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5">
                      <CheckCircle className={`w-4 h-4 ${role.textColor} flex-shrink-0`} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-center">
            <Smartphone className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Download the App</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              अभी download करें और अपने school को smart बनाएं। Available on both platforms.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 h-auto text-sm font-semibold gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Google Play
                </Button>
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 h-auto text-sm font-semibold gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.5 17,21.13 15.66,21.13C14.32,21.13 13.73,20.37 12.13,20.37C10.5,20.37 9.83,21.16 8.6,21.16C7.28,21.16 6.32,20.43 5.47,19.32C4.04,17.44 2.93,14.57 4.44,12.58C5.38,11.36 6.82,10.62 8.35,10.59C9.7,10.56 10.93,11.44 11.7,11.44C12.47,11.44 13.96,10.37 15.6,10.54C16.28,10.58 17.87,10.83 18.86,12.27C18.77,12.33 16.83,13.46 16.86,15.87C16.88,18.75 19.35,19.68 19.38,19.69L18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  App Store
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">App Highlights</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((item, idx) => (
            <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
