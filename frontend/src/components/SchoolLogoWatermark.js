/**
 * SchoolLogoWatermark Component
 * Adds school logo as background watermark
 * Used in: Notices, Admit Cards, Calendar, Reports
 */

import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SchoolLogoWatermark({ 
  schoolId, 
  opacity = 0.08, 
  size = 'large', // 'small', 'medium', 'large', 'full'
  position = 'center', // 'center', 'top-right', 'bottom-right', 'top-left', 'bottom-left'
  className = '',
  children 
}) {
  const [logoUrl, setLogoUrl] = useState(null);
  
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      if (!schoolId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/schools/${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.logo_url) {
          setLogoUrl(res.data.logo_url);
        }
      } catch (error) {
        console.log('Could not fetch school logo:', error);
      }
    };
    fetchSchoolLogo();
  }, [schoolId]);

  // Size classes
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-72 h-72',
    full: 'w-full h-full max-w-[80%] max-h-[80%]'
  };

  // Position classes
  const positionClasses = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Watermark */}
      {logoUrl && (
        <div 
          className={`absolute ${positionClasses[position]} pointer-events-none z-0`}
          style={{ opacity }}
        >
          <img 
            src={logoUrl} 
            alt="" 
            className={`${sizeClasses[size]} object-contain`}
            aria-hidden="true"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Watermark Settings Component for School Settings
export function WatermarkSettings({ settings, onChange }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-gray-700 flex items-center gap-2">
        🖼️ Logo Watermark Settings
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Enable Watermark */}
        <div className="col-span-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white border hover:bg-indigo-50">
            <input
              type="checkbox"
              checked={settings?.watermark_enabled || false}
              onChange={(e) => onChange({ ...settings, watermark_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600"
            />
            <div>
              <span className="font-medium">Enable Logo Watermark</span>
              <p className="text-xs text-gray-500">Logo har document mein background mein dikhega</p>
            </div>
          </label>
        </div>
        
        {settings?.watermark_enabled && (
          <>
            {/* Opacity */}
            <div>
              <label className="text-sm font-medium text-gray-700">Opacity / पारदर्शिता</label>
              <input
                type="range"
                min="0.03"
                max="0.2"
                step="0.01"
                value={settings?.watermark_opacity || 0.08}
                onChange={(e) => onChange({ ...settings, watermark_opacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Light</span>
                <span>{Math.round((settings?.watermark_opacity || 0.08) * 100)}%</span>
                <span>Dark</span>
              </div>
            </div>
            
            {/* Size */}
            <div>
              <label className="text-sm font-medium text-gray-700">Size / आकार</label>
              <select
                value={settings?.watermark_size || 'large'}
                onChange={(e) => onChange({ ...settings, watermark_size: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="small">Small (छोटा)</option>
                <option value="medium">Medium (मध्यम)</option>
                <option value="large">Large (बड़ा)</option>
                <option value="full">Full Page (पूरा पेज)</option>
              </select>
            </div>
            
            {/* Position */}
            <div>
              <label className="text-sm font-medium text-gray-700">Position / स्थान</label>
              <select
                value={settings?.watermark_position || 'center'}
                onChange={(e) => onChange({ ...settings, watermark_position: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="center">Center (बीच में)</option>
                <option value="top-right">Top Right (ऊपर दाएं)</option>
                <option value="bottom-right">Bottom Right (नीचे दाएं)</option>
                <option value="top-left">Top Left (ऊपर बाएं)</option>
                <option value="bottom-left">Bottom Left (नीचे बाएं)</option>
              </select>
            </div>
            
            {/* Apply To */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Apply To / इन पर लगाएं:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'notices', label: '📢 Notices' },
                  { key: 'admit_cards', label: '🎫 Admit Cards' },
                  { key: 'calendar', label: '📅 Calendar' },
                  { key: 'fee_receipts', label: '🧾 Fee Receipts' },
                  { key: 'reports', label: '📊 Reports' },
                  { key: 'certificates', label: '🏆 Certificates' },
                ].map(item => (
                  <label 
                    key={item.key}
                    className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition ${
                      settings?.watermark_apply?.[item.key] 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings?.watermark_apply?.[item.key] || false}
                      onChange={(e) => onChange({ 
                        ...settings, 
                        watermark_apply: { 
                          ...settings?.watermark_apply, 
                          [item.key]: e.target.checked 
                        } 
                      })}
                      className="hidden"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
