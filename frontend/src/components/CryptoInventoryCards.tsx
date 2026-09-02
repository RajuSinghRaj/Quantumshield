import React, { useState } from 'react';
import { HelpCircle, FileCode, Search } from 'lucide-react';
import { CryptographicAsset } from '../types/scan';
import { WhyThreatModal } from './WhyThreatModal';

interface CryptoInventoryCardsProps {
  findings: CryptographicAsset[];
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const CryptoInventoryCards: React.FC<CryptoInventoryCardsProps> = ({
  findings,
  onSelectFileFinding,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssetForWhy, setSelectedAssetForWhy] = useState<CryptographicAsset | null>(null);

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.file_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.usage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'SHOR') return f.quantum_threat.toLowerCase().includes('shor');
    if (filterCategory === 'GROVER') return f.quantum_threat.toLowerCase().includes('grover');
    if (filterCategory === 'PQC') return f.quantum_risk === 'POST_QUANTUM';
    if (filterCategory === 'BROKEN') return f.classical_risk === 'CRITICAL' || f.classical_risk === 'HIGH';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by algorithm, file, or usage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          {[
            { id: 'ALL', label: `All (${findings.length})` },
            { id: 'SHOR', label: 'Shor Vulnerable' },
            { id: 'GROVER', label: 'Grover Degraded' },
            { id: 'PQC', label: 'Post-Quantum' },
            { id: 'BROKEN', label: 'Classically Broken' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterCategory === cat.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Cards Grid */}
      {filteredFindings.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm">
          No cryptographic assets matching the selected search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFindings.map((asset, idx) => {
            const isPqc = asset.quantum_risk === 'POST_QUANTUM';
            const isShor = asset.quantum_threat.toLowerCase().includes('shor');
            const isGrover = asset.quantum_threat.toLowerCase().includes('grover');

            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4"
              >
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800 uppercase">
                      {asset.usage.replace('_', ' ')}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      asset.severity === 'CRITICAL' ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
                      asset.severity === 'HIGH' ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {asset.severity}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">
                    {asset.variant}
                  </h3>

                  {asset.key_size ? (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Key Size: <span className="text-slate-200 font-medium">{asset.key_size} bits</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Classical Security:</span>
                    <span className={`font-semibold ${
                      asset.classical_risk === 'CRITICAL' ? 'text-rose-400' :
                      asset.classical_risk === 'HIGH' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {asset.classical_risk}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Quantum Threat:</span>
                    <span className={`font-semibold ${
                      asset.quantum_risk === 'VULNERABLE' ? 'text-rose-400' :
                      asset.quantum_risk === 'DEGRADED' ? 'text-amber-400' :
                      asset.quantum_risk === 'POST_QUANTUM' ? 'text-teal-400' :
                      'text-emerald-400'
                    }`}>
                      {asset.quantum_risk}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div 
                    onClick={() => onSelectFileFinding?.(asset.file_path, asset.line_number)}
                    className="flex items-center space-x-1 hover:text-indigo-400 cursor-pointer truncate max-w-[70%]"
                  >
                    <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{asset.file_path}:{asset.line_number || 1}</span>
                  </div>

                  <button
                    onClick={() => setSelectedAssetForWhy(asset)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 text-indigo-300 border border-slate-800 hover:bg-slate-800 transition-colors font-medium text-xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Why?</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <WhyThreatModal
        asset={selectedAssetForWhy}
        onClose={() => setSelectedAssetForWhy(null)}
      />

    </div>
  );
};
