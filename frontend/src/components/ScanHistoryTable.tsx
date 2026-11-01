import React from 'react';
import { History, Eye, Trash2, Cpu, Download, Shield, Clock } from 'lucide-react';
import { ScanHistoryItem } from '../types/scan';
import { getPdfReportUrl } from '../services/api';

interface ScanHistoryTableProps {
  history: ScanHistoryItem[];
  onSelectScan: (scanId: string) => void;
  onDeleteScan: (scanId: string) => void;
}

const riskBadge = (risk: string) => {
  switch (risk) {
    case 'CRITICAL': return 'badge badge-critical';
    case 'HIGH':     return 'badge badge-high';
    case 'MEDIUM':   return 'badge badge-medium';
    default:         return 'badge badge-safe';
  }
};

export const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({
  history, onSelectScan, onDeleteScan,
}) => {
  return (
    <div className="space-y-7 w-full max-w-[1800px] mx-auto py-8 px-4 sm:px-8 lg:px-12 xl:px-16">

      {/* Header */}
      <div className="p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <History className="w-3 h-3 text-orange-500" /> AUDIT DATABASE
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight">Recent Cryptographic Audits</h1>
          <p className="text-[12px] text-stone-600 dark:text-stone-400">Select a previous scan to view its full security report.</p>
        </div>
        <div className="text-[13px] font-mono font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/40 px-4 py-2 rounded-2xl">
          {history.length} scan{history.length !== 1 ? 's' : ''} stored
        </div>
      </div>

      {/* Table or empty state */}
      {history.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center">
            <History className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">No Audit History</h3>
          <p className="text-[13px] text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            No audit records found. Perform a cryptographic scan to create the first entry.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500">Project Name</th>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500">Scan Type</th>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500">Date</th>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500">Q-Score</th>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500">Risk</th>
                  <th className="p-4 font-mono font-bold uppercase text-[10px] text-stone-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {history.map(item => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-orange-50/40 dark:hover:bg-stone-800/40 transition-colors"
                    onClick={() => onSelectScan(item.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="font-bold text-stone-900 dark:text-stone-50 text-[13px]">{item.project_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[10px] font-bold uppercase">{item.scan_type}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[11px] font-mono">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[15px] font-black text-orange-600 dark:text-orange-400 font-mono">
                        {item.quantum_score}
                        <span className="text-[11px] text-stone-400 font-normal">/100</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        item.overall_risk === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300' :
                        item.overall_risk === 'HIGH'     ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300' :
                        'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {item.overall_risk}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectScan(item.id)}
                          className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors flex items-center gap-1"
                          title="View Report"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-500" />
                          <span>View</span>
                        </button>
                        <a
                          href={getPdfReportUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1"
                          title="Download PDF"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                        <button
                          onClick={() => onDeleteScan(item.id)}
                          className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
