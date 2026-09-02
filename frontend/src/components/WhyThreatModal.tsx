import React from 'react';
import { X, HelpCircle, AlertTriangle, ShieldCheck, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { CryptographicAsset } from '../types/scan';

interface WhyThreatModalProps {
  asset: CryptographicAsset | null;
  onClose: () => void;
}

export const WhyThreatModal: React.FC<WhyThreatModalProps> = ({ asset, onClose }) => {
  if (!asset) return null;

  const isShorThreat = asset.quantum_threat.toLowerCase().includes('shor');
  const isGroverThreat = asset.quantum_threat.toLowerCase().includes('grover');
  const isPqc = asset.quantum_risk === 'POST_QUANTUM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-cyan-400/40 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              WHY IS THIS A SECURITY PROBLEM?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Asset Badge Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/60">
          <div>
            <div className="text-xs font-mono text-cyan-300">DETECTED PRIMITIVE</div>
            <div className="text-xl font-bold text-white font-mono">{asset.variant}</div>
            <div className="text-xs text-slate-400 font-mono">Usage: {asset.usage.replace('_', ' ').toUpperCase()}</div>
          </div>
          <div className="text-right space-y-1">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              asset.severity === 'CRITICAL' ? 'text-rose-400 border-rose-500/40 bg-rose-950/40' :
              asset.severity === 'HIGH' ? 'text-amber-400 border-amber-500/40 bg-amber-950/40' :
              'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
            }`}>
              SEVERITY: {asset.severity}
            </span>
            <div className="text-[11px] font-mono text-slate-400">Quantum Threat: {asset.quantum_threat}</div>
          </div>
        </div>

        {/* Section 1: Why is this a problem? */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>QUANTUM MECHANICS & MATHEMATICAL IMPACT</span>
          </h4>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-3">
            <p className="text-slate-200">{asset.why_problem}</p>

            {isShorThreat && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] space-y-1 font-mono">
                <div className="font-bold">&bull; Shor's Algorithm (1994) Breakdown:</div>
                <p>
                  Shor's quantum algorithm solves the prime factorization and discrete logarithm problems in polynomial time O(n³) using Quantum Fourier Transforms. A fault-tolerant quantum computer running Shor's algorithm can derive private keys directly from public keys, breaking RSA, ECC, and ECDSA completely.
                </p>
              </div>
            )}

            {isGroverThreat && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] space-y-1 font-mono">
                <div className="font-bold">&bull; Grover's Search Algorithm Breakdown:</div>
                <p>
                  Grover's algorithm provides a quadratic speedup O(&radic;N) for searching unstructured databases. This effectively cuts symmetric key bit length in half. For AES-128, 128-bit key security degrades to ~64 bits of quantum security.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: What Should I Do? */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>WHAT SHOULD I DO? (PQC REMEDIATION)</span>
          </h4>

          <div className="p-4 rounded-xl glass-panel border border-emerald-500/30 bg-emerald-950/20 text-xs text-slate-200 leading-relaxed space-y-3">
            <div className="font-bold text-white flex items-center space-x-2">
              <span>RECOMMENDED PQC ALTERNATIVE:</span>
              <span className="px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {asset.pqc_alternative || 'NIST PQC Suite'}
              </span>
            </div>
            
            <p className="text-slate-300">{asset.recommendation}</p>

            <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span>Target Standard: NIST FIPS 203 (ML-KEM) / FIPS 204 (ML-DSA)</span>
              <span className="text-slate-400">PQC Migration Center Available</span>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-cyan-300 hover:to-purple-300 shadow-md transition-all"
          >
            UNDERSTOOD
          </button>
        </div>

      </div>
    </div>
  );
};
