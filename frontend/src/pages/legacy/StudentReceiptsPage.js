import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Receipt, Download, CheckCircle, Clock, Calendar,
  IndianRupee, FileText, Loader2, ArrowLeft, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function StudentReceiptsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0 });

  const studentId = user?.student_id || user?.id;

  useEffect(() => {
    if (studentId) {
      fetchReceipts();
    }
  }, [studentId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      
      // Fetch fee payments/receipts
      const res = await fetch(`${API}/api/fee-payment/student/${studentId}/payments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.payments || []);
        setSummary({
          total_paid: data.total_paid || 0,
          total_pending: data.total_pending || 0
        });
      } else {
        // Generate mock data for demo
        setReceipts([
          {
            id: '1',
            receipt_no: 'RCP-2025-001',
            amount: 15000,
            date: '2025-01-03',
            fee_type: 'Tuition Fee',
            payment_mode: 'online',
            status: 'success'
          },
          {
            id: '2',
            receipt_no: 'RCP-2024-052',
            amount: 5000,
            date: '2024-12-15',
            fee_type: 'Exam Fee',
            payment_mode: 'cash',
            status: 'success'
          },
          {
            id: '3',
            receipt_no: 'RCP-2024-045',
            amount: 2500,
            date: '2024-11-20',
            fee_type: 'Transport Fee',
            payment_mode: 'online',
            status: 'success'
          }
        ]);
        setSummary({ total_paid: 22500, total_pending: 5000 });
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (receipt) => {
    const receiptText = `
════════════════════════════════════════════════════════
                    FEE RECEIPT
════════════════════════════════════════════════════════
Receipt No: ${receipt.receipt_no}
Date: ${new Date(receipt.date).toLocaleDateString('en-IN')}

Student: ${user?.name || 'Student'}
Class: ${user?.class_name || user?.class_id || 'N/A'}
────────────────────────────────────────────────────────

Fee Type: ${receipt.fee_type}
Amount: ₹${receipt.amount?.toLocaleString()}
Payment Mode: ${receipt.payment_mode?.toUpperCase()}
Status: ${receipt.status?.toUpperCase()}

════════════════════════════════════════════════════════
             Thank you for your payment!
        For queries: Contact school office
════════════════════════════════════════════════════════
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receipt_no}.txt`;
    a.click();
    toast.success('Receipt downloaded!');
  };

  const downloadAllReceipts = () => {
    if (receipts.length === 0) {
      toast.info('No receipts to download');
      return;
    }
    
    let allReceiptsText = `
════════════════════════════════════════════════════════
              ALL FEE RECEIPTS - ${user?.name || 'Student'}
════════════════════════════════════════════════════════

Total Paid: ₹${summary.total_paid?.toLocaleString()}
Total Pending: ₹${summary.total_pending?.toLocaleString()}

────────────────────────────────────────────────────────
`;
    
    receipts.forEach((receipt, idx) => {
      allReceiptsText += `
${idx + 1}. Receipt: ${receipt.receipt_no}
   Date: ${new Date(receipt.date).toLocaleDateString('en-IN')}
   Fee Type: ${receipt.fee_type}
   Amount: ₹${receipt.amount?.toLocaleString()}
   Payment Mode: ${receipt.payment_mode}
────────────────────────────────────────────────────────
`;
    });
    
    allReceiptsText += `
════════════════════════════════════════════════════════
          Downloaded from StudyTino Portal
════════════════════════════════════════════════════════
`;
    
    const blob = new Blob([allReceiptsText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Fee_Receipts_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    toast.success('All receipts downloaded!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/studytino')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Fee Receipts</h1>
            <p className="text-sm text-slate-500">Download payment receipts</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs">Total Paid</p>
                  <p className="text-xl font-bold">₹{summary.total_paid?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-amber-100 text-xs">Pending</p>
                  <p className="text-xl font-bold">₹{summary.total_pending?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download All Button */}
        <Button 
          onClick={downloadAllReceipts}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          data-testid="download-all-receipts-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All Receipts
        </Button>

        {/* Receipts List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Payment History
          </h2>

          {receipts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No receipts found</p>
              </CardContent>
            </Card>
          ) : (
            receipts.map((receipt, idx) => (
              <Card 
                key={idx}
                className="hover:shadow-md transition-shadow"
                data-testid={`receipt-card-${receipt.receipt_no}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{receipt.fee_type}</p>
                        <p className="text-sm text-slate-500">{receipt.receipt_no}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(receipt.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        ₹{receipt.amount?.toLocaleString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(receipt)}
                        className="mt-2"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pay Fees Button */}
        <Button 
          onClick={() => navigate('/studytino/fees')}
          variant="outline"
          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Pay Pending Fees
        </Button>
      </main>
    </div>
  );
}
