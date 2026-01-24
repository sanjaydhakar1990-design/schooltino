/**
 * Document Upload Component for Students and Employees
 * Supports: Birth Certificate, Aadhar Card, TC, Caste Certificate, etc.
 */
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { 
  FileText, Upload, X, Eye, Check, AlertTriangle, 
  FileImage, File, Loader2, Download, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Document types for students
export const STUDENT_DOCUMENT_TYPES = [
  { id: 'birth_certificate', label: 'Birth Certificate (जन्म प्रमाण पत्र)', required: false, icon: '📄' },
  { id: 'aadhar_card', label: 'Aadhar Card (आधार कार्ड)', required: false, icon: '🆔' },
  { id: 'transfer_certificate', label: 'Transfer Certificate (TC)', required: false, icon: '📋' },
  { id: 'marksheet', label: 'Previous Marksheet (पिछली मार्कशीट)', required: false, icon: '📊' },
  { id: 'caste_certificate', label: 'Caste Certificate (जाति प्रमाण पत्र)', required: false, icon: '📜' },
  { id: 'income_certificate', label: 'Income Certificate (आय प्रमाण पत्र)', required: false, icon: '💰' },
  { id: 'domicile_certificate', label: 'Domicile Certificate (मूल निवास)', required: false, icon: '🏠' },
  { id: 'passport_photo', label: 'Passport Photo (पासपोर्ट फोटो)', required: false, icon: '📷' },
  { id: 'father_aadhar', label: 'Father Aadhar (पिता का आधार)', required: false, icon: '👨' },
  { id: 'mother_aadhar', label: 'Mother Aadhar (माता का आधार)', required: false, icon: '👩' },
  { id: 'bpl_card', label: 'BPL Card (बीपीएल कार्ड)', required: false, icon: '🎫' },
  { id: 'bank_passbook', label: 'Bank Passbook (बैंक पासबुक)', required: false, icon: '🏦' },
  { id: 'other', label: 'Other Document (अन्य)', required: false, icon: '📁' },
];

// Document types for employees
export const EMPLOYEE_DOCUMENT_TYPES = [
  { id: 'aadhar_card', label: 'Aadhar Card (आधार कार्ड)', required: true, icon: '🆔' },
  { id: 'pan_card', label: 'PAN Card (पैन कार्ड)', required: false, icon: '💳' },
  { id: 'resume', label: 'Resume/CV (बायोडाटा)', required: false, icon: '📄' },
  { id: 'photo', label: 'Passport Photo (पासपोर्ट फोटो)', required: true, icon: '📷' },
  // Qualification Marksheets
  { id: 'marksheet_10th', label: '10th Marksheet (दसवीं मार्कशीट)', required: false, icon: '📊' },
  { id: 'marksheet_12th', label: '12th Marksheet (बारहवीं मार्कशीट)', required: false, icon: '📊' },
  { id: 'marksheet_graduation', label: 'Graduation Marksheet (स्नातक मार्कशीट)', required: false, icon: '📊' },
  { id: 'marksheet_pg', label: 'Post Graduation (स्नातकोत्तर मार्कशीट)', required: false, icon: '📊' },
  { id: 'degree_certificate', label: 'Degree Certificate (डिग्री प्रमाण पत्र)', required: false, icon: '🎓' },
  { id: 'bed_certificate', label: 'B.Ed Certificate (B.Ed प्रमाण पत्र)', required: false, icon: '🎓' },
  { id: 'experience_letter', label: 'Experience Letter (अनुभव पत्र)', required: false, icon: '📋' },
  { id: 'relieving_letter', label: 'Relieving Letter (मुक्ति पत्र)', required: false, icon: '📝' },
  { id: 'police_verification', label: 'Police Verification (पुलिस सत्यापन)', required: false, icon: '🚔' },
  { id: 'medical_certificate', label: 'Medical Certificate (चिकित्सा प्रमाण पत्र)', required: false, icon: '🏥' },
  { id: 'bank_details', label: 'Bank Account Details (बैंक खाता)', required: false, icon: '🏦' },
  { id: 'address_proof', label: 'Address Proof (पता प्रमाण)', required: false, icon: '🏠' },
  { id: 'other', label: 'Other Document (अन्य)', required: false, icon: '📁' },
];

export default function DocumentUpload({ 
  personId, 
  personType = 'student', // 'student' or 'employee'
  schoolId,
  existingDocuments = [],
  onUploadComplete,
  compact = false 
}) {
  const [uploading, setUploading] = useState(null);
  const [documents, setDocuments] = useState(existingDocuments);
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedDocType, setSelectedDocType] = useState(null);

  const documentTypes = personType === 'student' ? STUDENT_DOCUMENT_TYPES : EMPLOYEE_DOCUMENT_TYPES;

  const handleFileSelect = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG or PDF files allowed');
      return;
    }

    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      formData.append('person_id', personId);
      formData.append('person_type', personType);
      formData.append('school_id', schoolId);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      // Update documents list
      const newDoc = {
        id: response.data.id,
        document_type: docType,
        file_name: file.name,
        file_url: response.data.file_url,
        uploaded_at: new Date().toISOString()
      };

      setDocuments(prev => {
        const filtered = prev.filter(d => d.document_type !== docType);
        return [...filtered, newDoc];
      });

      toast.success(`${documentTypes.find(d => d.id === docType)?.label} uploaded!`);
      if (onUploadComplete) onUploadComplete(newDoc);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleDelete = async (docType) => {
    const doc = documents.find(d => d.document_type === docType);
    if (!doc) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d.document_type !== docType));
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getDocumentStatus = (docType) => {
    return documents.find(d => d.document_type === docType);
  };

  if (compact) {
    // Compact view for inline display
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents ({documents.length}/{documentTypes.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {documentTypes.slice(0, 6).map(docType => {
            const uploaded = getDocumentStatus(docType.id);
            return (
              <div key={docType.id} className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id={`doc-${docType.id}`}
                  onChange={(e) => handleFileSelect(e, docType.id)}
                />
                <label
                  htmlFor={`doc-${docType.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    uploaded 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {uploading === docType.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : uploaded ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span>{docType.icon}</span>
                  )}
                  {docType.label.split(' (')[0]}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          📁 Documents Upload (दस्तावेज़ अपलोड)
        </h3>
        <span className="text-sm text-slate-500">
          {documents.length}/{documentTypes.length} uploaded
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {documentTypes.map(docType => {
          const uploaded = getDocumentStatus(docType.id);
          const isUploading = uploading === docType.id;

          return (
            <div
              key={docType.id}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                uploaded 
                  ? 'border-emerald-300 bg-emerald-50' 
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                id={`upload-${docType.id}`}
                onChange={(e) => handleFileSelect(e, docType.id)}
              />
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-lg">{docType.icon}</span>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {docType.label.split(' (')[0]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {docType.label.split(' (')[1]?.replace(')', '')}
                  </p>
                </div>
                
                {docType.required && !uploaded && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </div>

              {uploaded ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="w-3 h-3" />
                    Uploaded
                  </span>
                  <button
                    onClick={() => window.open(uploaded.file_url, '_blank')}
                    className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                    title="View"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(docType.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`upload-${docType.id}`}
                  className="mt-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-indigo-100 rounded text-xs text-slate-600 hover:text-indigo-700 cursor-pointer transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      Upload
                    </>
                  )}
                </label>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Max file size: 5MB | Supported: JPG, PNG, PDF
      </p>
    </div>
  );
}
