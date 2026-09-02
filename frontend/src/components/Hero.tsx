import React from 'react';
import {
  Shield, ArrowRight, Zap, FileCode, Lock, Globe, Upload, Folder, CheckCircle2,
  HelpCircle, Sparkles, Layers, Cpu, Code, ChevronRight
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
  onStartScan,
  onExploreRisks,
  onSelectDemo,
  scanResult,
}) => {

  const stars = [
    { top: '8%', left: '15%', delay: '0s' },
    { top: '12%', left: '80%', delay: '0.8s' },
    { top: '40%', left: '8%', delay: '1.4s' },
    { top: '48%', left: '92%', delay: '0.4s' },
    { top: '75%', left: '25%', delay: '1.8s' },
    { top: '82%', left: '75%', delay: '1.1s' },
  ];

  // Derive dynamic accurate scores or fallback demo preview values
  const quantumScore = scanResult ? Math.round(scanResult.scores.quantum_score) : 72;
  const classicalScore = scanResult ? Math.round(scanResult.scores.classical_score) : 85;
  const pqcScore = scanResult ? Math.round(scanResult.scores.pqc_score) : 60;
  const overallRisk = scanResult ? scanResult.scores.overall_risk : 'Medium';
  const isRealData = Boolean(scanResult);

  // Status color helpers
  const getRiskColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-500';
      case 'HIGH': return 'text-amber-500';
      case 'MEDIUM': return 'text-amber-400';
      default: return 'text-emerald-500';
    }
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return { label: 'EXCELLENT', color: 'text-emerald-500' };
    if (score >= 65) return { label: 'GOOD', color: 'text-emerald-400' };
    if (score >= 45) return { label: 'MODERATE', color: 'text-amber-400' };
    return { label: 'AT RISK', color: 'text-rose-500' };
  };

  const status = getStatusBadge(quantumScore);

  return (
    <div className="relative py-8 lg:py-16 space-y-12 overflow-hidden w-full">
      
      {/* Background Star Particles */}
      {stars.map((star, idx) => (
        <div
          key={idx}
          className="absolute text-purple-400 opacity-60 animate-star-twinkle pointer-events-none text-base"
          style={{ top: star.top, left: star.left, animationDelay: star.delay }}
        >
          ✦
        </div>
      ))}

      {/* TOP HERO CONTAINER: Widescreen Layout */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Text & CTAs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/30 uppercase">
              <Zap className="w-3.5 h-3.5 text-purple-500 fill-current" />
              <span>Next-Gen Crypto Security</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
              SECURE TODAY. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400">
                READY FOR THE QUANTUM ERA.
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-normal max-w-xl">
              QuantumShield analyzes your code, certificates, and infrastructure to detect cryptographic risks and evaluate quantum readiness.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartScan}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5"
              >
                <span>Start New Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreRisks}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full font-bold text-sm text-purple-600 dark:text-purple-300 glass-card glass-card-hover border border-purple-500/30"
              >
                <span>Explore Quantum Risks</span>
              </button>
            </div>

          </div>

          {/* Middle Column: Central 3D Hologram & Orbiting Assets (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px]">
            
            {/* Central 3D Quantum Shield */}
            <QuantumShield3D />

            {/* Floating 3D BTC Coin (Top-Left) */}
            <div className="absolute top-2 left-6 z-20 animate-float-slow cursor-pointer hover:scale-110 transition-transform">
              <BtcCoin3D />
            </div>

            {/* Floating 3D ETH Crystal (Top-Right) */}
            <div className="absolute top-4 right-8 z-20 animate-float-reverse cursor-pointer hover:scale-110 transition-transform">
              <EthCrystal3D />
            </div>

            {/* Floating 3D SOL Badge (Bottom-Right) */}
            <div className="absolute bottom-10 right-4 z-20 animate-float-slow cursor-pointer hover:scale-110 transition-transform">
              <SolBadge3D />
            </div>

            {/* Floating Code Document Cards */}
            <div className="absolute top-20 left-2 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center space-x-2 shadow-md animate-float-reverse">
              <Code className="w-4 h-4 text-purple-500" />
              <span>main.py</span>
            </div>

            <div className="absolute bottom-16 left-4 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center space-x-2 shadow-md animate-float-slow">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>certificate.pem</span>
            </div>

            <div className="absolute top-24 right-4 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center space-x-2 shadow-md animate-float-slow">
              <FileCode className="w-4 h-4 text-cyan-500" />
              <span>config.yaml</span>
            </div>

            <div className="absolute bottom-10 right-28 z-10 px-3 py-1.5 rounded-xl glass-card text-xs font-mono text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center space-x-2 shadow-md animate-float-reverse">
              <FileCode className="w-4 h-4 text-purple-500" />
              <span>README.md</span>
            </div>

          </div>

          {/* Right Column: QUANTUM READINESS SCORE Card (3 cols) */}
          <div className="lg:col-span-3">
            <div className="glass-card p-7 rounded-3xl border border-purple-500/30 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <div className="flex items-center space-x-1.5">
                  <span>QUANTUM READINESS SCORE</span>
                  {!isRealData && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase">
                      PREVIEW
                    </span>
                  )}
                </div>
                <HelpCircle className="w-4 h-4 text-purple-400 cursor-pointer" />
              </div>

              {/* Gauge Score Circle */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="56" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="9" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="56"
                      stroke="#8b5cf6"
                      strokeWidth="9"
                      strokeDasharray="351"
                      strokeDashoffset={351 - (351 * quantumScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{quantumScore}</span>
                    <span className="text-xs text-slate-400 font-semibold">/100</span>
                    <span className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-2.5 text-xs font-semibold">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Classical Security</span>
                  <span className="text-emerald-500 font-bold">{classicalScore}/100</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Quantum Resistance</span>
                  <span className="text-indigo-500 font-bold">{quantumScore}/100</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>PQC Adoption</span>
                  <span className="text-purple-500 font-bold">{pqcScore}/100</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Overall Risk</span>
                  <span className={`font-bold capitalize ${getRiskColor(overallRisk)}`}>{overallRisk}</span>
                </div>
              </div>

              {/* View Full Report Link */}
              <button
                onClick={onStartScan}
                className="w-full pt-2 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-300 hover:underline"
              >
                <span>{isRealData ? 'View Active Report' : 'Run Audit to Calculate Live Score'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* MIDDLE FEATURE CARDS BAR */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          
          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 glass-card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-500 flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Deep Crypto Analysis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Detects 100+ algorithms & protocols</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 glass-card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quantum Risk Detection</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Evaluates Shor's & Grover's threats</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 glass-card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-500 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">PQC Recommendations</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Smart migration to FIPS 203/204</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 glass-card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-500 flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Actionable Reports</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Detailed fix priority & PDF exports</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 glass-card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-500 flex-shrink-0">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Source Scanning</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Supports code, certs, keys, & ZIPs</p>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM SECTION: Dropzone Left | Live Scan Activity Right */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Upload Dropzone (7 cols) */}
          <div className="lg:col-span-7 glass-card p-8 sm:p-10 rounded-3xl border border-purple-500/20 space-y-6">
            
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-500 shadow-xl">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Drop your files here to start scanning
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Support for code, certificates, configs, keys, and archives
              </p>

              {/* Extension Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['.py', '.java', '.js', '.pem', '.crt', '.yml', '.zip', '+ More'].map((ext) => (
                  <span key={ext} className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <button
                onClick={onStartScan}
                className="py-3.5 px-5 rounded-2xl text-xs font-bold text-purple-600 dark:text-purple-300 glass-card glass-card-hover border border-purple-500/30 flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </button>

              <button
                onClick={onStartScan}
                className="py-3.5 px-5 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-300 glass-card glass-card-hover border border-indigo-500/30 flex items-center justify-center space-x-2"
              >
                <Folder className="w-4 h-4" />
                <span>Upload Folder / Project</span>
              </button>

              <button
                onClick={() => onSelectDemo('legacy_bank')}
                className="py-3.5 px-5 rounded-2xl text-xs font-bold text-teal-600 dark:text-teal-300 glass-card glass-card-hover border border-teal-500/30 flex items-center justify-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>Scan Website</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Live Scan Activity (5 cols) */}
          <div className="lg:col-span-5 glass-card p-7 sm:p-8 rounded-3xl border border-purple-500/20 space-y-5">
            
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-purple-500/10 pb-4">
              <span>LIVE SCAN ACTIVITY</span>
              <button onClick={onStartScan} className="text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Live Scan List */}
            <div className="space-y-3.5">
              
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3.5">
                  <Folder className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">DeFi-Protocol.zip</div>
                    <div className="text-xs text-slate-400">ZIP Archive</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-500 flex items-center space-x-1.5 animate-pulse">
                  <span>Scanning...</span>
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3.5">
                  <Code className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">auth_service.py</div>
                    <div className="text-xs text-slate-400">Python File</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1.5">
                  <span>Completed</span>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3.5">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">certificate.pem</div>
                    <div className="text-xs text-slate-400">X.509 Certificate</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1.5">
                  <span>Completed</span>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3.5">
                  <FileCode className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">config.yaml</div>
                    <div className="text-xs text-slate-400">YAML Config</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-500 flex items-center space-x-1.5 animate-pulse">
                  <span>Analyzing...</span>
                  <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </span>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
