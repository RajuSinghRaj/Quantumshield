import React from 'react';
import {
  Shield, Home, Search, LayoutDashboard, Atom, BookOpen,
  History, GitBranch, Sun, Moon, Activity, ArrowRight, Terminal
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

const navItems = [
  { id: 'home',         label: 'Home',        icon: Home },
  { id: 'scanner',      label: 'Scanner',     icon: Search },
  { id: 'migration',    label: 'Migration',   icon: GitBranch },
  { id: 'devsecops',    label: 'DevSecOps',   icon: Terminal, highlight: true },
  { id: 'quantum-lab',  label: 'Quantum Lab', icon: Atom },
  { id: 'dashboard',    label: 'Reports',     icon: LayoutDashboard },
  { id: 'education',    label: 'Learn',       icon: BookOpen },
  { id: 'history',      label: 'History',     icon: History },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, isBackendHealthy, isDarkMode, setIsDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#faf7f2]/90 dark:bg-stone-950/90 border-b border-orange-200/40 dark:border-stone-800 backdrop-blur-xl transition-colors">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* ── LOGO (WARM ACCENT + QUANTUMSHIELD 2.0) ── */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="QuantumShield 2.0 home"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                QuantumShield <span className="text-orange-600 dark:text-orange-400">2.0</span>
              </span>
            </div>
          </button>

          {/* ── DESKTOP CENTER NAV CAPSULE ── */}
          <nav className="hidden lg:flex items-center bg-white/95 dark:bg-stone-900/90 border border-orange-200/60 dark:border-stone-800 p-1 rounded-full shadow-sm" aria-label="Main navigation">
            {navItems.map(({ id, label, icon: Icon, highlight }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-600/30 dark:text-orange-300 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-orange-50/60 dark:hover:bg-stone-800/60 font-medium'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                  {highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── RIGHT CONTROLS (HEALTH, THEME, START SCAN -> CTA) ── */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Backend health pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono font-semibold transition-colors ${
              isBackendHealthy
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              <Activity className="w-3 h-3" />
              <span>{isBackendHealthy ? 'ONLINE' : 'OFFLINE'}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Start scan CTA (Vibrant orange pill with right arrow matching screenshot #4) */}
            <button
              onClick={() => setActiveTab('scanner')}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Scan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── MOBILE NAV ── */}
        <nav className="md:hidden flex items-center gap-0.5 pb-2 overflow-x-auto" aria-label="Mobile navigation">
          {navItems.map(({ id, label, icon: Icon, highlight }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`qs-nav-item flex items-center gap-1 whitespace-nowrap text-[11px] py-1.5 px-2.5 ${activeTab === id ? 'active' : ''} ${highlight ? 'relative' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{label}</span>
              {highlight && activeTab !== id && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
