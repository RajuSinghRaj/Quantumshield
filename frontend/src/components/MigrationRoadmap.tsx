import React from 'react';
import { ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Download, GitBranch, AlertTriangle } from 'lucide-react';
import { MigrationItem } from '../types/scan';

interface MigrationRoadmapProps {
  migrationPlan: MigrationItem[];
  scanId?: string;
  onDownloadPdf?: () => void;
}

const priorityConfig: Record<string, { badgeCls: string; borderCls: string; bgCls: string }> = {
  CRITICAL: { badgeCls: 'badge-critical', borderCls: 'border-rose-500/30',   bgCls: 'bg-rose-500/4' },
  HIGH:     { badgeCls: 'badge-high',     borderCls: 'border-amber-500/25',  bgCls: 'bg-amber-500/4' },
  MEDIUM:   { badgeCls: 'badge-medium',   borderCls: 'border-indigo-500/20', bgCls: 'bg-indigo-500/3' },
  LOW:      { badgeCls: 'badge-low',      borderCls: 'border-emerald-500/20',bgCls: 'bg-emerald-500/3' },
};

export const MigrationRoadmap: React.FC<MigrationRoadmapProps> = ({ migrationPlan, onDownloadPdf }) => {
  const criticalCount = migrationPlan.filter(m => m.priority === 'CRITICAL').length;
  const highCount     = migrationPlan.filter(m => m.priority === 'HIGH').length;

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto py-8 px-4 sm:px-8 lg:px-12 xl:px-16">

      {/* Header */}
      <div className="glass-panel p-7 rounded-3xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-pqc flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> NIST POST-QUANTUM MIGRATION
            </span>
            {criticalCount > 0 && <span className="badge badge-critical">{criticalCount} Critical</span>}
            {highCount > 0     && <span className="badge badge-high">{highCount} High</span>}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Post-Quantum Transition Center</h1>
          <p className="text-[13px] text-slate-400 max-w-2xl leading-relaxed">
            Prioritized remediation actions to upgrade classical algorithms to NIST FIPS 203 (ML-KEM),
            FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA).
          </p>
        </div>
        {onDownloadPdf && (
          <button onClick={onDownloadPdf} className="btn-primary shrink-0">
            <Download className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>
        )}
      </div>

      {/* Migration items */}
      {(!migrationPlan || migrationPlan.length === 0) ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Immediate PQC Remediations Required</h3>
          <p className="text-[13px] text-slate-400 max-w-lg mx-auto">
            All detected cryptographic assets are either post-quantum ready or maintain safe symmetric key margins under Grover search.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {migrationPlan.map((item, idx) => {
            const cfg = priorityConfig[item.priority] || priorityConfig.LOW;
            return (
              <div
                key={idx}
                className={`glass-panel p-7 rounded-3xl border ${cfg.borderCls} ${cfg.bgCls} space-y-5`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge ${cfg.badgeCls}`}>PRIORITY: {item.priority}</span>
                    <div className="flex items-center gap-2 font-mono font-black text-[15px] text-white">
                      <span>{item.current_algorithm}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-cyan-300">{item.recommended_replacement}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Role: <span className="text-white font-semibold">{item.usage}</span>
                  </span>
                </div>

                {/* Strategy + steps */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[12px]">
                  <div className="md:col-span-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recommended Strategy</p>
                    <div className="glass-inset p-4 font-mono text-cyan-300 font-semibold leading-relaxed text-[12px]">
                      {item.strategy}
                    </div>
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Actionable Migration Steps</p>
                    <ul className="space-y-2">
                      {item.action_steps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2.5 text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                            {si + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
