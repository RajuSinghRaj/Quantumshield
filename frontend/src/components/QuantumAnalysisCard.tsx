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
    <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center shadow-xs">
            <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black tracking-wider text-stone-900 dark:text-stone-50 uppercase">
                QUANTUM ANALYSIS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 font-bold">
                Qiskit 2.x Engine
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Live Qiskit quantum circuit simulator & threat vector modeling
            </p>
          </div>
        </div>

        <div>{getRiskBadge()}</div>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Detected Algo */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
            Detected Algorithm
          </span>
          <span className="text-base font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            {asset ? asset.variant : simType === 'shor' ? 'RSA-2048' : 'AES-256'}
          </span>
        </div>

        {/* Quantum Threat */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
            Quantum Threat
          </span>
          <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 font-mono">
            {simType === 'shor' ? "Shor's Algorithm" : "Grover's Algorithm"}
          </span>
        </div>

        {/* Qubits & Specs */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
            Circuit Specs
          </span>
          <span className="text-base font-extrabold text-stone-800 dark:text-stone-200 font-mono">
            {simulation ? `${simulation.qubits} Qubits | Depth: ${simulation.circuit_depth}` : simType === 'shor' ? '8 Qubits (Educational)' : '3 Qubits (Search)'}
          </span>
        </div>

        {/* Shots */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
            Shots & Execution
          </span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {simulation ? `${simulation.shots} Aer Shots` : '1024 Aer Shots'}
          </span>
        </div>
      </div>

      {/* Simulation Result Box */}
      {simulation ? (
        <div className="mb-6 p-5 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-orange-200/60 dark:border-orange-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>QISKIT SIMULATION COMPLETE</span>
            </span>
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
              Result: <strong className="text-orange-600 dark:text-orange-400 font-extrabold">{simulation.target_state}</strong>
            </span>
          </div>

          {/* Probability Chart */}
          {chartData.length > 0 && (
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="state" stroke="#78716c" fontSize={11} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#ea580c', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(value: any) => [`${value}% Probability`, 'Measurement']}
                  />
                  <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isTarget ? '#ea580c' : '#f97316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ASCII Circuit Preview Toggle */}
          <details className="text-xs font-mono bg-stone-900 dark:bg-stone-950 p-3.5 rounded-xl border border-stone-800 text-stone-300 overflow-x-auto">
            <summary className="cursor-pointer font-bold text-orange-400 hover:text-orange-300 flex items-center space-x-2">
              <Binary className="w-3.5 h-3.5" />
              <span>View Qiskit Circuit Diagram (ASCII)</span>
            </summary>
            <pre className="mt-3 text-[11px] leading-tight text-emerald-400 whitespace-pre font-mono">
              {simulation.circuit_ascii}
            </pre>
          </details>
        </div>
      ) : (
        <div className="mb-6 p-6 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Ready to execute Quantum Simulation</h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              Run Qiskit circuit simulation for {simType === 'shor' ? "Shor's period finding (N=15)" : "Grover's key search"} on local Aer backend.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-3 rounded-full flex items-center gap-2 shadow-md shadow-orange-600/25 transition-all shrink-0 disabled:opacity-50 hover:scale-[1.02]"
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
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-xs font-mono text-rose-700 dark:text-rose-300">
          [!] {errorMsg}
        </div>
      )}

      {/* Warning & Disclaimers Footer */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200/90">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-amber-900 dark:text-amber-300">Demonstration Only:</strong> Production RSA-2048 and AES-256 are NOT being factored or broken. The Quantum Engine executes an authentic Qiskit simulation on a reduced educational circuit (N=15 for Shor, 3-qubit state space for Grover).
        </div>
      </div>
    </div>
  );
};
