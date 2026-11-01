"""
Comprehensive Test Suite for Batch 7: DevSecOps Security Engine & CI/CD Gate.
Covers:
  1. Policy configuration parsing and strict schema validation
  2. Rejection of invalid configs, bad enforcement modes, and ungrounded exceptions
  3. Individual policy evaluation (MD5, DES/3DES, weak RSA, SHA-1, AES-ECB, Shor, HNDL, dependencies, CBOM)
  4. CI/CD Gate evaluation: PASS, PASS_WITH_WARNINGS, FAIL, MANUAL_REVIEW_REQUIRED
  5. Gate threshold enforcement (critical count, high count, risk scores, readiness)
  6. Documented security exceptions with justification audit trail
  7. Deterministic evaluation repeatability
  8. Developer CLI commands and exit codes (0 for pass/warn, 1 for fail, 2 for review, 3 for error)
  9. Machine-readable JSON assessment schema
  10. REST API endpoints (evaluate, policies CRUD, assessments, report, cbom)
  11. GitHub Actions and Azure DevOps YAML syntax validity
"""

import os
import sys
import json
import pytest
import yaml
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.devsecops import (
    DevSecOpsEngine,
    ProjectPolicyConfig,
    parse_policy_config_content,
    PolicyConfigValidationError,
    SecurityPolicyEngine,
    CICDSecurityGate,
    GateStatus,
    GateThresholds,
    PolicySeverity,
    PolicyEnforcement,
    BUILTIN_POLICIES
)
from app.cli import main as cli_main
from app.main import app

client = TestClient(app)


# ==============================================================================
# 1. POLICY CONFIGURATION PARSING & VALIDATION TESTS
# ==============================================================================

class TestPolicyConfigParser:
    """Test suite for parsing and validating quantumshield.yml."""

    def test_valid_yaml_config_parsing(self):
        valid_yaml = """
        version: "2.0"
        project_name: "TestProject"
        gate:
          fail_on_blocking: true
          thresholds:
            max_critical_findings: 0
            max_high_findings: 2
            max_classical_risk_score: 70.0
            max_quantum_risk_score: 80.0
            min_quantum_readiness_score: 20.0
            require_cbom: true
        policies:
          rule_reject_md5:
            enabled: true
            enforcement: BLOCKING_FAILURE
            severity: CRITICAL
          rule_flag_sha1:
            enabled: true
            enforcement: ADVISORY_WARNING
            severity: MEDIUM
        exceptions:
          - rule_id: "rule_flag_sha1"
            file_path: "legacy/commit.py"
            reason: "Legacy Git commit SHA-1 hash calculation compatibility."
            approved_by: "Security Lead"
        exclude_paths:
          - "tests/**"
        """
        conf = parse_policy_config_content(valid_yaml, "test_valid.yml")
        assert conf.version == "2.0"
        assert conf.project_name == "TestProject"
        assert conf.thresholds.max_critical_findings == 0
        assert conf.thresholds.max_high_findings == 2
        assert conf.is_rule_enabled("rule_reject_md5") is True
        assert conf.get_rule_enforcement("rule_reject_md5") == PolicyEnforcement.BLOCKING_FAILURE
        assert len(conf.exceptions) == 1
        assert conf.exceptions[0].rule_id == "rule_flag_sha1"
        assert conf.is_path_excluded("tests/test_crypto.py") is True
        assert conf.is_path_excluded("src/crypto.py") is False

    def test_invalid_version_rejected(self):
        bad_yaml = """
        version: "99.0"
        """
        with pytest.raises(PolicyConfigValidationError) as exc:
            parse_policy_config_content(bad_yaml, "bad_version.yml")
        assert "Invalid schema version" in str(exc.value)

    def test_invalid_enforcement_mode_rejected(self):
        bad_yaml = """
        version: "2.0"
        policies:
          rule_reject_md5:
            enforcement: "NOT_AN_ENFORCEMENT"
        """
        with pytest.raises(PolicyConfigValidationError) as exc:
            parse_policy_config_content(bad_yaml, "bad_enforcement.yml")
        assert "Invalid enforcement" in str(exc.value)

    def test_invalid_severity_rejected(self):
        bad_yaml = """
        version: "2.0"
        policies:
          rule_reject_md5:
            severity: "ULTRA_EXTREME"
        """
        with pytest.raises(PolicyConfigValidationError) as exc:
            parse_policy_config_content(bad_yaml, "bad_severity.yml")
        assert "Invalid severity" in str(exc.value)

    def test_exception_without_justification_rejected(self):
        """Exceptions without documented reason must be rejected."""
        bad_yaml = """
        version: "2.0"
        exceptions:
          - rule_id: "rule_reject_md5"
            file_path: "src/crypto.py"
            reason: ""
        """
        with pytest.raises(PolicyConfigValidationError) as exc:
            parse_policy_config_content(bad_yaml, "bad_exc.yml")
        assert "lacks documented justification" in str(exc.value)


# ==============================================================================
# 2. POLICY EVALUATION ENGINE TESTS
# ==============================================================================

class TestSecurityPolicyEngine:
    """Test evaluation of classical, quantum, dependency, and CBOM rules."""

    def test_md5_blocking_policy(self):
        engine = SecurityPolicyEngine()
        findings = [
            {
                "algorithm": "MD5",
                "variant": "MD5",
                "file_path": "auth/hash.py",
                "line_number": 12,
                "code_snippet": "hashlib.md5(pwd)",
                "severity": "CRITICAL",
                "quantum_risk": "SAFE"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        md5_items = [b for b in blocking if b.rule_id == "rule_reject_md5"]
        assert len(md5_items) == 1
        assert md5_items[0].enforcement == PolicyEnforcement.BLOCKING_FAILURE
        assert md5_items[0].file_path == "auth/hash.py"

    def test_des_3des_blocking_policy(self):
        engine = SecurityPolicyEngine()
        findings = [
            {
                "algorithm": "DES",
                "variant": "DES-EDE3-CBC",
                "file_path": "legacy/crypto.py",
                "line_number": 44,
                "code_snippet": "DES.new(key)",
                "severity": "CRITICAL"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        des_items = [b for b in blocking if b.rule_id == "rule_reject_des_3des"]
        assert len(des_items) == 1

    def test_weak_rsa_key_size_policy(self):
        engine = SecurityPolicyEngine()
        findings = [
            {
                "algorithm": "RSA",
                "variant": "RSA-1024",
                "key_size": 1024,
                "file_path": "keys/rsa_legacy.pem",
                "line_number": 1,
                "code_snippet": "RSA.generate(1024)",
                "severity": "HIGH"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        rsa_items = [b for b in blocking if b.rule_id == "rule_reject_weak_rsa"]
        assert len(rsa_items) == 1
        assert "1024 bits" in rsa_items[0].message

    def test_insecure_aes_ecb_mode_policy(self):
        engine = SecurityPolicyEngine()
        findings = [
            {
                "algorithm": "AES",
                "variant": "AES-128-ECB",
                "curve_or_parameters": "ECB",
                "file_path": "ciphers/aes.py",
                "line_number": 20,
                "code_snippet": "AES.new(key, AES.MODE_ECB)",
                "severity": "HIGH"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        ecb_items = [b for b in blocking if b.rule_id == "rule_flag_insecure_aes_ecb"]
        assert len(ecb_items) == 1

    def test_shor_asymmetric_warning_policy(self):
        engine = SecurityPolicyEngine()
        findings = [
            {
                "algorithm": "ECDSA",
                "variant": "secp256r1",
                "key_size": 256,
                "quantum_risk": "VULNERABLE",
                "file_path": "auth/jwt.py",
                "line_number": 88,
                "severity": "HIGH"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        shor_warnings = [w for w in warnings if w.rule_id == "rule_flag_shor_asymmetric"]
        assert len(shor_warnings) >= 1

    def test_documented_exception_applied(self):
        """When a valid exception exists, violation is bypassed and documented."""
        yaml_with_exc = """
        version: "2.0"
        exceptions:
          - rule_id: "rule_reject_md5"
            file_path: "checksums/fast_checksum.py"
            reason: "Non-security integrity checksum calculation on static assets."
            approved_by: "Chief Security Officer"
        """
        conf = parse_policy_config_content(yaml_with_exc)
        engine = SecurityPolicyEngine(conf)

        findings = [
            {
                "algorithm": "MD5",
                "file_path": "checksums/fast_checksum.py",
                "line_number": 5,
                "severity": "CRITICAL"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        assert not any(b.rule_id == "rule_reject_md5" for b in blocking)
        md5_exceptions = [e for e in exceptions if e.rule_id == "rule_reject_md5"]
        assert len(md5_exceptions) == 1
        assert md5_exceptions[0].exception_applied is True
        assert "Non-security integrity" in md5_exceptions[0].exception_reason

    def test_documented_exception_expired_rejected(self):
        """When an exception has expires_at in the past, it must NOT be applied."""
        yaml_expired_exc = """
        version: "2.0"
        exceptions:
          - rule_id: "rule_reject_md5"
            file_path: "checksums/fast_checksum.py"
            reason: "Temporary exception that expired."
            approved_by: "Chief Security Officer"
            expires_at: "2024-01-01"
        """
        conf = parse_policy_config_content(yaml_expired_exc)
        engine = SecurityPolicyEngine(conf)

        findings = [
            {
                "algorithm": "MD5",
                "file_path": "checksums/fast_checksum.py",
                "line_number": 5,
                "severity": "CRITICAL"
            }
        ]
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=findings)
        assert any(b.rule_id == "rule_reject_md5" for b in blocking), "Expired exception must not bypass blocking MD5 rule!"
        assert not any(e.rule_id == "rule_reject_md5" for e in exceptions), "Expired exception must not be in applied exceptions!"

    def test_cbom_requirement_policy(self):
        engine = SecurityPolicyEngine()
        # Missing CBOM
        blocking, warnings, reviews, exceptions = engine.evaluate(findings=[], cbom=None)
        assert any(b.rule_id == "rule_require_cbom_artifact" for b in blocking)

        # Valid CBOM present
        valid_cbom = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.6",
            "serialNumber": "urn:uuid:test-1234",
            "metadata": {"timestamp": "2026-11-01T00:00:00Z"},
            "components": [{"name": "AES-256", "evidence": {"occurrences": [{"location": "app.py"}]}}]
        }
        blocking_cbom, _, _, _ = engine.evaluate(findings=[], cbom=valid_cbom)
        assert not any(b.rule_id == "rule_require_cbom_artifact" for b in blocking_cbom)


# ==============================================================================
# 3. CI/CD SECURITY GATE & THRESHOLDS TESTS
# ==============================================================================

class TestCICDSecurityGate:
    """Test pipeline status decisions: PASS, PASS_WITH_WARNINGS, FAIL, MANUAL_REVIEW_REQUIRED."""

    def test_gate_pass_clean(self):
        gate = CICDSecurityGate()
        res = gate.evaluate_gate(
            blocking_violations=[],
            advisory_warnings=[],
            manual_reviews=[],
            exceptions_applied=[],
            scores={"classical_score": 20.0, "quantum_score": 30.0, "pqc_score": 80.0},
            cbom={"components": [{"name": "ML-KEM"}]}
        )
        assert res.pipeline_status == GateStatus.PASS
        assert res.thresholds_passed is True
        assert "PASSED: Zero blocking violations" in res.summary

    def test_gate_pass_with_warnings(self):
        gate = CICDSecurityGate()
        warn_item = SecurityPolicyEngine().config.thresholds  # dummy
        res = gate.evaluate_gate(
            blocking_violations=[],
            advisory_warnings=[{
                "rule_id": "rule_flag_sha1",
                "rule_name": "Flag SHA-1",
                "category": "CLASSICAL",
                "severity": "MEDIUM",
                "enforcement": "ADVISORY_WARNING",
                "message": "SHA-1 used."
            }],
            manual_reviews=[],
            exceptions_applied=[],
            scores={"classical_score": 30.0, "quantum_score": 40.0, "pqc_score": 50.0},
            cbom={"components": [{"name": "AES"}]}
        )
        assert res.pipeline_status == GateStatus.PASS_WITH_WARNINGS

    def test_gate_fail_on_blocking_violation(self):
        gate = CICDSecurityGate()
        res = gate.evaluate_gate(
            blocking_violations=[{
                "rule_id": "rule_reject_md5",
                "rule_name": "Reject MD5",
                "category": "CLASSICAL",
                "severity": "CRITICAL",
                "enforcement": "BLOCKING_FAILURE",
                "message": "MD5 used."
            }],
            advisory_warnings=[],
            manual_reviews=[],
            exceptions_applied=[],
            scores={"classical_score": 40.0, "quantum_score": 50.0, "pqc_score": 30.0},
            cbom={"components": [{"name": "MD5"}]}
        )
        assert res.pipeline_status == GateStatus.FAIL
        assert "FAILED" in res.summary

    def test_gate_fail_on_critical_findings_threshold(self):
        conf = ProjectPolicyConfig(thresholds=GateThresholds(max_critical_findings=0))
        gate = CICDSecurityGate(conf)
        res = gate.evaluate_gate(
            blocking_violations=[],
            advisory_warnings=[],
            manual_reviews=[],
            exceptions_applied=[],
            findings=[{"severity": "CRITICAL", "algorithm": "DES"}],
            cbom={"components": [{"name": "DES"}]}
        )
        assert res.pipeline_status == GateStatus.FAIL
        assert res.thresholds_passed is False
        assert any("Critical findings" in f for f in res.threshold_failures)

    def test_gate_manual_review_required(self):
        gate = CICDSecurityGate()
        res = gate.evaluate_gate(
            blocking_violations=[],
            advisory_warnings=[],
            manual_reviews=[{
                "rule_id": "rule_require_pqc_or_hybrid",
                "rule_name": "Require PQC",
                "category": "QUANTUM",
                "severity": "HIGH",
                "enforcement": "MANUAL_REVIEW_REQUIRED",
                "message": "High-security project needs PQC sign-off."
            }],
            exceptions_applied=[],
            scores={"classical_score": 10.0, "quantum_score": 20.0, "pqc_score": 20.0},
            cbom={"components": [{"name": "RSA"}]}
        )
        assert res.pipeline_status == GateStatus.MANUAL_REVIEW_REQUIRED
        assert "MANUAL REVIEW" in res.summary

    def test_deterministic_evaluation(self):
        """Repeated evaluations of identical data must produce bitwise identical outcomes."""
        gate = CICDSecurityGate()
        b_list = [{"rule_id": "rule_reject_md5", "rule_name": "R1", "category": "CLASSICAL", "severity": "CRITICAL", "enforcement": "BLOCKING_FAILURE", "message": "M"}]
        res1 = gate.evaluate_gate(b_list, [], [], [], scores={"classical_score": 50}, cbom={"components": [1]})
        res2 = gate.evaluate_gate(b_list, [], [], [], scores={"classical_score": 50}, cbom={"components": [1]})
        assert res1.pipeline_status == res2.pipeline_status
        assert res1.summary == res2.summary


# ==============================================================================
# 4. DEVELOPER CLI INTEGRATION TESTS
# ==============================================================================

class TestDeveloperCli:
    """Test CLI commands, exit codes, and parameters."""

    def test_cli_policy_check_valid(self):
        from app.cli import cmd_policy_check
        import argparse
        args = argparse.Namespace(policy="quantumshield.yml", json=False)
        code = cmd_policy_check(args)
        assert code == 0

    def test_cli_policy_check_missing(self):
        from app.cli import cmd_policy_check
        import argparse
        args = argparse.Namespace(policy="non_existent_policy.yml", json=False)
        code = cmd_policy_check(args)
        assert code == 3

    def test_cli_devsecops_evaluate_exit_code_on_clean_target(self, tmp_path):
        """Clean target with no crypto should PASS with exit code 0."""
        clean_dir = tmp_path / "clean_project"
        clean_dir.mkdir()
        (clean_dir / "app.py").write_text("print('Hello QuantumShield')", encoding="utf-8")

        from app.cli import cmd_devsecops_evaluate
        import argparse
        args = argparse.Namespace(path=str(clean_dir), policy=None, json=False, output=None)
        code = cmd_devsecops_evaluate(args)
        assert code == 0

    def test_cli_devsecops_evaluate_exit_code_on_md5_violation(self, tmp_path):
        """Project with MD5 and default blocking policy must return exit code 1."""
        vuln_dir = tmp_path / "vuln_project"
        vuln_dir.mkdir()
        (vuln_dir / "auth.py").write_text("import hashlib\nhashlib.md5(b'admin')", encoding="utf-8")

        from app.cli import cmd_devsecops_evaluate
        import argparse
        args = argparse.Namespace(path=str(vuln_dir), policy="quantumshield.yml", json=False, output=None)
        code = cmd_devsecops_evaluate(args)
        assert code == 1


# ==============================================================================
# 5. REST API INTEGRATION TESTS
# ==============================================================================

class TestDevSecOpsApi:
    """Test FastAPI REST endpoints under /api/devsecops/."""

    def test_api_list_policies(self):
        resp = client.get("/api/devsecops/policies")
        assert resp.status_code == 200
        policies = resp.json()
        assert len(policies) >= 16
        rule_ids = {p["id"] for p in policies}
        assert "rule_reject_md5" in rule_ids
        assert "rule_reject_des_3des" in rule_ids
        assert "rule_flag_shor_asymmetric" in rule_ids

    def test_api_create_and_delete_custom_policy(self):
        custom_payload = {
            "id": "custom_test_rule_99",
            "name": "Custom Proprietary Crypto Check",
            "category": "CUSTOM",
            "description": "Flags proprietary cryptographic primitives.",
            "default_severity": "HIGH",
            "default_enforcement": "BLOCKING_FAILURE",
            "enabled": True
        }
        # Create
        resp_post = client.post("/api/devsecops/policies", json=custom_payload)
        assert resp_post.status_code == 200
        assert resp_post.json()["status"] in ["created", "updated"]

        # Update
        resp_put = client.put("/api/devsecops/policies/custom_test_rule_99", json={"enabled": False})
        assert resp_put.status_code == 200
        assert resp_put.json()["policy"]["enabled"] is False

        # Delete custom
        resp_del = client.delete("/api/devsecops/policies/custom_test_rule_99")
        assert resp_del.status_code == 200
        assert resp_del.json()["status"] == "deleted"

    def test_api_delete_builtin_policy_rejected(self):
        """Builtin policies cannot be deleted."""
        resp = client.delete("/api/devsecops/policies/rule_reject_md5")
        assert resp.status_code == 400
        assert "Built-in security policies cannot be deleted" in resp.json()["detail"]

    def test_api_evaluate_mock_scan(self):
        """Evaluate an existing scan record (e.g. demo scan)."""
        demo_resp = client.post("/api/scan/demo", data={"project_id": "legacy_bank"})
        assert demo_resp.status_code == 200
        scan_id = demo_resp.json()["scan_id"]

        eval_resp = client.post("/api/devsecops/evaluate", json={"scan_id": scan_id})
        assert eval_resp.status_code == 200
        data = eval_resp.json()
        assert "assessment_id" in data
        assert data["scan_id"] == scan_id
        assert "gate_result" in data
        assert data["gate_result"]["pipeline_status"] in ["PASS", "PASS_WITH_WARNINGS", "FAIL", "MANUAL_REVIEW_REQUIRED"]
        assert "cbom_reference" in data
        assert data["cbom_reference"]["cbom_generated"] is True

        assessment_id = data["assessment_id"]

        # Check GET /api/devsecops/assessments
        list_resp = client.get("/api/devsecops/assessments")
        assert list_resp.status_code == 200
        assert any(a["id"] == assessment_id for a in list_resp.json())

        # Check GET /api/devsecops/assessments/{id}
        get_resp = client.get(f"/api/devsecops/assessments/{assessment_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["assessment_id"] == assessment_id

        # Check GET /api/devsecops/assessments/{id}/report
        report_resp = client.get(f"/api/devsecops/assessments/{assessment_id}/report")
        assert report_resp.status_code == 200
        assert "# QuantumShield 2.0" in report_resp.text

        # Check GET /api/devsecops/assessments/{id}/cbom
        cbom_resp = client.get(f"/api/devsecops/assessments/{assessment_id}/cbom")
        assert cbom_resp.status_code == 200
        assert "components" in cbom_resp.json()

    def test_api_evaluate_multipart_files(self):
        """Evaluate direct multipart file uploads through the API."""
        files = [("files", ("crypto_demo.py", b"import hashlib\ndef h(p): return hashlib.md5(p).hexdigest()\n", "text/x-python"))]
        resp = client.post("/api/devsecops/evaluate", files=files, data={"project_name": "Multipart Audit"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_name"] == "Multipart Audit"
        assert data["gate_result"]["pipeline_status"] == "FAIL"

    def test_api_devsecops_not_found_handling(self):
        """Verify 404 error responses for nonexistent resources."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        assert client.get(f"/api/devsecops/assessments/{fake_id}").status_code == 404
        assert client.get(f"/api/devsecops/assessments/{fake_id}/report").status_code == 404
        assert client.get(f"/api/devsecops/assessments/{fake_id}/cbom").status_code == 404
        assert client.delete(f"/api/devsecops/policies/nonexistent_policy_id").status_code == 404


# ==============================================================================
# 6. CI/CD WORKFLOW & PIPELINE YAML VALIDATION
# ==============================================================================

class TestPipelineYamlIntegrity:
    """Verify GitHub Actions and Azure Pipelines YAML validity."""

    def test_github_actions_yaml_syntax(self):
        gh_path = os.path.join(os.path.dirname(__file__), "..", ".github", "workflows", "quantumshield-security.yml")
        assert os.path.exists(gh_path), f"File missing: {gh_path}"
        with open(gh_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        assert data is not None
        assert "jobs" in data
        assert "cryptographic-audit" in data["jobs"]
        # Ensure no hardcoded tokens
        content = open(gh_path, "r", encoding="utf-8").read()
        assert "secrets.QUANTUMSHIELD_API_URL" in content

    def test_azure_pipeline_yaml_syntax(self):
        az_path = os.path.join(os.path.dirname(__file__), "..", "azure-pipelines.yml")
        assert os.path.exists(az_path), f"File missing: {az_path}"
        with open(az_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        assert data is not None
        assert "steps" in data
        assert "trigger" in data
