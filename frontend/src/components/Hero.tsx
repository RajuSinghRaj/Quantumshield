import React from 'react';
import {
  Shield, ArrowRight, Zap, FileCode, Lock, Globe, Upload, Folder,
  CheckCircle2, Sparkles, Layers, Code, ChevronRight, ShieldCheck,
  Activity, AlertTriangle, TrendingUp, RefreshCw, Terminal, Atom,
  Gauge, Link2, BarChart2
} from 'lucide-react';
import { GeometricSphere3D } from './HeroAssets';
import { ScanResult } from '../types/scan';

interface HeroProps {
  onStartScan: () => void;
  onExploreRisks: () => void;
  onSelectDemo: (demoId: string) => void;
  onNavigateTab?: (tab: string) => void;
  scanResult?: ScanResult | null;
}

export const Hero: React.FC<HeroProps> = ({
  onStartScan, onExploreRisks, onSelectDemo, onNavigateTab, scanResult,
}) => {

  const quantumScore   = scanResult ? Math.round(scanResult.scores.quantum_score)   : 72;
  const classicalScore = scanResult ? Math.round(scanResult.scores.classical_score) : 85;
  const pqcScore       = scanResult ? Math.round(scanResult.scores.pqc_score)       : 60;
  const isRealData     = Boolean(scanResult);

  const handleModuleClick = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      onStartScan();
    }
  };

  const quickActionCards = [
    { id: 'dashboard',   title: 'Risk Analysis',        icon: BarChart2,    tab: 'dashboard' },
    { id: 'migration',   title: 'Migration Sandbox',    icon: Layers,       tab: 'migration' },
    { id: 'hybrid',      title: 'Hybrid Crypto',        icon: Link2,        tab: 'migration' },
    { id: 'quantum-lab', title: 'Quantum Simulations',  icon: Atom,         tab: 'quantum-lab' },
  ];

  const metricsShelf = [
    {
      icon: Code,
      value: '11',
      label: 'Integrated Modules',
      tab: 'devsecops'
    },
    {
      icon: ShieldCheck,
      value: '128+',
      label: 'Automated Tests',
      tab: 'devsecops'
    },
    {
      icon: Gauge,
      value: '100%',
      label: 'Test Coverage',
      tab: 'devsecops'
    },
    {
      icon: Shield,
      value: 'PQC Ready',
      label: 'NIST FIPS 203/204/205',
      tab: 'migration'
    },
  ];

  const scanActivity = [
    { name: 'DeFi-Protocol.zip',  type: 'ZIP Archive',       icon: Folder,   status: 'scanning',  statusLabel: 'Scanning…',  statusCls: 'text-orange-600' },
    { name: 'auth_service.py',    type: 'Python File',       icon: Code,     status: 'done',      statusLabel: 'Complete',   statusCls: 'text-emerald-600' },
    { name: 'certificate.pem',    type: 'X.509 Certificate', icon: Lock,     status: 'done',      statusLabel: 'Complete',   statusCls: 'text-emerald-600' },
    { name: 'config.yaml',        type: 'YAML Config',       icon: FileCode, status: 'analyzing', statusLabel: 'Analyzing…', statusCls: 'text-amber-600' },
  ];

  return (
    <div className="relative py-6 sm:py-10 lg:py-12 space-y-10 overflow-hidden w-full bg-[#faf7f2] dark:bg-stone-950 transition-colors">

      {/* Ambient background warm glows matching screenshot #4 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/3 w-[520px] h-[520px] rounded-full bg-orange-300/15 dark:bg-orange-950/20 blur-[130px]" />
        <div className="absolute top-1/4 right-10 w-[420px] h-[420px] rounded-full bg-amber-400/15 dark:bg-amber-900/15 blur-[110px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-orange-200/20 dark:bg-orange-950/15 blur-[100px]" />
      </div>

      {/* ================================================================
          HERO MAIN SECTION — EXACT MATCH TO SCREENSHOT #4
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center min-h-[460px]">

          {/* ── Left Column: Headline, Subtitle & Action Buttons (col-span-5) ── */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6 animate-fade-up">

            {/* Pill Badge: Cryptographic Risk & Migration Platform */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide
                            text-orange-700 dark:text-orange-300 bg-orange-100/90 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/40 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 fill-current" />
              <span>Cryptographic Risk & Migration Platform</span>
            </div>

            {/* Large Two-Tone Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.08] text-stone-900 dark:text-stone-50">
              From Classical to<br />
              <span className="text-orange-600 dark:text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.3)]">
                Post-Quantum Security
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-md font-normal">
              End-to-end analysis, risk evaluation and migration for a quantum-resilient future.
            </p>

            {/* Action Buttons: Start Scan -> & View Reports */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onStartScan}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-7 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-white">Start Scan</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => handleModuleClick('dashboard')}
                className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold text-sm px-6 py-3.5 rounded-full shadow-xs transition-all hover:scale-[1.02]"
              >
                <span>View Reports</span>
              </button>
            </div>

            {/* Secondary Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> NIST FIPS 203/204/205</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Zero Key Retention</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> DevSecOps Gated</span>
            </div>
          </div>

          {/* ── Middle Column: 3D Volumetric Wireframe Sphere with Smooth Particles (col-span-4) ── */}
          <div className="lg:col-span-4 relative flex items-center justify-center min-h-[380px] sm:min-h-[420px]">
            <GeometricSphere3D />
          </div>

          {/* ── Right Column: 4 Vertically Stacked Cards (col-span-3) ── */}
          <div className="lg:col-span-3 flex flex-col gap-3.5 justify-center">
            {[
              { id: 'dashboard',   title: 'Risk Analysis',        desc: 'Shor & Grover threat audit',    icon: BarChart2, tab: 'dashboard' },
              { id: 'migration',   title: 'Migration Sandbox',    desc: 'NIST FIPS 203/204 diffs',       icon: Layers,    tab: 'migration' },
              { id: 'hybrid',      title: 'Hybrid Crypto',        desc: 'X25519 + ML-KEM-768',          icon: Link2,     tab: 'migration' },
              { id: 'quantum-lab', title: 'Quantum Simulations',  desc: 'Interactive Shor & BBM92',     icon: Atom,      tab: 'quantum-lab' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => handleModuleClick(card.tab)}
                  className="w-full bg-white dark:bg-stone-900 rounded-2xl p-4 flex items-center gap-3.5 border border-orange-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {card.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ================================================================
          BOTTOM METRICS SHELF — 4 HORIZONTAL WHITE CARDS (SCREENSHOT #4)
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10 -mt-2">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metricsShelf.map((m, idx) => {
            const Icon = m.icon;
            return (
              <button
                key={idx}
                onClick={() => handleModuleClick(m.tab)}
                className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-orange-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 transition-all flex items-center gap-4 text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight leading-none group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {m.value}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                    {m.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          BOTTOM ROW: 1-Click Interactive Demo Scans + Quick Upload
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Quick Upload Zone & Demo Targets */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900/90 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-stone-800 shadow-sm space-y-6">

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center shadow-xs">
                <Upload className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Instant Cryptographic Assessment</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Scan source code, ZIP repositories, manifests, and X.509 certs with zero key retention.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onStartScan}
                className="py-3 px-4 rounded-xl text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
              <button
                onClick={onStartScan}
                className="py-3 px-4 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                <Folder className="w-4 h-4" />
                <span>Upload Project ZIP</span>
              </button>
              <button
                onClick={onStartScan}
                className="py-3 px-4 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>Scan Live TLS</span>
              </button>
            </div>

            {/* Preloaded Demo Projects for 1-Click Evaluation */}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider font-bold text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>One-Click Demonstration Repositories</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'legacy_bank', label: 'Legacy Banking Monolith', risk: 'CRITICAL', icon: AlertTriangle, desc: 'RSA-2048, 3DES, MD5' },
                  { id: 'cloud_microservice', label: 'Cloud Microservice', risk: 'HIGH', icon: TrendingUp, desc: 'ECDSA P-256, AES-CBC' },
                  { id: 'pqc_hybrid', label: 'PQC Hybrid Vault', risk: 'LOW', icon: ShieldCheck, desc: 'ML-KEM + X25519' },
                ].map(({ id, label, risk, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => onSelectDemo(id)}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-orange-400/50 bg-stone-50/60 dark:bg-stone-950/40 hover:bg-orange-50/40 transition-all flex flex-col justify-between text-left group"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`w-4 h-4 ${risk === 'CRITICAL' ? 'text-rose-500' : risk === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        risk === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                        risk === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}>
                        {risk}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors leading-tight">{label}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Live Scan Activity & Score Overview */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900/90 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-stone-800 shadow-sm space-y-5 flex flex-col justify-between">

            <div>
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  {isRealData ? 'Active Audit Findings' : 'Recent Cryptographic Audits'}
                </span>
                <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                  {isRealData ? scanResult?.project_name : 'System Preview'}
                </span>
              </div>

              <div className="space-y-2.5">
                {scanActivity.map(({ name, type, icon: Icon, status, statusLabel, statusCls }) => (
                  <div
                    key={name}
                    className="p-3 rounded-xl bg-stone-50/80 dark:bg-stone-950/50 border border-stone-200/70 dark:border-stone-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-stone-900 dark:text-white">{name}</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">{type}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${statusCls}`}>
                      {status === 'done' ? (
                        <><span>{statusLabel}</span><CheckCircle2 className="w-3.5 h-3.5" /></>
                      ) : (
                        <><span className="animate-pulse">{statusLabel}</span>
                          <div className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-center">
              <div>
                <p className="text-lg font-black text-stone-900 dark:text-white font-mono">{classicalScore}</p>
                <p className="text-[10px] font-bold text-stone-500">Classical Score</p>
              </div>
              <div>
                <p className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono">{quantumScore}</p>
                <p className="text-[10px] font-bold text-stone-500">Quantum Score</p>
              </div>
              <div>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{pqcScore}%</p>
                <p className="text-[10px] font-bold text-stone-500">PQC Ready</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
