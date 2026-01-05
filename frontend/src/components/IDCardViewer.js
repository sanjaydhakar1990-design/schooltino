import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  CreditCard, Download, Printer, QrCode, User, Phone, Mail,
  Calendar, Building, Loader2, Camera, Upload, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function IDCardViewer({ 
  personId, 
  personType = 'student',
  schoolId,
  isOpen,
  onClose,
  onPhotoUpload
}) {
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const printRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    if (personId && isOpen) {
      fetchIDCard();
    }
  }, [personId, isOpen]);

  const fetchIDCard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/id-card/generate/${personType}/${personId}`);
      if (res.ok) {
        const data = await res.json();
        setCardData(data);
      } else {
        toast.error('Failed to generate ID card');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading ID card');
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    try {
      const res = await fetch(`${API}/api/id-card/text/${personType}/${personId}`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.card_text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        toast.success('ID Card downloaded!');
      }
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const printCard = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${cardData?.id_card?.name}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .id-card { width: 340px; border: 2px solid #333; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 15px; text-align: center; }
            .school-name { font-size: 14px; font-weight: bold; }
            .card-type { font-size: 11px; margin-top: 5px; opacity: 0.9; }
            .body { padding: 15px; background: white; }
            .photo-section { text-align: center; margin-bottom: 15px; }
            .photo { width: 100px; height: 120px; border: 2px solid #4f46e5; border-radius: 8px; object-fit: cover; }
            .no-photo { width: 100px; height: 120px; border: 2px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999; }
            .name { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; }
            .details { font-size: 11px; }
            .detail-row { display: flex; margin-bottom: 6px; }
            .detail-label { width: 80px; color: #666; }
            .detail-value { flex: 1; font-weight: 500; }
            .qr-section { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ddd; }
            .footer { background: #f5f5f5; padding: 8px; text-align: center; font-size: 9px; color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        // Choose endpoint based on person type
        const endpoint = personType === 'student' 
          ? `${API}/api/face-recognition/upload-photo`
          : `${API}/api/id-card/staff-photo`;
        
        const body = personType === 'student'
          ? {
              student_id: personId,
              school_id: schoolId,
              photo_base64: base64,
              photo_type: 'passport',
              capture_device: 'upload'
            }
          : {
              staff_id: personId,
              school_id: schoolId,
              photo_base64: base64,
              photo_type: 'passport'
            };
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (data.success) {
          toast.success('Photo uploaded successfully!');
          setShowPhotoUpload(false);
          fetchIDCard(); // Refresh card
          onPhotoUpload?.();
        } else {
          toast.error(data.error || 'Upload failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const card = cardData?.id_card;
  const school = cardData?.school;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            ID Card - {card?.name}
          </DialogTitle>
          <DialogDescription>
            {card?.card_type}
          </DialogDescription>
        </DialogHeader>

        {/* ID Card Preview */}
        <div ref={printRef}>
          <div className="id-card border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg" data-testid="id-card-preview">
            {/* Card Header */}
            <div className="header bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 text-center">
              <p className="school-name font-bold text-sm">{school?.name || 'SCHOOLTINO'}</p>
              {school?.address && (
                <p className="text-xs opacity-80 mt-1">{school.address}</p>
              )}
              <div className="card-type text-xs mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">
                {card?.card_type}
              </div>
            </div>

            {/* Card Body */}
            <div className="body p-4 bg-white">
              {/* Photo Section */}
              <div className="photo-section text-center mb-4">
                {cardData?.photo ? (
                  <img 
                    src={`data:image/jpeg;base64,${cardData.photo}`}
                    alt="Photo"
                    className="photo w-24 h-28 mx-auto border-2 border-indigo-600 rounded-lg object-cover"
                  />
                ) : (
                  <div 
                    className="no-photo w-24 h-28 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:border-indigo-400"
                    onClick={() => setShowPhotoUpload(true)}
                  >
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-xs text-slate-400 mt-1">Add Photo</span>
                  </div>
                )}
                {cardData?.photo && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-xs"
                    onClick={() => setShowPhotoUpload(true)}
                  >
                    Change Photo
                  </Button>
                )}
              </div>

              {/* Name */}
              <p className="name text-lg font-bold text-center text-slate-900 mb-3">
                {card?.name}
              </p>

              {/* Details */}
              <div className="details text-sm space-y-2">
                <div className="detail-row flex">
                  <span className="detail-label w-24 text-slate-500">ID:</span>
                  <span className="detail-value font-semibold">{card?.id_number}</span>
                </div>
                
                {personType === 'student' ? (
                  <>
                    <div className="detail-row flex">
                      <span className="detail-label w-24 text-slate-500">Class:</span>
                      <span className="detail-value">{card?.class} {card?.section ? `- ${card.section}` : ''}</span>
                    </div>
                    {card?.roll_no && (
                      <div className="detail-row flex">
                        <span className="detail-label w-24 text-slate-500">Roll No:</span>
                        <span className="detail-value">{card.roll_no}</span>
                      </div>
                    )}
                    {card?.father_name && (
                      <div className="detail-row flex">
                        <span className="detail-label w-24 text-slate-500">Father:</span>
                        <span className="detail-value">{card.father_name}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="detail-row flex">
                      <span className="detail-label w-24 text-slate-500">Designation:</span>
                      <span className="detail-value">{card?.designation}</span>
                    </div>
                    {card?.email && (
                      <div className="detail-row flex">
                        <span className="detail-label w-24 text-slate-500">Email:</span>
                        <span className="detail-value text-xs">{card.email}</span>
                      </div>
                    )}
                  </>
                )}
                
                {card?.phone && (
                  <div className="detail-row flex">
                    <span className="detail-label w-24 text-slate-500">Phone:</span>
                    <span className="detail-value">{card.phone}</span>
                  </div>
                )}
                
                {card?.blood_group && (
                  <div className="detail-row flex">
                    <span className="detail-label w-24 text-slate-500">Blood:</span>
                    <span className="detail-value text-red-600 font-bold">{card.blood_group}</span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="qr-section text-center mt-4 pt-3 border-t border-dashed border-slate-200">
                <QRCodeSVG 
                  value={cardData?.qr_data || 'SCHOOLTINO'} 
                  size={60}
                  className="mx-auto"
                />
                <p className="text-xs text-slate-400 mt-1">Scan to verify</p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="footer bg-slate-100 p-2 text-center text-xs text-slate-500">
              Valid Until: {card?.valid_until} | If found, return to school
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={downloadCard} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={printCard} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Photo Upload Section */}
        {showPhotoUpload && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium mb-3">Upload Photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Select Photo'}
            </Button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              JPG, PNG - Passport size photo recommended
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
