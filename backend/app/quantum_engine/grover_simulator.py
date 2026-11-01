"""
Grover's Search Algorithm Quantum Simulator using Qiskit.
Demonstrates amplitude amplification, oracle phase inversion, diffusion operator,
and quadratic speedup for unstructured database / symmetric key search.

Protocol Reference:
Lov K. Grover, "A fast quantum mechanical algorithm for database search,"
Proceedings of the 28th Annual ACM Symposium on Theory of Computing (1996).
"""

import math
import time
import logging
from typing import Dict, Any, List, Optional

from .circuit_utils import (
    is_qiskit_available,
    execute_simulation,
    get_circuit_ascii,
    get_circuit_stats
)

logger = logging.getLogger(__name__)

if is_qiskit_available():
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister


def run_grover_simulation(
    target_state: str = "101",
    iterations: Optional[int] = None,
    shots: int = 1024,
    target_bitstring: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run an educational Grover's algorithm search simulation.

    Supports:
    - 2 qubits: 4 states ("00" to "11", optimal iterations = 1)
    - 3 qubits: 8 states ("000" to "111", optimal iterations = 2)
    - 4 qubits: 16 states ("0000" to "1111", optimal iterations = 3)

    Parameters:
    - target_state: Bitstring identifying the marked item (e.g. "101", "110", "10", "1101").
    - iterations: Number of Grover steps to apply (default: optimal floor(pi/4 * sqrt(N))).
    - shots: Measurement shots on AerSimulator (100 to 8192).
    """
    start_time = time.perf_counter()

    # Determine input string
    raw_str = target_bitstring if target_bitstring is not None else target_state
    raw_str = str(raw_str).strip() if raw_str is not None else ""

    # Strict input validation
    if not raw_str:
        return {
            "success": False,
            "error": "Target marked state cannot be empty. Specify a bitstring between 2 and 4 bits (e.g. '101').",
            "algorithm": "Grover's Algorithm",
            "marked_state": "",
            "target_state": ""
        }

    if any(c not in '01' for c in raw_str):
        return {
            "success": False,
            "error": f"Invalid character in target state '{raw_str}'. Only binary characters '0' and '1' are permitted.",
            "algorithm": "Grover's Algorithm",
            "marked_state": raw_str,
            "target_state": raw_str
        }

    if len(raw_str) < 2 or len(raw_str) > 4:
        return {
            "success": False,
            "error": f"Search space limit: Target '{raw_str}' has {len(raw_str)} qubits. Educational simulator supports 2 to 4 qubits (4 to 16 states).",
            "algorithm": "Grover's Algorithm",
            "marked_state": raw_str,
            "target_state": raw_str
        }

    target_state = raw_str

    num_qubits = len(target_state)
    search_space_size = 2 ** num_qubits
    shots = max(100, min(shots, 8192))

    # Calculate optimal iteration count: k_opt = floor((pi / 4) * sqrt(N))
    optimal_iterations = max(1, int((math.pi / 4.0) * math.sqrt(search_space_size)))
    applied_iterations = iterations if iterations is not None and 1 <= iterations <= 6 else optimal_iterations

    # Theoretical probability progression per iteration (showing amplitude amplification & over-rotation)
    theta = math.asin(1.0 / math.sqrt(search_space_size))
    initial_probability = round(1.0 / search_space_size, 4)
    iteration_progression = []
    for k in range(0, max(applied_iterations + 2, 4)):
        prob_k = round((math.sin((2 * k + 1) * theta)) ** 2, 4)
        iteration_progression.append({
            "iteration": k,
            "marked_probability": prob_k,
            "non_marked_probability": round((1.0 - prob_k) / max(1, search_space_size - 1), 4),
            "is_applied": (k == applied_iterations),
            "is_optimal": (k == optimal_iterations)
        })

    warning_note = "⚠ Educational demonstration only. Full 128-bit or 256-bit AES key spaces are NOT being evaluated."
    explanation_str = (
        "Grover's algorithm provides a quadratic speedup O(√N) for unstructured database search and brute-force key inversion. "
        "Unlike classical brute-force which requires O(N) trials (~N/2 average evaluations), "
        "Grover amplifies the probability amplitude of the marked state using repeated oracle phase inversions and diffusion operations. "
        "Importantly, Grover provides a QUADRATIC speedup, not an EXPONENTIAL speedup. "
        "Consequently, AES-128's quantum security margin is halved to 64 bits (vulnerable/degraded), "
        "while AES-256 retains a 128-bit quantum security margin (computationally intractable and secure against CRQCs)."
    )

    complexity_comparison = {
        "classical_complexity": "O(N) — Classical brute force requires ~N/2 evaluations",
        "quantum_complexity": "O(√N) — Grover search requires ~ (π/4)√N iterations (Quadratic Speedup)",
        "aes128_classical": "2^128 operations",
        "aes128_quantum": "2^64 operations (Vulnerable / Degraded key margin)",
        "aes256_classical": "2^256 operations",
        "aes256_quantum": "2^128 operations (Strong Quantum Security Margin)",
        "des_quantum": "2^28 operations (Completely broken in seconds)",
        "speedup_nature": "Quadratic, NOT Exponential (Shor is exponential, Grover is quadratic)",
        "explanation": "Grover provides quadratic speedup, reducing effective symmetric key bit-security by 50%.",
        "aes_128": {
            "classical_bits": 128,
            "quantum_bits": 64,
            "quantum_safe": False,
            "operations_classical": "2^128",
            "operations_quantum": "2^64"
        },
        "aes_256": {
            "classical_bits": 256,
            "quantum_bits": 128,
            "quantum_safe": True,
            "operations_classical": "2^256",
            "operations_quantum": "2^128"
        }
    }

    if not is_qiskit_available():
        end_time = time.perf_counter()
        return {
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "quantum_threat": "Grover's Quadratic Search",
            "target_state": target_state,
            "search_space_size": search_space_size,
            "qubits": num_qubits,
            "circuit_depth": 0,
            "depth": 0,
            "gate_count": 0,
            "iterations": applied_iterations,
            "optimal_iterations": optimal_iterations,
            "shots": shots,
            "measurement_counts": {},
            "measurement_results": {},
            "probabilities": {target_state: iteration_progression[applied_iterations]["marked_probability"]},
            "target_probability": iteration_progression[applied_iterations]["marked_probability"],
            "initial_probability": initial_probability,
            "iteration_probabilities": iteration_progression,
            "execution_time_ms": round((end_time - start_time) * 1000, 2),
            "risk_level": "MODERATE",
            "simulation_available": False,
            "simulation_warning": "Qiskit simulation engine is not installed in the python environment.",
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "recommendation": "Use AES-256-GCM to maintain at least 128 bits of security against Grover's algorithm.",
            "circuit_ascii": "Qiskit simulation engine is not installed in python environment."
        }

    try:
        qr = QuantumRegister(num_qubits, name="q")
        cr = ClassicalRegister(num_qubits, name="meas")
        qc = QuantumCircuit(qr, cr)

        # 1. State Initialization: Equal superposition |s⟩ = H^⊗n |0⟩
        for q in range(num_qubits):
            qc.h(qr[q])

        # Generalized Multi-Controlled Z Oracle for target state
        def apply_oracle(circuit: Any):
            # In Qiskit, bit 0 is the least-significant bit (rightmost character in target_state)
            reversed_target = list(reversed(target_state))
            # Phase inversion: flip zeros so target matches all-1s
            for idx, bit in enumerate(reversed_target):
                if bit == '0':
                    circuit.x(qr[idx])

            # Apply multi-controlled Z gate
            target_q = num_qubits - 1
            ctrl_qubits = list(range(num_qubits - 1))
            circuit.h(qr[target_q])
            if len(ctrl_qubits) == 1:
                circuit.cx(qr[ctrl_qubits[0]], qr[target_q])
            elif len(ctrl_qubits) == 2:
                circuit.ccx(qr[ctrl_qubits[0]], qr[ctrl_qubits[1]], qr[target_q])
            else:
                circuit.mcx([qr[c] for c in ctrl_qubits], qr[target_q])
            circuit.h(qr[target_q])

            # Restore flips
            for idx, bit in enumerate(reversed_target):
                if bit == '0':
                    circuit.x(qr[idx])

        # Generalized Diffuser (Inversion about average: 2|s⟩⟨s| - I)
        def apply_diffuser(circuit: Any):
            for q in range(num_qubits):
                circuit.h(qr[q])
                circuit.x(qr[q])

            target_q = num_qubits - 1
            ctrl_qubits = list(range(num_qubits - 1))
            circuit.h(qr[target_q])
            if len(ctrl_qubits) == 1:
                circuit.cx(qr[ctrl_qubits[0]], qr[target_q])
            elif len(ctrl_qubits) == 2:
                circuit.ccx(qr[ctrl_qubits[0]], qr[ctrl_qubits[1]], qr[target_q])
            else:
                circuit.mcx([qr[c] for c in ctrl_qubits], qr[target_q])
            circuit.h(qr[target_q])

            for q in range(num_qubits):
                circuit.x(qr[q])
                circuit.h(qr[q])

        # Apply Grover iterations
        for _ in range(applied_iterations):
            apply_oracle(qc)
            apply_diffuser(qc)

        # Measure search register
        qc.measure(qr, cr)

        # Execute simulation
        counts, probabilities, execution_time_ms = execute_simulation(qc, shots=shots)
        stats = get_circuit_stats(qc)
        circuit_ascii = get_circuit_ascii(qc)

        target_prob = probabilities.get(target_state, 0.0)

        # Over-rotation notice if applied iterations exceeded optimal
        over_rotation_warning = None
        if applied_iterations > optimal_iterations:
            over_rotation_warning = (
                f"Notice: Applied {applied_iterations} iterations, exceeding the optimal {optimal_iterations}. "
                "Probability of marked state decreased due to quantum phase over-rotation!"
            )

        return {
            "success": True,
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "quantum_threat": "Grover's Quadratic Search",
            "target_state": target_state,
            "marked_state": target_state,
            "measured_target": target_state,
            "search_space_size": search_space_size,
            "num_qubits": stats["qubits"],
            "qubits": stats["qubits"],
            "circuit_depth": stats["circuit_depth"],
            "depth": stats["circuit_depth"],
            "gate_count": stats["gate_count"],
            "iterations": applied_iterations,
            "optimal_iterations": optimal_iterations,
            "shots": shots,
            "measurement_counts": counts,
            "measurement_results": counts,
            "probabilities": probabilities,
            "target_probability": target_prob,
            "marked_state_probability": target_prob,
            "initial_probability": initial_probability,
            "iteration_probabilities": iteration_progression,
            "progression": iteration_progression,
            "over_rotation": (applied_iterations > optimal_iterations),
            "educational_notes": over_rotation_warning or (
                f"Search space N={search_space_size} ({stats['qubits']} qubits). "
                f"Optimal iterations k_opt = floor(pi/4 * sqrt({search_space_size})) = {optimal_iterations}. "
                f"Marked state '{target_state}' amplified to {target_prob * 100:.1f}% probability."
            ),
            "execution_time_ms": execution_time_ms,
            "risk_level": "MODERATE",
            "educational_simulation": True,
            "simulation_available": True,
            "simulation_warning": over_rotation_warning or warning_note,
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "aes_security_margin": complexity_comparison,
            "recommendation": "Retain AES-256-GCM. AES-256 maintains 128 bits of post-quantum security against Grover search.",
            "circuit_ascii": circuit_ascii
        }

    except Exception as err:
        logger.error(f"Failed to run Grover simulation: {err}", exc_info=True)
        return {
            "success": False,
            "error": str(err),
            "algorithm": "Grover's Algorithm",
            "quantum_attack": "Quadratic Unstructured Search (Grover)",
            "quantum_threat": "Grover's Quadratic Search",
            "target_state": target_state,
            "marked_state": target_state,
            "measured_target": target_state,
            "search_space_size": search_space_size,
            "num_qubits": num_qubits,
            "qubits": num_qubits,
            "circuit_depth": 0,
            "depth": 0,
            "gate_count": 0,
            "iterations": applied_iterations,
            "optimal_iterations": optimal_iterations,
            "shots": shots,
            "measurement_counts": {},
            "measurement_results": {},
            "probabilities": {},
            "target_probability": 0.0,
            "marked_state_probability": 0.0,
            "initial_probability": initial_probability,
            "iteration_probabilities": iteration_progression,
            "progression": iteration_progression,
            "over_rotation": False,
            "educational_notes": f"Simulation execution error: {str(err)}",
            "execution_time_ms": 0.0,
            "risk_level": "MODERATE",
            "simulation_available": False,
            "simulation_warning": f"Simulation execution error: {str(err)}",
            "explanation": explanation_str,
            "complexity_comparison": complexity_comparison,
            "aes_security_margin": complexity_comparison,
            "circuit_ascii": "Error generating circuit diagram."
        }


class GroverSimulator:
    """Object-oriented interface for educational Grover's algorithm simulator."""

    def __init__(self, shots: int = 1024):
        self.default_shots = shots

    def run_simulation(
        self,
        target_bitstring: str = "101",
        iterations: Optional[int] = None,
        shots: Optional[int] = None,
        target_state: Optional[str] = None
    ) -> Dict[str, Any]:
        target = target_state or target_bitstring
        return run_grover_simulation(
            target_state=target,
            iterations=iterations,
            shots=shots or self.default_shots
        )
