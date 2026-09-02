from typing import Dict, Any, List

def analyze_asset_security(asset: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate Classical Risk, Quantum Threat, and Quantum Risk for a detected asset."""
    algo = asset.get("algorithm", "").upper()
    variant = asset.get("variant", "").upper()
    key_size = asset.get("key_size", 0) or 0
    usage = asset.get("usage", "UNKNOWN")

    classical_risk = "SAFE"
    quantum_risk = "SAFE"
    quantum_threat = "None"
    severity = "LOW"
    
    explanation = ""
    why_problem = ""
    recommendation = ""
    pqc_alternative = None

    # 1. POST-QUANTUM ALGORITHMS (ML-KEM, ML-DSA, SLH-DSA)
    if algo in {"ML-KEM", "ML-DSA", "SLH-DSA"} or "KYBER" in algo or "DILITHIUM" in algo or "SPHINCS" in algo:
        classical_risk = "SAFE"
        quantum_risk = "POST_QUANTUM"
        quantum_threat = "None (Quantum Resistant)"
        severity = "INFO"
        explanation = f"{variant} is a standardized NIST Post-Quantum Cryptography algorithm designed to withstand attacks from both classical and fault-tolerant quantum computers."
        why_problem = f"{variant} relies on hard lattice-based or hash-based mathematical problems (e.g. Learning With Errors / Module-LWE) that remain computationally intractable for quantum computers."
        recommendation = "Maintain implementation and follow NIST FIPS updates."
        pqc_alternative = variant

    # 2. RSA ALGORITHM
    elif algo == "RSA":
        if key_size <= 1024:
            classical_risk = "CRITICAL"
            severity = "CRITICAL"
            explanation = f"RSA-{key_size} is classically broken due to small key length vulnerable to modern cluster factoring (GNFS)."
        elif key_size == 2048:
            classical_risk = "SAFE"
            severity = "HIGH"
            explanation = "RSA-2048 provides adequate classical security today (112-bit security level)."
        else:
            classical_risk = "SAFE"
            severity = "HIGH"
            explanation = f"RSA-{key_size} offers strong classical security."

        quantum_risk = "VULNERABLE"
        quantum_threat = "Shor's Algorithm (Polynomial Factoring)"
        why_problem = (
            "RSA security relies entirely on the integer factorization problem. "
            "Shor's algorithm executed on a fault-tolerant quantum computer factors large composite numbers in polynomial time O(n³), "
            "allowing an adversary to derive the private key from the public key."
        )
        
        if usage in {"KEY_EXCHANGE", "ENCRYPTION", "KEY_GEN"}:
            recommendation = "Migrate key establishment to ML-KEM-768 (NIST FIPS 203) or implement an ML-KEM + X25519 hybrid scheme."
            pqc_alternative = "ML-KEM-768 (FIPS 203)"
        elif usage in {"DIGITAL_SIGNATURE"}:
            recommendation = "Migrate digital signatures to ML-DSA-65 (NIST FIPS 204) or SLH-DSA-128f (NIST FIPS 205)."
            pqc_alternative = "ML-DSA-65 (FIPS 204)"
        else:
            recommendation = "Evaluate usage role: use ML-KEM for key exchange or ML-DSA for signatures."
            pqc_alternative = "ML-KEM-768 / ML-DSA-65"

    # 3. ECC / ECDSA / ECDH ALGORITHMS
    elif algo in {"ECDSA", "ECDH", "ECC", "ED25519", "ED448"}:
        classical_risk = "SAFE"
        quantum_risk = "VULNERABLE"
        quantum_threat = "Shor's Algorithm (Discrete Logarithm)"
        severity = "HIGH"
        explanation = f"{variant} offers strong, efficient classical security based on elliptic curve discrete logarithm hardness."
        why_problem = (
            "Elliptic Curve Cryptography relies on the Discrete Logarithm Problem on elliptic curves (ECDLP). "
            "Shor's quantum algorithm solves discrete logarithms in polynomial time, completely destroying ECC keys."
        )

        if usage in {"DIGITAL_SIGNATURE"}:
            recommendation = "Migrate digital signatures to ML-DSA-65 (FIPS 204) or SLH-DSA-128f (FIPS 205)."
            pqc_alternative = "ML-DSA-65 (FIPS 204)"
        elif usage in {"KEY_EXCHANGE", "KEY_GEN"}:
            recommendation = "Migrate key agreement to ML-KEM-768 (FIPS 203) or an ML-KEM + ECDH hybrid state."
            pqc_alternative = "ML-KEM-768 (FIPS 203)"
        else:
            recommendation = "Evaluate migration to ML-DSA for signatures or ML-KEM for key encapsulation."
            pqc_alternative = "ML-KEM-768 / ML-DSA-65"

    # 4. AES SYMMETRIC CIPHER
    elif algo == "AES":
        if "ECB" in variant:
            classical_risk = "CRITICAL"
            severity = "CRITICAL"
            explanation = "AES-ECB mode is insecure because identical plaintext blocks produce identical ciphertext blocks, leaking structural data."
            why_problem = "ECB mode fails block cipher security properties regardless of classical or quantum computing."
            recommendation = "Immediately switch to AES-256-GCM or AES-256-CBC with random IV."
            pqc_alternative = "AES-256-GCM"
        elif key_size <= 128:
            classical_risk = "SAFE"
            quantum_risk = "DEGRADED"
            quantum_threat = "Grover's Search Algorithm (Quadratic Speedup)"
            severity = "MEDIUM"
            explanation = "AES-128 provides 128-bit classical security."
            why_problem = (
                "Grover's algorithm speeds up unstructured quantum search from O(N) to O(√N). "
                "This halves the effective bit-security of AES-128 down to 64 bits, placing it near the threshold of quantum brute-force feasibility."
            )
            recommendation = "Upgrade key length from AES-128 to AES-256 to maintain 128-bit post-quantum security margin under Grover search."
            pqc_alternative = "AES-256-GCM"
        else:
            classical_risk = "SAFE"
            quantum_risk = "SAFE"
            quantum_threat = "Grover's Search (Mitigated by 256-bit key)"
            severity = "LOW"
            explanation = f"AES-{key_size} provides 256-bit classical security and 128-bit post-quantum security against Grover's algorithm."
            why_problem = "Grover's algorithm reduces 256-bit keys to 128-bit quantum security, which remains practically uncrackable."
            recommendation = "Keep AES-256 with authenticated encryption modes (GCM/CCM)."
            pqc_alternative = "AES-256-GCM"

    # 5. LEGACY / BROKEN ALGORITHMS (MD5, DES, 3DES, SHA-1)
    elif algo in {"MD5", "DES"}:
        classical_risk = "CRITICAL"
        quantum_risk = "VULNERABLE"
        quantum_threat = "Classically Broken + Quantum Search"
        severity = "CRITICAL"
        explanation = f"{algo} is classically broken due to trivial collisions (MD5) or small key space (DES 56-bit)."
        why_problem = f"{algo} is already completely insecure against classical computers."
        recommendation = "Immediately replace MD5/DES with SHA-256 or AES-256-GCM."
        pqc_alternative = "SHA-256 / AES-256-GCM"

    elif algo in {"SHA-1", "3DES"}:
        classical_risk = "HIGH"
        quantum_risk = "VULNERABLE"
        quantum_threat = "Classically Deprecated + Grover Search"
        severity = "HIGH"
        explanation = f"{algo} is deprecated by NIST due to collision attacks (SHA-1) or Sweet32 birthday attacks (3DES)."
        why_problem = f"{algo} suffers from classical cryptanalysis vulnerabilities exacerbated by quantum search."
        recommendation = "Replace SHA-1 with SHA-256/SHA-512, and 3DES with AES-256-GCM."
        pqc_alternative = "SHA-384 / AES-256-GCM"

    # 6. SECURE HASHING & PASSWORD DERIVATION
    elif algo in {"SHA-256", "SHA-384", "SHA-512", "PBKDF2", "BCRYPT", "ARGON2", "SCRYPT", "CHACHA20"}:
        classical_risk = "SAFE"
        quantum_risk = "SAFE"
        quantum_threat = "Grover's Search (Sufficient bit length)"
        severity = "LOW"
        explanation = f"{algo} provides robust classical and post-quantum security margin."
        why_problem = "Grover's algorithm reduces preimage/collision security by half, but 256-bit+ output lengths retain 128+ bits of quantum security."
        recommendation = "Maintain current implementation and secure key storage."
        pqc_alternative = algo

    else:
        classical_risk = "MEDIUM"
        quantum_risk = "DEGRADED"
        quantum_threat = "Potential Quantum Vulnerability"
        severity = "MEDIUM"
        explanation = f"Algorithm {algo} usage requires individual review."
        why_problem = "Cryptographic primitive should be verified against NIST PQC transition guidelines."
        recommendation = "Perform cryptographic audit to determine exact security parameters."
        pqc_alternative = "NIST PQC Suite"

    return {
        "classical_risk": classical_risk,
        "quantum_risk": quantum_risk,
        "quantum_threat": quantum_threat,
        "severity": severity,
        "explanation": explanation,
        "why_problem": why_problem,
        "recommendation": recommendation,
        "pqc_alternative": pqc_alternative
    }

def analyze_all_findings(raw_assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enrich all detected assets with classical and quantum security analysis."""
    enriched_findings = []
    
    for asset in raw_assets:
        analysis = analyze_asset_security(asset)
        finding = {**asset, **analysis}
        
        # Build clean title
        finding["title"] = f"{finding['variant']} — {finding['usage'].replace('_', ' ').title()}"
        enriched_findings.append(finding)
        
    return enriched_findings
