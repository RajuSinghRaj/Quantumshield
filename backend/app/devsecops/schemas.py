"""
DevSecOps Pydantic Models and Data Structures for QuantumShield 2.0.
Provides typed definitions for security policies, CI/CD gates, thresholds,
exceptions, and machine-readable cryptographic security assessments.
"""

from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pydantic import BaseModel, Field


class PolicyCategory(str, Enum):
    CLASSICAL = "CLASSICAL"
    QUANTUM = "QUANTUM"
    DEPENDENCY = "DEPENDENCY"
    CBOM = "CBOM"
    CUSTOM = "CUSTOM"


class PolicySeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class PolicyEnforcement(str, Enum):
    BLOCKING_FAILURE = "BLOCKING_FAILURE"   # Pipeline fails on violation
    ADVISORY_WARNING = "ADVISORY_WARNING"   # Pipeline warns but does not fail
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED" # Pipeline halts for human sign-off


class GateStatus(str, Enum):
    PASS = "PASS"
    PASS_WITH_WARNINGS = "PASS_WITH_WARNINGS"
    FAIL = "FAIL"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


class GateThresholds(BaseModel):
    max_critical_findings: int = 0
    max_high_findings: int = 3
    max_classical_risk_score: float = 75.0
    max_quantum_risk_score: float = 85.0
    min_quantum_readiness_score: float = 15.0
    require_cbom: bool = True
    fail_on_blocking: bool = True
    fail_on_manual_review: bool = False


class PolicyException(BaseModel):
    rule_id: str
    file_path: Optional[str] = None
    algorithm: Optional[str] = None
    reason: str = Field(..., min_length=5, description="Documented justification required for exception.")
    approved_by: Optional[str] = "Security Administrator"
    expires_at: Optional[str] = None


class PolicyDefinition(BaseModel):
    id: str
    name: str
    category: PolicyCategory
    description: str
    default_severity: PolicySeverity = PolicySeverity.HIGH
    default_enforcement: PolicyEnforcement = PolicyEnforcement.BLOCKING_FAILURE
    enabled: bool = True
    is_builtin: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)


class PolicyViolationItem(BaseModel):
    rule_id: str
    rule_name: str
    category: PolicyCategory
    severity: PolicySeverity
    enforcement: PolicyEnforcement
    algorithm: Optional[str] = None
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    message: str
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    exception_applied: bool = False
    exception_reason: Optional[str] = None


class PolicyEvaluationSummary(BaseModel):
    total_rules_evaluated: int = 0
    passed_rules_count: int = 0
    blocking_violations_count: int = 0
    advisory_warnings_count: int = 0
    manual_reviews_count: int = 0
    exceptions_granted_count: int = 0


class GateEvaluationResult(BaseModel):
    pipeline_status: GateStatus
    summary: str
    thresholds_evaluated: Dict[str, Any] = Field(default_factory=dict)
    thresholds_passed: bool = True
    threshold_failures: List[str] = Field(default_factory=list)
    blocking_violations: List[PolicyViolationItem] = Field(default_factory=list)
    advisory_warnings: List[PolicyViolationItem] = Field(default_factory=list)
    manual_reviews: List[PolicyViolationItem] = Field(default_factory=list)
    exceptions_applied: List[PolicyViolationItem] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)


class SecurityAssessment(BaseModel):
    assessment_id: str
    scan_id: Optional[str] = None
    project_name: str
    timestamp: str
    scan_type: str = "source_code"
    
    # Asset & Findings Summary
    total_cryptographic_assets: int = 0
    findings_by_severity: Dict[str, int] = Field(default_factory=dict)
    
    # Risk Metrics
    classical_risk_score: float = 0.0
    classical_risk_level: str = "LOW"
    quantum_risk_score: float = 0.0
    quantum_risk_level: str = "LOW"
    quantum_readiness_score: float = 0.0
    pqc_adoption_percentage: float = 0.0
    
    # CBOM Reference
    cbom_reference: Dict[str, Any] = Field(default_factory=dict)
    
    # Supply-Chain & Dependencies
    dependency_risks: Dict[str, Any] = Field(default_factory=dict)
    
    # HNDL
    hndl_findings: Dict[str, Any] = Field(default_factory=dict)
    
    # Remediation
    recommended_remediations: List[Dict[str, Any]] = Field(default_factory=list)
    
    # CI/CD Gate Result
    gate_result: Optional[GateEvaluationResult] = None

