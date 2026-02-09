import { useAuth } from '../context/AuthContext';

export default function SchoolLogoWatermark({ 
  opacity = 0.06, 
  size = 'large',
  position = 'center',
  className = '',
  children,
  logoOverride = null
}) {
  const { schoolData } = useAuth();
  const logoUrl = logoOverride || schoolData?.logo_url || schoolData?.logo;

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-72 h-72',
    full: 'w-full h-full max-w-[80%] max-h-[80%]'
  };

  const positionClasses = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`relative ${className}`}>
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
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function GlobalWatermark() {
  const { schoolData } = useAuth();
  const logoUrl = schoolData?.logo_url || schoolData?.logo;

  if (!logoUrl) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <img 
        src={logoUrl} 
        alt="" 
        className="w-[500px] h-[500px] object-contain"
        style={{ opacity: 0.04 }}
        aria-hidden="true"
      />
    </div>
  );
}

export function WatermarkSettings({ settings, onChange }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-gray-700 flex items-center gap-2">
        Logo Watermark Settings
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-gray-500">Logo will appear as background on all pages</p>
            </div>
          </label>
        </div>
        
        {settings?.watermark_enabled && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700">Opacity</label>
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
            
            <div>
              <label className="text-sm font-medium text-gray-700">Size</label>
              <select
                value={settings?.watermark_size || 'large'}
                onChange={(e) => onChange({ ...settings, watermark_size: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full Page</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Position</label>
              <select
                value={settings?.watermark_position || 'center'}
                onChange={(e) => onChange({ ...settings, watermark_position: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="center">Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-left">Top Left</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Apply To:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'notices', label: 'Notices' },
                  { key: 'admit_cards', label: 'Admit Cards' },
                  { key: 'calendar', label: 'Calendar' },
                  { key: 'fee_receipts', label: 'Fee Receipts' },
                  { key: 'reports', label: 'Reports' },
                  { key: 'certificates', label: 'Certificates' },
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
