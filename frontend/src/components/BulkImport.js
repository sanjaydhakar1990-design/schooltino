/**
 * Bulk Import Component - Import Students/Employees from CSV/Excel
 * AI-powered data parsing with preview and validation
 */
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { 
  FileUp, Download, AlertTriangle, CheckCircle, XCircle,
  Loader2, FileSpreadsheet, Users, UserCog, Eye, Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BulkImport({ 
  type = 'student', // 'student' or 'employee'
  schoolId,
  onImportComplete,
  trigger // Custom trigger element
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [template, setTemplate] = useState(null);
  const fileInputRef = useRef(null);

  const typeLabel = type === 'student' ? 'Students (छात्र)' : 'Employees (कर्मचारी)';
  const TypeIcon = type === 'student' ? Users : UserCog;

  const fetchTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/bulk-import/template/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplate(response.data);
    } catch (error) {
      toast.error('Template load करने में समस्या');
    }
  };

  const downloadTemplate = () => {
    if (!template) return;
    
    const blob = new Blob([template.sample_csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      toast.error('Only CSV or Excel files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setFile(selectedFile);
    await previewFile(selectedFile);
  };

  const previewFile = async (selectedFile) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('import_type', type);
      formData.append('school_id', schoolId);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/bulk-import/preview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setPreviewData(response.data);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'File preview failed');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const executeImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', type);
      formData.append('school_id', schoolId);
      formData.append('skip_invalid', 'true');

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/bulk-import/execute`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setImportResult(response.data);
      setStep(3);
      toast.success(`${response.data.success_count} ${type}s imported!`);
      if (onImportComplete) onImportComplete();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
  };

  const openDialog = () => {
    resetDialog();
    fetchTemplate();
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={openDialog}>{trigger}</div>
      ) : (
        <Button onClick={openDialog} variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <FileUp className="w-4 h-4" />
          Bulk Import
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TypeIcon className="w-5 h-5 text-indigo-600" />
              📥 Bulk Import {typeLabel}
            </DialogTitle>
            <DialogDescription>
              CSV या Excel file से एक साथ बहुत सारे {type === 'student' ? 'students' : 'employees'} add करें
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6 py-4">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">📋 Step 1: Download Template</h4>
                <p className="text-sm text-blue-600 mb-3">
                  पहले template download करें, अपना data भरें, फिर upload करें।
                </p>
                <Button 
                  onClick={downloadTemplate} 
                  disabled={!template}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template CSV
                </Button>
                
                {template && (
                  <div className="mt-3 text-xs text-blue-700">
                    <p className="font-medium">Required columns:</p>
                    <p className="opacity-80">{template.headers.slice(0, 8).join(', ')}...</p>
                  </div>
                )}
              </div>

              {/* Upload File */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-2">📤 Step 2: Upload Your File</h4>
                
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-100 transition-all"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-2" />
                      <p className="text-emerald-700">Processing file...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-emerald-700 font-medium">Click to upload CSV or Excel</p>
                      <p className="text-sm text-emerald-600">या file यहाँ drag करें</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-emerald-600 mt-2">
                  Supported: CSV, XLSX, XLS | Max size: 10MB
                </p>
              </div>

              {/* Tips */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">💡 Tips</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• First row should be headers (column names)</li>
                  <li>• Mobile numbers should be 10 digits</li>
                  <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                  <li>• Existing software (Tally, other ERP) से export करके upload कर सकते हैं</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && previewData && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-800">{previewData.total_rows}</p>
                  <p className="text-sm text-slate-500">Total Rows</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">{previewData.valid_rows}</p>
                  <p className="text-sm text-emerald-600">Valid</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{previewData.invalid_rows}</p>
                  <p className="text-sm text-red-600">Invalid</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-medium text-slate-700">
                  Preview (First 10 rows)
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">{type === 'student' ? 'Class' : 'Designation'}</th>
                        <th className="px-3 py-2 text-left">Mobile</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview_data.map((item, idx) => (
                        <tr key={idx} className={item.is_valid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 border-t">{item.row_number}</td>
                          <td className="px-3 py-2 border-t">{item.data.name || '-'}</td>
                          <td className="px-3 py-2 border-t">
                            {type === 'student' ? item.data.class_name : item.data.designation}
                          </td>
                          <td className="px-3 py-2 border-t">{item.data.mobile || '-'}</td>
                          <td className="px-3 py-2 border-t">
                            {item.is_valid ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors */}
              {previewData.all_errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Errors ({previewData.all_errors.length})
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-auto">
                    {previewData.all_errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { setStep(1); setFile(null); }}>
                  ← Back
                </Button>
                <Button
                  onClick={executeImport}
                  disabled={importing || previewData.valid_rows === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {previewData.valid_rows} Valid Rows
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && importResult && (
            <div className="space-y-4 py-4 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                importResult.success_count > 0 ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {importResult.success_count > 0 ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {importResult.success_count > 0 ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p className="text-slate-500">
                  {importResult.success_count} {type}s imported successfully
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{importResult.success_count}</p>
                  <p className="text-sm text-emerald-600">Success</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importResult.error_count}</p>
                  <p className="text-sm text-red-600">Failed</p>
                </div>
              </div>

              {importResult.errors?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-left">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>• Row {err.row}: {err.error || err.errors?.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={() => setOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
