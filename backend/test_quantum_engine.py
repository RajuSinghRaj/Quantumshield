"""
Test Suite for Backend Quantum Engine (Qiskit Integration)
"""
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend path is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.quantum_engine.circuit_utils import is_qiskit_available, get_circuit_stats
from app.quantum_engine.shor_simulator import run_shor_simulation
from app.quantum_engine.grover_simulator import run_grover_simulation
from app.quantum_engine.quantum_risk import map_quantum_risk

def test_quantum_engine():
    print("=== QUANTUM ENGINE VERIFICATION ===")
    print(f"Qiskit Available: {is_qiskit_available()}")

    # 1. Test Shor Simulator
    print("\n--- Testing Shor's Algorithm (N=15, a=7) ---")
    shor_res = run_shor_simulation(N=15, a=7, shots=1024)
    print(f"Algorithm: {shor_res['algorithm']}")
    print(f"Target: {shor_res['target_state']}")
    print(f"Qubits: {shor_res['qubits']}, Depth: {shor_res['circuit_depth']}")
    print(f"Factors Found: {shor_res['factors']}")
    print(f"Measurement Counts: {shor_res['measurement_results']}")
    assert shor_res["factors"] == [3, 5], "Shor factors failed!"
    assert shor_res["qubits"] == 8, "Shor circuit should be 8 qubits!"

    # 2. Test Grover Simulator
    print("\n--- Testing Grover's Search Algorithm (Target '101') ---")
    grover_res = run_grover_simulation(target_state="101", shots=1024)
    print(f"Algorithm: {grover_res['algorithm']}")
    print(f"Target State: {grover_res['target_state']}")
    print(f"Qubits: {grover_res['qubits']}, Depth: {grover_res['circuit_depth']}")
    print(f"Measurement Probabilities: {grover_res['probabilities']}")
    target_prob = grover_res['probabilities'].get('101', 0)
    print(f"Target '101' Probability: {target_prob * 100:.1f}%")
    assert target_prob > 0.8, "Grover target probability should be > 80%!"

    # 3. Test Quantum Risk Mapping
    print("\n--- Testing Quantum Risk Mapper ---")
    rsa_risk = map_quantum_risk({"algorithm": "RSA", "variant": "RSA-2048", "key_size": 2048, "usage": "KEY_EXCHANGE"})
    print("RSA-2048 Mapping:", rsa_risk["quantum_risk"], "| Threat:", rsa_risk["quantum_threat"])
    assert rsa_risk["quantum_risk"] == "VULNERABLE"
    assert rsa_risk["simulation_type"] == "shor"

    aes128_risk = map_quantum_risk({"algorithm": "AES", "variant": "AES-128-GCM", "key_size": 128, "usage": "ENCRYPTION"})
    print("AES-128 Mapping:", aes128_risk["quantum_risk"], "| Threat:", aes128_risk["quantum_threat"])
    assert aes128_risk["quantum_risk"] == "DEGRADED"
    assert aes128_risk["simulation_type"] == "grover"

    aes256_risk = map_quantum_risk({"algorithm": "AES", "variant": "AES-256-GCM", "key_size": 256, "usage": "ENCRYPTION"})
    print("AES-256 Mapping:", aes256_risk["quantum_risk"], "| Threat:", aes256_risk["quantum_threat"])
    assert aes256_risk["quantum_risk"] == "SAFE"

    pqc_risk = map_quantum_risk({"algorithm": "ML-KEM", "variant": "ML-KEM-768", "key_size": 768, "usage": "KEY_EXCHANGE"})
    print("ML-KEM-768 Mapping:", pqc_risk["quantum_risk"], "| Threat:", pqc_risk["quantum_threat"])
    assert pqc_risk["quantum_risk"] == "POST_QUANTUM"

    # 4. Test BBM92 Quantum Key Distribution
    print("\n--- Testing BBM92 Quantum Key Distribution ---")
    from app.quantum_engine.bbm92_simulator import run_bbm92_simulation
    bbm_ideal = run_bbm92_simulation(pair_count=60, scenario="ideal")
    print(f"BBM92 Ideal: Status={bbm_ideal['status']}, Matched={bbm_ideal['matched_bases_count']}, QBER={bbm_ideal['measured_qber']}")
    assert bbm_ideal["status"] == "COMPLETED_SECURE"
    assert bbm_ideal["measured_qber"] == 0.0

    bbm_eve = run_bbm92_simulation(pair_count=100, scenario="eve")
    print(f"BBM92 Eve: Status={bbm_eve['status']}, Matched={bbm_eve['matched_bases_count']}, QBER={bbm_eve['measured_qber']}")
    assert bbm_eve["status"] == "COMPLETED_ABORTED"
    assert bbm_eve["measured_qber"] > 0.11

    print("\n[SUCCESS] ALL QUANTUM ENGINE TESTS PASSED!")

if __name__ == "__main__":
    test_quantum_engine()
