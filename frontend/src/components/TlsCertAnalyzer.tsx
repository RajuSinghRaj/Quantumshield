import React, { useState } from 'react';
import {
  Globe, Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Lock, Key, FileText, Search, RefreshCw, ArrowRight, Copy, Check,
  ExternalLink, Clock, Layers, Sparkles, Terminal, Info, Server, Eye
} from 'lucide-react';
import {
  TLSScanData, CertificateDetails, KeyAnalysisResult,
  QuantumRisk, ClassicalRisk, CertificateValidityStatus, RiskLevel
} from '../types/scan';
import { scanTlsDomain, analyzeCertificate, analyzeKey } from '../services/api';

interface TlsCertAnalyzerProps {
  tlsData?: TLSScanData;
  certificates?: CertificateDetails[];
  scanId: string;
  projectName: string;
  onSelectFileFinding?: (filePath: string, lineNo?: number) => void;
}

export const TlsCertAnalyzer: React.FC<TlsCertAnalyzerProps> = ({
  tlsData: initialTlsData,
  certificates: initialCertificates = [],
  scanId,
  projectName,
  onSelectFileFinding
}) => {
  const [activeTab, setActiveTab] = useState<'live-tls' | 'cert-analyzer' | 'key-analyzer' | 'inventory'>('live-tls');

  // Live TLS State
  const [targetDomain, setTargetDomain] = useState(initialTlsData?.hostname || '');
  const [isScanningTls, setIsScanningTls] = useState(false);
  const [tlsResult, setTlsResult] = useState<TLSScanData | undefined>(initialTlsData);
  const [tlsError, setTlsError] = useState<string | null>(null);

  // Certificate Analyzer State
  const [certInputText, setCertInputText] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [isAnalyzingCert, setIsAnalyzingCert] = useState(false);
  const [analyzedCerts, setAnalyzedCerts] = useState<CertificateDetails[]>(initialCertificates);
  const [certError, setCertError] = useState<string | null>(null);

  // Key Analyzer State
  const [keyInputText, setKeyInputText] = useState('');
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [keyPassword, setKeyPassword] = useState('');
  const [isAnalyzingKey, setIsAnalyzingKey] = useState(false);
  const [keyResult, setKeyResult] = useState<KeyAnalysisResult | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Inventory Filtering
  const [inventorySearch, setInventorySearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<string>('all');
  const [selectedCertForModal, setSelectedCertForModal] = useState<CertificateDetails | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState<string | null>(null);

  // Copy fingerprint helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(text);
    setTimeout(() => setCopiedFingerprint(null), 2000);
  };

  // Run Live TLS Scan
  const handleRunTlsScan = async () => {
    if (!targetDomain.trim()) return;
    setIsScanningTls(true);
    setTlsError(null);
    try {
      const data = await scanTlsDomain(targetDomain.trim());
      setTlsResult(data);
      if (data.server_certificate) {
        setAnalyzedCerts(prev => {
          const exists = prev.some(c => c.fingerprint_sha256 === data.server_certificate?.fingerprint_sha256);
          return exists ? prev : [data.server_certificate!, ...prev];
        });
      }
    } catch (err: any) {
      setTlsError(err.response?.data?.detail || err.message || 'TLS scan failed.');
    } finally {
      setIsScanningTls(false);
    }
  };

  // Run Certificate Analysis
  const handleAnalyzeCert = async () => {
    if (!certFile && !certInputText.trim()) return;
    setIsAnalyzingCert(true);
    setCertError(null);
    try {
      const res = await analyzeCertificate(certFile || undefined, certInputText.trim() || undefined);
      if (res.certificates && res.certificates.length > 0) {
        setAnalyzedCerts(prev => [...res.certificates, ...prev]);
        setCertInputText('');
        setCertFile(null);
      }
    } catch (err: any) {
      setCertError(err.response?.data?.detail || err.message || 'Certificate analysis failed.');
    } finally {
      setIsAnalyzingCert(false);
    }
  };

  // Run Key Analysis
  const handleAnalyzeKey = async () => {
    if (!keyFile && !keyInputText.trim()) return;
    setIsAnalyzingKey(true);
    setKeyError(null);
    try {
      const res = await analyzeKey(keyFile || undefined, keyInputText.trim() || undefined, keyPassword || undefined);
      setKeyResult(res);
      setKeyInputText('');
      setKeyFile(null);
      setKeyPassword('');
    } catch (err: any) {
      setKeyError(err.response?.data?.detail || err.message || 'Key analysis failed.');
    } finally {
      setIsAnalyzingKey(false);
    }
  };

  // Filtered inventory
  const filteredCerts = analyzedCerts.filter(cert => {
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      const matchSub = cert.subject.toLowerCase().includes(q);
      const matchIss = cert.issuer.toLowerCase().includes(q);
      const matchFp = cert.fingerprint_sha256.toLowerCase().includes(q);
      const matchAlgo = cert.public_key.algorithm.toLowerCase().includes(q);
      if (!matchSub && !matchIss && !matchFp && !matchAlgo) return false;
    }
    if (validityFilter !== 'all' && cert.validity_status !== validityFilter) return false;
    return true;
  });

  // Validity badge styling
  const getValidityBadge = (status: CertificateValidityStatus) => {
    switch (status) {
      case 'VALID':
        return { label: 'Valid', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' };
      case 'EXPIRING_SOON':
        return { label: 'Expiring Soon', color: 'text-amber-300 border-amber-500/40 bg-amber-500/15' };
      case 'EXPIRED':
        return { label: 'Expired', color: 'text-rose-300 border-rose-500/40 bg-rose-500/15' };
      default:
        return { label: 'Not Yet Valid', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' };
    }
  };

  // Severity styling
  const getSeverityBadge = (severity: RiskLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
      case 'HIGH':
        return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
      case 'MEDIUM':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
      case 'LOW':
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
      default:
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Sub Navigation Tabs ── */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/8">
          <button
            onClick={() => setActiveTab('live-tls')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'live-tls' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Website TLS Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('cert-analyzer')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'cert-analyzer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Certificate Analyzer</span>
          </button>
          <button
            onClick={() => setActiveTab('key-analyzer')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'key-analyzer' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Key Analyzer</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Certificate Inventory ({analyzedCerts.length})</span>
          </button>
        </div>

        {/* SSRF & Zero-Knowledge Safety Badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 px-3 py-1 bg-white/5 rounded-xl border border-white/8">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSRF Protected & Zero-Knowledge Private Key Auditing</span>
        </div>
      </div>

      {/* ── TAB 1: LIVE TLS WEBSITE SCANNER ── */}
      {activeTab === 'live-tls' && (
        <div className="space-y-6">
          {/* Target Hostname Input Bar */}
          <div className="glass-card p-6 rounded-3xl border border-indigo-500/25 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span>Live Website Handshake & Cryptographic Inspection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Initiate a live TLS connection to inspect negotiated ciphers, key exchange curves, server certificates, and quantum exposure.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. google.com, cloudflare.com, or github.com"
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTlsScan()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <button
                onClick={handleRunTlsScan}
                disabled={isScanningTls || !targetDomain.trim()}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isScanningTls ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Performing TLS Handshake...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Inspect TLS Handshake</span>
                  </>
                )}
              </button>
            </div>

            {tlsError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{tlsError}</span>
              </div>
            )}
          </div>

          {/* TLS Inspection Results */}
          {tlsResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Handshake Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Protocol Card */}
                <div className="glass-card p-5 rounded-2xl border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negotiated Protocol</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white font-mono">{tlsResult.tls_protocol}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      tlsResult.tls_protocol === 'TLSv1.3' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tlsResult.tls_protocol === 'TLSv1.3' ? 'MODERN' : 'LEGACY'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">IP: {tlsResult.resolved_ip}:{tlsResult.port}</p>
                </div>

                {/* Cipher Suite Card */}
                <div className="glass-card p-5 rounded-2xl border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cipher Suite</span>
                  <p className="text-sm font-black text-white font-mono truncate">{tlsResult.cipher_suite}</p>
                  <p className="text-[11px] text-cyan-400 font-mono">{tlsResult.symmetric_key_bits}-bit Symmetric Key</p>
                </div>

                {/* Key Exchange Card */}
                <div className="glass-card p-5 rounded-2xl border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Exchange</span>
                  <p className="text-sm font-black text-white font-mono truncate">{tlsResult.key_exchange}</p>
                  <p className="text-[11px] text-slate-400 truncate">{tlsResult.key_exchange_details}</p>
                </div>

                {/* Quantum Classification Card */}
                <div className="glass-card p-5 rounded-2xl border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantum Classification</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                      tlsResult.quantum_classification === 'HYBRID_POST_QUANTUM'
                        ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                        : tlsResult.quantum_classification === 'POST_QUANTUM'
                        ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
                        : 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                    }`}>
                      {tlsResult.quantum_classification === 'HYBRID_POST_QUANTUM' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Hybrid PQC</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Classical (Shor Vulnerable)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {tlsResult.quantum_classification === 'HYBRID_POST_QUANTUM'
                      ? 'Protected against Harvest-Now-Decrypt-Later'
                      : 'Subject to retrospective quantum decryption'}
                  </p>
                </div>
              </div>

              {/* Server Certificate Details Card */}
              {tlsResult.server_certificate && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                        Peer Server Certificate
                      </span>
                      <h4 className="text-lg font-black text-white font-mono mt-0.5">
                        {tlsResult.server_certificate.subject_common_name || tlsResult.server_certificate.subject}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                        getValidityBadge(tlsResult.server_certificate.validity_status).color
                      }`}>
                        {getValidityBadge(tlsResult.server_certificate.validity_status).label} ({tlsResult.server_certificate.days_to_expiry} days)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block mb-1">Public Key:</span>
                      <span className="font-mono font-bold text-white">
                        {tlsResult.server_certificate.public_key.variant}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Signature Algorithm:</span>
                      <span className="font-mono text-cyan-300">
                        {tlsResult.server_certificate.signature_algorithm}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Issuer:</span>
                      <span className="font-mono text-slate-300 truncate block" title={tlsResult.server_certificate.issuer}>
                        {tlsResult.server_certificate.issuer_common_name || tlsResult.server_certificate.issuer}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Validity Period:</span>
                      <span className="font-mono text-slate-300 block">
                        Until {new Date(tlsResult.server_certificate.valid_until).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Fingerprint & SANs */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 text-[11px] font-mono">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="text-slate-400 shrink-0">SHA-256 Fingerprint:</span>
                      <span className="text-slate-300 truncate">{tlsResult.server_certificate.fingerprint_sha256}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(tlsResult.server_certificate!.fingerprint_sha256)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1.5 shrink-0"
                    >
                      {copiedFingerprint === tlsResult.server_certificate.fingerprint_sha256 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedFingerprint === tlsResult.server_certificate.fingerprint_sha256 ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Security & Quantum Threat Findings */}
              {tlsResult.security_findings && tlsResult.security_findings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Security & Cryptographic Findings ({tlsResult.security_findings.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {tlsResult.security_findings.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="glass-card p-4 rounded-2xl border border-white/8 space-y-2 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold font-mono text-white">{f.title}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getSeverityBadge(f.severity)}`}>
                            {f.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{f.description}</p>
                        {f.recommendation && (
                          <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/25 flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-cyan-200">Action:</strong> {f.recommendation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CERTIFICATE ANALYZER ── */}
      {activeTab === 'cert-analyzer' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-indigo-500/25 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Upload or Paste X.509 Certificate</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inspect PEM or DER encoded certificates, certificate chains, and bundle files to extract public keys, validity periods, extensions, and quantum risks.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="cert-file-upload"
                  accept=".pem,.crt,.cer,.der,.csr"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="cert-file-upload"
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>Choose Certificate File</span>
                </label>
                <span className="text-xs font-mono text-slate-400 truncate">
                  {certFile ? certFile.name : 'No file chosen (.pem, .crt, .cer, .der)'}
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  placeholder="Or paste PEM certificate content here (-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----)"
                  value={certInputText}
                  onChange={(e) => setCertInputText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <button
                onClick={handleAnalyzeCert}
                disabled={isAnalyzingCert || (!certFile && !certInputText.trim())}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isAnalyzingCert ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Analyzing Certificate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Certificate</span>
                  </>
                )}
              </button>
            </div>

            {certError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{certError}</span>
              </div>
            )}
          </div>

          {/* Analyzed Certificates List */}
          {analyzedCerts.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Analyzed Certificates ({analyzedCerts.length})</span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {analyzedCerts.map((cert, cIdx) => {
                  const valBadge = getValidityBadge(cert.validity_status);
                  return (
                    <div
                      key={cIdx}
                      className="glass-card p-5 rounded-2xl border border-white/8 space-y-3 hover:border-white/15 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${valBadge.color}`}>
                              {valBadge.label} ({cert.days_to_expiry} days)
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{cert.source_path}</span>
                          </div>
                          <h5 className="text-base font-black text-white font-mono">
                            {cert.subject_common_name || cert.subject}
                          </h5>
                        </div>

                        <button
                          onClick={() => setSelectedCertForModal(cert)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>View Full X.509 Details</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-white/5">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Algorithm:</span>
                          <span className="font-mono font-bold text-white">{cert.public_key.variant}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Signature:</span>
                          <span className="font-mono text-cyan-300">{cert.signature_algorithm}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Issuer:</span>
                          <span className="font-mono text-slate-300 truncate block">{cert.issuer_common_name || cert.issuer}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Expires:</span>
                          <span className="font-mono text-slate-300">{new Date(cert.valid_until).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Fingerprint */}
                      <div className="flex items-center justify-between text-[11px] font-mono p-2.5 rounded-xl bg-white/5">
                        <span className="text-slate-400 truncate">SHA-256: {cert.fingerprint_sha256}</span>
                        <button
                          onClick={() => handleCopy(cert.fingerprint_sha256)}
                          className="text-slate-400 hover:text-white flex items-center gap-1 shrink-0 ml-2"
                        >
                          {copiedFingerprint === cert.fingerprint_sha256 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: KEY ANALYZER ── */}
      {activeTab === 'key-analyzer' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-indigo-500/25 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <span>Cryptographic Key Analyzer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inspect public and private keys (PKCS#1, PKCS#8, SEC1) to assess bit length, curve parameters, and quantum exposure.
              </p>
            </div>

            {/* Zero-Knowledge Guarantee Banner */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Knowledge Private Key Auditing</span>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed font-sans">
                Private key material is inspected strictly in volatile memory to read key lengths and curves, then immediately purged. Zero private key bytes are stored, logged, or saved to disk.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="key-file-upload"
                  accept=".pem,.key,.pub"
                  onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="key-file-upload"
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Key className="w-4 h-4" />
                  <span>Choose Key File</span>
                </label>
                <span className="text-xs font-mono text-slate-400 truncate">
                  {keyFile ? keyFile.name : 'No file chosen (.pem, .key, .pub)'}
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  placeholder="Or paste PEM key content (-----BEGIN PUBLIC KEY----- or -----BEGIN PRIVATE KEY-----)"
                  value={keyInputText}
                  onChange={(e) => setKeyInputText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="password"
                  placeholder="Passphrase (only if key is encrypted)"
                  value={keyPassword}
                  onChange={(e) => setKeyPassword(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500/50 flex-1 max-w-sm"
                />
                <button
                  onClick={handleAnalyzeKey}
                  disabled={isAnalyzingKey || (!keyFile && !keyInputText.trim())}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzingKey ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Analyzing Key...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Analyze Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {keyError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{keyError}</span>
              </div>
            )}
          </div>

          {/* Key Analysis Results Card */}
          {keyResult && (
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                    {keyResult.key_type} Analysis Results
                  </span>
                  <h4 className="text-lg font-black text-white font-mono mt-0.5">
                    {keyResult.variant || keyResult.algorithm}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                    keyResult.quantum_risk === 'VULNERABLE' ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                  }`}>
                    {keyResult.quantum_risk}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/5">
                <div>
                  <span className="text-slate-400 block mb-0.5">Algorithm:</span>
                  <span className="font-mono font-bold text-white">{keyResult.algorithm}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Key Size:</span>
                  <span className="font-mono text-cyan-300">{keyResult.key_size} bits</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Curve / Parameter:</span>
                  <span className="font-mono text-slate-300">{keyResult.curve || 'N/A'}</span>
                </div>
              </div>

              {keyResult.quantum_threat && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/8 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-rose-400">Quantum Vulnerability: </span>
                  <span>{keyResult.quantum_threat}</span>
                </div>
              )}

              {keyResult.privacy_notice && (
                <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/25 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{keyResult.privacy_notice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CERTIFICATE INVENTORY ── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificates by subject, issuer, algorithm, fingerprint..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Validity:</span>
              <select
                value={validityFilter}
                onChange={(e) => setValidityFilter(e.target.value)}
                className="bg-white/5 border border-white/10 text-white px-2.5 py-1.5 rounded-xl font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Statuses</option>
                <option value="VALID" className="bg-slate-900 text-emerald-400">Valid</option>
                <option value="EXPIRING_SOON" className="bg-slate-900 text-amber-400">Expiring Soon</option>
                <option value="EXPIRED" className="bg-slate-900 text-rose-400">Expired</option>
              </select>
            </div>
          </div>

          {filteredCerts.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-white/5 space-y-3">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-white">No certificates match your filter</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Scan a public TLS domain or upload certificates to populate the inventory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredCerts.map((cert, idx) => {
                const valBadge = getValidityBadge(cert.validity_status);
                return (
                  <div
                    key={idx}
                    className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${valBadge.color}`}>
                          {valBadge.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{cert.public_key.variant}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{cert.signature_algorithm}</span>
                      </div>
                      <h5 className="text-sm font-bold text-white font-mono truncate">
                        {cert.subject_common_name || cert.subject}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate">
                        Issuer: {cert.issuer_common_name || cert.issuer} | Expires: {new Date(cert.valid_until).toLocaleDateString()} ({cert.days_to_expiry} days)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedCertForModal(cert)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: FULL X.509 CERTIFICATE DETAILS ── */}
      {selectedCertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-white/20 space-y-5 bg-slate-950/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  X.509 Certificate Details
                </span>
                <h3 className="text-lg font-black text-white font-mono mt-0.5">
                  {selectedCertForModal.subject_common_name || selectedCertForModal.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCertForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Subject & Issuer */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Subject DN:</span>
                <div className="p-2.5 rounded-xl bg-white/5 font-mono text-slate-300 break-all">
                  {selectedCertForModal.subject}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Issuer DN:</span>
                <div className="p-2.5 rounded-xl bg-white/5 font-mono text-slate-300 break-all">
                  {selectedCertForModal.issuer}
                </div>
              </div>
            </div>

            {/* Public Key & Serial */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 block mb-1">Public Key:</span>
                <span className="font-mono font-bold text-white">{selectedCertForModal.public_key.variant}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 block mb-1">Serial Number:</span>
                <span className="font-mono text-slate-300 truncate block">{selectedCertForModal.serial_number}</span>
              </div>
            </div>

            {/* SANs */}
            {selectedCertForModal.subject_alt_names && selectedCertForModal.subject_alt_names.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold text-xs block mb-1.5">Subject Alternative Names (SANs):</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCertForModal.subject_alt_names.map((san, sIdx) => (
                    <span key={sIdx} className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/5 text-slate-300 border border-white/10">
                      {san}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Usage & Extended Usage */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {selectedCertForModal.key_usage && selectedCertForModal.key_usage.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Key Usage:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCertForModal.key_usage.map((ku, uIdx) => (
                      <span key={uIdx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300">
                        {ku}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedCertForModal.extended_key_usage && selectedCertForModal.extended_key_usage.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Extended Key Usage:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCertForModal.extended_key_usage.map((eku, eIdx) => (
                      <span key={eIdx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300">
                        {eku}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantum Advisory */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1 text-xs">
              <span className="font-bold text-rose-300">Post-Quantum Migration Recommendation:</span>
              <p className="text-slate-300 leading-relaxed font-sans">
                {selectedCertForModal.pqc_alternative}. Asymmetric signatures must transition to NIST standardized PQC algorithms to prevent forgery once fault-tolerant quantum computers emerge.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
