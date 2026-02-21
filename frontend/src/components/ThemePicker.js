/**
 * ThemePicker.js
 * Beautiful theme picker component for school customization.
 * Shows 16 themes in 3 categories: Light, Colored Header, Dark.
 *
 * Usage:
 *   import ThemePicker from '../components/ThemePicker';
 *   <ThemePicker />
 */
import { useTheme, THEME_PRESETS } from '../context/ThemeContext';
import { CheckCircle2, Sun, Moon, Palette } from 'lucide-react';

const CATEGORIES = [
  { id: 'light',   label: 'Light Themes',   icon: Sun,     desc: 'White sidebar, colored accents' },
  { id: 'colored', label: 'Branded Themes',  icon: Palette, desc: 'Colored header matching your school' },
  { id: 'dark',    label: 'Dark Themes',     icon: Moon,    desc: 'Dark mode for low-light environments' },
];

export default function ThemePicker({ compact = false }) {
  const { activePreset, setActivePreset, getAccentColor } = useTheme();
  const accent = getAccentColor();

  const themesByCategory = (cat) =>
    Object.values(THEME_PRESETS).filter(t => t.category === cat && t.id !== 'default');

  return (
    <div className="space-y-5">
      {CATEGORIES.map(cat => {
        const themes = themesByCategory(cat.id);
        if (themes.length === 0) return null;
        return (
          <div key={cat.id}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <cat.icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                {!compact && <p className="text-[11px] text-gray-400">{cat.desc}</p>}
              </div>
            </div>

            {/* Theme grid */}
            <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5'}`}>
              {themes.map(theme => {
                const isActive = activePreset === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setActivePreset(theme.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 ${
                      isActive
                        ? 'border-current shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={isActive ? { borderColor: theme.accent, boxShadow: `0 4px 12px ${theme.accent}30` } : {}}
                    title={theme.name}
                  >
                    {/* Color preview */}
                    <div className="flex gap-1">
                      {/* Header swatch */}
                      <div
                        className="w-5 h-5 rounded-md border border-black/10"
                        style={{ backgroundColor: theme.headerBg === '#ffffff' ? theme.accent : theme.headerBg }}
                      />
                      {/* Accent swatch */}
                      <div
                        className="w-5 h-5 rounded-md border border-black/10"
                        style={{ backgroundColor: theme.accentBg }}
                      />
                      {/* Dark swatch for dark themes */}
                      {theme.isDark && (
                        <div
                          className="w-5 h-5 rounded-md border border-black/10"
                          style={{ backgroundColor: theme.sidebarBg }}
                        />
                      )}
                    </div>

                    {/* Theme name */}
                    <span className="text-[10px] font-semibold text-gray-700 leading-tight text-center">{theme.emoji} {theme.name}</span>

                    {/* Active checkmark */}
                    {isActive && (
                      <div
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.accent }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Current theme indicator */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{ borderColor: accent, backgroundColor: `${accent}10` }}
      >
        <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: accent }} />
        <div>
          <p className="text-xs font-semibold text-gray-800">
            Active: {THEME_PRESETS[activePreset]?.emoji} {THEME_PRESETS[activePreset]?.name || activePreset}
          </p>
          <p className="text-[10px] text-gray-400">Theme is applied across all pages</p>
        </div>
      </div>
    </div>
  );
}
