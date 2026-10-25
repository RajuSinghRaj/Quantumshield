"""
Circuit Utilities for Qiskit Engine Execution and Inspection.
Provides safe fallback execution if Qiskit is not available.
"""

import sys
import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

# NumPy 1.x compatibility shim for Qiskit 2.x (fixes copy=None ValueError in NumPy 1.26)
try:
    import numpy as np
    _orig_np_array = np.array
    def _patched_np_array(*args, **kwargs):
        if kwargs.get('copy') is None and 'copy' in kwargs:
            kwargs['copy'] = True
        return _orig_np_array(*args, **kwargs)
    np.array = _patched_np_array
except Exception as _patch_err:
    pass

# Check Qiskit & Qiskit Aer Availability
try:
    import qiskit
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    QISKIT_AVAILABLE = True
    QISKIT_VERSION = getattr(qiskit, "__version__", "2.x")
except ImportError as e:
    QISKIT_AVAILABLE = False
    QISKIT_VERSION = None
    logger.warning(f"Qiskit package not found or incomplete: {e}. Quantum Engine will run in simulation-disabled mode.")

def is_qiskit_available() -> bool:
    """Return True if Qiskit and Qiskit-Aer are properly installed."""
    return QISKIT_AVAILABLE

def get_circuit_ascii(qc: Any) -> str:
    """Safely convert a Qiskit QuantumCircuit to a formatted ASCII string."""
    if not QISKIT_AVAILABLE or qc is None:
        return "Qiskit not available."
    try:
        # Draw circuit as text
        drawing = qc.draw(output='text')
        if hasattr(drawing, 'single_string'):
            return drawing.single_string()
        return str(drawing)
    except Exception as err:
        logger.error(f"Error drawing circuit ASCII: {err}")
        return f"Circuit Diagram (qubits={getattr(qc, 'num_qubits', 'N/A')}, depth={getattr(qc, 'depth', lambda: 'N/A')()})"

import time

def get_circuit_stats(qc: Any) -> Dict[str, Any]:
    """Extract structural metrics from a QuantumCircuit."""
    if not QISKIT_AVAILABLE or qc is None:
        return {
            "qubits": 0,
            "circuit_depth": 0,
            "gate_count": 0,
            "gate_counts": {}
        }
    try:
        gate_counts = {}
        if hasattr(qc, 'count_ops'):
            gate_counts = dict(qc.count_ops())
        
        total_gates = sum(gate_counts.values()) if gate_counts else 0
            
        return {
            "qubits": qc.num_qubits,
            "circuit_depth": qc.depth(),
            "gate_count": total_gates,
            "gate_counts": gate_counts
        }
    except Exception as err:
        logger.error(f"Error fetching circuit stats: {err}")
        return {
            "qubits": 0,
            "circuit_depth": 0,
            "gate_count": 0,
            "gate_counts": {}
        }

def execute_simulation(qc: Any, shots: int = 1024) -> Tuple[Dict[str, int], Dict[str, float], float]:
    """
    Execute a QuantumCircuit on local AerSimulator.
    Returns (raw_counts, probabilities, execution_time_ms).
    """
    if not QISKIT_AVAILABLE:
        raise RuntimeError("Qiskit is unavailable. Cannot execute quantum simulation.")
    
    start_time = time.perf_counter()
    sim = AerSimulator()
    t_qc = transpile(qc, sim)
    job = sim.run(t_qc, shots=shots)
    result = job.result()
    counts = result.get_counts()
    end_time = time.perf_counter()
    
    execution_time_ms = round((end_time - start_time) * 1000, 2)
    
    # Calculate probabilities
    total_shots = sum(counts.values()) or shots
    probabilities = {state: round(cnt / total_shots, 4) for state, cnt in counts.items()}
    
    return counts, probabilities, execution_time_ms
