import React, { useState } from 'react';
import { HelpCircle, FileCode, Search, Shield, Cpu, Lock, Terminal, Layers } from 'lucide-react';
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
      (f.curve_or_parameters && f.curve_or_parameters.toLowerCase().includes(q)) ||
      (f.library_or_api && f.library_or_api.toLowerCase().includes(q)) ||
      f.usage.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterCategory === 'SHOR')   return f.quantum_threat.toLowerCase().includes('shor');
    if (filterCategory === 'GROVER') return f.quantum_threat.toLowerCase().includes('grover');
    if (filterCategory === 'PQC')    return f.quantum_risk === 'POST_QUANTUM';
    if (filterCategory === 'BROKEN') return f.classical_risk === 'CRITICAL' || f.classical_risk === 'HIGH';
    if (filterCategory === 'SYMMETRIC') return ['AES', 'CHACHA20', '3DES', 'DES'].includes(f.algorithm.toUpperCase());
    return true;
  });

  const filters = [
    { id: 'ALL',       label: `All (${findings.length})` },
    { id: 'SHOR',      label: "Shor Vulnerable" },
    { id: 'GROVER',    label: "Grover Degraded" },
    { id: 'PQC',       label: "Post-Quantum" },
    { id: 'SYMMETRIC', label: "Symmetric Ciphers" },
    { id: 'BROKEN',    label: "Classically Broken" },
  ];

  return (
    <div className="space-y-6">

      {/* Controls bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by algorithm, parameter, file, or usage…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-[12px] focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                filterCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-14 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-3 shadow-sm">
          <Shield className="w-12 h-12 mx-auto text-orange-500/50" />
          <p className="text-[14px] font-bold text-stone-900 dark:text-stone-100">No matching cryptographic assets</p>
          <p className="text-[12px] text-stone-500 dark:text-stone-400">Try adjusting your search or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset, idx) => {
            const qCfg = quantumRiskConfig[asset.quantum_risk] || quantumRiskConfig.SAFE;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Card header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 text-[10px] font-bold uppercase tracking-wider">{asset.usage.replace('_', ' ')}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      asset.severity === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                      asset.severity === 'HIGH'     ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                      asset.severity === 'MEDIUM'   ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800' :
                      'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {asset.severity}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-black text-stone-900 dark:text-stone-50 leading-tight font-mono">{asset.variant}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-mono flex-wrap">
                    {asset.key_size && (
                      <span>Key: <strong className="text-stone-800 dark:text-stone-200">{asset.key_size} bits</strong></span>
                    )}
                    {asset.curve_or_parameters && asset.curve_or_parameters !== String(asset.key_size) && (
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">({asset.curve_or_parameters})</span>
                    )}
                  </div>
                </div>

                {/* Risk rows */}
                <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-[12px]">
                  <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-stone-400" /> Classical Risk</span>
                    <span className={`font-bold ${classicalRiskCls[asset.classical_risk] || 'text-stone-700 dark:text-stone-300'}`}>
                      {asset.classical_risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-orange-500" /> Quantum Risk</span>
                    <span className={`font-bold ${qCfg.cls}`}>{asset.quantum_risk}</span>
                  </div>
                  {asset.quantum_threat && asset.quantum_threat !== 'None' && (
                    <div className="text-[10px] text-stone-600 dark:text-stone-400 font-mono bg-stone-50 dark:bg-stone-950 rounded-xl px-2.5 py-1.5 border border-stone-200/80 dark:border-stone-800">
                      {asset.quantum_threat}
                    </div>
                  )}
                  {asset.library_or_api && (
                    <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      <span>API/Library:</span>
                      <span className="text-stone-700 dark:text-stone-300 truncate max-w-[170px]">{asset.library_or_api}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectFileFinding?.(asset.file_path, asset.line_number)}
                    className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate max-w-[65%]"
                  >
                    <FileCode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate font-mono">{asset.file_path}:{asset.line_number || 1}</span>
                  </button>
                  <button
                    onClick={() => setSelectedForWhy(asset)}
                    className="px-3 py-1 text-[11px] font-bold rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <HelpCircle className="w-3 h-3 text-orange-500" />
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
