"""
Automated Test Suite for QuantumShield 2.0 - Batch 5:
PQC Vulnerability Remediation Engine + Migration Sandbox + Hybrid Cryptography Demonstrator.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.recommendation_engine.remediation_engine import (
    get_remediation_target,
    generate_code_patch,
    generate_remediation_roadmap_for_scan
)
from app.recommendation_engine.migration_sandbox import (
    initialize_sandbox,
    apply_patch_to_sandbox,
    reject_patch_proposal,
    sanitize_sandbox_path,
    compare_scans_before_and_after,
    PathTraversalError
)
from app.quantum_engine.hybrid_kex_demonstrator import (
    run_hybrid_key_exchange_demo,
    compare_kex_modes,
    is_mlkem_available,
    get_crypto_environment_metadata
)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Test 1: Technically Correct Algorithm-to-PQC Mappings
# ---------------------------------------------------------------------------
def test_pqc_algorithm_mappings():
    """Verify strictly correct mapping: RSA key transport -> ML-KEM, RSA signatures -> ML-DSA/SLH-DSA."""
    # Key establishment
    rsa_kem = get_remediation_target("RSA", "KEY_EXCHANGE")
    assert "ML-KEM" in rsa_kem["standard_target"]
    assert "DSA" not in rsa_kem["standard_target"]

    ecdh_kem = get_remediation_target("ECDH", "KEY_EXCHANGE")
    assert "ML-KEM" in ecdh_kem["standard_target"]

    x25519_kem = get_remediation_target("X25519", "KEY_EXCHANGE")
    assert "ML-KEM" in x25519_kem["standard_target"]

    # Signatures
    rsa_sig = get_remediation_target("RSA", "DIGITAL_SIGNATURE")
    assert "ML-DSA" in rsa_sig["standard_target"]
    assert "KEM" not in rsa_sig["standard_target"]

    ecdsa_sig = get_remediation_target("ECDSA", "DIGITAL_SIGNATURE")
    assert "ML-DSA" in ecdsa_sig["standard_target"]

    ed25519_sig = get_remediation_target("ED25519", "DIGITAL_SIGNATURE")
    assert "ML-DSA" in ed25519_sig["standard_target"]

    # Symmetric and Hashing
    aes_128 = get_remediation_target("AES", "ENCRYPTION", "AES-128-CBC")
    assert "AES-256" in aes_128["standard_target"]

    md5_hash = get_remediation_target("MD5", "HASHING")
    assert "SHA-256" in md5_hash["standard_target"]


# ---------------------------------------------------------------------------
# Test 2: Code Patch Generation & Unified Diff
# ---------------------------------------------------------------------------
def test_code_patch_generation_python_md5():
    """Verify automated patch generation and unified diff for Python hashlib MD5."""
    source_code = (
        "import hashlib\n\n"
        "def compute_hash(data):\n"
        "    return hashlib.md5(data.encode()).hexdigest()\n"
    )

    finding = {
        "id": "find_1",
        "algorithm": "MD5",
        "variant": "MD5",
        "usage": "HASHING"
    }

    patch = generate_code_patch(source_code, "auth/hasher.py", 4, finding)

    assert patch["can_auto_apply"] is True
    assert patch["patch_type"] == "AUTOMATED_PATCH"
    assert "hashlib.sha256" in patch["proposed_code"]
    assert "hashlib.md5" in patch["original_code"]
    assert "--- a/auth/hasher.py" in patch["unified_diff"]
    assert "+    return hashlib.sha256(data.encode()).hexdigest()" in patch["unified_diff"]


# ---------------------------------------------------------------------------
# Test 3: Path Traversal Prevention in Migration Sandbox
# ---------------------------------------------------------------------------
def test_sandbox_path_traversal_prevention():
    """Verify strict blocking of directory traversal attempts (../, absolute paths, drive letters)."""
    # Valid relative paths
    assert sanitize_sandbox_path("src/crypto/auth.py") == "src/crypto/auth.py"
    assert sanitize_sandbox_path("utils\\cipher.py") == "utils/cipher.py"

    # Directory traversal attempts
    with pytest.raises(PathTraversalError, match="traversal"):
        sanitize_sandbox_path("../../../etc/passwd")

    with pytest.raises(PathTraversalError, match="traversal"):
        sanitize_sandbox_path("src/../../secret.key")

    # Absolute paths
    with pytest.raises(PathTraversalError, match="Absolute path"):
        sanitize_sandbox_path("/etc/shadow")

    with pytest.raises(PathTraversalError, match="Absolute path"):
        sanitize_sandbox_path("C:\\Windows\\System32\\cmd.exe")


# ---------------------------------------------------------------------------
# Test 4: Original Project Immutability & Sandbox Isolation
# ---------------------------------------------------------------------------
def test_original_project_immutability():
    """Verify that applying a patch modifies only the sandbox workspace, leaving original files untouched."""
    original_files = {
        "legacy/hasher.py": "import hashlib\ndef h(x): return hashlib.md5(x).hexdigest()\n"
    }

    original_code_copy = str(original_files["legacy/hasher.py"])

    # Initialize sandbox
    sandbox = initialize_sandbox("scan_test_1", "Audit Project", original_files, [])

    # Apply patch in sandbox
    finding = {"algorithm": "MD5", "variant": "MD5", "usage": "HASHING"}
    result = apply_patch_to_sandbox(sandbox["sandbox_id"], "legacy/hasher.py", 2, finding)

    assert result["success"] is True
    # Sandbox file is updated
    assert "hashlib.sha256" in sandbox["files"]["legacy/hasher.py"]
    # Original dictionary/file was NOT modified
    assert original_files["legacy/hasher.py"] == original_code_copy
    assert "hashlib.md5" in original_files["legacy/hasher.py"]


# ---------------------------------------------------------------------------
# Test 5: Patch Rejection and Audit History Logging
# ---------------------------------------------------------------------------
def test_sandbox_patch_rejection_audit_trail():
    """Verify that rejecting a patch is recorded in the sandbox audit trail."""
    sandbox = initialize_sandbox("scan_test_2", "Audit Project", {"app.py": "import os\n"}, [])
    res = reject_patch_proposal(sandbox["sandbox_id"], "app.py", "finding_123")

    assert res["success"] is True
    audit = sandbox["audit_log"]
    assert any(a["action"] == "PATCH_REJECTED" for a in audit)


# ---------------------------------------------------------------------------
# Test 6: Before-and-After Security Scan Comparison
# ---------------------------------------------------------------------------
def test_before_and_after_comparison():
    """Verify detection of RESOLVED vs UNRESOLVED findings and score deltas between scans."""
    original_scan = {
        "scan_id": "orig_1",
        "scores": {"quantum_score": 50.0, "classical_score": 60.0, "pqc_score": 0.0, "overall_risk": "HIGH"},
        "risk_analysis": {"overall_security_risk": {"score": 65.0, "level": "HIGH"}},
        "findings": [
            {"algorithm": "MD5", "variant": "MD5", "file_path": "legacy.py", "line_number": 5, "severity": "CRITICAL"},
            {"algorithm": "RSA", "variant": "RSA-2048", "file_path": "auth.py", "line_number": 10, "severity": "HIGH"}
        ]
    }

    # MD5 resolved in rescan; RSA remains
    remediated_scan = {
        "scan_id": "rem_2",
        "scores": {"quantum_score": 75.0, "classical_score": 95.0, "pqc_score": 0.0, "overall_risk": "MEDIUM"},
        "risk_analysis": {"overall_security_risk": {"score": 35.0, "level": "MEDIUM"}},
        "findings": [
            {"algorithm": "RSA", "variant": "RSA-2048", "file_path": "auth.py", "line_number": 10, "severity": "HIGH"}
        ]
    }

    comparison = compare_scans_before_and_after(original_scan, remediated_scan)

    assert comparison["findings_delta"]["resolved_count"] == 1
    assert comparison["findings_delta"]["unresolved_count"] == 1
    assert comparison["findings_delta"]["resolved_items"][0]["algorithm"] == "MD5"
    assert comparison["findings_delta"]["unresolved_items"][0]["algorithm"] == "RSA"
    # Classical score improved by +35
    assert comparison["score_deltas"]["classical_security_delta"] == 35.0
    # Overall risk decreased by -30 (65 -> 35)
    assert comparison["score_deltas"]["overall_risk_score_delta"] == -30.0


# ---------------------------------------------------------------------------
# Test 7: ML-KEM-768 Encapsulation and Decapsulation Roundtrip
# ---------------------------------------------------------------------------
def test_mlkem768_encaps_decaps_roundtrip():
    """Verify genuine NIST FIPS 203 ML-KEM-768 key generation, encapsulation, and decapsulation."""
    if not is_mlkem_available():
        pytest.skip("ML-KEM library is not installed.")

    import mlkem
    kem = mlkem.ML_KEM(mlkem.ParameterSet.ML_KEM_768)

    # Key generation: Encapsulation key (1184 bytes), Decapsulation key (2400 bytes)
    ek, dk = kem.key_gen()
    assert len(bytes(ek)) == 1184
    assert len(bytes(dk)) == 2400

    # Encapsulation: produces 32-byte shared secret and 1088-byte ciphertext
    ss_alice, ciphertext = kem.encaps(ek)
    assert len(ss_alice) == 32
    assert len(bytes(ciphertext)) == 1088

    # Decapsulation: recovers identical 32-byte shared secret
    ss_bob = kem.decaps(dk, ciphertext)
    assert len(ss_bob) == 32
    assert ss_alice == ss_bob


# ---------------------------------------------------------------------------
# Test 8: X25519 Classical Shared Secret Agreement
# ---------------------------------------------------------------------------
def test_x25519_key_agreement():
    """Verify X25519 ECDH produces matching 32-byte shared secrets for both parties."""
    from cryptography.hazmat.primitives.asymmetric import x25519
    alice_priv = x25519.X25519PrivateKey.generate()
    bob_priv = x25519.X25519PrivateKey.generate()

    ss_alice = alice_priv.exchange(bob_priv.public_key())
    ss_bob = bob_priv.exchange(alice_priv.public_key())

    assert len(ss_alice) == 32
    assert ss_alice == ss_bob


# ---------------------------------------------------------------------------
# Test 9: Full Hybrid KEX + AES-256-GCM + Tamper Detection
# ---------------------------------------------------------------------------
def test_hybrid_kex_and_tamper_detection():
    """Verify complete executable demonstration: X25519 + ML-KEM-768 + HKDF + AES-256-GCM + Tamper detection."""
    demo = run_hybrid_key_exchange_demo(
        plaintext_message="Top secret financial ledger entry.",
        associated_data="Audit-Session-2026",
        simulate_tamper=True
    )

    if not is_mlkem_available():
        assert demo["success"] is False
        assert "ML-KEM dependency" in demo["error"]
        return

    assert demo["success"] is True
    assert demo["tamper_verification"]["tamper_detected"] is True
    assert "InvalidTag" in demo["tamper_verification"]["exception"]
    assert demo["previews"]["decrypted_plaintext"] == "Top secret financial ledger entry."
    assert demo["sizes_bytes"]["derived_symmetric_key"] == 32
    assert demo["sizes_bytes"]["mlkem_ciphertext"] == 1088


# ---------------------------------------------------------------------------
# Test 10: Comparative Key Establishment Modes
# ---------------------------------------------------------------------------
def test_comparative_kex_modes():
    """Verify side-by-side comparison of Classical, PQC, and Hybrid modes."""
    modes = compare_kex_modes()
    assert "classical_x25519" in modes
    assert "pqc_mlkem768" in modes
    assert "hybrid_x25519_mlkem768" in modes

    assert "VULNERABLE" in modes["classical_x25519"]["quantum_status"]


# ---------------------------------------------------------------------------
# Test 11: Batch 5 REST API Endpoints
# ---------------------------------------------------------------------------
def test_batch5_rest_api_endpoints():
    """Verify Batch 5 REST APIs for remediation, patch application, sandbox rescan, and hybrid demo."""
    # 1. Run demo scan to establish baseline record
    demo_res = client.post("/api/scan/demo", data={"project_id": "legacy_bank"})
    assert demo_res.status_code == 200
    scan_id = demo_res.json()["scan_id"]

    # 2. Test GET /api/scan/{scan_id}/remediation
    rem_res = client.get(f"/api/scan/{scan_id}/remediation")
    assert rem_res.status_code == 200
    rem_data = rem_res.json()
    assert "proposals" in rem_data
    assert len(rem_data["proposals"]) > 0

    # 3. Test POST /api/scan/{scan_id}/remediation/apply
    first_prop = rem_data["proposals"][0]
    apply_res = client.post(
        f"/api/scan/{scan_id}/remediation/apply",
        json={
            "file_path": first_prop["file_path"],
            "line_number": first_prop["line_number"],
            "finding": first_prop
        }
    )
    assert apply_res.status_code == 200
    apply_data = apply_res.json()
    assert "sandbox_id" in apply_data

    # 4. Test POST /api/scan/{scan_id}/remediation/rescan
    rescan_res = client.post(f"/api/scan/{scan_id}/remediation/rescan")
    assert rescan_res.status_code == 200
    rescan_data = rescan_res.json()
    assert rescan_data["success"] is True
    assert "comparison" in rescan_data

    # 5. Test GET /api/scan/{scan_id}/remediation/comparison
    comp_res = client.get(f"/api/scan/{scan_id}/remediation/comparison")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "score_deltas" in comp_data

    # 6. Test POST /api/hybrid/demo/run
    hybrid_res = client.post(
        "/api/hybrid/demo/run",
        json={
            "message": "Live API test payload",
            "associated_data": "API-AAD-Context",
            "simulate_tamper": True
        }
    )
    assert hybrid_res.status_code == 200
    hybrid_json = hybrid_res.json()
    assert hybrid_json["success"] is True

    # 7. Test GET /api/hybrid/comparison
    comp_modes_res = client.get("/api/hybrid/comparison")
    assert comp_modes_res.status_code == 200
    assert "classical_x25519" in comp_modes_res.json()
