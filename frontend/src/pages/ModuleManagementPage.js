/**
 * ModuleManagementPage.js
 * Beautiful module management UI — schools can enable/disable modules
 * Based on subscription plan (locked modules shown with upgrade prompt)
 *
 * Sections:
 *   1. Current plan badge + module count
 *   2. Modules grid organized by category (Core / Academic / Communication / Management / Advanced / Enterprise)
 *   3. Each card: icon, name, desc, toggle (or lock if not in plan)
 *   4. Bottom: Save button + success feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Lock, Check, ChevronRight, Zap, RefreshCw,
  Users, GraduationCap, CalendarCheck, Wallet,
  Clock, FileText, BookOpen, MessageSquare, Calendar,
  UserCog, Target, Bus, Shield, Package, Brain,
  BarChart3, Tv, Video, Building,
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

// Icon map for modules
const MODULE_ICONS = {
  students:          Users,
  classes:           GraduationCap,
  attendance:        CalendarCheck,
  fee_management:    Wallet,
  timetable:         Clock,
  exams_reports:     FileText,
  digital_library:   BookOpen,
  communication_hub: MessageSquare,
  calendar:          Calendar,
  staff:             UserCog,
  admissions:        Target,
  transport:         Bus,
  front_office:      Shield,
  inventory:         Package,
  ai_tools:          Brain,
  analytics:         BarChart3,
  live_classes:      Tv,
  cctv:              Video,
  multi_branch:      Building,
};

// Category colors
const CATEGORY_STYLE = {
  'Core':          { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  'Academic':      { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500'},
  'Communication': { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  'Management':    { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  'Advanced':      { bg: 'bg-rose-50',   border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500'   },
  'Enterprise':    { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-500'   },
};

const PLAN_ORDER = ['free', 'starter', 'growth', 'pro', 'enterprise'];
const PLAN_COLORS = {
  free:       '#6b7280',
  trial:      '#8b5cf6',
  starter:    '#3b82f6',
  growth:     '#10b981',
  pro:        '#f59e0b',
  enterprise: '#ef4444',
};

export default function ModuleManagementPage() {
  const { user } = useAuth();
  const { getAccentColor } = useTheme();
  const { t } = useTranslation();
  const accent = getAccentColor();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);        // { plan, plan_label, modules }
  const [localEnabled, setLocalEnabled] = useState({});  // local toggle state
  const [dirty, setDirty] = useState(false);

  const isDirector = user?.role === 'director' || user?.role === 'co_director' || user?.role === 'principal';

  // Load module visibility from backend
  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/settings/module-visibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlanInfo(data);

        // Build local state: module_key → boolean (school_enabled)
        const enabled = {};
        Object.entries(data.modules || {}).forEach(([key, val]) => {
          enabled[key] = val.school_enabled !== false; // default true
        });
        setLocalEnabled(enabled);
      }
    } catch (err) {
      toast.error('Failed to load module settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  const toggle = (moduleKey) => {
    if (!isDirector) { toast.error('Only Directors can change module settings'); return; }
    const mod = planInfo?.modules?.[moduleKey];
    if (!mod?.plan_allowed) { toast.error(`This module requires a higher plan`); return; }
    setLocalEnabled(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/settings/module-visibility`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: localEnabled }),
      });
      if (res.ok) {
        // Sync to localStorage so Sidebar updates immediately
        const moduleVisibility = {};
        Object.entries(planInfo?.modules || {}).forEach(([key, val]) => {
          const enabled = localEnabled[key] !== false;
          const inPlan = val.plan_allowed;
          moduleVisibility[key] = { schooltino: inPlan && enabled };
        });
        localStorage.setItem('module_visibility_settings', JSON.stringify(moduleVisibility));
        window.dispatchEvent(new Event('module_visibility_changed'));
        toast.success('Module settings saved! Sidebar updated.');
        setDirty(false);
        loadModules();
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Group modules by category
  const groupedModules = {};
  if (planInfo?.modules) {
    Object.entries(planInfo.modules).forEach(([key, val]) => {
      const cat = val.category || 'Other';
      if (!groupedModules[cat]) groupedModules[cat] = [];
      groupedModules[cat].push({ key, ...val });
    });
  }

  const planColor = PLAN_COLORS[planInfo?.plan] || accent;
  const totalEnabled = Object.values(planInfo?.modules || {}).filter(m => m.plan_allowed && localEnabled[m.label !== undefined ? Object.keys(planInfo.modules).find(k => planInfo.modules[k] === m) : ''] !== false).length;

  const enabledCount = Object.entries(planInfo?.modules || {}).filter(([k, m]) => m.plan_allowed && localEnabled[k] !== false).length;
  const planModuleCount = Object.values(planInfo?.modules || {}).filter(m => m.plan_allowed).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
          <p className="text-sm text-gray-500">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Module Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enable or disable features for your school. Disabled modules are hidden from the sidebar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadModules}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Plan Summary Card */}
      <div
        className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: `linear-gradient(135deg, ${planColor}ee, ${planColor}bb)` }}
      >
        <div className="flex-1">
          <div className="text-sm font-medium opacity-80 mb-1">Current Plan</div>
          <div className="text-2xl font-bold">{planInfo?.plan_label || 'Free'}</div>
          <div className="text-sm opacity-80 mt-1">
            {enabledCount} of {planModuleCount} available modules enabled
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black">{planModuleCount}</div>
          <div className="text-sm opacity-80">Modules in plan</div>
          <a
            href="/app/subscription"
            className="mt-2 inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Zap className="w-3 h-3" /> Upgrade Plan
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Module Categories */}
      {Object.entries(groupedModules)
        .sort(([a], [b]) => {
          const order = ['Core', 'Academic', 'Communication', 'Management', 'Advanced', 'Enterprise'];
          return order.indexOf(a) - order.indexOf(b);
        })
        .map(([category, modules]) => {
          const style = CATEGORY_STYLE[category] || CATEGORY_STYLE['Core'];
          return (
            <div key={category}>
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <h2 className="text-sm font-semibold text-gray-700">{category} Modules</h2>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                  {modules.filter(m => m.plan_allowed).length} available
                </span>
              </div>

              {/* Module Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod) => {
                  const Icon = MODULE_ICONS[mod.key] || Package;
                  const inPlan = mod.plan_allowed;
                  const enabled = inPlan && localEnabled[mod.key] !== false;

                  return (
                    <div
                      key={mod.key}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-150 ${
                        inPlan
                          ? enabled
                            ? `${style.bg} ${style.border} shadow-sm`
                            : 'bg-white border-gray-200'
                          : 'bg-gray-50/50 border-dashed border-gray-200 opacity-60'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          inPlan && enabled ? '' : 'bg-gray-100'
                        }`}
                        style={inPlan && enabled ? { backgroundColor: `${accent}18`, color: accent } : { color: '#9ca3af' }}
                      >
                        {inPlan ? <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> : <Lock className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs">{mod.icon}</span>
                          <span className={`text-sm font-semibold ${inPlan ? 'text-gray-800' : 'text-gray-400'}`}>
                            {mod.label}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug ${inPlan ? 'text-gray-500' : 'text-gray-400'}`}>
                          {inPlan ? mod.desc : 'Requires a higher plan'}
                        </p>

                        {/* Upgrade hint for locked modules */}
                        {!inPlan && (
                          <a
                            href="/app/subscription"
                            className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            <Zap className="w-2.5 h-2.5" /> Upgrade to unlock
                          </a>
                        )}
                      </div>

                      {/* Toggle */}
                      {inPlan && (
                        <button
                          onClick={() => toggle(mod.key)}
                          disabled={!isDirector}
                          className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none mt-0.5 ${
                            enabled ? '' : 'bg-gray-300'
                          }`}
                          style={enabled ? { backgroundColor: accent, width: 40, height: 22 } : { width: 40, height: 22 }}
                          title={isDirector ? (enabled ? 'Click to disable' : 'Click to enable') : 'Only directors can change this'}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200"
                            style={{
                              width: 18, height: 18,
                              transform: enabled ? 'translateX(18px)' : 'translateX(0)',
                            }}
                          />
                        </button>
                      )}

                      {/* Lock badge for non-plan modules */}
                      {!inPlan && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-gray-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Save Banner */}
      {dirty && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white"
          style={{ backgroundColor: accent }}
        >
          <span className="text-sm font-medium">You have unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      )}

      {/* Non-director notice */}
      {!isDirector && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Only Directors and Principals can enable or disable modules. Contact your school director to make changes.
        </div>
      )}
    </div>
  );
}
