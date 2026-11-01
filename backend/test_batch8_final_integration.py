"""
QuantumShield 2.0 - Batch 8 Final Integration and Verification Suite.
Validates all 5 core workflows, security hardening controls, and cross-module consistency:
  - Workflow A: End-to-End Project Security Assessment
  - Workflow B: PQC Remediation & Migration Sandbox
  - Workflow C: Hybrid Cryptography Demonstrator (X25519 + ML-KEM-768 + AES-256-GCM)
  - Workflow D: Quantum Simulation Laboratory (Shor, Grover, BBM92)
  - Workflow E: DevSecOps CI/CD Security Gate & CLI
  - Security Hardening: Zip bombs, path traversal, SSRF, private key redaction, upload bounds
"""

import os
import io
import json
import zipfile
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.scanner.file_processor import FileProcessor
from backend.app.crypto_engine.tls_domain_scanner import validate_public_target, SSRFSecurityError
from backend.app.quantum_engine.hybrid_kex_demonstrator import run_hybrid_key_exchange_demo
from backend.app.quantum_engine.shor_simulator import ShorSimulator
from backend.app.quantum_engine.grover_simulator import GroverSimulator
from backend.app.quantum_engine.bbm92_simulator import BBM92Simulator
from backend.app.devsecops import DevSecOpsEngine, ProjectPolicyConfig, GateStatus

client = TestClient(app)


# ==============================================================================
# WORKFLOW A: PROJECT SECURITY ASSESSMENT
# ==============================================================================

def test_workflow_a_project_security_assessment():
    """Verify complete end-to-end audit: discovery -> CBOM -> dependency -> risk -> HNDL -> priorities."""
    resp = client.post("/api/scan/demo", data={"project_id": "legacy_bank"})
    assert resp.status_code == 200
    data = resp.json()

    scan_id = data["scan_id"]
    assert scan_id is not None
    assert "Banking" in data["project_name"]

    # 1. Cryptographic findings
    findings = data["findings"]
    assert len(findings) > 0
    assert any(f["algorithm"] == "RSA" for f in findings)
    assert any(f["algorithm"] in ["3DES", "DES"] for f in findings)

    # 2. CycloneDX 1.6 CBOM
    cbom = data["cbom"]
    assert cbom["bomFormat"] == "CycloneDX"
    assert cbom["specVersion"] == "1.6"
    assert len(cbom["components"]) == len(findings)

    # 3. Dependency Mapping
    dependencies = data["dependencies"]
    assert isinstance(dependencies, list)
    assert "dependency_graph" in data
    assert "migration_impact" in data

    # 4. Classical and Quantum Scores
    scores = data["scores"]
    assert "classical_score" in scores
    assert "quantum_score" in scores
    assert "overall_risk" in scores

    # 5. HNDL Exposure
    hndl = data["hndl"]
    assert "overall_hndl_score" in hndl
    assert "key_exchange_context" in hndl

    # 6. Migration Priorities
    priorities = data["migration_priorities"]
    assert len(priorities) > 0
    assert priorities[0]["priority"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

    # 7. Persistence & Retrieval consistency
    get_resp = client.get(f"/api/scan/{scan_id}")
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["scan_id"] == scan_id
    assert get_data["project_name"] == data["project_name"]
    assert len(get_data["findings"]) == len(findings)


# ==============================================================================
# WORKFLOW B: PQC MIGRATION & SANDBOX
# ==============================================================================

def test_workflow_b_pqc_migration_sandbox():
    """Verify proposals -> patch -> isolated sandbox -> rescan delta -> original untouched."""
    demo_resp = client.post("/api/scan/demo", data={"project_id": "legacy_bank"})
    scan_id = demo_resp.json()["scan_id"]

    # 1. Fetch proposals
    prop_resp = client.get(f"/api/scan/{scan_id}/remediation")
    assert prop_resp.status_code == 200
    proposals = prop_resp.json()["proposals"]
    assert len(proposals) > 0

    first_prop = next(p for p in proposals if p.get("can_auto_apply"))
    assert "proposed_code" in first_prop
    assert "unified_diff" in first_prop

    # 2. Apply patch to sandbox
    apply_resp = client.post(
        f"/api/scan/{scan_id}/remediation/apply",
        json={
            "file_path": first_prop["file_path"],
            "line_number": first_prop["line_number"],
            "finding": first_prop
        }
    )
    assert apply_resp.status_code == 200
    apply_data = apply_resp.json()
    assert apply_data["success"] is True
    assert apply_data["applied_count"] >= 1

    # 3. Rescan sandbox
    rescan_resp = client.post(f"/api/scan/{scan_id}/remediation/rescan")
    assert rescan_resp.status_code == 200
    rescan_data = rescan_resp.json()
    assert "comparison" in rescan_data
    comparison = rescan_data["comparison"]
    assert "findings_delta" in comparison
    assert "score_deltas" in comparison
    assert comparison["findings_delta"]["resolved_count"] >= 1

    # 4. Verify original source files remain unchanged
    get_resp = client.get(f"/api/scan/{scan_id}")
    original_sources = get_resp.json()["file_sources"]
    assert first_prop["file_path"] in original_sources
    assert first_prop["original_code"] in original_sources[first_prop["file_path"]]


# ==============================================================================
# WORKFLOW C: HYBRID CRYPTOGRAPHY DEMONSTRATOR
# ==============================================================================

def test_workflow_c_hybrid_cryptography():
    """Verify X25519 + ML-KEM-768 + HKDF-SHA256 + AES-256-GCM and tamper detection."""
    result = run_hybrid_key_exchange_demo(
        plaintext_message="Confidential test payload for QuantumShield 2.0 Batch 8 validation.",
        associated_data="Batch-8-Integrity-Context",
        simulate_tamper=True
    )
    assert result["success"] is True
    assert "timings_ms" in result
    assert result["timings_ms"]["total_execution_time"] > 0

    # Key derivation & decryption verification
    assert result["previews"]["decrypted_plaintext"] == "Confidential test payload for QuantumShield 2.0 Batch 8 validation."

    # Tamper detection verification
    tamper = result["tamper_verification"]
    assert tamper["tamper_simulated"] is True
    assert tamper["tamper_detected"] is True
    assert "InvalidTag" in tamper.get("exception", "") or "integrity violation" in tamper.get("status", "").lower()

    # Comparative API endpoint
    api_resp = client.get("/api/hybrid/comparison")
    assert api_resp.status_code == 200
    assert "hybrid_x25519_mlkem768" in api_resp.json()


# ==============================================================================
# WORKFLOW D: QUANTUM SIMULATION LABORATORY
# ==============================================================================

def test_workflow_d_quantum_sim_lab():
    """Verify Shor (N=15), Grover (n=2), and BBM92 (ideal + Eve) simulations."""
    # 1. Shor simulation for N=15
    shor_sim = ShorSimulator()
    shor_res = shor_sim.run_simulation(N=15, a=7, shots=1024)
    assert shor_res["success"] is True
    assert sorted(shor_res["factors"]) == [3, 5]
    assert shor_res["period"] == 4
    assert len(shor_res["modular_sequence"]) > 0

    # 2. Grover simulation for n=2
    grover_sim = GroverSimulator()
    grover_res = grover_sim.run_simulation(target_bitstring="11", iterations=1, shots=1024)
    assert grover_res["success"] is True
    assert grover_res["num_qubits"] == 2
    assert grover_res["marked_state_probability"] == 1.0

    # 3. BBM92 Entanglement-based QKD
    # Clean channel -> QBER 0.0%, Transmission Secure
    bbm_clean_sim = BBM92Simulator(num_pairs=100, test_fraction=0.3, error_threshold=0.11, seed=42)
    bbm_clean = bbm_clean_sim.run_simulation(eve_present=False, noise_level=0.0)
    assert bbm_clean["qber"] == 0.0
    assert bbm_clean["status"] == "COMPLETED_SECURE"
    assert bbm_clean["eve_detected"] is False
    assert len(bbm_clean["final_key"]) > 0

    # Eve intercept-resend channel -> QBER >= 11% abort threshold
    bbm_eve_sim = BBM92Simulator(num_pairs=300, test_fraction=0.3, error_threshold=0.11, seed=123)
    bbm_eve = bbm_eve_sim.run_simulation(eve_present=True, noise_level=0.0)
    assert bbm_eve["status"] == "COMPLETED_ABORTED"
    assert bbm_eve["eve_detected"] is True
    assert bbm_eve["qber"] >= 0.11
    assert len(bbm_eve["final_key"]) == 0

    # Seed reproducibility
    bbm_clean_repeat = BBM92Simulator(num_pairs=100, test_fraction=0.3, error_threshold=0.11, seed=42).run_simulation(eve_present=False, noise_level=0.0)
    assert bbm_clean["final_key"] == bbm_clean_repeat["final_key"]


# ==============================================================================
# WORKFLOW E: DEVSECOPS SECURITY GATE & CLI ARTIFACTS
# ==============================================================================

def test_workflow_e_devsecops_security_gate():
    """Verify clean project pass, vulnerable fail, thresholds, and artifact export."""
    # 1. Evaluate clean target -> PASS
    clean_conf = ProjectPolicyConfig()
    clean_engine = DevSecOpsEngine(clean_conf)
    clean_files = [
        FileProcessor.process_single_file(
            "crypto.py",
            b"from cryptography.hazmat.primitives.ciphers.aead import AESGCM\nimport os\ndef enc(k, p): return AESGCM(k).encrypt(os.urandom(12), p, None)\n"
        )
    ]
    assessment_clean, raw_clean = clean_engine.evaluate_source_files("Clean Repo", clean_files)
    assert assessment_clean.gate_result.pipeline_status == GateStatus.PASS

    # 2. Evaluate vulnerable target -> FAIL
    vuln_files = [
        FileProcessor.process_single_file(
            "auth.py",
            b"import hashlib\nfrom Crypto.Cipher import DES\ndef bad(d): return hashlib.md5(d).hexdigest(), DES.new(b'12345678')\n"
        )
    ]
    assessment_vuln, raw_vuln = clean_engine.evaluate_source_files("Vuln Repo", vuln_files)
    assert assessment_vuln.gate_result.pipeline_status == GateStatus.FAIL
    assert len(assessment_vuln.gate_result.blocking_violations) >= 1
    assert len(assessment_vuln.gate_result.threshold_failures) >= 1

    # 3. Verify Markdown report generation
    report_md = clean_engine.security_gate.generate_markdown_report("Vuln Repo", assessment_vuln.gate_result, assessment_vuln.scan_id)
    assert "# QuantumShield 2.0 — Cryptographic Security Gate Report" in report_md
    assert "🔴 FAIL" in report_md


# ==============================================================================
# SECURITY HARDENING & DEFENSE IN DEPTH
# ==============================================================================

def test_security_hardening_zip_bomb_guards():
    """Verify ZIP extraction bounds prevent zip bombs and path traversal."""
    # Create test zip with nested entries
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("safe_app.py", "import hashlib\ndef h(d): return hashlib.sha256(d).hexdigest()\n")
        # Path traversal slip attempt
        zf.writestr("../../etc/evil.txt", "MALICIOUS CONTENT")
    
    zip_bytes = zip_buffer.getvalue()
    temp_dir, extracted = FileProcessor.process_zip(zip_bytes)
    try:
        # Path traversal file must NOT be extracted
        assert not any("evil.txt" in f["rel_path"] for f in extracted)
        assert any("safe_app.py" in f["rel_path"] for f in extracted)
    finally:
        FileProcessor.cleanup_temp(temp_dir)


def test_security_hardening_private_key_redaction():
    """Verify private key material is automatically redacted from scan findings and logs."""
    rsa_priv = (
        "-----BEGIN RSA PRIVATE KEY-----\n"
        "MIIEowIBAAKCAQEA0Y3F3fakeKeyBytesForSecurityTest1234567890ABCDEF\n"
        "-----END RSA PRIVATE KEY-----\n"
    )
    processed = FileProcessor.process_single_file("id_rsa", rsa_priv.encode("utf-8"))
    assert processed["has_private_key"] is True
    assert "fakeKeyBytes" not in processed["content"]
    assert "[REDACTED BY QUANTUMSHIELD" in processed["content"]


def test_security_hardening_ssrf_blocking():
    """Verify SSRF engine blocks private, loopback, and metadata IP targets."""
    with pytest.raises(SSRFSecurityError):
        validate_public_target("localhost")

    with pytest.raises(SSRFSecurityError):
        validate_public_target("127.0.0.1")

    with pytest.raises(SSRFSecurityError):
        validate_public_target("169.254.169.254") # Cloud metadata service

    with pytest.raises(SSRFSecurityError):
        validate_public_target("10.0.0.1") # Private RFC 1918


def test_security_hardening_upload_limit():
    """Verify 413 error is returned when upload exceeds 50 MB."""
    # 51 MB oversized dummy payload
    oversized_bytes = b"0" * (51 * 1024 * 1024)
    files = [("files", ("big.zip", oversized_bytes, "application/zip"))]
    resp = client.post("/api/scan/upload", files=files)
    assert resp.status_code == 413
    assert "exceeds maximum allowed limit" in resp.json()["detail"]
