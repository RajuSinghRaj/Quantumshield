import React from 'react';
import { Shield, Lock, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-purple-500/20 bg-slate-950/80 mt-20 text-slate-400 py-12 text-xs">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-lg text-white tracking-wider">QUANTUMSHIELD</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-md">
            Next-generation cryptographic audit and post-quantum readiness scanner. 
            Protecting classical software assets and planning migration to NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) standards.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-purple-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Zero-Private-Key Retention Policy</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3 tracking-wider text-xs uppercase text-cyan-400">Post-Quantum Standards</h4>
          <ul className="space-y-2 font-mono text-[11px]">
            <li>
              <a href="https://csrc.nist.gov/pubs/fips/203/final" target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center space-x-1">
                <span>NIST FIPS 203 — ML-KEM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href="https://csrc.nist.gov/pubs/fips/204/final" target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center space-x-1">
                <span>NIST FIPS 204 — ML-DSA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href="https://csrc.nist.gov/pubs/fips/205/final" target="_blank" rel="noreferrer" className="hover:text-cyan-300 flex items-center space-x-1">
                <span>NIST FIPS 205 — SLH-DSA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3 tracking-wider text-xs uppercase text-purple-400">System Architecture</h4>
          <ul className="space-y-2 text-slate-400">
            <li>Multi-Layer AST & Regex Engine</li>
            <li>X.509 Certificate Parser</li>
            <li>Shor's & Grover's Threat Evaluator</li>
            <li>ReportLab PDF Generator</li>
          </ul>
        </div>

      </div>

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
        <p>© 2026 QUANTUMSHIELD Cybersecurity Laboratory. All rights reserved.</p>
        <p className="font-mono mt-2 sm:mt-0">VERSION 1.0.0-PQC // ENTERPRISE EDITION</p>
      </div>
    </footer>
  );
};
