import React from 'react';
import {
  Siren,
  ShieldAlert,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  RotateCcw,
  Search,
  Building2,
  BarChart3,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { resetDemoData } from '../../services/mockBackend';

export type NavigationTab = 'report' | 'tracking' | 'departments' | 'responder' | 'charts';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onResetData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onResetData }) => {
  const { lang, setLang, t } = useI18n();
  const { isOnline, pendingCount, isSyncing, triggerManualSync } = useNetworkStatus();

  const handleReset = () => {
    if (window.confirm('Reset all demo emergency reports to initial sample state?')) {
      resetDemoData();
      if (onResetData) onResetData();
    }
  };

  const navItems: Array<{
    id: NavigationTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    activeBorderClass: string;
    iconColor: string;
  }> = [
    {
      id: 'report',
      label: t('citizenReport'),
      shortLabel: 'Report',
      icon: Siren,
      activeBorderClass: 'bg-red-500/10 text-red-200 border-red-500/40 shadow-sm',
      iconColor: 'text-red-400',
    },
    {
      id: 'tracking',
      label: 'Track ID',
      shortLabel: 'Track',
      icon: Search,
      activeBorderClass: 'bg-amber-500/10 text-amber-200 border-amber-500/40 shadow-sm',
      iconColor: 'text-amber-400',
    },
    {
      id: 'departments',
      label: 'Departments',
      shortLabel: 'Depts',
      icon: Building2,
      activeBorderClass: 'bg-purple-500/10 text-purple-200 border-purple-500/40 shadow-sm',
      iconColor: 'text-purple-400',
    },
    {
      id: 'responder',
      label: t('responderPortal'),
      shortLabel: 'Admin',
      icon: ShieldAlert,
      activeBorderClass: 'bg-blue-500/10 text-blue-200 border-blue-500/40 shadow-sm',
      iconColor: 'text-blue-400',
    },
    {
      id: 'charts',
      label: t('chartsTab'),
      shortLabel: 'Charts',
      icon: BarChart3,
      activeBorderClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 shadow-sm',
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-graphite-deep/90 backdrop-blur-md border-b border-graphite-border text-graphite-text">
      {/* Upper Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between">
        {/* Brand / Logo with Tamil Nadu Government Seal */}
        <button
          type="button"
          className="flex items-center space-x-2 sm:space-x-3 text-left focus:outline-none group shrink-0"
          onClick={() => setActiveTab('report')}
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-control bg-graphite-raised/80 border border-graphite-border-strong flex items-center justify-center p-0.5 overflow-hidden group-hover:border-emerald-500/40 transition-colors shadow-sm shrink-0">
            <img
              src="/tamilnadu-logo.svg"
              alt="Government of Tamil Nadu"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-semibold text-xs sm:text-base tracking-tight text-graphite-text whitespace-nowrap">
                Citizen Emergency
              </span>
              <span className="inline-flex items-center space-x-1 font-mono text-[9px] sm:text-[11px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>TN 112</span>
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-graphite-secondary block leading-none mt-0.5">
              Tamil Nadu • {t('tagline')}
            </span>
          </div>
        </button>

        {/* Desktop View Tabs (Visible md and above) */}
        <nav
          className="hidden md:flex bg-graphite-card p-0.5 rounded-control border border-graphite-border"
          aria-label="Desktop Portal Navigation"
        >
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors duration-150 flex items-center space-x-1.5 border ${
                  isActive
                    ? `${tab.activeBorderClass} border font-semibold`
                    : 'border-transparent text-graphite-secondary hover:text-graphite-text hover:bg-graphite-raised/40'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 stroke-[1.5] ${
                    isActive ? tab.iconColor : 'text-graphite-muted'
                  }`}
                />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Action Controls (Online, Language, Reset) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Network / Offline Queue Status */}
          <div className="flex items-center">
            {isOnline ? (
              pendingCount > 0 ? (
                <button
                  onClick={triggerManualSync}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2 py-1 rounded-control text-xs font-medium hover:bg-amber-500/20 transition-colors duration-150"
                  title="Click to sync offline reports now"
                >
                  <RefreshCw className={`w-3 h-3 stroke-[1.5] ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-mono text-[10px] sm:text-[11px]">Sync ({pendingCount})</span>
                </button>
              ) : (
                <span className="hidden sm:flex items-center space-x-1.5 text-graphite-secondary bg-graphite-card border border-graphite-border px-2 py-1 rounded-control text-xs">
                  <Wifi className="w-3.5 h-3.5 stroke-[1.5] text-emerald-400" />
                  <span className="text-[10px] sm:text-[11px] font-mono">{t('online')}</span>
                </span>
              )
            ) : (
              <span className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 px-2 py-1 rounded-control text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5 stroke-[1.5]" />
                <span className="font-mono text-[10px] sm:text-[11px]">Offline ({pendingCount})</span>
              </span>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="group flex items-center space-x-1 sm:space-x-1.5 bg-graphite-card hover:bg-sky-500/5 border border-graphite-border hover:border-sky-500/30 text-graphite-secondary hover:text-sky-300 px-2 py-1 rounded-control text-xs font-medium transition-colors duration-150"
            aria-label="Toggle language"
            title="Switch Language between English and Tamil"
          >
            <Globe className="w-3.5 h-3.5 stroke-[1.5] group-hover:text-sky-400 transition-colors" />
            <span className="font-sans text-[11px] font-medium">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Demo Reset Button */}
          <button
            onClick={handleReset}
            className="group p-1.5 text-graphite-muted hover:text-amber-300 hover:bg-amber-500/5 border border-transparent hover:border-amber-500/30 rounded-control transition-colors duration-150"
            title="Reset demo data to initial sample reports"
            aria-label="Reset demo sample data"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.5] group-hover:text-amber-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip (Only on screens below md: 768px) */}
      <nav
        className="md:hidden border-t border-graphite-border/70 bg-graphite-deep/95 backdrop-blur px-2.5 py-1.5 flex items-center overflow-x-auto no-scrollbar gap-1.5 scroll-smooth"
        aria-label="Mobile View Navigation"
      >
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-control transition-colors duration-150 flex items-center space-x-1.5 shrink-0 border ${
                isActive
                  ? `${tab.activeBorderClass} border font-semibold`
                  : 'border-transparent text-graphite-secondary hover:text-graphite-text hover:bg-graphite-raised/50'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 stroke-[1.5] ${
                  isActive ? tab.iconColor : 'text-graphite-muted'
                }`}
              />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
