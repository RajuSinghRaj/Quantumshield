import React, { useState } from 'react';
import { HelpCircle, FileCode, Search, Shield, Cpu, Lock } from 'lucide-react';
import { CryptographicAsset } from '../types/scan';
import { WhyThreatModal } from './WhyThreatModal';

interface CryptoInventoryCardsProps {
  findings: CryptographicAsset[];
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

const quantumRiskConfig: Record<string, { cls: string; badge: string }> = {
  VULNERABLE:   { cls: 'text-rose-400',    badge: 'badge-critical' },
  DEGRADED:     { cls: 'text-amber-400',   badge: 'badge-high' },
  POST_QUANTUM: { cls: 'text-cyan-400',    badge: 'badge-pqc' },
  SAFE:         { cls: 'text-emerald-400', badge: 'badge-safe' },
};
const classicalRiskCls: Record<string, string> = {
  CRITICAL: 'text-rose-400',
  HIGH:     'text-amber-400',
  MEDIUM:   'text-amber-300',
  LOW:      'text-emerald-400',
  SAFE:     'text-emerald-400',
};
const severityCardBorder: Record<string, string> = {
  CRITICAL: 'border-rose-500/25 bg-rose-500/3',
  HIGH:     'border-amber-500/20 bg-amber-500/3',
  MEDIUM:   'border-indigo-500/15',
  LOW:      'border-emerald-500/15',
  SAFE:     'border-emerald-500/15',
};

export const CryptoInventoryCards: React.FC<CryptoInventoryCardsProps> = ({
  findings, onSelectFileFinding,
}) => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedForWhy, setSelectedForWhy] = useState<CryptographicAsset | null>(null);

  const filtered = findings.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      f.variant.toLowerCase().includes(q)    ||
      f.algorithm.toLowerCase().includes(q)  ||
      f.file_path.toLowerCase().includes(q)  ||
      f.usage.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterCategory === 'SHOR')   return f.quantum_threat.toLowerCase().includes('shor');
    if (filterCategory === 'GROVER') return f.quantum_threat.toLowerCase().includes('grover');
    if (filterCategory === 'PQC')    return f.quantum_risk === 'POST_QUANTUM';
    if (filterCategory === 'BROKEN') return f.classical_risk === 'CRITICAL' || f.classical_risk === 'HIGH';
    return true;
  });

  const filters = [
    { id: 'ALL',    label: `All (${findings.length})` },
    { id: 'SHOR',   label: "Shor Vulnerable" },
    { id: 'GROVER', label: "Grover Degraded" },
    { id: 'PQC',    label: "Post-Quantum" },
    { id: 'BROKEN', label: "Classically Broken" },
  ];

  return (
    <div className="space-y-6">

      {/* Controls bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by algorithm, file, or usage…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="qs-input pl-10 text-[12px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                filterCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'btn-ghost py-1 px-3 text-[11px]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-14 rounded-3xl text-center space-y-3">
          <Shield className="w-12 h-12 mx-auto text-indigo-400 opacity-50" />
          <p className="text-[14px] font-bold text-white">No matching cryptographic assets</p>
          <p className="text-[12px] text-slate-400">Try adjusting your search or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset, idx) => {
            const qCfg = quantumRiskConfig[asset.quantum_risk] || quantumRiskConfig.SAFE;
            const borderCls = severityCardBorder[asset.severity] || 'border-white/6';
            return (
              <div
                key={idx}
                className={`glass-card glass-card-hover p-5 flex flex-col justify-between gap-4 border ${borderCls}`}
              >
                {/* Card header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="badge badge-info text-[9px]">{asset.usage.replace('_', ' ')}</span>
                    <span className={`badge ${asset.severity === 'CRITICAL' ? 'badge-critical' : asset.severity === 'HIGH' ? 'badge-high' : asset.severity === 'MEDIUM' ? 'badge-medium' : 'badge-safe'} text-[9px]`}>
                      {asset.severity}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-black text-white leading-tight">{asset.variant}</h3>
                  {asset.key_size && (
                    <p className="text-[11px] text-slate-400">
                      Key Size: <span className="text-slate-200 font-semibold font-mono">{asset.key_size} bits</span>
                    </p>
                  )}
                </div>

                {/* Risk rows */}
                <div className="space-y-2 pt-3 border-t border-white/5 text-[12px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Classical</span>
                    <span className={`font-bold ${classicalRiskCls[asset.classical_risk] || 'text-slate-300'}`}>
                      {asset.classical_risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Quantum</span>
                    <span className={`font-bold ${qCfg.cls}`}>{asset.quantum_risk}</span>
                  </div>
                  {asset.quantum_threat && asset.quantum_threat !== 'None' && (
                    <div className="text-[10px] text-slate-500 font-mono bg-white/3 rounded-lg px-2.5 py-1.5 border border-white/4">
                      {asset.quantum_threat}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectFileFinding?.(asset.file_path, asset.line_number)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors truncate max-w-[65%]"
                  >
                    <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono">{asset.file_path}:{asset.line_number || 1}</span>
                  </button>
                  <button
                    onClick={() => setSelectedForWhy(asset)}
                    className="btn-ghost py-1 px-2.5 text-[11px] rounded-lg gap-1 shrink-0"
                  >
                    <HelpCircle className="w-3 h-3 text-indigo-400" />
                    <span>Why?</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <WhyThreatModal asset={selectedForWhy} onClose={() => setSelectedForWhy(null)} />
    </div>
  );
};
