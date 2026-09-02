import React, { useState } from 'react';
import { FileCode, AlertTriangle, ShieldCheck, HelpCircle, Code, ChevronRight } from 'lucide-react';
import { CryptographicAsset } from '../types/scan';
import { WhyThreatModal } from './WhyThreatModal';

interface FileCodeViewerProps {
  findings: CryptographicAsset[];
  fileSources?: Record<string, string>;
  selectedFile?: string;
  selectedLine?: number;
}

export const FileCodeViewer: React.FC<FileCodeViewerProps> = ({
  findings,
  fileSources = {},
  selectedFile: initialFile,
  selectedLine: initialLine,
}) => {
  // Extract unique list of files from findings or fileSources
  const filePaths = Array.from(
    new Set([
      ...findings.map((f) => f.file_path),
      ...Object.keys(fileSources),
    ])
  );

  const [activeFile, setActiveFile] = useState<string>(initialFile || filePaths[0] || '');
  const [highlightLine, setHighlightLine] = useState<number | undefined>(initialLine);
  const [selectedAssetForWhy, setSelectedAssetForWhy] = useState<CryptographicAsset | null>(null);

  const currentFileContent = fileSources[activeFile] || '# Source code content loaded for audit.\n';
  const lines = currentFileContent.split('\n');

  // Findings specific to active file
  const fileFindings = findings.filter((f) => f.file_path === activeFile);

  return (
    <div className="space-y-6">
      
      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Scanned Files Sidebar */}
        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl border border-purple-500/30 space-y-3">
          <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>AUDITED FILES ({filePaths.length})</span>
          </h4>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {filePaths.map((fp) => {
              const count = findings.filter((f) => f.file_path === fp).length;
              const isActive = activeFile === fp;

              return (
                <div
                  key={fp}
                  onClick={() => { setActiveFile(fp); setHighlightLine(undefined); }}
                  className={`p-2.5 rounded-xl cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-purple-600/30 text-cyan-300 border border-cyan-400/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Code className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{fp}</span>
                  </div>
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-500/30">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Code Content Viewer + Inline Findings */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Code Viewer Panel */}
          <div className="md:col-span-7 glass-panel rounded-2xl border border-purple-500/30 overflow-hidden flex flex-col h-[520px]">
            
            {/* Header */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-purple-500/20 flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold truncate">{activeFile}</span>
              <span className="text-slate-500 text-[10px]">{lines.length} Lines</span>
            </div>

            {/* Code Lines Container */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed">
              {lines.map((line: string, idx: number) => {
                const lineNo = idx + 1;
                const matchingFinding = fileFindings.find((f) => f.line_number === lineNo);
                const isTargetLine = highlightLine === lineNo || (matchingFinding && !highlightLine);

                return (
                  <div
                    key={idx}
                    id={`line-${lineNo}`}
                    className={`flex items-start space-x-3 px-2 py-0.5 rounded transition-colors ${
                      matchingFinding
                        ? 'bg-rose-950/60 border-l-4 border-rose-500 text-rose-200'
                        : isTargetLine
                        ? 'bg-purple-950/40 border-l-4 border-cyan-400 text-cyan-200'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <span className="w-8 text-right text-slate-600 select-none text-[10px] font-mono flex-shrink-0">
                      {lineNo}
                    </span>

                    <span className="whitespace-pre flex-1 truncate font-mono">
                      {line}
                    </span>

                    {matchingFinding && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500 text-slate-950 flex-shrink-0">
                        {matchingFinding.variant}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Inline Findings Detail Side Drawer */}
          <div className="md:col-span-5 glass-panel p-4 rounded-2xl border border-purple-500/30 flex flex-col h-[520px] overflow-y-auto space-y-4">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              FILE FINDINGS ({fileFindings.length})
            </h4>

            {fileFindings.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                No cryptographic vulnerabilities detected in this file.
              </div>
            ) : (
              <div className="space-y-3">
                {fileFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    onClick={() => setHighlightLine(finding.line_number)}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400/50 cursor-pointer text-xs space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{finding.variant}</span>
                      <span className="text-[10px] text-rose-400 font-bold">Line {finding.line_number || 1}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Usage: <span className="text-cyan-300">{finding.usage.replace('_', ' ')}</span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-snug">
                      {finding.explanation}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-amber-400 font-semibold">{finding.quantum_threat}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAssetForWhy(finding); }}
                        className="text-cyan-300 font-bold underline hover:text-white"
                      >
                        WHY?
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      <WhyThreatModal
        asset={selectedAssetForWhy}
        onClose={() => setSelectedAssetForWhy(null)}
      />

    </div>
  );
};
