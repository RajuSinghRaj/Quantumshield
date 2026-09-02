import React from 'react';
import { History, Eye, Trash2, ShieldAlert, Cpu, Download } from 'lucide-react';
import { ScanHistoryItem } from '../types/scan';
import { getPdfReportUrl } from '../services/api';

interface ScanHistoryTableProps {
  history: ScanHistoryItem[];
  onSelectScan: (scanId: string) => void;
  onDeleteScan: (scanId: string) => void;
}

export const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({
  history,
  onSelectScan,
  onDeleteScan,
}) => {
  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto py-6 px-4 sm:px-8 lg:px-12 xl:px-16">
      
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl border border-purple-500/30">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-500/40 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>AUDIT DATABASE HISTORY</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide font-mono">
            RECENT CRYPTOGRAPHIC AUDITS
          </h2>
        </div>
        <div className="text-xs font-mono text-cyan-400 font-bold">
          TOTAL SCANS STORED: {history.length}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm">
          No audit history stored in database. Perform a scan to create an audit record.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/80 text-cyan-400 border-b border-purple-500/20 uppercase tracking-wider">
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Scan Type</th>
                  <th className="p-4">Scan Date</th>
                  <th className="p-4">Quantum Score</th>
                  <th className="p-4">Overall Risk</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-950/20 transition-colors">
                    
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>{item.project_name}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-500/30 uppercase text-[10px]">
                        {item.scan_type}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 font-bold text-sm text-cyan-300">
                      {item.quantum_score} / 100
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.overall_risk === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border-rose-500/40' :
                        item.overall_risk === 'HIGH' ? 'bg-amber-950 text-amber-400 border-amber-500/40' :
                        'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {item.overall_risk}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectScan(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>VIEW</span>
                      </button>

                      <a
                        href={getPdfReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60 transition-colors inline-flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>

                      <button
                        onClick={() => onDeleteScan(item.id)}
                        className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-500/40 hover:bg-rose-900/60 transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
