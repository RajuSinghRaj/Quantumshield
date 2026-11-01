"""
QuantumShield 2.0 - Unified Quantum Risk Intelligence Engine.
Correlates source code findings, CBOM components, cryptographic dependencies,
TLS handshakes, and certificate inventory into an explainable, deterministic risk model.
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import math
from .hndl_analyzer import analyze_hndl_profile, extract_key_exchange_context

# Transparent scoring weights (sum to 1.0)
RISK_WEIGHTS = {
    "quantum_exposure": 0.40,
    "classical_exposure": 0.30,
    "hndl_exposure": 0.20,
    "supply_chain_exposure": 0.10
}

def deduplicate_cryptographic_assets(
    findings: List[Dict[str, Any]],
    cbom: Optional[Dict[str, Any]] = None,
    dependencies: Optional[List[Dict[str, Any]]] = None,
    certificates: Optional[List[Dict[str, Any]]] = None,
    tls_data: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Correlate and deduplicate cryptographic assets across findings, CBOM, dependencies,
    TLS handshakes, and certificates to avoid double-counting the same underlying primitive.
    """
    unified_assets: List[Dict[str, Any]] = []
    seen_keys: Set[str] = set()

    # 1. Source Code Findings
    for f in (findings or []):
        algo = f.get("algorithm", "").upper()
        variant = f.get("variant", algo).upper()
        file_path = f.get("file_path", "")
        line_no = f.get("line_number", 0)
        usage = f.get("usage", "UNKNOWN").upper()
        
        # Primary deduplication key: file + line + primitive variant
        dedup_key = f"SRC:{file_path}:{line_no}:{variant}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        unified_assets.append({
            "asset_id": f"src_{len(unified_assets)+1}",
            "source_type": "SOURCE_CODE",
            "algorithm": algo,
            "variant": variant,
            "key_size": f.get("key_size", 0),
            "usage": usage,
            "file_path": file_path,
            "line_number": line_no,
            "library_or_api": f.get("library_or_api", "Standard API"),
            "detection_method": f.get("detection_method", "Static Analysis"),
            "curve_or_parameters": f.get("curve_or_parameters", ""),
            "confidence": f.get("confidence", 1.0),
            "classical_risk": f.get("classical_risk", "SAFE"),
            "quantum_risk": f.get("quantum_risk", "SAFE"),
            "quantum_threat": f.get("quantum_threat", "None"),
            "severity": f.get("severity", "LOW"),
            "explanation": f.get("explanation", ""),
            "pqc_alternative": f.get("pqc_alternative")
        })

    # 2. X.509 Certificates
    for cert in (certificates or []):
        fp = cert.get("fingerprint_sha256") or cert.get("serial_number") or ""
        algo = cert.get("public_key_algorithm", "").upper()
        key_size = cert.get("public_key_size", 0)
        curve = cert.get("elliptic_curve", "")
        variant = f"{algo}-{key_size}" if key_size else algo
        if curve:
            variant = f"{algo}-{curve}"

        subj = cert.get("subject")
        subj_str = subj if isinstance(subj, str) else (subj.get("common_name", "") if isinstance(subj, dict) else "")

        dedup_key = f"CERT:{fp}" if fp else f"CERT:{variant}:{subj_str}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        # Check for expired or expiring certificate
        validity = cert.get("validity_status", "VALID")
        c_risk = "CRITICAL" if validity == "EXPIRED" else ("HIGH" if validity == "EXPIRING_SOON" or key_size < 2048 else "SAFE")
        q_risk = cert.get("quantum_risk", "VULNERABLE")

        unified_assets.append({
            "asset_id": f"cert_{len(unified_assets)+1}",
            "source_type": "CERTIFICATE",
            "algorithm": algo,
            "variant": variant,
            "key_size": key_size,
            "usage": "DIGITAL_SIGNATURE",
            "file_path": cert.get("file_source", "Certificate Store"),
            "line_number": None,
            "library_or_api": "X.509 PKI",
            "detection_method": "X.509 Parser",
            "curve_or_parameters": curve or cert.get("signature_algorithm", ""),
            "confidence": 1.0,
            "classical_risk": c_risk,
            "quantum_risk": q_risk,
            "quantum_threat": "Shor's Algorithm (Signature Forgery)" if q_risk == "VULNERABLE" else "None",
            "severity": "CRITICAL" if c_risk == "CRITICAL" else ("HIGH" if q_risk == "VULNERABLE" else "LOW"),
            "explanation": f"X.509 Certificate ({subj_str or 'Unnamed'}) using {variant}.",
            "pqc_alternative": "ML-DSA-65 (FIPS 204) / SLH-DSA (FIPS 205)"
        })

    # 3. Live TLS Handshake
    if tls_data and isinstance(tls_data, dict):
        cipher = tls_data.get("cipher_suite") or ""
        proto = tls_data.get("protocol_version") or ""
        kx = tls_data.get("key_exchange") or ""
        kx_details = tls_data.get("key_exchange_details") or {}
        host = tls_data.get("host") or "unknown_host"
        is_hybrid = tls_data.get("is_hybrid_pqc", False)
        
        dedup_key = f"TLS:{host}:{cipher}"
        if dedup_key not in seen_keys:
            seen_keys.add(dedup_key)
            if isinstance(kx, dict):
                group = kx.get("group_or_curve") or kx.get("mechanism") or "Classical KEX"
            elif isinstance(kx, str) and kx:
                group = kx
            elif isinstance(kx_details, dict) and (kx_details.get("group_or_curve") or kx_details.get("mechanism")):
                group = kx_details.get("group_or_curve") or kx_details.get("mechanism") or "Classical KEX"
            else:
                group = "Classical KEX"
            
            c_risk = "CRITICAL" if proto in {"TLSv1.0", "TLSv1.1"} or "RC4" in cipher or "3DES" in cipher else "SAFE"
            q_risk = "POST_QUANTUM" if is_hybrid else ("VULNERABLE" if any(k in group.upper() or k in cipher.upper() for k in ["ECDH", "X25519", "RSA", "DH"]) else "SAFE")
            
            unified_assets.append({
                "asset_id": f"tls_{len(unified_assets)+1}",
                "source_type": "TLS_HANDSHAKE",
                "algorithm": group if group != "Classical KEX" else cipher,
                "variant": f"{proto} / {cipher}",
                "key_size": 256 if "256" in cipher else 128,
                "usage": "KEY_EXCHANGE",
                "file_path": f"https://{host}",
                "line_number": None,
                "library_or_api": "TLS Stack",
                "detection_method": "Live TLS Handshake Inspection",
                "curve_or_parameters": group,
                "confidence": 1.0,
                "classical_risk": c_risk,
                "quantum_risk": q_risk,
                "quantum_threat": "None (Hybrid PQC)" if is_hybrid else "Shor's Algorithm (HNDL Traffic Exposure)",
                "severity": "CRITICAL" if c_risk == "CRITICAL" else ("HIGH" if q_risk == "VULNERABLE" else "LOW"),
                "explanation": f"Live TLS connection to {host} negotiated {proto} with cipher {cipher}.",
                "pqc_alternative": "X25519 + ML-KEM-768 Hybrid Key Exchange"
            })

    return unified_assets

def calculate_unified_risk_intelligence(
    findings: List[Dict[str, Any]],
    cbom: Optional[Dict[str, Any]] = None,
    dependencies: Optional[List[Dict[str, Any]]] = None,
    certificates: Optional[List[Dict[str, Any]]] = None,
    tls_data: Optional[Dict[str, Any]] = None,
    user_hndl_assessments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Compute comprehensive Quantum Risk Intelligence metrics, transparent formula breakdown,
    and prioritized migration roadmap.
    """
    # 1. Correlate and deduplicate assets
    correlated_assets = deduplicate_cryptographic_assets(
        findings=findings,
        cbom=cbom,
        dependencies=dependencies,
        certificates=certificates,
        tls_data=tls_data
    )

    total_assets = len(correlated_assets)

    # 2. HNDL Risk Profile
    hndl_profile = analyze_hndl_profile(
        findings=findings,
        tls_data=tls_data,
        certificates=certificates,
        user_assessments=user_hndl_assessments
    )
    hndl_score = hndl_profile.get("overall_hndl_score", 0.0)

    # 3. Supply Chain Vulnerability
    dep_list = dependencies or []
    total_deps = len(dep_list)
    pqc_deps = sum(1 for d in dep_list if d.get("pqc_support") in {"SUPPORTED", "EXPERIMENTAL"})
    supply_chain_score = round(((total_deps - pqc_deps) / total_deps) * 100.0, 1) if total_deps > 0 else 0.0

    # 4. Transparent Classical Security Score & Deductions
    classical_score = 100.0
    classical_deductions = []
    classical_broken_count = 0
    classical_deprecated_count = 0

    # 5. Transparent Quantum Readiness Score & Deductions/Bonuses
    quantum_readiness = 100.0
    quantum_deductions = []
    pqc_bonuses = []
    
    shor_vulnerable_count = 0
    grover_degraded_count = 0
    pqc_standardized_count = 0
    unverified_pqc_count = 0

    for asset in correlated_assets:
        algo = asset["algorithm"].upper()
        variant = asset["variant"].upper()
        c_risk = asset["classical_risk"].upper()
        q_risk = asset["quantum_risk"].upper()
        key_size = asset.get("key_size", 0)

        # Classical Deductions
        if c_risk == "CRITICAL" or algo in {"MD5", "DES"} or "ECB" in variant:
            classical_broken_count += 1
            pts = 25.0
            classical_score -= pts
            classical_deductions.append({
                "asset": variant,
                "source": asset["file_path"],
                "reason": f"Classically broken cryptographic primitive: {variant}.",
                "deduction": pts
            })
        elif c_risk == "HIGH" or algo in {"SHA-1", "3DES"} or (algo == "RSA" and key_size and key_size < 2048):
            classical_deprecated_count += 1
            pts = 15.0
            classical_score -= pts
            classical_deductions.append({
                "asset": variant,
                "source": asset["file_path"],
                "reason": f"Classically deprecated cryptographic primitive: {variant}.",
                "deduction": pts
            })

        # Quantum Deductions & Bonuses
        if q_risk == "POST_QUANTUM":
            if any(k in algo for k in ["ML-KEM", "ML-DSA", "SLH-DSA"]):
                pqc_standardized_count += 1
                b_pts = 10.0
                pqc_bonuses.append({
                    "asset": variant,
                    "reason": f"Standardized NIST PQC primitive ({variant}).",
                    "bonus": b_pts
                })
            else:
                unverified_pqc_count += 1
                b_pts = 5.0
                pqc_bonuses.append({
                    "asset": variant,
                    "reason": f"Pre-standard or experimental post-quantum algorithm ({variant}).",
                    "bonus": b_pts
                })
        elif q_risk == "VULNERABLE":
            shor_vulnerable_count += 1
            pts = 20.0
            if "1024" in variant or "512" in variant:
                pts = 28.0
            quantum_readiness -= pts
            quantum_deductions.append({
                "asset": variant,
                "source": asset["file_path"],
                "threat": "Shor's Algorithm (Polynomial Factoring / Discrete Log)",
                "reason": f"{variant} is vulnerable to Shor's algorithm on a future fault-tolerant quantum computer.",
                "deduction": pts
            })
        elif q_risk == "DEGRADED":
            grover_degraded_count += 1
            pts = 10.0
            quantum_readiness -= pts
            quantum_deductions.append({
                "asset": variant,
                "source": asset["file_path"],
                "threat": "Grover's Search Algorithm (Key Security Halved)",
                "reason": f"{variant} effective key security margin is halved to ~64 bits under Grover's search.",
                "deduction": pts
            })

    # Bonus for hybrid TLS connection
    if tls_data and tls_data.get("is_hybrid_pqc"):
        pqc_bonuses.append({
            "asset": "TLS Hybrid KEX",
            "reason": "Live TLS connection utilizes verified post-quantum hybrid key exchange.",
            "bonus": 15.0
        })
        quantum_readiness += 15.0

    # Add bonuses to quantum readiness
    total_bonus = sum(b["bonus"] for b in pqc_bonuses)
    quantum_readiness += total_bonus

    # Clamp scores [0, 100]
    classical_security_score = max(0.0, min(100.0, round(classical_score, 1)))
    quantum_readiness_score = max(0.0, min(100.0, round(quantum_readiness, 1))) if total_assets > 0 else 100.0

    # Quantum Exposure (inverse of readiness)
    quantum_exposure_score = round(100.0 - quantum_readiness_score, 1)
    classical_exposure_score = round(100.0 - classical_security_score, 1)

    # Weighted Overall Security Risk Formula
    # Risk = 0.40 * QuantumExposure + 0.30 * ClassicalExposure + 0.20 * HNDLExposure + 0.10 * SupplyChainExposure
    overall_risk_score = round(
        (RISK_WEIGHTS["quantum_exposure"] * quantum_exposure_score) +
        (RISK_WEIGHTS["classical_exposure"] * classical_exposure_score) +
        (RISK_WEIGHTS["hndl_exposure"] * hndl_score) +
        (RISK_WEIGHTS["supply_chain_exposure"] * supply_chain_score),
        1
    )
    overall_risk_score = max(0.0, min(100.0, overall_risk_score))

    # Overall Risk Tier
    if classical_broken_count > 0 or overall_risk_score >= 65.0:
        overall_risk_level = "CRITICAL"
    elif shor_vulnerable_count >= 2 or overall_risk_score >= 45.0:
        overall_risk_level = "HIGH"
    elif shor_vulnerable_count == 1 or grover_degraded_count > 0 or overall_risk_score >= 20.0:
        overall_risk_level = "MEDIUM"
    else:
        overall_risk_level = "LOW"

    pqc_adoption_percentage = round(
        ((pqc_standardized_count + unverified_pqc_count) / total_assets) * 100.0, 1
    ) if total_assets > 0 else 0.0

    # 6. Prioritized Migration List
    migration_priorities = generate_prioritized_migration_list(correlated_assets, dependencies, hndl_profile)

    return {
        "overall_security_risk": {
            "score": overall_risk_score,
            "level": overall_risk_level,
            "formula": "0.40 * QuantumExposure + 0.30 * ClassicalExposure + 0.20 * HNDLExposure + 0.10 * SupplyChainExposure",
            "weights": RISK_WEIGHTS,
            "contributions": {
                "quantum_exposure_contribution": round(RISK_WEIGHTS["quantum_exposure"] * quantum_exposure_score, 1),
                "classical_exposure_contribution": round(RISK_WEIGHTS["classical_exposure"] * classical_exposure_score, 1),
                "hndl_exposure_contribution": round(RISK_WEIGHTS["hndl_exposure"] * hndl_score, 1),
                "supply_chain_exposure_contribution": round(RISK_WEIGHTS["supply_chain_exposure"] * supply_chain_score, 1)
            }
        },
        "scores": {
            "classical_security_score": classical_security_score,
            "quantum_readiness_score": quantum_readiness_score,
            "quantum_exposure_score": quantum_exposure_score,
            "classical_exposure_score": classical_exposure_score,
            "hndl_exposure_score": hndl_score,
            "supply_chain_risk_score": supply_chain_score,
            "pqc_adoption_percentage": pqc_adoption_percentage
        },
        "asset_metrics": {
            "total_cryptographic_assets": total_assets,
            "shor_vulnerable_assets": shor_vulnerable_count,
            "grover_degraded_assets": grover_degraded_count,
            "classical_broken_assets": classical_broken_count,
            "classical_deprecated_assets": classical_deprecated_count,
            "pqc_standardized_assets": pqc_standardized_count,
            "unverified_pqc_assets": unverified_pqc_count
        },
        "score_deductions_and_bonuses": {
            "classical_deductions": classical_deductions,
            "quantum_deductions": quantum_deductions,
            "pqc_bonuses": pqc_bonuses
        },
        "hndl_analysis": hndl_profile,
        "migration_priorities": migration_priorities,
        "correlated_assets": correlated_assets
    }

def generate_prioritized_migration_list(
    assets: List[Dict[str, Any]],
    dependencies: Optional[List[Dict[str, Any]]] = None,
    hndl_profile: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate an intelligent, multi-factor migration priority list.
    Ranks items based on active usage, HNDL exposure, classical brokenness, and affected blast radius.
    """
    prioritized: List[Dict[str, Any]] = []
    seen_primitives = set()

    for asset in assets:
        algo = asset["algorithm"].upper()
        variant = asset["variant"].upper()
        usage = asset["usage"].upper()
        c_risk = asset["classical_risk"].upper()
        q_risk = asset["quantum_risk"].upper()
        file_path = asset["file_path"]

        # Deduplication key for roadmap items
        road_key = f"{variant}:{usage}"
        if road_key in seen_primitives:
            # Update existing priority entry with additional affected file
            for p in prioritized:
                if p["primitive"] == variant and p["usage"] == usage:
                    if file_path not in p["affected_files"]:
                        p["affected_files"].append(file_path)
            continue
        seen_primitives.add(road_key)

        if q_risk == "POST_QUANTUM":
            continue # Already post-quantum

        # Determine Multi-factor Priority & Urgency
        priority = "LOW"
        urgency = "Normal Cycle"
        target_pqc = "N/A"
        rationale = ""

        # Factor 1: Classically Broken Primitives (Immediate emergency action)
        if c_risk == "CRITICAL" or algo in {"MD5", "DES"} or "ECB" in variant:
            priority = "CRITICAL"
            urgency = "Immediate Remediation"
            target_pqc = "AES-256-GCM / SHA-256"
            rationale = (
                f"{variant} is classically compromised today (collision attacks or structural plaintext leakage). "
                "Must be remediated immediately regardless of quantum considerations."
            )

        # Factor 2: Asymmetric Key Exchange (Harvest-Now-Decrypt-Later Threat)
        elif usage in {"KEY_EXCHANGE", "KEY_GEN"} or algo in {"ECDH", "X25519", "DH", "DIFFIE-HELLMAN"}:
            priority = "CRITICAL"
            urgency = "Phase 1 - Urgent (HNDL Defense)"
            target_pqc = "ML-KEM-768 (NIST FIPS 203) / X25519+ML-KEM Hybrid"
            rationale = (
                f"{variant} key establishment is vulnerable to Shor's algorithm. Encrypted network sessions can be "
                "intercepted today ('Harvest Now') and retroactively decrypted in the future ('Decrypt Later')."
            )

        # Factor 3: Asymmetric Encryption & RSA
        elif algo == "RSA":
            if asset.get("key_size", 2048) < 2048:
                priority = "CRITICAL"
                urgency = "Immediate Remediation"
                target_pqc = "ML-KEM-768 (FIPS 203) / ML-DSA-65 (FIPS 204)"
                rationale = f"RSA-{asset.get('key_size')} is weak both classically (< 2048 bits) and quantumly vulnerable to Shor's algorithm."
            elif usage in {"ENCRYPTION", "KEY_EXCHANGE"}:
                priority = "HIGH"
                urgency = "Phase 1 - High Priority"
                target_pqc = "ML-KEM-768 (NIST FIPS 203)"
                rationale = "RSA encryption is vulnerable to polynomial-time factoring under Shor's algorithm."
            else:
                priority = "HIGH"
                urgency = "Phase 2 - Signature Transition"
                target_pqc = "ML-DSA-65 (NIST FIPS 204) / SLH-DSA (NIST FIPS 205)"
                rationale = "RSA digital signatures require migration to lattice or hash-based post-quantum signature schemes."

        # Factor 4: Digital Signatures & Public-Key Auth
        elif usage in {"DIGITAL_SIGNATURE"} or algo in {"ECDSA", "ECC", "ED25519", "DSA"}:
            priority = "HIGH"
            urgency = "Phase 2 - Planned Transition"
            target_pqc = "ML-DSA-65 (NIST FIPS 204)"
            rationale = (
                f"{variant} signatures are vulnerable to forgery under Shor's algorithm. "
                "Transition authentication infrastructure to NIST FIPS 204."
            )

        # Factor 5: Symmetric key degradation (AES-128)
        elif algo == "AES" and (asset.get("key_size", 0) <= 128 or "128" in variant):
            priority = "MEDIUM"
            urgency = "Phase 3 - Configuration Update"
            target_pqc = "AES-256-GCM"
            rationale = (
                "AES-128 effective key security is reduced from 128 to ~64 bits under Grover's search algorithm. "
                "Double key length to AES-256 to restore a 128-bit quantum security margin."
            )

        # Factor 6: Deprecated Hashing
        elif algo in {"SHA-1", "3DES"}:
            priority = "HIGH"
            urgency = "Legacy Deprecation"
            target_pqc = "SHA-384 / AES-256-GCM"
            rationale = f"{variant} is deprecated by NIST and RFC standards due to classical weaknesses."

        if target_pqc != "N/A":
            # Match associated dependencies
            matched_deps = []
            for d in (dependencies or []):
                if d.get("direct_import"):
                    matched_deps.append(d.get("name"))

            prioritized.append({
                "primitive": variant,
                "algorithm": algo,
                "usage": usage.replace("_", " ").title(),
                "priority": priority,
                "urgency": urgency,
                "recommended_pqc": target_pqc,
                "rationale": rationale,
                "affected_files": [file_path],
                "associated_dependencies": matched_deps[:3]
            })

    # Sort by priority rank
    rank_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    prioritized.sort(key=lambda x: rank_order.get(x["priority"], 99))
    return prioritized
