/**
 * Global School Watermark Component
 * Shows school logo as watermark in background
 * Used across all pages: Dashboard, Notices, Receipts, ID Cards, etc.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Context for school data including logo
const SchoolContext = createContext(null);

export function SchoolProvider({ children, schoolId }) {
  const [schoolData, setSchoolData] = useState(null);

  useEffect(() => {
    if (schoolId) {
      fetchSchoolData();
    }
  }, [schoolId]);

  const fetchSchoolData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/schools/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchoolData(response.data);
    } catch (error) {
      console.error('Failed to fetch school data:', error);
    }
  };

  return (
    <SchoolContext.Provider value={{ schoolData, refreshSchool: fetchSchoolData }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}

/**
 * Watermark Component - Shows logo as background watermark
 * @param {Object} props
 * @param {string} props.logoUrl - Direct logo URL (optional, uses context if not provided)
 * @param {number} props.opacity - Watermark opacity (default: 0.08)
 * @param {string} props.size - 'small' | 'medium' | 'large' | 'full' (default: 'large')
 * @param {string} props.position - 'center' | 'top-right' | 'bottom-right' (default: 'center')
 */
export function Watermark({ 
  logoUrl, 
  opacity = 0.08, 
  size = 'large',
  position = 'center',
  className = ''
}) {
  const context = useSchool();
  const logo = logoUrl || context?.schoolData?.logo_url;

  if (!logo) return null;

  const sizeStyles = {
    small: { width: '100px', height: '100px' },
    medium: { width: '200px', height: '200px' },
    large: { width: '300px', height: '300px' },
    full: { width: '80%', height: '80%', maxWidth: '500px', maxHeight: '500px' }
  };

  const positionStyles = {
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-right': { top: '20px', right: '20px', transform: 'none' },
    'bottom-right': { bottom: '20px', right: '20px', transform: 'none' },
    'top-left': { top: '20px', left: '20px', transform: 'none' },
    'bottom-left': { bottom: '20px', left: '20px', transform: 'none' }
  };

  return (
    <div 
      className={`pointer-events-none ${className}`}
      style={{
        position: 'absolute',
        ...positionStyles[position],
        opacity: opacity,
        zIndex: 0,
        ...sizeStyles[size]
      }}
    >
      <img 
        src={logo} 
        alt="" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain'
        }} 
      />
    </div>
  );
}

/**
 * Page Wrapper with Watermark
 * Wraps content with school logo watermark in background
 */
export function PageWithWatermark({ 
  children, 
  logoUrl,
  showWatermark = true,
  opacity = 0.06,
  size = 'full',
  position = 'center',
  className = ''
}) {
  const context = useSchool();
  const logo = logoUrl || context?.schoolData?.logo_url;

  return (
    <div className={`relative min-h-full ${className}`}>
      {/* Background Watermark */}
      {showWatermark && logo && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: opacity,
            zIndex: 0,
            width: '60vw',
            maxWidth: '600px',
            height: '60vh',
            maxHeight: '600px',
            pointerEvents: 'none'
          }}
        >
          <img 
            src={logo} 
            alt="" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }} 
          />
        </div>
      )}
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Print Watermark - For printable documents
 */
export function PrintWatermark({ logoUrl, opacity = 0.1 }) {
  const context = useSchool();
  const logo = logoUrl || context?.schoolData?.logo_url;

  if (!logo) return null;

  return (
    <div 
      className="print-watermark"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: opacity,
        width: '70%',
        height: '70%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <img 
        src={logo} 
        alt="" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain'
        }} 
      />
    </div>
  );
}

export default Watermark;
