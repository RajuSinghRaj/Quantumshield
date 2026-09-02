import React, { useState } from 'react';
import { Download, Sparkles, Layers, FileCode, CheckCircle2 } from 'lucide-react';
import { ScanResult } from '../types/scan';
import { ReadinessScoreGauge } from '../components/ReadinessScoreGauge';
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

  if (!scanResult) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-6">
        <div className="glass-panel p-12 rounded-2xl border border-purple-500/30">
          <Layers className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-mono text-white">NO RECENT SCAN RESULTS TO DISPLAY</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
            Please run a new cryptographic audit or select a demo project to view the results dashboard.
          </p>
          <button
            onClick={onNewScan}
            className="mt-6 px-6 py-3 rounded-xl font-bold text-xs tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-purple-400 hover:from-cyan-300 hover:to-purple-300 shadow-lg"
          >
            START NEW SCAN NOW
          </button>
        </div>
      </div>
    );
  }

  const handleSelectFileFinding = (filePath: string, lineNo?: number) => {
    setSelectedFileForViewer(filePath);
    setActiveTab('code');
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
              {scanResult.scan_type} AUDIT
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {scanResult.scan_id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 tracking-tight">
            {scanResult.project_name}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Audit Date: {new Date(scanResult.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={getPdfReportUrl(scanResult.scan_id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 hover:from-cyan-300 hover:to-purple-300 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF REPORT</span>
          </a>
        </div>
      </div>

      {/* 1. Readiness Score Gauge Component */}
      <ReadinessScoreGauge
        scores={scanResult.scores}
        breakdown={scanResult.breakdown}
      />

      {/* Dashboard Section Tabs Header */}
      <div className="flex border-b border-purple-500/20 bg-slate-950/60 rounded-xl overflow-hidden glass-panel p-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold tracking-wider rounded-lg transition-all ${
            activeTab === 'inventory'
              ? 'bg-purple-600/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          CRYPTOGRAPHIC INVENTORY ({scanResult.findings?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold tracking-wider rounded-lg transition-all ${
            activeTab === 'code'
              ? 'bg-purple-600/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          FILE & SOURCE VIEWER
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold tracking-wider rounded-lg transition-all ${
            activeTab === 'charts'
              ? 'bg-purple-600/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          RISK CHARTS & VISUALIZATIONS
        </button>
      </div>

      {/* Tab Contents */}
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
