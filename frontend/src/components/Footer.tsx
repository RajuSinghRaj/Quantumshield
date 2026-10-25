import React from 'react';
import { Shield, Lock, ExternalLink, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-24 border-t border-white/5 overflow-hidden">

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-indigo-600/4 blur-2xl pointer-events-none" />

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-14">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand block */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                <Shield className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="text-base font-black text-white tracking-wider">
                QUANTUM<span className="text-indigo-400">SHIELD</span>
              </span>
            </div>

            <p className="text-[13px] text-slate-400 leading-relaxed max-w-md">
              Next-generation cryptographic audit and post-quantum readiness scanner.
              Protecting classical software assets and planning migration to NIST FIPS 203 (ML-KEM),
              FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) standards.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-mono font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Key Retention Policy</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Real-time Analysis</span>
              </div>
            </div>
          </div>

          {/* Post-quantum standards */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-400 mb-4">Post-Quantum Standards</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'NIST FIPS 203 — ML-KEM', url: 'https://csrc.nist.gov/pubs/fips/203/final' },
                { label: 'NIST FIPS 204 — ML-DSA', url: 'https://csrc.nist.gov/pubs/fips/204/final' },
                { label: 'NIST FIPS 205 — SLH-DSA', url: 'https://csrc.nist.gov/pubs/fips/205/final' },
              ].map(({ label, url }) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* System architecture */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400 mb-4">System Architecture</h4>
            <ul className="space-y-2 text-[12px] text-slate-400 font-mono">
              {[
                'Multi-Layer AST & Regex Engine',
                'X.509 Certificate Parser',
                "Shor's & Grover's Evaluator",
                'Qiskit AerSimulator (BBM92)',
                'ReportLab PDF Generator',
              ].map(item => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <p>© 2026 QUANTUMSHIELD Cybersecurity Laboratory. All rights reserved.</p>
          <p>VERSION 1.0.0-PQC · ENTERPRISE EDITION</p>
        </div>

      </div>
    </footer>
  );
};
