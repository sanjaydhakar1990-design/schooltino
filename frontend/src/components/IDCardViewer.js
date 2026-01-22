import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Printer, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function IDCardViewer({ 
  personId, 
  personType = 'student',
  schoolId,
  isOpen,
  onClose
}) {
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (personId && isOpen) {
      fetchIDCard();
    }
  }, [personId, isOpen]);

  const fetchIDCard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/id-card/generate/${personType}/${personId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCardData(data);
      } else {
        toast.error('ID card generate nahi ho saka');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading ID card');
    } finally {
      setLoading(false);
    }
  };

  const printCard = () => {
    const printWindow = window.open('', '_blank');
    const card = cardData?.id_card;
    const school = cardData?.school;
    const photo = cardData?.photo;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${card?.name || 'Print'}</title>
          <style>
            @page { size: 85.6mm 54mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background: #f0f0f0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .id-card {
              width: 85.6mm;
              height: 54mm;
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
              border-radius: 8px;
              overflow: hidden;
              position: relative;
              color: white;
              padding: 3mm;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: 0.12;
              width: 35mm;
              height: 35mm;
              z-index: 0;
            }
            .watermark img { width: 100%; height: 100%; object-fit: contain; }
            .content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
            .header {
              display: flex;
              align-items: center;
              gap: 2mm;
              padding-bottom: 2mm;
              border-bottom: 0.3mm solid rgba(255,255,255,0.3);
              margin-bottom: 2mm;
            }
            .header-logo {
              width: 8mm;
              height: 8mm;
              background: white;
              border-radius: 50%;
              padding: 0.5mm;
              flex-shrink: 0;
            }
            .header-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
            .header-text { flex: 1; text-align: center; }
            .school-name { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
            .school-address { font-size: 6pt; opacity: 0.9; margin-top: 0.5mm; }
            .card-type { 
              font-size: 6pt; 
              background: rgba(255,255,255,0.2); 
              padding: 0.5mm 2mm; 
              border-radius: 2mm;
              display: inline-block;
              margin-top: 1mm;
            }
            .body { display: flex; gap: 3mm; flex: 1; }
            .photo-section { width: 18mm; flex-shrink: 0; }
            .photo {
              width: 18mm;
              height: 22mm;
              background: white;
              border-radius: 2mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .photo img { width: 100%; height: 100%; object-fit: cover; }
            .photo-placeholder { color: #999; font-size: 7pt; }
            .details { flex: 1; font-size: 7pt; }
            .name { font-size: 10pt; font-weight: bold; color: #fef08a; margin-bottom: 1.5mm; }
            .detail-row { margin-bottom: 1mm; display: flex; }
            .detail-label { width: 14mm; opacity: 0.8; }
            .detail-value { flex: 1; font-weight: 600; }
            .emergency {
              background: rgba(255,255,255,0.15);
              padding: 1mm 1.5mm;
              border-radius: 1.5mm;
              margin-top: 1.5mm;
              font-size: 6.5pt;
            }
            .emergency-label { color: #fca5a5; }
            .emergency-value { font-weight: bold; }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 5pt;
              opacity: 0.8;
              margin-top: auto;
              padding-top: 1mm;
            }
            .qr-code { width: 12mm; height: 12mm; background: white; padding: 0.5mm; border-radius: 1mm; }
            @media print {
              body { background: white; }
              .id-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            ${school?.logo_url ? `<div class="watermark"><img src="${school.logo_url}" alt=""/></div>` : ''}
            <div class="content">
              <div class="header">
                ${school?.logo_url ? `<div class="header-logo"><img src="${school.logo_url}" alt=""/></div>` : ''}
                <div class="header-text">
                  <div class="school-name">${school?.name || 'School Name'}</div>
                  ${school?.address ? `<div class="school-address">${school.address}</div>` : ''}
                  <div class="card-type">${card?.card_type || 'ID CARD'}</div>
                </div>
              </div>
              <div class="body">
                <div class="photo-section">
                  <div class="photo">
                    ${photo ? `<img src="${photo}" alt="${card?.name}"/>` : '<span class="photo-placeholder">Photo</span>'}
                  </div>
                </div>
                <div class="details">
                  <div class="name">${card?.name || ''}</div>
                  ${personType === 'student' ? `
                    <div class="detail-row">
                      <span class="detail-label">Class:</span>
                      <span class="detail-value">${card?.class || ''}</span>
                    </div>
                    ${card?.roll_no ? `<div class="detail-row"><span class="detail-label">Roll No:</span><span class="detail-value">${card.roll_no}</span></div>` : ''}
                    ${card?.father_name ? `<div class="detail-row"><span class="detail-label">Father:</span><span class="detail-value">${card.father_name}</span></div>` : ''}
                    ${card?.dob ? `<div class="detail-row"><span class="detail-label">DOB:</span><span class="detail-value">${new Date(card.dob).toLocaleDateString('en-IN')}</span></div>` : ''}
                    ${card?.blood_group ? `<div class="detail-row"><span class="detail-label">Blood:</span><span class="detail-value">${card.blood_group}</span></div>` : ''}
                    ${card?.phone ? `<div class="emergency"><span class="emergency-label">📞 Emergency: </span><span class="emergency-value">${card.phone}</span></div>` : ''}
                  ` : `
                    <div class="detail-row">
                      <span class="detail-label">Designation:</span>
                      <span class="detail-value">${card?.designation || card?.role || ''}</span>
                    </div>
                    ${card?.department ? `<div class="detail-row"><span class="detail-label">Dept:</span><span class="detail-value">${card.department}</span></div>` : ''}
                    ${card?.employee_id ? `<div class="detail-row"><span class="detail-label">Emp ID:</span><span class="detail-value">${card.employee_id}</span></div>` : ''}
                    ${card?.blood_group ? `<div class="detail-row"><span class="detail-label">Blood:</span><span class="detail-value">${card.blood_group}</span></div>` : ''}
                    ${card?.phone ? `<div class="emergency"><span class="emergency-label">📞 Contact: </span><span class="emergency-value">${card.phone}</span></div>` : ''}
                  `}
                </div>
              </div>
              <div class="footer">
                <div>
                  ${school?.phone ? `📞 ${school.phone}` : ''}
                </div>
                <div>Valid: ${card?.valid_until || new Date().getFullYear() + 1}</div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const card = cardData?.id_card;
  const school = cardData?.school;
  const photo = cardData?.photo;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>ID Card Preview</span>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : cardData ? (
          <div ref={printRef}>
            {/* ID Card Preview */}
            <div 
              className="mx-auto rounded-xl overflow-hidden shadow-xl relative"
              style={{
                width: '340px',
                height: '215px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
                padding: '12px',
                color: 'white'
              }}
            >
              {/* Watermark */}
              {school?.logo_url && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: 0.12, zIndex: 0 }}
                >
                  <img src={school.logo_url} alt="" className="w-40 h-40 object-contain" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header with Logo */}
                <div className="flex items-center gap-2 pb-2 border-b border-white/30 mb-2">
                  {school?.logo_url && (
                    <div className="w-9 h-9 bg-white rounded-full p-0.5 flex-shrink-0">
                      <img src={school.logo_url} alt="" className="w-full h-full object-contain rounded-full" />
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <div className="text-sm font-bold uppercase tracking-wide">{school?.name || 'School Name'}</div>
                    {school?.address && <div className="text-[9px] opacity-80">{school.address}</div>}
                    <div className="text-[8px] bg-white/20 inline-block px-2 py-0.5 rounded-full mt-1">
                      {card?.card_type || 'ID CARD'}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex gap-3 flex-1">
                  {/* Photo */}
                  <div className="w-[70px] flex-shrink-0">
                    <div className="w-[70px] h-[85px] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={card?.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs">Photo</span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-[9px]">
                    <div className="text-sm font-bold text-yellow-200 mb-1">{card?.name}</div>
                    
                    {personType === 'student' ? (
                      <>
                        <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Class:</span> <span className="font-semibold">{card?.class}</span></div>
                        {card?.roll_no && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Roll No:</span> <span className="font-semibold">{card.roll_no}</span></div>}
                        {card?.father_name && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Father:</span> <span className="font-semibold">{card.father_name}</span></div>}
                        {card?.dob && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">DOB:</span> <span className="font-semibold">{new Date(card.dob).toLocaleDateString('en-IN')}</span></div>}
                        {card?.blood_group && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Blood:</span> <span className="font-semibold">{card.blood_group}</span></div>}
                        
                        {/* Emergency Contact - Parent Phone */}
                        {card?.phone && (
                          <div className="mt-1.5 bg-white/15 rounded px-1.5 py-1 text-[8px]">
                            <span className="text-red-200">📞 Emergency: </span>
                            <span className="font-bold">{card.phone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Designation:</span> <span className="font-semibold">{card?.designation || card?.role}</span></div>
                        {card?.department && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Dept:</span> <span className="font-semibold">{card.department}</span></div>}
                        {card?.employee_id && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Emp ID:</span> <span className="font-semibold">{card.employee_id}</span></div>}
                        {card?.blood_group && <div className="mb-0.5"><span className="opacity-70 w-16 inline-block">Blood:</span> <span className="font-semibold">{card.blood_group}</span></div>}
                        
                        {/* Contact */}
                        {card?.phone && (
                          <div className="mt-1.5 bg-white/15 rounded px-1.5 py-1 text-[8px]">
                            <span className="text-green-200">📞 Contact: </span>
                            <span className="font-bold">{card.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end text-[7px] opacity-70 mt-auto pt-1">
                  <span>{school?.phone && `📞 ${school.phone}`}</span>
                  <span>Valid: {card?.valid_until || `${new Date().getFullYear() + 1}`}</span>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-center mt-4">
              <Button onClick={printCard} className="bg-indigo-600 hover:bg-indigo-700">
                <Printer className="w-4 h-4 mr-2" />
                Print ID Card
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            ID Card data load nahi ho saka
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
