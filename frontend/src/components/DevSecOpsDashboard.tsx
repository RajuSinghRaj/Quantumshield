import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, AlertCircle,
  FileText, Download, Play, RefreshCw, Copy, Check, Terminal,
  Sliders, Filter, ExternalLink, Code, Layers, FileCode, Clock,
  ChevronRight, ChevronDown, Info
} from 'lucide-react';
import {
  DevSecOpsPolicy, SecurityAssessment, GateEvaluationResult,
  PolicyViolationItem, PolicyCategory, GateEnforcementMode, GateStatus
} from '../types/scan';
import {
  fetchDevSecOpsPolicies, updateDevSecOpsPolicy, evaluateDevSecOps,
  getDevSecOpsReportUrl, getDevSecOpsCbomUrl
} from '../services/api';

interface DevSecOpsDashboardProps {
  scanId?: string;
  projectName?: string;
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const DevSecOpsDashboard: React.FC<DevSecOpsDashboardProps> = ({
  scanId: initialScanId,
  projectName = 'Cryptographic Repository Audit',
  onSelectFileFinding
}) => {
  const [activeTab, setActiveTab] = useState<'verdict' | 'policies' | 'violations' | 'cicd'>('verdict');
  const [scanId, setScanId] = useState<string>(initialScanId || '');
  const [policies, setPolicies] = useState<DevSecOpsPolicy[]>([]);
  const [assessment, setAssessment] = useState<SecurityAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialScanId) {
      setScanId(initialScanId);
    }
  }, [initialScanId]);

  // Load policies and evaluate gate for current scan on mount
  useEffect(() => {
    loadPoliciesAndEvaluate();
  }, [scanId]);

  const loadPoliciesAndEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const pols = await fetchDevSecOpsPolicies(true);
      setPolicies(pols);

      let effectiveScanId = scanId;
      if (!effectiveScanId) {
        // Fallback to latest history or demo
        try {
          const hist = await (await import('../services/api')).fetchScanHistory();
          if (hist && hist.length > 0) {
            effectiveScanId = hist[0].id;
            setScanId(effectiveScanId);
          } else {
            const demo = await (await import('../services/api')).scanDemoProject('legacy_bank');
            effectiveScanId = demo.scan_id;
            setScanId(effectiveScanId);
          }
        } catch {
          // ignore
        }
      }

      if (effectiveScanId) {
        const res = await evaluateDevSecOps({ scan_id: effectiveScanId, project_name: projectName });
        setAssessment(res);
      }
    } catch (err: any) {
      console.error('Error loading DevSecOps data:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to evaluate DevSecOps security gate.');
    } finally {
      setLoading(false);
    }
  };

  const handleReevaluate = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const targetScanId = scanId;
      if (targetScanId) {
        const res = await evaluateDevSecOps({ scan_id: targetScanId, project_name: projectName });
        setAssessment(res);
      }
    } catch (err: any) {
      console.error('Error re-evaluating gate:', err);
      setError(err?.response?.data?.detail || err.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleTogglePolicy = async (policy: DevSecOpsPolicy) => {
    try {
      const updated = await updateDevSecOpsPolicy(policy.id, { enabled: !policy.enabled });
      setPolicies(prev => prev.map(p => p.id === updated.id ? updated : p));
      // Re-evaluate gate with updated policy
      handleReevaluate();
    } catch (err: any) {
      console.error('Failed to toggle policy:', err);
      alert(err?.response?.data?.detail || 'Could not update policy');
    }
  };

  const handleEnforcementChange = async (policy: DevSecOpsPolicy, enforcement: GateEnforcementMode) => {
    try {
      const updated = await updateDevSecOpsPolicy(policy.id, { enforcement });
      setPolicies(prev => prev.map(p => p.id === updated.id ? updated : p));
      // Re-evaluate gate
      handleReevaluate();
    } catch (err: any) {
      console.error('Failed to update enforcement mode:', err);
      alert(err?.response?.data?.detail || 'Could not update enforcement mode');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const gateResult: GateEvaluationResult | undefined = assessment?.gate_result;

  const getStatusBadge = (status?: GateStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>GATE PASS</span>
          </div>
        );
      case 'PASS_WITH_WARNINGS':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono font-bold text-xs tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>PASS WITH WARNINGS</span>
          </div>
        );
      case 'MANUAL_REVIEW_REQUIRED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-400 font-mono font-bold text-xs tracking-wider">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <span>MANUAL REVIEW REQUIRED</span>
          </div>
        );
      case 'FAIL':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 font-mono font-bold text-xs tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>GATE FAILED (BLOCKING)</span>
          </div>
        );
    }
  };

  const getCategoryColor = (cat: PolicyCategory) => {
    switch (cat) {
      case 'CLASSICAL_CRYPTOGRAPHY':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'QUANTUM_SECURITY':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'SUPPLY_CHAIN_DEPENDENCY':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'CBOM_COMPLIANCE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const filteredPolicies = policies.filter(p => {
    if (categoryFilter === 'ALL') return true;
    return p.category === categoryFilter;
  });

  const githubActionsCode = `name: QuantumShield DevSecOps Gate

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  cryptographic-security-gate:
    name: Evaluate Cryptographic Security & CBOM
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install QuantumShield CLI
        run: |
          pip install --upgrade pip
          pip install -r backend/requirements.txt || true

      - name: Run Cryptographic Security Gate
        env:
          QUANTUMSHIELD_API_URL: \${{ secrets.QUANTUMSHIELD_API_URL || 'http://localhost:8000/api' }}
        run: |
          python backend/quantumshield_cli.py devsecops evaluate . \\
            --policy quantumshield.yml \\
            --cbom-out cbom.json \\
            --json \\
            --output security-assessment.json
`;

  const azurePipelinesCode = `trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: '3.11'
  displayName: 'Use Python 3.11'

- script: |
    python -m pip install --upgrade pip
    pip install -r backend/requirements.txt
  displayName: 'Install Dependencies'

- script: |
    python backend/quantumshield_cli.py devsecops evaluate . \\
      --policy quantumshield.yml \\
      --cbom-out $(Build.ArtifactStagingDirectory)/cbom.json \\
      --json \\
      --output $(Build.ArtifactStagingDirectory)/assessment.json
  displayName: 'Run QuantumShield Security Gate'
  env:
    QUANTUMSHIELD_API_URL: $(QUANTUMSHIELD_API_URL)
`;

  const cliUsageCode = `# 1. Validate your project security policy
python backend/quantumshield_cli.py policy check --policy quantumshield.yml

# 2. Evaluate project files against DevSecOps Gate
python backend/quantumshield_cli.py devsecops evaluate . \\
  --policy quantumshield.yml \\
  --cbom-out cbom.json \\
  --output assessment.json

# Exit codes:
#   0 = PASS or PASS_WITH_WARNINGS
#   1 = FAIL (Blocking policy violations or threshold breach)
#   2 = MANUAL_REVIEW_REQUIRED
#   3 = System execution error
`;

  return (
    <div className="space-y-6 text-white">
      {/* ── Sub Navigation Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl tidewell-glass-card border border-white/[0.12] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center shrink-0">
            <Terminal className="w-6 h-6 text-[#f04438]" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-white flex items-center gap-2.5">
              <span>DevSecOps Cryptographic Security Gate</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/80 font-bold text-[10px] font-mono tracking-wider">CI/CD ENFORCEMENT</span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-light">
              Deterministic cryptographic policy enforcement, CBOM verification & automated PR blocking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {gateResult && getStatusBadge(gateResult.pipeline_status)}

          <button
            onClick={handleReevaluate}
            disabled={evaluating}
            className="px-4 py-2 rounded-full text-xs font-medium font-mono border border-white/[0.12] bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#f04438] ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating...' : 'Re-evaluate Gate'}</span>
          </button>

          {assessment && (
            <>
              <a
                href={getDevSecOpsReportUrl(assessment.assessment_id)}
                download={`SecurityGate_Report_${assessment.assessment_id.slice(0, 8)}.md`}
                className="px-4 py-2 rounded-full text-xs font-mono font-medium border border-white/[0.12] bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-1.5"
                title="Download Markdown Report"
              >
                <Download className="w-3.5 h-3.5 text-[#f04438]" />
                <span>Report (.md)</span>
              </a>
              <a
                href={getDevSecOpsCbomUrl(assessment.assessment_id)}
                download={`CBOM_${assessment.assessment_id.slice(0, 8)}.json`}
                className="px-4 py-2 rounded-full text-xs font-mono font-medium border border-white/[0.12] bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-1.5"
                title="Download CycloneDX CBOM"
              >
                <FileText className="w-3.5 h-3.5 text-[#f04438]" />
                <span>CBOM (.json)</span>
              </a>
            </>
          )}
        </div>
      </div>

      {loading && !assessment && (
        <div className="p-10 rounded-3xl tidewell-glass-card border border-white/[0.12] flex flex-col items-center justify-center space-y-3 text-center shadow-xl">
          <RefreshCw className="w-8 h-8 text-[#f04438] animate-spin" />
          <p className="text-sm text-white font-medium font-mono">Evaluating DevSecOps Security Gate & Loading Policies...</p>
          <p className="text-xs text-white/50 font-light">Checking 16 cryptographic policy rules, CBOM compliance, and gate thresholds.</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Subtabs ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
        {[
          { id: 'verdict' as const, label: 'Gate Verdict & Summary', icon: ShieldCheck, count: gateResult?.threshold_failures?.length ?? 0 },
          { id: 'policies' as const, label: 'Security Policy Manager (16 Rules)', icon: Sliders, count: policies?.length ?? 0 },
          { id: 'violations' as const, label: 'Violations & Evidence', icon: AlertTriangle, count: (gateResult?.blocking_violations?.length || 0) + (gateResult?.advisory_warnings?.length || 0) },
          { id: 'cicd' as const, label: 'CI/CD Pipeline Setup', icon: Code, count: undefined }
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === id
                ? 'tidewell-coral-pill text-white font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                count > 0 ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/30' : 'bg-white/[0.08] text-white/60'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Gate Verdict & Summary ── */}
      {activeTab === 'verdict' && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div className="tidewell-glass-card p-6 rounded-3xl border border-white/[0.12] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1">
                  Evaluation Outcome
                </div>
                <div className="text-2xl font-bold text-white font-mono flex items-center gap-3">
                  <span>{gateResult?.pipeline_status}</span>
                  {gateResult && getStatusBadge(gateResult.pipeline_status)}
                </div>
              </div>

              {assessment?.evaluated_at && (
                <div className="text-right text-xs text-white/50 font-mono">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-[#f04438]" />
                    <span>Evaluated: {new Date(assessment.evaluated_at).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    Assessment ID: {assessment.assessment_id.slice(0, 12)}...
                  </div>
                </div>
              )}
            </div>

            {gateResult?.summary && (
              <p className="text-sm text-white/80 bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] font-mono leading-relaxed">
                {gateResult.summary}
              </p>
            )}

            {/* Threshold Failures */}
            {gateResult && (gateResult?.threshold_failures?.length ?? 0) > 0 && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 space-y-2">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Pipeline Gate Failed on Thresholds:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-200 font-mono">
                  {gateResult?.threshold_failures?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Key Gate Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="tidewell-glass-subcard rounded-3xl p-5 border border-white/[0.08] shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Blocking Violations</div>
              <div className="text-3xl font-black text-rose-400 font-mono mt-1">
                {gateResult?.blocking_violations?.length ?? 0}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Blocks build/PR</div>
            </div>

            <div className="tidewell-glass-subcard rounded-3xl p-5 border border-white/[0.08] shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Advisory Warnings</div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {gateResult?.advisory_warnings?.length ?? 0}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Non-blocking warnings</div>
            </div>

            <div className="tidewell-glass-subcard rounded-3xl p-5 border border-white/[0.08] shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Manual Reviews</div>
              <div className="text-3xl font-black text-indigo-300 font-mono mt-1">
                {gateResult?.manual_reviews?.length ?? 0}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Requires audit sign-off</div>
            </div>

            <div className="tidewell-glass-subcard rounded-3xl p-5 border border-white/[0.08] shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Exceptions Applied</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {gateResult?.exceptions_applied?.length ?? 0}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Approved exceptions</div>
            </div>
          </div>

          {/* Thresholds Evaluated Grid */}
          <div className="tidewell-glass-card p-6 rounded-3xl border border-white/[0.12] space-y-4 shadow-xl">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#f04438]" />
              <span>Gate Threshold Criteria</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(() => {
                const getThresholdInfo = (key: string, defaultMax: any) => {
                  const item = (gateResult?.thresholds_evaluated as any)?.[key];
                  if (item && typeof item === 'object') {
                    return {
                      max: String(item.threshold ?? defaultMax),
                      actual: String(item.actual ?? 0),
                      passed: Boolean(item.passed),
                    };
                  }
                  return {
                    max: String(defaultMax),
                    actual: '0',
                    passed: true,
                  };
                };

                const thresholdItems = [
                  { label: 'Max Critical Findings', ...getThresholdInfo('max_critical_findings', 0) },
                  { label: 'Max High Findings', ...getThresholdInfo('max_high_findings', 3) },
                  { label: 'Max Quantum Risk', ...getThresholdInfo('max_quantum_risk_score', 85) },
                  { label: 'Max Classical Risk', ...getThresholdInfo('max_classical_risk_score', 75) },
                  { label: 'Min Quantum Readiness', ...getThresholdInfo('min_quantum_readiness_score', 15) },
                  { label: 'Require CBOM Artifact', ...getThresholdInfo('require_cbom', 'Required') },
                  { label: 'Allow Warnings', max: 'Allowed', actual: (gateResult?.advisory_warnings?.length ?? 0) > 0 ? 'Warning' : 'None', passed: true },
                  { label: 'Block Unverified PQC', max: 'Enabled', actual: 'Active', passed: true },
                ];

                return thresholdItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl tidewell-glass-subcard border border-white/[0.08] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/70 font-medium">{item.label}</span>
                      <span className={`w-2 h-2 rounded-full ${item.passed ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    </div>
                    <div className="flex items-center justify-between mt-2 font-mono text-[11px]">
                      <span className="text-white/40">Threshold: <span className="text-white font-bold">{item.max}</span></span>
                      <span className={item.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        Actual: {item.actual}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Security Policy Manager ── */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {/* Category Filter bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1 mr-2">
                <Filter className="w-3.5 h-3.5 text-orange-500" /> Category:
              </span>
              {[
                { id: 'ALL', label: 'All Categories' },
                { id: 'CLASSICAL_CRYPTOGRAPHY', label: 'Classical Crypto' },
                { id: 'QUANTUM_SECURITY', label: 'Quantum Security' },
                { id: 'SUPPLY_CHAIN_DEPENDENCY', label: 'Supply Chain' },
                { id: 'CBOM_COMPLIANCE', label: 'CBOM Compliance' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCategoryFilter(id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                    categoryFilter === id
                      ? 'bg-orange-600 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Showing {filteredPolicies.length} of {policies.length} policies
            </div>
          </div>

          {/* Policies Table */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-orange-100 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Policy Rule</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Enforcement Mode</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredPolicies.map(pol => (
                    <tr key={pol.id} className="hover:bg-orange-50/30 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePolicy(pol)}
                          className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                            pol.enabled ? 'bg-orange-600' : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                          title={pol.enabled ? 'Enabled - Click to disable' : 'Disabled - Click to enable'}
                        >
                          <div
                            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                              pol.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-50 text-xs">{pol.name}</div>
                        <div className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 line-clamp-1">{pol.description}</div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">ID: {pol.id}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono ${getCategoryColor(pol.category)}`}>
                          {pol.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold ${
                          pol.severity === 'BLOCKING' || pol.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : pol.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {pol.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={pol.enforcement}
                          onChange={(e) => handleEnforcementChange(pol, e.target.value as GateEnforcementMode)}
                          className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-orange-500"
                        >
                          <option value="BLOCKING_FAILURE">BLOCKING_FAILURE</option>
                          <option value="ADVISORY_WARNING">ADVISORY_WARNING</option>
                          <option value="MANUAL_REVIEW_REQUIRED">MANUAL_REVIEW_REQUIRED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {pol.is_builtin ? (
                          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Built-in</span>
                        ) : (
                          <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold">Custom</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Violations & Evidence ── */}
      {activeTab === 'violations' && (
        <div className="space-y-6">
          {/* Blocking Violations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Blocking Violations ({gateResult?.blocking_violations?.length ?? 0})</span>
            </h3>

            {(gateResult?.blocking_violations?.length ?? 0) === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="font-semibold">No blocking violations detected in this scan! All evaluated policy gates passed.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {gateResult?.blocking_violations?.map((v, i) => (
                  <div key={i} className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                          {v.rule_id}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-50 text-sm">{v.rule_name}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryColor(v.category)}`}>
                        {v.category}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{v.message}</p>

                    {v.evidence && (
                      <div className="bg-stone-950 p-3 rounded-2xl font-mono text-[11px] text-rose-300 border border-stone-800 overflow-x-auto">
                        <code>{v.evidence}</code>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                      {v.file_path && (
                        <button
                          onClick={() => onSelectFileFinding?.(v.file_path!, v.line_number)}
                          className="text-orange-600 dark:text-orange-400 hover:underline font-mono text-[11px] flex items-center gap-1.5"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>{v.file_path}{v.line_number ? `:${v.line_number}` : ''}</span>
                        </button>
                      )}

                      {v.remediation_guidance && (
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                          Remediation: {v.remediation_guidance}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advisory Warnings */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Advisory Warnings ({gateResult?.advisory_warnings?.length ?? 0})</span>
            </h3>

            {(gateResult?.advisory_warnings?.length ?? 0) === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-xs">
                No advisory warnings for this assessment.
              </div>
            ) : (
              <div className="space-y-3">
                {gateResult?.advisory_warnings?.map((v, i) => (
                  <div key={i} className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          {v.rule_id}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-50 text-sm">{v.rule_name}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryColor(v.category)}`}>
                        {v.category}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{v.message}</p>

                    {v.evidence && (
                      <div className="bg-stone-950 p-3 rounded-2xl font-mono text-[11px] text-amber-300 border border-stone-800 overflow-x-auto">
                        <code>{v.evidence}</code>
                      </div>
                    )}

                    {v.file_path && (
                      <button
                        onClick={() => onSelectFileFinding?.(v.file_path!, v.line_number)}
                        className="text-orange-600 dark:text-orange-400 hover:underline font-mono text-[11px] flex items-center gap-1.5"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{v.file_path}{v.line_number ? `:${v.line_number}` : ''}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 4: CI/CD Pipeline Setup ── */}
      {activeTab === 'cicd' && (
        <div className="space-y-6">
          {/* GitHub Actions */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-100 dark:border-stone-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                  GH
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">GitHub Actions Workflow</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">.github/workflows/quantumshield-security.yml</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(githubActionsCode, 'gh')}
                className="px-4 py-2 rounded-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-orange-400 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-all shadow-xs"
              >
                {copiedKey === 'gh' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
                <span>{copiedKey === 'gh' ? 'Copied!' : 'Copy YAML'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 overflow-x-auto leading-relaxed">
              {githubActionsCode}
            </pre>
          </div>

          {/* Azure Pipelines */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-100 dark:border-stone-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                  AZ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">Azure DevOps Pipelines</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">azure-pipelines.yml</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(azurePipelinesCode, 'az')}
                className="px-4 py-2 rounded-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-orange-400 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-all shadow-xs"
              >
                {copiedKey === 'az' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
                <span>{copiedKey === 'az' ? 'Copied!' : 'Copy YAML'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 overflow-x-auto leading-relaxed">
              {azurePipelinesCode}
            </pre>
          </div>

          {/* Developer CLI Commands */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-100 dark:border-stone-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                  <Terminal className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">QuantumShield Developer CLI</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">Local pre-commit / terminal commands</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(cliUsageCode, 'cli')}
                className="px-4 py-2 rounded-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-orange-400 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-all shadow-xs"
              >
                {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
                <span>{copiedKey === 'cli' ? 'Copied!' : 'Copy Shell'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-orange-400 overflow-x-auto leading-relaxed">
              {cliUsageCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

