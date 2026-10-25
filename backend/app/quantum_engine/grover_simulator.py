"""
Grover's Search Algorithm Quantum Simulator using Qiskit.
Demonstrates quadratic speedup for symmetric key space search on a toy state space (N=8).
"""

import logging
from typing import Dict, Any

from .circuit_utils import (
    is_qiskit_available,
    execute_simulation,
    get_circuit_ascii,
    get_circuit_stats
)

logger = logging.getLogger(__name__)

if is_qiskit_available():
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

def run_grover_simulation(target_state: str = "101", shots: int = 1024) -> Dict[str, Any]:
    """
    Run an educational Grover's algorithm search simulation.
    Default: target_state = "101" over 3 qubits (8 search states).
    """
    if len(target_state) != 3 or any(c not in '01' for c in target_state):
        target_state = "101"

    warning_note = "⚠ Educational demonstration only. Full AES cipher key space is NOT being evaluated."
    explanation_str = (
        "Grover's algorithm provides a quadratic speedup O(√N) for unstructured search. "
        "AES-256 retains a 128-bit quantum security margin (sufficient against Grover), "
        "whereas AES-128 key security drops to 64 bits, requiring upgrade to AES-256."
    )

    complexity_comparison = {
        "classical_complexity": "O(N) — Brute force requires ~N/2 evaluations",
        "quantum_complexity": "O(√N) — Grover search requires ~ (π/4)√N iterations",
        "aes128_classical": "2^128 operations",
        "aes128_quantum": "2^64 operations (Vulnerable / Degraded)",
        "aes256_classical": "2^256 operations",
        "aes256_quantum": "2^128 operations (Strong Security Margin)"
    }

    if not is_qiskit_available():
        return {
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "target_state": target_state,
            "search_space_size": 8,
            "qubits": 3,
            "circuit_depth": 0,
            "shots": 0,
            "measurement_results": {},
            "probabilities": {target_state: 0.95, "000": 0.01, "001": 0.01, "010": 0.01, "011": 0.01, "100": 0.01, "110": 0.01, "111": 0.01},
            "risk_level": "MODERATE",
            "simulation_available": False,
            "simulation_warning": "Quantum simulation unavailable. Install/configure the Quantum Engine to enable simulations.",
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "circuit_ascii": "Qiskit simulation engine is not installed in python environment."
        }

    try:
        num_qubits = 3
        qr = QuantumRegister(num_qubits, name="q")
        cr = ClassicalRegister(num_qubits, name="c")
        qc = QuantumCircuit(qr, cr)

        # 1. Equal superposition initialization
        for q in range(num_qubits):
            qc.h(qr[q])

        # Helper Oracle for 3 qubits
        def apply_oracle(circuit: Any):
            # Flip zeros so target bitstring matches 111
            for idx, bit in enumerate(reversed(target_state)):
                if bit == '0':
                    circuit.x(qr[idx])
            # Controlled-Z via H - CCX - H
            circuit.h(qr[2])
            circuit.ccx(qr[0], qr[1], qr[2])
            circuit.h(qr[2])
            # Restore flips
            for idx, bit in enumerate(reversed(target_state)):
                if bit == '0':
                    circuit.x(qr[idx])

        # Helper Diffuser (Inversion about mean)
        def apply_diffuser(circuit: Any):
            for q in range(num_qubits):
                circuit.h(qr[q])
                circuit.x(qr[q])
            circuit.h(qr[2])
            circuit.ccx(qr[0], qr[1], qr[2])
            circuit.h(qr[2])
            for q in range(num_qubits):
                circuit.x(qr[q])
                circuit.h(qr[q])

        # Apply 2 Grover iterations for optimal probability peak on 3 qubits
        for _ in range(2):
            apply_oracle(qc)
            apply_diffuser(qc)

        # Measure search qubits
        qc.measure(qr, cr)

        # Run simulation
        counts, probabilities, execution_time_ms = execute_simulation(qc, shots=shots)
        stats = get_circuit_stats(qc)
        circuit_ascii = get_circuit_ascii(qc)

        return {
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "target_state": target_state,
            "search_space_size": 8,
            "qubits": stats["qubits"],
            "circuit_depth": stats["circuit_depth"],
            "shots": shots,
            "measurement_results": counts,
            "probabilities": probabilities,
            "execution_time_ms": execution_time_ms,
            "risk_level": "MODERATE",
            "simulation_available": True,
            "simulation_warning": warning_note,
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "circuit_ascii": circuit_ascii
        }

    except Exception as err:
        logger.error(f"Failed to run Grover simulation: {err}")
        return {
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "target_state": target_state,
            "search_space_size": 8,
            "qubits": 3,
            "circuit_depth": 0,
            "shots": shots,
            "measurement_results": {},
            "probabilities": {},
            "risk_level": "MODERATE",
            "simulation_available": False,
            "simulation_warning": f"Simulation execution error: {str(err)}",
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "circuit_ascii": "Error generating circuit diagram."
        }
