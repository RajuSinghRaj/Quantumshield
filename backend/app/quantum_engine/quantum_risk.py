"""
Quantum Risk Mapping Layer for Cryptographic Assets.
Evaluates quantum vulnerabilities, threat vectors, security margins, and simulation applicability.
"""

from typing import Dict, Any

def map_quantum_risk(asset: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate Quantum Threat, Quantum Risk Level, and Simulation Applicability
    based on algorithm, variant, key size, and usage.
    """
    algo = asset.get("algorithm", "").upper()
    variant = asset.get("variant", "").upper()
    key_size = asset.get("key_size", 0) or 0
    usage = asset.get("usage", "UNKNOWN")

    quantum_risk = "SAFE"
    quantum_threat = "None"
    simulation_type = "none"
    quantum_security_bits = 128
    severity = "LOW"

    explanation = ""
    why_problem = ""
    recommendation = ""
    pqc_alternative = None

    # 1. NIST POST-QUANTUM STANDARDS (ML-KEM, ML-DSA, SLH-DSA)
    if algo in {"ML-KEM", "ML-DSA", "SLH-DSA"} or any(k in algo for k in ["KYBER", "DILITHIUM", "SPHINCS"]):
        quantum_risk = "POST_QUANTUM"
        quantum_threat = "None (Quantum Resistant)"
        simulation_type = "none"
        quantum_security_bits = 128 if "512" in variant else (192 if "768" in variant else 256)
        severity = "INFO"
        explanation = f"{variant} is a standardized NIST Post-Quantum Cryptography algorithm engineered to resist fault-tolerant quantum computers."
        why_problem = f"{variant} relies on hard lattice-based or hash-based math (Module-LWE/ML-DSA) that remains intractable for both classical and quantum computers."
        recommendation = "Maintain current implementation and monitor NIST FIPS updates."
        pqc_alternative = variant

    # 2. PUBLIC KEY / FACTORIZATION (RSA)
    elif algo == "RSA":
        quantum_risk = "VULNERABLE"
        quantum_threat = "Shor's Algorithm (Polynomial Factoring)"
        simulation_type = "shor"
        quantum_security_bits = 0
        severity = "HIGH" if key_size >= 2048 else "CRITICAL"
        explanation = f"RSA-{key_size} is completely vulnerable to quantum cryptanalysis via Shor's algorithm."
        why_problem = (
            "RSA security relies entirely on the integer factorization problem. "
            "Shor's algorithm executes integer factorization in polynomial time O(n³), "
            "allowing a fault-tolerant quantum computer to derive the private key directly from the public key."
        )
        if usage in {"KEY_EXCHANGE", "ENCRYPTION", "KEY_GEN"}:
            recommendation = "Migrate key establishment to ML-KEM-768 (NIST FIPS 203) or an ML-KEM + X25519 hybrid scheme."
            pqc_alternative = "ML-KEM-768 (FIPS 203)"
        elif usage in {"DIGITAL_SIGNATURE"}:
            recommendation = "Migrate digital signatures to ML-DSA-65 (NIST FIPS 204) or SLH-DSA-128f (NIST FIPS 205)."
            pqc_alternative = "ML-DSA-65 (FIPS 204)"
        else:
            recommendation = "Migrate to ML-KEM-768 for key encapsulation or ML-DSA-65 for signatures."
            pqc_alternative = "ML-KEM-768 / ML-DSA-65"

    # 3. PUBLIC KEY / DISCRETE LOGARITHM (ECC, ECDSA, ECDH, DH, DSA)
    elif algo in {"ECDSA", "ECDH", "ECC", "ED25519", "ED448", "DH", "DSA"}:
        quantum_risk = "VULNERABLE"
        quantum_threat = "Shor's Algorithm (Discrete Logarithm)"
        simulation_type = "shor"
        quantum_security_bits = 0
        severity = "HIGH"
        explanation = f"{variant} is vulnerable to Shor's quantum algorithm for discrete logarithm solving."
        why_problem = (
            "Elliptic curve and discrete logarithm schemes (ECDLP/DLP) are broken in polynomial time by Shor's algorithm. "
            "A quantum computer with a few thousand logical qubits can break ECC keys faster than RSA."
        )
        if usage in {"DIGITAL_SIGNATURE"}:
            recommendation = "Migrate digital signatures to ML-DSA-65 (NIST FIPS 204)."
            pqc_alternative = "ML-DSA-65 (FIPS 204)"
        else:
            recommendation = "Migrate key exchange to ML-KEM-768 (NIST FIPS 203)."
            pqc_alternative = "ML-KEM-768 (FIPS 203)"

    # 4. SYMMETRIC ENCRYPTION (AES)
    elif algo == "AES":
        simulation_type = "grover"
        if "ECB" in variant:
            quantum_risk = "VULNERABLE"
            quantum_threat = "ECB Pattern Leakage + Grover Search"
            quantum_security_bits = 0
            severity = "CRITICAL"
            explanation = "AES-ECB mode is insecure regardless of classical or quantum computing because it leaks structural patterns."
            why_problem = "Identical plaintext blocks produce identical ciphertext blocks."
            recommendation = "Immediately upgrade to AES-256-GCM."
            pqc_alternative = "AES-256-GCM"
        elif key_size <= 128:
            quantum_risk = "DEGRADED"
            quantum_threat = "Grover's Search Algorithm (Quadratic Speedup)"
            quantum_security_bits = 64
            severity = "MEDIUM"
            explanation = "AES-128 key security is reduced by half under Grover's quantum search down to 64 bits of effective security."
            why_problem = "Grover's algorithm speeds up unstructured key search from O(N) to O(√N), halving effective key length."
            recommendation = "Upgrade key size to AES-256 to maintain a 128-bit quantum security margin."
            pqc_alternative = "AES-256-GCM"
        else:
            quantum_risk = "SAFE"
            quantum_threat = "Grover's Search (Mitigated by 256-bit Key)"
            quantum_security_bits = 128
            severity = "LOW"
            explanation = f"AES-{key_size} retains a strong 128-bit quantum security margin against Grover search."
            why_problem = "Grover reduces 256-bit keys to 128 bits of quantum security, which remains computationally infeasible to crack."
            recommendation = "Maintain AES-256 with authenticated encryption (GCM/CCM)."
            pqc_alternative = "AES-256-GCM"

    # 5. LEGACY / BROKEN PRIMITIVES (MD5, DES, 3DES, SHA-1)
    elif algo in {"MD5", "DES"}:
        quantum_risk = "VULNERABLE"
        quantum_threat = "Classically Broken + Grover Search"
        simulation_type = "grover"
        quantum_security_bits = 0
        severity = "CRITICAL"
        explanation = f"{algo} is classically broken and completely insecure."
        why_problem = f"{algo} suffers from classical key/collision failure aggravated by Grover's search."
        recommendation = "Replace with SHA-256 or AES-256-GCM immediately."
        pqc_alternative = "SHA-256 / AES-256-GCM"

    elif algo in {"SHA-1", "3DES"}:
        quantum_risk = "VULNERABLE"
        quantum_threat = "Classically Deprecated + Grover Search"
        simulation_type = "grover"
        quantum_security_bits = 32
        severity = "HIGH"
        explanation = f"{algo} is deprecated classically and vulnerable to quantum search."
        why_problem = f"{algo} output size and key space offer insufficient post-quantum protection."
        recommendation = "Replace SHA-1 with SHA-256/SHA-512, and 3DES with AES-256-GCM."
        pqc_alternative = "SHA-384 / AES-256-GCM"

    # 6. HASHING & KDF PRIMITIVES (SHA-256, SHA-512, ARGON2, CHACHA20)
    elif algo in {"SHA-256", "SHA-384", "SHA-512", "SHA-3", "PBKDF2", "BCRYPT", "ARGON2", "SCRYPT", "CHACHA20"}:
        quantum_risk = "SAFE"
        quantum_threat = "Grover Preimage Search (Sufficient bit length)"
        simulation_type = "grover"
        quantum_security_bits = 128
        severity = "LOW"
        explanation = f"{algo} provides strong classical and post-quantum collision/preimage resistance."
        why_problem = "Grover reduces preimage hardness from 256 bits to 128 bits, which remains secure."
        recommendation = "Maintain implementation."
        pqc_alternative = algo

    else:
        quantum_risk = "DEGRADED"
        quantum_threat = "Potential Quantum Search Vulnerability"
        simulation_type = "none"
        quantum_security_bits = 64
        severity = "MEDIUM"
        explanation = f"Algorithm {algo} should be audited for quantum readiness."
        why_problem = "Cryptographic primitive should be verified against NIST PQC migration guidelines."
        recommendation = "Audit cryptographic usage for post-quantum safety."
        pqc_alternative = "NIST PQC Suite"

    return {
        "quantum_risk": quantum_risk,
        "quantum_threat": quantum_threat,
        "simulation_type": simulation_type,
        "quantum_security_bits": quantum_security_bits,
        "severity": severity,
        "explanation": explanation,
        "why_problem": why_problem,
        "recommendation": recommendation,
        "pqc_alternative": pqc_alternative
    }
