import React, { useState } from 'react';
import { Shield, HelpCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { RiskScores, ScoreBreakdown } from '../types/scan';
import { ScoreExplanationModal } from './ScoreExplanationModal';

interface ReadinessScoreGaugeProps {
  scores: RiskScores;
  breakdown: ScoreBreakdown;
}

export const ReadinessScoreGauge: React.FC<ReadinessScoreGaugeProps> = ({ scores, breakdown }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const qScore = scores?.quantum_score ?? 0;
  const cScore = scores?.classical_score ?? 0;
  const pqcScore = scores?.pqc_score ?? 0;
  const risk = scores?.overall_risk ?? 'LOW';

  let statusLabel = 'Quantum Ready';
  let statusBadgeClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  let strokeColor = '#10b981';

  if (qScore < 50 || risk === 'CRITICAL') {
    statusLabel = 'Critical Quantum Risk';
    statusBadgeClass = 'text-rose-400 border-rose-500/30 bg-rose-950/20';
    strokeColor = '#f43f5e';
  } else if (qScore < 85 || risk === 'HIGH') {
    statusLabel = 'Partial Post-Quantum Ready';
    statusBadgeClass = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    strokeColor = '#f59e0b';
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (qScore / 100) * circumference;

  return (
    <>
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Circular Score Gauge */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => setIsModalOpen(true)}
              className="relative w-44 h-44 flex items-center justify-center cursor-pointer group transition-transform hover:scale-105"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="rgba(30, 41, 59, 0.6)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {qScore}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Out of 100</span>
                <span className="text-[10px] text-indigo-400 font-semibold mt-1 flex items-center space-x-1 hover:underline">
                  <span>Score Details</span>
                  <HelpCircle className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className={`mt-3 px-3.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass}`}>
              {statusLabel}
            </div>
          </div>

          {/* Sub-Metrics Cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-400">Classical Security Score</div>
              <div className="text-2xl font-bold text-white">{cScore} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${cScore}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-400">Quantum Resistance</div>
              <div className="text-2xl font-bold text-indigo-400">{qScore}%</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${qScore}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-400">PQC Adoption Rate</div>
              <div className="text-2xl font-bold text-teal-400">{pqcScore}%</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: `${pqcScore}%` }} />
              </div>
            </div>

            <div 
              onClick={() => setIsModalOpen(true)}
              className="sm:col-span-3 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between transition-all text-xs"
            >
              <div className="flex items-center space-x-2 text-slate-300">
                <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Click here for a transparent mathematical breakdown of this readiness score.</span>
              </div>
              <span className="text-indigo-400 font-semibold flex-shrink-0 hover:underline">Explain Score &rarr;</span>
            </div>

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
