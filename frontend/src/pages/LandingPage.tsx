import React from 'react';
import { Hero } from '../components/Hero';
import { ScanResult } from '../types/scan';

interface LandingPageProps {
  onStartScan: () => void;
  onExploreRisks: () => void;
  onSelectDemo: (demoId: string) => void;
  onNavigateTab?: (tab: string) => void;
  scanResult?: ScanResult | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartScan,
  onExploreRisks,
  onSelectDemo,
  onNavigateTab,
  scanResult,
}) => {
  return (
    <div>
      <Hero
        onStartScan={onStartScan}
        onExploreRisks={onExploreRisks}
        onSelectDemo={onSelectDemo}
        onNavigateTab={onNavigateTab}
        scanResult={scanResult}
      />
    </div>
  );
};
