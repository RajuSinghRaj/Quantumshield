import React, { useState } from 'react';
import { Cpu, Play, AlertTriangle, CheckCircle2, ShieldAlert, BarChart3, Binary, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CryptographicAsset, QuantumSimulationResult } from '../types/scan';
import { runShorSimulation, runGroverSimulation } from '../services/api';

interface QuantumAnalysisCardProps {
  asset?: CryptographicAsset;
  onOpenQuantumLab?: (algo: string, type: 'shor' | 'grover') => void;
}

export const QuantumAnalysisCard: React.FC<QuantumAnalysisCardProps> = ({
  asset,
  onOpenQuantumLab,
}) => {
  const [simulation, setSimulation] = useState<QuantumSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isShorTarget = asset
    ? ['RSA', 'ECC', 'ECDSA', 'ECDH', 'DH', 'DSA'].includes(asset.algorithm.toUpperCase())
    : true;
  
  const simType: 'shor' | 'grover' = asset?.simulation_type === 'grover' ? 'grover' : isShorTarget ? 'shor' : 'grover';

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      if (simType === 'shor') {
        const res = await runShorSimulation(15, 7, 1024);
        setSimulation(res);
      } else {
        const res = await runGroverSimulation('101', 1024);
        setSimulation(res);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Convert measurement counts or probabilities to Recharts format
  const chartData = React.useMemo(() => {
    if (!simulation?.probabilities) return [];
    return Object.entries(simulation.probabilities).map(([state, prob]) => ({
      state: `|${state}⟩`,
      prob: Math.round((prob as number) * 100),
      rawProb: prob,
      isTarget: simType === 'grover' ? state === '101' : ['0100', '1100', '1000'].includes(state),
    }));
  }, [simulation, simType]);

  const getRiskBadge = () => {
    const risk = asset?.quantum_risk || (simType === 'shor' ? 'VULNERABLE' : 'DEGRADED');
    switch (risk) {
      case 'VULNERABLE':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">VULNERABLE (HIGH RISK)</span>;
      case 'DEGRADED':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">DEGRADED (MODERATE IMPACT)</span>;
      case 'POST_QUANTUM':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">QUANTUM RESISTANT</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">SAFE (MARGIN RETAINED)</span>;
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-purple-400 p-0.5 shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black tracking-wider text-slate-100 uppercase">
                QUANTUM ANALYSIS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
                Qiskit 2.x Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Qiskit quantum circuit simulator & threat vector modeling
            </p>
          </div>
        </div>

        <div>{getRiskBadge()}</div>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Detected Algo */}
        <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Detected Algorithm
          </span>
          <span className="text-base font-extrabold text-purple-300">
            {asset ? asset.variant : simType === 'shor' ? 'RSA-2048' : 'AES-256'}
          </span>
        </div>

        {/* Quantum Threat */}
        <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Quantum Threat
          </span>
          <span className="text-base font-extrabold text-amber-300">
            {simType === 'shor' ? "Shor's Algorithm" : "Grover's Algorithm"}
          </span>
        </div>

        {/* Qubits & Specs */}
        <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Circuit Specs
          </span>
          <span className="text-base font-extrabold text-indigo-300">
            {simulation ? `${simulation.qubits} Qubits | Depth: ${simulation.circuit_depth}` : simType === 'shor' ? '8 Qubits (Educational)' : '3 Qubits (Search)'}
          </span>
        </div>

        {/* Shots */}
        <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Shots & Execution
          </span>
          <span className="text-base font-extrabold text-emerald-300">
            {simulation ? `${simulation.shots} Aer Shots` : '1024 Aer Shots'}
          </span>
        </div>
      </div>

      {/* Simulation Result Box */}
      {simulation ? (
        <div className="mb-6 p-5 rounded-2xl glass-inset border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>QISKIT SIMULATION COMPLETE</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Result: <strong className="text-purple-300 font-extrabold">{simulation.target_state}</strong>
            </span>
          </div>

          {/* Probability Chart */}
          {chartData.length > 0 && (
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="state" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#8b5cf6', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}% Probability`, 'Measurement']}
                  />
                  <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isTarget ? '#a855f7' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ASCII Circuit Preview Toggle */}
          <details className="text-xs font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
            <summary className="cursor-pointer font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-2">
              <Binary className="w-3.5 h-3.5" />
              <span>View Qiskit Circuit Diagram (ASCII)</span>
            </summary>
            <pre className="mt-3 text-[11px] leading-tight text-emerald-400 whitespace-pre font-mono">
              {simulation.circuit_ascii}
            </pre>
          </details>
        </div>
      ) : (
        <div className="mb-6 p-6 rounded-2xl glass-card-indigo flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Ready to execute Quantum Simulation</h4>
            <p className="text-xs text-slate-400 mt-1">
              Run Qiskit circuit simulation for {simType === 'shor' ? "Shor's period finding (N=15)" : "Grover's key search"} on local Aer backend.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Simulating Qubits...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Quantum Simulation</span>
              </>
            )}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs font-mono text-rose-300">
          [!] {errorMsg}
        </div>
      )}

      {/* Warning & Disclaimers Footer */}
      <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-start space-x-3 text-xs text-amber-200/90">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-amber-300">Demonstration Only:</strong> Production RSA-2048 and AES-256 are NOT being factored or broken. The Quantum Engine executes an authentic Qiskit simulation on a reduced educational circuit (N=15 for Shor, 3-qubit state space for Grover).
        </div>
      </div>
    </div>
  );
};
