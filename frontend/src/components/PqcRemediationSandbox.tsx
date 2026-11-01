import React, { useState, useEffect } from 'react';
import {
  Sparkles, Wrench, Play, CheckCircle2, XCircle, AlertTriangle,
  FileCode, Layers, ShieldCheck, ShieldAlert, Clock, ArrowRight,
  RefreshCw, Check, X, Lock, Key, Copy, Eye, Terminal, Cpu
} from 'lucide-react';
import {
  CodeRemediationProposal, RemediationComparison, HybridDemoResult, CryptographicAsset
} from '../types/scan';
import {
  fetchRemediationProposals, applyRemediationPatch, rejectRemediationPatch,
  rescanSandboxProject, runHybridDemo, fetchHybridComparison
} from '../services/api';

interface PqcRemediationSandboxProps {
  scanId: string;
  projectName: string;
  findings: CryptographicAsset[];
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const PqcRemediationSandbox: React.FC<PqcRemediationSandboxProps> = ({
  scanId,
  projectName,
  findings,
  onSelectFileFinding
}) => {
  const [activeTab, setActiveTab] = useState<'remediation' | 'sandbox' | 'comparison' | 'hybrid-lab'>('remediation');
  
  // Remediation Proposals State
  const [proposals, setProposals] = useState<CodeRemediationProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<CodeRemediationProposal | null>(null);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [applyingFindingId, setApplyingFindingId] = useState<string | number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sandbox & Comparison State
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState<number>(0);
  const [isRescanning, setIsRescanning] = useState(false);
  const [comparison, setComparison] = useState<RemediationComparison | null>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);

  // Hybrid Lab State
  const [hybridMessage, setHybridMessage] = useState('Confidential financial transaction authorized for post-quantum transmission.');
  const [hybridAad, setHybridAad] = useState('QuantumShield-Session-Audit-Context-2026');
  const [simulateTamper, setSimulateTamper] = useState(true);
  const [isRunningHybridDemo, setIsRunningHybridDemo] = useState(false);
  const [hybridResult, setHybridResult] = useState<HybridDemoResult | null>(null);
  const [kexComparisons, setKexComparisons] = useState<Record<string, any> | null>(null);

  // Load Initial Remediation Proposals
  useEffect(() => {
    let isMounted = true;
    const loadProposals = async () => {
      setIsLoadingProposals(true);
      try {
        const data = await fetchRemediationProposals(scanId);
        if (isMounted) {
          setProposals(data.proposals || []);
          if (data.proposals && data.proposals.length > 0) {
            setSelectedProposal(data.proposals[0]);
          }
          if (data.comparison) {
            setComparison(data.comparison);
            setAuditTrail(data.comparison.audit_trail || []);
          }
          if (data.applied_patches) {
            setAppliedCount(data.applied_patches.length);
          }
        }
      } catch (err: any) {
        console.error('Failed to load remediation proposals:', err);
      } finally {
        if (isMounted) setIsLoadingProposals(false);
      }
    };

    loadProposals();
    return () => { isMounted = false; };
  }, [scanId]);

  // Load Hybrid Modes Comparison on mount
  useEffect(() => {
    let isMounted = true;
    fetchHybridComparison()
      .then(res => { if (isMounted) setKexComparisons(res); })
      .catch(err => console.error('Failed to load hybrid comparison:', err));
    return () => { isMounted = false; };
  }, []);

  const handleApplyPatch = async (prop: CodeRemediationProposal) => {
    setApplyingFindingId(prop.finding_id || prop.file_path);
    setFeedback(null);
    try {
      const res = await applyRemediationPatch(scanId, {
        file_path: prop.file_path,
        line_number: prop.line_number,
        finding: prop
      });

      if (res.success) {
        setSandboxId(res.sandbox_id);
        setAppliedCount(res.applied_count || (appliedCount + 1));
        
        // Update proposal status in state
        setProposals(prev => prev.map(p => 
          (p.file_path === prop.file_path && p.line_number === prop.line_number)
            ? { ...p, status: 'ACCEPTED' }
            : p
        ));
        if (selectedProposal && selectedProposal.file_path === prop.file_path) {
          setSelectedProposal({ ...selectedProposal, status: 'ACCEPTED' });
        }

        setFeedback({ message: res.message || 'Patch applied to sandbox workspace.', type: 'success' });
      } else {
        setFeedback({ message: res.message || 'Manual engineering required.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.detail || err.message || 'Failed to apply patch.', type: 'error' });
    } finally {
      setApplyingFindingId(null);
    }
  };

  const handleRejectPatch = async (prop: CodeRemediationProposal) => {
    try {
      await rejectRemediationPatch(scanId, {
        file_path: prop.file_path,
        finding_id: prop.finding_id
      });
      setProposals(prev => prev.map(p => 
        (p.file_path === prop.file_path && p.line_number === prop.line_number)
          ? { ...p, status: 'REJECTED' }
          : p
      ));
      if (selectedProposal && selectedProposal.file_path === prop.file_path) {
        setSelectedProposal({ ...selectedProposal, status: 'REJECTED' });
      }
      setFeedback({ message: `Patch for '${prop.file_path}' marked as rejected.`, type: 'success' });
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to record rejection.', type: 'error' });
    }
  };

  const handleRescanSandbox = async () => {
    setIsRescanning(true);
    setFeedback(null);
    try {
      const res = await rescanSandboxProject(scanId);
      if (res.success && res.comparison) {
        setComparison(res.comparison);
        setAuditTrail(res.comparison.audit_trail || []);
        setActiveTab('comparison');
        setFeedback({ message: 'Sandbox project successfully rescanned! Before-and-after comparison updated.', type: 'success' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.detail || err.message || 'Rescan failed.', type: 'error' });
    } finally {
      setIsRescanning(false);
    }
  };

  const handleRunHybridLab = async () => {
    setIsRunningHybridDemo(true);
    try {
      const res = await runHybridDemo({
        message: hybridMessage,
        associated_data: hybridAad,
        simulate_tamper: simulateTamper
      });
      setHybridResult(res);
    } catch (err: any) {
      console.error('Hybrid lab run failed:', err);
    } finally {
      setIsRunningHybridDemo(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Sub-navigation Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">PQC Migration & Hybrid Cryptography</h2>
            <p className="text-xs text-slate-400">Context-aware code remediation, sandbox validation & executable hybrid demonstrator</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {[
            { id: 'remediation' as const, label: `Remediation Advisor (${proposals.length})`, icon: Wrench },
            { id: 'sandbox' as const, label: `Migration Sandbox (${appliedCount} Applied)`, icon: Layers },
            { id: 'comparison' as const, label: 'Security Comparison', icon: ShieldCheck },
            { id: 'hybrid-lab' as const, label: 'Hybrid Cryptography Lab', icon: Cpu },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-mono border flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: REMEDIATION ADVISOR & UNIFIED DIFF VIEWER
         ========================================================================= */}
      {activeTab === 'remediation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposals List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>Vulnerable Assets ({proposals.length})</span>
              <span>NIST Standards Target</span>
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {proposals.map((prop, idx) => {
                const isSelected = selectedProposal?.file_path === prop.file_path && selectedProposal?.line_number === prop.line_number;
                return (
                  <div
                    key={`${prop.file_path}-${prop.line_number}-${idx}`}
                    onClick={() => setSelectedProposal(prop)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                        : 'glass-card border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{prop.vulnerable_primitive}</span>
                          <span className="text-[10px] text-slate-400">({prop.usage})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[240px]">
                          {prop.file_path}{prop.line_number ? `:${prop.line_number}` : ''}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        prop.status === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : prop.status === 'REJECTED'
                          ? 'bg-slate-800 text-slate-400 border-white/10'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {prop.status}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-300 font-mono font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{prop.target_pqc}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {prop.can_auto_apply ? 'Automated Patch' : 'Manual Template'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Code Patch & Diff Inspector */}
          <div className="lg:col-span-7">
            {selectedProposal ? (
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/8 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-info text-[10px]">{selectedProposal.patch_type.replace('_', ' ')}</span>
                      <span className="text-xs font-mono text-slate-400">
                        {selectedProposal.file_path}:{selectedProposal.line_number}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Remediate {selectedProposal.vulnerable_primitive} → {selectedProposal.target_pqc}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedProposal.can_auto_apply && selectedProposal.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => handleApplyPatch(selectedProposal)}
                        disabled={applyingFindingId !== null}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{applyingFindingId ? 'Applying...' : 'Accept & Apply Patch'}</span>
                      </button>
                    )}
                    {selectedProposal.status === 'PROPOSED' && (
                      <button
                        onClick={() => handleRejectPatch(selectedProposal)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Migration Rationale</span>
                    <p className="text-slate-300 leading-relaxed">{selectedProposal.rationale}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">NIST Standard</span>
                      <p className="font-mono text-white mt-0.5">{selectedProposal.target_standard}</p>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Dependency Requirement</span>
                      <p className="font-mono text-emerald-300 mt-0.5 truncate">{selectedProposal.dependency_changes}</p>
                    </div>
                  </div>
                </div>

                {/* Unified Diff View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 font-bold uppercase">Unified Diff Preview</span>
                    <span className="text-[10px] text-slate-500 font-mono">Isolated Sandbox Target</span>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[360px]">
                    {selectedProposal.unified_diff ? (
                      selectedProposal.unified_diff.split('\n').map((diffLine, idx) => {
                        let lineStyle = 'text-slate-300';
                        if (diffLine.startsWith('+')) lineStyle = 'text-emerald-400 bg-emerald-500/10 px-1 rounded block';
                        else if (diffLine.startsWith('-')) lineStyle = 'text-rose-400 bg-rose-500/10 px-1 rounded block';
                        else if (diffLine.startsWith('@@')) lineStyle = 'text-cyan-400 opacity-80';

                        return (
                          <div key={idx} className={lineStyle}>
                            {diffLine || '\u00A0'}
                          </div>
                        );
                      })
                    ) : (
                      <pre className="text-slate-300 whitespace-pre-wrap">{selectedProposal.proposed_code}</pre>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-amber-300/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 font-mono leading-relaxed">
                  {selectedProposal.disclaimer}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 rounded-3xl text-center text-slate-400 text-sm">
                Select a cryptographic finding from the left panel to inspect the proposed remediation patch.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MIGRATION SANDBOX WORKSPACE
         ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-success text-[10px]">SANDBOX ACTIVE</span>
                <span className="text-xs font-mono text-slate-400">ID: {sandboxId || 'Session Ready'}</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Isolated Migration Sandbox</h3>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                Source code modifications are safely staged in volatile memory. Original repository files remain completely
                immutable. Once your desired patches are applied, trigger a sandbox rescan to verify security improvements.
              </p>
            </div>

            <button
              onClick={handleRescanSandbox}
              disabled={isRescanning}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
              <span>{isRescanning ? 'Rescanning Sandbox...' : 'Rescan Sandbox Project'}</span>
            </button>
          </div>

          {/* Sandbox Audit Trail Table */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Sandbox Staging & Patch Audit Trail</h4>
            
            {auditTrail.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No patches applied yet. Review and accept proposals from the Remediation Advisor tab.
              </p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
                {auditTrail.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.action === 'PATCH_APPLIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {item.action}
                        </span>
                        <span className="font-mono text-white">{item.file}</span>
                        {item.line && <span className="text-slate-500 font-mono">line {item.line}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400">{item.details || `Replaced with ${item.target_pqc}`}</p>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BEFORE-AND-AFTER SECURITY COMPARISON
         ========================================================================= */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {!comparison ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-white/10">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Rescan Comparison Available</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Apply one or more remediation patches in the sandbox and execute "Rescan Sandbox Project" to view the security delta.
              </p>
              <button onClick={() => setActiveTab('remediation')} className="btn-primary text-xs px-4 py-2 rounded-xl">
                Open Remediation Advisor
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Deltas Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-indigo-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Quantum Readiness Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      {comparison.score_deltas.after.quantum_score}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      comparison.score_deltas.quantum_readiness_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {comparison.score_deltas.quantum_readiness_delta >= 0 ? '+' : ''}
                      {comparison.score_deltas.quantum_readiness_delta} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Original: {comparison.score_deltas.before.quantum_score} pts</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-cyan-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Classical Security Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      {comparison.score_deltas.after.classical_score}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      comparison.score_deltas.classical_security_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {comparison.score_deltas.classical_security_delta >= 0 ? '+' : ''}
                      {comparison.score_deltas.classical_security_delta} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Original: {comparison.score_deltas.before.classical_score} pts</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-emerald-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Resolved Vulnerabilities</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {comparison.findings_delta.resolved_count}
                  </div>
                  <p className="text-[10px] text-slate-500">Confirmed absent in rescan</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-rose-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Remaining Vulnerabilities</span>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {comparison.findings_delta.unresolved_count}
                  </div>
                  <p className="text-[10px] text-slate-500">Requires further remediation</p>
                </div>
              </div>

              {/* Resolved vs Unresolved Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Resolved Items */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-300 flex items-center justify-between font-mono">
                    <span>Verified Resolved Assets ({comparison.findings_delta.resolved_count})</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {comparison.findings_delta.resolved_items?.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-white">{item.primitive}</span>
                          <span className="text-emerald-400 font-bold">RESOLVED</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.file_path}:{item.line_number}</p>
                      </div>
                    ))}
                    {comparison.findings_delta.resolved_count === 0 && (
                      <p className="text-xs text-slate-500 italic">No assets were resolved in this rescan.</p>
                    )}
                  </div>
                </div>

                {/* Remaining Items */}
                <div className="glass-card p-5 rounded-2xl border border-amber-500/20 space-y-3">
                  <h4 className="text-sm font-bold text-amber-300 flex items-center justify-between font-mono">
                    <span>Unresolved Assets ({comparison.findings_delta.unresolved_count})</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {comparison.findings_delta.unresolved_items?.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/20 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-white">{item.primitive}</span>
                          <span className="text-amber-400 font-bold">{item.severity}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.file_path}:{item.line_number}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: HYBRID CRYPTOGRAPHY LAB & EXECUTABLE DEMONSTRATOR
         ========================================================================= */}
      {activeTab === 'hybrid-lab' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/25 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">NIST FIPS 203 ML-KEM-768 + X25519 Hybrid Cryptography Lab</h3>
              </div>
              <span className="badge badge-success text-xs font-mono">Standardized FIPS 203 Module-LWE</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Execute live post-quantum hybrid key encapsulation. The pipeline combines classical Curve25519 ECDH
              with NIST-standardized ML-KEM-768 lattice mathematics, extracts a 256-bit symmetric session key via HKDF-SHA-256,
              and performs authenticated encryption using AES-256-GCM with automated tamper detection.
            </p>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plaintext Message to Encrypt</label>
                <input
                  type="text"
                  value={hybridMessage}
                  onChange={(e) => setHybridMessage(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Authenticated Additional Data (AAD)</label>
                <input
                  type="text"
                  value={hybridAad}
                  onChange={(e) => setHybridAad(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateTamper}
                  onChange={(e) => setSimulateTamper(e.target.checked)}
                  className="rounded border-white/20 bg-slate-900 text-emerald-500"
                />
                <span>Simulate ciphertext bit flip to verify cryptographic tamper rejection</span>
              </label>

              <button
                onClick={handleRunHybridLab}
                disabled={isRunningHybridDemo}
                className="btn-primary text-xs px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunningHybridDemo ? 'Executing Pipeline...' : 'Run Live Hybrid KEX'}</span>
              </button>
            </div>
          </div>

          {/* Live Execution Results */}
          {hybridResult && (
            <div className="glass-card p-6 rounded-3xl border border-emerald-500/25 space-y-5">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Live Hybrid Pipeline Execution Results</h4>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Total Execution: {hybridResult.timings_ms?.total_execution_time} ms
                </span>
              </div>

              {/* Step By Step Pipeline Display */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">1. X25519 ECDH</span>
                  <p className="font-mono text-white font-bold">{hybridResult.timings_ms?.x25519_time} ms</p>
                  <p className="text-[10px] text-slate-400">Secret: 32 bytes</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">2. ML-KEM-768 Encaps</span>
                  <p className="font-mono text-emerald-300 font-bold">{hybridResult.timings_ms?.mlkem_time} ms</p>
                  <p className="text-[10px] text-slate-400">CT: 1088 bytes</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">3. HKDF-SHA-256</span>
                  <p className="font-mono text-violet-300 font-bold">{hybridResult.timings_ms?.hkdf_time} ms</p>
                  <p className="text-[10px] text-slate-400">Derived: 256 bits</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">4. AES-256-GCM</span>
                  <p className="font-mono text-cyan-300 font-bold">{hybridResult.timings_ms?.aes_encryption_time} ms</p>
                  <p className="text-[10px] text-slate-400">Nonce: 96 bits</p>
                </div>
              </div>

              {/* Previews Table */}
              <div className="rounded-2xl bg-slate-950 p-4 border border-white/10 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                  <span>Cryptographic Parameter</span>
                  <span>Value / Hex Digest</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Derived AES-256 Key:</span>
                  <span className="text-violet-300">{hybridResult.previews?.derived_key_preview}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">GCM Nonce:</span>
                  <span className="text-cyan-300">{hybridResult.previews?.nonce_hex}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Ciphertext (Base64):</span>
                  <span className="text-emerald-300">{hybridResult.previews?.ciphertext_preview_b64}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Decrypted Plaintext:</span>
                  <span className="text-white font-bold">"{hybridResult.previews?.decrypted_plaintext}"</span>
                </div>
              </div>

              {/* Tamper Test Alert */}
              {hybridResult.tamper_verification?.tamper_simulated && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Tamper Rejection Test:</strong> {hybridResult.tamper_verification.status} ({hybridResult.tamper_verification.exception})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Comparative Analysis Table */}
          {kexComparisons && (
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Comparative Key Establishment Modes
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {Object.entries(kexComparisons).map(([key, mode]: [string, any]) => (
                  <div key={key} className="glass-card p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="font-bold text-white font-mono text-sm block">{mode.name}</span>
                    <p className="text-[10px] text-slate-400">{mode.standard}</p>
                    
                    <div className="pt-2 border-t border-white/5 space-y-1.5 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Quantum Status:</span>
                        <span className={mode.quantum_status?.includes('VULNERABLE') ? 'text-rose-400' : 'text-emerald-300 font-bold'}>
                          {mode.quantum_status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Public Key Size:</span>
                        <span className="text-slate-200">{mode.public_key_size_bytes} bytes</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Ciphertext Overhead:</span>
                        <span className="text-slate-200">{mode.ciphertext_overhead_bytes} bytes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
