import React, { useState } from 'react';
import {
  Download, Sparkles, Layers, FileCode, CheckCircle2,
  ShieldCheck, AlertTriangle, Shield, BarChart3, ChevronRight,
  Clock, Hash, FileText
} from 'lucide-react';
import { ScanResult } from '../types/scan';
import { ReadinessScoreGauge } from '../components/ReadinessScoreGauge';
import { QuantumAnalysisCard } from '../components/QuantumAnalysisCard';
import { RiskCharts } from '../components/RiskCharts';
import { CryptoInventoryCards } from '../components/CryptoInventoryCards';
import { FileCodeViewer } from '../components/FileCodeViewer';
import { CbomViewer } from '../components/CbomViewer';
import { DependencyMapper } from '../components/DependencyMapper';
import { TlsCertAnalyzer } from '../components/TlsCertAnalyzer';
import { RiskIntelligenceDashboard } from '../components/RiskIntelligenceDashboard';
import { PqcRemediationSandbox } from '../components/PqcRemediationSandbox';
import { DevSecOpsDashboard } from '../components/DevSecOpsDashboard';
import { getPdfReportUrl, getCbomExportUrl } from '../services/api';
import { Boxes, Globe, ShieldAlert, Wrench, Terminal } from 'lucide-react';

interface DashboardPageProps {
  scanResult: ScanResult | null;
  onNewScan: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ scanResult, onNewScan }) => {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'remediation' | 'inventory' | 'cbom' | 'dependencies' | 'tls-cert' | 'devsecops' | 'code' | 'charts'>('intelligence');
  const [selectedFileForViewer, setSelectedFileForViewer] = useState<string | undefined>();

  const handleSelectFileFinding = (filePath: string, _lineNo?: number) => {
    setSelectedFileForViewer(filePath);
    setActiveTab('code');
  };

  // ── Empty state ──
  if (!scanResult) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="glass-card p-12 sm:p-16 rounded-3xl border border-orange-200/80 dark:border-stone-800 space-y-5 bg-white/95 dark:bg-stone-900/95 shadow-xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center">
            <Layers className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight">No scan results to display</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Run a cryptographic audit or select a demo project to view the full security dashboard.
          </p>
          <button onClick={onNewScan} className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-6 py-3.5 rounded-full flex items-center gap-2 mx-auto shadow-lg shadow-orange-600/25 transition-all hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Start New Scan</span>
          </button>
        </div>
      </div>
    );
  }

  const riskIcon = scanResult.scores.overall_risk === 'CRITICAL' || scanResult.scores.overall_risk === 'HIGH'
    ? <AlertTriangle className="w-5 h-5 text-rose-500" />
    : <ShieldCheck className="w-5 h-5 text-emerald-500" />;

  const riskBannerClass = (() => {
    switch (scanResult.scores.overall_risk) {
      case 'CRITICAL': return 'border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/20';
      case 'HIGH':     return 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20';
      case 'MEDIUM':   return 'border-orange-400/30 bg-orange-400/10 dark:bg-orange-950/20';
      default:         return 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20';
    }
  })();

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-10 space-y-8">

      {/* ── Top banner ── */}
      <div className={`glass-panel p-6 sm:p-8 rounded-3xl border ${riskBannerClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            {riskIcon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 font-bold text-[10px] uppercase font-mono tracking-wider">{scanResult.scan_type} AUDIT</span>
              <span className="text-[11px] text-stone-500 font-mono">ID: {scanResult.scan_id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">{scanResult.project_name}</h1>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Audited {new Date(scanResult.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold ${
            scanResult.scores.overall_risk === 'CRITICAL' ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            scanResult.scores.overall_risk === 'HIGH'     ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400' :
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {scanResult.scores.overall_risk} RISK
          </div>

          {/* Export CBOM Button */}
          <a
            href={getCbomExportUrl(scanResult.scan_id)}
            download={`QuantumShield_CBOM_${scanResult.scan_id.slice(0, 8)}.json`}
            className="px-4 py-2.5 rounded-full text-xs font-mono font-semibold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:border-orange-400 transition-all flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Export CBOM (.json)</span>
          </a>

          {/* Download PDF Button */}
          <a
            href={getPdfReportUrl(scanResult.scan_id)}
            target="_blank"
            rel="noreferrer"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4 text-white" />
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
            color: 'text-orange-600 dark:text-orange-400',
            icon: Shield,
          },
          {
            label: 'Quantum Score',
            value: `${Math.round(scanResult.scores.quantum_score)}`,
            sub: '/ 100 readiness',
            color: 'text-amber-600 dark:text-amber-400',
            icon: Sparkles,
          },
          {
            label: 'Classical Score',
            value: `${Math.round(scanResult.scores.classical_score)}`,
            sub: '/ 100 hardening',
            color: 'text-stone-700 dark:text-stone-300',
            icon: CheckCircle2,
          },
          {
            label: 'PQC Adopted',
            value: `${Math.round(scanResult.scores.pqc_score)}%`,
            sub: 'post-quantum ready',
            color: 'text-emerald-600 dark:text-emerald-400',
            icon: ShieldCheck,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className={`text-2xl font-black ${color} font-mono`}>{value}</p>
              <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">{label}</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">{sub}</p>
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
          { id: 'intelligence' as const, label: 'Quantum Risk & HNDL Intelligence', icon: ShieldAlert },
          { id: 'remediation'  as const, label: 'PQC Remediation & Sandbox', icon: Wrench },
          { id: 'devsecops'    as const, label: 'DevSecOps CI/CD Gate', icon: Terminal },
          { id: 'inventory'    as const, label: `Cryptographic Inventory (${scanResult.findings?.length ?? 0})`, icon: Layers },
          { id: 'cbom'         as const, label: 'CBOM Specification (CycloneDX 1.6)', icon: FileText },
          { id: 'dependencies' as const, label: `Dependency Mapper (${scanResult.dependencies?.length ?? 0})`, icon: Boxes },
          { id: 'tls-cert'     as const, label: 'TLS & Certificate Security', icon: Globe },
          { id: 'code'         as const, label: 'File & Source Viewer', icon: FileCode },
          { id: 'charts'       as const, label: 'Risk Charts & Analytics', icon: BarChart3 },
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
      {activeTab === 'intelligence' && (
        <RiskIntelligenceDashboard
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
          riskData={scanResult.risk_analysis}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'remediation' && (
        <PqcRemediationSandbox
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
          findings={scanResult.findings || []}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'devsecops' && (
        <DevSecOpsDashboard
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'inventory' && (
        <CryptoInventoryCards
          findings={scanResult.findings || []}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'cbom' && (
        <CbomViewer
          cbom={scanResult.cbom}
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
        />
      )}
      {activeTab === 'dependencies' && (
        <DependencyMapper
          dependencies={scanResult.dependencies || []}
          dependencyGraph={scanResult.dependency_graph}
          migrationImpact={scanResult.migration_impact || []}
          summary={scanResult.dependency_summary}
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
          onSelectFileFinding={handleSelectFileFinding}
        />
      )}
      {activeTab === 'tls-cert' && (
        <TlsCertAnalyzer
          tlsData={scanResult.tls_data}
          certificates={scanResult.certificate_data || []}
          scanId={scanResult.scan_id}
          projectName={scanResult.project_name}
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
