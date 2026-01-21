/**
 * ADMIT CARD PREVIEW - Print-ready with QR Code
 * - Shows student details
 * - School info, exam schedule
 * - QR code for verification at exam hall
 * - Signature & Seal
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const AdmitCardPreview = ({ admitCard, onClose }) => {
  if (!admitCard) return null;

  const { school, student, exam, signature, seal, qr_data } = admitCard;

  const handlePrint = () => {
    window.print();
  };

  const qrValue = JSON.stringify(qr_data || {
    type: 'admit_card',
    student_id: student?.id,
    exam_id: exam?.id,
    admit_card_no: admitCard.admit_card_no
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Controls - Hidden in print */}
        <div className="p-4 border-b flex items-center justify-between print:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Admit Card Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Admit Card - Print Area */}
        <div className="p-6 print:p-4" id="admit-card-print">
          {/* Border Design */}
          <div className="border-4 border-indigo-900 rounded-lg p-4 print:border-2">
            
            {/* Header with School Info & QR */}
            <div className="flex items-start justify-between border-b-2 border-indigo-900 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {school?.logo_url && (
                  <img 
                    src={school.logo_url} 
                    alt="School Logo" 
                    className="w-16 h-16 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-indigo-900">{school?.name || 'School Name'}</h1>
                  <p className="text-sm text-gray-600">{school?.address}</p>
                  {school?.phone && <p className="text-sm text-gray-600">📞 {school.phone}</p>}
                </div>
              </div>
              
              {/* QR Code for Verification */}
              <div className="text-center">
                <QRCodeSVG 
                  value={qrValue}
                  size={80}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-xs text-gray-500 mt-1">Scan to Verify</p>
              </div>
            </div>

            {/* Admit Card Title */}
            <div className="text-center mb-4 bg-indigo-900 text-white py-2 rounded">
              <h2 className="text-lg font-bold">ADMIT CARD / प्रवेश पत्र</h2>
              <p className="text-sm">{exam?.name} - {exam?.type?.toUpperCase()}</p>
            </div>

            {/* Student Info with Photo */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600 w-32">Admit Card No:</td>
                      <td className="py-2 font-bold text-indigo-900">{admitCard.admit_card_no}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">Student Name:</td>
                      <td className="py-2 font-bold">{student?.name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">Father's Name:</td>
                      <td className="py-2">{student?.father_name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">Mother's Name:</td>
                      <td className="py-2">{student?.mother_name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">Class / Section:</td>
                      <td className="py-2">{student?.class} {student?.section && `- ${student.section}`}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">Roll No:</td>
                      <td className="py-2 font-bold">{student?.roll_no}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium text-gray-600">DOB:</td>
                      <td className="py-2">{student?.dob}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Student Photo */}
              <div className="w-28 flex flex-col items-center">
                <div className="w-24 h-28 border-2 border-gray-400 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {student?.photo_url ? (
                    <img 
                      src={student.photo_url} 
                      alt="Student Photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">👤</span>
                  )}
                </div>
                <p className="text-xs text-center mt-1 text-gray-500">Passport Photo</p>
              </div>
            </div>

            {/* Exam Schedule */}
            {exam?.subjects && exam.subjects.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-indigo-900 mb-2 border-b pb-1">Exam Schedule / परीक्षा कार्यक्रम</h3>
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Subject</th>
                      <th className="border p-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.subjects.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="border p-2">{sub.date}</td>
                        <td className="border p-2 font-medium">{sub.subject}</td>
                        <td className="border p-2">{sub.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Exam Dates */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm">
                <strong>Exam Duration:</strong> {exam?.start_date} to {exam?.end_date}
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <h3 className="font-bold text-indigo-900 mb-2 border-b pb-1">Instructions / निर्देश</h3>
              <ol className="text-xs list-decimal list-inside space-y-1 text-gray-700">
                {(exam?.instructions || [
                  "विद्यार्थी को परीक्षा से 15 मिनट पहले उपस्थित होना अनिवार्य है।",
                  "प्रवेश पत्र के बिना परीक्षा में बैठने की अनुमति नहीं होगी।",
                  "परीक्षा कक्ष में मोबाइल फोन ले जाना वर्जित है।",
                  "अपना लेखन सामग्री स्वयं लाएं।"
                ]).map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ol>
            </div>

            {/* Signature & Seal */}
            <div className="flex justify-between items-end pt-4 border-t-2 border-dashed">
              <div className="text-center">
                <div className="w-24 h-12 border-b border-gray-400 mb-1"></div>
                <p className="text-xs text-gray-600">Student's Signature</p>
              </div>
              
              {seal?.image_url && (
                <div className="text-center">
                  <img 
                    src={seal.image_url} 
                    alt="School Seal" 
                    className="w-16 h-16 object-contain opacity-70"
                  />
                </div>
              )}
              
              <div className="text-center">
                {signature?.image_url ? (
                  <img 
                    src={signature.image_url} 
                    alt="Authority Signature" 
                    className="w-24 h-12 object-contain"
                  />
                ) : (
                  <div className="w-24 h-12 border-b border-gray-400 mb-1"></div>
                )}
                <p className="text-xs text-gray-600">
                  {signature?.authority === 'principal' ? 'Principal' : 
                   signature?.authority === 'class_teacher' ? 'Class Teacher' : 'Director'}
                </p>
              </div>
            </div>

            {/* Footer with QR Note */}
            <div className="mt-4 pt-2 border-t text-center">
              <p className="text-xs text-gray-500">
                📱 QR Code scan करें परीक्षा हॉल में entry verify करने के लिए
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Valid Until: {exam?.end_date || admitCard.valid_until}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmitCardPreview;
