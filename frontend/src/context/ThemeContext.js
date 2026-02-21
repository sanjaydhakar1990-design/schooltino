import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/* ============================================================
   THEME PRESETS
   Each theme defines: accent color, header style, sidebar style
   ============================================================ */
export const THEME_PRESETS = {
  /* ---- LIGHT THEMES (White sidebar, colored accent) ---- */
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    emoji: '💜',
    category: 'light',
    accent: '#4f46e5',
    accentBg: '#eef2ff',         // very light accent bg for active items
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    // Legacy compat
    headerBg_colored: '#4f46e5',
    sidebarActive: '#4f46e5',
    sidebarFrom: '#eef2ff', sidebarVia: '#e0e7ff', sidebarTo: '#eef2ff',
  },
  blue: {
    id: 'blue',
    name: 'Sky Blue',
    emoji: '🔵',
    category: 'light',
    accent: '#2563eb',
    accentBg: '#eff6ff',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#2563eb',
    sidebarActive: '#2563eb',
    sidebarFrom: '#eff6ff', sidebarVia: '#dbeafe', sidebarTo: '#eff6ff',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    emoji: '💚',
    category: 'light',
    accent: '#059669',
    accentBg: '#ecfdf5',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#059669',
    sidebarActive: '#059669',
    sidebarFrom: '#ecfdf5', sidebarVia: '#d1fae5', sidebarTo: '#ecfdf5',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    emoji: '🟣',
    category: 'light',
    accent: '#7c3aed',
    accentBg: '#faf5ff',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#7c3aed',
    sidebarActive: '#7c3aed',
    sidebarFrom: '#faf5ff', sidebarVia: '#ede9fe', sidebarTo: '#faf5ff',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    emoji: '🌸',
    category: 'light',
    accent: '#e11d48',
    accentBg: '#fff1f2',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#e11d48',
    sidebarActive: '#e11d48',
    sidebarFrom: '#fff1f2', sidebarVia: '#ffe4e6', sidebarTo: '#fff1f2',
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    emoji: '🌻',
    category: 'light',
    accent: '#d97706',
    accentBg: '#fffbeb',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#d97706',
    sidebarActive: '#d97706',
    sidebarFrom: '#fffbeb', sidebarVia: '#fef3c7', sidebarTo: '#fffbeb',
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    emoji: '🌊',
    category: 'light',
    accent: '#0d9488',
    accentBg: '#f0fdfa',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#0d9488',
    sidebarActive: '#0d9488',
    sidebarFrom: '#f0fdfa', sidebarVia: '#ccfbf1', sidebarTo: '#f0fdfa',
  },
  pink: {
    id: 'pink',
    name: 'Pink',
    emoji: '🩷',
    category: 'light',
    accent: '#db2777',
    accentBg: '#fdf2f8',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#db2777',
    sidebarActive: '#db2777',
    sidebarFrom: '#fdf2f8', sidebarVia: '#fce7f3', sidebarTo: '#fdf2f8',
  },

  /* ---- COLORED HEADER THEMES ---- */
  navy: {
    id: 'navy',
    name: 'Navy Blue',
    emoji: '🏫',
    category: 'colored',
    accent: '#1e40af',
    accentBg: '#eff6ff',
    headerBg: '#1e40af',
    headerText: '#ffffff',
    headerBorder: '#1e3a8a',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#1e40af',
    sidebarActive: '#1e40af',
    sidebarFrom: '#eff6ff', sidebarVia: '#dbeafe', sidebarTo: '#eff6ff',
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    emoji: '🌿',
    category: 'colored',
    accent: '#15803d',
    accentBg: '#f0fdf4',
    headerBg: '#15803d',
    headerText: '#ffffff',
    headerBorder: '#166534',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#15803d',
    sidebarActive: '#15803d',
    sidebarFrom: '#f0fdf4', sidebarVia: '#dcfce7', sidebarTo: '#f0fdf4',
  },
  maroon: {
    id: 'maroon',
    name: 'Deep Maroon',
    emoji: '🍷',
    category: 'colored',
    accent: '#9f1239',
    accentBg: '#fff1f2',
    headerBg: '#9f1239',
    headerText: '#ffffff',
    headerBorder: '#881337',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#9f1239',
    sidebarActive: '#9f1239',
    sidebarFrom: '#fff1f2', sidebarVia: '#ffe4e6', sidebarTo: '#fff1f2',
  },
  royal: {
    id: 'royal',
    name: 'Royal Purple',
    emoji: '👑',
    category: 'colored',
    accent: '#6d28d9',
    accentBg: '#faf5ff',
    headerBg: '#6d28d9',
    headerText: '#ffffff',
    headerBorder: '#5b21b6',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#6d28d9',
    sidebarActive: '#6d28d9',
    sidebarFrom: '#faf5ff', sidebarVia: '#ede9fe', sidebarTo: '#faf5ff',
  },

  /* ---- DARK THEMES ---- */
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    emoji: '🌙',
    category: 'dark',
    accent: '#6366f1',
    accentBg: '#1e1b4b',
    headerBg: '#0f172a',
    headerText: '#f1f5f9',
    headerBorder: '#1e293b',
    sidebarBg: '#0f172a',
    sidebarBorder: '#1e293b',
    headerBg_colored: '#0f172a',
    sidebarActive: '#6366f1',
    sidebarFrom: '#0f172a', sidebarVia: '#1e293b', sidebarTo: '#0f172a',
    isDark: true,
  },
  darkGreen: {
    id: 'darkGreen',
    name: 'Dark Forest',
    emoji: '🌲',
    category: 'dark',
    accent: '#22c55e',
    accentBg: '#052e16',
    headerBg: '#052e16',
    headerText: '#dcfce7',
    headerBorder: '#14532d',
    sidebarBg: '#052e16',
    sidebarBorder: '#14532d',
    headerBg_colored: '#052e16',
    sidebarActive: '#22c55e',
    sidebarFrom: '#052e16', sidebarVia: '#14532d', sidebarTo: '#052e16',
    isDark: true,
  },

  /* ---- LEGACY (keeping for backward compat) ---- */
  default: {
    id: 'default',
    name: 'Indigo (Legacy)',
    emoji: '💜',
    category: 'light',
    accent: '#4f46e5',
    accentBg: '#eef2ff',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#4f46e5',
    sidebarActive: '#4f46e5',
    sidebarFrom: '#eef2ff', sidebarVia: '#e0e7ff', sidebarTo: '#eef2ff',
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    emoji: '🪨',
    category: 'light',
    accent: '#475569',
    accentBg: '#f8fafc',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#334155',
    sidebarActive: '#475569',
    sidebarFrom: '#f8fafc', sidebarVia: '#f1f5f9', sidebarTo: '#f8fafc',
  },
  green: {
    id: 'green',
    name: 'Green',
    emoji: '💚',
    category: 'light',
    accent: '#16a34a',
    accentBg: '#f0fdf4',
    headerBg: '#ffffff',
    headerText: '#111827',
    headerBorder: '#e5e7eb',
    sidebarBg: '#ffffff',
    sidebarBorder: '#f3f4f6',
    headerBg_colored: '#16a34a',
    sidebarActive: '#16a34a',
    sidebarFrom: '#f0fdf4', sidebarVia: '#dcfce7', sidebarTo: '#f0fdf4',
  },
};

/* ============================================================
   THEME PROVIDER
   ============================================================ */
export function ThemeProvider({ children }) {
  const [activePreset, setActivePresetState] = useState(() => {
    return localStorage.getItem('theme_preset') || 'indigo';
  });
  const [customHeaderColor, setCustomHeaderColorState] = useState(() => {
    return localStorage.getItem('theme_header_color') || '';
  });
  const [headerLogoSize, setHeaderLogoSizeState] = useState(() => {
    return parseInt(localStorage.getItem('theme_logo_size') || '36');
  });

  const currentPreset = THEME_PRESETS[activePreset] || THEME_PRESETS.indigo;
  const isDarkMode = currentPreset.isDark === true;

  /* Apply CSS variables to :root for global theme access */
  useEffect(() => {
    const accent = customHeaderColor || currentPreset.accent;
    const accentBg = currentPreset.accentBg;
    document.documentElement.style.setProperty('--theme-accent', accent);
    document.documentElement.style.setProperty('--theme-accent-bg', accentBg);
    document.documentElement.style.setProperty('--theme-header-bg', currentPreset.headerBg);
    document.documentElement.style.setProperty('--theme-header-text', currentPreset.headerText);
    document.documentElement.style.setProperty('--theme-sidebar-bg', currentPreset.sidebarBg);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [activePreset, customHeaderColor, currentPreset, isDarkMode]);

  const setActivePreset = (preset) => {
    setActivePresetState(preset);
    localStorage.setItem('theme_preset', preset);
  };

  const setCustomHeaderColor = (color) => {
    setCustomHeaderColorState(color);
    localStorage.setItem('theme_header_color', color);
  };

  const setHeaderLogoSize = (size) => {
    setHeaderLogoSizeState(size);
    localStorage.setItem('theme_logo_size', size.toString());
  };

  /* Helper getters for backward compatibility */
  const getAccentColor = () => customHeaderColor || currentPreset.accent;
  const getAccentBg = () => currentPreset.accentBg;
  const getHeaderBg = () => customHeaderColor && !isDarkMode ? customHeaderColor : currentPreset.headerBg;
  const getHeaderText = () => customHeaderColor && !isDarkMode ? '#ffffff' : currentPreset.headerText;
  const getSidebarStyle = () => ({
    background: isDarkMode
      ? `linear-gradient(180deg, ${currentPreset.sidebarFrom} 0%, ${currentPreset.sidebarVia || currentPreset.sidebarFrom} 100%)`
      : currentPreset.sidebarBg,
  });
  const getSidebarActiveColor = () => getAccentColor();

  const theme = {
    isDarkMode,
    activePreset,
    setActivePreset,
    customHeaderColor,
    setCustomHeaderColor,
    headerLogoSize,
    setHeaderLogoSize,
    currentPreset,
    presets: THEME_PRESETS,
    darkTheme: THEME_PRESETS.dark,
    toggleDarkMode: () => setActivePreset(isDarkMode ? 'indigo' : 'dark'),
    getAccentColor,
    getAccentBg,
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
