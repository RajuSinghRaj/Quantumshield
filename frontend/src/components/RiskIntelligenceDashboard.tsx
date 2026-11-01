import React, { useState } from 'react';
import {
  ShieldAlert, Sparkles, Layers, AlertTriangle, ArrowRight,
  Calculator, PlusCircle, CheckCircle2,
  FileCode, Boxes, ExternalLink, HelpCircle
} from 'lucide-react';
import { RiskIntelligenceData, HNDLProfile, MigrationPriorityItem } from '../types/scan';
import { assessHndlCategory } from '../services/api';

interface RiskIntelligenceDashboardProps {
  scanId: string;
  projectName: string;
  riskData?: RiskIntelligenceData;
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const RiskIntelligenceDashboard: React.FC<RiskIntelligenceDashboardProps> = ({
  scanId,
  projectName,
  riskData,
  onSelectFileFinding
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'priorities' | 'hndl' | 'transparency'>('overview');
  
  // Custom HNDL Assessment Form State
  const [customCategory, setCustomCategory] = useState('');
  const [customSensitivity, setCustomSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'>('HIGH');
  const [customLifetime, setCustomLifetime] = useState<'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'INDEFINITE' | 'UNKNOWN'>('LONG_TERM');
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmittingHndl, setIsSubmittingHndl] = useState(false);
  const [hndlFeedback, setHndlFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Local state for dynamically updated HNDL profile
  const [localHndl, setLocalHndl] = useState<HNDLProfile | undefined>(riskData?.hndl_analysis);
  const [localOverallRisk, setLocalOverallRisk] = useState(riskData?.overall_security_risk);

  if (!riskData) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-indigo-500/20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
        <h3 className="text-xl font-bold text-white">Quantum Risk Intelligence Pending</h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          No correlated risk data is available for this scan. Run a cryptographic audit to generate real-time risk scores and HNDL telemetry.
        </p>
      </div>
    );
  }

  const overall = localOverallRisk || riskData.overall_security_risk;
  const scores = riskData.scores;
  const metrics = riskData.asset_metrics;
  const deductions = riskData.score_deductions_and_bonuses;
  const hndl = localHndl || riskData.hndl_analysis;
  const priorities = riskData.migration_priorities || [];

  const handleApplyPreset = (preset: { category: string; sensitivity: string; lifetime: string; description: string }) => {
    setCustomCategory(preset.category);
    setCustomSensitivity(preset.sensitivity as any);
    setCustomLifetime(preset.lifetime as any);
    setCustomDescription(preset.description);
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategory.trim()) {
      setHndlFeedback({ message: 'Please specify a data category name.', type: 'error' });
      return;
    }

    setIsSubmittingHndl(true);
    setHndlFeedback(null);

    try {
      const res = await assessHndlCategory(scanId, {
        category: customCategory.trim(),
        sensitivity: customSensitivity,
        lifetime: customLifetime,
        description: customDescription.trim()
      });

      if (res && res.hndl_analysis) {
        setLocalHndl(res.hndl_analysis);
      }
      if (res && res.overall_security_risk) {
        setLocalOverallRisk(res.overall_security_risk);
      }

      setHndlFeedback({
        message: `Successfully evaluated '${customCategory}' (Exposure: ${res.assessment?.exposure_level || 'EVALUATED'}).`,
        type: 'success'
      });
      setCustomCategory('');
      setCustomDescription('');
    } catch (err: any) {
      setHndlFeedback({
        message: err.response?.data?.detail || err.message || 'Failed to submit HNDL assessment.',
        type: 'error'
      });
    } finally {
      setIsSubmittingHndl(false);
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
      case 'MODERATE': return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40';
      default: return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Quantum Risk Intelligence Engine</h2>
            <p className="text-xs text-slate-400">Correlated multi-layer risk scoring, HNDL analysis & PQC migration priority</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {[
            { id: 'overview' as const, label: 'Executive Overview', icon: Layers },
            { id: 'priorities' as const, label: `Migration Priority (${priorities.length})`, icon: ArrowRight },
            { id: 'hndl' as const, label: `HNDL Analyzer (${hndl?.assessments?.length || 0})`, icon: ShieldAlert },
            { id: 'transparency' as const, label: 'Score Transparency', icon: Calculator },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSubTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeSubTab === id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: EXECUTIVE OVERVIEW
         ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Overall Security Risk Card */}
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/25 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Overall Security Risk</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getRiskBadgeClass(overall.level)}`}>
                  {overall.level} TIER
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-white font-mono tracking-tight">
                  {overall.score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Weighted composite of quantum exposure, classical weakness, HNDL threat, and dependency risks.
                </p>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    overall.score >= 65 ? 'bg-rose-500' : overall.score >= 45 ? 'bg-amber-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, overall.score)}%` }}
                />
              </div>
            </div>

            {/* Quantum Readiness Score Card */}
            <div className="glass-card p-6 rounded-3xl border border-violet-500/25 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Quantum Readiness</span>
                <span className="text-[10px] text-violet-300 font-mono font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                  FIPS 203/204
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-violet-300 font-mono tracking-tight">
                  {scores.quantum_readiness_score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Measures resistance against Shor's factorization and Grover's search algorithms.
                </p>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, scores.quantum_readiness_score)}%` }}
                />
              </div>
            </div>

            {/* Classical Security Score Card */}
            <div className="glass-card p-6 rounded-3xl border border-cyan-500/25 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Classical Hardening</span>
                <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  NIST SP 800-131A
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-cyan-300 font-mono tracking-tight">
                  {scores.classical_security_score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates conventional primitives against classical cryptanalysis (MD5, SHA-1, DES).
                </p>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"
                  style={{ width: `${Math.min(100, scores.classical_security_score)}%` }}
                />
              </div>
            </div>

            {/* HNDL Exposure Score Card */}
            <div className="glass-card p-6 rounded-3xl border border-rose-500/25 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">HNDL Exposure</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getRiskBadgeClass(hndl?.overall_hndl_level || 'LOW')}`}>
                  {hndl?.overall_hndl_level || 'LOW'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-rose-300 font-mono tracking-tight">
                  {scores.hndl_exposure_score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Harvest-Now-Decrypt-Later risk for archived ciphertexts protecting long-lived data.
                </p>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, scores.hndl_exposure_score)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Asset Distribution Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Assets', val: metrics.total_cryptographic_assets, color: 'text-white', sub: 'deduplicated' },
              { label: 'Shor Vulnerable', val: metrics.shor_vulnerable_assets, color: 'text-rose-400', sub: 'RSA / ECC / DH' },
              { label: 'Grover Degraded', val: metrics.grover_degraded_assets, color: 'text-amber-400', sub: 'AES-128 (64-bit)' },
              { label: 'Classically Broken', val: metrics.classical_broken_assets, color: 'text-rose-300', sub: 'MD5 / DES / ECB' },
              { label: 'Standardized PQC', val: metrics.pqc_standardized_assets, color: 'text-emerald-400', sub: 'ML-KEM / ML-DSA' },
              { label: 'PQC Adopted', val: `${scores.pqc_adoption_percentage}%`, color: 'text-indigo-300', sub: 'post-quantum ready' },
            ].map((item) => (
              <div key={item.label} className="glass-card p-4 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className={`text-2xl font-black font-mono ${item.color}`}>{item.val}</p>
                <p className="text-[10px] text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Technical Classification Principles & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quantum Attack Vector Analysis</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-rose-300">Shor's Algorithm:</strong> Completely breaks asymmetric algorithms (RSA, ECC, ECDSA, ECDH) by solving discrete logs and integer factorization in polynomial time on fault-tolerant quantum computers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-amber-300">Grover's Algorithm:</strong> Provides a quadratic speedup for unstructured brute-force search. AES-128 is degraded to ~64 bits of security, whereas AES-256 retains 128 bits of quantum security.
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">PQC Migration Standards Reference</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-emerald-300">FIPS 203 (ML-KEM):</strong> Standard for Key Encapsulation (formerly Kyber). Used to replace RSA and ECDH key establishment.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-emerald-300">FIPS 204 (ML-DSA) & FIPS 205 (SLH-DSA):</strong> Standards for Digital Signatures (formerly Dilithium and SPHINCS+).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: MIGRATION PRIORITIES
         ========================================================================= */}
      {activeSubTab === 'priorities' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Prioritized Cryptographic Migration Roadmap</h3>
              <p className="text-xs text-slate-400">
                Multi-factor ranking considering classical brokenness, HNDL key exchange exposure, blast radius, and available NIST standards.
              </p>
            </div>
            <span className="badge badge-info text-xs">{priorities.length} Actionable Items</span>
          </div>

          {priorities.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              All detected cryptographic assets are currently post-quantum safe or no migration actions are pending.
            </div>
          ) : (
            <div className="space-y-4">
              {priorities.map((item, idx) => (
                <div
                  key={`${item.primitive}-${idx}`}
                  className="glass-card p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-white/10">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{item.primitive}</span>
                          <span className="text-xs text-slate-400">({item.usage})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getRiskBadgeClass(item.priority)}`}>
                        {item.priority} PRIORITY
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                        {item.urgency}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.rationale}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Recommended PQC Replacement</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-emerald-300 font-mono font-semibold">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>{item.recommended_pqc}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Affected Files & Code References</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.affected_files?.slice(0, 3).map((f) => (
                          <button
                            key={f}
                            onClick={() => onSelectFileFinding && onSelectFileFinding(f)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" />
                            <span className="truncate max-w-[180px]">{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: HNDL RISK ANALYZER
         ========================================================================= */}
      {activeSubTab === 'hndl' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Harvest-Now-Decrypt-Later (HNDL) Threat Modeling</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${getRiskBadgeClass(hndl?.overall_hndl_level || 'LOW')}`}>
                {hndl?.overall_hndl_level || 'LOW'} EXPOSURE ({hndl?.overall_hndl_score || 0}/100)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Adversaries can record encrypted network communications today and archive the ciphertext until a fault-tolerant
              quantum computer capable of running Shor's algorithm becomes operational. Long-lived confidential data protected
              by classical key exchange (e.g., ECDH, RSA) faces irreversible future exposure.
            </p>
          </div>

          {/* Interactive HNDL Assessment Form */}
          <div className="glass-card p-6 rounded-2xl border border-indigo-500/25 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Evaluate Custom Data Category</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Parameter Evaluation</span>
            </div>

            {/* Presets Quick Picker */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Load Standard Category Template</span>
              <div className="flex flex-wrap gap-2">
                {hndl?.presets?.map((preset) => (
                  <button
                    key={preset.category}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                  >
                    {preset.category}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAssessSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data Category Name *</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g., Electronic Health Records (EHR)"
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data Sensitivity Level</label>
                  <select
                    value={customSensitivity}
                    onChange={(e) => setCustomSensitivity(e.target.value as any)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">Critical (Life, National Security, Bio/Genomic)</option>
                    <option value="HIGH">High (Financial, PII, Legal, Trade Secrets)</option>
                    <option value="MEDIUM">Medium (Internal Business Documents)</option>
                    <option value="LOW">Low (Public or Non-Sensitive)</option>
                    <option value="UNKNOWN">Unknown / Unspecified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Required Confidentiality Lifetime</label>
                  <select
                    value={customLifetime}
                    onChange={(e) => setCustomLifetime(e.target.value as any)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INDEFINITE">Indefinite (&gt; 25 years / Perpetual)</option>
                    <option value="LONG_TERM">Long-Term (10 - 25 years)</option>
                    <option value="MEDIUM_TERM">Medium-Term (3 - 10 years)</option>
                    <option value="SHORT_TERM">Short-Term (&lt; 3 years / Ephemeral Session)</option>
                    <option value="UNKNOWN">Unknown / Unspecified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description & Context (Optional)</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g., Patient medical histories stored in encrypted database and transmitted over API."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {hndlFeedback && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  hndlFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {hndlFeedback.message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingHndl}
                  className="btn-primary text-xs px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{isSubmittingHndl ? 'Assessing...' : 'Assess HNDL Exposure'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Assessed Categories List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Assessed Data Categories ({hndl?.assessments?.length || 0})</h4>
            
            {hndl?.assessments?.map((item) => (
              <div
                key={item.assessment_id}
                className="glass-card p-5 rounded-2xl border border-white/5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-white text-sm">{item.category}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description || 'No additional description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getRiskBadgeClass(item.exposure_level)}`}>
                      {item.exposure_level} EXPOSURE ({item.hndl_score}/100)
                    </span>
                    {!item.is_user_specified && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        Default Assumption
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Sensitivity</span>
                    <p className="font-mono font-semibold text-slate-200">{item.effective_sensitivity}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Lifetime</span>
                    <p className="font-mono font-semibold text-slate-200">{item.effective_lifetime.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Key Exchange Mechanism</span>
                    <p className="font-mono font-semibold text-rose-300">
                      {item.has_hybrid_key_exchange ? 'Hybrid PQC Protected' : 'Classical (Shor Vulnerable)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Protection Status</span>
                    <p className="font-mono font-semibold text-slate-200">
                      {item.has_hybrid_key_exchange ? 'Safe from HNDL' : 'At Risk of Decryption'}
                    </p>
                  </div>
                </div>

                {item.assumptions && item.assumptions.length > 0 && (
                  <div className="text-[11px] text-amber-300/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20 font-mono">
                    <strong>Note on missing inputs:</strong> {item.assumptions.join(' ')}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                
                <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span><strong>Recommendation:</strong> {item.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: SCORE TRANSPARENCY
         ========================================================================= */}
      {activeSubTab === 'transparency' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Deterministic Scoring Formula & Mathematical Weights</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              QuantumShield computes risk deterministically based on verified scan evidence. The Overall Security Risk score
              is a weighted composite of four distinct threat dimensions:
            </p>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 font-mono text-xs text-indigo-200 space-y-2">
              <div className="text-indigo-400 font-bold">Risk Score Equation (0 - 100):</div>
              <div className="text-white text-sm bg-black/40 p-2.5 rounded-lg border border-white/5">
                Risk = 0.40 × QuantumExposure + 0.30 × ClassicalExposure + 0.20 × HNDLExposure + 0.10 × SupplyChainExposure
              </div>
            </div>

            {/* Weights Breakdown Table */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Quantum Exposure (40%)</span>
                <p className="font-mono text-lg font-bold text-violet-300">{scores.quantum_exposure_score} pts</p>
                <p className="text-[10px] text-slate-500">Contribution: {overall.contributions?.quantum_exposure_contribution || 0} pts</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Classical Exposure (30%)</span>
                <p className="font-mono text-lg font-bold text-cyan-300">{scores.classical_exposure_score} pts</p>
                <p className="text-[10px] text-slate-500">Contribution: {overall.contributions?.classical_exposure_contribution || 0} pts</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">HNDL Exposure (20%)</span>
                <p className="font-mono text-lg font-bold text-rose-300">{scores.hndl_exposure_score} pts</p>
                <p className="text-[10px] text-slate-500">Contribution: {overall.contributions?.hndl_exposure_contribution || 0} pts</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Supply Chain (10%)</span>
                <p className="font-mono text-lg font-bold text-amber-300">{scores.supply_chain_risk_score} pts</p>
                <p className="text-[10px] text-slate-500">Contribution: {overall.contributions?.supply_chain_exposure_contribution || 0} pts</p>
              </div>
            </div>
          </div>

          {/* Deductions & Bonuses Audit Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quantum Deductions */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Quantum Readiness Penalties</span>
                <span className="badge badge-error text-[10px] font-mono">{deductions.quantum_deductions?.length || 0} Deductions</span>
              </h4>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {deductions.quantum_deductions?.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{d.asset}</span>
                      <span className="text-rose-400 font-bold">-{d.deduction} pts</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{d.reason}</p>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">{d.source}</span>
                  </div>
                ))}
                {(!deductions.quantum_deductions || deductions.quantum_deductions.length === 0) && (
                  <p className="text-xs text-slate-500 italic">No quantum penalties applied.</p>
                )}
              </div>
            </div>

            {/* Classical Deductions & PQC Bonuses */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Classical Deductions & PQC Bonuses</span>
                <span className="badge badge-info text-[10px] font-mono">{deductions.pqc_bonuses?.length || 0} Bonuses</span>
              </h4>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {deductions.pqc_bonuses?.map((b, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{b.asset}</span>
                      <span className="text-emerald-400 font-bold">+{b.bonus} pts</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{b.reason}</p>
                  </div>
                ))}
                {deductions.classical_deductions?.map((d, i) => (
                  <div key={`c-${i}`} className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{d.asset}</span>
                      <span className="text-amber-400 font-bold">-{d.deduction} pts</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{d.reason}</p>
                  </div>
                ))}
                {(!deductions.pqc_bonuses || deductions.pqc_bonuses.length === 0) && (!deductions.classical_deductions || deductions.classical_deductions.length === 0) && (
                  <p className="text-xs text-slate-500 italic">No classical penalties or bonuses recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
