import React, { useEffect, useState } from 'react';
import { Cpu, ShieldAlert, Sparkles, CheckCircle2, Layers } from 'lucide-react';

interface QuantumScanAnimationProps {
  onComplete?: () => void;
}

export const QuantumScanAnimation: React.FC<QuantumScanAnimationProps> = () => {
  const steps = [
    { title: 'ANALYZING FILE SYSTEM & AST', desc: 'Parsing Python AST, Java byte structures, Node imports, and X.509 certs' },
    { title: 'CRYPTOGRAPHIC PRIMITIVE DETECTION', desc: 'Executing Layer 1 & 2 regex/API patterns for RSA, AES, ECC, and PQC' },
    { title: 'BUILDING CRYPTOGRAPHIC INVENTORY', desc: 'Cataloging key sizes, algorithm variants, confidence scores, and code lines' },
    { title: 'ANALYZING QUANTUM THREATS (SHOR & GROVER)', desc: 'Simulating quantum polynomial factoring and Grover quadratic search reduction' },
    { title: 'CALCULATING QUANTUM READINESS SCORES', desc: 'Computing classical & quantum 0-100 readiness indices and deduction logs' },
    { title: 'GENERATING PQC MIGRATION REPORT', desc: 'Mapping legacy primitives to NIST FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA)' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const logs = [
      `[+] Initializing QuantumShield Scanning Engine v1.0.0...`,
      `[+] Parsing AST structures and X.509 PEM headers...`,
      `[!] Found RSA-2048 keypair instantiation -> Flagged Shor threat`,
      `[!] Detected AES-128-GCM cipher mode -> Grover search degradation`,
      `[+] Analyzing post-quantum compatibility...`,
      `[+] Generating mathematical score breakdown...`,
    ];
    setConsoleLogs((prev) => [...prev, logs[currentStepIndex] || '']);
  }, [currentStepIndex]);

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / steps.length) * 100));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center">
      <div className="glass-panel p-8 rounded-2xl border border-cyan-400/40 relative overflow-hidden shadow-2xl space-y-6">
        
        {/* Laser Beam Scanning Effect Overlay */}
        <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-laser-scan pointer-events-none" />

        {/* Header Icon */}
        <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-10 h-10 text-cyan-300 animate-pulse" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide font-mono">
            QUANTUM THREAT SCAN IN PROGRESS
          </h2>
          <p className="text-xs text-cyan-300 font-mono mt-1">
            Analyzing cryptographic primitives against Shor's and Grover's quantum algorithms...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>PIPELINE PROGRESS</span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-teal-300 rounded-full transition-all duration-500 shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step Cards */}
        <div className="grid grid-cols-1 gap-2 text-left pt-2">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl flex items-center space-x-3 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-purple-950/60 border border-cyan-400/60 text-white shadow-md shadow-cyan-500/10'
                    : isDone
                    ? 'bg-slate-900/40 border border-slate-800 text-slate-400'
                    : 'bg-slate-950/20 text-slate-600 border border-transparent'
                }`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-mono font-bold ${isCurrent ? 'text-cyan-300' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Console Log Box */}
        <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-400/90 h-24 overflow-y-auto space-y-1">
          {consoleLogs.map((log, i) => (
            <div key={i} className="truncate">
              {log}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
