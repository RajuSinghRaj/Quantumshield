import React from 'react';
import { Hero } from '../components/Hero';
import { ScanResult } from '../types/scan';

interface LandingPageProps {
  onStartScan: () => void;
  onExploreRisks: () => void;
  onSelectDemo: (demoId: string) => void;
  scanResult?: ScanResult | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartScan,
  onExploreRisks,
  onSelectDemo,
  scanResult,
}) => {
  return (
    <div>
      <Hero
        onStartScan={onStartScan}
        onExploreRisks={onExploreRisks}
        onSelectDemo={onSelectDemo}
        scanResult={scanResult}
      />
    </div>
  );
};
