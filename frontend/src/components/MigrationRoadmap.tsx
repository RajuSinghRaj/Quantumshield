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
      <div className="p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 text-orange-500" /> NIST POST-QUANTUM MIGRATION
            </span>
            {criticalCount > 0 && <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold text-[10px] uppercase font-mono">{criticalCount} Critical</span>}
            {highCount > 0     && <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase font-mono">{highCount} High</span>}
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight">Post-Quantum Transition Center</h1>
          <p className="text-[13px] text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            Prioritized remediation actions to upgrade classical algorithms to NIST FIPS 203 (ML-KEM),
            FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA).
          </p>
        </div>
        {onDownloadPdf && (
          <button onClick={onDownloadPdf} className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-orange-600/25 transition-all hover:scale-[1.02] shrink-0">
            <Download className="w-4 h-4 text-white" />
            <span>Export PDF Report</span>
          </button>
        )}
      </div>

      {/* Migration items */}
      {(!migrationPlan || migrationPlan.length === 0) ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-4 shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">No Immediate PQC Remediations Required</h3>
          <p className="text-[13px] text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            All detected cryptographic assets are either post-quantum ready or maintain safe symmetric key margins under Grover search.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {migrationPlan.map((item, idx) => {
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                      item.priority === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300' :
                      item.priority === 'HIGH'     ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300' :
                      'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300'
                    }`}>
                      PRIORITY: {item.priority}
                    </span>
                    <div className="flex items-center gap-2 font-mono font-black text-[15px] text-stone-900 dark:text-stone-50">
                      <span>{item.current_algorithm}</span>
                      <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-orange-600 dark:text-orange-400">{item.recommended_replacement}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    Role: <span className="text-stone-900 dark:text-stone-100 font-semibold">{item.usage}</span>
                  </span>
                </div>

                {/* Strategy + steps */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[12px]">
                  <div className="md:col-span-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Recommended Strategy</p>
                    <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40 font-mono text-orange-900 dark:text-orange-200 font-semibold leading-relaxed text-[12px]">
                      {item.strategy}
                    </div>
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Actionable Migration Steps</p>
                    <ul className="space-y-2">
                      {item.action_steps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
                          <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/70 border border-orange-200/80 dark:border-orange-800/40 text-[10px] font-bold text-orange-700 dark:text-orange-300 flex items-center justify-center shrink-0 mt-0.5">
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
