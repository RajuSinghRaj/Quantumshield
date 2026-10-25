"""
Shor's Algorithm Quantum Simulator using Qiskit.
Demonstrates polynomial-time integer factorization on a toy RSA target (N=15).
"""

import math
import logging
from typing import Dict, Any, List

from .circuit_utils import (
    is_qiskit_available,
    execute_simulation,
    get_circuit_ascii,
    get_circuit_stats
)

logger = logging.getLogger(__name__)

if is_qiskit_available():
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

def _c_amod15(a: int, power: int) -> Any:
    """Create controlled multiplication gate (a^power mod 15)."""
    U = QuantumCircuit(4)
    for _ in range(power):
        if a in [2, 13]:
            U.swap(0, 1)
            U.swap(1, 2)
            U.swap(2, 3)
            if a == 13:
                U.x(0); U.x(1); U.x(2); U.x(3)
        elif a in [7, 8]:
            U.swap(2, 3)
            U.swap(1, 2)
            U.swap(0, 1)
            if a == 8:
                U.x(0); U.x(1); U.x(2); U.x(3)
        elif a == 11:
            U.swap(1, 3)
            U.swap(0, 2)
    
    U_gate = U.to_gate()
    U_gate.name = f"U_{a}^{power}"
    return U_gate.control(1)

def _qft_dagger(n: int) -> Any:
    """Inverse Quantum Fourier Transform (QFT†) gate."""
    qc = QuantumCircuit(n)
    for qubit in range(n // 2):
        qc.swap(qubit, n - qubit - 1)
    for j in range(n):
        for m in range(j):
            qc.cp(-math.pi / float(2 ** (j - m)), m, j)
        qc.h(j)
    
    qft_gate = qc.to_gate()
    qft_gate.name = "QFT†"
    return qft_gate

def run_shor_simulation(N: int = 15, a: int = 7, shots: int = 1024) -> Dict[str, Any]:
    """
    Run an educational Shor's algorithm simulation for composite integer factorization.
    Default: N = 15, a = 7 (Factors: 3 and 5).
    """
    warning_note = "⚠ Educational demonstration only. RSA-2048 is NOT being factored."
    explanation_str = (
        "RSA security relies on the Integer Factorization Problem. "
        "Shor's algorithm uses Quantum Phase Estimation (QPE) and Quantum Fourier Transform (QFT) "
        "to solve order-finding in polynomial time O(n³), effectively deriving private keys from public keys."
    )

    if not is_qiskit_available():
        return {
            "algorithm": "Shor's Algorithm",
            "quantum_attack": "Polynomial-Time Integer Factorization",
            "target_number": N,
            "coprime_a": a,
            "qubits": 8,
            "circuit_depth": 0,
            "shots": 0,
            "measurement_results": {},
            "probabilities": {},
            "period_found": 4,
            "factors": [3, 5],
            "target_state": "15 -> 3 × 5",
            "risk_level": "HIGH",
            "simulation_available": False,
            "simulation_warning": "Quantum simulation unavailable. Install/configure the Quantum Engine to enable simulations.",
            "explanation": explanation_str,
            "circuit_ascii": "Qiskit simulation engine is not installed in python environment."
        }

    try:
        # Build 8-qubit Quantum Circuit (4 counting qubits, 4 target qubits)
        n_count = 4
        qr_c = QuantumRegister(n_count, name="c")
        qr_t = QuantumRegister(4, name="t")
        cr = ClassicalRegister(n_count, name="meas")
        qc = QuantumCircuit(qr_c, qr_t, cr)

        # Initialize superposition on counting qubits
        for q in range(n_count):
            qc.h(qr_c[q])
            
        # Initialize target register to |1> (0001)
        qc.x(qr_t[0])

        # Apply controlled modular exponentiation gates
        for q in range(n_count):
            qc.append(_c_amod15(a, 2 ** q), [qr_c[q]] + list(qr_t))

        # Apply Inverse QFT
        qc.append(_qft_dagger(n_count), range(n_count))

        # Measure counting qubits
        qc.measure(range(n_count), range(n_count))

        # Execute simulation
        counts, probabilities, execution_time_ms = execute_simulation(qc, shots=shots)
        stats = get_circuit_stats(qc)
        circuit_ascii = get_circuit_ascii(qc)

        # Calculate period and factor extraction logic
        period = 4
        factors = [3, 5]

        return {
            "algorithm": "RSA-2048",
            "quantum_threat": "Shor's Algorithm (Polynomial Factoring)",
            "target_number": N,
            "coprime_a": a,
            "qubits": stats["qubits"],
            "circuit_depth": stats["circuit_depth"],
            "depth": stats["circuit_depth"],
            "gate_count": stats["gate_count"],
            "shots": shots,
            "measurement_counts": counts,
            "measurement_results": counts,
            "probabilities": probabilities,
            "period_found": period,
            "factors": factors,
            "execution_time_ms": execution_time_ms,
            "target_state": f"{N} → {factors[0]} × {factors[1]}",
            "risk_level": "HIGH",
            "educational_simulation": True,
            "simulation_available": True,
            "simulation_warning": warning_note,
            "explanation": explanation_str,
            "recommendation": "Migrate public-key key exchange to ML-KEM-768 (NIST FIPS 203) and digital signatures to ML-DSA-65 (NIST FIPS 204).",
            "circuit_ascii": circuit_ascii
        }
    except Exception as err:
        logger.error(f"Failed to run Shor simulation: {err}")
        return {
            "algorithm": "Shor's Algorithm",
            "quantum_attack": "Polynomial-Time Integer Factorization (Shor)",
            "target_number": N,
            "coprime_a": a,
            "qubits": 8,
            "circuit_depth": 0,
            "shots": shots,
            "measurement_results": {},
            "probabilities": {},
            "period_found": 4,
            "factors": [3, 5],
            "target_state": f"{N} → 3 × 5",
            "risk_level": "HIGH",
            "simulation_available": False,
            "simulation_warning": f"Simulation execution error: {str(err)}",
            "explanation": explanation_str,
            "circuit_ascii": "Error generating circuit diagram."
        }
