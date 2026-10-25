export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' | 'INFO';
export type QuantumRisk = 'VULNERABLE' | 'DEGRADED' | 'SAFE' | 'POST_QUANTUM';
export type ClassicalRisk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface SimulationOffer {
  type: 'shor' | 'grover';
  algorithm: string;
  target_number?: number;
  target_state?: string;
  label: string;
}

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
  simulation_type?: 'shor' | 'grover' | 'none';
  simulation_offer?: SimulationOffer;
  source?: string;
}

export interface QuantumSimulationResult {
  algorithm: string;
  quantum_attack: string;
  target_number?: number;
  coprime_a?: number;
  target_state?: string;
  search_space_size?: number;
  qubits: number;
  circuit_depth: number;
  shots: number;
  measurement_results: Record<string, number>;
  probabilities: Record<string, number>;
  period_found?: number;
  factors?: number[];
  risk_level: RiskLevel;
  simulation_available: boolean;
  simulation_warning: string;
  explanation: string;
  complexity_comparison?: {
    classical_complexity: string;
    quantum_complexity: string;
    aes128_classical: string;
    aes128_quantum: string;
    aes256_classical: string;
    aes256_quantum: string;
  };
  circuit_ascii: string;
}

export interface BBM92BasisStatistics {
  alice_z_count: number;
  alice_x_count: number;
  bob_z_count: number;
  bob_x_count: number;
  basis_breakdown: Record<string, number>;
}

export interface BBM92MeasurementCounts {
  matched_outcomes: Record<string, number>;
  ideal_correlated: number;
  anti_correlated: number;
}

export interface BBM92CircuitMetadata {
  qubits: number;
  circuit_depth: number;
  gate_count: number;
  gate_counts: Record<string, number>;
  circuit_ascii: string;
  bell_state: string;
  basis_conventions: Record<string, string>;
  quirk_url: string;
}

export interface BBM92TimelineStep {
  step: number;
  title: string;
  description: string;
  metric: string;
}

export interface BBM92SimulationResult {
  protocol: string;
  simulator: string;
  scenario: 'ideal' | 'eve' | 'noisy';
  status: 'COMPLETED_SECURE' | 'COMPLETED_ABORTED' | 'INSUFFICIENT_SAMPLE' | 'ERROR' | 'UNAVAILABLE';
  status_message: string;
  pair_count: number;
  matched_bases_count: number;
  matched_bases_percentage: number;
  test_sample_size: number;
  test_sample_errors: number;
  measured_qber: number;
  expected_qber: number;
  threshold_qber: number;
  candidate_key_length: number;
  candidate_key_preview?: string;
  candidate_key_errors?: number;
  basis_statistics?: BBM92BasisStatistics;
  measurement_counts?: BBM92MeasurementCounts;
  execution_time_ms?: number;
  circuit_metadata?: BBM92CircuitMetadata;
  timeline_steps?: BBM92TimelineStep[];
  interpretation?: string;
  limitations?: string;
  simulation_available: boolean;
}


export interface QuantumAnalysisInfo {
  scan_id: string;
  qiskit_available: boolean;
  shor_applicable_count: number;
  grover_applicable_count: number;
  shor_targets: Array<{ algorithm: string; variant: string; file_path: string; suggested_n: number; suggested_a: number }>;
  grover_targets: Array<{ algorithm: string; variant: string; file_path: string; suggested_target_state: string }>;
  overall_quantum_score: number;
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
