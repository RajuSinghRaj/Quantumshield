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
    { label: 'Classical Security', value: cScore,   color: '#ea580c', cls: 'text-orange-600 dark:text-orange-400' },
    { label: 'Quantum Resistance', value: qScore,   color: '#f97316', cls: 'text-amber-600 dark:text-amber-400' },
    { label: 'PQC Adoption',       value: pqcScore, color: '#10b981', cls: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <>
      <div className="p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* ── Gauge ── */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div
              onClick={() => setIsModalOpen(true)}
              className="relative w-44 h-44 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              title="Click for score breakdown"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r={r} stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="10" fill="transparent" />
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
                <span className="text-4xl font-black text-stone-900 dark:text-stone-50 tabular-nums">{Math.round(qScore)}</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">/ 100</span>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                  <HelpCircle className="w-3 h-3" />
                  <span>Details</span>
                </div>
              </div>
            </div>

            <span className={`badge ${statusCls} flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs`}>
              {icon}
              {statusLabel}
            </span>
          </div>

          {/* ── Sub-metrics ── */}
          <div className="flex-1 w-full space-y-4">
            {subMetrics.map(({ label, value, color, cls }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-stone-600 dark:text-stone-400 font-medium">{label}</span>
                  <span className={`font-black font-mono ${cls}`}>{Math.round(value)}<span className="text-stone-400 dark:text-stone-500 font-normal">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
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
              className="w-full mt-2 p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 hover:bg-orange-100/70 dark:hover:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/40 flex items-center justify-between text-[12px] transition-all group"
            >
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="font-medium">View transparent mathematical score breakdown</span>
              </div>
              <span className="text-orange-600 dark:text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">Explain →</span>
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
