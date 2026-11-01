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
  curve_or_parameters?: string;
  library_or_api?: string;
  detection_method?: string;
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
    aes_128?: any;
    aes_256?: any;
    explanation?: string;
  };
  circuit_ascii: string;
  execution_time_ms?: number;
  phase_candidates?: any[];
  modular_sequence?: any[];
  quantum_vs_classical_steps?: string[];
  threat_analysis?: string;
  hardware_requirements?: any;
  classical_post_processing?: string;
  progression?: any[];
  marked_state_probability?: number;
  initial_probability?: number;
  iteration_probabilities?: any[];
  over_rotation?: boolean;
  educational_notes?: string;
  educational_simulation?: boolean;
  success?: boolean;
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

// ==================== CYCLONEDX 1.6 CBOM INTERFACES ====================

export interface CBOMOccurrence {
  location: string;
  line?: number;
  offset?: number;
  additionalContext?: string;
}

export interface CBOMAlgorithmProperties {
  primitive: string;
  parameterSetIdentifier?: string;
  curve?: string;
  executionEnvironment?: string;
  implementationPlatform?: string;
  classicalSecurityLevel?: number;
  nistQuantumSecurityLevel?: number;
  cryptoFunctions?: string[];
}

export interface CBOMCryptoProperties {
  assetType: 'algorithm' | 'certificate' | 'protocol' | 'related-crypto-material';
  algorithmProperties?: CBOMAlgorithmProperties;
  oid?: string;
}

export interface CBOMProperty {
  name: string;
  value: string;
}

export interface CBOMComponent {
  type: string;
  'bom-ref': string;
  name: string;
  version?: string;
  description?: string;
  cryptoProperties?: CBOMCryptoProperties;
  evidence?: {
    occurrences?: CBOMOccurrence[];
  };
  properties?: CBOMProperty[];
}

export interface CBOMDocument {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools?: {
      components?: Array<{
        type: string;
        name: string;
        version: string;
        description?: string;
        externalReferences?: Array<{
          type: string;
          url: string;
        }>;
      }>;
    };
    component?: {
      type: string;
      name: string;
      'bom-ref': string;
      version?: string;
    };
    properties?: CBOMProperty[];
  };
  components: CBOMComponent[];
  dependencies?: any[];
}

// ==================== DEPENDENCY MAPPER INTERFACES ====================

export type DependencyEcosystem = 'python' | 'npm' | 'maven' | 'go' | 'cargo' | 'native' | 'unknown';
export type PqcSupportStatus = 'SUPPORTED' | 'EXPERIMENTAL' | 'REQUIRES_UPGRADE' | 'REQUIRES_REPLACEMENT' | 'UNSUPPORTED' | 'UNVERIFIED';

export interface AssociatedFindingInfo {
  id: string;
  algorithm: string;
  variant?: string;
  file_path: string;
  line_number?: number;
  quantum_risk: QuantumRisk;
  classical_risk: ClassicalRisk;
}

export interface CryptoDependency {
  package_name: string;
  canonical_name: string;
  version: string;
  manifest_path: string;
  ecosystem: DependencyEcosystem;
  direct: boolean;
  transitive: boolean;
  description: string;
  default_primitives: string[];
  pqc_support_status: PqcSupportStatus;
  pqc_details: string;
  recommended_upgrade: string;
  associated_algorithms: string[];
  associated_findings: AssociatedFindingInfo[];
  related_files: string[];
  active_in_code: boolean;
  classical_risk: ClassicalRisk;
  quantum_risk: QuantumRisk;
  confidence: number;
}

export interface DependencySummary {
  total_dependencies: number;
  cryptographic_dependencies: number;
  non_cryptographic_dependencies: number;
  direct_crypto_dependencies: number;
  transitive_crypto_dependencies: number;
  active_in_source_code: number;
  declared_only: number;
  quantum_vulnerable_count: number;
  pqc_ready_count: number;
}

export interface DependencyGraphNode {
  id: string;
  label: string;
  type: 'project' | 'package' | 'algorithm' | 'finding';
  ecosystem?: DependencyEcosystem;
  direct?: boolean;
  transitive?: boolean;
  active?: boolean;
  pqc_status?: PqcSupportStatus;
  quantum_risk: QuantumRisk;
  classical_risk?: ClassicalRisk;
  file_path?: string;
  line_number?: number;
  parent_package?: string;
}

export interface DependencyGraphLink {
  source: string;
  target: string;
  relationship: string;
  quantum_risk?: QuantumRisk;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  links: DependencyGraphLink[];
  total_nodes: number;
  total_links: number;
}

export interface MigrationImpactItem {
  package_name: string;
  ecosystem: DependencyEcosystem;
  current_version: string;
  manifest_path: string;
  active_in_code: boolean;
  dependent_assets: string[];
  affected_files: string[];
  affected_files_count: number;
  pqc_support_status: PqcSupportStatus;
  quantum_risk: QuantumRisk;
  migration_complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  complexity_reason: string;
  recommended_action: string;
}

// ==================== BATCH 3: TLS & CERTIFICATE / KEY INTERFACES ====================

export type CertificateValidityStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_YET_VALID';
export type TLSQuantumClassification = 'CLASSICAL' | 'HYBRID_POST_QUANTUM' | 'POST_QUANTUM' | 'UNKNOWN';

export interface CertificateDetails {
  source_path: string;
  subject: string;
  subject_common_name: string;
  subject_details: Record<string, string>;
  issuer: string;
  issuer_common_name: string;
  issuer_details: Record<string, string>;
  serial_number: string;
  serial_number_int: number;
  fingerprint_sha256: string;
  fingerprint_sha1: string;
  valid_from: string;
  valid_until: string;
  days_to_expiry: number;
  is_expired: boolean;
  validity_status: CertificateValidityStatus;
  subject_alt_names: string[];
  is_ca: boolean;
  path_length?: number | null;
  key_usage: string[];
  extended_key_usage: string[];
  public_key: {
    algorithm: string;
    variant: string;
    key_size: number;
    curve?: string | null;
  };
  signature_algorithm: string;
  signature_hash: string;
  classical_risk: ClassicalRisk;
  classical_reason: string;
  quantum_risk: QuantumRisk;
  quantum_threat: string;
  pqc_alternative: string;
  security_findings: Array<{
    type: string;
    severity: RiskLevel;
    title: string;
    description: string;
    recommendation: string;
  }>;
}

export interface TLSSecurityFinding {
  type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  classical_risk?: ClassicalRisk;
  quantum_risk?: QuantumRisk;
  recommendation?: string;
}

export interface TLSScanData {
  status: 'ONLINE' | 'UNREACHABLE';
  hostname: string;
  resolved_ip: string;
  port: number;
  error?: string;
  tls_protocol: string;
  cipher_suite: string;
  symmetric_key_bits: number;
  key_exchange: string;
  key_exchange_details: string;
  quantum_classification: TLSQuantumClassification;
  server_certificate?: CertificateDetails | null;
  certificate_chain?: CertificateDetails[];
  security_findings: TLSSecurityFinding[];
  scan_timestamp?: number;
}

export interface KeyAnalysisResult {
  key_type: string;
  file_path: string;
  status: string;
  algorithm?: string;
  variant?: string;
  key_size?: number;
  curve?: string | null;
  classical_risk?: ClassicalRisk;
  classical_reason?: string;
  quantum_risk?: QuantumRisk;
  quantum_threat?: string;
  pqc_alternative?: string;
  private_key_redacted?: boolean;
  content_persisted?: boolean;
  raw_key_material_discarded?: boolean;
  privacy_notice?: string;
  message?: string;
}

// ==================== BATCH 4: QUANTUM RISK INTELLIGENCE & HNDL ====================

export interface HNDLAssessment {
  assessment_id: string;
  category: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  lifetime: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'INDEFINITE' | 'UNKNOWN';
  effective_sensitivity: string;
  effective_lifetime: string;
  is_user_specified: boolean;
  assumptions: string[];
  exposure_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  hndl_score: number;
  has_classical_key_exchange: boolean;
  has_hybrid_key_exchange: boolean;
  description: string;
  associated_assets: string[];
  explanation: string;
  recommendation: string;
}

export interface HNDLProfile {
  overall_hndl_score: number;
  overall_hndl_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  key_exchange_context: {
    classical_key_exchanges: any[];
    pqc_key_exchanges: any[];
    hybrid_key_exchanges: any[];
    has_pqc_protection: boolean;
    has_classical_exposure: boolean;
    total_classical_kx_count: number;
    total_pqc_kx_count: number;
  };
  assessments: HNDLAssessment[];
  presets: Array<{
    category: string;
    sensitivity: string;
    lifetime: string;
    description: string;
  }>;
  summary: {
    total_categories_assessed: number;
    critical_exposure_count: number;
    high_exposure_count: number;
    moderate_exposure_count: number;
    low_exposure_count: number;
    unspecified_parameters_count: number;
  };
}

export interface MigrationPriorityItem {
  primitive: string;
  algorithm: string;
  usage: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: string;
  recommended_pqc: string;
  rationale: string;
  affected_files: string[];
  associated_dependencies: string[];
}

export interface UnifiedRiskScores {
  classical_security_score: number;
  quantum_readiness_score: number;
  quantum_exposure_score: number;
  classical_exposure_score: number;
  hndl_exposure_score: number;
  supply_chain_risk_score: number;
  pqc_adoption_percentage: number;
}

export interface OverallSecurityRisk {
  score: number;
  level: RiskLevel;
  formula: string;
  weights: Record<string, number>;
  contributions: Record<string, number>;
}

export interface RiskIntelligenceData {
  overall_security_risk: OverallSecurityRisk;
  scores: UnifiedRiskScores;
  asset_metrics: {
    total_cryptographic_assets: number;
    shor_vulnerable_assets: number;
    grover_degraded_assets: number;
    classical_broken_assets: number;
    classical_deprecated_assets: number;
    pqc_standardized_assets: number;
    unverified_pqc_assets: number;
  };
  score_deductions_and_bonuses: {
    classical_deductions: Array<{ asset: string; source: string; reason: string; deduction: number }>;
    quantum_deductions: Array<{ asset: string; source: string; threat: string; reason: string; deduction: number }>;
    pqc_bonuses: Array<{ asset: string; reason: string; bonus: number }>;
  };
  hndl_analysis: HNDLProfile;
  migration_priorities: MigrationPriorityItem[];
  correlated_assets: any[];
}

// ==================== BATCH 5: PQC REMEDIATION, SANDBOX & HYBRID LAB ====================

export interface CodeRemediationProposal {
  finding_id?: string | number;
  file_path: string;
  line_number: number | null;
  vulnerable_primitive: string;
  algorithm: string;
  usage: string;
  target_pqc: string;
  target_standard: string;
  dependency_changes: string;
  rationale: string;
  patch_type: 'AUTOMATED_PATCH' | 'MANUAL_TEMPLATE' | 'MIGRATION_TEMPLATE';
  can_auto_apply: boolean;
  manual_engineering_required: boolean;
  original_code: string;
  proposed_code: string;
  unified_diff: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
  disclaimer: string;
}

export interface RemediationComparison {
  comparison_id: string;
  original_scan_id: string;
  remediated_scan_id: string;
  score_deltas: {
    quantum_readiness_delta: number;
    classical_security_delta: number;
    pqc_adoption_delta: number;
    overall_risk_score_delta: number;
    before: {
      quantum_score: number;
      classical_score: number;
      overall_risk_level: RiskLevel;
    };
    after: {
      quantum_score: number;
      classical_score: number;
      overall_risk_level: RiskLevel;
    };
  };
  findings_delta: {
    original_count: number;
    remediated_count: number;
    resolved_count: number;
    unresolved_count: number;
    resolved_items: Array<{
      primitive: string;
      algorithm: string;
      file_path: string;
      line_number: number | null;
      original_severity: string;
      status: string;
      evidence: string;
    }>;
    unresolved_items: Array<{
      primitive: string;
      algorithm: string;
      file_path: string;
      line_number: number | null;
      severity: string;
      status: string;
      evidence: string;
    }>;
  };
  audit_trail: Array<{
    timestamp: string;
    action: string;
    file?: string;
    line?: number;
    primitive?: string;
    details?: string;
  }>;
}

export interface HybridDemoResult {
  success: boolean;
  demonstration: string;
  construction: {
    classical_kex: string;
    post_quantum_kem: string;
    key_derivation: string;
    authenticated_cipher: string;
  };
  quantum_security_guarantee: string;
  sizes_bytes: Record<string, number>;
  previews: Record<string, string>;
  timings_ms: Record<string, number>;
  tamper_verification: {
    tamper_simulated: boolean;
    tamper_detected: boolean;
    status: string;
    exception?: string;
  };
  environment?: {
    mlkem_available: boolean;
    mlkem_version?: string;
    mlkem_standard?: string;
    cryptography_version: string;
    supported_modes: string[];
  };
  error?: string;
  dependency_requirement?: string;
}

// ==================== SCAN INTERFACES ====================

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
  cbom?: CBOMDocument;
  dependencies?: CryptoDependency[];
  dependency_graph?: DependencyGraph;
  migration_impact?: MigrationImpactItem[];
  dependency_summary?: DependencySummary;
  tls_data?: TLSScanData;
  certificate_data?: CertificateDetails[];
  risk_analysis?: RiskIntelligenceData;
  hndl?: HNDLProfile;
  migration_priorities?: MigrationPriorityItem[];
  remediation_data?: any;
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

// ============================================================================
// DevSecOps Security Gate & Policy Types (Batch 7)
// ============================================================================

export type PolicyCategory = 
  | 'CLASSICAL_CRYPTOGRAPHY' 
  | 'QUANTUM_SECURITY' 
  | 'SUPPLY_CHAIN_DEPENDENCY' 
  | 'CBOM_COMPLIANCE';

export type PolicySeverity = 'BLOCKING' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type GateEnforcementMode = 'BLOCKING_FAILURE' | 'ADVISORY_WARNING' | 'MANUAL_REVIEW_REQUIRED';

export type GateStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'MANUAL_REVIEW_REQUIRED';

export interface GateThresholds {
  max_critical_findings?: number;
  max_high_findings?: number;
  max_quantum_risk_score?: number;
  max_classical_risk_score?: number;
  max_hndl_exposure_score?: number;
  require_cbom?: boolean;
  allow_advisory_warnings?: boolean;
  block_on_unverified_pqc?: boolean;
}

export interface DevSecOpsPolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  severity: PolicySeverity;
  enforcement: GateEnforcementMode;
  description: string;
  rule_type: string;
  is_builtin: boolean;
  enabled: boolean;
}

export interface PolicyViolationItem {
  rule_id: string;
  rule_name: string;
  category: PolicyCategory;
  severity: PolicySeverity;
  enforcement: GateEnforcementMode;
  message: string;
  file_path?: string;
  line_number?: number;
  evidence?: string;
  remediation_guidance?: string;
  exception_applied?: boolean;
  exception_reason?: string;
}

export interface GateEvaluationResult {
  pipeline_status: GateStatus;
  summary: string;
  thresholds_evaluated: GateThresholds;
  thresholds_passed: boolean;
  threshold_failures: string[];
  blocking_violations: PolicyViolationItem[];
  advisory_warnings: PolicyViolationItem[];
  manual_reviews: PolicyViolationItem[];
  exceptions_applied: any[];
  metrics: Record<string, any>;
}

export interface SecurityAssessment {
  assessment_id: string;
  scan_id: string;
  project_name: string;
  evaluated_at: string;
  gate_result: GateEvaluationResult;
  policies_applied: DevSecOpsPolicy[];
  cbom_reference?: {
    cbom_generated: boolean;
    spec_version?: string;
    serial_number?: string;
    total_components?: number;
  };
  migration_readiness?: {
    total_recommendations: number;
    pqc_remediated_count: number;
    migration_plan_available: boolean;
  };
  metadata?: Record<string, any>;
}

export interface DevSecOpsAssessmentListItem {
  id: string;
  scan_id: string;
  project_name: string;
  evaluated_at: string;
  pipeline_status: GateStatus;
  gate_summary: string;
  blocking_count: number;
  warning_count: number;
  review_count: number;
}

