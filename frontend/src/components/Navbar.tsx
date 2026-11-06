import React, { useState } from 'react';
import {
  Clock, Menu, X, ArrowUpRight, Activity, Shield, Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

const navItems = [
  { id: 'home',         label: 'Home' },
  { id: 'scanner',      label: 'Scanner' },
  { id: 'migration',    label: 'Migration' },
  { id: 'devsecops',    label: 'DevSecOps' },
  { id: 'quantum-lab',  label: 'Quantum Lab' },
  { id: 'dashboard',    label: 'Reports' },
  { id: 'education',    label: 'Learn' },
  { id: 'history',      label: 'History' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendHealthy,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 py-3 sm:py-4 px-4 sm:px-8 lg:px-12">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between">

        {/* ── 1. LOGO: ~ Tidewell / QuantumShield ── */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 group shrink-0 focus:outline-hidden"
          aria-label="QuantumShield home"
        >
          <span className="text-2xl font-light text-white/70 group-hover:text-white transition-colors">~</span>
          <span className="text-lg font-medium tracking-tight text-white group-hover:text-white/90 transition-colors">
            QuantumShield
          </span>
        </button>

        {/* ── 2. CENTER: FLOATING ULTRA-FROSTED PILL CAPSULE ── */}
        <nav
          className="hidden lg:flex items-center tidewell-pill-nav p-1 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Main navigation"
        >
          {navItems.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-white/[0.14] text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05] font-normal'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04438] shadow-[0_0_8px_#f04438] shrink-0" />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── 3. RIGHT CONTROLS: CIRCULAR CLOCK BUTTON + CORAL CTA + MENU PILL ── */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Frosted Circular Clock Button (Exact match to top right in Tidewell screenshot) */}
          <button
            onClick={() => setActiveTab('history')}
            title="Scan History & Audit Log"
            className="w-10 h-10 rounded-full backdrop-blur-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm"
            aria-label="Audit History"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Backend Status Pill */}
          <div
            title={isBackendHealthy ? 'Crypto Engine Online' : 'Crypto Engine Offline'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-2xl bg-white/[0.06] border border-white/[0.10] text-[11px] font-mono text-white/70"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
            <span className="hidden md:inline">{isBackendHealthy ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Coral CTA Pill Button */}
          <button
            onClick={() => setActiveTab('scanner')}
            className="tidewell-coral-pill text-white text-xs font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-1.5 active:scale-95"
          >
            <span>Start Scan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Frosted Glass Menu Button (Exact 2-bar menu button from screenshot) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-full backdrop-blur-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] flex flex-col items-center justify-center gap-1 text-white/80 hover:text-white transition-all shadow-sm"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <>
                <span className="w-4 h-[1.5px] bg-white/80 rounded-full" />
                <span className="w-4 h-[1.5px] bg-white/80 rounded-full" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE ACCORDION MENU ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 p-3 rounded-2xl tidewell-glass-card border border-white/[0.15] animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-white/[0.15] text-white font-medium'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f04438] shadow-[0_0_8px_#f04438] shrink-0" />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
