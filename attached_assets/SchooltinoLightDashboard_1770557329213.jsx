import React, { useState } from 'react';
import { 
  Home, Users, GraduationCap, Calendar, BookOpen, FileText, 
  Clock, DollarSign, Bus, Settings, Search, Bell, Filter, 
  Plus, ChevronLeft, ChevronRight, MoreVertical, CheckCircle, 
  Clock as ClockIcon, AlertCircle, FileCheck, FileX, UserMinus,
  ChevronDown
} from 'lucide-react';

const SchooltinoLightDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { section: 'Main', items: [
      { icon: Home, label: 'Dashboard', active: true },
      { icon: Users, label: 'Students', active: false },
      { icon: GraduationCap, label: 'Teachers', active: false },
      { icon: Calendar, label: 'Attendance', active: false },
    ]},
    { section: 'Academics', items: [
      { icon: BookOpen, label: 'Classes', active: false },
      { icon: FileText, label: 'Exams', active: false },
      { icon: GraduationCap, label: 'Results', active: false },
      { icon: Clock, label: 'Timetable', active: false },
    ]},
    { section: 'Administration', items: [
      { icon: DollarSign, label: 'Fees', active: false },
      { icon: Bus, label: 'Transport', active: false },
      { icon: Settings, label: 'Settings', active: false },
    ]}
  ];

  const stats = [
    { label: 'Overall Enrolling', value: '36,349', icon: Users, subtext: 'Total students enrolled' },
    { label: 'Overall Absents', value: '0', icon: UserMinus, subtext: 'Students absent today' },
    { label: 'Overall Scanned', value: '8,230', icon: CheckCircle, subtext: 'Documents scanned' },
    { label: 'Overall Pending', value: '23,506', icon: ClockIcon, subtext: 'Pending verification' },
    { label: 'Overall Verified', value: '7,514', icon: FileCheck, subtext: 'Verified documents' },
    { label: 'Overall Unverified', value: '24,221', icon: AlertCircle, subtext: 'Awaiting verification' },
    { label: 'Overall Corrupted', value: '592', icon: FileX, subtext: 'Corrupted files' },
    { label: 'Overall Un-Corrupted', value: '357,848', icon: FileText, subtext: 'Valid files' },
  ];

  const subjects = [
    { name: 'Renewable Energy Theory', code: 'ESE - 25UEC5367', enrolling: 193, absents: 0, scanned: 0, unscanned: 193, examDate: '02/12/2025', lastScanned: '01/01/1970' },
    { name: 'Analog Circuits Practical', code: 'ESE - 25UEC1302P', enrolling: 156, absents: 0, scanned: 0, unscanned: 156, examDate: '02/12/2025', lastScanned: '05/08/1970' },
    { name: 'Analog Circuits Theory', code: 'ESE - 25UEC1302T', enrolling: 166, absents: 0, scanned: 0, unscanned: 166, examDate: '02/12/2025', lastScanned: '01/01/1970' },
    { name: 'Digital Signal Processing Practical', code: 'ESE - 25UEC1303P', enrolling: 156, absents: 0, scanned: 0, unscanned: 156, examDate: '02/12/2025', lastScanned: '01/01/1970' },
    { name: 'Digital Signal Processing Theory', code: 'ESE - 25UEC1303T', enrolling: 566, absents: 0, scanned: 0, unscanned: 566, examDate: '02/12/2025', lastScanned: '01/01/1970' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col fixed h-screen transition-all duration-300 overflow-hidden z-50`}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
              📚
            </div>
            <span className="text-xl font-bold text-slate-800">Schooltino</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map((section, idx) => (
            <div key={idx} className="mb-5">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 px-3 font-semibold">
                {section.section}
              </div>
              {section.items.map((item, itemIdx) => (
                <a
                  key={itemIdx}
                  href="#"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 text-sm transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-slate-800">John Doe</div>
              <div className="text-xs text-slate-500">School Director</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
              <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Action Buttons */}
              <button className="relative p-2.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <button className="p-2.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Grid - 8 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                  <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Scanning Subject List */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Scanning Subject List</h2>
                <p className="text-sm text-slate-500 mt-1">List of subjects that require scanning. Use the "Open" action to view details and continue the scan workflow.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search keyword"
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm w-56 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Subject Name <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Enrolling <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Absents <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Scanned <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Unscanned <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Exam Date <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Last Scanned Date <ChevronDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">{subject.name}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{subject.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.enrolling}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.absents}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.scanned}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.unscanned}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.examDate}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{subject.lastScanned}</td>
                      <td className="px-6 py-4">
                        <button className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm text-slate-500">Showing 1 to 5 of 236 entries</span>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded text-sm font-medium">1</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-sm">2</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-sm">3</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-sm">4</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-sm">5</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-600 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchooltinoLightDashboard;