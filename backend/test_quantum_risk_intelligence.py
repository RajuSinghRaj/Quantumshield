"""
Automated Test Suite for QuantumShield 2.0 - Batch 4:
Quantum Risk Intelligence Engine + HNDL Risk Analyzer + Risk Dashboard APIs.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db, SessionLocal
from app.db.models import ScanRecord, CryptographicAsset, FindingRecord
from app.risk_engine.unified_risk_engine import (
    calculate_unified_risk_intelligence,
    deduplicate_cryptographic_assets,
    generate_prioritized_migration_list,
    RISK_WEIGHTS
)
from app.risk_engine.hndl_analyzer import (
    evaluate_hndl_exposure,
    extract_key_exchange_context,
    analyze_hndl_profile
)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Test 1: RSA and ECC Quantum Exposure (Shor's Algorithm)
# ---------------------------------------------------------------------------
def test_rsa_and_ecc_shor_exposure():
    """Verify that RSA and conventional ECC are classified as Shor-vulnerable with appropriate penalties."""
    findings = [
        {
            "algorithm": "RSA",
            "variant": "RSA-2048",
            "key_size": 2048,
            "usage": "KEY_EXCHANGE",
            "file_path": "crypto/rsa_handler.py",
            "line_number": 15,
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Shor's Algorithm"
        },
        {
            "algorithm": "ECDSA",
            "variant": "ECDSA-P256",
            "key_size": 256,
            "usage": "DIGITAL_SIGNATURE",
            "file_path": "crypto/ecc_signer.py",
            "line_number": 42,
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Shor's Algorithm"
        }
    ]

    intelligence = calculate_unified_risk_intelligence(findings)
    metrics = intelligence["asset_metrics"]
    scores = intelligence["scores"]

    assert metrics["shor_vulnerable_assets"] == 2
    assert scores["quantum_readiness_score"] < 100.0
    
    # Check that Shor deductions are recorded in the transparency report
    deductions = intelligence["score_deductions_and_bonuses"]["quantum_deductions"]
    assert any("Shor" in d.get("threat", "") for d in deductions)
    assert intelligence["overall_security_risk"]["level"] in {"HIGH", "CRITICAL"}


# ---------------------------------------------------------------------------
# Test 2: AES-128 vs AES-256 Grover Search Classification
# ---------------------------------------------------------------------------
def test_aes_grover_differentiation():
    """Verify that AES-128 is flagged as Grover-degraded while AES-256 retains sufficient quantum margin."""
    findings = [
        {
            "algorithm": "AES",
            "variant": "AES-128-GCM",
            "key_size": 128,
            "usage": "ENCRYPTION",
            "file_path": "crypto/symmetric.py",
            "line_number": 10,
            "classical_risk": "SAFE",
            "quantum_risk": "DEGRADED",
            "quantum_threat": "Grover's Search Algorithm"
        },
        {
            "algorithm": "AES",
            "variant": "AES-256-GCM",
            "key_size": 256,
            "usage": "ENCRYPTION",
            "file_path": "crypto/secure_vault.py",
            "line_number": 25,
            "classical_risk": "SAFE",
            "quantum_risk": "SAFE",
            "quantum_threat": "Grover Search (Mitigated by 256-bit Key)"
        }
    ]

    intelligence = calculate_unified_risk_intelligence(findings)
    metrics = intelligence["asset_metrics"]

    # Only AES-128 should be counted in grover_degraded_assets
    assert metrics["grover_degraded_assets"] == 1

    deductions = intelligence["score_deductions_and_bonuses"]["quantum_deductions"]
    aes_deductions = [d for d in deductions if "AES-128" in d["asset"]]
    assert len(aes_deductions) == 1
    assert aes_deductions[0]["deduction"] == 10.0


# ---------------------------------------------------------------------------
# Test 3: MD5 and SHA-1 Classical Weaknesses Not Conflated with Quantum
# ---------------------------------------------------------------------------
def test_md5_sha1_classical_attribution():
    """Verify that MD5 and SHA-1 have classical deductions and are not attributed solely to quantum attacks."""
    findings = [
        {
            "algorithm": "MD5",
            "variant": "MD5",
            "key_size": 128,
            "usage": "HASHING",
            "file_path": "legacy/checksum.py",
            "line_number": 8,
            "classical_risk": "CRITICAL",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Classically Broken + Grover Search"
        },
        {
            "algorithm": "SHA-1",
            "variant": "SHA-1",
            "key_size": 160,
            "usage": "HASHING",
            "file_path": "legacy/cert_sig.py",
            "line_number": 30,
            "classical_risk": "HIGH",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Classically Deprecated + Grover Search"
        }
    ]

    intelligence = calculate_unified_risk_intelligence(findings)
    metrics = intelligence["asset_metrics"]
    scores = intelligence["scores"]

    assert metrics["classical_broken_assets"] == 1
    assert metrics["classical_deprecated_assets"] == 1
    assert scores["classical_security_score"] < 70.0

    # Overall risk level must be CRITICAL due to broken primitive
    assert intelligence["overall_security_risk"]["level"] == "CRITICAL"


# ---------------------------------------------------------------------------
# Test 4: ML-KEM, ML-DSA, and SLH-DSA NIST PQC Standardization
# ---------------------------------------------------------------------------
def test_pqc_standardization_and_experimental_classification():
    """Verify that standardized NIST PQC algorithms receive full bonuses and experimental algorithms are marked."""
    findings = [
        {
            "algorithm": "ML-KEM",
            "variant": "ML-KEM-768",
            "key_size": 768,
            "usage": "KEY_EXCHANGE",
            "file_path": "pqc/kem.py",
            "line_number": 12,
            "classical_risk": "SAFE",
            "quantum_risk": "POST_QUANTUM",
            "quantum_threat": "None (Quantum Resistant)"
        },
        {
            "algorithm": "ML-DSA",
            "variant": "ML-DSA-65",
            "key_size": 65,
            "usage": "DIGITAL_SIGNATURE",
            "file_path": "pqc/dsa.py",
            "line_number": 20,
            "classical_risk": "SAFE",
            "quantum_risk": "POST_QUANTUM",
            "quantum_threat": "None (Quantum Resistant)"
        },
        {
            "algorithm": "FALCON",
            "variant": "Falcon-512",
            "key_size": 512,
            "usage": "DIGITAL_SIGNATURE",
            "file_path": "pqc/experimental_sig.py",
            "line_number": 50,
            "classical_risk": "SAFE",
            "quantum_risk": "POST_QUANTUM",
            "quantum_threat": "Experimental Lattice"
        }
    ]

    intelligence = calculate_unified_risk_intelligence(findings)
    metrics = intelligence["asset_metrics"]
    bonuses = intelligence["score_deductions_and_bonuses"]["pqc_bonuses"]

    assert metrics["pqc_standardized_assets"] == 2
    assert metrics["unverified_pqc_assets"] == 1
    assert len(bonuses) == 3
    assert intelligence["scores"]["pqc_adoption_percentage"] == 100.0


# ---------------------------------------------------------------------------
# Test 5: Asset Deduplication Across CBOM, Findings, and Certificates
# ---------------------------------------------------------------------------
def test_asset_deduplication():
    """Verify that an asset detected in source code is not double-counted across CBOM or duplicate findings."""
    findings = [
        {
            "algorithm": "RSA",
            "variant": "RSA-2048",
            "usage": "ENCRYPTION",
            "file_path": "common/crypto.py",
            "line_number": 25,
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE"
        },
        {
            "algorithm": "RSA",
            "variant": "RSA-2048",
            "usage": "ENCRYPTION",
            "file_path": "common/crypto.py",
            "line_number": 25,
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE"
        }
    ]

    deduped = deduplicate_cryptographic_assets(findings=findings)
    assert len(deduped) == 1


# ---------------------------------------------------------------------------
# Test 6: TLS Hybrid Key Exchange Evidence Integration
# ---------------------------------------------------------------------------
def test_tls_hybrid_evidence_handling():
    """Verify that verified TLS hybrid key exchange awards bonuses and mitigates HNDL exposure."""
    tls_data = {
        "host": "quantum-ready.example.com",
        "protocol_version": "TLSv1.3",
        "cipher_suite": "TLS_AES_256_GCM_SHA384",
        "key_exchange": {
            "group_or_curve": "X25519Kyber768Draft00",
            "mechanism": "Hybrid Post-Quantum Key Exchange"
        },
        "is_hybrid_pqc": True
    }

    intelligence = calculate_unified_risk_intelligence(
        findings=[],
        tls_data=tls_data
    )

    bonuses = intelligence["score_deductions_and_bonuses"]["pqc_bonuses"]
    assert any("TLS Hybrid" in b["asset"] for b in bonuses)
    assert intelligence["hndl_analysis"]["key_exchange_context"]["has_pqc_protection"] is True


# ---------------------------------------------------------------------------
# Test 7: HNDL Sensitivity and Confidentiality Lifetime Evaluation Matrix
# ---------------------------------------------------------------------------
def test_hndl_sensitivity_and_lifetime_matrix():
    """Verify the multi-factor HNDL exposure matrix for critical/long-lived vs short-lived data."""
    kx_classical = {
        "has_classical_exposure": True,
        "has_pqc_protection": False
    }

    # High sensitivity + Indefinite lifetime -> Critical HNDL exposure
    crit_hndl = evaluate_hndl_exposure(
        category_name="Genomic & Health Records",
        sensitivity="CRITICAL",
        lifetime="INDEFINITE",
        kx_context=kx_classical
    )
    assert crit_hndl["exposure_level"] == "CRITICAL"
    assert crit_hndl["hndl_score"] >= 70.0

    # Low sensitivity + Short-term lifetime -> Low HNDL exposure
    low_hndl = evaluate_hndl_exposure(
        category_name="Ephemeral Web Session Cookie",
        sensitivity="LOW",
        lifetime="SHORT_TERM",
        kx_context=kx_classical
    )
    assert low_hndl["exposure_level"] == "LOW"
    assert low_hndl["hndl_score"] <= 20.0


# ---------------------------------------------------------------------------
# Test 8: Missing HNDL Inputs Handling (Transparent Assumptions)
# ---------------------------------------------------------------------------
def test_missing_hndl_inputs_transparency():
    """Verify that missing user inputs are not silently converted to favorable scores."""
    kx_classical = {"has_classical_exposure": True, "has_pqc_protection": False}

    assumed_hndl = evaluate_hndl_exposure(
        category_name="Unspecified Payload",
        sensitivity="UNKNOWN",
        lifetime="UNKNOWN",
        kx_context=kx_classical
    )

    assert assumed_hndl["is_user_specified"] is False
    assert len(assumed_hndl["assumptions"]) > 0
    # Should not produce 0 score
    assert assumed_hndl["hndl_score"] > 0.0


# ---------------------------------------------------------------------------
# Test 9: Deterministic Scoring Formula
# ---------------------------------------------------------------------------
def test_deterministic_scoring_integrity():
    """Verify that identical cryptographic inputs produce exactly identical numerical scores."""
    sample_findings = [
        {
            "algorithm": "RSA",
            "variant": "RSA-2048",
            "key_size": 2048,
            "usage": "KEY_EXCHANGE",
            "file_path": "auth/token.py",
            "line_number": 14,
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE"
        },
        {
            "algorithm": "AES",
            "variant": "AES-128-CBC",
            "key_size": 128,
            "usage": "ENCRYPTION",
            "file_path": "storage/db.py",
            "line_number": 55,
            "classical_risk": "SAFE",
            "quantum_risk": "DEGRADED"
        }
    ]

    run1 = calculate_unified_risk_intelligence(sample_findings)
    run2 = calculate_unified_risk_intelligence(sample_findings)

    assert run1["overall_security_risk"]["score"] == run2["overall_security_risk"]["score"]
    assert run1["scores"]["quantum_readiness_score"] == run2["scores"]["quantum_readiness_score"]
    assert run1["scores"]["classical_security_score"] == run2["scores"]["classical_security_score"]
    assert run1["scores"]["hndl_exposure_score"] == run2["scores"]["hndl_exposure_score"]


# ---------------------------------------------------------------------------
# Test 10: Migration Priority Ordering
# ---------------------------------------------------------------------------
def test_migration_priority_ordering():
    """Verify that classically broken primitives and HNDL key exchanges rank above general algorithms."""
    assets = [
        {
            "algorithm": "AES",
            "variant": "AES-128",
            "usage": "ENCRYPTION",
            "classical_risk": "SAFE",
            "quantum_risk": "DEGRADED",
            "file_path": "crypto/aes.py"
        },
        {
            "algorithm": "MD5",
            "variant": "MD5",
            "usage": "HASHING",
            "classical_risk": "CRITICAL",
            "quantum_risk": "VULNERABLE",
            "file_path": "crypto/md5.py"
        },
        {
            "algorithm": "ECDH",
            "variant": "ECDH-P256",
            "usage": "KEY_EXCHANGE",
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE",
            "file_path": "crypto/ecdh.py"
        }
    ]

    priorities = generate_prioritized_migration_list(assets)
    assert len(priorities) == 3
    # First item must be CRITICAL (MD5 or ECDH key exchange)
    assert priorities[0]["priority"] == "CRITICAL"
    # AES-128 should rank as MEDIUM priority
    aes_item = next(p for p in priorities if "AES-128" in p["primitive"])
    assert aes_item["priority"] == "MEDIUM"


# ---------------------------------------------------------------------------
# Test 11: Empty Scan Handling
# ---------------------------------------------------------------------------
def test_empty_scan_risk_intelligence():
    """Verify that an empty scan produces a valid default state without raising exceptions."""
    intelligence = calculate_unified_risk_intelligence([])
    assert intelligence["overall_security_risk"]["score"] == 0.0
    assert intelligence["scores"]["quantum_readiness_score"] == 100.0
    assert intelligence["scores"]["classical_security_score"] == 100.0
    assert intelligence["asset_metrics"]["total_cryptographic_assets"] == 0


# ---------------------------------------------------------------------------
# Test 12: Database Persistence and Batch 4 API Endpoints
# ---------------------------------------------------------------------------
def test_database_persistence_and_batch4_apis():
    """Verify DB persistence of risk_analysis_data, hndl_data, and all Batch 4 REST endpoints."""
    # 1. Trigger demo scan to populate records
    demo_res = client.post("/api/scan/demo", data={"project_id": "legacy_bank"})
    assert demo_res.status_code == 200
    scan_id = demo_res.json()["scan_id"]

    # 2. Test GET /api/scan/{scan_id}/risk-analysis
    ra_res = client.get(f"/api/scan/{scan_id}/risk-analysis")
    assert ra_res.status_code == 200
    ra_data = ra_res.json()
    assert "overall_security_risk" in ra_data
    assert "scores" in ra_data
    assert "asset_metrics" in ra_data

    # 3. Test GET /api/scan/{scan_id}/risk-breakdown
    rb_res = client.get(f"/api/scan/{scan_id}/risk-breakdown")
    assert rb_res.status_code == 200
    rb_data = rb_res.json()
    assert "score_deductions_and_bonuses" in rb_data

    # 4. Test GET /api/scan/{scan_id}/migration-priorities
    mp_res = client.get(f"/api/scan/{scan_id}/migration-priorities")
    assert mp_res.status_code == 200
    mp_data = mp_res.json()
    assert isinstance(mp_data, list)

    # 5. Test GET /api/scan/{scan_id}/hndl
    hndl_res = client.get(f"/api/scan/{scan_id}/hndl")
    assert hndl_res.status_code == 200
    hndl_data = hndl_res.json()
    assert "overall_hndl_score" in hndl_data
    assert "key_exchange_context" in hndl_data

    # 6. Test POST /api/scan/{scan_id}/hndl/assess
    assess_res = client.post(
        f"/api/scan/{scan_id}/hndl/assess",
        json={
            "category": "Customer Payment Data",
            "sensitivity": "HIGH",
            "lifetime": "LONG_TERM",
            "description": "PCI-DSS encrypted payment logs"
        }
    )
    assert assess_res.status_code == 200
    assess_data = assess_res.json()
    assert assess_data["assessment"]["category"] == "Customer Payment Data"
    assert "hndl_analysis" in assess_data

    # 7. Test GET /api/scan/{scan_id}/readiness
    readiness_res = client.get(f"/api/scan/{scan_id}/readiness")
    assert readiness_res.status_code == 200
    readiness_data = readiness_res.json()
    assert "quantum_readiness_score" in readiness_data
    assert "pqc_adoption_percentage" in readiness_data
