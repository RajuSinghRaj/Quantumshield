import React, { useState, useRef } from 'react';
import {
  Upload, Globe, FileCode, Lock, Sparkles, ArrowRight,
  X, Shield, AlertCircle, CheckCircle2, Zap,
} from 'lucide-react';
import { DemoProjectInfo } from '../types/scan';

interface ScanUploadZoneProps {
  onScanFiles: (files: File[], projectName: string) => void;
  onScanDomain: (domain: string) => void;
  onScanDemo: (demoId: string) => void;
  demoProjects: DemoProjectInfo[];
  isLoading: boolean;
}

export const ScanUploadZone: React.FC<ScanUploadZoneProps> = ({
  onScanFiles, onScanDomain, onScanDemo, demoProjects, isLoading,
}) => {
  const [activeTab, setActiveTab]       = useState<'upload' | 'domain' | 'demo'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectName, setProjectName]   = useState('');
  const [domainInput, setDomainInput]   = useState('');
  const [isDragOver, setIsDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  const handleRemoveFile  = (i: number) => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
  const handleStartUpload = () => { if (selectedFiles.length) onScanFiles(selectedFiles, projectName || selectedFiles[0].name); };
  const handleStartDomain = (e: React.FormEvent) => { e.preventDefault(); if (domainInput) onScanDomain(domainInput); };

  const tabs = [
    { id: 'upload' as const, label: 'Code / Cert / ZIP', icon: Upload },
    { id: 'domain' as const, label: 'Website TLS Audit',  icon: Globe  },
    { id: 'demo'   as const, label: 'Demo Targets',       icon: Sparkles },
  ];

  return (
    <div className="scan-upload-page w-full max-w-[1400px] mx-auto py-10 px-4 sm:px-8 lg:px-12 space-y-7">

      {/* Page title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">Cryptographic Security Audit</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">Upload source code, certificates, or scan a website to detect quantum-vulnerable cryptography.</p>
      </div>

      {/* Zero key exposure policy banner */}
      <div className="p-4 rounded-2xl flex items-start gap-3 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/40">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="text-[12px] leading-relaxed text-stone-700 dark:text-stone-300">
          <strong className="text-stone-900 dark:text-stone-100 font-semibold">Zero Private Key Exposure Policy: </strong>
          QuantumShield exclusively inspects source code, public X.509 certificates, public keys, and configuration files.
          <span className="text-rose-600 dark:text-rose-400 font-semibold"> Never upload private key files.</span>
        </div>
      </div>

      {/* Main card */}
      <div className="glass-panel rounded-3xl border border-orange-100 dark:border-stone-800 overflow-hidden shadow-xl bg-white/95 dark:bg-stone-900/95">

        {/* Tab bar */}
        <div className="flex border-b border-orange-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 p-2 gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 px-4 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-orange-50/60 dark:hover:bg-stone-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab 1: File Upload ── */}
        {activeTab === 'upload' && (
          <div className="p-8 space-y-6">

            {/* Project name input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Project Title <span className="text-stone-400 dark:text-stone-500 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Core Banking System Audit"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`py-14 text-center flex flex-col items-center gap-4 transition-all cursor-pointer rounded-3xl border-2 border-dashed ${
                isDragOver
                  ? 'border-orange-500 bg-orange-100/60 dark:bg-orange-950/40'
                  : 'border-orange-200/90 dark:border-stone-800 bg-orange-50/40 dark:bg-stone-950/30 hover:border-orange-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".py,.java,.js,.ts,.jsx,.tsx,.c,.cpp,.go,.pem,.crt,.cer,.csr,.pub,.json,.yaml,.yml,.zip"
                className="hidden"
              />
              <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-stone-900 dark:text-stone-50">
                  {isDragOver ? 'Release to add files' : 'Drop source code or project ZIP here'}
                </h3>
                <p className="text-[12px] text-stone-600 dark:text-stone-400 mt-1 max-w-md mx-auto">
                  Supports Python, Java, JS/TS, Go, C++, X.509 certificates (.pem, .crt, .pub), or complete ZIP archives.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {['.py', '.java', '.js', '.ts', '.pem', '.crt', '.zip', '+ More'].map(ext => (
                  <span key={ext} className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* File list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 dark:text-stone-400 font-semibold">Selected Files ({selectedFiles.length})</span>
                  <button onClick={() => setSelectedFiles([])} className="text-rose-600 dark:text-rose-400 hover:underline font-bold">
                    Clear All
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-[12px] text-stone-800 dark:text-stone-200">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-stone-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveFile(i); }}
                        className="text-stone-400 hover:text-rose-500 ml-3 shrink-0 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run button */}
            <button
              onClick={handleStartUpload}
              disabled={selectedFiles.length === 0 || isLoading}
              className="w-full justify-center py-4 rounded-full text-[14px] font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/25 flex items-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Scanning Cryptography…</span></>
              ) : (
                <><Sparkles className="w-4 h-4 text-white" /><span>Run Security Audit</span></>
              )}
            </button>

          </div>
        )}

        {/* ── Tab 2: Domain Audit ── */}
        {activeTab === 'domain' && (
          <form onSubmit={handleStartDomain} className="p-8 space-y-6">

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Target Hostname / Domain</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. google.com"
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-relaxed">
                QuantumShield performs a public TLS 1.3 handshake on port 443, inspects the X.509 certificate chain, and evaluates quantum resistance of cipher suites.
              </p>
            </div>

            {/* Info boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Shield,       label: 'TLS Version Check',     sub: 'TLS 1.3 / 1.2 / legacy' },
                { icon: Lock,         label: 'Certificate Analysis',   sub: 'RSA, ECDSA, key sizes'  },
                { icon: AlertCircle,  label: 'Cipher Suite Audit',     sub: 'Quantum-safe assessment' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="p-4 text-center space-y-2 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                  <Icon className="w-5 h-5 text-orange-500 mx-auto" />
                  <p className="text-[12px] font-bold text-stone-900 dark:text-stone-50">{label}</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">{sub}</p>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={!domainInput || isLoading}
              className="w-full justify-center py-4 rounded-full text-[14px] font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/25 flex items-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Connecting…</span></>
              ) : (
                <><Globe className="w-4 h-4 text-white" /><span>Audit Website TLS Certificate</span></>
              )}
            </button>

          </form>
        )}

        {/* ── Tab 3: Demo Targets ── */}
        {activeTab === 'demo' && (
          <div className="p-8 space-y-6">

            <div>
              <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-50">Pre-Configured Audit Environments</h3>
              <p className="text-[12px] text-stone-600 dark:text-stone-400 mt-1">
                Select a target to run a complete audit scan instantly without uploading files:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {demoProjects.map(demo => (
                <div
                  key={demo.id}
                  onClick={() => onScanDemo(demo.id)}
                  className="p-5 cursor-pointer flex flex-col justify-between gap-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-orange-400/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40">{demo.category}</span>
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    </div>
                    <h4 className="font-bold text-[14px] text-stone-900 dark:text-stone-50">{demo.name}</h4>
                    <p className="text-[12px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{demo.description}</p>
                  </div>
                  <button
                    disabled={isLoading}
                    className="w-full justify-center py-2.5 text-[12px] font-bold rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/25 transition-all disabled:opacity-50"
                    onClick={e => { e.stopPropagation(); onScanDemo(demo.id); }}
                  >
                    {isLoading ? 'Running…' : 'Run Demo Audit'}
                  </button>
                </div>
              ))}

              {demoProjects.length === 0 && (
                <div className="col-span-2 text-center py-12 text-stone-400">
                  <Zap className="w-8 h-8 mx-auto mb-3 opacity-40 text-orange-500" />
                  <p className="text-[13px]">Loading demo projects… (backend must be running)</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
