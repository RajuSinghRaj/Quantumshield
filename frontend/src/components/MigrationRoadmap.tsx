import React from 'react';
import { ArrowRight, ShieldAlert, Sparkles, CheckCircle2, FileText, Download } from 'lucide-react';
import { MigrationItem } from '../types/scan';

interface MigrationRoadmapProps {
  migrationPlan: MigrationItem[];
  scanId?: string;
  onDownloadPdf?: () => void;
}

export const MigrationRoadmap: React.FC<MigrationRoadmapProps> = ({
  migrationPlan,
  scanId,
  onDownloadPdf,
}) => {
  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto py-6 px-4 sm:px-8 lg:px-12 xl:px-16">
      
      {/* Title & Action Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyan-400/30">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIST POST-QUANTUM MIGRATION ROADMAP</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide font-mono">
            POST-QUANTUM TRANSITION CENTER
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Prioritized remediation actions to upgrade classical algorithms to NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA).
          </p>
        </div>

        {onDownloadPdf && (
          <button
            onClick={onDownloadPdf}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-cyan-300 hover:to-purple-300 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT PDF AUDIT REPORT</span>
          </button>
        )}
      </div>

      {/* Migration Matrix Cards */}
      {(!migrationPlan || migrationPlan.length === 0) ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white font-mono">NO IMMEDIATE PQC REMEDIATIONS REQUIRED</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All detected cryptographic assets are either Post-Quantum ready or maintain safe symmetric key margins under Grover search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {migrationPlan.map((item, idx) => {
            const isCritical = item.priority === 'CRITICAL';
            const isHigh = item.priority === 'HIGH';

            return (
              <div
                key={idx}
                className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 ${
                  isCritical ? 'border-rose-500/40 bg-rose-950/10' :
                  isHigh ? 'border-amber-500/40 bg-amber-950/10' :
                  'border-purple-500/20'
                }`}
              >
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      isCritical ? 'bg-rose-950 text-rose-400 border-rose-500/40' :
                      isHigh ? 'bg-amber-950 text-amber-400 border-amber-500/40' :
                      'bg-cyan-950 text-cyan-400 border-cyan-500/40'
                    }`}>
                      PRIORITY: {item.priority}
                    </span>

                    <h3 className="text-base font-extrabold text-white font-mono flex items-center space-x-2">
                      <span>{item.current_algorithm}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-300">{item.recommended_replacement}</span>
                    </h3>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    Role: <span className="text-white font-semibold">{item.usage}</span>
                  </div>
                </div>

                {/* Strategy & Steps */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                  
                  <div className="md:col-span-4 space-y-2">
                    <div className="font-mono font-bold text-slate-400 text-[11px]">RECOMMENDED STRATEGY</div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-cyan-300 font-semibold">
                      {item.strategy}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-2">
                    <div className="font-mono font-bold text-slate-400 text-[11px]">ACTIONABLE MIGRATION STEPS</div>
                    <ul className="space-y-1.5 font-mono text-slate-300">
                      {item.action_steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start space-x-2">
                          <span className="text-cyan-400 font-bold">&bull;</span>
                          <span>{step}</span>
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
