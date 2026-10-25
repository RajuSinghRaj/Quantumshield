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
      <div className="glass-panel p-7 rounded-3xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-info flex items-center gap-1.5">
              <History className="w-3 h-3" /> AUDIT DATABASE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recent Cryptographic Audits</h1>
          <p className="text-[12px] text-slate-400">Select a previous scan to view its full security report.</p>
        </div>
        <div className="text-[13px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
          {history.length} scan{history.length !== 1 ? 's' : ''} stored
        </div>
      </div>

      {/* Table or empty state */}
      {history.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <History className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">No Audit History</h3>
          <p className="text-[13px] text-slate-400 max-w-md mx-auto">
            No audit records found. Perform a cryptographic scan to create the first entry.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/6 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="qs-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Scan Type</th>
                  <th>Date</th>
                  <th>Q-Score</th>
                  <th>Risk</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => onSelectScan(item.id)}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="font-bold text-white text-[13px]">{item.project_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info text-[9px]">{item.scan_type}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px]">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[15px] font-black text-indigo-300 font-mono">
                        {item.quantum_score}
                        <span className="text-[11px] text-slate-500 font-normal">/100</span>
                      </span>
                    </td>
                    <td>
                      <span className={riskBadge(item.overall_risk)}>{item.overall_risk}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectScan(item.id)}
                          className="btn-secondary text-[11px] py-1.5 px-3 rounded-lg gap-1"
                          title="View Report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={getPdfReportUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-[11px] py-1.5 px-3 rounded-lg gap-1"
                          title="Download PDF"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                        <button
                          onClick={() => onDeleteScan(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500/8 border border-rose-500/20 text-rose-400 hover:bg-rose-500/14 transition-colors"
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
