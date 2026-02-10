import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Search,
  CreditCard, RefreshCw, Filter, Download, Users
} from 'lucide-react';

export default function StudentWalletPage() {
  const { schoolData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const walletStats = [
    { label: 'Total Balance', value: '₹2,45,000', icon: Wallet, color: 'gradient-card-blue', change: '+15%' },
    { label: 'Active Wallets', value: '342', icon: Users, color: 'gradient-card-purple', change: '+8%' },
    { label: 'Today\'s Recharges', value: '₹12,500', icon: ArrowDownLeft, color: 'gradient-card-teal', change: '+22%' },
    { label: 'Today\'s Deductions', value: '₹8,200', icon: ArrowUpRight, color: 'gradient-card-orange', change: '-5%' },
  ];

  const recentTransactions = [
    { id: 1, student: 'Aarav Sharma', class: 'Class 10-A', type: 'recharge', amount: '₹2,000', time: '10:30 AM', status: 'completed' },
    { id: 2, student: 'Priya Patel', class: 'Class 8-B', type: 'deduction', amount: '₹500', time: '11:15 AM', status: 'completed', reason: 'Science Lab Fee' },
    { id: 3, student: 'Rahul Singh', class: 'Class 12-A', type: 'recharge', amount: '₹5,000', time: '12:00 PM', status: 'completed' },
    { id: 4, student: 'Sneha Gupta', class: 'Class 9-C', type: 'deduction', amount: '₹350', time: '01:30 PM', status: 'completed', reason: 'Sports Day Entry' },
    { id: 5, student: 'Arjun Kumar', class: 'Class 11-B', type: 'recharge', amount: '₹1,500', time: '02:45 PM', status: 'pending' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'recharge', label: 'Recharge' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage digital wallets for cashless transactions</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Bulk Recharge
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {walletStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{stat.change}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-1 p-2 border-b border-gray-100">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button className="btn-secondary flex items-center gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Time</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{txn.student}</p>
                        <p className="text-xs text-gray-400">{txn.class}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${txn.type === 'recharge' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                        {txn.type === 'recharge' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {txn.type === 'recharge' ? 'Recharge' : 'Deduction'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-sm font-bold ${txn.type === 'recharge' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {txn.type === 'recharge' ? '+' : '-'}{txn.amount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-500">{txn.time}</td>
                    <td className="py-3.5 px-4">
                      <span className={`badge ${txn.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{txn.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
