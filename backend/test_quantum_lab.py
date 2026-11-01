"""
Comprehensive Test Suite for Batch 6: Quantum Simulation Laboratory
Covers:
  1. Shor's Algorithm Simulator:
     - N=15, a=7 factorization (quantum period finding + QFT + continued fractions)
     - Valid alternative educational inputs (N=21, N=35)
     - Classical pre-checks & error validation (even N, prime N, gcd(a,N) > 1, N > 500)
     - Circuit construction, modular exponentiation, and RSA threat explanations
  2. Grover's Algorithm Simulator:
     - 2-qubit (N=4), 3-qubit (N=8), 4-qubit (N=16) search spaces
     - Oracle phase inversion and diffusion operator
     - Amplitude amplification scaling across iterations (P(k))
     - Over-rotation detection (k > k_opt)
     - Input validation (invalid bitstring length, invalid characters)
     - AES-128 vs AES-256 quadratic security margin metrics
  3. BBM92 QKD Simulator:
     - Bell-pair generation and anti-correlated / correlated measurements
     - Z-basis and X-basis reconciliation (sifting)
     - Parameter estimation and QBER calculation
     - Clean channel: QBER ~ 0.0, status COMPLETED_SECURE
     - Eve intercept-resend attack: QBER >= 0.11, status COMPLETED_ABORTED
     - Finite-sample statistical variation handling
     - Deterministic seeded reproducibility
  4. FastAPI REST Endpoints:
     - POST /api/quantum/shor (JSON and Form)
     - POST /api/quantum/grover (JSON and Form)
     - POST /api/quantum/bbm92/run (JSON)
     - GET /api/quantum/analysis/{scan_id}
     - Input boundary guards and 400/422 validation
"""

import pytest
import math
from fastapi.testclient import TestClient

from app.quantum_engine.shor_simulator import ShorSimulator
from app.quantum_engine.grover_simulator import GroverSimulator
from app.quantum_engine.bbm92_simulator import BBM92Simulator
from app.main import app

client = TestClient(app)


# ==============================================================================
# 1. SHOR'S ALGORITHM SIMULATOR TESTS
# ==============================================================================

class TestShorSimulator:
    """Test suite for educational Shor's period finding and factorization."""

    def test_shor_n15_a7_success(self):
        """Test standard educational factorization of N=15 with a=7."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=15, a=7, shots=1024)

        assert result["success"] is True
        assert result["factors"] == [3, 5]
        assert result["period"] == 4
        assert result["target_number"] == 15
        assert result["coprime_base"] == 7
        assert "circuit_ascii" in result
        assert len(result["measurement_counts"]) > 0
        assert "phase_candidates" in result
        assert len(result["phase_candidates"]) > 0
        assert "quantum_vs_classical_steps" in result
        assert "threat_analysis" in result
        assert "hardware_requirements" in result
        assert result["hardware_requirements"]["logical_qubits_rsa2048"] == 4096

    def test_shor_n21_a2_modular_sequence(self):
        """Test N=21 with coprime a=2."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=21, a=2, shots=1024)

        assert result["success"] is True
        assert result["target_number"] == 21
        assert result["coprime_base"] == 2
        assert "factors" in result
        # Factors of 21 are 3 and 7
        if result["factors"]:
            assert set(result["factors"]) == {3, 7}
        assert "modular_sequence" in result
        assert len(result["modular_sequence"]) > 0

    def test_shor_classical_even_number_rejected(self):
        """Even numbers must be rejected by classical pre-check."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=14, a=3)
        assert result["success"] is False
        assert "even" in result["error"].lower()
        assert result["factors"] == [2, 7]

    def test_shor_classical_prime_rejected(self):
        """Prime numbers must be rejected by classical pre-check."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=17, a=3)
        assert result["success"] is False
        assert "prime" in result["error"].lower()

    def test_shor_shared_factor_found_classically(self):
        """If gcd(a, N) > 1, factor is already found classically."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=15, a=6)
        assert result["success"] is True
        assert "Shared factor found classically" in result.get("message", "")
        assert 3 in result["factors"]

    def test_shor_unsupported_large_n(self):
        """Simulation resource limit: reject N > 500 for educational simulator."""
        sim = ShorSimulator()
        result = sim.run_simulation(N=501, a=7)
        assert result["success"] is False
        assert "Educational simulator limit" in result["error"]


# ==============================================================================
# 2. GROVER'S ALGORITHM SIMULATOR TESTS
# ==============================================================================

class TestGroverSimulator:
    """Test suite for Grover's search and amplitude amplification."""

    def test_grover_2qubits_optimal(self):
        """Test Grover search on 2 qubits (N=4, optimal iteration=1, success=100%)."""
        sim = GroverSimulator()
        result = sim.run_simulation(target_bitstring="11", iterations=1, shots=1024)

        assert result["success"] is True
        assert result["num_qubits"] == 2
        assert result["search_space_size"] == 4
        assert result["marked_state"] == "11"
        assert result["marked_state_probability"] == 1.0
        assert result["measured_target"] == "11"
        assert "circuit_ascii" in result
        assert len(result["progression"]) >= 1
        assert any(p["is_applied"] for p in result["progression"])

    def test_grover_3qubits_amplitude_amplification(self):
        """Test Grover search on 3 qubits (N=8, marked state '101')."""
        sim = GroverSimulator()
        result = sim.run_simulation(target_bitstring="101", iterations=2, shots=2048)

        assert result["success"] is True
        assert result["num_qubits"] == 3
        assert result["search_space_size"] == 8
        assert result["optimal_iterations"] == 2
        assert result["marked_state"] == "101"
        # Theoretical prob at k=2 is ~94.5%
        assert result["marked_state_probability"] > 0.90
        assert result["measured_target"] == "101"
        assert len(result["progression"]) >= 2

    def test_grover_4qubits_search_space(self):
        """Test Grover search on 4 qubits (N=16, marked state '0110')."""
        sim = GroverSimulator()
        result = sim.run_simulation(target_bitstring="0110", iterations=3, shots=2048)

        assert result["success"] is True
        assert result["num_qubits"] == 4
        assert result["search_space_size"] == 16
        assert result["optimal_iterations"] == 3
        assert result["marked_state_probability"] > 0.90

    def test_grover_over_rotation_warning(self):
        """Test that excessive iterations trigger an over-rotation warning."""
        sim = GroverSimulator()
        # For 2 qubits, optimal is 1. Running 2 iterations causes over-rotation back to 0!
        result = sim.run_simulation(target_bitstring="10", iterations=2, shots=1024)

        assert result["success"] is True
        assert result["over_rotation"] is True
        assert "over-rotation" in result["educational_notes"].lower()
        # Theoretical Sin^2(5*pi/6) = 0.25 (drops from 1.0 down to ~0.25)
        assert result["marked_state_probability"] < 0.35

    def test_grover_invalid_target_bitstrings(self):
        """Test validation on non-binary characters and invalid qubit lengths."""
        sim = GroverSimulator()
        res_invalid_char = sim.run_simulation(target_bitstring="12")
        assert res_invalid_char["success"] is False

        res_too_long = sim.run_simulation(target_bitstring="10101")  # 5 qubits > 4 limit
        assert res_too_long["success"] is False

        res_empty = sim.run_simulation(target_bitstring="")
        assert res_empty["success"] is False

    def test_grover_aes_security_margin_explanation(self):
        """Verify AES-128 vs AES-256 quadratic speedup data."""
        sim = GroverSimulator()
        result = sim.run_simulation(target_bitstring="101", iterations=1)
        aes_data = result["aes_security_margin"]

        assert aes_data["aes_128"]["classical_bits"] == 128
        assert aes_data["aes_128"]["quantum_bits"] == 64
        assert aes_data["aes_128"]["quantum_safe"] is False
        assert aes_data["aes_256"]["classical_bits"] == 256
        assert aes_data["aes_256"]["quantum_bits"] == 128
        assert aes_data["aes_256"]["quantum_safe"] is True
        assert "quadratic speedup" in aes_data["explanation"].lower()


# ==============================================================================
# 3. BBM92 QKD SIMULATOR TESTS
# ==============================================================================

class TestBBM92Simulator:
    """Test suite for BBM92 Entanglement-based QKD Simulator."""

    def test_bbm92_clean_channel_secure(self):
        """In absence of Eve, QBER is ~0 and status is COMPLETED_SECURE."""
        sim = BBM92Simulator(num_pairs=200, test_fraction=0.3, error_threshold=0.11, seed=42)
        res = sim.run_simulation(eve_present=False, noise_level=0.0)

        assert res["status"] == "COMPLETED_SECURE"
        assert res["qber"] == 0.0
        assert res["eve_detected"] is False
        assert len(res["final_key"]) > 0
        assert res["matching_bases_count"] > 0
        assert res["correlation_rate"] == 1.0

    def test_bbm92_eve_intercept_resend_aborted(self):
        """With Eve intercept-resend attack, QBER exceeds 0.11 and session aborts."""
        sim = BBM92Simulator(num_pairs=300, test_fraction=0.3, error_threshold=0.11, seed=123)
        res = sim.run_simulation(eve_present=True, noise_level=0.0)

        assert res["status"] == "COMPLETED_ABORTED"
        assert res["eve_detected"] is True
        # Theoretical QBER is 25%. In finite sample of ~45 bits, QBER > threshold
        assert res["qber"] >= res["threshold_qber"]
        assert len(res["final_key"]) == 0  # Sifted key discarded upon abort

    def test_bbm92_deterministic_seed_reproducibility(self):
        """Running with identical seeds must produce identical measurement records."""
        sim1 = BBM92Simulator(num_pairs=100, seed=999)
        res1 = sim1.run_simulation(eve_present=False)

        sim2 = BBM92Simulator(num_pairs=100, seed=999)
        res2 = sim2.run_simulation(eve_present=False)

        assert res1["qber"] == res2["qber"]
        assert res1["sifted_key_length"] == res2["sifted_key_length"]
        assert res1["final_key"] == res2["final_key"]

    def test_bbm92_insufficient_sample_size_guard(self):
        """Simulation with tiny pair count and huge test fraction must handle bounds safely."""
        sim = BBM92Simulator(num_pairs=10, test_fraction=0.5, seed=1)
        res = sim.run_simulation(eve_present=False)
        assert res["status"] in ["COMPLETED_SECURE", "COMPLETED_ABORTED"]


# ==============================================================================
# 4. REST API ENDPOINTS INTEGRATION TESTS
# ==============================================================================

class TestQuantumLabApi:
    """Test suite for FastAPI endpoints under /api/quantum/."""

    def test_api_shor_json_payload(self):
        """POST /api/quantum/shor with JSON body."""
        resp = client.post("/api/quantum/shor", json={"n": 15, "a": 7})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["factors"] == [3, 5]

    def test_api_shor_form_payload(self):
        """POST /api/quantum/shor with Form body (legacy backward compatibility)."""
        resp = client.post("/api/quantum/shor", data={"n": 15, "a": 7})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["factors"] == [3, 5]

    def test_api_shor_input_validation(self):
        """POST /api/quantum/shor with invalid N."""
        resp = client.post("/api/quantum/shor", json={"n": 12, "a": 5})  # Even number
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "even" in data["error"].lower()

    def test_api_grover_json_payload(self):
        """POST /api/quantum/grover with JSON body and iterations."""
        resp = client.post("/api/quantum/grover", json={"target": "101", "iterations": 2})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["marked_state"] == "101"
        assert data["num_qubits"] == 3
        assert data["marked_state_probability"] > 0.90

    def test_api_grover_form_payload(self):
        """POST /api/quantum/grover with Form body."""
        resp = client.post("/api/quantum/grover", data={"target": "11"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["marked_state"] == "11"

    def test_api_grover_input_validation(self):
        """POST /api/quantum/grover with invalid bitstring."""
        resp = client.post("/api/quantum/grover", json={"target": "10101"})  # 5 qubits > 4
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "Search space limit" in data["error"]

    def test_api_bbm92_run_json(self):
        """POST /api/quantum/bbm92/run with configuration."""
        resp = client.post(
            "/api/quantum/bbm92/run",
            json={
                "num_pairs": 150,
                "test_fraction": 0.25,
                "error_threshold": 0.11,
                "eve_present": False,
                "noise_level": 0.0,
                "seed": 42
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "COMPLETED_SECURE"
        assert data["qber"] == 0.0
        assert len(data["final_key"]) > 0

    def test_api_quantum_analysis_mock(self):
        """GET /api/quantum/analysis/{scan_id} returns risk analysis."""
        resp = client.get("/api/quantum/analysis/scan_batch6_test")
        assert resp.status_code == 200
        data = resp.json()
        assert data["scan_id"] == "scan_batch6_test"
        assert "risk_score" in data
        assert "threat_level" in data
        assert "recommendations" in data
