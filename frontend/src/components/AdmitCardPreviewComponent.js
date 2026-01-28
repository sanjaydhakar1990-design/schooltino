/**
 * ADMIT CARD PREVIEW & PRINT COMPONENT
 * Professional admit card design with print functionality
 */

import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Printer, Download, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const AdmitCardPreviewComponent = ({ admitCardData, onClose }) => {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Admit_Card_${admitCardData?.student?.name || 'Student'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  if (!admitCardData) return null;

  const { student, exam, school, subjects = [], instructions = [] } = admitCardData;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="text-lg font-semibold">Admit Card Preview</h3>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={onClose} variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Admit Card Design */}
        <div ref={printRef} className="p-8 bg-white">
          {/* Header */}
          <div className="border-4 border-indigo-600 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              {school?.logo_url && (
                <img 
                  src={school.logo_url} 
                  alt="School Logo" 
                  className="w-20 h-20 mx-auto mb-3 object-contain"
                />
              )}
              <h1 className="text-2xl font-bold text-indigo-900">{school?.name || 'School Name'}</h1>
              <p className="text-sm text-gray-600">{school?.address || 'School Address'}</p>
              <p className="text-sm text-gray-600">
                📞 {school?.phone || 'N/A'} | 📧 {school?.email || 'N/A'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 rounded-lg">
              <h2 className="text-xl font-bold">ADMIT CARD / प्रवेश पत्र</h2>
              <p className="text-sm mt-1">{exam?.exam_name || 'Examination'}</p>
            </div>
          </div>

          {/* Student Details & Photo */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50 w-1/3">Student Name<br/>छात्र का नाम</td>
                    <td className="py-3 px-4 font-bold text-lg">{student?.name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50">Father's Name<br/>पिता का नाम</td>
                    <td className="py-3 px-4">{student?.father_name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50">Mother's Name<br/>माता का नाम</td>
                    <td className="py-3 px-4">{student?.mother_name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50">Class / Section<br/>कक्षा</td>
                    <td className="py-3 px-4 font-bold">{student?.class_name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50">Roll Number<br/>रोल नंबर</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{student?.roll_no || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-semibold bg-gray-50">Date of Birth<br/>जन्म तिथि</td>
                    <td className="py-3 px-4">{student?.dob || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Student Photo */}
            <div className="flex flex-col items-center">
              <div className="w-full h-48 border-4 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {student?.photo_url ? (
                  <img 
                    src={student.photo_url} 
                    alt="Student" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-2">👤</div>
                    <p className="text-xs">Photo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          {subjects && subjects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-indigo-900 mb-3 border-b-2 border-indigo-600 pb-2">
                📅 Exam Schedule / परीक्षा कार्यक्रम
              </h3>
              <table className="w-full border-collapse border-2 border-gray-300">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="border border-gray-300 py-2 px-3 text-left">Date<br/>तिथि</th>
                    <th className="border border-gray-300 py-2 px-3 text-left">Subject<br/>विषय</th>
                    <th className="border border-gray-300 py-2 px-3 text-center">Time<br/>समय</th>
                    <th className="border border-gray-300 py-2 px-3 text-center">Duration<br/>अवधि</th>
                    <th className="border border-gray-300 py-2 px-3 text-center">Max Marks<br/>पूर्णांक</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 py-2 px-3">{subject.exam_date || 'TBA'}</td>
                      <td className="border border-gray-300 py-2 px-3 font-medium">{subject.subject_name}</td>
                      <td className="border border-gray-300 py-2 px-3 text-center">{subject.exam_time || 'TBA'}</td>
                      <td className="border border-gray-300 py-2 px-3 text-center">{subject.duration || '3 hours'}</td>
                      <td className="border border-gray-300 py-2 px-3 text-center font-bold">{subject.max_marks || 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Exam Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Exam Dates / परीक्षा तिथियाँ</h4>
              <p className="text-sm">
                <strong>Start:</strong> {exam?.start_date || 'N/A'}<br/>
                <strong>End:</strong> {exam?.end_date || 'N/A'}
              </p>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Venue / परीक्षा केंद्र</h4>
              <p className="text-sm">{exam?.venue || school?.name || 'School Premises'}</p>
            </div>
          </div>

          {/* Instructions */}
          {instructions && instructions.length > 0 && (
            <div className="mb-6 border-2 border-amber-300 bg-amber-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-amber-900 mb-3">
                ⚠️ Important Instructions / महत्वपूर्ण निर्देश
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Signature & Seal Section */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t-2 border-gray-300">
            <div className="text-center">
              <div className="border-t-2 border-black pt-2 mt-12">
                <p className="font-semibold">Class Teacher<br/>कक्षा शिक्षक</p>
              </div>
            </div>
            <div className="text-center">
              {school?.seal_url && (
                <img 
                  src={school.seal_url} 
                  alt="School Seal" 
                  className="w-20 h-20 mx-auto mb-2"
                />
              )}
              <p className="text-xs text-gray-600">School Seal<br/>विद्यालय की मोहर</p>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black pt-2 mt-12">
                <p className="font-semibold">Principal/Director<br/>प्रधानाचार्य</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t pt-4">
            <p>📌 This admit card must be presented at the examination center</p>
            <p>यह प्रवेश पत्र परीक्षा केंद्र पर अनिवार्य रूप से प्रस्तुत करना होगा</p>
            <p className="mt-2">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmitCardPreviewComponent;
