import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, Sparkles, Shield } from 'lucide-react';

export const QuantumScanAnimation: React.FC = () => {
  const steps = [
    { title: 'ANALYZING FILE SYSTEM & AST',           desc: 'Parsing Python AST, Java byte structures, Node imports, and X.509 certs' },
    { title: 'CRYPTOGRAPHIC PRIMITIVE DETECTION',      desc: 'Executing Layer 1 & 2 regex/API patterns for RSA, AES, ECC, and PQC' },
    { title: 'BUILDING CRYPTOGRAPHIC INVENTORY',       desc: 'Cataloging key sizes, algorithm variants, confidence scores, and code lines' },
    { title: 'ANALYZING QUANTUM THREATS',              desc: "Simulating Shor's polynomial factoring and Grover's quadratic search reduction" },
    { title: 'CALCULATING READINESS SCORES',           desc: 'Computing classical & quantum 0–100 readiness indices and deduction logs' },
    { title: 'GENERATING PQC MIGRATION REPORT',        desc: 'Mapping legacy primitives to NIST FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA)' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const logMessages = [
    '[+] Initializing QuantumShield Scanning Engine v1.0.0…',
    '[+] Parsing AST structures and X.509 PEM headers…',
    '[!] Found RSA-2048 keypair → Flagged Shor threat',
    '[!] Detected AES-128-GCM cipher → Grover search degradation',
    '[+] Analyzing post-quantum compatibility…',
    '[+] Generating mathematical score breakdown…',
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (logMessages[currentStep]) {
      setConsoleLogs(prev => [...prev, logMessages[currentStep]]);
    }
  }, [currentStep]);

  const progress = Math.min(100, Math.round(((currentStep + 1) / steps.length) * 100));

  return (
    <div className="max-w-3xl mx-auto py-14 px-4">
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/25 shadow-2xl space-y-7 relative overflow-hidden">

        {/* Ambient glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-indigo-500/5 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600/25 to-cyan-600/20 border border-indigo-500/35 flex items-center justify-center shadow-xl animate-glow-pulse">
            <Cpu className="w-10 h-10 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Quantum Threat Scan In Progress</h2>
            <p className="text-[12px] text-slate-400 mt-1 max-w-md mx-auto">
              Analyzing cryptographic primitives against Shor's and Grover's quantum algorithms…
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="uppercase tracking-widest font-bold">Pipeline Progress</span>
            <span className="text-cyan-400 font-black">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/4 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #22d3ee, #10b981)',
                boxShadow: '0 0 12px rgba(34,211,238,0.35)',
              }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 relative z-10">
          {steps.map((step, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
                  current ? 'bg-indigo-950/50 border-indigo-500/40 shadow-md' :
                  done    ? 'bg-white/3 border-white/5' :
                            'bg-transparent border-transparent opacity-40'
                }`}
              >
                <div className="shrink-0">
                  {done    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                   current ? <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow" /> :
                             <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-[10px] font-mono text-slate-500">{i + 1}</div>}
                </div>
                <div className="min-w-0">
                  <p className={`text-[12px] font-mono font-bold ${current ? 'text-cyan-300' : done ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Console log */}
        <div className="glass-inset p-4 font-mono text-[11px] text-cyan-400/80 h-24 overflow-y-auto space-y-1 relative z-10">
          {consoleLogs.map((log, i) => (
            <div key={i} className="truncate">{log}</div>
          ))}
          <div className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
        </div>

      </div>
    </div>
  );
};
