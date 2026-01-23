import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Printer, Loader2, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Role-based gradient colors with Higher Authority special styling
const getRoleGradient = (roleColor, isHigherAuthority = false) => {
  // Higher Authority gets premium gold-accented gradients
  if (isHigherAuthority) {
    const higherAuthorityMap = {
      '#b91c1c': 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 30%, #dc2626 50%, #b91c1c 70%, #7f1d1d 100%)', // Dark Red - Director
      '#dc2626': 'linear-gradient(135deg, #991b1b 0%, #dc2626 30%, #ef4444 50%, #dc2626 70%, #991b1b 100%)', // Red - Principal
      '#ea580c': 'linear-gradient(135deg, #c2410c 0%, #ea580c 30%, #f97316 50%, #ea580c 70%, #c2410c 100%)', // Orange - VP
      '#9333ea': 'linear-gradient(135deg, #7e22ce 0%, #9333ea 30%, #a855f7 50%, #9333ea 70%, #7e22ce 100%)', // Violet - Co-Director
    };
    return higherAuthorityMap[roleColor] || higherAuthorityMap['#b91c1c'];
  }
  
  const colorMap = {
    '#b91c1c': 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)', // Dark Red - Director
    '#dc2626': 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)', // Red - Principal
    '#ea580c': 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', // Orange - VP
    '#9333ea': 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #9333ea 100%)', // Violet - Co-Director
    '#047857': 'linear-gradient(135deg, #047857 0%, #059669 50%, #047857 100%)', // Dark Green - Admin
    '#1e40af': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)', // Blue - Teacher
    '#059669': 'linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)', // Green - Accountant
    '#0891b2': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0891b2 100%)', // Cyan - Clerk
    '#4f46e5': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%)', // Indigo - Librarian
    '#64748b': 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #64748b 100%)', // Slate - Support
    '#ca8a04': 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #ca8a04 100%)', // Yellow - Driver
    '#374151': 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #374151 100%)', // Gray - Guard
    '#78716c': 'linear-gradient(135deg, #78716c 0%, #a8a29e 50%, #78716c 100%)', // Stone - Helper
    '#a16207': 'linear-gradient(135deg, #a16207 0%, #ca8a04 50%, #a16207 100%)', // Amber - Cook
  };
  return colorMap[roleColor] || 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)';
};

export default function IDCardViewer({ 
  personId, 
  personType = 'student',
  schoolId,
  isOpen,
  onClose
}) {
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [showBack, setShowBack] = useState(false); // Toggle front/back
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
    const roleColor = card?.role_color || '#1e40af';
    const isHigherAuthority = card?.is_higher_authority || false;

    // Get gradient based on role
    const gradientMap = {
      '#b91c1c': isHigherAuthority ? 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 30%, #dc2626 50%, #b91c1c 70%, #7f1d1d 100%)' : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)',
      '#dc2626': isHigherAuthority ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 30%, #ef4444 50%, #dc2626 70%, #991b1b 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
      '#ea580c': 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
      '#9333ea': 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #9333ea 100%)',
      '#047857': 'linear-gradient(135deg, #047857 0%, #059669 50%, #047857 100%)',
      '#1e40af': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
      '#059669': 'linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)',
      '#0891b2': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0891b2 100%)',
      '#4f46e5': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%)',
      '#64748b': 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #64748b 100%)',
      '#ca8a04': 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #ca8a04 100%)',
      '#374151': 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #374151 100%)',
    };
    const gradient = gradientMap[roleColor] || gradientMap['#1e40af'];
    
    // Higher authority gets gold border
    const borderStyle = isHigherAuthority ? '2px solid #fbbf24' : 'none';

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
              background: ${gradient};
              border-radius: 8px;
              overflow: hidden;
              position: relative;
              color: white;
              padding: 3mm;
              border: ${borderStyle};
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: 0.15;
              width: 30mm;
              height: 30mm;
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
              background: ${isHigherAuthority ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.25)'}; 
              padding: 0.5mm 2mm; 
              border-radius: 2mm;
              display: inline-block;
              margin-top: 1mm;
              font-weight: bold;
              ${isHigherAuthority ? 'border: 0.3mm solid rgba(251,191,36,0.5);' : ''}
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
            .contact-box {
              background: rgba(255,255,255,0.2);
              padding: 1mm 1.5mm;
              border-radius: 1.5mm;
              margin-top: 1.5mm;
              font-size: 6.5pt;
            }
            .contact-label { color: #fca5a5; font-weight: bold; }
            .contact-value { font-weight: bold; }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 5pt;
              opacity: 0.8;
              margin-top: auto;
              padding-top: 1mm;
            }
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
                    ${card?.show_samgra_id && card?.samgra_id ? `<div class="detail-row"><span class="detail-label">Samgra ID:</span><span class="detail-value">${card.samgra_id}</span></div>` : ''}
                    ${card?.blood_group ? `<div class="detail-row"><span class="detail-label">Blood:</span><span class="detail-value">${card.blood_group}</span></div>` : ''}
                    ${card?.parent_phone || card?.phone ? `<div class="contact-box"><span class="contact-label">📞 Parent: </span><span class="contact-value">${card.parent_phone || card.phone}</span></div>` : ''}
                  ` : `
                    <div class="detail-row">
                      <span class="detail-label">Designation:</span>
                      <span class="detail-value">${card?.designation || ''} ${card?.designation_hindi ? '/ ' + card.designation_hindi : ''}</span>
                    </div>
                    ${card?.department ? `<div class="detail-row"><span class="detail-label">Dept:</span><span class="detail-value">${card.department}</span></div>` : ''}
                    ${card?.id_number ? `<div class="detail-row"><span class="detail-label">Emp ID:</span><span class="detail-value">${card.id_number}</span></div>` : ''}
                    ${card?.blood_group ? `<div class="detail-row"><span class="detail-label">Blood:</span><span class="detail-value">${card.blood_group}</span></div>` : ''}
                    ${card?.phone ? `<div class="contact-box"><span class="contact-label">📞 Self: </span><span class="contact-value">${card.phone}</span></div>` : ''}
                    ${card?.emergency_contact ? `<div class="contact-box" style="margin-top:1mm"><span class="contact-label">🆘 Emergency: </span><span class="contact-value">${card.emergency_contact}</span></div>` : ''}
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
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const card = cardData?.id_card;
  const school = cardData?.school;
  const photo = cardData?.photo;
  const roleColor = card?.role_color || '#1e40af';
  const isHigherAuthority = card?.is_higher_authority || false;
  const cardGradient = getRoleGradient(roleColor, isHigherAuthority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="id-card-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{personType === 'student' ? 'Student' : 'Employee'} ID Card Preview</span>
            <span 
              className="text-xs px-2 py-1 rounded-full" 
              style={{
                background: roleColor, 
                color: 'white',
                border: isHigherAuthority ? '2px solid #fbbf24' : 'none'
              }}
            >
              {card?.card_type?.replace(' ID CARD', '') || personType}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : cardData ? (
          <div ref={printRef}>
            {/* Front/Back Toggle */}
            <div className="flex justify-center mb-3">
              <div className="inline-flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setShowBack(false)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    !showBack ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Front Side
                </button>
                <button
                  onClick={() => setShowBack(true)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    showBack ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Back Side
                </button>
              </div>
            </div>

            {/* ID Card Preview - Front */}
            {!showBack && (
            <div 
              className="mx-auto rounded-xl overflow-hidden shadow-xl relative"
              style={{
                width: '340px',
                height: '215px',
                background: cardGradient,
                padding: '12px',
                color: 'white',
                border: isHigherAuthority ? '3px solid #fbbf24' : 'none'
              }}
              data-testid="id-card-preview"
            >
              {/* Watermark - School Logo */}
              {school?.logo_url && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: 0.15, zIndex: 0 }}
                  data-testid="id-card-watermark"
                >
                  <img src={school.logo_url} alt="" className="w-36 h-36 object-contain" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header with Logo */}
                <div className="flex items-center gap-2 pb-2 border-b border-white/30 mb-2">
                  {school?.logo_url && (
                    <div className="w-9 h-9 bg-white rounded-full p-0.5 flex-shrink-0" data-testid="id-card-header-logo">
                      <img src={school.logo_url} alt="" className="w-full h-full object-contain rounded-full" />
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <div className="text-sm font-bold uppercase tracking-wide" data-testid="id-card-school-name">
                      {school?.name || 'School Name'}
                    </div>
                    {school?.address && <div className="text-[9px] opacity-80">{school.address}</div>}
                    <div 
                      className="text-[8px] inline-block px-2 py-0.5 rounded-full mt-1 font-bold" 
                      style={{
                        background: isHigherAuthority ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.25)',
                        border: isHigherAuthority ? '1px solid rgba(251,191,36,0.5)' : 'none'
                      }}
                      data-testid="id-card-type"
                    >
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
                    <div className="text-sm font-bold text-yellow-200 mb-1" data-testid="id-card-name">{card?.name}</div>
                    
                    {personType === 'student' ? (
                      <>
                        <div className="mb-0.5" data-testid="id-card-class">
                          <span className="opacity-70 w-16 inline-block">Class:</span> 
                          <span className="font-semibold">{card?.class}</span>
                        </div>
                        {card?.roll_no && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Roll No:</span> 
                            <span className="font-semibold">{card.roll_no}</span>
                          </div>
                        )}
                        {card?.father_name && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Father:</span> 
                            <span className="font-semibold">{card.father_name}</span>
                          </div>
                        )}
                        {/* Samgra ID for MP Board schools */}
                        {card?.show_samgra_id && card?.samgra_id && (
                          <div className="mb-0.5" data-testid="id-card-samgra-id">
                            <span className="opacity-70 w-16 inline-block">Samgra ID:</span> 
                            <span className="font-semibold">{card.samgra_id}</span>
                          </div>
                        )}
                        {card?.blood_group && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Blood:</span> 
                            <span className="font-semibold">{card.blood_group}</span>
                          </div>
                        )}
                        
                        {/* Parent Phone - PROMINENTLY DISPLAYED */}
                        {(card?.parent_phone || card?.phone) && (
                          <div className="mt-1.5 bg-white/20 rounded px-1.5 py-1 text-[8px]" data-testid="id-card-parent-phone">
                            <span className="text-red-200 font-bold">📞 Parent: </span>
                            <span className="font-bold">{card.parent_phone || card.phone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-0.5" data-testid="id-card-designation">
                          <span className="opacity-70 w-16 inline-block">Designation:</span> 
                          <span className="font-semibold">
                            {card?.designation}
                            {card?.designation_hindi && <span className="opacity-80"> / {card.designation_hindi}</span>}
                          </span>
                        </div>
                        {card?.department && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Dept:</span> 
                            <span className="font-semibold">{card.department}</span>
                          </div>
                        )}
                        {card?.id_number && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Emp ID:</span> 
                            <span className="font-semibold">{card.id_number}</span>
                          </div>
                        )}
                        {card?.blood_group && (
                          <div className="mb-0.5">
                            <span className="opacity-70 w-16 inline-block">Blood:</span> 
                            <span className="font-semibold">{card.blood_group}</span>
                          </div>
                        )}
                        
                        {/* Self Contact */}
                        {card?.phone && (
                          <div className="mt-1.5 bg-white/20 rounded px-1.5 py-1 text-[8px]" data-testid="id-card-phone">
                            <span className="text-green-200 font-bold">📞 Self: </span>
                            <span className="font-bold">{card.phone}</span>
                          </div>
                        )}
                        
                        {/* Emergency Contact for Employee */}
                        {card?.emergency_contact && (
                          <div className="mt-1 bg-white/20 rounded px-1.5 py-1 text-[8px]" data-testid="id-card-emergency">
                            <span className="text-red-200 font-bold">🆘 Emergency: </span>
                            <span className="font-bold">{card.emergency_contact}</span>
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
            )}

            {/* ID Card Preview - Back Side */}
            {showBack && (
              <div 
                className="mx-auto rounded-xl overflow-hidden shadow-xl relative"
                style={{
                  width: '340px',
                  height: '215px',
                  background: personType === 'student' 
                    ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)'
                    : cardGradient,
                  padding: '12px',
                  color: 'white',
                  border: isHigherAuthority ? '3px solid #fbbf24' : 'none'
                }}
                data-testid="id-card-back-preview"
              >
                {/* Large Watermark - School Logo */}
                {school?.logo_url && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ opacity: 0.2, zIndex: 0 }}
                  >
                    <img src={school.logo_url} alt="" className="w-44 h-44 object-contain" />
                  </div>
                )}

                {/* Back Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                  {personType === 'student' ? (
                    <>
                      <div className="text-3xl font-bold tracking-wider mb-3 drop-shadow-lg">
                        STUDENT OF
                      </div>
                      <div className="text-lg font-semibold uppercase px-4 leading-tight">
                        {school?.name || 'School Name'}
                      </div>
                      {school?.address && (
                        <div className="text-[10px] mt-3 opacity-80 max-w-[80%]">
                          {school.address}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold tracking-wider mb-2 drop-shadow-lg uppercase">
                        {card?.designation || 'Employee'}
                      </div>
                      {card?.designation_hindi && (
                        <div className="text-sm font-medium mb-3 opacity-90">
                          {card.designation_hindi}
                        </div>
                      )}
                      <div className="text-base font-semibold uppercase px-4 leading-tight">
                        {school?.name || 'School Name'}
                      </div>
                      {school?.phone && (
                        <div className="text-[10px] mt-3 opacity-80">
                          📞 {school.phone}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Bottom Info */}
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <div className="text-[8px] opacity-70">
                      If found, please return to school
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Print Button */}
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={printCard} className="bg-indigo-600 hover:bg-indigo-700" data-testid="print-id-card-btn">
                <Printer className="w-4 h-4 mr-2" />
                Print ID Card
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
            
            {/* Print Tips */}
            <p className="text-center text-xs text-slate-500 mt-2">
              💡 Print on PVC card (85.6mm x 54mm) for best results
            </p>
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
