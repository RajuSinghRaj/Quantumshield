import React, { useState, useMemo } from 'react';
import {
  FileText, Download, Copy, Check, Search, Filter, ShieldCheck,
  AlertTriangle, ShieldAlert, Cpu, Sparkles, Layers, Code, Hash,
  ExternalLink, ChevronRight, Eye, RefreshCw
} from 'lucide-react';
import { CBOMDocument, CBOMComponent } from '../types/scan';
import { getCbomExportUrl } from '../services/api';

interface CbomViewerProps {
  cbom?: CBOMDocument;
  scanId: string;
  projectName: string;
}

export const CbomViewer: React.FC<CbomViewerProps> = ({ cbom, scanId, projectName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [primitiveFilter, setPrimitiveFilter] = useState('ALL');
  const [quantumRiskFilter, setQuantumRiskFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'components' | 'raw_json'>('components');
  const [copied, setCopied] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<CBOMComponent | null>(null);

  const components: CBOMComponent[] = useMemo(() => {
    return cbom?.components || [];
  }, [cbom]);

  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const name = (comp.name || '').toLowerCase();
      const version = (comp.version || '').toLowerCase();
      const primitive = (comp.cryptoProperties?.algorithmProperties?.primitive || '').toUpperCase();
      const curve = (comp.cryptoProperties?.algorithmProperties?.curve || '').toLowerCase();
      const location = (comp.evidence?.occurrences?.[0]?.location || '').toLowerCase();

      // Search match
      const matchesSearch =
        !searchTerm ||
        name.includes(searchTerm.toLowerCase()) ||
        version.includes(searchTerm.toLowerCase()) ||
        curve.includes(searchTerm.toLowerCase()) ||
        location.includes(searchTerm.toLowerCase()) ||
        comp['bom-ref'].toLowerCase().includes(searchTerm.toLowerCase());

      // Primitive filter
      const matchesPrimitive =
        primitiveFilter === 'ALL' || primitive === primitiveFilter;

      // Quantum risk filter
      const qRiskProp = comp.properties?.find((p) => p.name === 'quantumshield:quantumRisk')?.value || '';
      const matchesQRisk =
        quantumRiskFilter === 'ALL' || qRiskProp === quantumRiskFilter;

      return matchesSearch && matchesPrimitive && matchesQRisk;
    });
  }, [components, searchTerm, primitiveFilter, quantumRiskFilter]);

  const handleCopyJson = () => {
    if (!cbom) return;
    navigator.clipboard.writeText(JSON.stringify(cbom, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPrimitiveBadgeClass = (primitive: string) => {
    switch (primitive.toLowerCase()) {
      case 'kem':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'signature':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pke':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'block-cipher':
      case 'stream-cipher':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'mac':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'hash':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const getQuantumRiskBadge = (qRisk: string) => {
    switch (qRisk) {
      case 'VULNERABLE':
        return <span className="badge badge-critical font-mono text-[10px]">SHOR VULNERABLE</span>;
      case 'DEGRADED':
        return <span className="badge badge-high font-mono text-[10px]">GROVER DEGRADED</span>;
      case 'POST_QUANTUM':
        return <span className="badge badge-pqc font-mono text-[10px]">POST-QUANTUM READY</span>;
      default:
        return <span className="badge badge-safe font-mono text-[10px]">QUANTUM RESISTANT</span>;
    }
  };

  if (!cbom || components.length === 0) {
    return (
      <div className="p-16 rounded-3xl text-center space-y-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center">
          <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">Cryptographic Bill of Materials</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          No cryptographic assets were detected in this audit to generate a CBOM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Top CBOM Banner ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-orange-500" /> CYCLONEDX 1.6 CBOM SPECIFICATION
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              Serial: {cbom.serialNumber.slice(0, 24)}...
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
            <span>Cryptographic Bill of Materials</span>
            <span className="text-xs font-mono font-normal text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/40">
              {components.length} asset{components.length !== 1 ? 's' : ''} cataloged
            </span>
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            Machine-readable cryptographic software bill of materials cataloging algorithms, key strengths,
            curves, protocols, and NIST post-quantum readiness vectors.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setViewMode(viewMode === 'components' ? 'raw_json' : 'components')}
            className="px-4 py-2 rounded-full text-xs font-mono font-semibold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:border-orange-500 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Code className="w-3.5 h-3.5 text-orange-500" />
            <span>{viewMode === 'components' ? 'View CycloneDX JSON' : 'View Component Grid'}</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="px-4 py-2 rounded-full text-xs font-mono font-semibold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:border-orange-500 transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <a
            href={getCbomExportUrl(scanId)}
            download={`QuantumShield_CBOM_${scanId.slice(0, 8)}.json`}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-md shadow-orange-600/25 transition-all hover:scale-[1.02]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CBOM JSON</span>
          </a>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      {viewMode === 'components' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search components by algorithm, curve, file path, or BOM-ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primitive filter */}
            <select
              value={primitiveFilter}
              onChange={(e) => setPrimitiveFilter(e.target.value)}
              className="px-3.5 py-2 bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs text-stone-700 dark:text-stone-200 focus:outline-none focus:border-orange-500 font-mono"
            >
              <option value="ALL">All Primitives</option>
              <option value="KEM">KEM / Key Agreement</option>
              <option value="SIGNATURE">Digital Signature</option>
              <option value="PKE">Public Key Encryption</option>
              <option value="BLOCK-CIPHER">Block Cipher (AES/DES)</option>
              <option value="STREAM-CIPHER">Stream Cipher (ChaCha20)</option>
              <option value="MAC">MAC / HMAC</option>
              <option value="HASH">Hash Functions</option>
              <option value="KDF">KDF / Password Hash</option>
            </select>

            {/* Quantum risk filter */}
            <select
              value={quantumRiskFilter}
              onChange={(e) => setQuantumRiskFilter(e.target.value)}
              className="px-3.5 py-2 bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs text-stone-700 dark:text-stone-200 focus:outline-none focus:border-orange-500 font-mono"
            >
              <option value="ALL">All Quantum Risks</option>
              <option value="VULNERABLE">Shor Vulnerable</option>
              <option value="DEGRADED">Grover Degraded</option>
              <option value="SAFE">Quantum Safe</option>
              <option value="POST_QUANTUM">Post-Quantum (NIST)</option>
            </select>
          </div>
        </div>
      )}

      {/* ── View Mode: Raw CycloneDX 1.6 JSON ── */}
      {viewMode === 'raw_json' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">CycloneDX v1.6 Valid JSON Output</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-mono flex items-center gap-1 font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied to clipboard' : 'Copy all'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-stone-900 dark:bg-stone-950 border border-stone-800 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-[600px] leading-relaxed select-all">
            {JSON.stringify(cbom, null, 2)}
          </pre>
        </div>
      )}

      {/* ── View Mode: Component Cards Grid ── */}
      {viewMode === 'components' && (
        <div className="space-y-4">
          {filteredComponents.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-3 shadow-sm">
              <p className="text-sm text-stone-600 dark:text-stone-400">No cryptographic components match the current filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setPrimitiveFilter('ALL'); setQuantumRiskFilter('ALL'); }}
                className="text-xs text-orange-600 dark:text-orange-400 font-mono font-bold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComponents.map((comp, idx) => {
                const cryptoProps = comp.cryptoProperties?.algorithmProperties;
                const occ = comp.evidence?.occurrences?.[0];
                const qRisk = comp.properties?.find((p) => p.name === 'quantumshield:quantumRisk')?.value || 'SAFE';
                const qThreat = comp.properties?.find((p) => p.name === 'quantumshield:quantumThreat')?.value || 'None';
                const pqcRec = comp.properties?.find((p) => p.name === 'quantumshield:pqcRecommendation')?.value || 'N/A';
                const library = comp.properties?.find((p) => p.name === 'quantumshield:library')?.value || 'Standard API';
                const detMethod = comp.properties?.find((p) => p.name === 'quantumshield:detectionMethod')?.value || 'Static';

                return (
                  <div
                    key={comp['bom-ref'] || idx}
                    className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-orange-500/50 shadow-sm transition-all space-y-4 group"
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40">
                            {(cryptoProps?.primitive || 'ALGO').toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500 truncate max-w-[180px]">
                            {comp['bom-ref']}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-stone-900 dark:text-stone-50 font-mono tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {comp.version || comp.name}
                        </h4>
                      </div>
                      <div>{getQuantumRiskBadge(qRisk)}</div>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200/80 dark:border-stone-800">
                        <span className="text-stone-500 text-[10px] block font-semibold">SECURITY BITS</span>
                        <span className="text-stone-900 dark:text-stone-100 font-bold">
                          {cryptoProps?.classicalSecurityLevel ?? 'N/A'} classical bits
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200/80 dark:border-stone-800">
                        <span className="text-stone-500 text-[10px] block font-semibold">NIST QUANTUM LEVEL</span>
                        <span className={`font-bold ${cryptoProps?.nistQuantumSecurityLevel === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          Level {cryptoProps?.nistQuantumSecurityLevel ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Technical details list */}
                    <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                      {cryptoProps?.curve && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Curve / Modulus:</span>
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">{cryptoProps.curve}</span>
                        </div>
                      )}
                      {comp.cryptoProperties?.oid && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">ASN.1 OID:</span>
                          <span className="text-stone-800 dark:text-stone-200 truncate max-w-[160px]">{comp.cryptoProperties.oid}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Library / API:</span>
                        <span className="text-stone-800 dark:text-stone-200 truncate max-w-[160px]">{library}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Detection Method:</span>
                        <span className="text-stone-800 dark:text-stone-200 font-semibold">{detMethod}</span>
                      </div>
                    </div>

                    {/* Evidence location */}
                    {occ && (
                      <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/80 border border-stone-200/80 dark:border-stone-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-stone-600 dark:text-stone-400 truncate max-w-[220px]">{occ.location}</span>
                          {occ.line && <span className="text-orange-600 dark:text-orange-400 font-bold">Line {occ.line}</span>}
                        </div>
                        {occ.additionalContext && (
                          <div className="text-[10px] font-mono text-stone-500 truncate">
                            {occ.additionalContext}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PQC Recommendation Footer */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-500">PQC Transition:</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold">{pqcRec}</span>
                    </div>
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
