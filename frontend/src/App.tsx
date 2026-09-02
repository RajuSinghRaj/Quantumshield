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
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [demoProjects, setDemoProjects] = useState<DemoProjectInfo[]>([]);
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check health and load demo projects + history on mount
  useEffect(() => {
    const initData = async () => {
      const healthy = await checkApiHealth();
      setIsBackendHealthy(healthy);

      try {
        const demos = await fetchDemoProjects();
        setDemoProjects(demos);
      } catch (err) {
        console.warn('Could not load demo projects from backend');
      }

      try {
        const history = await fetchScanHistory();
        setScanHistory(history);
      } catch (err) {
        console.warn('Could not load history from backend');
      }
    };

    initData();
  }, []);

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
      setErrorMessage(err.response?.data?.detail || 'Domain TLS scan failed.');
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
      setActiveTab('dashboard');
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      
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
                onExploreRisks={() => setActiveTab('education')}
                onSelectDemo={handleScanDemo}
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

            {(activeTab === 'dashboard' || activeTab === 'inventory') && (
              <DashboardPage
                scanResult={currentScanResult}
                onNewScan={() => setActiveTab('scanner')}
              />
            )}

            {activeTab === 'migration' && (
              <MigrationRoadmap
                migrationPlan={currentScanResult?.migration_plan || []}
                scanId={currentScanResult?.scan_id}
                onDownloadPdf={currentScanResult ? handleDownloadPdf : undefined}
              />
            )}

            {activeTab === 'education' && (
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
