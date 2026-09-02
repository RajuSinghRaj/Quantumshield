import React from 'react';
import { X, AlertTriangle, ShieldCheck, PlusCircle, MinusCircle, Calculator } from 'lucide-react';
import { ScoreBreakdown } from '../types/scan';

interface ScoreExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: ScoreBreakdown;
}

export const ScoreExplanationModal: React.FC<ScoreExplanationModalProps> = ({
  isOpen,
  onClose,
  breakdown,
}) => {
  if (!isOpen || !breakdown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-cyan-400/40 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              QUANTUM READINESS SCORE CALCULATION
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-xl glass-panel border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-300">FINAL QUANTUM READINESS SCORE</div>
            <div className="text-3xl font-extrabold text-white font-mono">{breakdown.quantum_readiness_score} / 100</div>
          </div>
          <div className="text-right text-xs font-mono text-slate-300 space-y-0.5">
            <div>Classical Score: <strong className="text-white">{breakdown.classical_security_score}/100</strong></div>
            <div>PQC Adoption: <strong className="text-cyan-300">{breakdown.pqc_adoption_percentage}%</strong></div>
            <div>Risk Rating: <strong className="text-rose-400">{breakdown.overall_risk}</strong></div>
          </div>
        </div>

        {/* Mathematical Base Logic Explanation */}
        <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="font-semibold text-white mb-1">Scoring Methodology:</p>
          Calculations start at a baseline of <strong>100 Points</strong>. Deductions are subtracted based on Shor's polynomial factoring vulnerability on public keys (RSA/ECC) and Grover's search bit-length reduction on symmetric ciphers. Bonuses are awarded for NIST Post-Quantum Cryptography implementations (ML-KEM, ML-DSA).
        </div>

        {/* Deductions List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <MinusCircle className="w-4 h-4 text-rose-400" />
            <span>DEDUCTIONS ({breakdown.deductions?.length || 0})</span>
          </h4>

          {(!breakdown.deductions || breakdown.deductions.length === 0) ? (
            <div className="text-xs text-slate-400 italic">No vulnerability deductions found.</div>
          ) : (
            <div className="space-y-2">
              {breakdown.deductions.map((ded, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 flex items-start justify-between space-x-3 text-xs">
                  <div>
                    <div className="font-bold text-rose-300 font-mono flex items-center space-x-2">
                      <span>{ded.asset}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">
                        {ded.threat}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 leading-snug">{ded.reason}</p>
                    {ded.file && (
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        Location: {ded.file}:{ded.line || 1}
                      </div>
                    )}
                  </div>
                  <span className="font-mono font-extrabold text-rose-400 text-sm">
                    -{ded.penalty} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonuses List */}
        {breakdown.bonuses && breakdown.bonuses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>POST-QUANTUM BONUSES ({breakdown.bonuses.length})</span>
            </h4>
            <div className="space-y-2">
              {breakdown.bonuses.map((bon, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium">{bon.reason}</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">+{bon.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            CLOSE BREAKDOWN
          </button>
        </div>

      </div>
    </div>
  );
};
