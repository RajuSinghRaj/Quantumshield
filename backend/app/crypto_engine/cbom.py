"""
CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) Engine.
Generates industry-standard CBOM JSON documents for cryptographic inventory,
quantum risk auditing, and compliance governance.

Specification: CycloneDX 1.6 (Cryptographic Assets Schema)
https://cyclonedx.org/docs/1.6/json/
"""

import uuid
import datetime
from typing import Dict, Any, List, Optional

def map_crypto_primitive(algorithm: str, usage: str) -> str:
    """Map detected algorithm and usage to CycloneDX 1.6 primitive types."""
    algo = algorithm.upper()
    use = usage.upper()

    if algo in {"ML-KEM"} or "KYBER" in algo:
        return "kem"
    if algo in {"ML-DSA", "SLH-DSA"} or "DILITHIUM" in algo or "SPHINCS" in algo:
        return "signature"
    if algo in {"ECDSA", "ED25519", "ED448", "DSA"} or use == "DIGITAL_SIGNATURE":
        return "signature"
    if algo in {"ECDH", "X25519", "DH", "DIFFIE-HELLMAN"} or use == "KEY_EXCHANGE":
        return "kem"
    if algo == "RSA":
        return "signature" if use == "DIGITAL_SIGNATURE" else "pke"
    if algo in {"AES", "3DES", "DES"}:
        return "block-cipher"
    if algo in {"CHACHA20"}:
        return "stream-cipher"
    if algo in {"HMAC"} or use == "MESSAGE_AUTHENTICATION":
        return "mac"
    if algo in {"SHA-256", "SHA-384", "SHA-512", "SHA-1", "MD5", "SHA-3"}:
        return "hash"
    if algo in {"PBKDF2", "BCRYPT", "ARGON2", "SCRYPT"}:
        return "kdf"
    return "other"

def map_crypto_functions(usage: str) -> List[str]:
    """Map high-level usage to CycloneDX cryptoFunctions list."""
    u = usage.upper()
    if u == "ENCRYPTION":
        return ["encrypt", "decrypt"]
    elif u == "DECRYPTION":
        return ["decrypt"]
    elif u == "DIGITAL_SIGNATURE":
        return ["sign", "verify"]
    elif u == "KEY_EXCHANGE":
        return ["key-exchange", "keygen"]
    elif u == "KEY_GEN":
        return ["keygen"]
    elif u == "HASHING":
        return ["digest"]
    elif u == "MESSAGE_AUTHENTICATION":
        return ["mac"]
    elif u == "PASSWORD_HASHING":
        return ["kdf", "digest"]
    return ["keygen"]

def get_nist_quantum_level(algorithm: str, variant: str, quantum_risk: str) -> int:
    """
    Return NIST PQC Security Category (0 to 5):
    - Level 0: Broken under Shor's algorithm (RSA, ECC, ECDSA, ECDH, DH, DSA)
    - Level 1: ~AES-128 security margin (ML-KEM-512, ML-DSA-44, SLH-DSA-128)
    - Level 3: ~AES-192 security margin (ML-KEM-768, ML-DSA-65, SLH-DSA-192)
    - Level 5: ~AES-256 security margin (AES-256, ML-KEM-1024, ML-DSA-87, SLH-DSA-256, SHA-256+)
    """
    algo = algorithm.upper()
    var = variant.upper()

    if quantum_risk == "VULNERABLE":
        return 0
    if quantum_risk == "DEGRADED":
        return 1

    if "768" in var or "65" in var or "192" in var:
        return 3
    elif "1024" in var or "87" in var or "256" in var or "512" in var:
        return 5
    elif "512" in var or "44" in var or "128" in var:
        return 1
    return 1

def get_algorithm_oid(variant: str) -> Optional[str]:
    """Return standard NIST/ISO ASN.1 OID for well-known cryptographic primitives."""
    v = variant.upper()
    oid_map = {
        "RSA-2048": "1.2.840.113549.1.1.1",
        "RSA-4096": "1.2.840.113549.1.1.1",
        "RSA-1024": "1.2.840.113549.1.1.1",
        "ECDSA P-256": "1.2.840.10045.2.1",
        "ECDSA P-384": "1.3.132.0.34",
        "ECDSA P-521": "1.3.132.0.35",
        "ECDSA SECP256K1": "1.3.132.0.10",
        "ECDH P-256": "1.2.840.10045.2.1",
        "X25519": "1.3.101.110",
        "ED25519": "1.3.101.112",
        "AES-256-GCM": "2.16.840.1.101.3.4.1.46",
        "AES-128-GCM": "2.16.840.1.101.3.4.1.6",
        "AES-256-CBC": "2.16.840.1.101.3.4.1.42",
        "AES-128-CBC": "2.16.840.1.101.3.4.1.2",
        "CHACHA20-POLY1305": "1.2.840.113549.1.9.16.3.18",
        "3DES": "1.2.840.113549.3.7",
        "DES": "1.3.14.3.2.7",
        "SHA-256": "2.16.840.1.101.3.4.2.1",
        "SHA-384": "2.16.840.1.101.3.4.2.2",
        "SHA-512": "2.16.840.1.101.3.4.2.3",
        "SHA-1": "1.3.14.3.2.26",
        "MD5": "1.2.840.113549.2.5",
        "HMAC-SHA256": "1.2.840.113549.2.9",
        "HMAC-SHA512": "1.2.840.113549.2.11",
        "ML-KEM-768": "2.16.840.1.101.3.4.4.2",
        "ML-KEM-1024": "2.16.840.1.101.3.4.4.3",
        "ML-KEM-512": "2.16.840.1.101.3.4.4.1",
        "ML-DSA-65": "2.16.840.1.101.3.4.3.18",
        "ML-DSA-87": "2.16.840.1.101.3.4.3.19",
        "SLH-DSA-128F": "2.16.840.1.101.3.4.3.23"
    }
    for key, oid in oid_map.items():
        if key in v:
            return oid
    return None

def generate_cbom(
    scan_id: str,
    project_name: str,
    scan_type: str,
    findings: List[Dict[str, Any]],
    scores: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate a formal CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) document.
    """
    scores = scores or {}
    bom_serial = f"urn:uuid:{uuid.uuid4()}"
    timestamp_str = datetime.datetime.utcnow().isoformat() + "Z"

    components = []
    dependencies = []

    for idx, f in enumerate(findings):
        component_ref = f"urn:quantumshield:asset:{scan_id}:{idx + 1}"
        algo = f.get("algorithm", "UNKNOWN")
        variant = f.get("variant", algo)
        key_size = f.get("key_size")
        usage = f.get("usage", "UNKNOWN")
        file_path = f.get("file_path", "unknown")
        line_num = f.get("line_number", 1)
        code_snip = f.get("code_snippet", "")
        confidence = f.get("confidence", 1.0)
        c_risk = f.get("classical_risk", "SAFE")
        q_risk = f.get("quantum_risk", "SAFE")
        q_threat = f.get("quantum_threat", "None")
        det_method = f.get("detection_method", "Static Code Inspection")
        lib = f.get("library_or_api", "Standard Cryptography Library")
        curve_param = f.get("curve_or_parameters", "")
        pqc_alt = f.get("pqc_alternative", "N/A")

        primitive = map_crypto_primitive(algo, usage)
        crypto_funcs = map_crypto_functions(usage)
        nist_q_level = get_nist_quantum_level(algo, variant, q_risk)
        oid_val = get_algorithm_oid(variant)

        # Classical security level in bits
        classical_sec_bits = 128
        if key_size and isinstance(key_size, int):
            if algo == "RSA":
                classical_sec_bits = 112 if key_size >= 2048 else (128 if key_size >= 3072 else (64 if key_size <= 1024 else 80))
            elif algo in {"AES", "ECDSA", "ECDH", "X25519", "ED25519", "SHA-256", "HMAC"}:
                classical_sec_bits = key_size
            elif algo in {"3DES"}:
                classical_sec_bits = 112
            elif algo in {"DES"}:
                classical_sec_bits = 56
            elif algo in {"MD5"}:
                classical_sec_bits = 0
            elif algo in {"SHA-1"}:
                classical_sec_bits = 64

        component_entry: Dict[str, Any] = {
            "type": "cryptographic-asset",
            "bom-ref": component_ref,
            "name": algo,
            "version": variant,
            "description": f"{variant} utilized for {usage.replace('_', ' ').lower()}",
            "cryptoProperties": {
                "assetType": "algorithm" if "Certificate" not in det_method else "certificate",
                "algorithmProperties": {
                    "primitive": primitive,
                    "parameterSetIdentifier": str(key_size) if key_size else variant,
                    "executionEnvironment": "software-plain-text",
                    "implementationPlatform": "generic",
                    "classicalSecurityLevel": classical_sec_bits,
                    "nistQuantumSecurityLevel": nist_q_level,
                    "cryptoFunctions": crypto_funcs
                }
            },
            "evidence": {
                "occurrences": [
                    {
                        "location": file_path,
                        "line": line_num,
                        "additionalContext": code_snip
                    }
                ]
            },
            "properties": [
                {"name": "quantumshield:classicalRisk", "value": c_risk},
                {"name": "quantumshield:quantumRisk", "value": q_risk},
                {"name": "quantumshield:quantumThreat", "value": q_threat},
                {"name": "quantumshield:detectionMethod", "value": det_method},
                {"name": "quantumshield:library", "value": lib},
                {"name": "quantumshield:confidence", "value": str(confidence)},
                {"name": "quantumshield:pqcRecommendation", "value": pqc_alt or "N/A"}
            ]
        }

        if curve_param and curve_param != "N/A":
            component_entry["cryptoProperties"]["algorithmProperties"]["curve"] = curve_param
        if oid_val:
            component_entry["cryptoProperties"]["oid"] = oid_val

        components.append(component_entry)

    cbom_doc: Dict[str, Any] = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": bom_serial,
        "version": 1,
        "metadata": {
            "timestamp": timestamp_str,
            "tools": {
                "components": [
                    {
                        "type": "application",
                        "name": "QuantumShield Discovery Engine",
                        "version": "2.0.0",
                        "description": "Cryptographic Vulnerability Assessment & Post-Quantum Migration Platform",
                        "externalReferences": [
                            {
                                "type": "website",
                                "url": "https://csrc.nist.gov/projects/post-quantum-cryptography"
                            }
                        ]
                    }
                ]
            },
            "component": {
                "type": "application",
                "name": project_name,
                "bom-ref": f"urn:quantumshield:project:{scan_id}",
                "version": "1.0.0"
            },
            "properties": [
                {"name": "quantumshield:scanId", "value": scan_id},
                {"name": "quantumshield:scanType", "value": scan_type},
                {"name": "quantumshield:overallRisk", "value": str(scores.get("overall_risk", "UNKNOWN"))},
                {"name": "quantumshield:quantumReadinessScore", "value": str(scores.get("quantum_score", 0))},
                {"name": "quantumshield:classicalHardeningScore", "value": str(scores.get("classical_score", 0))},
                {"name": "quantumshield:pqcAdoptionPercentage", "value": str(scores.get("pqc_score", 0))},
                {"name": "quantumshield:totalCryptographicAssets", "value": str(len(findings))}
            ]
        },
        "components": components,
        "dependencies": dependencies
    }

    return cbom_doc

def validate_cbom_structure(cbom: Dict[str, Any]) -> bool:
    """Validate that the CBOM document conforms to CycloneDX 1.6 required structure."""
    if not isinstance(cbom, dict):
        return False
    if cbom.get("bomFormat") != "CycloneDX":
        return False
    if cbom.get("specVersion") != "1.6":
        return False
    if not cbom.get("serialNumber", "").startswith("urn:uuid:"):
        return False
    if "metadata" not in cbom or "components" not in cbom:
        return False
    for comp in cbom.get("components", []):
        if comp.get("type") != "cryptographic-asset":
            return False
        if "cryptoProperties" not in comp:
            return False
        if "evidence" not in comp:
            return False
    return True
