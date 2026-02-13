import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_PRESETS = {
  default: {
    name: 'Default Blue',
    headerBg: '#3b82f6',
    headerText: '#ffffff',
    sidebarFrom: '#eff6ff',
    sidebarVia: '#f0f9ff',
    sidebarTo: '#eef2ff',
    sidebarActive: '#3b82f6',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#3b82f6',
  },
  teal: {
    name: 'Teal',
    headerBg: '#0d9488',
    headerText: '#ffffff',
    sidebarFrom: '#f0fdfa',
    sidebarVia: '#f0fdfa',
    sidebarTo: '#ecfdf5',
    sidebarActive: '#0d9488',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#0d9488',
  },
  purple: {
    name: 'Purple',
    headerBg: '#7c3aed',
    headerText: '#ffffff',
    sidebarFrom: '#faf5ff',
    sidebarVia: '#f5f3ff',
    sidebarTo: '#ede9fe',
    sidebarActive: '#7c3aed',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#7c3aed',
  },
  rose: {
    name: 'Rose',
    headerBg: '#e11d48',
    headerText: '#ffffff',
    sidebarFrom: '#fff1f2',
    sidebarVia: '#ffe4e6',
    sidebarTo: '#fce7f3',
    sidebarActive: '#e11d48',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#e11d48',
  },
  amber: {
    name: 'Amber',
    headerBg: '#d97706',
    headerText: '#ffffff',
    sidebarFrom: '#fffbeb',
    sidebarVia: '#fef3c7',
    sidebarTo: '#fff7ed',
    sidebarActive: '#d97706',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#d97706',
  },
  slate: {
    name: 'Slate',
    headerBg: '#334155',
    headerText: '#ffffff',
    sidebarFrom: '#f8fafc',
    sidebarVia: '#f1f5f9',
    sidebarTo: '#e2e8f0',
    sidebarActive: '#334155',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#334155',
  },
  green: {
    name: 'Green',
    headerBg: '#16a34a',
    headerText: '#ffffff',
    sidebarFrom: '#f0fdf4',
    sidebarVia: '#ecfdf5',
    sidebarTo: '#f0fdf4',
    sidebarActive: '#16a34a',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#16a34a',
  },
  indigo: {
    name: 'Indigo',
    headerBg: '#4f46e5',
    headerText: '#ffffff',
    sidebarFrom: '#eef2ff',
    sidebarVia: '#e0e7ff',
    sidebarTo: '#eef2ff',
    sidebarActive: '#4f46e5',
    sidebarText: '#475569',
    sidebarActiveText: '#ffffff',
    accent: '#4f46e5',
  },
};

const DARK_THEME = {
  headerBg: '#1e293b',
  headerText: '#f1f5f9',
  sidebarFrom: '#0f172a',
  sidebarVia: '#1e293b',
  sidebarTo: '#0f172a',
  sidebarActive: '#3b82f6',
  sidebarText: '#94a3b8',
  sidebarActiveText: '#ffffff',
  pageBg: '#0f172a',
  cardBg: '#1e293b',
  cardBorder: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme_dark_mode') === 'true';
  });
  const [activePreset, setActivePreset] = useState(() => {
    return localStorage.getItem('theme_preset') || 'default';
  });
  const [customHeaderColor, setCustomHeaderColor] = useState(() => {
    return localStorage.getItem('theme_header_color') || '';
  });
  const [headerLogoSize, setHeaderLogoSize] = useState(() => {
    return parseInt(localStorage.getItem('theme_logo_size') || '36');
  });

  useEffect(() => {
    localStorage.setItem('theme_dark_mode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('theme_preset', activePreset);
  }, [activePreset]);

  useEffect(() => {
    localStorage.setItem('theme_header_color', customHeaderColor);
  }, [customHeaderColor]);

  useEffect(() => {
    localStorage.setItem('theme_logo_size', headerLogoSize.toString());
  }, [headerLogoSize]);

  const currentPreset = THEME_PRESETS[activePreset] || THEME_PRESETS.default;

  const getHeaderBg = () => {
    if (isDarkMode) return DARK_THEME.headerBg;
    if (customHeaderColor) return customHeaderColor;
    return currentPreset.headerBg;
  };

  const getHeaderText = () => {
    if (isDarkMode) return DARK_THEME.headerText;
    return currentPreset.headerText;
  };

  const getSidebarStyle = () => {
    if (isDarkMode) {
      return {
        background: `linear-gradient(to bottom, ${DARK_THEME.sidebarFrom}, ${DARK_THEME.sidebarVia}, ${DARK_THEME.sidebarTo})`,
        borderColor: DARK_THEME.cardBorder,
      };
    }
    return {
      background: `linear-gradient(to bottom, ${currentPreset.sidebarFrom}, ${currentPreset.sidebarVia}, ${currentPreset.sidebarTo})`,
    };
  };

  const getSidebarActiveColor = () => {
    if (isDarkMode) return DARK_THEME.sidebarActive;
    if (customHeaderColor) return customHeaderColor;
    return currentPreset.sidebarActive;
  };

  const theme = {
    isDarkMode,
    setIsDarkMode,
    toggleDarkMode: () => setIsDarkMode(prev => !prev),
    activePreset,
    setActivePreset,
    customHeaderColor,
    setCustomHeaderColor,
    headerLogoSize,
    setHeaderLogoSize,
    currentPreset,
    presets: THEME_PRESETS,
    darkTheme: DARK_THEME,
    getHeaderBg,
    getHeaderText,
    getSidebarStyle,
    getSidebarActiveColor,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { THEME_PRESETS };
