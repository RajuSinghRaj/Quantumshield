from typing import List, Dict, Any, Tuple

def calculate_quantum_scores(findings: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Calculate transparent, explainable scores:
    - Classical Security Score (0-100)
    - Quantum Readiness Score (0-100)
    - PQC Adoption % (0-100)
    - Overall Risk (CRITICAL, HIGH, MEDIUM, LOW)
    """
    if not findings:
        scores = {
            "classical_score": 100.0,
            "quantum_score": 100.0,
            "pqc_score": 0.0,
            "overall_risk": "LOW"
        }
        breakdown = {
            "base_quantum_score": 100,
            "base_classical_score": 100,
            "deductions": [],
            "bonuses": [],
            "total_assets": 0,
            "pqc_assets_count": 0,
            "shor_vulnerable_count": 0,
            "grover_degraded_count": 0
        }
        return scores, breakdown

    quantum_score = 100.0
    classical_score = 100.0
    
    deductions = []
    bonuses = []
    
    pqc_count = 0
    shor_count = 0
    grover_count = 0
    classical_broken_count = 0

    for f in findings:
        algo = f.get("algorithm", "").upper()
        q_risk = f.get("quantum_risk", "")
        c_risk = f.get("classical_risk", "")
        severity = f.get("severity", "")
        variant = f.get("variant", algo)

        # 1. Post-Quantum Bonus
        if q_risk == "POST_QUANTUM":
            pqc_count += 1
            bonus_pts = 10.0
            bonuses.append({
                "reason": f"Post-Quantum Asset Detected: {variant}",
                "points": bonus_pts
            })
            quantum_score += bonus_pts

        # 2. Shor's Algorithm Penalty (RSA, ECC, ECDSA, ECDH)
        elif q_risk == "VULNERABLE" and f.get("quantum_threat", "").startswith("Shor"):
            shor_count += 1
            penalty = 22.0
            if "1024" in variant or "512" in variant:
                penalty = 30.0
            deductions.append({
                "type": "QUANTUM",
                "asset": variant,
                "file": f.get("file_path"),
                "line": f.get("line_number"),
                "threat": "Shor's Algorithm (Public Key Collapse)",
                "penalty": penalty,
                "reason": f"{variant} relies on factorization/discrete log threatened by Shor's quantum algorithm."
            })
            quantum_score -= penalty

        # 3. Grover's Search Degradation (AES-128)
        elif q_risk == "DEGRADED":
            grover_count += 1
            penalty = 10.0
            deductions.append({
                "type": "QUANTUM",
                "asset": variant,
                "file": f.get("file_path"),
                "line": f.get("line_number"),
                "threat": "Grover Search (Bit Security Halved)",
                "penalty": penalty,
                "reason": f"{variant} effective key size reduced to ~64 bits under Grover's search."
            })
            quantum_score -= penalty

        # 4. Classical Vulnerability Deductions
        if c_risk == "CRITICAL":
            classical_broken_count += 1
            penalty = 25.0
            deductions.append({
                "type": "CLASSICAL",
                "asset": variant,
                "file": f.get("file_path"),
                "line": f.get("line_number"),
                "threat": "Classically Insecure Primitives",
                "penalty": penalty,
                "reason": f"{variant} is classically broken or insecure."
            })
            classical_score -= penalty
            quantum_score -= 15.0 # Also penalize quantum score for broken algorithms
        elif c_risk == "HIGH":
            penalty = 15.0
            deductions.append({
                "type": "CLASSICAL",
                "asset": variant,
                "file": f.get("file_path"),
                "line": f.get("line_number"),
                "threat": "Deprecated Primitive",
                "penalty": penalty,
                "reason": f"{variant} is classically deprecated by security standards."
            })
            classical_score -= penalty

    # Clamp scores between 0 and 100
    quantum_score = max(0.0, min(100.0, round(quantum_score, 1)))
    classical_score = max(0.0, min(100.0, round(classical_score, 1)))
    
    total_assets = len(findings)
    pqc_score = round((pqc_count / total_assets) * 100.0, 1) if total_assets > 0 else 0.0

    # Determine Overall Risk Level
    if classical_broken_count > 0 or quantum_score < 40 or classical_score < 40:
        overall_risk = "CRITICAL"
    elif shor_count >= 2 or quantum_score < 65 or classical_score < 70:
        overall_risk = "HIGH"
    elif shor_count == 1 or grover_count > 0 or quantum_score < 85:
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    scores = {
        "classical_score": classical_score,
        "quantum_score": quantum_score,
        "pqc_score": pqc_score,
        "overall_risk": overall_risk
    }

    breakdown = {
        "quantum_readiness_score": quantum_score,
        "classical_security_score": classical_score,
        "pqc_adoption_percentage": pqc_score,
        "overall_risk": overall_risk,
        "total_assets": total_assets,
        "pqc_assets_count": pqc_count,
        "shor_vulnerable_count": shor_count,
        "grover_degraded_count": grover_count,
        "classical_broken_count": classical_broken_count,
        "deductions": deductions,
        "bonuses": bonuses
    }

    return scores, breakdown
