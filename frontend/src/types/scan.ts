export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' | 'INFO';
export type QuantumRisk = 'VULNERABLE' | 'DEGRADED' | 'SAFE' | 'POST_QUANTUM';
export type ClassicalRisk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface CryptographicAsset {
  algorithm: string;
  variant: string;
  key_size?: number;
  usage: string;
  file_path: string;
  line_number?: number;
  code_snippet?: string;
  confidence?: number;
  classical_risk: ClassicalRisk;
  quantum_risk: QuantumRisk;
  quantum_threat: string;
  severity: RiskLevel;
  title: string;
  explanation: string;
  why_problem: string;
  recommendation: string;
  pqc_alternative?: string;
  source?: string;
}

export interface DeductionItem {
  type: 'QUANTUM' | 'CLASSICAL';
  asset: string;
  file?: string;
  line?: number;
  threat: string;
  penalty: number;
  reason: string;
}

export interface BonusItem {
  reason: string;
  points: number;
}

export interface ScoreBreakdown {
  quantum_readiness_score: number;
  classical_security_score: number;
  pqc_adoption_percentage: number;
  overall_risk: RiskLevel;
  total_assets: number;
  pqc_assets_count: number;
  shor_vulnerable_count: number;
  grover_degraded_count: number;
  classical_broken_count: number;
  deductions: DeductionItem[];
  bonuses: BonusItem[];
}

export interface RiskScores {
  classical_score: number;
  quantum_score: number;
  pqc_score: number;
  overall_risk: RiskLevel;
}

export interface MigrationItem {
  current_algorithm: string;
  usage: string;
  classical_risk: ClassicalRisk;
  quantum_risk: QuantumRisk;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommended_replacement: string;
  strategy: string;
  action_steps: string[];
}

export interface ScanResult {
  scan_id: string;
  project_name: string;
  scan_type: string;
  created_at: string;
  scores: RiskScores;
  breakdown: ScoreBreakdown;
  findings: CryptographicAsset[];
  migration_plan: MigrationItem[];
  file_sources?: Record<string, string>;
  asset_counts?: Record<string, number>;
}

export interface ScanHistoryItem {
  id: string;
  project_name: string;
  scan_type: string;
  created_at: string;
  quantum_score: number;
  classical_score: number;
  overall_risk: RiskLevel;
  asset_counts: Record<string, number>;
}

export interface DemoProjectInfo {
  id: string;
  name: string;
  description: string;
  category: string;
}
