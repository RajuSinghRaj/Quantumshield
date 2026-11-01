"""
Unified DevSecOps Security Engine for QuantumShield 2.0.
Integrates cryptographic discovery, CycloneDX 1.6 CBOM, dependency analysis,
unified quantum risk intelligence, policy evaluation, and CI/CD security gate.
"""

import uuid
import datetime
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from .schemas import (
    SecurityAssessment,
    GateEvaluationResult,
    GateStatus
)
from .config_parser import ProjectPolicyConfig
from .policy_engine import SecurityPolicyEngine
from .security_gate import CICDSecurityGate

from ..crypto_engine.detector import CryptoDetector
from ..quantum_engine.threat_analyzer import analyze_all_findings
from ..risk_engine.scoring import calculate_quantum_scores
from ..crypto_engine.cbom import generate_cbom
from ..crypto_engine.dependency_mapper import CryptographicDependencyMapper
from ..crypto_engine.cert_parser import analyze_certificate_bytes
from ..risk_engine.unified_risk_engine import calculate_unified_risk_intelligence
from ..recommendation_engine.pqc_advisor import generate_migration_roadmap

logger = logging.getLogger(__name__)


class DevSecOpsEngine:
    """Orchestrator for automated cryptographic security assessments and CI/CD gate evaluation."""

    def __init__(self, config: Optional[ProjectPolicyConfig] = None):
        self.config = config or ProjectPolicyConfig()
        self.policy_engine = SecurityPolicyEngine(self.config)
        self.security_gate = CICDSecurityGate(self.config)

    def evaluate_scan_data(
        self,
        scan_id: str,
        project_name: str,
        findings: List[Dict[str, Any]],
        scores: Dict[str, Any],
        cbom: Optional[Dict[str, Any]] = None,
        dependencies: Optional[List[Dict[str, Any]]] = None,
        certificates: Optional[List[Dict[str, Any]]] = None,
        risk_analysis: Optional[Dict[str, Any]] = None,
        hndl_data: Optional[Dict[str, Any]] = None,
        migration_plan: Optional[List[Dict[str, Any]]] = None
    ) -> SecurityAssessment:
        """
        Evaluate an existing scan dictionary against security policies and CI/CD gate criteria.
        All data is preserved and taken from actual scan evidence.
        """
        assessment_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"

        findings = findings or []
        scores = scores or {}
        dependencies = dependencies or []
        certificates = certificates or []
        risk_analysis = risk_analysis or {}
        hndl_data = hndl_data or risk_analysis.get("hndl_analysis", {})

        # 1. Evaluate policies
        blocking_v, advisory_w, manual_r, exceptions_a = self.policy_engine.evaluate(
            findings=findings,
            cbom=cbom,
            dependencies=dependencies,
            certificates=certificates,
            risk_analysis=risk_analysis,
            scores=scores
        )

        # 2. Evaluate CI/CD gate
        gate_result = self.security_gate.evaluate_gate(
            blocking_violations=blocking_v,
            advisory_warnings=advisory_w,
            manual_reviews=manual_r,
            exceptions_applied=exceptions_a,
            scores=scores,
            findings=findings,
            cbom=cbom
        )

        # 3. Calculate findings by severity
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        for f in findings:
            sev = (f.get("severity") or "INFO").upper()
            if sev in severity_counts:
                severity_counts[sev] += 1
            else:
                severity_counts["INFO"] += 1

        # 4. Extract dependency risks
        dep_risks = {
            "total_dependencies": len(dependencies),
            "vulnerable_count": sum(1 for d in dependencies if d.get("vulnerabilities") or d.get("is_deprecated")),
            "pqc_ready_count": sum(1 for d in dependencies if d.get("pqc_supported")),
            "declared_only_count": sum(1 for d in dependencies if not d.get("is_active") and d.get("is_declared_only", True))
        }

        # 5. Extract CBOM reference
        cbom_ref = {
            "cbom_generated": bool(cbom and cbom.get("components")),
            "spec_version": cbom.get("specVersion", "1.6") if cbom else None,
            "serial_number": cbom.get("serialNumber") if cbom else None,
            "components_count": len(cbom.get("components", [])) if cbom else 0
        }

        # 6. Extract recommendations
        recommended_remediations = []
        if migration_plan:
            for item in migration_plan[:5]:
                recommended_remediations.append({
                    "priority": item.get("priority", "HIGH"),
                    "algorithm": item.get("current_algorithm"),
                    "replacement": item.get("pqc_replacement"),
                    "action": item.get("migration_strategy")
                })

        return SecurityAssessment(
            assessment_id=assessment_id,
            scan_id=scan_id,
            project_name=project_name,
            timestamp=timestamp,
            scan_type="source_code",
            total_cryptographic_assets=len(findings),
            findings_by_severity=severity_counts,
            classical_risk_score=max(0.0, 100.0 - float(scores.get("classical_score", 100.0))),
            classical_risk_level=scores.get("overall_risk", "LOW"),
            quantum_risk_score=max(0.0, 100.0 - float(scores.get("quantum_score", 100.0))),
            quantum_risk_level="CRITICAL" if (100.0 - scores.get("quantum_score", 100.0)) >= 80 else ("HIGH" if (100.0 - scores.get("quantum_score", 100.0)) >= 60 else "MEDIUM" if len(findings) > 0 else "LOW"),
            quantum_readiness_score=float(scores.get("pqc_score", 0.0)),
            pqc_adoption_percentage=float(scores.get("pqc_score", 0.0)),
            cbom_reference=cbom_ref,
            dependency_risks=dep_risks,
            hndl_findings=hndl_data,
            recommended_remediations=recommended_remediations,
            gate_result=gate_result
        )

    def evaluate_source_files(
        self,
        project_name: str,
        files_data: List[Dict[str, Any]],
        db: Optional[Session] = None
    ) -> Tuple[SecurityAssessment, Dict[str, Any]]:
        """
        Run complete scan pipeline from source files and immediately evaluate security gate.
        Does not execute any scanned code.
        """
        scan_id = str(uuid.uuid4())

        # 1. Multi-layer Cryptographic Discovery
        raw_assets = CryptoDetector.detect_in_files(files_data)

        # 2. Risk & threat analysis
        enriched_findings = analyze_all_findings(raw_assets)
        scores, _ = calculate_quantum_scores(enriched_findings)
        migration_roadmap = generate_migration_roadmap(enriched_findings)

        # 3. CBOM generation
        cbom = generate_cbom(
            scan_id=scan_id,
            project_name=project_name,
            scan_type="source_code",
            findings=enriched_findings,
            scores=scores
        )

        # 4. Dependency analysis
        dependency_analysis = CryptographicDependencyMapper.analyze_cryptographic_dependencies(
            files_data=files_data,
            scanner_findings=enriched_findings
        )
        dependencies = dependency_analysis.get("dependencies", [])

        # 5. Certificates
        parsed_certificates = []
        for fd in files_data:
            ext = fd.get("rel_path", "").lower()
            if any(ext.endswith(c_ext) for c_ext in ['.pem', '.crt', '.cer', '.der']):
                c_list = analyze_certificate_bytes(fd.get("content", ""), fd.get("rel_path", ""))
                parsed_certificates.extend(c_list)

        # 6. Unified Risk Intelligence & HNDL
        risk_intelligence = calculate_unified_risk_intelligence(
            findings=enriched_findings,
            cbom=cbom,
            dependencies=dependencies,
            certificates=parsed_certificates,
            tls_data=None,
            user_hndl_assessments=None
        )

        assessment = self.evaluate_scan_data(
            scan_id=scan_id,
            project_name=project_name,
            findings=enriched_findings,
            scores=scores,
            cbom=cbom,
            dependencies=dependencies,
            certificates=parsed_certificates,
            risk_analysis=risk_intelligence,
            hndl_data=risk_intelligence.get("hndl_analysis", {}),
            migration_plan=migration_roadmap if isinstance(migration_roadmap, list) else migration_roadmap.get("roadmap", [])
        )

        raw_scan_dict = {
            "scan_id": scan_id,
            "project_name": project_name,
            "findings": enriched_findings,
            "scores": scores,
            "cbom": cbom,
            "dependencies": dependencies,
            "certificates": parsed_certificates,
            "risk_intelligence": risk_intelligence,
            "migration_roadmap": migration_roadmap
        }

        return assessment, raw_scan_dict
