import React, { useState } from 'react';
import { HelpCircle, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react';
import { RiskScores, ScoreBreakdown } from '../types/scan';
import { ScoreExplanationModal } from './ScoreExplanationModal';

interface ReadinessScoreGaugeProps {
  scores: RiskScores;
  breakdown: ScoreBreakdown;
}

export const ReadinessScoreGauge: React.FC<ReadinessScoreGaugeProps> = ({ scores, breakdown }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const qScore   = scores?.quantum_score   ?? 0;
  const cScore   = scores?.classical_score ?? 0;
  const pqcScore = scores?.pqc_score       ?? 0;
  const risk     = scores?.overall_risk    ?? 'LOW';

  // Status derivation
  let statusLabel = 'Quantum Ready';
  let statusCls   = 'badge-safe';
  let gaugeStart  = '#10b981';
  let gaugeEnd    = '#22d3ee';
  let icon        = <ShieldCheck className="w-5 h-5 text-emerald-400" />;

  if (qScore < 50 || risk === 'CRITICAL') {
    statusLabel = 'Critical Quantum Risk';
    statusCls   = 'badge-critical';
    gaugeStart  = '#f43f5e'; gaugeEnd = '#fb923c';
    icon        = <ShieldAlert className="w-5 h-5 text-rose-400" />;
  } else if (qScore < 85 || risk === 'HIGH') {
    statusLabel = 'Partial PQC Ready';
    statusCls   = 'badge-high';
    gaugeStart  = '#f59e0b'; gaugeEnd = '#fbbf24';
    icon        = <TrendingUp className="w-5 h-5 text-amber-400" />;
  }

  const r = 68;
  const circ = 2 * Math.PI * r;

  const subMetrics = [
    { label: 'Classical Security', value: cScore,   color: '#60a5fa', cls: 'text-blue-300' },
    { label: 'Quantum Resistance', value: qScore,   color: '#818cf8', cls: 'text-indigo-300' },
    { label: 'PQC Adoption',       value: pqcScore, color: '#22d3ee', cls: 'text-cyan-300' },
  ];

  return (
    <>
      <div className="glass-panel p-7 rounded-3xl border border-white/6 space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* ── Gauge ── */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div
              onClick={() => setIsModalOpen(true)}
              className="relative w-44 h-44 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              title="Click for score breakdown"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r={r} stroke="rgba(99,102,241,0.12)" strokeWidth="10" fill="transparent" />
                <circle
                  cx="88" cy="88" r={r}
                  stroke={`url(#qGaugeGrad-${Math.round(qScore)})`}
                  strokeWidth="10"
                  strokeDasharray={circ}
                  strokeDashoffset={circ - (qScore / 100) * circ}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out drop-shadow-sm"
                />
                <defs>
                  <linearGradient id={`qGaugeGrad-${Math.round(qScore)}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={gaugeStart} />
                    <stop offset="100%" stopColor={gaugeEnd} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-black text-white tabular-nums">{Math.round(qScore)}</span>
                <span className="text-[11px] text-slate-400">/ 100</span>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-300 font-semibold">
                  <HelpCircle className="w-3 h-3" />
                  <span>Details</span>
                </div>
              </div>
            </div>

            <span className={`badge ${statusCls} flex items-center gap-1.5 px-3 py-1`}>
              {icon}
              {statusLabel}
            </span>
          </div>

          {/* ── Sub-metrics ── */}
          <div className="flex-1 w-full space-y-4">
            {subMetrics.map(({ label, value, color, cls }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <span className={`font-black font-mono ${cls}`}>{Math.round(value)}<span className="text-slate-500 font-normal">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-white/4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
                  />
                </div>
              </div>
            ))}

            {/* Breakdown link */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-2 p-3.5 rounded-xl glass-card-indigo hover:border-indigo-400/40 flex items-center justify-between text-[12px] transition-all group"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>View transparent mathematical score breakdown</span>
              </div>
              <span className="text-indigo-300 font-bold group-hover:text-indigo-200 shrink-0">Explain →</span>
            </button>
          </div>

        </div>
      </div>

      <ScoreExplanationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        breakdown={breakdown}
      />
    </>
  );
};
