import React, { useState, useRef } from 'react';
import { Upload, Globe, FileCode, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { DemoProjectInfo } from '../types/scan';

interface ScanUploadZoneProps {
  onScanFiles: (files: File[], projectName: string) => void;
  onScanDomain: (domain: string) => void;
  onScanDemo: (demoId: string) => void;
  demoProjects: DemoProjectInfo[];
  isLoading: boolean;
}

export const ScanUploadZone: React.FC<ScanUploadZoneProps> = ({
  onScanFiles,
  onScanDomain,
  onScanDemo,
  demoProjects,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'domain' | 'demo'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartFileUpload = () => {
    if (selectedFiles.length === 0) return;
    onScanFiles(selectedFiles, projectName || selectedFiles[0].name);
  };

  const handleStartDomainScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return;
    onScanDomain(domainInput);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-8 lg:px-12 space-y-6">
      
      {/* Zero Key Exposure Disclaimer */}
      <div className="p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-indigo-950/20 text-slate-300 text-xs flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <strong className="text-white font-medium">Zero Private Key Exposure Policy:</strong> QuantumShield exclusively inspects source code, public X.509 certificates, public keys, and configuration files. Never upload private key files.
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        
        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Code / Cert / ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('domain')}
            className={`flex-1 py-3 px-4 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'domain'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website TLS Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-3 px-4 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'demo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Demo Targets</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Project Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Core Banking System Audit"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-3 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
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

              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Drop source code or project ZIP here
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports Python, Java, JS/TS, Go, C++, X.509 certificates (.pem, .crt, .pub), or complete ZIP archives.
                </p>
              </div>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Selected Files ({selectedFiles.length})</span>
                  <button onClick={() => setSelectedFiles([])} className="text-rose-400 hover:underline">Clear All</button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }} className="text-slate-500 hover:text-rose-400 text-sm">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStartFileUpload}
              disabled={selectedFiles.length === 0 || isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Scanning Cryptography...' : 'Run Security Audit'}</span>
            </button>

          </div>
        )}

        {/* Tab 2: Domain Audit */}
        {activeTab === 'domain' && (
          <form onSubmit={handleStartDomainScan} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Target Hostname / Domain</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. google.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
              <p className="text-xs text-slate-400">
                QuantumShield performs a public TLS 1.3 handshake on port 443, inspects the X.509 certificate chain, and checks quantum resistance of cipher suites.
              </p>
            </div>

            <button
              type="submit"
              disabled={!domainInput || isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>{isLoading ? 'Connecting...' : 'Audit Website TLS Certificate'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Demo Targets */}
        {activeTab === 'demo' && (
          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Pre-Configured Audit Environments</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a target to run a complete audit scan instantly without uploading files:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {demoProjects.map((demo) => (
                <div
                  key={demo.id}
                  onClick={() => onScanDemo(demo.id)}
                  className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800 uppercase">
                        {demo.category}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-sm text-white mt-2">{demo.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{demo.description}</p>
                  </div>

                  <button
                    disabled={isLoading}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Run Demo Audit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
