"""
Schemas for Quantum Engine Requests and Responses.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ShorSimulationRequest(BaseModel):
    algorithm: Optional[str] = "RSA-2048"
    target_number: Optional[int] = 15
    coprime_a: Optional[int] = 7
    shots: Optional[int] = 1024

class GroverSimulationRequest(BaseModel):
    algorithm: Optional[str] = "AES-256"
    target_state: Optional[str] = "101"
    shots: Optional[int] = 1024

class GenericQuantumRunRequest(BaseModel):
    simulation_type: str = Field(..., description="'shor' or 'grover'")
    algorithm: Optional[str] = "RSA-2048"
    target_number: Optional[int] = 15
    coprime_a: Optional[int] = 7
    target_state: Optional[str] = "101"
    shots: Optional[int] = 1024

class ShorSimulationResponse(BaseModel):
    algorithm: str
    quantum_threat: str
    simulation_target: int
    coprime_a: int
    qubits: int
    depth: int
    gate_count: int
    shots: int
    measurement_counts: Dict[str, int]
    probabilities: Dict[str, float]
    period_found: Optional[int]
    factors: List[int]
    execution_time_ms: float
    circuit_ascii: str
    educational_simulation: bool = True
    explanation: str
    recommendation: str

class GroverSimulationResponse(BaseModel):
    algorithm: str
    quantum_threat: str
    search_space_size: int
    target_state: str
    qubits: int
    depth: int
    gate_count: int
    iterations: int
    shots: int
    measurement_counts: Dict[str, int]
    probabilities: Dict[str, float]
    target_probability: float
    iteration_probabilities: List[Dict[str, Any]]
    execution_time_ms: float
    circuit_ascii: str
    educational_simulation: bool = True
    explanation: str
    recommendation: str

class BBM92SimulationRequest(BaseModel):
    pair_count: Optional[int] = Field(50, description="Number of entangled Bell pairs (8 to 300)")
    scenario: Optional[str] = Field("ideal", description="'ideal' | 'eve' | 'noisy'")
    noise_rate: Optional[float] = Field(0.08, description="Channel noise rate (0.0 to 0.5)")
    eve_intercept_prob: Optional[float] = Field(1.0, description="Eve interception probability (0.0 to 1.0)")
    test_fraction: Optional[float] = Field(0.35, description="Fraction of sifted bits used for parameter estimation (0.15 to 0.7)")

class BBM92SimulationResponse(BaseModel):
    protocol: str = "BBM92 Quantum Key Distribution"
    simulator: str
    scenario: str
    status: str
    status_message: str
    pair_count: int
    matched_bases_count: int
    matched_bases_percentage: float
    test_sample_size: int
    test_sample_errors: Optional[int] = 0
    measured_qber: float
    expected_qber: Optional[float] = 0.0
    threshold_qber: Optional[float] = 0.11
    candidate_key_length: int
    candidate_key_preview: Optional[str] = None
    candidate_key_errors: Optional[int] = 0
    basis_statistics: Optional[Dict[str, Any]] = None
    measurement_counts: Optional[Dict[str, Any]] = None
    execution_time_ms: Optional[float] = 0.0
    circuit_metadata: Optional[Dict[str, Any]] = None
    timeline_steps: Optional[List[Dict[str, Any]]] = None
    interpretation: Optional[str] = None
    limitations: Optional[str] = None
    simulation_available: bool = True

