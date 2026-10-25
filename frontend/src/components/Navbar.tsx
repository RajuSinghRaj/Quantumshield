import React from 'react';
import {
  Shield, Home, Search, LayoutDashboard, Atom, BookOpen,
  History, GitBranch, Sun, Moon, Activity, ChevronRight,
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
  { id: 'dashboard',    label: 'Reports',     icon: LayoutDashboard },
  { id: 'migration',    label: 'Migration',   icon: GitBranch },
  { id: 'quantum-lab',  label: 'Quantum Lab', icon: Atom,   highlight: true },
  { id: 'education',    label: 'Learn',       icon: BookOpen },
  { id: 'history',      label: 'History',     icon: History },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, isBackendHealthy, isDarkMode, setIsDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-50 qs-navbar">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* ── LOGO ── */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="QuantumShield home"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <Shield className="relative w-4.5 h-4.5 text-white z-10 w-[18px] h-[18px]" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[13px] font-black text-white tracking-wider">QUANTUM<span className="text-indigo-400">SHIELD</span></span>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest">QUANTUM CRYPTO SCANNER</span>
            </div>
          </button>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {navItems.map(({ id, label, icon: Icon, highlight }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`qs-nav-item flex items-center gap-1.5 ${activeTab === id ? 'active' : ''} ${highlight ? 'relative' : ''}`}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
                {highlight && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* ── RIGHT CONTROLS ── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Backend health pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-semibold transition-colors ${
              isBackendHealthy
                ? 'border-emerald-500/30 bg-emerald-500/08 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/08 text-rose-400'
            }`}>
              <Activity className="w-2.5 h-2.5" />
              <span>{isBackendHealthy ? 'API ONLINE' : 'API OFFLINE'}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Start scan CTA */}
            <button
              onClick={() => setActiveTab('scanner')}
              className="hidden sm:flex btn-primary text-xs px-4 py-2 rounded-lg"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Start Scan</span>
              <ChevronRight className="w-3.5 h-3.5" />
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
