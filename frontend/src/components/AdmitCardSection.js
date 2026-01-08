/**
 * ADMIT CARD COMPONENT - For StudyTino (Student App)
 * Shows admit cards with fee payment integration
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, Download, CreditCard, CheckCircle, AlertCircle, Calendar,
  User, School, Clock, BookOpen, Award, Printer, Share2, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

const AdmitCardSection = ({ studentId, schoolId }) => {
  const [admitCards, setAdmitCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (studentId && schoolId) {
      fetchAdmitCards();
    } else {
      setLoading(false);
      setError('Student या School ID नहीं मिली');
    }
  }, [studentId, schoolId]);

  const fetchAdmitCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/admit-card/student/${schoolId}/${studentId}`);
      setAdmitCards(res.data.admit_cards || []);
    } catch (err) {
      console.error('Error fetching admit cards:', err);
      setError('Admit cards load नहीं हो पाए। शायद अभी कोई exam नहीं है।');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (card) => {
    if (!card.is_eligible) {
      setSelectedCard(card);
      setPaymentAmount(card.min_amount_required);
      setShowPayment(true);
      return;
    }

    if (card.is_generated && card.admit_card) {
      setSelectedCard(card);
      // Open print dialog
      setTimeout(() => {
        window.print();
      }, 500);
    } else {
      // Generate admit card
      try {
        setProcessing(true);
        const res = await axios.get(`${API}/admit-card/generate/${schoolId}/${card.exam_id}/${studentId}`);
        if (res.data.success) {
          toast.success('Admit Card generated!');
          fetchAdmitCards();
        } else {
          toast.error(res.data.message || 'Generation failed');
        }
      } catch (err) {
        toast.error('Admit card generate नहीं हो पाया');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handlePayAndDownload = async () => {
    if (!selectedCard) return;
    
    setProcessing(true);
    try {
      const res = await axios.post(`${API}/admit-card/pay-and-download`, {
        school_id: schoolId,
        student_id: studentId,
        exam_id: selectedCard.exam_id,
        amount: paymentAmount,
        payment_method: 'online'
      });

      if (res.data.success) {
        toast.success('Payment successful! Admit Card ready');
        setShowPayment(false);
        fetchAdmitCards();
      }
    } catch (err) {
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-amber-800 font-medium">{error}</p>
        <p className="text-sm text-amber-600 mt-2">Admin से संपर्क करें या बाद में try करें</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Admit Cards / प्रवेश पत्र
        </h2>
      </div>

      {admitCards.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">कोई Admit Card उपलब्ध नहीं है</p>
          <p className="text-sm text-gray-500 mt-2">जब exam schedule होगी, admit card यहाँ दिखेगा</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {admitCards.map((card) => (
            <div 
              key={card.exam_id}
              className={`bg-white rounded-xl border-2 overflow-hidden ${
                card.is_eligible ? 'border-green-200' : 'border-amber-200'
              }`}
            >
              <div className={`px-4 py-3 ${
                card.is_eligible ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      card.is_eligible ? 'bg-green-500' : 'bg-amber-500'
                    }`}>
                      {card.is_eligible ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.exam_name}</h3>
                      <p className="text-sm text-gray-600">{card.exam_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {card.start_date} - {card.end_date}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Fee Status */}
                {card.fee_status && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Fee Status</span>
                      <span className={`text-sm font-medium ${
                        card.is_eligible ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {card.fee_status.paid_percentage}% Paid
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          card.is_eligible ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, card.fee_status.paid_percentage)}%` }}
                      ></div>
                    </div>
                    {!card.is_eligible && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Minimum ₹{card.min_amount_required} fee जमा करें
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleDownload(card)}
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    card.is_eligible 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : card.is_eligible ? (
                    <>
                      <Download className="w-5 h-5" />
                      Download Admit Card
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay ₹{card.min_amount_required} & Download
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Fee Payment Required
            </h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-800">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                Admit Card download करने के लिए minimum fee जमा करें
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fee</span>
                <span className="font-medium">₹{selectedCard.fee_status?.total_fee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">₹{selectedCard.fee_status?.paid_fee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-red-600">₹{selectedCard.fee_status?.pending_fee || 0}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Minimum Required</span>
                <span className="font-bold text-lg text-indigo-600">₹{paymentAmount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayAndDownload}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{paymentAmount}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Admit Card */}
      {selectedCard?.admit_card && (
        <div className="hidden print:block">
          <AdmitCardPrint data={selectedCard.admit_card} />
        </div>
      )}
    </div>
  );
};

// Printable Admit Card Component
const AdmitCardPrint = ({ data }) => {
  if (!data) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{data.school?.name}</h1>
        <p className="text-sm text-gray-600">{data.school?.address}</p>
        <p className="text-sm text-gray-600">Phone: {data.school?.phone}</p>
      </div>

      {/* Title */}
      <div className="text-center bg-indigo-600 text-white py-2 mb-4">
        <h2 className="text-xl font-bold">ADMIT CARD / प्रवेश पत्र</h2>
        <p className="text-sm">{data.exam?.name} - {data.exam?.type}</p>
      </div>

      {/* Student Info */}
      <div className="flex gap-6 mb-6">
        <div className="flex-1 space-y-2">
          <div className="flex">
            <span className="w-32 font-medium">Name / नाम:</span>
            <span className="font-bold">{data.student?.name}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">Father's Name:</span>
            <span>{data.student?.father_name}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">Roll No:</span>
            <span className="font-bold">{data.student?.roll_no}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">Class:</span>
            <span>{data.student?.class} {data.student?.section}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">DOB:</span>
            <span>{data.student?.dob}</span>
          </div>
        </div>
        <div className="w-32 h-40 border-2 border-gray-300 flex items-center justify-center">
          {data.student?.photo_url ? (
            <img src={data.student.photo_url} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs text-center">Photo</span>
          )}
        </div>
      </div>

      {/* Exam Schedule */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">Exam Schedule / परीक्षा समय सारिणी</h3>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-600">Start Date:</span>
            <span className="ml-2 font-medium">{data.exam?.start_date}</span>
          </div>
          <div>
            <span className="text-gray-600">End Date:</span>
            <span className="ml-2 font-medium">{data.exam?.end_date}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">Instructions / निर्देश</h3>
        <ol className="text-sm list-decimal list-inside space-y-1">
          {data.exam?.instructions?.map((instruction, idx) => (
            <li key={idx}>{instruction}</li>
          ))}
        </ol>
      </div>

      {/* Footer with Signature */}
      <div className="flex justify-between items-end mt-8 pt-4 border-t">
        <div className="text-center">
          <div className="w-32 h-16 border-b border-gray-400 mb-1"></div>
          <p className="text-xs">Student's Signature</p>
        </div>
        <div className="text-center">
          {data.seal?.image_url && (
            <img src={data.seal.image_url} alt="Seal" className="w-20 h-20 mx-auto" />
          )}
          <p className="text-xs">School Seal</p>
        </div>
        <div className="text-center">
          {data.signature?.image_url && (
            <img src={data.signature.image_url} alt="Signature" className="w-24 h-12 mx-auto" />
          )}
          <div className="w-32 h-16 border-b border-gray-400 mb-1"></div>
          <p className="text-xs">{data.signature?.authority === 'director' ? 'Director' : 'Principal'}</p>
        </div>
      </div>

      {/* Admit Card Number */}
      <div className="text-center mt-4 text-xs text-gray-500">
        Admit Card No: {data.admit_card_no} | Generated: {new Date(data.generated_at).toLocaleString()}
      </div>
    </div>
  );
};

export default AdmitCardSection;
