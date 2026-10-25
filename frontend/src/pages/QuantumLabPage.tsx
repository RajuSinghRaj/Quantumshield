import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Atom,
  Play,
  Cpu,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers,
  Binary,
  CheckCircle2,
  BarChart3,
  HelpCircle,
  RefreshCw,
  Radio,
  Eye,
  Share2,
  ExternalLink,
  Lock,
  Unlock,
  Sliders,
  Info,
  Maximize2,
  Minimize2,
  Pause,
  Volume2,
  VolumeX,
  Table,
  List
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { runBBM92Simulation, runShorSimulation, runGroverSimulation } from '../services/api';
import { BBM92SimulationResult, QuantumSimulationResult } from '../types/scan';

interface QuantumLabPageProps {
  initialAlgorithm?: string;
}

export const QuantumLabPage: React.FC<QuantumLabPageProps> = () => {
  // Active Navigation Tab: 'bbm92' | 'shor' | 'grover'
  const [activeTab, setActiveTab] = useState<'bbm92' | 'shor' | 'grover'>('bbm92');

  // ==================== BBM92 PARAMETERS & STATE ====================
  const [bbmPairs, setBbmPairs] = useState<number>(50);
  const [bbmScenario, setBbmScenario] = useState<'ideal' | 'eve' | 'noisy'>('ideal');
  const [bbmNoiseRate, setBbmNoiseRate] = useState<number>(0.08);
  const [bbmEveIntercept, setBbmEveIntercept] = useState<number>(1.0);
  const [bbmTestFraction, setBbmTestFraction] = useState<number>(0.35);
  const [showAdvancedParams, setShowAdvancedParams] = useState<boolean>(false);

  const [bbmResult, setBbmResult] = useState<BBM92SimulationResult | null>(null);
  const [isBbmLoading, setIsBbmLoading] = useState<boolean>(false);
  const [bbmError, setBbmError] = useState<string | null>(null);

  // ==================== NEW UI STATE ====================
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [particleKey, setParticleKey] = useState<number>(0); // re-trigger animations
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ==================== SHOR & GROVER STATE ====================
  const [shorN] = useState<number>(15);
  const [shorA, setShorA] = useState<number>(7);
  const [groverTarget, setGroverTarget] = useState<string>('101');
  const [shots] = useState<number>(1024);

  const [shorResult, setShorResult] = useState<QuantumSimulationResult | null>(null);
  const [groverResult, setGroverResult] = useState<QuantumSimulationResult | null>(null);
  const [isAlgoLoading, setIsAlgoLoading] = useState<boolean>(false);
  const [algoError, setAlgoError] = useState<string | null>(null);

  // Initial execution on mount
  useEffect(() => {
    handleRunBbm92();
  }, []);

  // ==================== SOUND EFFECT HELPER ====================
  const playTone = useCallback((freq: number, dur: number = 0.08, type: OscillatorType = 'sine') => {
    if (!isSoundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (_) {}
  }, [isSoundOn]);

  // Execute BBM92 Simulation
  const handleRunBbm92 = async () => {
    if (isPaused) return;
    setIsBbmLoading(true);
    setBbmError(null);
    setParticleKey(k => k + 1); // restart particle animations
    playTone(440, 0.1);
    try {
      const res = await runBBM92Simulation(
        bbmPairs,
        bbmScenario,
        bbmNoiseRate,
        bbmEveIntercept,
        bbmTestFraction
      );
      setBbmResult(res);
      // Play a completion tone
      if (res.status === 'COMPLETED_SECURE') playTone(660, 0.15);
      else if (res.status === 'COMPLETED_ABORTED') playTone(220, 0.2, 'sawtooth');
    } catch (err: any) {
      setBbmError(err.response?.data?.detail || 'BBM92 quantum simulation failed. Check backend connectivity.');
    } finally {
      setIsBbmLoading(false);
    }
  };

  // Reset BBM92 to defaults and re-run
  const handleResetBbm92 = () => {
    setBbmPairs(50);
    setBbmScenario('ideal');
    setBbmNoiseRate(0.08);
    setBbmEveIntercept(1.0);
    setBbmTestFraction(0.35);
    setTimeout(() => {
      handleRunBbm92();
    }, 50);
  };

  // Execute Shor Simulation
  const handleRunShor = async () => {
    setIsAlgoLoading(true);
    setAlgoError(null);
    try {
      const res = await runShorSimulation(shorN, shorA, shots);
      setShorResult(res);
    } catch (err: any) {
      setAlgoError(err.response?.data?.detail || 'Shor simulation failed.');
    } finally {
      setIsAlgoLoading(false);
    }
  };

  // Execute Grover Simulation
  const handleRunGrover = async () => {
    setIsAlgoLoading(true);
    setAlgoError(null);
    try {
      const res = await runGroverSimulation(groverTarget, shots);
      setGroverResult(res);
    } catch (err: any) {
      setAlgoError(err.response?.data?.detail || 'Grover simulation failed.');
    } finally {
      setIsAlgoLoading(false);
    }
  };

  // Recharts Data for BBM92 Measurement Histogram
  const bbmHistogramData = React.useMemo(() => {
    if (!bbmResult?.measurement_counts?.matched_outcomes) return [];
    const outcomes = bbmResult.measurement_counts.matched_outcomes;
    const totalMatched = bbmResult.matched_bases_count || 1;

    return [
      {
        state: '|00⟩',
        description: 'Alice 0, Bob 0 (Correlated)',
        count: outcomes['00'] || 0,
        percentage: Math.round(((outcomes['00'] || 0) / totalMatched) * 100),
        isError: false,
      },
      {
        state: '|11⟩',
        description: 'Alice 1, Bob 1 (Correlated)',
        count: outcomes['11'] || 0,
        percentage: Math.round(((outcomes['11'] || 0) / totalMatched) * 100),
        isError: false,
      },
      {
        state: '|01⟩',
        description: 'Alice 0, Bob 1 (Mismatch Error)',
        count: outcomes['01'] || 0,
        percentage: Math.round(((outcomes['01'] || 0) / totalMatched) * 100),
        isError: true,
      },
      {
        state: '|10⟩',
        description: 'Alice 1, Bob 0 (Mismatch Error)',
        count: outcomes['10'] || 0,
        percentage: Math.round(((outcomes['10'] || 0) / totalMatched) * 100),
        isError: true,
      },
    ];
  }, [bbmResult]);

  // Recharts Data for Basis Breakdown
  const bbmBasisData = React.useMemo(() => {
    if (!bbmResult?.basis_statistics?.basis_breakdown) return [];
    const b = bbmResult.basis_statistics.basis_breakdown;
    return [
      { name: 'ZZ (Matched)', count: b['ZZ'] || 0, matched: true },
      { name: 'XX (Matched)', count: b['XX'] || 0, matched: true },
      { name: 'ZX (Discarded)', count: b['ZX'] || 0, matched: false },
      { name: 'XZ (Discarded)', count: b['XZ'] || 0, matched: false },
    ];
  }, [bbmResult]);

  // Recharts Data for Shor / Grover
  const algoChartData = React.useMemo(() => {
    const activeResult = activeTab === 'shor' ? shorResult : groverResult;
    if (!activeResult?.probabilities) return [];
    return Object.entries(activeResult.probabilities).map(([state, prob]) => ({
      state: `|${state}⟩`,
      prob: Math.round((prob as number) * 100),
      rawProb: prob,
      isTarget: activeTab === 'grover' ? state === groverTarget : ['0100', '1100', '1000'].includes(state),
    }));
  }, [activeTab, shorResult, groverResult, groverTarget]);

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">

      {/* TOP HEADER & LAB NAVIGATION */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
              <Atom className="w-4 h-4 text-purple-400 animate-spin" />
              <span>QUANTUM CRYPTOGRAPHY & COMPUTING LAB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {activeTab === 'bbm92' && 'BBM92 Quantum Key Distribution Lab'}
              {activeTab === 'shor' && "Shor's Factoring Algorithm Lab"}
              {activeTab === 'grover' && "Grover's Quadratic Search Lab"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeTab === 'bbm92' && (
                <>
                  Entanglement-based quantum key establishment (Bennett-Brassard-Mermin 1992) using Bell pairs (|Φ⁺⟩).
                  Simulates EPR photon distribution, random basis sifting, test-sample parameter estimation, and Eve intercept-resend perturbation on Qiskit Aer.
                </>
              )}
              {activeTab === 'shor' && (
                <>
                  Polynomial-time quantum order finding and prime factorization ($N=15 \to 3 \times 5$) on an 8-qubit QPE circuit, modeling the quantum threat to RSA and ECC.
                </>
              )}
              {activeTab === 'grover' && (
                <>
                  Amplitude amplification over a 3-qubit state space demonstrating quantum quadratic search O(√N), illustrating why AES-128 degrades to 64-bit margin while AES-256 remains resilient.
                </>
              )}
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-purple-500/30 shrink-0">
            <button
              onClick={() => {
                setActiveTab('bbm92');
                if (!bbmResult) handleRunBbm92();
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                activeTab === 'bbm92'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>1. BBM92 QKD (Quantum Comm)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('shor');
                if (!shorResult) handleRunShor();
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                activeTab === 'shor'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>2. Shor's Algorithm</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('grover');
                if (!groverResult) handleRunGrover();
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                activeTab === 'grover'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>3. Grover's Algorithm</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BBM92 QUANTUM KEY DISTRIBUTION LAB                                 */}
      {/* ========================================================================= */}
      {activeTab === 'bbm92' && (
        <div className="space-y-8">

          {/* SIMULATION CONTROL PANEL */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <span>BBM92 Protocol Parameters & Execution</span>
                </h2>
                <p className="text-xs text-slate-400">Configure simulated Bell pairs, quantum channel scenario, and test sample fraction</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResetBbm92}
                  disabled={isBbmLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center space-x-1.5"
                  title="Reset to default ideal parameters"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                    showAdvancedParams
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showAdvancedParams ? 'Hide Advanced' : 'Advanced Settings'}</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              {/* Scenario Selection (5 Cols) */}
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quantum Transmission Scenario</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setBbmScenario('ideal')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bbmScenario === 'ideal'
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Ideal Channel</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Noiseless (0% QBER)</span>
                  </button>

                  <button
                    onClick={() => setBbmScenario('eve')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bbmScenario === 'eve'
                        ? 'bg-rose-500/20 border-rose-500/60 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Eve Intercept</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Intercept-Resend (~25% QBER)</span>
                  </button>

                  <button
                    onClick={() => setBbmScenario('noisy')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bbmScenario === 'noisy'
                        ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Noisy Channel</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Decoherence & Drift</span>
                  </button>
                </div>
              </div>

              {/* Pair Count Slider (4 Cols) */}
              <div className="md:col-span-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Simulated Bell Pairs (N)</span>
                  <span className="font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                    {bbmPairs} Pairs
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="200"
                  step="2"
                  value={bbmPairs}
                  onChange={(e) => setBbmPairs(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>12 pairs (fast test)</span>
                  <span>100 pairs</span>
                  <span>200 pairs (statistically rich)</span>
                </div>
              </div>

              {/* Run Simulation Button (3 Cols) */}
              <div className="md:col-span-3 flex items-end">
                <button
                  onClick={handleRunBbm92}
                  disabled={isBbmLoading}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {isBbmLoading ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Running Qiskit Circuits...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Execute BBM92 Simulation</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Advanced Parameter Controls (Accordion) */}
            {showAdvancedParams && (
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-purple-500/20 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Test Sample Fraction</span>
                    <span className="font-mono text-purple-300 font-bold">{Math.round(bbmTestFraction * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="0.60"
                    step="0.05"
                    value={bbmTestFraction}
                    onChange={(e) => setBbmTestFraction(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">Fraction of sifted bits publicly disclosed for QBER estimation</span>
                </div>

                {bbmScenario === 'eve' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Eve Intercept Probability</span>
                      <span className="font-mono text-rose-300 font-bold">{Math.round(bbmEveIntercept * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="1.0"
                      step="0.10"
                      value={bbmEveIntercept}
                      onChange={(e) => setBbmEveIntercept(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Likelihood Eve intercepts each transit photon</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Channel Noise Rate</span>
                      <span className="font-mono text-amber-300 font-bold">{Math.round(bbmNoiseRate * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.30"
                      step="0.01"
                      value={bbmNoiseRate}
                      disabled={bbmScenario !== 'noisy'}
                      onChange={(e) => setBbmNoiseRate(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                    />
                    <span className="text-[10px] text-slate-500 block">Pauli bit/phase flip probability across quantum channel</span>
                  </div>
                )}

                <div className="space-y-1.5 flex flex-col justify-end">
                  <a
                    href={bbmResult?.circuit_metadata?.quirk_url || "https://algassert.com/quirk"}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 hover:bg-purple-900/30 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Explore Bell Circuit in Quirk</span>
                  </a>
                  <span className="text-[10px] text-slate-500 text-center block">Inspect Bell-pair preparation in online simulator</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {bbmError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                <span>[!] Error: {bbmError}</span>
                <button onClick={() => setBbmError(null)} className="font-bold text-white">&times;</button>
              </div>
            )}
          </div>

          {/* ALICE-SOURCE-EVE-BOB SCHEMATIC DIAGRAM — ANIMATED CANVAS */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  <span>Entanglement Distribution & Measurement Topology</span>
                </h3>
                <p className="text-xs text-slate-400">Physical layout: EPR entangled photon pair emitted to Alice (q0) and Bob (q1). Particle trails reflect simulation state.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  State: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
                </span>
                {/* Immersive View Button */}
                <button
                  id="bbm92-immersive-btn"
                  onClick={() => setIsImmersive(v => !v)}
                  className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/30 transition-all"
                  title={isImmersive ? 'Exit Immersive View' : 'Immersive View'}
                >
                  {isImmersive ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {/* Sound Toggle */}
                <button
                  id="bbm92-sound-btn"
                  onClick={() => setIsSoundOn(v => !v)}
                  className={`p-2 rounded-xl border transition-all ${
                    isSoundOn
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isSoundOn ? 'Sound ON' : 'Sound OFF'}
                >
                  {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                {/* Pause/Resume */}
                <button
                  id="bbm92-pause-btn"
                  onClick={() => setIsPaused(v => !v)}
                  className={`p-2 rounded-xl border transition-all ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Interactive Schematic Diagram Box */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-x-auto relative">
              {/* Immersive fullscreen overlay */}
              {isImmersive && (
                <div
                  className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-8"
                  style={{ overflow: 'auto' }}
                >
                  <div className="w-full max-w-5xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-black text-white">BBM92 Immersive Quantum Channel View</h2>
                        <p className="text-xs text-slate-400">|Φ⁺⟩ Bell pair distribution — {bbmResult?.pair_count ?? bbmPairs} pairs, Scenario: {bbmScenario.toUpperCase()}</p>
                      </div>
                      <button onClick={() => setIsImmersive(false)} className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-white">
                        <Minimize2 className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Enlarged canvas inside immersive */}
                    <BbmSchematicCanvas
                      scenario={bbmScenario}
                      result={bbmResult}
                      particleKey={particleKey}
                      isLoading={isBbmLoading}
                      isPaused={isPaused}
                    />
                    {bbmResult && (
                      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: 'Bell Pairs', value: bbmResult.pair_count, color: 'text-white' },
                          { label: 'Matched Bases', value: `${bbmResult.matched_bases_count} (${bbmResult.matched_bases_percentage}%)`, color: 'text-purple-300' },
                          { label: 'Measured QBER', value: `${(bbmResult.measured_qber * 100).toFixed(1)}%`, color: bbmResult.measured_qber <= bbmResult.threshold_qber ? 'text-emerald-400' : 'text-rose-400' },
                          { label: 'Candidate Key', value: `${bbmResult.candidate_key_length} bits`, color: 'text-emerald-300' },
                        ].map(m => (
                          <div key={m.label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 uppercase block">{m.label}</span>
                            <strong className={`text-lg font-black font-mono ${m.color}`}>{m.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Normal canvas */}
              <BbmSchematicCanvas
                scenario={bbmScenario}
                result={bbmResult}
                particleKey={particleKey}
                isLoading={isBbmLoading}
                isPaused={isPaused}
              />

              {/* Classical Public Channel Sifting Line */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-purple-300">
                  Classical Authenticated Channel: Alice ⇄ Bob (Announce measurement bases only; raw secret bits never sent)
                </span>
              </div>
            </div>
          </div>

          {/* RESULTS DISPLAY & METRICS CARDS */}
          {bbmResult && (
            <div className="space-y-6">

              {/* Status & Verdict Alert Banner */}
              <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                bbmResult.status === 'COMPLETED_SECURE'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : bbmResult.status === 'COMPLETED_ABORTED'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 mt-0.5">
                    {bbmResult.status === 'COMPLETED_SECURE' && <ShieldCheck className="w-7 h-7 text-emerald-400" />}
                    {bbmResult.status === 'COMPLETED_ABORTED' && <AlertTriangle className="w-7 h-7 text-rose-400" />}
                    {bbmResult.status === 'INSUFFICIENT_SAMPLE' && <Info className="w-7 h-7 text-amber-400" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-950/80">
                        {bbmResult.status}
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {bbmResult.status_message}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                      {bbmResult.interpretation}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Observed Test QBER</span>
                  <span className={`text-2xl font-black ${
                    bbmResult.measured_qber <= bbmResult.threshold_qber ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(bbmResult.measured_qber * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Threshold: &le; 11.0%</span>
                </div>
              </div>

              {/* 6 Key Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Total Bell Pairs</span>
                  <strong className="text-xl font-black text-white font-mono">{bbmResult.pair_count}</strong>
                  <span className="text-[9px] text-slate-500 block">Generated by EPR</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Matched Bases</span>
                  <strong className="text-xl font-black text-purple-300 font-mono">{bbmResult.matched_bases_count}</strong>
                  <span className="text-[9px] text-purple-400/80 block">{bbmResult.matched_bases_percentage}% Sifted</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Disclosed Test Pairs</span>
                  <strong className="text-xl font-black text-indigo-300 font-mono">{bbmResult.test_sample_size}</strong>
                  <span className="text-[9px] text-slate-500 block">{bbmResult.test_sample_errors} Mismatches</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Candidate Key Bits</span>
                  <strong className="text-xl font-black text-emerald-300 font-mono">{bbmResult.candidate_key_length}</strong>
                  <span className="text-[9px] text-emerald-400/80 block">Undisclosed Key</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Measured QBER</span>
                  <strong className={`text-xl font-black font-mono ${
                    bbmResult.measured_qber <= bbmResult.threshold_qber ? 'text-emerald-300' : 'text-rose-400'
                  }`}>
                    {(bbmResult.measured_qber * 100).toFixed(1)}%
                  </strong>
                  <span className="text-[9px] text-slate-500 block">Exp: {(bbmResult.expected_qber * 100).toFixed(1)}%</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Simulation Time</span>
                  <strong className="text-xl font-black text-amber-300 font-mono">{bbmResult.execution_time_ms} ms</strong>
                  <span className="text-[9px] text-slate-500 block">Aer Execution</span>
                </div>
              </div>

              {/* Undisclosed Candidate Key Preview Card */}
              {bbmResult.candidate_key_length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Distilled Candidate Raw Key Preview (Educational Sample)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      These sifted bits were kept confidential between Alice & Bob (never disclosed in the parameter estimation test subset).
                    </p>
                  </div>

                  <div className="p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 font-bold tracking-widest text-center">
                    {bbmResult.candidate_key_preview || '[No candidate key bits]'}
                  </div>
                </div>
              )}

              {/* CHARTS ROW: 1) MEASUREMENT HISTOGRAM, 2) BASIS BREAKDOWN & ERROR METER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Measurement Outcome Histogram (7 Cols) */}
                <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        <span>Matched Basis Measurement Outcomes (|m_A m_B⟩)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">For |Φ⁺⟩, identical outcomes |00⟩ & |11⟩ are expected; |01⟩ & |10⟩ represent disturbances</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                      {bbmResult.matched_bases_count} Matched Pairs
                    </span>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bbmHistogramData}>
                        <XAxis dataKey="state" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#8b5cf6', borderRadius: '12px', fontSize: '12px' }}
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count} pairs)`,
                            item.payload.description,
                          ]}
                        />
                        <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                          {bbmHistogramData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isError ? '#f43f5e' : '#a855f7'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-center space-x-6 text-[11px] font-mono pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
                      <span className="text-slate-300">Correlated (|00⟩, |11⟩)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                      <span className="text-slate-300">Mismatch Errors (|01⟩, |10⟩)</span>
                    </div>
                  </div>
                </div>

                {/* Right: Basis Combinations & QBER Gauge (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* QBER Meter vs Threshold */}
                  <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>QBER Security Threshold Gauge</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Shor-Preskill Bound: 11.0%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Observed QBER:</span>
                        <span className={`font-bold ${
                          bbmResult.measured_qber <= bbmResult.threshold_qber ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {(bbmResult.measured_qber * 100).toFixed(1)}%
                        </span>
                      </div>

                      {/* Visual Meter Bar */}
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            bbmResult.measured_qber <= bbmResult.threshold_qber ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, (bbmResult.measured_qber / 0.35) * 100)}%` }}
                        />
                        {/* 11% Mark */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                          style={{ left: `${(0.11 / 0.35) * 100}%` }}
                          title="11.0% Threshold"
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0% (Ideal)</span>
                        <span className="text-amber-400 font-bold">11% (Abort Limit)</span>
                        <span>35% (Severe Attack)</span>
                      </div>
                    </div>
                  </div>

                  {/* Basis Combination Breakdown */}
                  <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-purple-500/20 pb-2">
                      Alice & Bob Basis Combinations
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {bbmBasisData.map((item) => (
                        <div
                          key={item.name}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            item.matched
                              ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{item.name}</span>
                          <strong className="text-white">{item.count} pairs</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* STEP-BY-STEP EXPERIMENT TIMELINE */}
              {bbmResult.timeline_steps && bbmResult.timeline_steps.length > 0 && (
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-4">
                  <div className="border-b border-purple-500/20 pb-3">
                    <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>Step-by-Step BBM92 Protocol Timeline</span>
                    </h3>
                    <p className="text-xs text-slate-400">Chronological execution of quantum and classical stages</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bbmResult.timeline_steps.map((st) => (
                      <div
                        key={st.step}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-all space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                            Step {st.step}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">{st.metric}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-white">{st.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QISKIT CIRCUIT DIAGRAM & QUIRK REFERENCE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ASCII Circuit Diagram (8 Cols) */}
                <div className="lg:col-span-8 glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <h4 className="text-xs font-extrabold text-white flex items-center space-x-2">
                      <Binary className="w-4 h-4 text-purple-400" />
                      <span>Qiskit Representative Quantum Circuit</span>
                    </h4>
                    <span className="text-[10px] font-mono text-purple-300">
                      {bbmResult.circuit_metadata?.qubits} Qubits | Depth {bbmResult.circuit_metadata?.circuit_depth}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
                    <pre className="text-xs leading-tight text-emerald-400 font-mono whitespace-pre">
                      {bbmResult.circuit_metadata?.circuit_ascii || '[ Circuit diagram loading... ]'}
                    </pre>
                  </div>
                </div>

                {/* Academic & Security Disclaimers (4 Cols) */}
                <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-4">
                  <h4 className="text-xs font-extrabold text-white flex items-center space-x-1.5 uppercase tracking-wider border-b border-purple-500/20 pb-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>Protocol Principles & Guardrails</span>
                  </h4>

                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                      <strong className="text-purple-300 block font-bold">Why BBM92 Works:</strong>
                      <span>
                        Unlike classical key exchange where pre-existing secrets are transmitted, BBM92 uses entangled pairs.
                        The key is generated <em>at the moment of measurement</em>. Any eavesdropper measuring a photon collapses the state, inevitably introducing ~25% error on matched bases.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1 text-amber-200">
                      <strong className="text-amber-300 block font-bold">Software Simulation Limitations:</strong>
                      <span>
                        This simulation executes genuine quantum circuits via Qiskit Aer on classical hardware. It does not establish a physical quantum link. Finite sample sizes fluctuate statistically. Real QKD requires authenticated classical channels, Cascade error correction, and universal hash privacy amplification.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ============================================================= */}
              {/* QBER BREAKDOWN TABLE (REQUIRED)                                */}
              {/* ============================================================= */}
              {(bbmResult as any)?.qber_breakdown && (
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-3">
                    <Table className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">QBER Breakdown by Basis Pair</h3>
                      <p className="text-[11px] text-slate-400">Calculated from actual Qiskit measurement results. Total QBER = total errors / total test bits × 100.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-purple-500/20">
                          {['Basis Pair', 'Sifted Rounds', 'Test Bits', 'Errors', 'Correct', 'Observed QBER'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(['ZZ', 'XX', 'total'] as const).map(key => {
                          const row = (bbmResult as any).qber_breakdown[key];
                          if (!row) return null;
                          const isTotal = key === 'total';
                          const qberVal = row.observed_qber;
                          const qberPct = qberVal != null ? `${(qberVal * 100).toFixed(1)}%` : '—';
                          const qberColor = qberVal == null ? 'text-slate-400'
                            : qberVal <= (bbmResult?.threshold_qber ?? 0.11) ? 'text-emerald-400' : 'text-rose-400';
                          return (
                            <tr
                              key={key}
                              className={`border-b border-slate-800/60 ${
                                isTotal
                                  ? 'bg-purple-950/30 font-bold'
                                  : 'hover:bg-slate-900/40'
                              } transition-colors`}
                            >
                              <td className={`px-4 py-3 font-bold ${
                                isTotal ? 'text-white uppercase tracking-wider' : key === 'ZZ' ? 'text-purple-300' : 'text-indigo-300'
                              }`}>
                                {row.basis}
                              </td>
                              <td className="px-4 py-3 text-slate-300">{row.sifted_rounds}</td>
                              <td className="px-4 py-3 text-slate-300">{row.test_bits}</td>
                              <td className={`px-4 py-3 font-bold ${row.errors > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {row.errors}
                              </td>
                              <td className={`px-4 py-3 ${row.correct > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {row.correct}
                              </td>
                              <td className={`px-4 py-3 font-bold text-base ${qberColor}`}>
                                {qberPct}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="mt-2 text-[10px] text-slate-500">
                      * Total QBER = {(bbmResult as any).qber_breakdown.total?.errors ?? 0} errors / {(bbmResult as any).qber_breakdown.total?.test_bits ?? 0} test bits
                      {(bbmResult as any).qber_breakdown.total?.test_bits > 0
                        ? ` = ${(((bbmResult as any).qber_breakdown.total.errors / (bbmResult as any).qber_breakdown.total.test_bits) * 100).toFixed(2)}%`
                        : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* ALICE & BOB MEASUREMENT STREAMS (from rounds_data)             */}
              {/* ============================================================= */}
              {(bbmResult as any)?.rounds_data && (bbmResult as any).rounds_data.length > 0 && (
                <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <div className="flex items-center space-x-2">
                      <List className="w-5 h-5 text-purple-400" />
                      <div>
                        <h3 className="text-sm font-extrabold text-white">Alice & Bob Measurement Streams</h3>
                        <p className="text-[11px] text-slate-400">Per-round bit stream from Qiskit measurement results. Purple = matched, grey = discarded, rose = test sample error.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {(bbmResult as any).rounds_data.length} rounds shown
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex flex-col gap-2 min-w-[600px]">
                      {/* Alice row */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-purple-300 w-14 shrink-0">Alice:</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {(bbmResult as any).rounds_data.map((r: any, i: number) => {
                            const isMatch = r.matched;
                            const isErr = r.in_test_sample && r.is_error;
                            const isTest = r.in_test_sample && !r.is_error;
                            const isKey = r.in_candidate_key;
                            return (
                              <span
                                key={i}
                                title={`Round ${r.round}: Alice=${r.alice_basis}/${r.alice_bit}, Bob=${r.bob_basis}/${r.bob_bit}${r.matched ? ' ✓MATCHED' : ' ✗DISCARDED'}${r.in_test_sample ? ' [TEST]' : ''}${r.in_candidate_key ? ' [KEY]' : ''}`}
                                className={`w-5 h-5 rounded text-[9px] font-black flex items-center justify-center cursor-default transition-all border ${
                                  !isMatch ? 'bg-slate-900/40 text-slate-600 border-slate-800'
                                  : isErr ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                                  : isTest ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                                  : isKey ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                                }`}
                              >
                                {r.alice_bit}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* Bob row */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-300 w-14 shrink-0">Bob:</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {(bbmResult as any).rounds_data.map((r: any, i: number) => {
                            const isMatch = r.matched;
                            const isErr = r.in_test_sample && r.is_error;
                            const isTest = r.in_test_sample && !r.is_error;
                            const isKey = r.in_candidate_key;
                            return (
                              <span
                                key={i}
                                title={`Round ${r.round}: Alice ${r.alice_basis}=${r.alice_bit}, Bob ${r.bob_basis}=${r.bob_bit}`}
                                className={`w-5 h-5 rounded text-[9px] font-black flex items-center justify-center cursor-default border ${
                                  !isMatch ? 'bg-slate-900/40 text-slate-600 border-slate-800'
                                  : isErr ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                                  : isTest ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                                  : isKey ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                                }`}
                              >
                                {r.bob_bit}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 mt-1 text-[10px] font-mono">
                        {[
                          { color: 'bg-slate-900/40 border-slate-800', label: 'Discarded (basis mismatch)' },
                          { color: 'bg-indigo-950/80 border-indigo-500/40', label: 'Test sample (no error)' },
                          { color: 'bg-rose-950/80 border-rose-500/50', label: 'Test sample error' },
                          { color: 'bg-purple-950/80 border-purple-500/40', label: 'Candidate key bit' },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded border ${l.color} inline-block`} />
                            <span className="text-slate-400">{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* PROTOCOL EVENT LOG                                             */}
              {/* ============================================================= */}
              {bbmResult?.timeline_steps && bbmResult.timeline_steps.length > 0 && (
                <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-extrabold text-white">Protocol Event Log</h3>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs max-h-64 overflow-y-auto pr-1">
                    {bbmResult.timeline_steps.map(st => (
                      <div key={st.step} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/20 transition-all">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold shrink-0">[{String(st.step).padStart(2, '0')}]</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-200 font-semibold">{st.title}: </span>
                          <span className="text-slate-400">{st.description}</span>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-bold shrink-0">{st.metric}</span>
                      </div>
                    ))}
                    {/* Final verdict log entry */}
                    <div className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                      bbmResult.status === 'COMPLETED_SECURE'
                        ? 'bg-emerald-950/30 border-emerald-500/30'
                        : 'bg-rose-950/30 border-rose-500/30'
                    }`}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        bbmResult.status === 'COMPLETED_SECURE'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      }`}>[SYS]</span>
                      <span className={`text-xs font-bold ${
                        bbmResult.status === 'COMPLETED_SECURE' ? 'text-emerald-300' : 'text-rose-300'
                      }`}>{bbmResult.status_message}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHOR'S ALGORITHM SIMULATION (INTEGER FACTORIZATION)                 */}
      {/* ========================================================================= */}
      {activeTab === 'shor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-6">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Shor's Algorithm Simulation</h3>
                  <p className="text-xs text-slate-400">Public-key threat modeling (Integer Factorization)</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  VULNERABLE: RSA / ECC
                </span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Target Integer (N)</label>
                  <input
                    type="number"
                    value={shorN}
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-purple-300 font-bold opacity-80"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Educational Toy Target</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Coprime (a)</label>
                  <select
                    value={shorA}
                    onChange={(e) => setShorA(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-sm font-mono text-purple-300 font-bold"
                  >
                    <option value={7}>a = 7 (7^r mod 15)</option>
                    <option value={11}>a = 11 (11^r mod 15)</option>
                    <option value={2}>a = 2 (2^r mod 15)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Selected Coprime</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-end">
                  <button
                    onClick={handleRunShor}
                    disabled={isAlgoLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isAlgoLoading ? <Cpu className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>Execute Shor Circuit</span>
                  </button>
                </div>
              </div>

              {/* Shor Result Summary */}
              {shorResult && (
                <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300">Target State Output</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Factorization Successful
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white font-mono text-center py-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    15 = <span className="text-purple-400">3</span> &times; <span className="text-indigo-400">5</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Period (r)</span>
                      <strong className="text-purple-300 font-extrabold">{shorResult.period_found}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Total Qubits</span>
                      <strong className="text-indigo-300 font-extrabold">{shorResult.qubits} Qubits</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Circuit Depth</span>
                      <strong className="text-amber-300 font-extrabold">{shorResult.circuit_depth}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Aer Shots</span>
                      <strong className="text-emerald-300 font-extrabold">{shorResult.shots}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shor Histogram */}
            <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Counting Qubits Probability Distribution</h4>
              {algoChartData.length > 0 ? (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={algoChartData}>
                      <XAxis dataKey="state" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#8b5cf6', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val}% Probability`, 'Phase Measurement']}
                      />
                      <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                        {algoChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isTarget ? '#a855f7' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-mono">
                  [ No simulation output loaded yet ]
                </div>
              )}
            </div>

            {/* Circuit ASCII */}
            <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Qiskit Circuit ASCII Diagram</h4>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
                <pre className="text-xs leading-tight text-emerald-400 font-mono whitespace-pre">
                  {shorResult?.circuit_ascii || '[ Circuit diagram loading... ]'}
                </pre>
              </div>
            </div>
          </div>

          {/* Shor Explanations */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-4">
              <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-3">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">Why Shor's Algorithm Threatens Public Key Cryptography</h3>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  RSA and Elliptic Curve Cryptography rely on the difficulty of integer factorization and discrete logarithms.
                  Shor's algorithm uses <strong>Quantum Phase Estimation (QPE)</strong> and the <strong>Inverse Quantum Fourier Transform (QFT†)</strong> to solve order finding in polynomial time <strong>O(n³)</strong>.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-purple-300 block">NIST Post-Quantum Migration Requirement:</span>
                  <p className="text-slate-400">
                    Replace RSA-2048/ECC with <strong>ML-KEM (FIPS 203)</strong> for key exchange and <strong>ML-DSA (FIPS 204)</strong> or <strong>SLH-DSA (FIPS 205)</strong> for digital signatures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GROVER'S ALGORITHM SIMULATION (SYMMETRIC SEARCH)                   */}
      {/* ========================================================================= */}
      {activeTab === 'grover' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-6">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Grover's Algorithm Simulation</h3>
                  <p className="text-xs text-slate-400">Symmetric key search acceleration (Quadratic speedup)</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEGRADED: AES-128 | SAFE: AES-256
                </span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Target Secret Bitstring</label>
                  <select
                    value={groverTarget}
                    onChange={(e) => setGroverTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-sm font-mono text-purple-300 font-bold"
                  >
                    <option value="101">Target |101⟩ (State 5)</option>
                    <option value="011">Target |011⟩ (State 3)</option>
                    <option value="110">Target |110⟩ (State 6)</option>
                    <option value="001">Target |001⟩ (State 1)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Secret Oracle Target</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Search Space</label>
                  <input
                    type="text"
                    value="8 States (3 Qubits)"
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 font-bold opacity-80"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Toy Search Space</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-end">
                  <button
                    onClick={handleRunGrover}
                    disabled={isAlgoLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isAlgoLoading ? <Cpu className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>Execute Grover Circuit</span>
                  </button>
                </div>
              </div>

              {/* Grover Result Summary */}
              {groverResult && (
                <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-300">Amplitude Amplification Peak</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Probability &gt; 94%
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white font-mono text-center py-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    Target State: <span className="text-purple-400">|{groverResult.target_state}⟩</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Target Probability</span>
                      <strong className="text-purple-300 font-extrabold">
                        {Math.round((groverResult.probabilities[groverResult.target_state || '101'] || 0) * 100)}%
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Total Qubits</span>
                      <strong className="text-indigo-300 font-extrabold">{groverResult.qubits} Qubits</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Circuit Depth</span>
                      <strong className="text-amber-300 font-extrabold">{groverResult.circuit_depth}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Iterations</span>
                      <strong className="text-emerald-300 font-extrabold">2 Grover Steps</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grover Histogram */}
            <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Search Space Probability Histogram</h4>
              {algoChartData.length > 0 ? (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={algoChartData}>
                      <XAxis dataKey="state" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#8b5cf6', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val}% Probability`, 'State Measurement']}
                      />
                      <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                        {algoChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isTarget ? '#a855f7' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-mono">
                  [ No simulation output loaded yet ]
                </div>
              )}
            </div>

            {/* Circuit ASCII */}
            <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-slate-950/80 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Qiskit Circuit ASCII Diagram</h4>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
                <pre className="text-xs leading-tight text-emerald-400 font-mono whitespace-pre">
                  {groverResult?.circuit_ascii || '[ Circuit diagram loading... ]'}
                </pre>
              </div>
            </div>
          </div>

          {/* Grover Explanations */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-slate-950/80 space-y-4">
              <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-3">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">Why Grover's Algorithm Affects Symmetric Ciphers</h3>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  Grover's algorithm provides a <strong>quadratic speedup O(&radic;N)</strong> for unstructured search over symmetric key spaces.
                  This effectively halves the key length security margin:
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200">
                    <strong>AES-128:</strong> 128 bits &rarr; 64 bits quantum security (Degraded / Insecure)
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                    <strong>AES-256:</strong> 256 bits &rarr; 128 bits quantum security (Safe & Resistant)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default QuantumLabPage;

// ============================================================================
// BbmSchematicCanvas — Animated Alice–Source–(Eve)–Bob topology
// ============================================================================
interface BbmSchematicCanvasProps {
  scenario: 'ideal' | 'eve' | 'noisy';
  result: BBM92SimulationResult | null;
  particleKey: number;
  isLoading: boolean;
  isPaused: boolean;
}

const BbmSchematicCanvas: React.FC<BbmSchematicCanvasProps> = ({
  scenario, result, particleKey, isLoading, isPaused
}) => {
  const hasEve = scenario === 'eve';
  const hasNoise = scenario === 'noisy';
  const eveQber = result?.measured_qber;
  const isAborted = result?.status === 'COMPLETED_ABORTED';

  const particleStyle = (delay: string, dur: string, color: string): React.CSSProperties => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 6px ${color}`,
    top: '-3px',
    left: 0,
    animationName: 'bbmParticleTrail',
    animationDuration: dur,
    animationDelay: delay,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationPlayState: isPaused ? 'paused' : 'running',
  });

  return (
    <>
      <style>{`
        @keyframes bbmParticleTrail {
          0%   { left: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes bbmEveWobble {
          0%, 100% { transform: translateY(0px) scale(1); }
          25%       { transform: translateY(-4px) scale(1.04); }
          75%       { transform: translateY(4px) scale(0.97); }
        }
      `}</style>

      <div key={particleKey} className="min-w-[650px] flex items-stretch justify-between relative py-10 gap-2">

        {/* ALICE NODE */}
        <div className="flex flex-col items-center space-y-2 z-10 w-44 shrink-0 p-3 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg text-center">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm ${isLoading ? 'bg-purple-600/40 border-purple-400 animate-pulse' : 'bg-purple-600/30 border-purple-500'} text-white`}>
            A
          </div>
          <span className="text-xs font-bold text-purple-300">Alice</span>
          <span className="text-[10px] text-purple-400/80 font-mono">Qubit q\u2080</span>
          <div className="text-[9px] text-slate-400 space-y-0.5 font-mono">
            <div>Bases: <span className="text-purple-300">{'{Z, X}'}</span></div>
            {result?.basis_statistics && (
              <div className="mt-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-200 font-bold">
                Z:{result.basis_statistics.alice_z_count} X:{result.basis_statistics.alice_x_count}
              </div>
            )}
          </div>
        </div>

        {/* LEFT CHANNEL (EPR Source to Alice) */}
        <div className="flex-1 flex flex-col justify-center items-stretch relative min-w-[80px]">
          <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full relative overflow-visible">
            {[0, 1, 2].map((i) => (
              <span key={i} style={particleStyle(`${i * 0.9}s`, '2.7s', '#a855f7')} />
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-500 font-mono animate-pulse">photon q\u2080</span>
          </div>
          <div className="absolute -bottom-5 left-0 w-full text-center">
            <span className="text-[8px] text-purple-400/50 font-mono">\u27e8entanglement\u27e9</span>
          </div>
        </div>

        {/* EPR SOURCE */}
        <div className="flex flex-col items-center space-y-1.5 z-10 w-48 shrink-0 p-4 rounded-2xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border border-indigo-500/50 shadow-xl text-center">
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${isLoading ? 'bg-indigo-600/50 border-indigo-300' : 'bg-indigo-600/30 border-indigo-400'}`}>
            <Atom className={`w-7 h-7 text-indigo-300 ${isLoading ? 'animate-spin' : 'animate-spin-slow'}`} />
          </div>
          <span className="text-xs font-black text-indigo-200">EPR Bell Source</span>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
            |\u03a6\u207a\u27e9 Entanglement
          </span>
          {result && (
            <span className="text-[9px] text-indigo-400/80 font-mono">{result.pair_count} pairs</span>
          )}
        </div>

        {/* RIGHT CHANNEL (EPR Source to Bob, via optional Eve) */}
        <div className="flex-1 flex flex-col justify-center items-stretch relative min-w-[80px]">
          <div className={`w-full h-1 rounded-full relative overflow-visible ${hasEve ? 'bg-gradient-to-r from-indigo-500 via-rose-500 to-rose-400' : hasNoise ? 'bg-gradient-to-r from-indigo-500 via-amber-500 to-amber-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={particleStyle(`${i * 0.9}s`, '2.7s', hasEve ? '#f43f5e' : hasNoise ? '#f59e0b' : '#6366f1')}
              />
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-500 font-mono animate-pulse">photon q\u2081</span>
          </div>

          {/* Eve node */}
          {hasEve && (
            <div
              className="absolute -top-14 left-1/2 -translate-x-1/2 z-20"
              style={{
                animationName: 'bbmEveWobble',
                animationDuration: '2.2s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationPlayState: isPaused ? 'paused' : 'running',
              } as React.CSSProperties}
            >
              <div className={`px-3 py-1.5 rounded-xl border shadow-lg flex items-center gap-1.5 text-[10px] font-mono font-bold whitespace-nowrap ${isAborted ? 'bg-rose-950/95 border-rose-400 text-rose-200 shadow-rose-500/30' : 'bg-rose-950/80 border-rose-500/60 text-rose-300'}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Eve</span>
                {eveQber != null && (
                  <span className="ml-1 text-rose-400 font-black">{(eveQber * 100).toFixed(0)}% QBER</span>
                )}
              </div>
              <div className="w-0.5 h-3 bg-rose-500/60 mx-auto" />
            </div>
          )}

          {/* Noisy channel indicator */}
          {hasNoise && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 px-2 py-1 rounded-lg bg-amber-950/90 border border-amber-500/60 text-[9px] font-mono text-amber-300 whitespace-nowrap">
              Decoherence
              {result && <span className="ml-1 font-bold">{(result.measured_qber * 100).toFixed(0)}% QBER</span>}
            </div>
          )}
        </div>

        {/* BOB NODE */}
        <div className="flex flex-col items-center space-y-2 z-10 w-44 shrink-0 p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-lg text-center">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm ${isLoading ? 'bg-indigo-600/40 border-indigo-400 animate-pulse' : 'bg-indigo-600/30 border-indigo-500'} text-white`}>
            B
          </div>
          <span className="text-xs font-bold text-indigo-300">Bob</span>
          <span className="text-[10px] text-indigo-400/80 font-mono">Qubit q\u2081</span>
          <div className="text-[9px] text-slate-400 space-y-0.5 font-mono">
            <div>Bases: <span className="text-indigo-300">{'{Z, X}'}</span></div>
            {result?.basis_statistics && (
              <div className="mt-1 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 font-bold">
                Z:{result.basis_statistics.bob_z_count} X:{result.basis_statistics.bob_x_count}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};
