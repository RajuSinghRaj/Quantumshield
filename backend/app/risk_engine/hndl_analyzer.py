"""
QuantumShield 2.0 - Harvest-Now-Decrypt-Later (HNDL) Risk Analyzer.
Evaluates long-term confidentiality exposure from traffic harvesting and retroactive quantum decryption.
"""

from typing import List, Dict, Any, Optional
import uuid

# Sensitivity Levels
SENSITIVITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]

# Confidentiality Lifetimes
CONFIDENTIALITY_LIFETIMES = ["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "INDEFINITE", "UNKNOWN"]

# Standard Reference Presets for Interactive Exploration
HNDL_PRESETS = [
    {
        "category": "Financial & Payment Records",
        "sensitivity": "HIGH",
        "lifetime": "LONG_TERM",
        "description": "Credit card data, banking transactions, PCI-DSS regulated payment logs, and audit trails."
    },
    {
        "category": "Healthcare & Patient Records",
        "sensitivity": "CRITICAL",
        "lifetime": "INDEFINITE",
        "description": "HIPAA-regulated electronic health records (EHR), genomic data, and lifelong patient histories."
    },
    {
        "category": "Government, Defense & Legal Records",
        "sensitivity": "CRITICAL",
        "lifetime": "INDEFINITE",
        "description": "Classified national security telemetry, intelligence communications, and perpetual attorney-client privilege files."
    },
    {
        "category": "Long-lived Business Secrets & IP",
        "sensitivity": "HIGH",
        "lifetime": "LONG_TERM",
        "description": "Proprietary trade secrets, source code, patent disclosures, and M&A negotiation transcripts."
    },
    {
        "category": "Short-lived Session Data",
        "sensitivity": "LOW",
        "lifetime": "SHORT_TERM",
        "description": "Transient web session cookies, temporary OAuth state tokens, and ephemeral operational telemetry."
    }
]

def extract_key_exchange_context(
    findings: List[Dict[str, Any]],
    tls_data: Optional[Dict[str, Any]] = None,
    certificates: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Extract key establishment primitives and evidence from source findings, TLS, and certificates.
    Distinguishes classical vulnerable key exchange from verified hybrid/PQC key encapsulation.
    """
    classical_kems = []
    pqc_kems = []
    hybrid_kems = []
    
    # 1. Inspect TLS negotiated connection
    if tls_data and isinstance(tls_data, dict):
        kx = tls_data.get("key_exchange") or ""
        kx_details = tls_data.get("key_exchange_details") or {}
        cipher = tls_data.get("cipher_suite") or ""
        if isinstance(kx, dict):
            group = kx.get("group_or_curve") or kx.get("mechanism") or ""
        elif isinstance(kx, str) and kx:
            group = kx
        elif isinstance(kx_details, dict):
            group = kx_details.get("group_or_curve") or kx_details.get("mechanism") or ""
        else:
            group = ""
        is_hybrid = tls_data.get("is_hybrid_pqc", False)
        
        entry = {
            "source": "Live TLS Handshake",
            "host": tls_data.get("host", "unknown"),
            "mechanism": group or cipher,
            "cipher_suite": cipher,
            "is_hybrid": is_hybrid
        }
        if is_hybrid or "KYBER" in group.upper() or "MLKEM" in group.upper():
            hybrid_kems.append(entry)
        elif any(c in group.upper() or c in cipher.upper() for c in ["ECDH", "X25519", "RSA", "DHE", "DH", "SECP"]):
            classical_kems.append(entry)

    # 2. Inspect Source Code findings
    for f in (findings or []):
        algo = f.get("algorithm", "").upper()
        usage = f.get("usage", "").upper()
        variant = f.get("variant", algo)
        
        if usage in {"KEY_EXCHANGE", "ENCRYPTION", "KEY_GEN"} or algo in {"ECDH", "X25519", "DH", "DIFFIE-HELLMAN", "ML-KEM"}:
            entry = {
                "source": "Source Code",
                "file_path": f.get("file_path", "unknown"),
                "line_number": f.get("line_number"),
                "mechanism": variant,
                "algorithm": algo
            }
            if algo in {"ML-KEM"} or "KYBER" in variant:
                pqc_kems.append(entry)
            elif algo in {"ECDH", "X25519", "DH", "DIFFIE-HELLMAN", "RSA"}:
                classical_kems.append(entry)

    has_pqc_protection = len(pqc_kems) > 0 or len(hybrid_kems) > 0
    has_classical_exposure = len(classical_kems) > 0

    return {
        "classical_key_exchanges": classical_kems,
        "pqc_key_exchanges": pqc_kems,
        "hybrid_key_exchanges": hybrid_kems,
        "has_pqc_protection": has_pqc_protection,
        "has_classical_exposure": has_classical_exposure,
        "total_classical_kx_count": len(classical_kems),
        "total_pqc_kx_count": len(pqc_kems) + len(hybrid_kems)
    }

def evaluate_hndl_exposure(
    category_name: str,
    sensitivity: str,
    lifetime: str,
    kx_context: Dict[str, Any],
    description: str = "",
    associated_assets: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluate HNDL risk for a specific data category given sensitivity, lifetime, and key exchange context.
    Does not fabricate user parameters; explicitly flags missing or assumed values.
    """
    sens_norm = sensitivity.upper().strip() if sensitivity else "UNKNOWN"
    life_norm = lifetime.upper().strip() if lifetime else "UNKNOWN"
    
    is_user_specified = (sens_norm in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}) and \
                        (life_norm in {"SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "INDEFINITE"})

    assumptions = []
    effective_sens = sens_norm
    effective_life = life_norm

    if not is_user_specified:
        if effective_sens not in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
            effective_sens = "MEDIUM"
            assumptions.append("Data sensitivity was not provided; assumed 'MEDIUM' for baseline risk visibility.")
        if effective_life not in {"SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "INDEFINITE"}:
            effective_life = "LONG_TERM"
            assumptions.append("Confidentiality lifetime was not provided; assumed 'LONG_TERM' (5-15 years) for HNDL modeling.")

    has_classical_kx = kx_context.get("has_classical_exposure", True)
    has_hybrid_kx = kx_context.get("has_pqc_protection", False)

    # Calculate numeric HNDL exposure score (0 - 100)
    # Factor 1: Sensitivity weight (Low: 10, Medium: 30, High: 70, Critical: 100)
    sens_weight = {"LOW": 10.0, "MEDIUM": 35.0, "HIGH": 75.0, "CRITICAL": 100.0}.get(effective_sens, 35.0)
    
    # Factor 2: Lifetime multiplier
    # Short-term (< 1-3 years): Adversary captures data, but it expires before CRQC can decrypt it -> low HNDL
    # Medium-term (3-10 years): Moderate threat window
    # Long-term (10-30 years): High threat window
    # Indefinite (> 30 years): Critical threat window
    life_multiplier = {
        "SHORT_TERM": 0.20,
        "MEDIUM_TERM": 0.60,
        "LONG_TERM": 0.90,
        "INDEFINITE": 1.00
    }.get(effective_life, 0.70)

    # Factor 3: Key establishment mitigation
    # If using verified hybrid or PQC key exchange, exposure is strongly mitigated (factor 0.05)
    # If using classical key exchange (RSA, ECDH, X25519), exposure is full (factor 1.0)
    if has_hybrid_kx and not has_classical_kx:
        kem_mitigation = 0.05
    elif has_hybrid_kx and has_classical_kx:
        kem_mitigation = 0.40 # Partial hybrid migration
    else:
        kem_mitigation = 1.00

    raw_score = sens_weight * life_multiplier * kem_mitigation
    hndl_score = max(0.0, min(100.0, round(raw_score, 1)))

    # Classification
    if hndl_score >= 70.0:
        exposure_level = "CRITICAL"
    elif hndl_score >= 45.0:
        exposure_level = "HIGH"
    elif hndl_score >= 20.0:
        exposure_level = "MODERATE"
    else:
        exposure_level = "LOW"

    # Explanation and Technical Rationale
    if has_hybrid_kx and not has_classical_kx:
        explanation = (
            f"Data category '{category_name}' is protected by verified post-quantum or hybrid key exchange. "
            "Even if encrypted network sessions are intercepted and archived today, adversaries cannot retroactively "
            "derive the session keys on a quantum computer using Shor's algorithm."
        )
        recommendation = "Maintain post-quantum hybrid key encapsulation (FIPS 203 ML-KEM) and monitor library updates."
    elif effective_life == "SHORT_TERM":
        explanation = (
            f"Data category '{category_name}' has a short confidentiality lifetime ({effective_life.replace('_', ' ').lower()}). "
            "Although protected by classical key establishment vulnerable to Shor's algorithm, the business value "
            "and confidentiality requirement will expire naturally before cryptanalytically relevant quantum computers are deployable."
        )
        recommendation = "Prioritize long-lived data migrations first; schedule TLS hybrid transition during regular maintenance."
    else:
        explanation = (
            f"Data category '{category_name}' has an extended confidentiality requirement ({effective_life.replace('_', ' ').lower()}) "
            f"and high value ({effective_sens.lower()} sensitivity), but relies on classical asymmetric key establishment "
            "(e.g., ECDH, RSA, or X25519). Adversaries can intercept and archive ciphertext today, and decrypt it retroactively "
            "using Shor's algorithm once sufficiently capable quantum hardware becomes available."
        )
        recommendation = "Upgrade key establishment immediately to NIST FIPS 203 (ML-KEM-768) or an X25519+ML-KEM-768 hybrid scheme."

    return {
        "assessment_id": str(uuid.uuid4())[:8],
        "category": category_name,
        "sensitivity": sens_norm,
        "lifetime": life_norm,
        "effective_sensitivity": effective_sens,
        "effective_lifetime": effective_life,
        "is_user_specified": is_user_specified,
        "assumptions": assumptions,
        "exposure_level": exposure_level,
        "hndl_score": hndl_score,
        "has_classical_key_exchange": has_classical_kx,
        "has_hybrid_key_exchange": has_hybrid_kx,
        "description": description,
        "associated_assets": associated_assets or [],
        "explanation": explanation,
        "recommendation": recommendation
    }

def analyze_hndl_profile(
    findings: List[Dict[str, Any]],
    tls_data: Optional[Dict[str, Any]] = None,
    certificates: Optional[List[Dict[str, Any]]] = None,
    user_assessments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive HNDL profile correlating scan data with user assessments.
    """
    kx_context = extract_key_exchange_context(findings, tls_data, certificates)
    
    assessed_items = []
    
    # 1. Process User-Submitted Assessments if provided
    if user_assessments:
        for item in user_assessments:
            res = evaluate_hndl_exposure(
                category_name=item.get("category", "Custom Data Asset"),
                sensitivity=item.get("sensitivity", "UNKNOWN"),
                lifetime=item.get("lifetime", "UNKNOWN"),
                kx_context=kx_context,
                description=item.get("description", ""),
                associated_assets=item.get("associated_assets", [])
            )
            assessed_items.append(res)
    else:
        # Generate automated baseline assessments based on detected cryptographic assets
        # E.g., if RSA or ECDH key exchange is detected, evaluate standard transmission profile
        if kx_context.get("has_classical_exposure"):
            baseline_item = evaluate_hndl_exposure(
                category_name="Operational Network Traffic & Confidential Payloads",
                sensitivity="HIGH",
                lifetime="LONG_TERM",
                kx_context=kx_context,
                description="Default baseline assessment for confidential data transmitted across detected classical key establishment channels.",
                associated_assets=[c.get("mechanism") for c in kx_context.get("classical_key_exchanges", [])[:3]]
            )
            assessed_items.append(baseline_item)
        elif kx_context.get("has_pqc_protection"):
            baseline_item = evaluate_hndl_exposure(
                category_name="Hybrid / Post-Quantum Protected Data Streams",
                sensitivity="HIGH",
                lifetime="INDEFINITE",
                kx_context=kx_context,
                description="Default baseline assessment for data secured by detected hybrid/PQC key establishment.",
                associated_assets=[h.get("mechanism") for h in kx_context.get("hybrid_key_exchanges", [])]
            )
            assessed_items.append(baseline_item)

    # Calculate overall HNDL risk score
    if assessed_items:
        avg_score = round(sum(i["hndl_score"] for i in assessed_items) / len(assessed_items), 1)
        max_score = max(i["hndl_score"] for i in assessed_items)
        composite_score = round(0.7 * max_score + 0.3 * avg_score, 1)
    else:
        composite_score = 0.0

    if composite_score >= 70.0:
        overall_hndl_level = "CRITICAL"
    elif composite_score >= 45.0:
        overall_hndl_level = "HIGH"
    elif composite_score >= 20.0:
        overall_hndl_level = "MODERATE"
    else:
        overall_hndl_level = "LOW"

    return {
        "overall_hndl_score": composite_score,
        "overall_hndl_level": overall_hndl_level,
        "key_exchange_context": kx_context,
        "assessments": assessed_items,
        "presets": HNDL_PRESETS,
        "summary": {
            "total_categories_assessed": len(assessed_items),
            "critical_exposure_count": sum(1 for i in assessed_items if i["exposure_level"] == "CRITICAL"),
            "high_exposure_count": sum(1 for i in assessed_items if i["exposure_level"] == "HIGH"),
            "moderate_exposure_count": sum(1 for i in assessed_items if i["exposure_level"] == "MODERATE"),
            "low_exposure_count": sum(1 for i in assessed_items if i["exposure_level"] == "LOW"),
            "unspecified_parameters_count": sum(1 for i in assessed_items if not i["is_user_specified"])
        }
    }
