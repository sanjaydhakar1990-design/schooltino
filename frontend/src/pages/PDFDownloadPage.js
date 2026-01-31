/**
 * PDF Download Page
 */

import React from 'react';
import { Download, FileText, Share2, MessageCircle } from 'lucide-react';

const PDFDownloadPage = () => {
  const pdfUrl = '/Schooltino_Marketing_Brochure.pdf';
  const whatsappNumber = '917879967616';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Schooltino_Marketing_Brochure.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareOnWhatsApp = () => {
    const text = `🏫 *Schooltino - AI School Management*\n\nभारत का सबसे Advanced School Software!\n\n📄 Brochure देखें: https://learnportal-132.preview.emergentagent.com/marketing\n\n📞 Contact: +91 78799 67616`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Schooltino Marketing Brochure
        </h1>
        <p className="text-gray-600 mb-6">
          PDF Download करें और Share करें!
        </p>

        <div className="space-y-4">
          <a 
            href={pdfUrl}
            download="Schooltino_Marketing_Brochure.pdf"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            Download PDF (1.6 MB)
          </a>

          <button
            onClick={shareOnWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp पर Share करें
          </button>

          <a
            href="/marketing"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            Live Page देखें →
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">Contact:</p>
          <a href="tel:+917879967616" className="text-lg font-bold text-indigo-600">
            📞 +91 78799 67616
          </a>
        </div>
      </div>
    </div>
  );
};

export default PDFDownloadPage;
