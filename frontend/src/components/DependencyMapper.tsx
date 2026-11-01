import React, { useState, useMemo } from 'react';
import {
  Boxes, GitFork, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  Search, Filter, ChevronDown, ChevronRight, ExternalLink, ArrowRight,
  Sparkles, Layers, FileCode, Package, RefreshCw, ZoomIn, ZoomOut, Maximize2,
  Info, Cpu, Terminal
} from 'lucide-react';
import {
  CryptoDependency, DependencyGraph, DependencyGraphNode,
  MigrationImpactItem, DependencySummary, DependencyEcosystem,
  QuantumRisk, PqcSupportStatus
} from '../types/scan';

interface DependencyMapperProps {
  dependencies?: CryptoDependency[];
  dependencyGraph?: DependencyGraph;
  migrationImpact?: MigrationImpactItem[];
  summary?: DependencySummary;
  scanId: string;
  projectName: string;
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const DependencyMapper: React.FC<DependencyMapperProps> = ({
  dependencies = [],
  dependencyGraph,
  migrationImpact = [],
  summary,
  scanId,
  projectName,
  onSelectFileFinding
}) => {
  const [activeView, setActiveView] = useState<'inventory' | 'graph' | 'impact'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedPqcStatus, setSelectedPqcStatus] = useState<string>('all');
  const [directOnly, setDirectOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedDep, setSelectedDep] = useState<CryptoDependency | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<DependencyGraphNode | null>(null);
  const [graphZoom, setGraphZoom] = useState(1);

  // Compute fallback summary if missing
  const stats = useMemo(() => {
    if (summary) return summary;
    const total = dependencies.length;
    const direct = dependencies.filter(d => d.direct).length;
    const active = dependencies.filter(d => d.active_in_code).length;
    const vulnerable = dependencies.filter(d => d.quantum_risk === 'VULNERABLE').length;
    const pqcReady = dependencies.filter(d => d.pqc_support_status === 'SUPPORTED').length;
    return {
      total_dependencies: total,
      cryptographic_dependencies: total,
      non_cryptographic_dependencies: 0,
      direct_crypto_dependencies: direct,
      transitive_crypto_dependencies: total - direct,
      active_in_source_code: active,
      declared_only: total - active,
      quantum_vulnerable_count: vulnerable,
      pqc_ready_count: pqcReady
    };
  }, [dependencies, summary]);

  // Filter dependencies
  const filteredDependencies = useMemo(() => {
    return dependencies.filter(dep => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dep.package_name.toLowerCase().includes(q) || dep.canonical_name.toLowerCase().includes(q);
        const matchesManifest = dep.manifest_path.toLowerCase().includes(q);
        const matchesAlgos = dep.associated_algorithms?.some(a => a.toLowerCase().includes(q));
        const matchesFiles = dep.related_files?.some(f => f.toLowerCase().includes(q));
        if (!matchesName && !matchesManifest && !matchesAlgos && !matchesFiles) return false;
      }
      // Ecosystem
      if (selectedEcosystem !== 'all' && dep.ecosystem !== selectedEcosystem) return false;
      // Quantum Risk
      if (selectedRisk !== 'all' && dep.quantum_risk !== selectedRisk) return false;
      // PQC status
      if (selectedPqcStatus !== 'all' && dep.pqc_support_status !== selectedPqcStatus) return false;
      // Direct vs Transitive
      if (directOnly && !dep.direct) return false;
      // Active in code
      if (activeOnly && !dep.active_in_code) return false;

      return true;
    });
  }, [dependencies, searchQuery, selectedEcosystem, selectedRisk, selectedPqcStatus, directOnly, activeOnly]);

  // Ecosystem badge styling
  const getEcosystemBadge = (eco: DependencyEcosystem) => {
    switch (eco) {
      case 'python':
        return { label: 'Python (PyPI)', color: 'text-sky-300 border-sky-500/30 bg-sky-500/10' };
      case 'npm':
        return { label: 'npm (JS/TS)', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
      case 'maven':
        return { label: 'Maven / Gradle', color: 'text-rose-300 border-rose-500/30 bg-rose-500/10' };
      case 'go':
        return { label: 'Go Module', color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' };
      case 'cargo':
        return { label: 'Rust (Cargo)', color: 'text-orange-300 border-orange-500/30 bg-orange-500/10' };
      case 'native':
        return { label: 'C / C++ Native', color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' };
      default:
        return { label: 'Software Package', color: 'text-slate-300 border-slate-500/30 bg-slate-500/10' };
    }
  };

  // Quantum Risk badge styling
  const getQuantumBadge = (risk: QuantumRisk) => {
    switch (risk) {
      case 'VULNERABLE':
        return { label: 'Shor Vulnerable', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10', icon: ShieldAlert };
      case 'DEGRADED':
        return { label: 'Grover Degraded', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', icon: AlertTriangle };
      case 'POST_QUANTUM':
        return { label: 'Post-Quantum Safe', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10', icon: ShieldCheck };
      default:
        return { label: 'Quantum Resilient', color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10', icon: CheckCircle2 };
    }
  };

  // PQC status badge
  const getPqcBadge = (status: PqcSupportStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return { label: 'PQC Supported', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
      case 'EXPERIMENTAL':
        return { label: 'PQC Experimental', color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' };
      case 'REQUIRES_UPGRADE':
        return { label: 'Upgrade to Enable PQC', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
      case 'REQUIRES_REPLACEMENT':
        return { label: 'Replacement Required', color: 'text-rose-300 border-rose-500/30 bg-rose-500/10' };
      case 'UNSUPPORTED':
        return { label: 'No PQC Support', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' };
      default:
        return { label: 'PQC Unverified', color: 'text-slate-400 border-slate-500/20 bg-slate-500/5' };
    }
  };

  // Complexity styling
  const getComplexityBadge = (complexity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (complexity) {
      case 'HIGH':
        return { label: 'High Complexity', color: 'text-rose-300 border-rose-500/40 bg-rose-500/15' };
      case 'MEDIUM':
        return { label: 'Medium Complexity', color: 'text-amber-300 border-amber-500/40 bg-amber-500/15' };
      default:
        return { label: 'Low Complexity', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15' };
    }
  };

  // Graph Layout calculation (hierarchical columns: Project -> Package -> Algorithm -> Finding)
  const graphLayout = useMemo(() => {
    if (!dependencyGraph || !dependencyGraph.nodes || dependencyGraph.nodes.length === 0) {
      return null;
    }

    const { nodes, links } = dependencyGraph;

    // Group nodes by type
    const projectNodes = nodes.filter(n => n.type === 'project');
    const packageNodes = nodes.filter(n => n.type === 'package');
    const algorithmNodes = nodes.filter(n => n.type === 'algorithm');
    const findingNodes = nodes.filter(n => n.type === 'finding');

    const columnX = {
      project: 120,
      package: 380,
      algorithm: 680,
      finding: 1000
    };

    const maxItems = Math.max(packageNodes.length, algorithmNodes.length, findingNodes.length, 1);
    const svgHeight = Math.max(500, maxItems * 75 + 100);
    const svgWidth = 1250;

    const nodePositions: Record<string, { x: number; y: number }> = {};

    // Position root
    projectNodes.forEach((n, i) => {
      nodePositions[n.id] = { x: columnX.project, y: svgHeight / 2 + (i * 80) };
    });

    // Position packages
    const pkgSpacing = svgHeight / (packageNodes.length + 1);
    packageNodes.forEach((n, i) => {
      nodePositions[n.id] = { x: columnX.package, y: (i + 1) * pkgSpacing };
    });

    // Position algorithms
    const algoSpacing = svgHeight / (algorithmNodes.length + 1);
    algorithmNodes.forEach((n, i) => {
      nodePositions[n.id] = { x: columnX.algorithm, y: (i + 1) * algoSpacing };
    });

    // Position findings
    const findingSpacing = svgHeight / (findingNodes.length + 1);
    findingNodes.forEach((n, i) => {
      nodePositions[n.id] = { x: columnX.finding, y: (i + 1) * findingSpacing };
    });

    return {
      nodes,
      links,
      nodePositions,
      width: svgWidth,
      height: svgHeight
    };
  }, [dependencyGraph]);

  return (
    <div className="space-y-6">

      {/* ── Top Overview Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xl font-black text-indigo-300 font-mono">{stats.cryptographic_dependencies}</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Crypto Libraries</p>
            <p className="text-[10px] text-slate-500">{stats.total_dependencies} manifests total</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-cyan-500/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <GitFork className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xl font-black text-cyan-300 font-mono">{stats.direct_crypto_dependencies} / {stats.transitive_crypto_dependencies}</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Direct / Transitive</p>
            <p className="text-[10px] text-slate-500">supply-chain tier</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileCode className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-black text-emerald-300 font-mono">{stats.active_in_source_code}</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Active in Code</p>
            <p className="text-[10px] text-slate-500">{stats.declared_only} declared only</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-rose-500/20 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xl font-black text-rose-300 font-mono">{stats.quantum_vulnerable_count}</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Quantum Vulnerable</p>
            <p className="text-[10px] text-slate-500">public-key exposure</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-violet-500/20 flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xl font-black text-violet-300 font-mono">{stats.pqc_ready_count}</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">PQC Verified</p>
            <p className="text-[10px] text-slate-500">NIST PQC ready</p>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Controls ── */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/8 shrink-0">
          <button
            onClick={() => setActiveView('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'inventory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Dependency Inventory ({dependencies.length})</span>
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'graph' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Relationship Graph</span>
          </button>
          <button
            onClick={() => setActiveView('impact')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeView === 'impact' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Migration Impact ({migrationImpact.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search package, version, algorithm, or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* ── Filter Bar (when in inventory or impact view) ── */}
      {activeView !== 'graph' && (
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Ecosystem filter */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/8">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">Ecosystem:</span>
            <select
              value={selectedEcosystem}
              onChange={(e) => setSelectedEcosystem(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Ecosystems</option>
              <option value="python" className="bg-slate-900">Python</option>
              <option value="npm" className="bg-slate-900">npm (JavaScript / TS)</option>
              <option value="maven" className="bg-slate-900">Maven / Gradle (Java)</option>
              <option value="go" className="bg-slate-900">Go</option>
              <option value="cargo" className="bg-slate-900">Rust (Cargo)</option>
              <option value="native" className="bg-slate-900">C / C++ Native</option>
            </select>
          </div>

          {/* Quantum Risk filter */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/8">
            <span className="text-[11px] text-slate-400 font-medium">Threat:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Risks</option>
              <option value="VULNERABLE" className="bg-slate-900 text-rose-400">Quantum Vulnerable</option>
              <option value="DEGRADED" className="bg-slate-900 text-amber-400">Grover Degraded</option>
              <option value="SAFE" className="bg-slate-900 text-cyan-400">Quantum Resilient</option>
              <option value="POST_QUANTUM" className="bg-slate-900 text-emerald-400">Post-Quantum</option>
            </select>
          </div>

          {/* PQC status filter */}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/8">
            <span className="text-[11px] text-slate-400 font-medium">PQC Status:</span>
            <select
              value={selectedPqcStatus}
              onChange={(e) => setSelectedPqcStatus(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All PQC Statuses</option>
              <option value="SUPPORTED" className="bg-slate-900 text-emerald-400">Supported</option>
              <option value="EXPERIMENTAL" className="bg-slate-900 text-cyan-400">Experimental</option>
              <option value="REQUIRES_UPGRADE" className="bg-slate-900 text-amber-400">Upgrade Required</option>
              <option value="UNSUPPORTED" className="bg-slate-900 text-slate-400">Unsupported</option>
            </select>
          </div>

          {/* Direct only toggle */}
          <button
            onClick={() => setDirectOnly(!directOnly)}
            className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] transition-all ${
              directOnly
                ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300 font-bold'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Direct Only
          </button>

          {/* Active in code toggle */}
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] transition-all ${
              activeOnly
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Active in Code Only
          </button>

          {/* Reset Filters */}
          {(selectedEcosystem !== 'all' || selectedRisk !== 'all' || selectedPqcStatus !== 'all' || directOnly || activeOnly || searchQuery) && (
            <button
              onClick={() => {
                setSelectedEcosystem('all');
                setSelectedRisk('all');
                setSelectedPqcStatus('all');
                setDirectOnly(false);
                setActiveOnly(false);
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}

      {/* ── VIEW 1: DEPENDENCY INVENTORY ── */}
      {activeView === 'inventory' && (
        <div className="space-y-4">
          {filteredDependencies.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-white/5 space-y-3">
              <Boxes className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No cryptographic dependencies match your filter</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try loosening your filters or search query to view all discovered project packages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredDependencies.map((dep, idx) => {
                const eco = getEcosystemBadge(dep.ecosystem);
                const qRisk = getQuantumBadge(dep.quantum_risk);
                const pqc = getPqcBadge(dep.pqc_support_status);
                const isSelected = selectedDep?.package_name === dep.package_name && selectedDep?.manifest_path === dep.manifest_path;

                return (
                  <div
                    key={`${dep.package_name}-${dep.manifest_path}-${idx}`}
                    className={`glass-card p-5 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Identity and manifest */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${eco.color}`}>
                            {eco.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            dep.direct ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {dep.direct ? 'DIRECT' : 'TRANSITIVE'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 ${
                            dep.active_in_code ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                          }`}>
                            {dep.active_in_code ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                            <span>{dep.active_in_code ? 'ACTIVE IN CODE' : 'DECLARED ONLY'}</span>
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <h4 className="text-base font-black text-white font-mono tracking-tight">{dep.package_name}</h4>
                          <span className="text-xs font-mono text-cyan-400 font-semibold">
                            {dep.version && dep.version !== 'any' ? `v${dep.version}` : 'any version'}
                          </span>
                          <span className="text-xs text-slate-400 truncate max-w-md font-sans">
                            — {dep.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span className="text-slate-500">Manifest:</span>
                          <span className="text-slate-300 truncate">{dep.manifest_path}</span>
                        </div>
                      </div>

                      {/* Right: Badges & Details Action */}
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border flex items-center gap-1.5 ${qRisk.color}`}>
                          <qRisk.icon className="w-3.5 h-3.5" />
                          <span>{qRisk.label}</span>
                        </span>

                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border ${pqc.color}`}>
                          {pqc.label}
                        </span>

                        <button
                          onClick={() => setSelectedDep(isSelected ? null : dep)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1 transition-all"
                        >
                          <span>{isSelected ? 'Hide Details' : 'View Mapping'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Associated Primitives Pills */}
                    {dep.associated_algorithms && dep.associated_algorithms.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Associated Primitives:</span>
                        {dep.associated_algorithms.map(algo => (
                          <span
                            key={algo}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                              algo.toUpperCase() in { RSA: 1, ECC: 1, ECDSA: 1, ECDH: 1 }
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                            }`}
                          >
                            {algo}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Inspection Drawer */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in duration-200">
                        {/* PQC capability details */}
                        <div className="glass-panel p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>Post-Quantum Capability Assessment</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {dep.pqc_details || 'No post-quantum evaluation documented for this package version.'}
                          </p>
                          {dep.recommended_upgrade && (
                            <div className="mt-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/30">
                              <span className="font-bold text-cyan-200">Recommended Action: </span>
                              {dep.recommended_upgrade}
                            </div>
                          )}
                        </div>

                        {/* Associated Source Code Occurrences */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Associated Findings in Source Code ({dep.associated_findings?.length ?? 0})</span>
                            </span>
                          </div>

                          {dep.associated_findings && dep.associated_findings.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {dep.associated_findings.map((finding, fIdx) => (
                                <div
                                  key={fIdx}
                                  onClick={() => onSelectFileFinding?.(finding.file_path, finding.line_number)}
                                  className="p-3 rounded-xl bg-white/5 border border-white/8 hover:border-indigo-500/40 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-mono font-bold text-white group-hover:text-indigo-300 transition-colors">
                                      {finding.variant || finding.algorithm}
                                    </span>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                      finding.quantum_risk === 'VULNERABLE' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                    }`}>
                                      {finding.quantum_risk}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate flex items-center justify-between">
                                    <span>{finding.file_path}:{finding.line_number || 1}</span>
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-white/5">
                              No active source-code occurrences detected for this package in this audit.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: INTERACTIVE RELATIONSHIP GRAPH ── */}
      {activeView === 'graph' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitFork className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-white">Cryptographic Supply-Chain Graph</h3>
                <p className="text-[11px] text-slate-400">
                  Tracing supply-chain hierarchy: Project → Package → Algorithm → Finding
                </p>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/8">
              <button
                onClick={() => setGraphZoom(prev => Math.max(0.6, prev - 0.15))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 px-2">
                {Math.round(graphZoom * 100)}%
              </span>
              <button
                onClick={() => setGraphZoom(prev => Math.min(1.6, prev + 0.15))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGraphZoom(1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-mono px-2"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Graph Canvas */}
          {!graphLayout ? (
            <div className="glass-card p-16 text-center rounded-2xl border border-white/8 space-y-3">
              <Boxes className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Graph data unavailable</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No dependency relationships were formed for this scan.
              </p>
            </div>
          ) : (
            <div className="glass-panel p-4 rounded-2xl overflow-x-auto overflow-y-hidden border border-white/10 relative">
              {/* Graph Legend */}
              <div className="absolute top-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[11px] space-y-1.5 shadow-xl">
                <div className="font-bold text-slate-300 mb-1">Node Legend</div>
                <div className="flex items-center gap-2 text-rose-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <span>Quantum Vulnerable (Shor)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span>Degraded (Grover)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span>Post-Quantum / Safe</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  <span>Package / Project</span>
                </div>
              </div>

              <div
                style={{
                  transform: `scale(${graphZoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <svg
                  width={graphLayout.width}
                  height={graphLayout.height}
                  className="overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="linkGradientVulnerable" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="linkGradientSafe" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="linkGradientDefault" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#475569" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#64748b" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>

                  {/* Draw Curved Links */}
                  {graphLayout.links.map((link, lIdx) => {
                    const src = graphLayout.nodePositions[link.source];
                    const tgt = graphLayout.nodePositions[link.target];
                    if (!src || !tgt) return null;

                    const midX = (src.x + tgt.x) / 2;
                    const pathD = `M ${src.x} ${src.y} C ${midX} ${src.y}, ${midX} ${tgt.y}, ${tgt.x} ${tgt.y}`;

                    const strokeGrad = link.quantum_risk === 'VULNERABLE'
                      ? 'url(#linkGradientVulnerable)'
                      : link.quantum_risk === 'POST_QUANTUM' || link.quantum_risk === 'SAFE'
                      ? 'url(#linkGradientSafe)'
                      : 'url(#linkGradientDefault)';

                    return (
                      <path
                        key={`link-${lIdx}`}
                        d={pathD}
                        fill="none"
                        stroke={strokeGrad}
                        strokeWidth="2"
                        strokeDasharray={link.relationship === 'resolves_transitive' ? '4 3' : undefined}
                        className="transition-all hover:stroke-white hover:stroke-[3px]"
                      />
                    );
                  })}

                  {/* Draw Nodes */}
                  {graphLayout.nodes.map((node) => {
                    const pos = graphLayout.nodePositions[node.id];
                    if (!pos) return null;

                    const isSelected = selectedGraphNode?.id === node.id;
                    const isVulnerable = node.quantum_risk === 'VULNERABLE';
                    const isSafe = node.quantum_risk === 'POST_QUANTUM' || node.quantum_risk === 'SAFE';

                    const nodeFill = node.type === 'project'
                      ? '#4f46e5'
                      : node.type === 'package'
                      ? '#0284c7'
                      : isVulnerable
                      ? '#e11d48'
                      : isSafe
                      ? '#059669'
                      : '#d97706';

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedGraphNode(isSelected ? null : node)}
                        className="cursor-pointer group"
                      >
                        {/* Glow halo on hover or select */}
                        <circle
                          r={node.type === 'project' ? 24 : node.type === 'package' ? 18 : 14}
                          fill={nodeFill}
                          opacity={isSelected ? 0.4 : 0.15}
                          className="transition-all group-hover:opacity-40"
                        />

                        {/* Node circle */}
                        <circle
                          r={node.type === 'project' ? 16 : node.type === 'package' ? 12 : 9}
                          fill={nodeFill}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 3 : 1.5}
                          strokeOpacity={isSelected ? 1 : 0.6}
                          className="transition-transform group-hover:scale-110"
                        />

                        {/* Node Text Label */}
                        <text
                          x="0"
                          y={node.type === 'project' ? 32 : 24}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize={node.type === 'finding' ? '10' : '11'}
                          fontFamily="monospace"
                          fontWeight={node.type === 'package' ? 'bold' : 'normal'}
                          className="drop-shadow-md pointer-events-none"
                        >
                          {node.label.length > 24 ? node.label.slice(0, 22) + '...' : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Node Inspector Drawer */}
              {selectedGraphNode && (
                <div className="absolute bottom-4 left-4 z-20 max-w-md w-full glass-card p-4 rounded-xl border border-indigo-500/40 bg-slate-950/95 shadow-2xl space-y-2 animate-in slide-in-from-bottom duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      {selectedGraphNode.type} Node Details
                    </span>
                    <button
                      onClick={() => setSelectedGraphNode(null)}
                      className="text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">{selectedGraphNode.label}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400">Quantum Risk: </span>
                      <span className={`font-mono font-bold ${
                        selectedGraphNode.quantum_risk === 'VULNERABLE' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {selectedGraphNode.quantum_risk}
                      </span>
                    </div>
                    {selectedGraphNode.ecosystem && (
                      <div>
                        <span className="text-slate-400">Ecosystem: </span>
                        <span className="font-mono text-cyan-300">{selectedGraphNode.ecosystem}</span>
                      </div>
                    )}
                    {selectedGraphNode.file_path && (
                      <div className="col-span-2 truncate">
                        <span className="text-slate-400">File: </span>
                        <span className="font-mono text-slate-300">{selectedGraphNode.file_path}:{selectedGraphNode.line_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 3: MIGRATION IMPACT ANALYSIS ── */}
      {activeView === 'impact' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-black text-white">Dependency-Level Post-Quantum Migration Impact</h3>
              <p className="text-[11px] text-slate-400">
                Actionable refactoring complexity and library upgrade recommendations per affected dependency.
              </p>
            </div>
          </div>

          {migrationImpact.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-white/5 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No dependency migration friction detected</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All identified cryptographic libraries either support post-quantum cryptography or are only utilized for quantum-safe symmetric ciphers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {migrationImpact.map((item, idx) => {
                const comp = getComplexityBadge(item.migration_complexity);
                const qRisk = getQuantumBadge(item.quantum_risk);

                return (
                  <div
                    key={`${item.package_name}-${idx}`}
                    className="glass-card p-5 rounded-2xl border border-white/8 hover:border-white/20 transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${comp.color}`}>
                            {comp.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${qRisk.color}`}>
                            {qRisk.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.ecosystem?.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white font-mono">
                          {item.package_name} <span className="text-xs text-cyan-400 font-normal">v{item.current_version}</span>
                        </h4>
                      </div>

                      <div className="text-right sm:shrink-0 text-xs text-slate-400">
                        <span className="font-bold text-white">{item.affected_files_count}</span> source file(s) affected
                      </div>
                    </div>

                    {/* Complexity Reason */}
                    <div className="text-xs text-slate-300 leading-relaxed font-sans bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="font-bold text-indigo-300">Assessment: </span>
                      {item.complexity_reason}
                    </div>

                    {/* Recommended Action */}
                    <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-cyan-200">Recommended Action: </span>
                        {item.recommended_action}
                      </div>
                    </div>

                    {/* Affected Files List */}
                    {item.affected_files && item.affected_files.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                        <span className="text-slate-500">Refactoring Scope:</span>
                        {item.affected_files.map((file, fIdx) => (
                          <span
                            key={fIdx}
                            onClick={() => onSelectFileFinding?.(file)}
                            className="px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-indigo-300 hover:bg-white/10 cursor-pointer transition-colors"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
