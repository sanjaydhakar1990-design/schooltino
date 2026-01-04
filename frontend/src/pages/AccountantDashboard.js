import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Calculator, Users, Wallet, TrendingUp, AlertTriangle, Brain, 
  IndianRupee, ArrowUp, ArrowDown, Receipt, FileText, Plus,
  Loader2, CheckCircle, Clock, XCircle, Download, RefreshCw,
  PieChart, BarChart3, Send, Sparkles, User, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AccountantDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [processingPayAll, setProcessingPayAll] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    category: 'maintenance',
    amount: '',
    description: '',
    vendor_name: '',
    payment_method: 'bank_transfer'
  });

  const schoolId = user?.school_id || 'school1';

  useEffect(() => {
    fetchAllData();
  }, [schoolId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchAIInsight(),
        fetchSalaries(),
        fetchDefaulters(),
        fetchExpenses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/api/ai-accountant/dashboard/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const fetchAIInsight = async () => {
    try {
      const res = await fetch(`${API}/api/ai-accountant/ai/quick-insight/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data);
      }
    } catch (error) {
      console.error('AI insight error:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      const res = await fetch(`${API}/api/ai-accountant/salaries/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setSalaries(data.salaries || []);
      }
    } catch (error) {
      console.error('Salaries fetch error:', error);
    }
  };

  const fetchDefaulters = async () => {
    try {
      const res = await fetch(`${API}/api/ai-accountant/fees/defaulters/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setDefaulters(data.defaulters || []);
      }
    } catch (error) {
      console.error('Defaulters fetch error:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API}/api/ai-accountant/expenses/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Expenses fetch error:', error);
    }
  };

  const addExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) {
      toast.error('Amount aur description required hai');
      return;
    }

    try {
      const res = await fetch(`${API}/api/ai-accountant/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          school_id: schoolId,
          amount: parseFloat(expenseForm.amount)
        })
      });

      if (res.ok) {
        toast.success('Expense added successfully!');
        setShowAddExpense(false);
        setExpenseForm({
          category: 'maintenance',
          amount: '',
          description: '',
          vendor_name: '',
          payment_method: 'bank_transfer'
        });
        fetchExpenses();
        fetchDashboard();
      } else {
        toast.error('Expense add nahi ho paya');
      }
    } catch (error) {
      toast.error('Error adding expense');
    }
  };

  const payAllSalaries = async () => {
    setProcessingPayAll(true);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await fetch(`${API}/api/ai-accountant/salaries/pay-all?school_id=${schoolId}&month=${month}`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.updated_count || 'All'} salaries paid! ✅`);
        fetchSalaries();
        fetchDashboard();
      } else {
        toast.error('Salary payment failed');
      }
    } catch (error) {
      toast.error('Error processing salaries');
    } finally {
      setProcessingPayAll(false);
    }
  };

  const getAIAnalysis = async (type) => {
    setAiLoading(true);
    setShowAIAnalysis(true);
    try {
      const res = await fetch(`${API}/api/ai-accountant/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          analysis_type: type
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      } else {
        toast.error('AI analysis failed');
      }
    } catch (error) {
      toast.error('Error getting AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading Accountant Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="accountant-dashboard">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Calculator className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Accountant</h1>
                <p className="text-emerald-100">Smart Financial Management</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => getAIAnalysis('monthly_report')}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Report
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={fetchAllData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* AI Insight Card */}
        {aiInsight && (
          <Card className={`border-l-4 ${
            aiInsight.type === 'success' ? 'border-l-emerald-500 bg-emerald-50' :
            aiInsight.type === 'warning' ? 'border-l-amber-500 bg-amber-50' :
            'border-l-blue-500 bg-blue-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  aiInsight.type === 'success' ? 'bg-emerald-100' :
                  aiInsight.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <Sparkles className={`w-5 h-5 ${
                    aiInsight.type === 'success' ? 'text-emerald-600' :
                    aiInsight.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">AI Insight</p>
                  <p className="text-sm text-slate-600 mt-1">{aiInsight.insight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Fee Collected (Month)</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dashboardData?.overview?.fee_collected_this_month)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-100">Pending Fees</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dashboardData?.overview?.pending_fees)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Salary Paid (Month)</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dashboardData?.overview?.salary_paid_this_month)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-pink-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-rose-100">Expenses (Month)</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dashboardData?.overview?.expenses_this_month)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ArrowDown className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    Recent Fee Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.recent_transactions?.payments?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recent_transactions.payments.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{payment.student_name}</p>
                              <p className="text-xs text-slate-500 capitalize">{payment.fee_type}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No recent payments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-rose-600" />
                    Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.expenses_by_category?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.expenses_by_category.map((exp, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              idx === 0 ? 'bg-rose-500' :
                              idx === 1 ? 'bg-amber-500' :
                              idx === 2 ? 'bg-blue-500' : 'bg-slate-400'
                            }`} />
                            <span className="capitalize text-slate-700">{exp.category}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No expenses recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Salaries Tab */}
          <TabsContent value="salaries" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Staff Salaries
                  </CardTitle>
                  <Button
                    onClick={payAllSalaries}
                    disabled={processingPayAll}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processingPayAll ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Pay All Salaries
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm text-slate-500">Employee</th>
                        <th className="text-left py-3 px-4 text-sm text-slate-500">Designation</th>
                        <th className="text-right py-3 px-4 text-sm text-slate-500">Base</th>
                        <th className="text-right py-3 px-4 text-sm text-slate-500">Allowances</th>
                        <th className="text-right py-3 px-4 text-sm text-slate-500">Deductions</th>
                        <th className="text-right py-3 px-4 text-sm text-slate-500">Net Salary</th>
                        <th className="text-center py-3 px-4 text-sm text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((salary, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium">{salary.employee_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 capitalize">{salary.designation}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(salary.base_salary)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">+{formatCurrency(salary.allowances)}</td>
                          <td className="py-3 px-4 text-right text-rose-600">-{formatCurrency(salary.deductions)}</td>
                          <td className="py-3 px-4 text-right font-bold">{formatCurrency(salary.net_salary)}</td>
                          <td className="py-3 px-4 text-center">
                            {salary.status === 'paid' ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Defaulters Tab */}
          <TabsContent value="defaulters" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Fee Defaulters ({defaulters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {defaulters.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm text-slate-500">Student</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-500">Class</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-500">Father Name</th>
                          <th className="text-left py-3 px-4 text-sm text-slate-500">Contact</th>
                          <th className="text-center py-3 px-4 text-sm text-slate-500">Months Pending</th>
                          <th className="text-right py-3 px-4 text-sm text-slate-500">Amount Due</th>
                          <th className="text-center py-3 px-4 text-sm text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaulters.map((d, idx) => (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{d.student_name || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-600">{d.class_id || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-600">{d.father_name || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-600">{d.mobile || 'N/A'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs">
                                {d.months_pending} months
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-600">
                              {formatCurrency(d.total_pending)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button size="sm" variant="outline">
                                <Send className="w-3 h-3 mr-1" />
                                Remind
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                    <p className="text-lg font-medium text-emerald-600">No Fee Defaulters! 🎉</p>
                    <p className="text-sm">Sabhi students ki fees clear hai</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDown className="w-5 h-5 text-rose-600" />
                    School Expenses
                  </CardTitle>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.map((exp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            exp.category === 'salary' ? 'bg-blue-100' :
                            exp.category === 'maintenance' ? 'bg-amber-100' :
                            exp.category === 'utilities' ? 'bg-purple-100' : 'bg-slate-100'
                          }`}>
                            {exp.category === 'salary' ? <Users className="w-6 h-6 text-blue-600" /> :
                             exp.category === 'maintenance' ? <Building2 className="w-6 h-6 text-amber-600" /> :
                             <Receipt className="w-6 h-6 text-slate-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{exp.description}</p>
                            <p className="text-sm text-slate-500 capitalize">
                              {exp.category} • {exp.vendor_name || 'N/A'} • {exp.date}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-rose-600 text-lg">
                          -{formatCurrency(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No expenses recorded yet</p>
                    <Button className="mt-4" onClick={() => setShowAddExpense(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick AI Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Financial Analysis
            </CardTitle>
            <CardDescription>One-click AI reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => getAIAnalysis('fee_collection')}
              >
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <span>Fee Analysis</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => getAIAnalysis('salary_summary')}
              >
                <Users className="w-6 h-6 text-blue-600" />
                <span>Salary Summary</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => getAIAnalysis('expense_analysis')}
              >
                <PieChart className="w-6 h-6 text-rose-600" />
                <span>Expense Analysis</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => getAIAnalysis('monthly_report')}
              >
                <FileText className="w-6 h-6 text-purple-600" />
                <span>Monthly Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-rose-600" />
              Add New Expense
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="salary">Salary</option>
                <option value="maintenance">Maintenance</option>
                <option value="utilities">Utilities (Electricity, Water)</option>
                <option value="supplies">Supplies & Stationery</option>
                <option value="transport">Transport</option>
                <option value="events">Events & Functions</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Expense description..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vendor Name (Optional)</label>
              <Input
                value={expenseForm.vendor_name}
                onChange={(e) => setExpenseForm(f => ({ ...f, vendor_name: e.target.value }))}
                placeholder="Vendor/Supplier name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={expenseForm.payment_method}
                onChange={(e) => setExpenseForm(f => ({ ...f, payment_method: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <Button onClick={addExpense} className="w-full bg-rose-600 hover:bg-rose-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Financial Analysis
            </DialogTitle>
          </DialogHeader>
          {aiLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
              <p className="mt-4 text-slate-600">AI analyzing your financial data...</p>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-700 font-medium mb-2">
                  Analysis Type: {aiAnalysis.analysis_type?.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-xs text-purple-500">Period: {aiAnalysis.period}</p>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 rounded-xl p-4">
                  {aiAnalysis.ai_analysis}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const text = aiAnalysis.ai_analysis;
                  navigator.clipboard.writeText(text);
                  toast.success('Analysis copied!');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Copy Report
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
