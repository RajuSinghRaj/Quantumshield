import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanUploadZone } from './components/ScanUploadZone';
import { QuantumScanAnimation } from './components/QuantumScanAnimation';
import { MigrationRoadmap } from './components/MigrationRoadmap';
import { EducationModule } from './components/EducationModule';
import { ScanHistoryTable } from './components/ScanHistoryTable';
import { QuantumLabPage } from './pages/QuantumLabPage';
import { PqcRemediationSandbox } from './components/PqcRemediationSandbox';
import { DevSecOpsDashboard } from './components/DevSecOpsDashboard';
import { RefreshCw, Terminal, Sparkles } from 'lucide-react';

import {
  checkApiHealth,
  fetchDemoProjects,
  scanUploadedFiles,
  scanDomainTLS,
  scanDemoProject,
  fetchScanResult,
  fetchScanHistory,
  deleteScanRecord,
  getPdfReportUrl,
} from './services/api';

import { ScanResult, ScanHistoryItem, DemoProjectInfo } from './types/scan';

export function App() {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'lab' || hash === 'quantum-lab' || hash === 'quantum') return 'quantum-lab';
      if (hash === 'reports') return 'dashboard';
      if (hash === 'learn') return 'education';
      if (['home', 'scanner', 'dashboard', 'reports', 'inventory', 'migration', 'devsecops', 'education', 'learn', 'history'].includes(hash)) {
        return hash === 'reports' ? 'dashboard' : (hash === 'learn' ? 'education' : hash);
      }
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (path === 'lab' || path === 'quantum-lab' || path === 'quantum') return 'quantum-lab';
      if (path === 'reports') return 'dashboard';
      if (path === 'learn') return 'education';
      if (['home', 'scanner', 'dashboard', 'reports', 'inventory', 'migration', 'devsecops', 'education', 'learn', 'history'].includes(path)) {
        return path === 'reports' ? 'dashboard' : (path === 'learn' ? 'education' : path);
      }
    }
    return 'home';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    const normalizedTab = tab === 'reports' ? 'dashboard' : (tab === 'learn' ? 'education' : tab);
    setActiveTabState(normalizedTab);
    if (typeof window !== 'undefined') {
      window.location.hash = normalizedTab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'lab' || hash === 'quantum-lab' || hash === 'quantum') {
        setActiveTabState('quantum-lab');
      } else if (['home', 'scanner', 'dashboard', 'reports', 'inventory', 'migration', 'devsecops', 'education', 'learn', 'history'].includes(hash)) {
        setActiveTabState(hash === 'reports' ? 'dashboard' : (hash === 'learn' ? 'education' : hash));
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark', 'dark');
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark', 'dark');
    }
  }, [isDarkMode]);
  const [demoProjects, setDemoProjects] = useState<DemoProjectInfo[]>([]);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check health and load demo projects + history on mount with auto-retry
  useEffect(() => {
    let intervalId: any;

    const initData = async () => {
      const healthy = await checkApiHealth();
      setIsBackendHealthy(healthy);

      if (healthy) {
        try {
          const demos = await fetchDemoProjects();
          setDemoProjects(demos);
        } catch (err) {
          console.warn('Could not load demo projects from backend');
        }

        try {
          const history = await fetchScanHistory();
          setScanHistory(history);
          if (history && history.length > 0) {
            const latest = await fetchScanResult(history[0].id);
            setCurrentScanResult(latest);
          } else {
            const demoResult = await scanDemoProject('legacy_bank');
            setCurrentScanResult(demoResult);
            const freshHistory = await fetchScanHistory();
            setScanHistory(freshHistory);
          }
        } catch (err) {
          console.warn('Could not load history or auto-seed demo from backend');
        }
      }
    };

    initData();

    // Auto-poll every 6s until connected (handles Render cold start)
    intervalId = setInterval(async () => {
      const healthy = await checkApiHealth();
      if (healthy) {
        setIsBackendHealthy(true);
        clearInterval(intervalId);
        try {
          const demos = await fetchDemoProjects();
          setDemoProjects(demos);
        } catch {}
        try {
          const history = await fetchScanHistory();
          setScanHistory(history);
          if (history && history.length > 0 && !currentScanResult) {
            const latest = await fetchScanResult(history[0].id);
            setCurrentScanResult(latest);
          }
        } catch {}
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  // Ensure devsecops, migration, or dashboard tabs automatically load demo data if not yet loaded
  useEffect(() => {
    if (['devsecops', 'migration', 'dashboard', 'reports'].includes(activeTab) && !currentScanResult && !isLoading && isBackendHealthy) {
      handleScanDemo('legacy_bank');
    }
  }, [activeTab, currentScanResult, isLoading, isBackendHealthy]);


  const handleScanFiles = async (files: File[], projectName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await scanUploadedFiles(files, projectName);
      setCurrentScanResult(result);
      const history = await fetchScanHistory();
      setScanHistory(history);
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Scan failed. Please check file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanDomain = async (domain: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await scanDomainTLS(domain);
      setCurrentScanResult(result);
      const history = await fetchScanHistory();
      setScanHistory(history);
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail ||
        (err.request
          ? 'Cannot reach the scanner API. Start the backend service and try again.'
          : err.message || 'Domain TLS scan failed.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanDemo = async (demoId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await scanDemoProject(demoId);
      setCurrentScanResult(result);
      const history = await fetchScanHistory();
      setScanHistory(history);
      if (activeTab === 'home' || activeTab === 'scanner') {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Demo scan failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryScan = async (scanId: string) => {
    setIsLoading(true);
    try {
      const result = await fetchScanResult(scanId);
      setCurrentScanResult(result);
      setActiveTab('dashboard');
    } catch (err) {
      setErrorMessage('Could not load scan result.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistoryScan = async (scanId: string) => {
    try {
      await deleteScanRecord(scanId);
      setScanHistory((prev) => prev.filter((item) => item.id !== scanId));
      if (currentScanResult?.scan_id === scanId) {
        setCurrentScanResult(null);
      }
    } catch (err) {
      console.error('Failed to delete scan');
    }
  };

  const handleDownloadPdf = () => {
    if (currentScanResult) {
      window.open(getPdfReportUrl(currentScanResult.scan_id), '_blank');
    }
  };

  return (
    <div className={`app-root min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendHealthy={isBackendHealthy}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto mt-4 px-4">
            <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between shadow-xl">
              <span>[!] ERROR: {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-white hover:text-rose-300 font-bold text-base">&times;</button>
            </div>
          </div>
        )}

        {/* Loading State Overlay */}
        {isLoading ? (
          <QuantumScanAnimation />
        ) : (
          <>
            {activeTab === 'home' && (
              <LandingPage
                onStartScan={() => setActiveTab('scanner')}
                onExploreRisks={() => setActiveTab('dashboard')}
                onSelectDemo={handleScanDemo}
                onNavigateTab={(tab) => setActiveTab(tab)}
                scanResult={currentScanResult}
              />
            )}

            {activeTab === 'scanner' && (
              <ScanUploadZone
                onScanFiles={handleScanFiles}
                onScanDomain={handleScanDomain}
                onScanDemo={handleScanDemo}
                demoProjects={demoProjects}
                isLoading={isLoading}
              />
            )}

            {(activeTab === 'dashboard' || activeTab === 'reports' || activeTab === 'inventory') && (
              <DashboardPage
                scanResult={currentScanResult}
                onNewScan={() => setActiveTab('scanner')}
              />
            )}

            {activeTab === 'quantum-lab' && (
              <QuantumLabPage />
            )}

            {activeTab === 'migration' && (
              <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 space-y-8">
                <PqcRemediationSandbox
                  scanId={currentScanResult?.scan_id || 'demo_legacy_bank'}
                  projectName={currentScanResult?.project_name || 'Legacy Banking Monolith'}
                  findings={currentScanResult?.findings || []}
                />
                <MigrationRoadmap
                  migrationPlan={currentScanResult?.migration_plan || []}
                  scanId={currentScanResult?.scan_id || 'demo_legacy_bank'}
                  onDownloadPdf={handleDownloadPdf}
                />
              </div>
            )}

            {activeTab === 'devsecops' && (
              <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
                <DevSecOpsDashboard
                  scanId={currentScanResult?.scan_id}
                  projectName={currentScanResult?.project_name || 'Legacy Banking Monolith'}
                />
              </div>
            )}

            {(activeTab === 'education' || activeTab === 'learn') && (
              <EducationModule />
            )}

            {activeTab === 'history' && (
              <ScanHistoryTable
                history={scanHistory}
                onSelectScan={handleSelectHistoryScan}
                onDeleteScan={handleDeleteHistoryScan}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default App;
