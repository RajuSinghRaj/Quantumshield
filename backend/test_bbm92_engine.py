"""
Comprehensive Test Suite for BBM92 Quantum Key Distribution Engine.
Verifies Bell-state correlations, basis sifting, parameter estimation, QBER calculation,
Eve intercept-resend degradation, channel noise, and API endpoints.
"""

import os
import sys
import pytest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend path is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.quantum_engine.bbm92_simulator import run_bbm92_simulation
from app.quantum_engine.circuit_utils import is_qiskit_available
from fastapi.testclient import TestClient
from app.main import app

def test_bbm92_engine():
    print("\n=== BBM92 QUANTUM KEY DISTRIBUTION TEST SUITE ===")
    assert is_qiskit_available(), "Qiskit must be available for executable simulation."

    # 1. Bell-Pair Preparation & Ideal Correlations
    print("\n--- 1. Testing Ideal Channel & Entanglement Correlations ---")
    ideal_res = run_bbm92_simulation(pair_count=100, scenario="ideal", random_seed=42)
    assert ideal_res["status"] == "COMPLETED_SECURE", f"Ideal status unexpected: {ideal_res['status']}"
    assert ideal_res["measured_qber"] == 0.0, f"Ideal QBER must be 0.0, got {ideal_res['measured_qber']}"
    assert ideal_res["test_sample_errors"] == 0, f"Ideal test errors must be 0, got {ideal_res['test_sample_errors']}"
    
    # Statistical tolerance for 50% basis match probability: out of 100, matched between 30 and 70
    matched = ideal_res["matched_bases_count"]
    assert 30 <= matched <= 70, f"Matched bases count ({matched}) outside statistical range [30, 70]"
    print(f"Ideal pairs: {ideal_res['pair_count']}, Matched: {matched}, QBER: {ideal_res['measured_qber']}")
    print(f"Candidate Key Length: {ideal_res['candidate_key_length']} bits")

    # 2. Basis Sifting & Candidate Key Allocation
    print("\n--- 2. Testing Basis Sifting & Disclosed Test Subsets ---")
    test_size = ideal_res["test_sample_size"]
    cand_len = ideal_res["candidate_key_length"]
    assert matched == test_size + cand_len, f"Matched ({matched}) must equal test ({test_size}) + candidate ({cand_len})"
    assert test_size > 0, "Test sample size must be non-zero"
    assert cand_len > 0, "Candidate key length must be non-zero"
    assert "qber_breakdown" in ideal_res, "qber_breakdown must be present in response"
    assert "ZZ" in ideal_res["qber_breakdown"] and "XX" in ideal_res["qber_breakdown"] and "total" in ideal_res["qber_breakdown"]
    assert "rounds_data" in ideal_res and len(ideal_res["rounds_data"]) == 100
    print(f"Sifted ({matched}) = Disclosed Test ({test_size}) + Undisclosed Candidate Key ({cand_len})")
    print(f"QBER Breakdown: ZZ={ideal_res['qber_breakdown']['ZZ']}, XX={ideal_res['qber_breakdown']['XX']}, Total={ideal_res['qber_breakdown']['total']}")

    # 3. Eve Intercept-Resend Attack & Correlation Degradation
    print("\n--- 3. Testing Eve Intercept-Resend Simulation ---")
    eve_res = run_bbm92_simulation(pair_count=160, scenario="eve", eve_intercept_prob=1.0, random_seed=123)
    eve_qber = eve_res["measured_qber"]
    print(f"Eve Matched: {eve_res['matched_bases_count']}, Test Errors: {eve_res['test_sample_errors']}/{eve_res['test_sample_size']}, Measured QBER: {eve_qber * 100:.1f}%")
    # Under Eve intercept-resend, expected theoretical QBER is ~25%.
    # With statistical tolerance on finite sample: assert between 12% and 40%
    assert 0.12 <= eve_qber <= 0.40, f"Eve QBER ({eve_qber}) outside expected finite sampling tolerance [0.12, 0.40]"
    assert eve_res["status"] == "COMPLETED_ABORTED", f"Eve interception should abort session (>11% threshold), got {eve_res['status']}"
    print("Eve disturbance successfully detected and session correctly aborted.")

    # 4. Noisy Channel Behavior
    print("\n--- 4. Testing Noisy Channel Simulation ---")
    noisy_res = run_bbm92_simulation(pair_count=120, scenario="noisy", noise_rate=0.25, random_seed=99)
    print(f"Noisy Channel Status: {noisy_res['status']}, QBER: {noisy_res['measured_qber'] * 100:.1f}%")
    assert "status" in noisy_res and noisy_res["pair_count"] == 120

    # 5. Insufficient Finite Sample Handling
    print("\n--- 5. Testing Finite Sample Starvation (< 4 matched pairs) ---")
    sparse_res = run_bbm92_simulation(pair_count=4, scenario="ideal", random_seed=7)
    if sparse_res["matched_bases_count"] < 4:
        assert sparse_res["status"] == "INSUFFICIENT_SAMPLE"
        assert "Insufficient sample" in sparse_res["status_message"]
        print(f"Insufficient sample guard triggered as expected: {sparse_res['status_message']}")
    else:
        print("Note: 4 pairs happened to have >= 4 matches; testing with pair_count=2")
        sparse_res2 = run_bbm92_simulation(pair_count=2, scenario="ideal", random_seed=7)
        assert sparse_res2["status"] == "INSUFFICIENT_SAMPLE"
        print(f"Insufficient sample guard triggered: {sparse_res2['status_message']}")

    # 6. API Endpoints Verification
    print("\n--- 6. Testing FastAPI Endpoints ---")
    client = TestClient(app)

    # Test /api/quantum/bbm92/run JSON
    r_json = client.post("/api/quantum/bbm92/run", json={"pair_count": 50, "scenario": "ideal"})
    assert r_json.status_code == 200, f"API JSON failed: {r_json.status_code}"
    body_json = r_json.json()
    assert body_json["protocol"] == "BBM92 Quantum Key Distribution"
    assert "circuit_metadata" in body_json
    assert "measured_qber" in body_json
    print(f"POST /api/quantum/bbm92/run (JSON): OK (status={body_json['status']})")

    # Test /quantum/bbm92/run Form
    r_form = client.post("/quantum/bbm92/run", data={"pair_count": 60, "scenario": "eve"})
    assert r_form.status_code == 200, f"API Form failed: {r_form.status_code}"
    body_form = r_form.json()
    assert body_form["scenario"] == "eve"
    print(f"POST /quantum/bbm92/run (Form): OK (scenario={body_form['scenario']}, QBER={body_form['measured_qber']})")

    print("\n[SUCCESS] ALL BBM92 QUANTUM KEY DISTRIBUTION TESTS PASSED!")

if __name__ == "__main__":
    test_bbm92_engine()
