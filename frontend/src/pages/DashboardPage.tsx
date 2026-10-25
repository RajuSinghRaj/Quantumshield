import React, { useState } from 'react';
import {
  Download, Sparkles, Layers, FileCode, CheckCircle2,
  ShieldCheck, AlertTriangle, Shield, BarChart3, ChevronRight,
  Clock, Hash,
} from 'lucide-react';
import { ScanResult } from '../types/scan';
import { ReadinessScoreGauge } from '../components/ReadinessScoreGauge';
import { QuantumAnalysisCard } from '../components/QuantumAnalysisCard';
import { RiskCharts } from '../components/RiskCharts';
import { CryptoInventoryCards } from '../components/CryptoInventoryCards';
import { FileCodeViewer } from '../components/FileCodeViewer';
import { getPdfReportUrl } from '../services/api';

interface DashboardPageProps {
  scanResult: ScanResult | null;
  onNewScan: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ scanResult, onNewScan }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'code' | 'charts'>('inventory');
  const [selectedFileForViewer, setSelectedFileForViewer] = useState<string | undefined>();

  const handleSelectFileFinding = (filePath: string, _lineNo?: number) => {
    setSelectedFileForViewer(filePath);
    setActiveTab('code');
  };

  // ── Empty state ──
  if (!scanResult) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="glass-card p-16 rounded-3xl border border-indigo-500/20 space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
            <Layers className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">No scan results to display</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Run a cryptographic audit or select a demo project to view the full security dashboard.
          </p>
          <button onClick={onNewScan} className="btn-primary mx-auto">
            <Sparkles className="w-4 h-4" />
            <span>Start New Scan</span>
          </button>
        </div>
      </div>
    );
  }

  const riskIcon = scanResult.scores.overall_risk === 'CRITICAL' || scanResult.scores.overall_risk === 'HIGH'
    ? <AlertTriangle className="w-5 h-5 text-rose-400" />
    : <ShieldCheck className="w-5 h-5 text-emerald-400" />;

  const riskBannerClass = (() => {
    switch (scanResult.scores.overall_risk) {
      case 'CRITICAL': return 'border-rose-500/30 bg-rose-500/6';
      case 'HIGH':     return 'border-amber-500/30 bg-amber-500/6';
      case 'MEDIUM':   return 'border-amber-400/20 bg-amber-400/4';
      default:         return 'border-emerald-500/25 bg-emerald-500/5';
    }
  })();

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-10 space-y-8">

      {/* ── Top banner ── */}
      <div className={`glass-panel p-6 rounded-3xl border ${riskBannerClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
            {riskIcon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-info text-[10px]">{scanResult.scan_type} AUDIT</span>
              <span className="text-[10px] text-slate-500 font-mono">ID: {scanResult.scan_id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{scanResult.project_name}</h1>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Audited {new Date(scanResult.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold ${
            scanResult.scores.overall_risk === 'CRITICAL' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' :
            scanResult.scores.overall_risk === 'HIGH'     ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
            'border-emerald-500/30 bg-emerald-500/8 text-emerald-300'
          }`}>
            {scanResult.scores.overall_risk} RISK
          </div>
          <a
            href={getPdfReportUrl(scanResult.scan_id)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-[12px] px-5 py-2.5 rounded-xl"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* ── Quick stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Findings',
            value: scanResult.findings?.length ?? 0,
            sub: 'cryptographic assets',
            color: 'text-indigo-300',
            icon: Shield,
          },
          {
            label: 'Quantum Score',
            value: `${Math.round(scanResult.scores.quantum_score)}`,
            sub: '/ 100 readiness',
            color: 'text-violet-300',
            icon: Sparkles,
          },
          {
            label: 'Classical Score',
            value: `${Math.round(scanResult.scores.classical_score)}`,
            sub: '/ 100 hardening',
            color: 'text-cyan-300',
            icon: CheckCircle2,
          },
          {
            label: 'PQC Adopted',
            value: `${Math.round(scanResult.scores.pqc_score)}%`,
            sub: 'post-quantum ready',
            color: 'text-emerald-300',
            icon: ShieldCheck,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <Icon className={`w-8 h-8 ${color} shrink-0 opacity-70`} />
            <div>
              <p className={`text-2xl font-black ${color} font-mono`}>{value}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{label}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Readiness Score Gauge ── */}
      <ReadinessScoreGauge scores={scanResult.scores} breakdown={scanResult.breakdown} />

      {/* ── Quantum Analysis ── */}
      <QuantumAnalysisCard asset={scanResult.findings?.[0]} />

      {/* ── Tab strip ── */}
      <div className="qs-tab-bar">
        {[
          { id: 'inventory' as const, label: `Cryptographic Inventory (${scanResult.findings?.length ?? 0})`, icon: Layers },
          { id: 'code'      as const, label: 'File & Source Viewer', icon: FileCode },
          { id: 'charts'    as const, label: 'Risk Charts & Analytics', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`qs-tab flex items-center gap-2 ${activeTab === id ? 'active' : ''}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab contents ── */}
      {activeTab === 'inventory' && (
        <CryptoInventoryCards
          findings={scanResult.findings || []}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'code' && (
        <FileCodeViewer
          findings={scanResult.findings || []}
          fileSources={scanResult.file_sources}
          selectedFile={selectedFileForViewer}
        />
      )}
      {activeTab === 'charts' && (
        <RiskCharts
          findings={scanResult.findings || []}
          assetCounts={scanResult.asset_counts}
        />
      )}

    </div>
  );
};
