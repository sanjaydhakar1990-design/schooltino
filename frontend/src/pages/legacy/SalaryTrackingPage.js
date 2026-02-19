import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  IndianRupee, CheckCircle, Clock, AlertCircle, Calendar,
  Download, TrendingUp, Loader2, Receipt, FileText, ChevronRight,
  Wallet, CreditCard, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function SalaryTrackingPage() {
  const { user, schoolId, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salaryStatus, setSalaryStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSlipDialog, setShowSlipDialog] = useState(false);
  const [currentSlip, setCurrentSlip] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSalaryStatus();
    }
  }, [user, selectedYear]);

  const fetchSalaryStatus = async () => {
    try {
      setLoading(true);
      const staffId = user?.id;
      const res = await fetch(`${API}/api/salary/status/${staffId}?year=${selectedYear}`);
      
      if (res.ok) {
        const data = await res.json();
        setSalaryStatus(data);
      } else {
        // Create mock data if no salary data exists
        setSalaryStatus({
          staff_id: staffId,
          staff_name: user?.name,
          designation: user?.role || 'Teacher',
          year: selectedYear,
          salary_structure: {
            gross: 35000,
            net: 32000,
            deductions: 3000
          },
          summary: {
            total_paid_this_year: 0,
            total_pending: 0,
            months_paid: 0,
            months_pending: 0
          },
          monthly_breakdown: generateMockMonthlyData()
        });
      }
    } catch (error) {
      console.error('Error fetching salary status:', error);
      toast.error('Salary data load nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  const generateMockMonthlyData = () => {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    return months.map((month, idx) => {
      const monthNum = parseInt(month);
      const isPast = selectedYear < currentYear || (selectedYear === currentYear && monthNum <= currentMonth);
      const isFuture = selectedYear > currentYear || (selectedYear === currentYear && monthNum > currentMonth);
      
      // Random status for past months (for demo)
      let status = 'upcoming';
      if (isPast && !isFuture) {
        status = Math.random() > 0.3 ? 'credited' : 'due';
      }
      
      return {
        month: `${selectedYear}-${month}`,
        month_name: monthNames[idx],
        expected_salary: 32000,
        paid_amount: status === 'credited' ? 32000 : 0,
        status: status,
        payment_date: status === 'credited' ? `${selectedYear}-${month}-28` : null,
        transaction_id: status === 'credited' ? `TXN${Math.random().toString(36).substr(2, 8).toUpperCase()}` : null
      };
    });
  };

  const fetchSalarySlip = async (slipNo) => {
    setSlipLoading(true);
    try {
      const res = await fetch(`${API}/api/salary/slip/${slipNo}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSlip(data);
        setShowSlipDialog(true);
      } else {
        toast.error('Salary slip not found');
      }
    } catch (error) {
      // Show mock slip for demo
      setCurrentSlip({
        slip_no: slipNo,
        staff_name: user?.name,
        month: `${selectedYear}-01`,
        payment_date: new Date().toISOString(),
        earnings: {
          basic: 25000,
          hra: 5000,
          da: 2500,
          ta: 1500,
          medical: 1000,
          special: 0,
          gross: 35000
        },
        deductions: {
          pf: 2100,
          tax: 800,
          other: 100,
          total: 3000
        },
        net_salary: 32000,
        payment_mode: 'bank_transfer',
        school: {
          name: 'Schooltino Demo School',
          address: 'MP, India'
        }
      });
      setShowSlipDialog(true);
    } finally {
      setSlipLoading(false);
    }
  };

  const downloadSlip = () => {
    if (!currentSlip) return;
    
    const slipText = `
═══════════════════════════════════════════════════════
              SALARY SLIP - ${currentSlip.month}
═══════════════════════════════════════════════════════
${currentSlip.school?.name || 'School Name'}
${currentSlip.school?.address || ''}
───────────────────────────────────────────────────────
Employee: ${currentSlip.staff_name}
Slip No: ${currentSlip.slip_no}
Month: ${currentSlip.month}
Payment Date: ${new Date(currentSlip.payment_date).toLocaleDateString('en-IN')}
───────────────────────────────────────────────────────

EARNINGS                          DEDUCTIONS
─────────────                     ────────────
Basic:       ₹${currentSlip.earnings?.basic?.toLocaleString()}       PF:    ₹${currentSlip.deductions?.pf?.toLocaleString()}
HRA:         ₹${currentSlip.earnings?.hra?.toLocaleString()}       Tax:   ₹${currentSlip.deductions?.tax?.toLocaleString()}
DA:          ₹${currentSlip.earnings?.da?.toLocaleString()}       Other: ₹${currentSlip.deductions?.other?.toLocaleString()}
TA:          ₹${currentSlip.earnings?.ta?.toLocaleString()}
Medical:     ₹${currentSlip.earnings?.medical?.toLocaleString()}
Special:     ₹${currentSlip.earnings?.special?.toLocaleString()}
─────────────                     ────────────
Gross:       ₹${currentSlip.earnings?.gross?.toLocaleString()}       Total: ₹${currentSlip.deductions?.total?.toLocaleString()}

═══════════════════════════════════════════════════════
              NET SALARY: ₹${currentSlip.net_salary?.toLocaleString()}
═══════════════════════════════════════════════════════
Payment Mode: ${currentSlip.payment_mode?.replace('_', ' ').toUpperCase()}

This is a computer generated slip.
    `;
    
    const blob = new Blob([slipText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-slip-${currentSlip.month}.txt`;
    a.click();
    toast.success('Salary slip downloaded!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'due': return 'bg-red-100 text-red-700 border-red-200';
      case 'upcoming': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'credited': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'due': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'upcoming': return <Clock className="w-5 h-5 text-slate-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  const paidMonths = salaryStatus?.monthly_breakdown?.filter(m => m.status === 'credited').length || 0;
  const dueMonths = salaryStatus?.monthly_breakdown?.filter(m => m.status === 'due').length || 0;

  return (
    <div className="space-y-6" data-testid="salary-tracking-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-600" />
            My Salary
          </h1>
          <p className="text-slate-500 mt-1">Track your monthly salary status</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 px-3"
          >
            {[2025, 2024, 2023, 2022].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button 
            variant="outline"
            onClick={() => {
              // Download all salary slips for the year
              const paidSlips = salaryStatus?.monthly_breakdown?.filter(m => m.status === 'credited') || [];
              if (paidSlips.length === 0) {
                toast.info('No paid salary slips to download');
                return;
              }
              paidSlips.forEach(slip => {
                fetchSalarySlip(slip.slip_no || `SLIP-${slip.month}`);
              });
              toast.success(`Downloading ${paidSlips.length} salary slips...`);
            }}
            data-testid="download-all-slips-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Slips
          </Button>
        </div>
      </div>

      {/* Salary Structure Card */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm">Monthly Salary</p>
              <p className="text-4xl font-bold mt-1">
                ₹{salaryStatus?.salary_structure?.net?.toLocaleString() || '32,000'}
              </p>
              <p className="text-emerald-200 text-sm mt-2">
                Gross: ₹{salaryStatus?.salary_structure?.gross?.toLocaleString() || '35,000'} | 
                Deductions: ₹{salaryStatus?.salary_structure?.deductions?.toLocaleString() || '3,000'}
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <IndianRupee className="w-10 h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Credited</p>
                <p className="text-xl font-bold text-emerald-600">{paidMonths} months</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Due</p>
                <p className="text-xl font-bold text-red-600">{dueMonths} months</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Received</p>
                <p className="text-xl font-bold text-indigo-600">
                  ₹{(paidMonths * (salaryStatus?.salary_structure?.net || 32000)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-xl font-bold text-amber-600">
                  ₹{(dueMonths * (salaryStatus?.salary_structure?.net || 32000)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Monthly Status - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {salaryStatus?.monthly_breakdown?.map((month, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border-2 ${getStatusColor(month.status)} transition-all hover:shadow-md cursor-pointer`}
                onClick={() => month.status === 'credited' && fetchSalarySlip(month.slip_no || `SLIP-${month.month}`)}
                data-testid={`month-card-${month.month}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{month.month_name}</span>
                  {getStatusIcon(month.status)}
                </div>
                <p className="text-lg font-bold">
                  ₹{month.expected_salary?.toLocaleString()}
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    month.status === 'credited' ? 'bg-emerald-200 text-emerald-800' :
                    month.status === 'due' ? 'bg-red-200 text-red-800' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {month.status}
                  </span>
                </div>
                {month.status === 'credited' && month.payment_date && (
                  <p className="text-xs mt-2 opacity-70">
                    Paid: {new Date(month.payment_date).toLocaleDateString('en-IN')}
                  </p>
                )}
                {month.status === 'credited' && (
                  <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                    <Receipt className="w-3 h-3" />
                    <span>Click for slip</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-300 rounded"></div>
          <span className="text-sm text-slate-600">Credited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span className="text-sm text-slate-600">Due/Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-100 border-2 border-slate-300 rounded"></div>
          <span className="text-sm text-slate-600">Upcoming</span>
        </div>
      </div>

      {/* Salary Slip Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Salary Slip
            </DialogTitle>
            <DialogDescription>
              {currentSlip?.month} | {currentSlip?.slip_no}
            </DialogDescription>
          </DialogHeader>

          {currentSlip && (
            <div className="space-y-4 mt-4">
              {/* School Info */}
              <div className="text-center pb-3 border-b">
                <p className="font-bold text-lg">{currentSlip.school?.name}</p>
                <p className="text-sm text-slate-500">{currentSlip.school?.address}</p>
              </div>

              {/* Employee Info */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-medium">{currentSlip.staff_name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Month:</span>
                  <span className="font-medium">{currentSlip.month}</span>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-emerald-700 mb-2">Earnings</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span>₹{currentSlip.earnings?.basic?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA</span>
                    <span>₹{currentSlip.earnings?.hra?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dearness Allowance</span>
                    <span>₹{currentSlip.earnings?.da?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Allowance</span>
                    <span>₹{currentSlip.earnings?.ta?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical</span>
                    <span>₹{currentSlip.earnings?.medical?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700 pt-2 border-t">
                    <span>Gross Salary</span>
                    <span>₹{currentSlip.earnings?.gross?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Deductions</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Provident Fund</span>
                    <span>₹{currentSlip.deductions?.pf?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{currentSlip.deductions?.tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other</span>
                    <span>₹{currentSlip.deductions?.other?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-red-700 pt-2 border-t">
                    <span>Total Deductions</span>
                    <span>₹{currentSlip.deductions?.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-emerald-600 text-white rounded-xl p-4 text-center">
                <p className="text-emerald-100 text-sm">Net Salary</p>
                <p className="text-3xl font-bold">₹{currentSlip.net_salary?.toLocaleString()}</p>
              </div>

              <Button onClick={downloadSlip} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Salary Slip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
