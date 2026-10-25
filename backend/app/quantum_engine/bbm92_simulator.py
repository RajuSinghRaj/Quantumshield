"""
BBM92 Quantum Key Distribution (QKD) Simulator using Qiskit.
Demonstrates entanglement-based QKD using Bell states (|Φ⁺⟩), independent basis reconciliation,
parameter estimation, QBER calculation, and Eve intercept-resend modeling.

Protocol Reference:
C. H. Bennett, G. Brassard, and N. D. Mermin, "Quantum cryptography without Bell's theorem,"
Phys. Rev. Lett. 68, 557 (1992).
"""

import math
import random
import time
import logging
from typing import Dict, Any, List, Optional, Tuple

from .circuit_utils import (
    is_qiskit_available,
    get_circuit_ascii,
    get_circuit_stats
)

logger = logging.getLogger(__name__)

if is_qiskit_available():
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
    from qiskit_aer import AerSimulator

# Quirk Reference URL for Bell State (|Φ⁺⟩) and Measurement Bases
QUIRK_REFERENCE_URL = (
    "https://algassert.com/quirk#circuit="
    "%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%5D%2C"
    "%5B%22%E2%80%A6%22%2C%22%E2%80%A6%22%5D%2C%5B%22Chance%22%2C%22Chance%22%5D%5D%7D"
)

def create_representative_circuit(scenario: str = "ideal", alice_basis: str = "Z", bob_basis: str = "Z") -> Any:
    """
    Construct a representative 2-qubit (or 3-qubit) Qiskit circuit for visualization and metrics.
    Bell state: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
    q0 = Alice, q1 = Bob
    """
    if not is_qiskit_available():
        return None

    if scenario == "eve":
        # Alice (q0), Bob (q1), Eve measure bit (c2), Alice measure (c0), Bob measure (c1)
        qr = QuantumRegister(2, name="q")
        cr_alice = ClassicalRegister(1, name="alice_meas")
        cr_bob = ClassicalRegister(1, name="bob_meas")
        cr_eve = ClassicalRegister(1, name="eve_meas")
        qc = QuantumCircuit(qr, cr_alice, cr_bob, cr_eve)

        # 1. EPR Source creates |Φ⁺⟩ Bell pair
        qc.h(qr[0])
        qc.cx(qr[0], qr[1])
        qc.barrier(label="Entanglement Dist.")

        # 2. Eve intercepts Bob's qubit (q1) in random basis (e.g. X)
        qc.h(qr[1])  # Eve measures in X
        qc.measure(qr[1], cr_eve[0])
        qc.h(qr[1])  # Eve prepares post-measurement X eigenstate to resend
        qc.barrier(label="Eve Intercept & Resend")

        # 3. Alice measurement
        if alice_basis == "X":
            qc.h(qr[0])
        qc.measure(qr[0], cr_alice[0])

        # 4. Bob measurement
        if bob_basis == "X":
            qc.h(qr[1])
        qc.measure(qr[1], cr_bob[0])

        return qc
    else:
        qr = QuantumRegister(2, name="q")
        cr_alice = ClassicalRegister(1, name="alice_meas")
        cr_bob = ClassicalRegister(1, name="bob_meas")
        qc = QuantumCircuit(qr, cr_alice, cr_bob)

        # 1. EPR Source creates |Φ⁺⟩ Bell pair
        qc.h(qr[0])
        qc.cx(qr[0], qr[1])
        qc.barrier(label="EPR Source |Φ⁺⟩")

        if scenario == "noisy":
            # Model channel noise on transmitted qubit q1
            qc.x(qr[1]) # Example bit-flip Pauli perturbation
            qc.z(qr[1]) # Example phase-flip Pauli perturbation
            qc.barrier(label="Channel Noise")
        else:
            qc.barrier(label="Quantum Channel")

        # 2. Alice measurement
        if alice_basis == "X":
            qc.h(qr[0])
        qc.measure(qr[0], cr_alice[0])

        # 3. Bob measurement
        if bob_basis == "X":
            qc.h(qr[1])
        qc.measure(qr[1], cr_bob[0])

        return qc


def run_bbm92_simulation(
    pair_count: int = 50,
    scenario: str = "ideal",
    noise_rate: float = 0.08,
    eve_intercept_prob: float = 1.0,
    test_fraction: float = 0.35,
    random_seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Execute a genuine BBM92 entanglement-based Quantum Key Distribution simulation.

    Parameters:
    - pair_count: Number of entangled Bell pairs to generate (sensible limit: 10 to 200).
    - scenario: 'ideal' | 'eve' | 'noisy'
    - noise_rate: Channel error probability for 'noisy' scenario (0.0 to 0.5).
    - eve_intercept_prob: Probability Eve intercepts a given transit qubit (0.0 to 1.0).
    - test_fraction: Fraction of matched-basis sifted pairs disclosed for parameter estimation (0.1 to 0.7).
    - random_seed: Optional seed for reproducible testing.

    Returns:
    Structured simulation dictionary containing pair counts, basis statistics,
    measurement counts, sifted key, parameter estimation, QBER, interpretation, and circuit diagram.
    """
    start_time = time.perf_counter()

    # Validate and clamp inputs
    pair_count = max(8, min(pair_count, 300))
    scenario = scenario.lower() if scenario in {"ideal", "eve", "noisy"} else "ideal"
    noise_rate = max(0.0, min(noise_rate, 0.5))
    eve_intercept_prob = max(0.0, min(eve_intercept_prob, 1.0))
    test_fraction = max(0.15, min(test_fraction, 0.70))

    if random_seed is not None:
        random.seed(random_seed)

    if not is_qiskit_available():
        return {
            "protocol": "BBM92 Quantum Key Distribution",
            "simulator": "Simulation Engine Unavailable",
            "scenario": scenario,
            "status": "UNAVAILABLE",
            "status_message": "Qiskit or Qiskit-Aer is not available in the current environment.",
            "pair_count": pair_count,
            "matched_bases_count": 0,
            "test_sample_size": 0,
            "candidate_key_length": 0,
            "measured_qber": 0.0,
            "simulation_available": False,
            "limitations": "Quantum engine is disabled. Install qiskit and qiskit-aer to run executable circuits."
        }

    try:
        sim = AerSimulator()

        # 1. Independent Random Basis Selection for Alice and Bob
        # Convention: 'Z' = Computational basis {|0⟩, |1⟩}, 'X' = Hadamard basis {|+⟩, |-⟩}
        alice_bases = [random.choice(['Z', 'X']) for _ in range(pair_count)]
        bob_bases = [random.choice(['Z', 'X']) for _ in range(pair_count)]

        # Eve interception decisions and bases (for Bob's transit qubit q1)
        eve_intercepts = []
        eve_bases = []
        if scenario == "eve":
            for _ in range(pair_count):
                intercept = (random.random() < eve_intercept_prob)
                eve_intercepts.append(intercept)
                eve_bases.append(random.choice(['Z', 'X']) if intercept else None)
        else:
            eve_intercepts = [False] * pair_count
            eve_bases = [None] * pair_count

        # Noise decisions per pair (for 'noisy' scenario)
        noise_applied = []
        if scenario == "noisy":
            noise_applied = [random.random() < noise_rate for _ in range(pair_count)]
        else:
            noise_applied = [False] * pair_count

        # 2. Build Executable Qiskit Circuits for each pair
        circuits = []
        for i in range(pair_count):
            ba = alice_bases[i]
            bb = bob_bases[i]
            be = eve_bases[i]
            has_noise = noise_applied[i]

            if scenario == "eve" and eve_intercepts[i]:
                # 3 classical registers: c0=Alice, c1=Bob, c2=Eve
                qc = QuantumCircuit(2, 3)
                # Prepare Bell state |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
                qc.h(0)
                qc.cx(0, 1)

                # Eve Intercepts q1 in basis be
                if be == 'X':
                    qc.h(1)
                qc.measure(1, 2) # Measure into Eve's register c2
                if be == 'X':
                    qc.h(1) # Re-prepare eigenstate |+⟩ or |-⟩ to forward to Bob

                # Alice measures q0 in basis ba
                if ba == 'X':
                    qc.h(0)
                qc.measure(0, 0)

                # Bob measures q1 in basis bb
                if bb == 'X':
                    qc.h(1)
                qc.measure(1, 1)

            else:
                # 2 classical registers: c0=Alice, c1=Bob
                qc = QuantumCircuit(2, 2)
                # Prepare Bell state |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
                qc.h(0)
                qc.cx(0, 1)

                if has_noise:
                    # Apply stochastic Pauli bit/phase perturbation to transit qubit
                    noise_type = random.choice(["bit_flip", "phase_flip", "depolarizing"])
                    if noise_type == "bit_flip":
                        qc.x(1)
                    elif noise_type == "phase_flip":
                        qc.z(1)
                    else:
                        qc.x(1)
                        qc.z(1)

                # Alice measures q0 in basis ba
                if ba == 'X':
                    qc.h(0)
                qc.measure(0, 0)

                # Bob measures q1 in basis bb
                if bb == 'X':
                    qc.h(1)
                qc.measure(1, 1)

            circuits.append(qc)

        # 3. Execute circuits in Qiskit Aer
        transpiled_circs = transpile(circuits, sim)
        job = sim.run(transpiled_circs, shots=1)
        sim_result = job.result()

        # 4. Extract Measurement Outcomes
        alice_bits: List[int] = []
        bob_bits: List[int] = []
        eve_bits: List[Optional[int]] = []

        for i in range(pair_count):
            counts = sim_result.get_counts(i)
            # In Qiskit, bitstring order is reverse: most-significant bit is highest index
            # If 3 bits: c2 c1 c0 -> string index 0 is c2 (Eve), index 1 is c1 (Bob), index 2 is c0 (Alice)
            # If 2 bits: c1 c0 -> string index 0 is c1 (Bob), index 1 is c0 (Alice)
            bitstring = list(counts.keys())[0].replace(" ", "")

            if scenario == "eve" and eve_intercepts[i]:
                eve_b = int(bitstring[0])
                bob_b = int(bitstring[1])
                alice_b = int(bitstring[2])
                eve_bits.append(eve_b)
            else:
                bob_b = int(bitstring[0])
                alice_b = int(bitstring[1])
                eve_bits.append(None)

            alice_bits.append(alice_b)
            bob_bits.append(bob_b)

        # 5. Basis Reconciliation & Sifting (Public Basis Comparison)
        matched_indices: List[int] = []
        unmatched_indices: List[int] = []
        basis_breakdown = {"ZZ": 0, "XX": 0, "ZX": 0, "XZ": 0}

        alice_z_count = alice_bases.count('Z')
        alice_x_count = alice_bases.count('X')
        bob_z_count = bob_bases.count('Z')
        bob_x_count = bob_bases.count('X')

        for i in range(pair_count):
            combo = f"{alice_bases[i]}{bob_bases[i]}"
            basis_breakdown[combo] = basis_breakdown.get(combo, 0) + 1
            if alice_bases[i] == bob_bases[i]:
                matched_indices.append(i)
            else:
                unmatched_indices.append(i)

        matched_count = len(matched_indices)
        matched_percentage = round((matched_count / pair_count) * 100, 1)

        # Matched measurement correlation breakdown (Alice Bit, Bob Bit)
        matched_outcomes_count = {"00": 0, "11": 0, "01": 0, "10": 0}
        for idx in matched_indices:
            key = f"{alice_bits[idx]}{bob_bits[idx]}"
            matched_outcomes_count[key] = matched_outcomes_count.get(key, 0) + 1

        # 6. Finite Sample Check
        if matched_count < 4:
            end_time = time.perf_counter()
            exec_time_ms = round((end_time - start_time) * 1000, 2)
            rep_circuit = create_representative_circuit(scenario, "Z", "Z")
            circuit_stats = get_circuit_stats(rep_circuit)
            circuit_ascii = get_circuit_ascii(rep_circuit)

            return {
                "protocol": "BBM92 Quantum Key Distribution",
                "simulator": "Qiskit AerSimulator (Aer 0.17.2, Qiskit 2.5.2)",
                "scenario": scenario,
                "status": "INSUFFICIENT_SAMPLE",
                "status_message": "Insufficient sample to assess the session reliably. Increase pair count (minimum 16 pairs recommended).",
                "pair_count": pair_count,
                "matched_bases_count": matched_count,
                "matched_bases_percentage": matched_percentage,
                "test_sample_size": 0,
                "candidate_key_length": 0,
                "measured_qber": 0.0,
                "expected_qber": 0.0,
                "threshold_qber": 0.11,
                "execution_time_ms": exec_time_ms,
                "circuit_metadata": {
                    **circuit_stats,
                    "circuit_ascii": circuit_ascii,
                    "bell_state": "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2",
                    "quirk_url": QUIRK_REFERENCE_URL
                },
                "explanation": "With fewer than 4 matched basis pairs, parameter estimation cannot distinguish physical quantum correlations from random noise.",
                "limitations": "Finite software simulation. A statistically significant sample (e.g. 50+ pairs) is required to estimate quantum bit error rate."
            }

        # 7. Parameter Estimation (Disclosed Test Subset)
        # Randomly select a test sample subset to disclose publicly and compute QBER
        shuffled_matched = list(matched_indices)
        random.shuffle(shuffled_matched)

        test_sample_size = max(2, int(matched_count * test_fraction))
        # Ensure at least 1 candidate key bit remains
        if test_sample_size >= matched_count:
            test_sample_size = matched_count - 1

        test_indices = shuffled_matched[:test_sample_size]
        key_indices = shuffled_matched[test_sample_size:]

        # Calculate errors in the disclosed test sample
        # For |Φ⁺⟩, Alice and Bob should measure identical bits (m_A == m_B) in both Z and X bases!
        test_errors = 0
        test_details = []
        for idx in test_indices:
            a_bit = alice_bits[idx]
            b_bit = bob_bits[idx]
            is_error = (a_bit != b_bit)
            if is_error:
                test_errors += 1
            test_details.append({
                "pair_index": idx,
                "basis": alice_bases[idx],
                "alice_bit": a_bit,
                "bob_bit": b_bit,
                "is_error": is_error
            })

        measured_qber = round(test_errors / test_sample_size, 4) if test_sample_size > 0 else 0.0

        # Detailed QBER Breakdown per Basis Pair (ZZ, XX, Total)
        zz_sifted = sum(1 for idx in matched_indices if alice_bases[idx] == 'Z')
        xx_sifted = sum(1 for idx in matched_indices if alice_bases[idx] == 'X')

        zz_test = [idx for idx in test_indices if alice_bases[idx] == 'Z']
        xx_test = [idx for idx in test_indices if alice_bases[idx] == 'X']

        zz_test_count = len(zz_test)
        xx_test_count = len(xx_test)

        zz_errors = sum(1 for idx in zz_test if alice_bits[idx] != bob_bits[idx])
        xx_errors = sum(1 for idx in xx_test if alice_bits[idx] != bob_bits[idx])

        zz_correct = zz_test_count - zz_errors
        xx_correct = xx_test_count - xx_errors

        zz_qber = round(zz_errors / zz_test_count, 4) if zz_test_count > 0 else None
        xx_qber = round(xx_errors / xx_test_count, 4) if xx_test_count > 0 else None

        qber_breakdown = {
            "ZZ": {
                "basis": "Z / Z",
                "sifted_rounds": zz_sifted,
                "test_bits": zz_test_count,
                "errors": zz_errors,
                "correct": zz_correct,
                "observed_qber": zz_qber
            },
            "XX": {
                "basis": "X / X",
                "sifted_rounds": xx_sifted,
                "test_bits": xx_test_count,
                "errors": xx_errors,
                "correct": xx_correct,
                "observed_qber": xx_qber
            },
            "total": {
                "basis": "TOTAL",
                "sifted_rounds": matched_count,
                "test_bits": test_sample_size,
                "errors": test_errors,
                "correct": test_sample_size - test_errors,
                "observed_qber": measured_qber
            }
        }

        # Detailed round-by-round stream data for animation and visual inspection
        rounds_data = []
        for i in range(pair_count):
            is_matched = (alice_bases[i] == bob_bases[i])
            is_in_test = (i in test_indices)
            is_in_key = (i in key_indices)
            err = (alice_bits[i] != bob_bits[i]) if is_matched else None
            rounds_data.append({
                "round": i + 1,
                "alice_basis": alice_bases[i],
                "bob_basis": bob_bases[i],
                "alice_bit": alice_bits[i],
                "bob_bit": bob_bits[i],
                "eve_intercept": eve_intercepts[i],
                "eve_basis": eve_bases[i],
                "eve_bit": eve_bits[i] if i < len(eve_bits) else None,
                "matched": is_matched,
                "in_test_sample": is_in_test,
                "in_candidate_key": is_in_key,
                "is_error": err
            })


        # Calculate expected theoretical QBER
        if scenario == "ideal":
            expected_qber = 0.0
        elif scenario == "eve":
            # Eve measuring in random conjugate basis introduces 25% error on matched bases
            expected_qber = round(0.25 * eve_intercept_prob, 4)
        else: # noisy
            expected_qber = round(noise_rate * 0.75, 4)

        # 8. Candidate Raw Key Generation (Remaining undisclosed sifted bits)
        candidate_key_alice = [alice_bits[idx] for idx in key_indices]
        candidate_key_bob = [bob_bits[idx] for idx in key_indices]
        candidate_key_length = len(candidate_key_alice)

        # Verify errors in candidate key (without logging full raw keys)
        candidate_key_errors = sum(1 for a, b in zip(candidate_key_alice, candidate_key_bob) if a != b)

        # Format masked sample (first 16 bits) for educational UI inspection
        key_display_slice = candidate_key_alice[:16]
        candidate_key_preview = "".join(str(b) for b in key_display_slice)
        if candidate_key_length > 16:
            candidate_key_preview += f"... (+{candidate_key_length - 16} bits)"

        # 9. Session Security Assessment & Interpretation
        # Shor-Preskill / BB84 bound: ~11% QBER threshold
        QBER_THRESHOLD = 0.11

        if measured_qber <= QBER_THRESHOLD:
            if scenario == "ideal" and measured_qber == 0.0:
                status = "COMPLETED_SECURE"
                status_message = "Simulation completed; zero test-sample errors observed."
                interpretation = (
                    "Zero quantum bit error rate detected in the disclosed test sample. "
                    "Alice and Bob's measurements exhibit ideal entanglement correlations across both Z and X bases. "
                    "In a production system, this session would proceed to classical error correction and privacy amplification."
                )
            else:
                status = "COMPLETED_SECURE"
                status_message = f"Simulation completed; estimated QBER ({measured_qber * 100:.1f}%) is below the ~11% abort threshold."
                interpretation = (
                    f"Measured QBER ({measured_qber * 100:.1f}%) is within tolerable bounds (< 11.0%). "
                    "Information-theoretic security allows extracting a secure key through error reconciliation (Cascade/LDPC) "
                    "and privacy amplification (universal hashing). However, finite sample fluctuations mean larger batches are required for production confidence."
                )
        else:
            status = "COMPLETED_ABORTED"
            status_message = f"Session aborted: estimated QBER ({measured_qber * 100:.1f}%) exceeds the ~11% security threshold."
            interpretation = (
                f"Severe error rate detected ({measured_qber * 100:.1f}% > 11.0% abort threshold). "
                + ("Eve's intercept-resend attack collapsed the entangled states, introducing unavoidable basis disturbances. " if scenario == "eve"
                   else "Physical channel decoherence/noise destroyed quantum state coherence. ")
                + "Alice and Bob must immediately abort the session and discard all candidate key bits."
            )

        # Representative circuit for visual inspection
        rep_circuit = create_representative_circuit(scenario, "Z", "Z")
        circuit_stats = get_circuit_stats(rep_circuit)
        circuit_ascii = get_circuit_ascii(rep_circuit)

        end_time = time.perf_counter()
        execution_time_ms = round((end_time - start_time) * 1000, 2)

        # 10. Educational Timeline Steps
        timeline_steps = [
            {
                "step": 1,
                "title": "Bell-State Entanglement Generation",
                "description": f"EPR source prepared {pair_count} entangled photon pairs in Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.",
                "metric": f"{pair_count} Pairs Created"
            },
            {
                "step": 2,
                "title": "Quantum Channel Distribution",
                "description": (
                    "Photons distributed to Alice and Bob over an ideal noiseless quantum channel." if scenario == "ideal"
                    else f"Eve intercepted Bob's photon with {eve_intercept_prob * 100:.0f}% probability, measured in a random basis, and forwarded the collapsed state." if scenario == "eve"
                    else f"Transit photons subjected to simulated channel noise (noise rate: {noise_rate * 100:.1f}%)."
                ),
                "metric": f"Scenario: {scenario.upper()}"
            },
            {
                "step": 3,
                "title": "Independent Quantum Measurements",
                "description": f"Alice and Bob randomly chose Z or X measurement bases. Alice: {alice_z_count} Z / {alice_x_count} X. Bob: {bob_z_count} Z / {bob_x_count} X.",
                "metric": f"{pair_count * 2} Measurements"
            },
            {
                "step": 4,
                "title": "Basis Reconciliation & Key Sifting",
                "description": f"Alice and Bob publicly announced their measurement bases. Discarded mismatched bases; kept {matched_count} matching pairs ({matched_percentage}% sifting efficiency).",
                "metric": f"{matched_count} Sifted Bits"
            },
            {
                "step": 5,
                "title": "Parameter Estimation (Test Subset)",
                "description": f"Disclosed {test_sample_size} test pairs ({test_fraction * 100:.0f}% sample). Found {test_errors} bit mismatches, resulting in an observed QBER of {measured_qber * 100:.1f}%.",
                "metric": f"QBER: {measured_qber * 100:.1f}%"
            },
            {
                "step": 6,
                "title": "Key Distillation & Security Verdict",
                "description": (
                    f"QBER is within the ~11% threshold. {candidate_key_length} candidate raw key bits remain for classical error correction and privacy amplification."
                    if measured_qber <= QBER_THRESHOLD
                    else f"QBER exceeds the ~11% security bound. Session aborted; all candidate key bits discarded to prevent Eve compromise."
                ),
                "metric": status
            }
        ]

        # Detailed limitations disclosure
        simulation_limitations = (
            "⚠ EDUCATIONAL SOFTWARE SIMULATION DISCLAIMERS:\n"
            "1. Not a physical quantum channel: This demonstration runs on local classical hardware simulating Qiskit quantum circuits.\n"
            "2. Finite-sample variance: In small batches, measured QBER fluctuates statistically around theoretical expectations.\n"
            "3. Low QBER alone does NOT guarantee security: Real QKD requires authenticated classical channels, error reconciliation (Cascade/LDPC), universal hash privacy amplification, and device calibration.\n"
            "4. QKD complements, but does NOT replace, post-quantum cryptography (NIST FIPS 203 ML-KEM / FIPS 204 ML-DSA) for large-scale digital signatures and internet security."
        )

        return {
            "protocol": "BBM92 Quantum Key Distribution",
            "simulator": "Qiskit AerSimulator (Aer 0.17.2, Qiskit 2.5.2)",
            "scenario": scenario,
            "status": status,
            "status_message": status_message,
            "pair_count": pair_count,
            "matched_bases_count": matched_count,
            "matched_bases_percentage": matched_percentage,
            "test_sample_size": test_sample_size,
            "test_sample_errors": test_errors,
            "measured_qber": measured_qber,
            "expected_qber": expected_qber,
            "threshold_qber": QBER_THRESHOLD,
            "candidate_key_length": candidate_key_length,
            "candidate_key_preview": candidate_key_preview,
            "candidate_key_errors": candidate_key_errors,
            "basis_statistics": {
                "alice_z_count": alice_z_count,
                "alice_x_count": alice_x_count,
                "bob_z_count": bob_z_count,
                "bob_x_count": bob_x_count,
                "basis_breakdown": basis_breakdown
            },
            "measurement_counts": {
                "matched_outcomes": matched_outcomes_count,
                "ideal_correlated": matched_outcomes_count["00"] + matched_outcomes_count["11"],
                "anti_correlated": matched_outcomes_count["01"] + matched_outcomes_count["10"]
            },
            "execution_time_ms": execution_time_ms,
            "circuit_metadata": {
                "qubits": circuit_stats["qubits"],
                "circuit_depth": circuit_stats["circuit_depth"],
                "gate_count": circuit_stats["gate_count"],
                "gate_counts": circuit_stats["gate_counts"],
                "circuit_ascii": circuit_ascii,
                "bell_state": "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2",
                "basis_conventions": {
                    "Z": "Computational basis {|0⟩, |1⟩} -> Bit 0, 1",
                    "X": "Hadamard basis {|+⟩, |-⟩} -> Bit 0, 1 (via H gate)"
                },
                "quirk_url": QUIRK_REFERENCE_URL
            },
            "timeline_steps": timeline_steps,
            "qber_breakdown": qber_breakdown,
            "rounds_data": rounds_data,
            "interpretation": interpretation,
            "limitations": simulation_limitations,
            "simulation_available": True
        }

    except Exception as err:
        logger.error(f"Failed to run BBM92 simulation: {err}", exc_info=True)
        return {
            "protocol": "BBM92 Quantum Key Distribution",
            "simulator": "Qiskit AerSimulator",
            "scenario": scenario,
            "status": "ERROR",
            "status_message": f"Simulation execution error: {str(err)}",
            "pair_count": pair_count,
            "matched_bases_count": 0,
            "test_sample_size": 0,
            "candidate_key_length": 0,
            "measured_qber": 0.0,
            "simulation_available": False,
            "limitations": f"Execution error: {str(err)}"
        }
