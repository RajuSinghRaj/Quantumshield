from typing import List, Dict, Any

def generate_migration_roadmap(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build structured PQC Migration Plan matrix from detected findings."""
    migration_items = []
    seen = set()

    for f in findings:
        algo = f.get("algorithm", "").upper()
        variant = f.get("variant", algo)
        usage = f.get("usage", "UNKNOWN")
        q_risk = f.get("quantum_risk", "")
        c_risk = f.get("classical_risk", "")
        
        # Key for deduplicating roadmap recommendations
        key = f"{variant}:{usage}"
        if key in seen:
            continue
        seen.add(key)

        if q_risk == "POST_QUANTUM":
            continue # Already using PQC

        priority = "LOW"
        target_pqc = "N/A"
        strategy = ""
        action_steps = []

        if c_risk == "CRITICAL" or algo in {"MD5", "DES"}:
            priority = "CRITICAL"
            target_pqc = "SHA-256 / AES-256-GCM"
            strategy = "Immediate Remediation"
            action_steps = [
                f"Deprecate broken primitive {variant} immediately.",
                "Replace with AES-256-GCM for encryption or SHA-256/SHA-512 for hashing.",
                "Audit code for legacy dependencies."
            ]

        elif algo == "RSA":
            if usage in {"KEY_EXCHANGE", "ENCRYPTION", "KEY_GEN"}:
                priority = "HIGH"
                target_pqc = "ML-KEM-768 (FIPS 203)"
                strategy = "Hybrid Transition (ML-KEM + X25519)"
                action_steps = [
                    "Evaluate NIST FIPS 203 (ML-KEM-768) key encapsulation mechanism.",
                    "Deploy dual-hybrid TLS/key exchange combining X25519 with ML-KEM to preserve classical fallback while gaining quantum resilience.",
                    "Update crypto library to OpenSSL 3.4+ or liboqs wrappers."
                ]
            elif usage == "DIGITAL_SIGNATURE":
                priority = "HIGH"
                target_pqc = "ML-DSA-65 (FIPS 204) / SLH-DSA (FIPS 205)"
                strategy = "Dual Signatures or PQC Certificate Migration"
                action_steps = [
                    "Assess signature validation infrastructure for NIST FIPS 204 (ML-DSA-65) support.",
                    "Implement stateless hash-based SLH-DSA (FIPS 205) for long-lived root certificates.",
                    "Re-issue certificate chains with hybrid or PQC public keys."
                ]
            else:
                priority = "HIGH"
                target_pqc = "ML-KEM-768 / ML-DSA-65"
                strategy = "Cryptographic Inventory Assessment"
                action_steps = ["Determine exact usage context (encryption vs signature) and transition to corresponding PQC standard."]

        elif algo in {"ECDSA", "ECC", "ED25519"}:
            priority = "HIGH"
            target_pqc = "ML-DSA-65 (FIPS 204)"
            strategy = "Post-Quantum Signature Upgrade"
            action_steps = [
                "Transition Elliptic Curve signatures to ML-DSA-65 (FIPS 204).",
                "For resource-constrained devices, benchmark signature size overhead (ML-DSA signatures are ~2.4 KB vs ECDSA 64 bytes).",
                "Integrate post-quantum PKI roots."
            ]

        elif algo in {"ECDH", "X25519"}:
            priority = "HIGH"
            target_pqc = "ML-KEM-768 (FIPS 203)"
            strategy = "Hybrid Key Encapsulation (X25519 + ML-KEM-768)"
            action_steps = [
                "Upgrade ECDH key agreement to X25519+MLKEM768 hybrid draft standards (IETF).",
                "Benchmark TLS handshake latency impact."
            ]

        elif algo == "AES" and f.get("key_size", 256) == 128:
            priority = "MEDIUM"
            target_pqc = "AES-256-GCM"
            strategy = "Symmetric Key Size Expansion"
            action_steps = [
                "Upgrade key generation configuration from 128-bit to 256-bit AES.",
                "Ensure 256-bit symmetric key derivation to offset Grover's search quadratic reduction."
            ]

        elif algo in {"SHA-1", "3DES"}:
            priority = "HIGH"
            target_pqc = "SHA-384 / AES-256-GCM"
            strategy = "Legacy Deprecation"
            action_steps = [
                f"Replace deprecated primitive {variant}.",
                "Migrate SHA-1 to SHA-384 or SHA-512.",
                "Migrate 3DES to AES-256-GCM."
            ]

        if target_pqc != "N/A":
            migration_items.append({
                "current_algorithm": variant,
                "usage": usage.replace("_", " ").title(),
                "classical_risk": c_risk,
                "quantum_risk": q_risk,
                "priority": priority,
                "recommended_replacement": target_pqc,
                "strategy": strategy,
                "action_steps": action_steps
            })

    # Sort items by priority rank
    rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    migration_items.sort(key=lambda x: rank.get(x["priority"], 99))
    return migration_items
