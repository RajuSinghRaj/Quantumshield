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
      <div className="w-full max-w-3xl mx-auto py-20 px-4 text-center space-y-6 text-white">
        <div className="tidewell-glass-card p-12 sm:p-16 rounded-3xl border border-white/[0.12] space-y-5 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
            <Layers className="w-10 h-10 text-[#f04438]" />
          </div>
          <h2 className="text-2xl font-medium text-white tracking-tight">No scan results to display</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed font-light">
            Run a cryptographic audit or select a demo project to view the full security dashboard.
          </p>
          <button onClick={onNewScan} className="tidewell-coral-pill text-white text-xs font-medium px-6 py-3.5 rounded-full flex items-center gap-2 mx-auto cursor-pointer">
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
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-10 space-y-8 text-white">

      {/* ── Top banner ── */}
      <div className={`tidewell-glass-card p-6 sm:p-8 rounded-3xl border border-white/[0.12] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center shrink-0">
            {riskIcon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/80 font-bold text-[10px] uppercase font-mono tracking-wider">{scanResult.scan_type} AUDIT</span>
              <span className="text-[11px] text-white/40 font-mono">ID: {scanResult.scan_id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">{scanResult.project_name}</h1>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#f04438]" />
              <span>Audited {new Date(scanResult.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold ${
            scanResult.scores.overall_risk === 'CRITICAL' ? 'border-rose-500/40 bg-rose-500/20 text-rose-300' :
            scanResult.scores.overall_risk === 'HIGH'     ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' :
            'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
          }`}>
            {scanResult.scores.overall_risk} RISK
          </div>

          {/* Export CBOM Button */}
          <a
            href={getCbomExportUrl(scanResult.scan_id)}
            download={`QuantumShield_CBOM_${scanResult.scan_id.slice(0, 8)}.json`}
            className="px-4 py-2.5 rounded-full text-xs font-mono font-medium border border-white/[0.12] bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#f04438]" />
            <span>Export CBOM (.json)</span>
          </a>

          {/* Download PDF Button */}
          <a
            href={getPdfReportUrl(scanResult.scan_id)}
            target="_blank"
            rel="noreferrer"
            className="tidewell-coral-pill text-white text-xs font-medium px-5 py-2.5 rounded-full flex items-center gap-2"
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
            color: 'text-rose-400',
            icon: Shield,
          },
          {
            label: 'Quantum Score',
            value: `${Math.round(scanResult.scores.quantum_score)}`,
            sub: '/ 100 readiness',
            color: 'text-amber-400',
            icon: Sparkles,
          },
          {
            label: 'Classical Score',
            value: `${Math.round(scanResult.scores.classical_score)}`,
            sub: '/ 100 hardening',
            color: 'text-white/80',
            icon: CheckCircle2,
          },
          {
            label: 'PQC Adopted',
            value: `${Math.round(scanResult.scores.pqc_score)}%`,
            sub: 'post-quantum ready',
            color: 'text-emerald-400',
            icon: ShieldCheck,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="p-5 rounded-3xl tidewell-glass-subcard border border-white/[0.08] shadow-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-[#f04438]" />
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
              <div className="text-xs text-white/50">{label} <span className="text-[10px] opacity-70">({sub})</span></div>
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
