import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { CryptographicAsset } from '../types/scan';

interface RiskChartsProps {
  findings: CryptographicAsset[];
  assetCounts?: Record<string, number>;
}

export const RiskCharts: React.FC<RiskChartsProps> = ({ findings, assetCounts }) => {
  // 1. Quantum Risk Distribution Data
  let vulnerableCount = 0;
  let degradedCount = 0;
  let pqcCount = 0;
  let safeCount = 0;

  findings.forEach((f) => {
    if (f.quantum_risk === 'VULNERABLE') vulnerableCount++;
    else if (f.quantum_risk === 'DEGRADED') degradedCount++;
    else if (f.quantum_risk === 'POST_QUANTUM') pqcCount++;
    else safeCount++;
  });

  const pieData = [
    { name: 'Shor Vulnerable (RSA/ECC)', value: vulnerableCount, color: '#f43f5e' },
    { name: 'Grover Degraded (AES-128)', value: degradedCount, color: '#f59e0b' },
    { name: 'Post-Quantum (ML-KEM/DSA)', value: pqcCount, color: '#06b6d4' },
    { name: 'Quantum Safe Primitives', value: safeCount, color: '#10b981' },
  ].filter(d => d.value > 0);

  // 2. Algorithm Breakdown Data
  const algoMap: Record<string, number> = {};
  findings.forEach((f) => {
    algoMap[f.algorithm] = (algoMap[f.algorithm] || 0) + 1;
  });

  const barData = Object.keys(algoMap).map((algo) => ({
    algorithm: algo,
    count: algoMap[algo],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: Donut Chart - Quantum Risk Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white tracking-wider flex items-center justify-between">
          <span>QUANTUM RISK DISTRIBUTION</span>
          <span className="text-xs text-slate-400 font-normal">Shor vs Grover vs PQC</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
          {pieData.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 truncate">{item.name}: <strong className="text-white">{item.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Bar Chart - Detected Algorithms */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white tracking-wider flex items-center justify-between">
          <span>DETECTED ALGORITHMS INVENTORY</span>
          <span className="text-xs text-slate-400 font-normal">Asset Counts</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="algorithm" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 text-center">
          Total Cryptographic Primitives Audited: <strong className="text-cyan-400">{findings.length}</strong>
        </div>
      </div>

    </div>
  );
};
