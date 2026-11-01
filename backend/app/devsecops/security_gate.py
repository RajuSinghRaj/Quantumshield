"""
CI/CD Security Gate Evaluation Engine for QuantumShield 2.0 DevSecOps.
Evaluates gate thresholds, computes deterministic pipeline pass/warn/fail status,
and generates structured JSON summaries and human-readable reports.
"""

from typing import Dict, Any, List, Optional
import datetime

from .schemas import (
    GateStatus,
    GateThresholds,
    GateEvaluationResult,
    PolicyViolationItem
)
from .config_parser import ProjectPolicyConfig


class CICDSecurityGate:
    """Evaluates policy evaluation findings and risk scores against CI/CD gate criteria."""

    def __init__(self, config: Optional[ProjectPolicyConfig] = None):
        self.config = config or ProjectPolicyConfig()

    def evaluate_gate(
        self,
        blocking_violations: List[PolicyViolationItem],
        advisory_warnings: List[PolicyViolationItem],
        manual_reviews: List[PolicyViolationItem],
        exceptions_applied: List[PolicyViolationItem],
        scores: Optional[Dict[str, Any]] = None,
        findings: Optional[List[Dict[str, Any]]] = None,
        cbom: Optional[Dict[str, Any]] = None
    ) -> GateEvaluationResult:
        """
        Evaluate overall CI/CD gate status against thresholds and policy outcomes.
        """
        scores = scores or {}
        findings = findings or []
        thresholds = self.config.thresholds

        critical_count = sum(1 for f in findings if (f.get("severity") or "").upper() == "CRITICAL")
        high_count = sum(1 for f in findings if (f.get("severity") or "").upper() == "HIGH")

        # Determine classical and quantum risk scores flexibly
        if "classical_risk_score" in scores:
            classical_risk = float(scores["classical_risk_score"])
        elif "classical_risk" in scores:
            classical_risk = float(scores["classical_risk"])
        else:
            val = float(scores.get("classical_score", 0.0))
            classical_risk = val if val <= thresholds.max_classical_risk_score else max(0.0, 100.0 - val)

        if "quantum_risk_score" in scores:
            quantum_risk = float(scores["quantum_risk_score"])
        elif "quantum_risk" in scores:
            quantum_risk = float(scores["quantum_risk"])
        else:
            val = float(scores.get("quantum_score", 0.0))
            quantum_risk = val if val <= thresholds.max_quantum_risk_score else max(0.0, 100.0 - val)

        quantum_readiness = float(scores.get("pqc_score", 0.0))

        has_cbom = bool(cbom is not None and isinstance(cbom, dict) and "components" in cbom)

        threshold_failures: List[str] = []

        # 1. Critical findings threshold
        if critical_count > thresholds.max_critical_findings:
            threshold_failures.append(
                f"Critical findings ({critical_count}) exceed threshold (max allowed: {thresholds.max_critical_findings})."
            )

        # 2. High findings threshold
        if high_count > thresholds.max_high_findings:
            threshold_failures.append(
                f"High findings ({high_count}) exceed threshold (max allowed: {thresholds.max_high_findings})."
            )

        # 3. Classical risk score threshold
        if classical_risk > thresholds.max_classical_risk_score:
            threshold_failures.append(
                f"Classical risk score ({classical_risk:.1f}) exceeds maximum threshold ({thresholds.max_classical_risk_score:.1f})."
            )

        # 4. Quantum risk score threshold
        if quantum_risk > thresholds.max_quantum_risk_score:
            threshold_failures.append(
                f"Quantum risk score ({quantum_risk:.1f}) exceeds maximum threshold ({thresholds.max_quantum_risk_score:.1f})."
            )

        # 5. Quantum readiness minimum threshold (only if there are quantum-vulnerable assets)
        has_quantum_assets = any((f.get("quantum_risk") or "").upper() in {"VULNERABLE", "DEGRADED"} for f in findings)
        if has_quantum_assets and quantum_readiness < thresholds.min_quantum_readiness_score:
            threshold_failures.append(
                f"Quantum readiness score ({quantum_readiness:.1f}%) is below minimum threshold ({thresholds.min_quantum_readiness_score:.1f}%)."
            )

        # 6. CBOM requirement threshold
        if thresholds.require_cbom and not has_cbom:
            threshold_failures.append("Mandatory CycloneDX 1.6 CBOM artifact was not generated.")

        thresholds_passed = (len(threshold_failures) == 0)

        # Determine overall pipeline status
        if (len(blocking_violations) > 0 and thresholds.fail_on_blocking) or not thresholds_passed:
            status = GateStatus.FAIL
        elif len(manual_reviews) > 0:
            status = GateStatus.FAIL if thresholds.fail_on_manual_review else GateStatus.MANUAL_REVIEW_REQUIRED
        elif len(advisory_warnings) > 0:
            status = GateStatus.PASS_WITH_WARNINGS
        else:
            status = GateStatus.PASS

        # Generate concise human-readable gate summary
        summary_lines = []
        if status == GateStatus.PASS:
            summary_lines.append("✓ CI/CD Cryptographic Security Gate PASSED: Zero blocking violations or threshold breaches.")
        elif status == GateStatus.PASS_WITH_WARNINGS:
            summary_lines.append(f"⚠ CI/CD Gate PASSED WITH WARNINGS: {len(advisory_warnings)} advisory warnings require attention.")
        elif status == GateStatus.MANUAL_REVIEW_REQUIRED:
            summary_lines.append(f"🔍 CI/CD Gate REQUIRES MANUAL REVIEW: {len(manual_reviews)} items require security team sign-off.")
        else:
            reasons = []
            if blocking_violations:
                reasons.append(f"{len(blocking_violations)} blocking policy violation(s)")
            if threshold_failures:
                reasons.append(f"{len(threshold_failures)} threshold failure(s)")
            summary_lines.append(f"❌ CI/CD Cryptographic Security Gate FAILED due to {', '.join(reasons)}.")

        if exceptions_applied:
            summary_lines.append(f"ℹ {len(exceptions_applied)} documented exception(s) applied with security justification.")

        gate_summary = " ".join(summary_lines)

        thresholds_evaluated_dict = {
            "max_critical_findings": {"threshold": thresholds.max_critical_findings, "actual": critical_count, "passed": critical_count <= thresholds.max_critical_findings},
            "max_high_findings": {"threshold": thresholds.max_high_findings, "actual": high_count, "passed": high_count <= thresholds.max_high_findings},
            "max_classical_risk_score": {"threshold": thresholds.max_classical_risk_score, "actual": classical_risk, "passed": classical_risk <= thresholds.max_classical_risk_score},
            "max_quantum_risk_score": {"threshold": thresholds.max_quantum_risk_score, "actual": quantum_risk, "passed": quantum_risk <= thresholds.max_quantum_risk_score},
            "min_quantum_readiness_score": {"threshold": thresholds.min_quantum_readiness_score, "actual": quantum_readiness, "passed": (not has_quantum_assets) or (quantum_readiness >= thresholds.min_quantum_readiness_score)},
            "require_cbom": {"threshold": thresholds.require_cbom, "actual": has_cbom, "passed": has_cbom or not thresholds.require_cbom}
        }

        metrics_dict = {
            "critical_findings": critical_count,
            "high_findings": high_count,
            "classical_risk_score": classical_risk,
            "quantum_risk_score": quantum_risk,
            "quantum_readiness_score": quantum_readiness,
            "blocking_violations_count": len(blocking_violations),
            "advisory_warnings_count": len(advisory_warnings),
            "manual_reviews_count": len(manual_reviews),
            "exceptions_applied_count": len(exceptions_applied),
            "cbom_generated": has_cbom
        }

        return GateEvaluationResult(
            pipeline_status=status,
            summary=gate_summary,
            thresholds_evaluated=thresholds_evaluated_dict,
            thresholds_passed=thresholds_passed,
            threshold_failures=threshold_failures,
            blocking_violations=blocking_violations,
            advisory_warnings=advisory_warnings,
            manual_reviews=manual_reviews,
            exceptions_applied=exceptions_applied,
            metrics=metrics_dict
        )

    def generate_markdown_report(
        self,
        project_name: str,
        gate_result: GateEvaluationResult,
        scan_id: Optional[str] = None
    ) -> str:
        """Generate human-readable markdown security gate assessment report."""
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        status_badge = {
            GateStatus.PASS: "🟢 PASS",
            GateStatus.PASS_WITH_WARNINGS: "🟡 PASS WITH WARNINGS",
            GateStatus.MANUAL_REVIEW_REQUIRED: "🔍 MANUAL REVIEW REQUIRED",
            GateStatus.FAIL: "🔴 FAIL"
        }.get(gate_result.pipeline_status, "UNKNOWN")

        md = [
            f"# QuantumShield 2.0 — Cryptographic Security Gate Report",
            f"**Project**: `{project_name}` | **Scan ID**: `{scan_id or 'N/A'}` | **Timestamp**: `{timestamp}`",
            f"",
            f"## Pipeline Verdict: **{status_badge}**",
            f"> {gate_result.summary}",
            f"",
            f"### Gate Metrics Summary",
            f"| Metric | Result | Target / Threshold | Status |",
            f"| :--- | :--- | :--- | :--- |",
            f"| Critical Findings | {gate_result.metrics.get('critical_findings', 0)} | Max {self.config.thresholds.max_critical_findings} | {'✓' if gate_result.thresholds_evaluated.get('max_critical_findings', {}).get('passed') else '❌'} |",
            f"| High Findings | {gate_result.metrics.get('high_findings', 0)} | Max {self.config.thresholds.max_high_findings} | {'✓' if gate_result.thresholds_evaluated.get('max_high_findings', {}).get('passed') else '❌'} |",
            f"| Classical Risk Score | {gate_result.metrics.get('classical_risk_score', 0):.1f} | Max {self.config.thresholds.max_classical_risk_score:.1f} | {'✓' if gate_result.thresholds_evaluated.get('max_classical_risk_score', {}).get('passed') else '❌'} |",
            f"| Quantum Risk Score | {gate_result.metrics.get('quantum_risk_score', 0):.1f} | Max {self.config.thresholds.max_quantum_risk_score:.1f} | {'✓' if gate_result.thresholds_evaluated.get('max_quantum_risk_score', {}).get('passed') else '❌'} |",
            f"| Quantum Readiness | {gate_result.metrics.get('quantum_readiness_score', 0):.1f}% | Min {self.config.thresholds.min_quantum_readiness_score:.1f}% | {'✓' if gate_result.thresholds_evaluated.get('min_quantum_readiness_score', {}).get('passed') else '❌'} |",
            f"| CBOM Generated | {'Yes' if gate_result.metrics.get('cbom_generated') else 'No'} | Required | {'✓' if gate_result.metrics.get('cbom_generated') else '❌'} |",
            f""
        ]

        # Blocking violations section
        if gate_result.blocking_violations:
            md.extend([
                f"### ❌ Blocking Policy Violations ({len(gate_result.blocking_violations)})",
                f"The following violations caused the build to fail:"
            ])
            for v in gate_result.blocking_violations:
                loc = f"`{v.file_path}:{v.line_number}`" if v.line_number else f"`{v.file_path}`"
                md.append(f"- **[{v.rule_id}] {v.rule_name}** at {loc}")
                md.append(f"  - **Issue**: {v.message}")
                if v.evidence:
                    md.append(f"  - **Evidence**: `{v.evidence}`")
                if v.remediation:
                    md.append(f"  - **Remediation**: {v.remediation}")
            md.append("")

        # Threshold failures section
        if gate_result.threshold_failures:
            md.extend([
                f"### ❌ Threshold Failures ({len(gate_result.threshold_failures)})",
                f"The following configured gate thresholds were breached:"
            ])
            for tf in gate_result.threshold_failures:
                md.append(f"- {tf}")
            md.append("")

        # Manual reviews section
        if gate_result.manual_reviews:
            md.extend([
                f"### 🔍 Manual Review Required ({len(gate_result.manual_reviews)})",
                f"The following items require security team authorization:"
            ])
            for mr in gate_result.manual_reviews:
                loc = f"`{mr.file_path}:{mr.line_number}`" if mr.line_number else f"`{mr.file_path}`"
                md.append(f"- **[{mr.rule_id}] {mr.rule_name}** at {loc}: {mr.message}")
            md.append("")

        # Advisory warnings section
        if gate_result.advisory_warnings:
            md.extend([
                f"### ⚠ Advisory Warnings ({len(gate_result.advisory_warnings)})"
            ])
            for w in gate_result.advisory_warnings:
                loc = f"`{w.file_path}:{w.line_number}`" if w.line_number else f"`{w.file_path}`"
                md.append(f"- **[{w.rule_id}] {w.rule_name}** at {loc}: {w.message}")
            md.append("")

        # Exceptions applied section
        if gate_result.exceptions_applied:
            md.extend([
                f"### ℹ Documented Security Exceptions Applied ({len(gate_result.exceptions_applied)})"
            ])
            for ex in gate_result.exceptions_applied:
                loc = f"`{ex.file_path}`" if ex.file_path else "All files"
                md.append(f"- **[{ex.rule_id}]** for {loc}")
                md.append(f"  - **Justification**: {ex.exception_reason}")
            md.append("")

        md.extend([
            f"---",
            f"*Generated automatically by QuantumShield 2.0 CI/CD Cryptographic Security Gate.*"
        ])

        return "\n".join(md)
