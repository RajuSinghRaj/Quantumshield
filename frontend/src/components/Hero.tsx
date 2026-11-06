import React, { useState } from 'react';
import {
  MapPin, ArrowUpRight, Home, Clock, Lock, Check, Shield,
  Upload, Folder, Globe, Sparkles, AlertTriangle, TrendingUp,
  ShieldCheck, FileCode, Code, Layers, Atom, BarChart2
} from 'lucide-react';
import { ScanResult } from '../types/scan';

interface HeroProps {
  onStartScan: () => void;
  onExploreRisks: () => void;
  onSelectDemo: (demoId: string) => void;
  onNavigateTab?: (tab: string) => void;
  scanResult?: ScanResult | null;
}

export const Hero: React.FC<HeroProps> = ({
  onStartScan,
  onExploreRisks,
  onSelectDemo,
  onNavigateTab,
  scanResult,
}) => {
  const [activeBottomCol, setActiveBottomCol] = useState(0);

  const handleModuleClick = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      onStartScan();
    }
  };

  const bottomFeatures = [
    {
      id: 0,
      icon: Home,
      title: 'Cryptographic Discovery',
      subtitle: 'AST, bytecode & certificate inventory scanning',
      tab: 'scanner',
    },
    {
      id: 1,
      icon: Clock,
      title: 'HNDL Threat Horizon',
      subtitle: 'Mosca theorem & Harvest Now, Decrypt Later',
      tab: 'dashboard',
    },
    {
      id: 2,
      icon: Lock,
      title: 'PQC Migration Sandbox',
      subtitle: 'Zero-touch automated code patching & diffs',
      tab: 'migration',
    },
    {
      id: 3,
      icon: Shield,
      title: 'Quantum Simulations',
      subtitle: 'Interactive Shor, Grover & BBM92 algorithms',
      tab: 'quantum-lab',
    },
    {
      id: 4,
      icon: Check,
      title: 'DevSecOps CI/CD Gate',
      subtitle: 'Deterministic PR blocking & CBOM verification',
      tab: 'devsecops',
    },
  ];

  return (
    <div className="relative w-full overflow-hidden text-white select-none">

      {/* ================================================================
          HERO MAIN STAGE — LUXURY FROSTED GLASS CRYPTOGRAPHIC PLATFORM
          ================================================================ */}
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-14 lg:pt-20 pb-12 sm:pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[480px]">

          {/* ── LEFT COLUMN: TYPOGRAPHY, SUBTEXT & CORAL PILL (COL 1-7) ── */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 animate-fade-in">

            {/* Giant Editorial Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-normal tracking-[-0.035em] leading-[1.03] text-white">
              From Classical to<br />
              Post-Quantum Security.
            </h1>

            {/* Editorial Subtitle */}
            <p className="text-white/65 text-sm sm:text-base font-light leading-relaxed max-w-lg">
              Deterministic cryptographic discovery, real-time quantum risk scoring, and zero-touch migration
              to NIST FIPS 203/204/205 standards. Zero private key exposure, pure quantum resilience.
            </p>

            {/* Action Row: Coral Pill CTA + 'Explore Reports ↗' Link */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <button
                onClick={onStartScan}
                className="tidewell-coral-pill text-white text-sm sm:text-base font-medium px-8 sm:px-9 py-3.5 sm:py-4 rounded-full flex items-center gap-2 cursor-pointer"
              >
                <span>Start Security Audit</span>
                <span className="text-sm font-light">↗</span>
              </button>

              <button
                onClick={() => handleModuleClick('dashboard')}
                className="text-white/80 hover:text-white text-sm sm:text-base font-light flex items-center gap-1.5 transition-colors group cursor-pointer"
              >
                <span>Explore Reports</span>
                <span className="text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              </button>
            </div>

            {/* Discreet PQC Capability Subtext */}
            <div className="pt-2 flex items-center gap-3 text-xs text-white/40 font-mono">
              <span>NIST FIPS 203/204/205</span>
              <span>•</span>
              <span>Zero Key Exposure</span>
              <span>•</span>
              <span>Quantum Risk Shield</span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: FLOATING FROSTED GLASS BOOKING CARD (COL 8-12) ── */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] tidewell-glass-card p-6 relative select-none">

              {/* Grab Bar Handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              {/* Location Pin Header */}
              <div className="flex items-center gap-2 text-xs text-white/60 font-light mb-4">
                <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
                <span>Production Infrastructure, 2h to Q-Day</span>
              </div>

              {/* ── Nested Sub-Card 1: Core Banking Monolith ── */}
              <div
                onClick={() => onSelectDemo('legacy_bank')}
                className="tidewell-glass-subcard p-4 mb-3.5 hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-red-300 transition-colors">
                      Core Banking Monolith
                    </h3>
                    <span className="text-[10px] text-white/40 font-mono">Payment & Transaction Ledger</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">98.4 Readiness</span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/80 border-t border-white/[0.06] pt-2.5">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">Current</div>
                    <div className="text-sm font-semibold text-rose-400 font-mono">RSA-2048</div>
                    <div className="text-[10px] text-rose-400/70 font-mono">Shor-Vulnerable</div>
                  </div>

                  <div className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-white/50 border border-white/[0.06] font-mono">
                    → PQC
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">Target (FIPS 203)</div>
                    <div className="text-sm font-semibold text-emerald-400 font-mono">ML-KEM-768</div>
                    <div className="text-[10px] text-emerald-400/70 font-mono">Quantum-Safe</div>
                  </div>
                </div>
              </div>

              {/* ── Nested Sub-Card 2: Auth & Identity Gateway ── */}
              <div
                onClick={() => onSelectDemo('cloud_microservice')}
                className="tidewell-glass-subcard p-4 mb-5 hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-red-300 transition-colors">
                      Identity & Auth Gateway
                    </h3>
                    <span className="text-[10px] text-white/40 font-mono">JWT & Microservice Signer</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">96.1 Readiness</span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/80 border-t border-white/[0.06] pt-2.5">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase">Current</div>
                    <div className="text-sm font-semibold text-amber-400 font-mono">ECDSA P-256</div>
                    <div className="text-[10px] text-amber-400/70 font-mono">HNDL Risk</div>
                  </div>

                  <div className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-white/50 border border-white/[0.06] font-mono">
                    → PQC
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">Target (FIPS 204)</div>
                    <div className="text-sm font-semibold text-emerald-400 font-mono">ML-DSA-65</div>
                    <div className="text-[10px] text-emerald-400/70 font-mono">Quantum-Safe</div>
                  </div>
                </div>
              </div>

              {/* ── Coral Pill Badge: NIST Approved ── */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#f04438] text-white shadow-md shadow-red-500/20">
                  NIST FIPS 203/204 Ready
                </span>
                <span className="text-[11px] text-white/40 font-mono">Zero Key Retention</span>
              </div>

            </div>
          </div>

        </div>

        {/* ================================================================
            BOTTOM 5-COLUMN FEATURE TICKER — EXACT TO TIDEWELL SCREENSHOT
            ================================================================ */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-white/[0.08]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
            {bottomFeatures.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeBottomCol === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveBottomCol(idx);
                    handleModuleClick(item.tab);
                  }}
                  className="text-left group cursor-pointer focus:outline-hidden"
                >
                  {/* Top Red Active Line (Exact match on first item) */}
                  <div
                    className={`h-[2px] mb-3 transition-all ${
                      isActive ? 'w-14 bg-[#f04438]' : 'w-0 bg-transparent group-hover:w-8 group-hover:bg-white/30'
                    }`}
                  />

                  <div className="flex items-start gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                        isActive ? 'text-[#f04438]' : 'text-white/60 group-hover:text-white'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-xs sm:text-[13px] font-normal leading-snug transition-colors ${
                          isActive ? 'text-[#f04438]' : 'text-white/80 group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/40 mt-1 font-mono hidden sm:block">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ================================================================
          INTEGRATED CRYPTOGRAPHIC AUDIT EXPANSION ZONE (MIDNIGHT FROSTED GLASS)
          ================================================================ */}
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-10 relative z-10 space-y-8">

        {/* 1-Click Interactive Assessment & Demo Repos */}
        <div className="tidewell-glass-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f04438]" />
                <h2 className="text-lg font-medium text-white">Automated Cryptographic Evaluation</h2>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Scan source code repositories, ZIP archives, X.509 cert chains, or evaluate live TLS endpoints.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onStartScan}
                className="tidewell-coral-pill text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Code</span>
              </button>
              <button
                onClick={() => handleModuleClick('scanner')}
                className="tidewell-pill-nav text-xs text-white/80 hover:text-white px-4 py-2 rounded-full flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>TLS Audit</span>
              </button>
            </div>
          </div>

          {/* Demonstration Targets for Instant Evaluation */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-mono text-white/50 mb-3">
              Pre-Configured Enterprise Target Environments
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'legacy_bank',
                  title: 'Legacy Banking Monolith',
                  risk: 'CRITICAL',
                  riskColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  desc: 'RSA-2048, 3DES, MD5 legacy certificates and SHA-1 signatures.',
                  tab: 'scanner',
                },
                {
                  id: 'cloud_microservice',
                  title: 'Cloud Microservice Auth',
                  risk: 'HIGH',
                  riskColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  desc: 'ECDSA P-256 JWT signatures and AES-CBC session tokens.',
                  tab: 'scanner',
                },
                {
                  id: 'pqc_hybrid',
                  title: 'PQC Resilient Vault',
                  risk: 'READY',
                  riskColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  desc: 'ML-KEM-768 + X25519 hybrid KEM and ML-DSA-65 signatures.',
                  tab: 'scanner',
                },
              ].map((target) => (
                <button
                  key={target.id}
                  onClick={() => onSelectDemo(target.id)}
                  className="tidewell-glass-subcard p-4 hover:bg-white/[0.08] transition-all text-left group cursor-pointer border border-white/[0.08]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white group-hover:text-red-300 transition-colors">
                      {target.title}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${target.riskColor}`}>
                      {target.risk}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {target.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-[#f04438] font-medium">
                    <span>Audit Environment</span>
                    <span className="text-xs">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
