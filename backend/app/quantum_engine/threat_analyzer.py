"""
Threat Analyzer for QuantumShield Cryptographic Auditing.
Enriches detected assets with Classical Risk, Quantum Threat, and Quantum Simulation details.
"""

from typing import Dict, Any, List
from .quantum_risk import map_quantum_risk

def analyze_asset_security(asset: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate Classical Risk, Quantum Threat, Quantum Risk, and Simulation details for an asset."""
    algo = asset.get("algorithm", "").upper()
    variant = asset.get("variant", "").upper()
    key_size = asset.get("key_size", 0) or 0
    usage = asset.get("usage", "UNKNOWN")

    # Get Quantum Risk mapping
    q_map = map_quantum_risk(asset)

    # Classical Risk calculation
    classical_risk = "SAFE"
    if algo == "RSA" and key_size <= 1024:
        classical_risk = "CRITICAL"
    elif algo in {"MD5", "DES", "RC4"}:
        classical_risk = "CRITICAL"
    elif algo in {"SHA-1", "3DES"}:
        classical_risk = "HIGH"
    elif algo == "AES" and "ECB" in variant:
        classical_risk = "CRITICAL"
    elif algo in {"ML-KEM", "ML-DSA", "SLH-DSA"} or "KYBER" in algo or "DILITHIUM" in algo:
        classical_risk = "SAFE"

    # Define Simulation Offer payload if applicable
    simulation_offer = None
    if q_map["simulation_type"] == "shor":
        simulation_offer = {
            "type": "shor",
            "algorithm": algo,
            "target_number": 15,
            "label": f"Run Shor Demonstration ({variant})"
        }
    elif q_map["simulation_type"] == "grover":
        simulation_offer = {
            "type": "grover",
            "algorithm": algo,
            "target_state": "101",
            "label": f"Run Grover Demonstration ({variant})"
        }

    return {
        "classical_risk": classical_risk,
        "quantum_risk": q_map["quantum_risk"],
        "quantum_threat": q_map["quantum_threat"],
        "simulation_type": q_map["simulation_type"],
        "simulation_offer": simulation_offer,
        "quantum_security_bits": q_map["quantum_security_bits"],
        "severity": q_map["severity"],
        "explanation": q_map["explanation"],
        "why_problem": q_map["why_problem"],
        "recommendation": q_map["recommendation"],
        "pqc_alternative": q_map["pqc_alternative"]
    }

def analyze_all_findings(raw_assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enrich all detected assets with classical and quantum security analysis."""
    enriched_findings = []
    
    for asset in raw_assets:
        analysis = analyze_asset_security(asset)
        finding = {**asset, **analysis}
        
        # Build clean title
        finding["title"] = f"{finding.get('variant', 'Crypto Primitives')} — {finding.get('usage', 'General').replace('_', ' ').title()}"
        enriched_findings.append(finding)
        
    return enriched_findings
