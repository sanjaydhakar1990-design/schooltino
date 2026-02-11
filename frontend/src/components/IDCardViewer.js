import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Printer, Loader2, RotateCcw, Settings2, Palette, Layout, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const ID_CARD_TEMPLATES = [
  { id: 'classic', name: 'Classic', nameHi: 'क्लासिक', desc: 'Standard horizontal ID card' },
  { id: 'modern', name: 'Modern', nameHi: 'मॉडर्न', desc: 'Clean modern design with side accent' },
  { id: 'elegant', name: 'Elegant', nameHi: 'एलिगेंट', desc: 'Premium design with gold accents' },
  { id: 'minimal', name: 'Minimal', nameHi: 'मिनिमल', desc: 'Simple clean layout' },
  { id: 'vertical', name: 'Vertical', nameHi: 'वर्टिकल', desc: 'Portrait orientation ID card' },
];

const COLOR_THEMES = [
  { id: 'blue', name: 'Blue', colors: ['#1e40af', '#3b82f6'] },
  { id: 'green', name: 'Green', colors: ['#047857', '#10b981'] },
  { id: 'red', name: 'Red', colors: ['#b91c1c', '#ef4444'] },
  { id: 'purple', name: 'Purple', colors: ['#7e22ce', '#a855f7'] },
  { id: 'indigo', name: 'Indigo', colors: ['#3730a3', '#6366f1'] },
  { id: 'teal', name: 'Teal', colors: ['#0f766e', '#14b8a6'] },
  { id: 'slate', name: 'Slate', colors: ['#334155', '#64748b'] },
  { id: 'orange', name: 'Orange', colors: ['#c2410c', '#f97316'] },
];

const DEFAULT_SETTINGS = {
  template: 'classic',
  colorTheme: 'blue',
  showBloodGroup: true,
  showFatherName: true,
  showMotherName: false,
  showAddress: false,
  showDOB: false,
  showAdmissionNo: true,
  showRollNo: true,
  showPhone: true,
  showEmergencyContact: true,
  showDesignation: true,
  showDepartment: true,
  showEmpId: true,
  showSamgraId: true,
  showAadhar: false,
  showValidUntil: true,
  showSchoolPhone: true,
  showSchoolAddress: true,
  backSideContent: 'school_info',
};

const loadIDCardSettings = () => {
  try {
    const saved = localStorage.getItem('id_card_settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

const saveIDCardSettings = (settings) => {
  localStorage.setItem('id_card_settings', JSON.stringify(settings));
};

const getGradient = (theme, angle = 135) => {
  const t = COLOR_THEMES.find(c => c.id === theme) || COLOR_THEMES[0];
  return `linear-gradient(${angle}deg, ${t.colors[0]} 0%, ${t.colors[1]} 50%, ${t.colors[0]} 100%)`;
};

const renderClassicFront = (card, school, photo, settings, personType, gradient) => {
  return `
    <div class="id-card" style="width:85.6mm;height:54mm;background:${gradient};border-radius:3mm;overflow:hidden;position:relative;color:white;padding:3mm;box-sizing:border-box;">
      ${school?.logo_url ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.12;z-index:0;"><img src="${school.logo_url}" style="width:30mm;height:30mm;object-fit:contain;" /></div>` : ''}
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:2mm;padding-bottom:2mm;border-bottom:0.3mm solid rgba(255,255,255,0.3);margin-bottom:2mm;">
          ${school?.logo_url ? `<div style="width:8mm;height:8mm;background:white;border-radius:50%;padding:0.5mm;flex-shrink:0;"><img src="${school.logo_url}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" /></div>` : ''}
          <div style="flex:1;text-align:center;">
            <div style="font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">${school?.name || 'School'}</div>
            ${settings.showSchoolAddress && school?.address ? `<div style="font-size:5.5pt;opacity:0.85;margin-top:0.3mm;">${school.address}</div>` : ''}
            <div style="font-size:6pt;background:rgba(255,255,255,0.25);padding:0.5mm 2mm;border-radius:2mm;display:inline-block;margin-top:0.8mm;font-weight:bold;">${card?.card_type || (personType === 'student' ? 'STUDENT ID CARD' : 'STAFF ID CARD')}</div>
          </div>
        </div>
        <div style="display:flex;gap:3mm;flex:1;">
          <div style="width:18mm;flex-shrink:0;">
            <div style="width:18mm;height:22mm;background:white;border-radius:2mm;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#999;font-size:7pt;">Photo</span>'}
            </div>
          </div>
          <div style="flex:1;font-size:7pt;">
            <div style="font-size:10pt;font-weight:bold;color:#fef08a;margin-bottom:1.5mm;">${card?.name || ''}</div>
            ${personType === 'student' ? renderStudentDetails(card, settings) : renderStaffDetails(card, settings)}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:5pt;opacity:0.8;margin-top:auto;padding-top:1mm;">
          <span>${settings.showSchoolPhone && school?.phone ? '📞 ' + school.phone : ''}</span>
          <span>${settings.showValidUntil ? 'Valid: ' + (card?.valid_until || (new Date().getFullYear() + 1)) : ''}</span>
        </div>
      </div>
    </div>`;
};

const renderModernFront = (card, school, photo, settings, personType, gradient) => {
  const t = COLOR_THEMES.find(c => c.id === settings.colorTheme) || COLOR_THEMES[0];
  return `
    <div class="id-card" style="width:85.6mm;height:54mm;background:white;border-radius:3mm;overflow:hidden;position:relative;color:#1e293b;box-sizing:border-box;display:flex;">
      <div style="width:8mm;background:${gradient};flex-shrink:0;"></div>
      <div style="flex:1;padding:3mm;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:2mm;padding-bottom:1.5mm;border-bottom:0.3mm solid #e2e8f0;margin-bottom:2mm;">
          ${school?.logo_url ? `<div style="width:7mm;height:7mm;flex-shrink:0;"><img src="${school.logo_url}" style="width:100%;height:100%;object-fit:contain;border-radius:1mm;" /></div>` : ''}
          <div style="flex:1;">
            <div style="font-size:8pt;font-weight:bold;color:${t.colors[0]};">${school?.name || 'School'}</div>
            ${settings.showSchoolAddress && school?.address ? `<div style="font-size:5pt;color:#94a3b8;">${school.address}</div>` : ''}
          </div>
          <div style="font-size:5.5pt;background:${t.colors[0]};color:white;padding:1mm 2mm;border-radius:1.5mm;font-weight:bold;">${personType === 'student' ? 'STUDENT' : 'STAFF'}</div>
        </div>
        <div style="display:flex;gap:3mm;flex:1;">
          <div style="width:18mm;flex-shrink:0;">
            <div style="width:18mm;height:22mm;background:#f1f5f9;border-radius:2mm;border:0.5mm solid ${t.colors[1]};display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#999;font-size:7pt;">Photo</span>'}
            </div>
          </div>
          <div style="flex:1;font-size:7pt;">
            <div style="font-size:10pt;font-weight:bold;color:${t.colors[0]};margin-bottom:1.5mm;">${card?.name || ''}</div>
            ${personType === 'student' ? renderStudentDetails(card, settings, t.colors[0]) : renderStaffDetails(card, settings, t.colors[0])}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:5pt;color:#94a3b8;margin-top:auto;padding-top:1mm;">
          <span>${settings.showSchoolPhone && school?.phone ? '📞 ' + school.phone : ''}</span>
          <span>${settings.showValidUntil ? 'Valid: ' + (card?.valid_until || (new Date().getFullYear() + 1)) : ''}</span>
        </div>
      </div>
    </div>`;
};

const renderElegantFront = (card, school, photo, settings, personType, gradient) => {
  return `
    <div class="id-card" style="width:85.6mm;height:54mm;background:${gradient};border-radius:3mm;overflow:hidden;position:relative;color:white;padding:3mm;box-sizing:border-box;border:1mm solid #fbbf24;">
      ${school?.logo_url ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.1;z-index:0;"><img src="${school.logo_url}" style="width:35mm;height:35mm;object-fit:contain;" /></div>` : ''}
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:2mm;padding-bottom:1.5mm;border-bottom:0.5mm solid #fbbf24;margin-bottom:2mm;">
          ${school?.logo_url ? `<div style="width:9mm;height:9mm;background:white;border-radius:50%;padding:0.5mm;flex-shrink:0;border:0.5mm solid #fbbf24;"><img src="${school.logo_url}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" /></div>` : ''}
          <div style="flex:1;text-align:center;">
            <div style="font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#fef08a;">${school?.name || 'School'}</div>
            ${settings.showSchoolAddress && school?.address ? `<div style="font-size:5.5pt;opacity:0.85;">${school.address}</div>` : ''}
            <div style="font-size:6pt;background:rgba(251,191,36,0.3);border:0.3mm solid rgba(251,191,36,0.5);padding:0.5mm 3mm;border-radius:2mm;display:inline-block;margin-top:0.8mm;font-weight:bold;color:#fef08a;">${card?.card_type || (personType === 'student' ? '✦ STUDENT ID ✦' : '✦ STAFF ID ✦')}</div>
          </div>
        </div>
        <div style="display:flex;gap:3mm;flex:1;">
          <div style="width:18mm;flex-shrink:0;">
            <div style="width:18mm;height:22mm;background:white;border-radius:2mm;border:0.5mm solid #fbbf24;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#999;font-size:7pt;">Photo</span>'}
            </div>
          </div>
          <div style="flex:1;font-size:7pt;">
            <div style="font-size:10pt;font-weight:bold;color:#fef08a;margin-bottom:1.5mm;">${card?.name || ''}</div>
            ${personType === 'student' ? renderStudentDetails(card, settings) : renderStaffDetails(card, settings)}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:5pt;opacity:0.8;margin-top:auto;padding-top:1mm;border-top:0.3mm solid rgba(251,191,36,0.3);">
          <span>${settings.showSchoolPhone && school?.phone ? '📞 ' + school.phone : ''}</span>
          <span>${settings.showValidUntil ? 'Valid: ' + (card?.valid_until || (new Date().getFullYear() + 1)) : ''}</span>
        </div>
      </div>
    </div>`;
};

const renderMinimalFront = (card, school, photo, settings, personType, gradient) => {
  const t = COLOR_THEMES.find(c => c.id === settings.colorTheme) || COLOR_THEMES[0];
  return `
    <div class="id-card" style="width:85.6mm;height:54mm;background:white;border-radius:3mm;overflow:hidden;position:relative;color:#1e293b;box-sizing:border-box;border:0.5mm solid #e2e8f0;">
      <div style="height:2mm;background:${gradient};"></div>
      <div style="padding:2.5mm 3mm;display:flex;flex-direction:column;height:calc(100% - 2mm);">
        <div style="display:flex;align-items:center;gap:2mm;margin-bottom:2mm;">
          ${school?.logo_url ? `<img src="${school.logo_url}" style="width:6mm;height:6mm;object-fit:contain;" />` : ''}
          <span style="font-size:7pt;font-weight:bold;color:${t.colors[0]};">${school?.name || 'School'}</span>
        </div>
        <div style="display:flex;gap:3mm;flex:1;">
          <div style="width:18mm;flex-shrink:0;">
            <div style="width:18mm;height:22mm;background:#f8fafc;border-radius:2mm;border:0.3mm solid #e2e8f0;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#cbd5e1;font-size:7pt;">Photo</span>'}
            </div>
          </div>
          <div style="flex:1;font-size:7pt;">
            <div style="font-size:10pt;font-weight:bold;color:${t.colors[0]};margin-bottom:1mm;">${card?.name || ''}</div>
            ${personType === 'student' ? renderStudentDetails(card, settings, t.colors[0]) : renderStaffDetails(card, settings, t.colors[0])}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:5pt;color:#94a3b8;margin-top:auto;padding-top:1mm;">
          <span>${settings.showSchoolPhone && school?.phone ? '📞 ' + school.phone : ''}</span>
          <span>${settings.showValidUntil ? 'Valid: ' + (card?.valid_until || (new Date().getFullYear() + 1)) : ''}</span>
        </div>
      </div>
    </div>`;
};

const renderVerticalFront = (card, school, photo, settings, personType, gradient) => {
  return `
    <div class="id-card" style="width:54mm;height:85.6mm;background:${gradient};border-radius:3mm;overflow:hidden;position:relative;color:white;padding:3mm;box-sizing:border-box;">
      ${school?.logo_url ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.1;z-index:0;"><img src="${school.logo_url}" style="width:30mm;height:30mm;object-fit:contain;" /></div>` : ''}
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;">
        <div style="width:100%;padding-bottom:2mm;border-bottom:0.3mm solid rgba(255,255,255,0.3);margin-bottom:2mm;">
          ${school?.logo_url ? `<div style="width:10mm;height:10mm;background:white;border-radius:50%;padding:0.5mm;margin:0 auto 1mm;"><img src="${school.logo_url}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" /></div>` : ''}
          <div style="font-size:8pt;font-weight:bold;text-transform:uppercase;">${school?.name || 'School'}</div>
          <div style="font-size:5.5pt;background:rgba(255,255,255,0.25);padding:0.5mm 2mm;border-radius:2mm;display:inline-block;margin-top:1mm;font-weight:bold;">${personType === 'student' ? 'STUDENT' : 'STAFF'}</div>
        </div>
        <div style="width:22mm;height:28mm;background:white;border-radius:2mm;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:2mm;">
          ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#999;font-size:7pt;">Photo</span>'}
        </div>
        <div style="font-size:10pt;font-weight:bold;color:#fef08a;margin-bottom:1.5mm;">${card?.name || ''}</div>
        <div style="font-size:7pt;text-align:left;width:100%;">
          ${personType === 'student' ? renderStudentDetails(card, settings) : renderStaffDetails(card, settings)}
        </div>
        <div style="font-size:5pt;opacity:0.8;margin-top:auto;width:100%;text-align:center;">
          ${settings.showValidUntil ? 'Valid: ' + (card?.valid_until || (new Date().getFullYear() + 1)) : ''}
        </div>
      </div>
    </div>`;
};

const renderStudentDetails = (card, settings, labelColor) => {
  const lc = labelColor || 'inherit';
  const labelStyle = labelColor ? `color:${labelColor};opacity:1;` : 'opacity:0.7;';
  let html = '';
  html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Class:</span><span style="font-weight:600;">${card?.class || ''}</span></div>`;
  if (settings.showRollNo && card?.roll_no) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Roll No:</span><span style="font-weight:600;">${card.roll_no}</span></div>`;
  if (settings.showAdmissionNo && card?.admission_no) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Adm No:</span><span style="font-weight:600;">${card.admission_no}</span></div>`;
  if (settings.showFatherName && card?.father_name) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Father:</span><span style="font-weight:600;">${card.father_name}</span></div>`;
  if (settings.showMotherName && card?.mother_name) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Mother:</span><span style="font-weight:600;">${card.mother_name}</span></div>`;
  if (settings.showDOB && card?.dob) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">DOB:</span><span style="font-weight:600;">${card.dob}</span></div>`;
  if (settings.showBloodGroup && card?.blood_group) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Blood:</span><span style="font-weight:600;">${card.blood_group}</span></div>`;
  if (settings.showSamgraId && card?.samgra_id) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Samgra:</span><span style="font-weight:600;">${card.samgra_id}</span></div>`;
  if (settings.showAddress && card?.address) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Address:</span><span style="font-weight:600;font-size:6pt;">${card.address}</span></div>`;
  if (settings.showPhone && (card?.parent_phone || card?.phone)) {
    const phoneColor = labelColor ? `background:${labelColor}15;border:0.3mm solid ${labelColor}30;` : 'background:rgba(255,255,255,0.2);';
    html += `<div style="${phoneColor}border-radius:1.5mm;padding:1mm 1.5mm;margin-top:1mm;font-size:6.5pt;"><span style="font-weight:bold;${labelColor ? `color:${labelColor};` : 'color:#fca5a5;'}">📞 Parent: </span><span style="font-weight:bold;">${card.parent_phone || card.phone}</span></div>`;
  }
  return html;
};

const renderStaffDetails = (card, settings, labelColor) => {
  const lc = labelColor || 'inherit';
  const labelStyle = labelColor ? `color:${labelColor};opacity:1;` : 'opacity:0.7;';
  let html = '';
  if (settings.showDesignation) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Desig:</span><span style="font-weight:600;">${card?.designation || ''}${card?.designation_hindi ? ' / ' + card.designation_hindi : ''}</span></div>`;
  if (settings.showDepartment && card?.department) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Dept:</span><span style="font-weight:600;">${card.department}</span></div>`;
  if (settings.showEmpId && card?.id_number) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Emp ID:</span><span style="font-weight:600;">${card.id_number}</span></div>`;
  if (settings.showBloodGroup && card?.blood_group) html += `<div style="margin-bottom:1mm;"><span style="width:14mm;display:inline-block;${labelStyle}">Blood:</span><span style="font-weight:600;">${card.blood_group}</span></div>`;
  if (settings.showPhone && card?.phone) {
    const phoneColor = labelColor ? `background:${labelColor}15;border:0.3mm solid ${labelColor}30;` : 'background:rgba(255,255,255,0.2);';
    html += `<div style="${phoneColor}border-radius:1.5mm;padding:1mm 1.5mm;margin-top:1mm;font-size:6.5pt;"><span style="font-weight:bold;${labelColor ? `color:${labelColor};` : 'color:#86efac;'}">📞 </span><span style="font-weight:bold;">${card.phone}</span></div>`;
  }
  if (settings.showEmergencyContact && card?.emergency_contact) {
    const ecColor = labelColor ? `background:${labelColor}10;border:0.3mm solid ${labelColor}20;` : 'background:rgba(255,255,255,0.2);';
    html += `<div style="${ecColor}border-radius:1.5mm;padding:1mm 1.5mm;margin-top:1mm;font-size:6.5pt;"><span style="font-weight:bold;${labelColor ? `color:${labelColor};` : 'color:#fca5a5;'}">🆘 Emergency: </span><span style="font-weight:bold;">${card.emergency_contact}</span></div>`;
  }
  return html;
};

const renderBack = (card, school, personType, settings, gradient) => {
  const isVertical = settings.template === 'vertical';
  const w = isVertical ? '54mm' : '85.6mm';
  const h = isVertical ? '85.6mm' : '54mm';
  return `
    <div class="id-card-back" style="width:${w};height:${h};background:${gradient};border-radius:3mm;overflow:hidden;position:relative;color:white;box-sizing:border-box;display:flex;align-items:center;justify-content:center;">
      ${school?.logo_url ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.15;z-index:0;"><img src="${school.logo_url}" style="width:35mm;height:35mm;object-fit:contain;" /></div>` : ''}
      <div style="position:relative;z-index:1;text-align:center;padding:4mm;">
        <div style="font-size:${isVertical ? '16pt' : '20pt'};font-weight:bold;letter-spacing:2px;margin-bottom:3mm;">${personType === 'student' ? 'STUDENT OF' : (card?.designation || 'STAFF')}</div>
        ${personType !== 'student' && card?.designation_hindi ? `<div style="font-size:10pt;opacity:0.9;margin-bottom:2mm;">${card.designation_hindi}</div>` : ''}
        ${personType !== 'student' ? '<div style="font-size:8pt;letter-spacing:3px;opacity:0.7;margin-bottom:2mm;">OF</div>' : ''}
        <div style="font-size:${isVertical ? '10pt' : '12pt'};font-weight:bold;text-transform:uppercase;padding:0 4mm;line-height:1.4;">${school?.name || 'School Name'}</div>
        ${settings.showSchoolAddress && school?.address ? `<div style="font-size:7pt;margin-top:3mm;opacity:0.8;max-width:90%;margin-left:auto;margin-right:auto;">${school.address}</div>` : ''}
        ${settings.showSchoolPhone && school?.phone ? `<div style="font-size:8pt;margin-top:2mm;opacity:0.9;">📞 ${school.phone}</div>` : ''}
        <div style="position:absolute;bottom:3mm;left:0;right:0;text-align:center;font-size:6pt;opacity:0.6;">If found, please return to school</div>
      </div>
    </div>`;
};

const TEMPLATE_RENDERERS = {
  classic: renderClassicFront,
  modern: renderModernFront,
  elegant: renderElegantFront,
  minimal: renderMinimalFront,
  vertical: renderVerticalFront,
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
  const [showBack, setShowBack] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(loadIDCardSettings);
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

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveIDCardSettings(updated);
      return updated;
    });
  };

  const gradient = getGradient(settings.colorTheme);

  const getCardHtml = () => {
    if (!cardData) return '';
    const { id_card: card, school, photo } = cardData;
    const renderer = TEMPLATE_RENDERERS[settings.template] || TEMPLATE_RENDERERS.classic;
    return renderer(card, school, photo, settings, personType, gradient);
  };

  const getBackHtml = () => {
    if (!cardData) return '';
    const { id_card: card, school } = cardData;
    return renderBack(card, school, personType, settings, gradient);
  };

  const printCard = () => {
    const isVertical = settings.template === 'vertical';
    const pageSize = isVertical ? '54mm 85.6mm' : '85.6mm 54mm';
    const html = showBack ? getBackHtml() : getCardHtml();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card Print</title><style>@page{size:${pageSize};margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{background:white;}}</style></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},500);}<\/script></body></html>`);
    printWindow.document.close();
  };

  const getPreviewStyle = () => {
    const isVertical = settings.template === 'vertical';
    return {
      width: isVertical ? '215px' : '340px',
      height: isVertical ? '340px' : '215px',
    };
  };

  if (!isOpen) return null;

  const card = cardData?.id_card;
  const school = cardData?.school;
  const photo = cardData?.photo;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${showSettings ? 'max-w-3xl' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{personType === 'student' ? 'Student' : 'Employee'} ID Card</span>
            <Button size="sm" variant={showSettings ? 'default' : 'outline'} className="gap-1.5 h-7 text-xs" onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className="w-3.5 h-3.5" />
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : cardData ? (
          <div className={showSettings ? 'flex gap-4' : ''}>
            {showSettings && (
              <div className="w-56 flex-shrink-0 space-y-3 border-r border-gray-100 pr-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1.5"><Layout className="w-3.5 h-3.5" /> Template</label>
                  <div className="space-y-1">
                    {ID_CARD_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => updateSetting('template', t.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${settings.template === t.id ? 'bg-blue-50 border border-blue-300 text-blue-700 font-semibold' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        {t.name} <span className="text-gray-400">({t.nameHi})</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Color Theme</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_THEMES.map(c => (
                      <button key={c.id} onClick={() => updateSetting('colorTheme', c.id)} className={`w-full aspect-square rounded-lg border-2 transition-all ${settings.colorTheme === c.id ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:border-gray-300'}`} style={{background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`}} title={c.name} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Show/Hide Fields</label>
                  <div className="space-y-1">
                    {personType === 'student' ? (
                      <>
                        {[
                          ['showFatherName', "Father's Name"],
                          ['showMotherName', "Mother's Name"],
                          ['showRollNo', 'Roll No'],
                          ['showAdmissionNo', 'Admission No'],
                          ['showDOB', 'Date of Birth'],
                          ['showBloodGroup', 'Blood Group'],
                          ['showSamgraId', 'Samgra/PEN ID'],
                          ['showAddress', 'Address'],
                          ['showPhone', 'Parent Phone'],
                          ['showAadhar', 'Aadhar No'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            <input type="checkbox" checked={settings[key]} onChange={(e) => updateSetting(key, e.target.checked)} className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                            {label}
                          </label>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          ['showDesignation', 'Designation'],
                          ['showDepartment', 'Department'],
                          ['showEmpId', 'Employee ID'],
                          ['showBloodGroup', 'Blood Group'],
                          ['showPhone', 'Phone Number'],
                          ['showEmergencyContact', 'Emergency Contact'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            <input type="checkbox" checked={settings[key]} onChange={(e) => updateSetting(key, e.target.checked)} className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                            {label}
                          </label>
                        ))}
                      </>
                    )}
                    <div className="border-t border-gray-100 pt-1 mt-1">
                      {[
                        ['showSchoolAddress', 'School Address'],
                        ['showSchoolPhone', 'School Phone'],
                        ['showValidUntil', 'Valid Until'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                          <input type="checkbox" checked={settings[key]} onChange={(e) => updateSetting(key, e.target.checked)} className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1" ref={printRef}>
              <div className="flex justify-center mb-3">
                <div className="inline-flex bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setShowBack(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!showBack ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}>
                    Front Side
                  </button>
                  <button onClick={() => setShowBack(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${showBack ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}>
                    Back Side
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <div style={getPreviewStyle()} dangerouslySetInnerHTML={{ __html: showBack ? getBackHtml() : getCardHtml() }} />
              </div>

              <div className="flex justify-center gap-3 mt-4">
                <Button onClick={printCard} className="bg-indigo-600 hover:bg-indigo-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Print {showBack ? 'Back' : 'Front'}
                </Button>
                <Button onClick={() => setShowBack(!showBack)} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Flip Card
                </Button>
              </div>
              
              <p className="text-center text-xs text-slate-500 mt-2">
                Print front first, then flip and print back. Standard PVC card size (85.6mm x 54mm)
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            ID Card data load nahi ho saka. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
