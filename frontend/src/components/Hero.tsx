import React from 'react';
import {
  Shield, ArrowRight, Zap, FileCode, Lock, Globe, Upload, Folder,
  CheckCircle2, Sparkles, Layers, Cpu, Code, ChevronRight, ShieldCheck,
  Activity, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { QuantumShield3D, BtcCoin3D, EthCrystal3D, SolBadge3D } from './HeroAssets';
import { ScanResult } from '../types/scan';

interface HeroProps {
  onStartScan: () => void;
  onExploreRisks: () => void;
  onSelectDemo: (demoId: string) => void;
  scanResult?: ScanResult | null;
}

export const Hero: React.FC<HeroProps> = ({
  onStartScan, onExploreRisks, onSelectDemo, scanResult,
}) => {

  const quantumScore   = scanResult ? Math.round(scanResult.scores.quantum_score)   : 72;
  const classicalScore = scanResult ? Math.round(scanResult.scores.classical_score) : 85;
  const pqcScore       = scanResult ? Math.round(scanResult.scores.pqc_score)       : 60;
  const overallRisk    = scanResult ? scanResult.scores.overall_risk                : 'MEDIUM';
  const isRealData     = Boolean(scanResult);

  const getRiskColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-400';
      case 'HIGH':     return 'text-amber-400';
      case 'MEDIUM':   return 'text-amber-300';
      default:         return 'text-emerald-400';
    }
  };
  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'EXCELLENT', cls: 'text-emerald-400' };
    if (score >= 65) return { label: 'GOOD',      cls: 'text-emerald-400' };
    if (score >= 45) return { label: 'MODERATE',  cls: 'text-amber-400' };
    return               { label: 'AT RISK',     cls: 'text-rose-400' };
  };
  const status = getScoreBadge(quantumScore);

  const stars = [
    { top: '8%',  left: '15%', delay: '0s'  },
    { top: '12%', left: '80%', delay: '0.8s' },
    { top: '40%', left: '8%',  delay: '1.4s' },
    { top: '48%', left: '92%', delay: '0.4s' },
    { top: '75%', left: '25%', delay: '1.8s' },
    { top: '82%', left: '75%', delay: '1.1s' },
  ];

  const features = [
    { icon: Shield,   color: 'text-indigo-400',  bg: 'bg-indigo-500/12', title: 'Deep Crypto Analysis',    sub: 'Detects 100+ algorithms & protocols' },
    { icon: Cpu,      color: 'text-violet-400',   bg: 'bg-violet-500/12', title: 'Quantum Risk Detection',  sub: "Evaluates Shor's & Grover's threats" },
    { icon: Sparkles, color: 'text-cyan-400',     bg: 'bg-cyan-500/12',   title: 'PQC Recommendations',    sub: 'Smart migration to FIPS 203/204' },
    { icon: Layers,   color: 'text-indigo-300',   bg: 'bg-indigo-500/10', title: 'Actionable Reports',      sub: 'Detailed fix priority & PDF exports' },
    { icon: Folder,   color: 'text-violet-300',   bg: 'bg-violet-500/10', title: 'Multi-Source Scanning',   sub: 'Supports code, certs, keys & ZIPs' },
  ];

  const scanActivity = [
    { name: 'DeFi-Protocol.zip',  type: 'ZIP Archive',     icon: Folder,   status: 'scanning',   statusLabel: 'Scanning…',  statusCls: 'text-indigo-400' },
    { name: 'auth_service.py',    type: 'Python File',      icon: Code,     status: 'done',       statusLabel: 'Complete',   statusCls: 'text-emerald-400' },
    { name: 'certificate.pem',    type: 'X.509 Certificate', icon: Lock,   status: 'done',       statusLabel: 'Complete',   statusCls: 'text-emerald-400' },
    { name: 'config.yaml',        type: 'YAML Config',      icon: FileCode, status: 'analyzing',  statusLabel: 'Analyzing…', statusCls: 'text-violet-400' },
  ];

  return (
    <div className="relative py-10 lg:py-16 space-y-14 overflow-hidden w-full">

      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Background star particles */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute text-indigo-400 opacity-40 animate-star-twinkle pointer-events-none text-sm select-none"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >✦</div>
      ))}

      {/* ================================================================
          TOP HERO — 12-col grid
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ── Left: headline + CTAs ── */}
          <div className="lg:col-span-4 space-y-7 animate-fade-up">

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider
                            text-indigo-300 bg-indigo-500/10 border border-indigo-500/25">
              <Zap className="w-3.5 h-3.5 text-indigo-400 fill-current" />
              <span>Next-Gen Quantum Crypto Security</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-black tracking-tight leading-[1.06] text-white">
              SECURE TODAY.{' '}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
                READY FOR THE QUANTUM ERA.
              </span>
            </h1>

            <p className="text-slate-400 text-[15px] leading-relaxed max-w-lg">
              QuantumShield analyzes your code, certificates, and infrastructure to detect cryptographic vulnerabilities and evaluate post-quantum readiness.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onStartScan}
                className="btn-primary text-[13px] px-6 py-3 rounded-xl"
              >
                <span>Start New Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExploreRisks}
                className="btn-secondary text-[13px] px-6 py-3 rounded-xl"
              >
                <span>Explore Quantum Risks</span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> NIST FIPS 203/204</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-indigo-400" /> Zero Key Retention</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-400" /> Real-time Analysis</span>
            </div>
          </div>

          {/* ── Centre: 3D hologram ── */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[400px] lg:min-h-[460px]">

            {/* Glow ring behind shield */}
            <div className="absolute w-64 h-64 rounded-full border border-indigo-500/15 animate-spin-slow" />
            <div className="absolute w-80 h-80 rounded-full border border-violet-500/10 animate-spin-reverse" />

            <QuantumShield3D />

            {/* Floating assets */}
            <div className="absolute top-2 left-6 z-20 animate-float-slow cursor-pointer hover:scale-110 transition-transform">
              <BtcCoin3D />
            </div>
            <div className="absolute top-4 right-8 z-20 animate-float-reverse cursor-pointer hover:scale-110 transition-transform">
              <EthCrystal3D />
            </div>
            <div className="absolute bottom-10 right-4 z-20 animate-float-slow cursor-pointer hover:scale-110 transition-transform">
              <SolBadge3D />
            </div>

            {/* Floating file tags */}
            <div className="absolute top-20 left-2 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-indigo-300 border border-indigo-500/30 flex items-center gap-2 shadow-md animate-float-reverse">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>main.py</span>
            </div>
            <div className="absolute bottom-16 left-4 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-violet-300 border border-violet-500/30 flex items-center gap-2 shadow-md animate-float-slow">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              <span>certificate.pem</span>
            </div>
            <div className="absolute top-24 right-4 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-2 shadow-md animate-float-slow">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>config.yaml</span>
            </div>
          </div>

          {/* ── Right: quantum readiness score card ── */}
          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card-indigo p-7 rounded-3xl space-y-6 shadow-2xl">

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                <span>Quantum Readiness</span>
                {!isRealData && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">PREVIEW</span>
                )}
              </div>

              {/* Gauge */}
              <div className="flex flex-col items-center py-2">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="66" stroke="rgba(99,102,241,0.12)" strokeWidth="10" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="66"
                      stroke="url(#gaugeGrad)"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 66}`}
                      strokeDashoffset={2 * Math.PI * 66 * (1 - quantumScore / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-white tabular-nums">{quantumScore}</span>
                    <span className="text-[11px] text-slate-400 font-semibold">/100</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score rows */}
              <div className="space-y-3 text-[12px] font-semibold">
                {[
                  { label: 'Classical Security', value: classicalScore, color: 'text-emerald-400' },
                  { label: 'Quantum Resistance',  value: quantumScore,   color: 'text-indigo-300' },
                  { label: 'PQC Adoption',        value: pqcScore,       color: 'text-violet-300' },
                ].map(r => (
                  <div key={r.label} className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{r.label}</span>
                      <span className={`font-bold font-mono ${r.color}`}>{r.value}/100</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700`}
                        style={{ width: `${r.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-white/6 text-slate-400">
                  <span>Overall Risk</span>
                  <span className={`font-bold capitalize ${getRiskColor(overallRisk)}`}>{overallRisk}</span>
                </div>
              </div>

              <button
                onClick={onStartScan}
                className="w-full flex items-center justify-between text-[11px] font-bold text-indigo-300 hover:text-indigo-200 pt-1 transition-colors"
              >
                <span>{isRealData ? 'View Active Report' : 'Run Audit to Calculate Live Score'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ================================================================
          FEATURE CARDS BAR
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {features.map(({ icon: Icon, color, bg, title, sub }) => (
            <div
              key={title}
              className="glass-card glass-card-hover p-5 flex items-center gap-4 cursor-default"
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-white leading-tight">{title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================
          BOTTOM ROW: Upload zone + live activity
          ================================================================ */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Upload zone */}
          <div className="lg:col-span-7 glass-card p-10 rounded-3xl space-y-7">

            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-600/25 to-violet-600/25 border border-indigo-500/30 flex items-center justify-center shadow-xl animate-glow-pulse">
                <Upload className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-white">Drop your files here to start scanning</h3>
              <p className="text-sm text-slate-400">Support for code, certificates, configs, keys, and archives</p>

              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {['.py', '.java', '.js', '.ts', '.pem', '.crt', '.yml', '.zip', '+ More'].map(ext => (
                  <span key={ext} className="px-3 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onStartScan}
                className="py-3 px-4 rounded-xl text-[12px] font-bold text-indigo-300 glass-card-indigo hover:border-indigo-400/50 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
              <button
                onClick={onStartScan}
                className="py-3 px-4 rounded-xl text-[12px] font-bold text-violet-300 glass-card-violet hover:border-violet-400/50 flex items-center justify-center gap-2 transition-all"
              >
                <Folder className="w-4 h-4" />
                <span>Upload Project</span>
              </button>
              <button
                onClick={() => onSelectDemo('legacy_bank')}
                className="py-3 px-4 rounded-xl text-[12px] font-bold text-cyan-300 glass-card-cyan hover:border-cyan-400/50 flex items-center justify-center gap-2 transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>Scan Website</span>
              </button>
            </div>

            {/* Demo projects */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Try a Demo Project</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'legacy_bank',   label: 'Legacy Bank API',  risk: 'CRITICAL', icon: AlertTriangle },
                  { id: 'defi_protocol', label: 'DeFi Protocol',    risk: 'HIGH',     icon: TrendingUp },
                  { id: 'cloud_infra',   label: 'Cloud Infra',      risk: 'MEDIUM',   icon: ShieldCheck },
                ].map(({ id, label, risk, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => onSelectDemo(id)}
                    className="p-3 rounded-xl glass-card glass-card-hover flex items-center gap-3 text-left"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${risk === 'CRITICAL' ? 'text-rose-400' : risk === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <div>
                      <p className="text-[12px] font-bold text-white">{label}</p>
                      <p className={`text-[10px] font-mono font-bold ${risk === 'CRITICAL' ? 'text-rose-400' : risk === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}`}>{risk} RISK</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Live scan activity */}
          <div className="lg:col-span-5 glass-card p-8 rounded-3xl space-y-5">

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Live Scan Activity</span>
              <button onClick={onStartScan} className="text-indigo-400 hover:text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {scanActivity.map(({ name, type, icon: Icon, status, statusLabel, statusCls }) => (
                <div
                  key={name}
                  className="p-4 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-white">{name}</p>
                      <p className="text-[11px] text-slate-400">{type}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${statusCls}`}>
                    {status === 'done' ? (
                      <><span>{statusLabel}</span><CheckCircle2 className="w-3.5 h-3.5" /></>
                    ) : (
                      <><span className={status === 'scanning' || status === 'analyzing' ? 'animate-pulse' : ''}>{statusLabel}</span>
                        <div className={`w-2.5 h-2.5 border-2 ${status === 'scanning' ? 'border-indigo-400' : 'border-violet-400'} border-t-transparent rounded-full animate-spin`} /></>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
              {[
                { label: 'Files Scanned', value: '14', sub: 'this session' },
                { label: 'Issues Found',  value: '23', sub: 'across 4 files' },
                { label: 'PQC Ready',     value: '62%', sub: 'of codebase' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-black text-white font-mono">{value}</p>
                  <p className="text-[10px] font-bold text-slate-300">{label}</p>
                  <p className="text-[9px] text-slate-500">{sub}</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
