"""
Certificate and Key Analyzer for QuantumShield 2.0.

Provides comprehensive X.509 certificate parsing, certificate bundle analysis,
public/private key metadata extraction, and quantum vulnerability evaluation.

Strict Security & Privacy Controls:
- Private key bytes are NEVER persisted, logged, or returned in findings.
- Analyzed in volatile memory and immediately discarded.
- Only safe cryptographic metadata (algorithm, key length, curve, quantum risk) is reported.
"""

import os
import hashlib
import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
from cryptography import x509
from cryptography.x509.oid import ExtensionOID, NameOID
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa, ed25519, ed448, dh


# ==================== PUBLIC KEY & PARAMETER EXTRACTION ====================

def get_pubkey_details(pub_key: Any) -> Tuple[str, str, int, Optional[str]]:
    """
    Extract algorithm name, variant, bit size, and curve/parameters.
    Returns: (algo_name, variant, key_size, curve_name)
    """
    if isinstance(pub_key, rsa.RSAPublicKey):
        size = pub_key.key_size
        return "RSA", f"RSA-{size}", size, None

    elif isinstance(pub_key, ec.EllipticCurvePublicKey):
        curve_name = pub_key.curve.name
        size = pub_key.key_size
        return "ECDSA", f"ECDSA-{curve_name}", size, curve_name

    elif isinstance(pub_key, ed25519.Ed25519PublicKey):
        return "Ed25519", "Ed25519-256", 256, "Curve25519"

    elif isinstance(pub_key, ed448.Ed448PublicKey):
        return "Ed448", "Ed448-448", 448, "Curve448"

    elif isinstance(pub_key, dsa.DSAPublicKey):
        size = pub_key.key_size
        return "DSA", f"DSA-{size}", size, None

    elif isinstance(pub_key, dh.DHPublicKey):
        size = pub_key.key_size
        return "Diffie-Hellman", f"DH-{size}", size, None

    return "Asymmetric Key", "Unknown-Key", 2048, None


def _format_fingerprint(data: bytes, hash_algo: str = "sha256") -> str:
    """Compute colon-delimited hex fingerprint."""
    if hash_algo == "sha1":
        h = hashlib.sha1(data).hexdigest()
    else:
        h = hashlib.sha256(data).hexdigest()
    return ":".join(h[i:i+2].upper() for i in range(0, len(h), 2))


# ==================== CERTIFICATE ANALYSIS ====================

def analyze_certificate_object(cert: x509.Certificate, source_path: str = "certificate.pem") -> Dict[str, Any]:
    """Extract comprehensive structured metadata and quantum risk from an X.509 certificate."""
    pub_key = cert.public_key()
    algo_name, variant, key_size, curve_name = get_pubkey_details(pub_key)

    # Signature algorithm
    sig_algo = getattr(cert.signature_algorithm_oid, '_name', str(cert.signature_algorithm_oid.dotted_string))
    try:
        sig_hash = cert.signature_hash_algorithm.name if cert.signature_hash_algorithm else "None"
    except Exception:
        sig_hash = "Unknown"

    # Validity period & Expiry Status
    now = datetime.datetime.now(datetime.timezone.utc)
    try:
        not_before = cert.not_valid_before_utc
        not_after = cert.not_valid_after_utc
    except AttributeError:
        # Fallback for older cryptography versions without UTC property
        not_before = cert.not_valid_before.replace(tzinfo=datetime.timezone.utc)
        not_after = cert.not_valid_after.replace(tzinfo=datetime.timezone.utc)

    valid_from_iso = not_before.isoformat()
    valid_until_iso = not_after.isoformat()
    days_to_expiry = (not_after - now).days
    is_expired = now > not_after
    is_not_yet_valid = now < not_before

    if is_expired:
        validity_status = "EXPIRED"
    elif is_not_yet_valid:
        validity_status = "NOT_YET_VALID"
    elif days_to_expiry <= 30:
        validity_status = "EXPIRING_SOON"
    else:
        validity_status = "VALID"

    # Subject & Issuer formatting
    subject_str = cert.subject.rfc4514_string()
    issuer_str = cert.issuer.rfc4514_string()

    subject_dict: Dict[str, str] = {}
    for attr in cert.subject:
        attr_name = getattr(attr.oid, '_name', attr.oid.dotted_string)
        subject_dict[attr_name] = str(attr.value)

    issuer_dict: Dict[str, str] = {}
    for attr in cert.issuer:
        attr_name = getattr(attr.oid, '_name', attr.oid.dotted_string)
        issuer_dict[attr_name] = str(attr.value)

    # Serial Number
    serial_int = cert.serial_number
    serial_hex = hex(serial_int)[2:].upper()
    serial_formatted = ":".join(serial_hex[i:i+2] for i in range(0, len(serial_hex), 2))

    # Fingerprints
    raw_der = cert.public_bytes(serialization.Encoding.DER)
    fingerprint_sha256 = _format_fingerprint(raw_der, "sha256")
    fingerprint_sha1 = _format_fingerprint(raw_der, "sha1")

    # Subject Alternative Names (SANs)
    sans: List[str] = []
    try:
        san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        for name in san_ext.value:
            sans.append(str(name.value))
    except Exception:
        pass

    # X.509 Key Usage & Extended Key Usage
    key_usages: List[str] = []
    try:
        ku_ext = cert.extensions.get_extension_for_oid(ExtensionOID.KEY_USAGE)
        ku = ku_ext.value
        for field in [
            "digital_signature", "content_commitment", "key_encipherment",
            "data_encipherment", "key_agreement", "key_cert_sign", "crl_sign"
        ]:
            if getattr(ku, field, False):
                key_usages.append(field)
    except Exception:
        pass

    extended_key_usages: List[str] = []
    try:
        eku_ext = cert.extensions.get_extension_for_oid(ExtensionOID.EXTENDED_KEY_USAGE)
        for oid in eku_ext.value:
            extended_key_usages.append(getattr(oid, '_name', oid.dotted_string))
    except Exception:
        pass

    # Basic Constraints (CA flag)
    is_ca = False
    path_length = None
    try:
        bc_ext = cert.extensions.get_extension_for_oid(ExtensionOID.BASIC_CONSTRAINTS)
        is_ca = bc_ext.value.ca
        path_length = bc_ext.value.path_length
    except Exception:
        pass

    # Quantum & Classical Risk Assessment
    # Factually: RSA and conventional ECC are vulnerable to Shor's algorithm on a sufficiently
    # capable fault-tolerant quantum computer (FTQC).
    quantum_risk = "VULNERABLE"
    quantum_threat = "Shor's Algorithm (Integer Factorization / Discrete Logarithm)"
    pqc_alternative = "ML-DSA (NIST FIPS 204 / Dilithium) or SLH-DSA (NIST FIPS 205 / SPHINCS+)"

    # Classical Risk
    if is_expired:
        classical_risk = "CRITICAL"
        classical_reason = "Certificate has expired, causing verification errors and security warning prompts."
    elif is_not_yet_valid:
        classical_risk = "HIGH"
        classical_reason = "Certificate is not yet valid."
    elif (algo_name == "RSA" and key_size < 2048) or ("sha1" in sig_algo.lower()) or ("md5" in sig_algo.lower()):
        classical_risk = "CRITICAL"
        classical_reason = f"Classically weak cryptographic parameter ({sig_algo} / {key_size}-bit key)."
    elif validity_status == "EXPIRING_SOON":
        classical_risk = "HIGH"
        classical_reason = f"Certificate will expire in {days_to_expiry} days. Service interruption risk."
    else:
        classical_risk = "SAFE"
        classical_reason = f"Current classical security conforms to industry standards ({key_size}-bit {algo_name}, {sig_algo})."

    security_findings: List[Dict[str, Any]] = []

    if is_expired:
        security_findings.append({
            "type": "EXPIRED_CERTIFICATE",
            "severity": "CRITICAL",
            "title": f"Certificate Expired on {valid_until_iso}",
            "description": f"Certificate for '{subject_dict.get('commonName', subject_str)}' expired {abs(days_to_expiry)} days ago.",
            "recommendation": "Renew and deploy updated certificate immediately."
        })
    elif validity_status == "EXPIRING_SOON":
        security_findings.append({
            "type": "EXPIRING_CERTIFICATE",
            "severity": "HIGH",
            "title": f"Certificate Expiring Soon ({days_to_expiry} days remaining)",
            "description": f"Certificate for '{subject_dict.get('commonName', subject_str)}' will expire on {valid_until_iso}.",
            "recommendation": "Schedule certificate renewal within the next 14 days."
        })

    if "sha1" in sig_algo.lower() or "md5" in sig_algo.lower():
        security_findings.append({
            "type": "WEAK_SIGNATURE_ALGORITHM",
            "severity": "CRITICAL",
            "title": f"Deprecated Signature Algorithm: {sig_algo}",
            "description": "SHA-1 and MD5 signature algorithms are broken against collision attacks and rejected by modern browsers.",
            "recommendation": "Re-issue certificate using SHA-256 or SHA-384 with RSA/ECDSA, or post-quantum ML-DSA."
        })

    if algo_name == "RSA" and key_size < 2048:
        security_findings.append({
            "type": "WEAK_KEY_SIZE",
            "severity": "CRITICAL",
            "title": f"Weak RSA Key Size ({key_size} bits)",
            "description": "RSA key sizes below 2048 bits do not provide sufficient classical cryptographic margin.",
            "recommendation": "Generate a minimum 2048-bit (preferably 3072-bit) RSA key or P-256 / P-384 ECDSA key."
        })

    # Quantum Exposure Finding
    security_findings.append({
        "type": "QUANTUM_VULNERABLE_PUBLIC_KEY",
        "severity": "HIGH",
        "title": f"Quantum-Vulnerable Public Key: {algo_name}-{key_size}",
        "description": (
            f"The certificate's public key ({variant}) relies on mathematical problems "
            "vulnerable to polynomial-time solution via Shor's algorithm on a future fault-tolerant quantum computer."
        ),
        "classical_risk": classical_risk,
        "quantum_risk": "VULNERABLE",
        "recommendation": f"Plan migration to NIST standardized post-quantum digital signatures ({pqc_alternative})."
    })

    return {
        "source_path": source_path,
        "subject": subject_str,
        "subject_common_name": subject_dict.get("commonName", ""),
        "subject_details": subject_dict,
        "issuer": issuer_str,
        "issuer_common_name": issuer_dict.get("commonName", ""),
        "issuer_details": issuer_dict,
        "serial_number": serial_formatted,
        "serial_number_int": serial_int,
        "fingerprint_sha256": fingerprint_sha256,
        "fingerprint_sha1": fingerprint_sha1,
        "valid_from": valid_from_iso,
        "valid_until": valid_until_iso,
        "days_to_expiry": days_to_expiry,
        "is_expired": is_expired,
        "validity_status": validity_status,
        "subject_alt_names": sans,
        "is_ca": is_ca,
        "path_length": path_length,
        "key_usage": key_usages,
        "extended_key_usage": extended_key_usages,
        "public_key": {
            "algorithm": algo_name,
            "variant": variant,
            "key_size": key_size,
            "curve": curve_name
        },
        "signature_algorithm": sig_algo,
        "signature_hash": sig_hash,
        "classical_risk": classical_risk,
        "classical_reason": classical_reason,
        "quantum_risk": quantum_risk,
        "quantum_threat": quantum_threat,
        "pqc_alternative": pqc_alternative,
        "security_findings": security_findings
    }


def analyze_certificate_bytes(content: Union[bytes, str], file_path: str = "certificate.pem") -> List[Dict[str, Any]]:
    """
    Parse and analyze certificate from PEM, DER, or concatenated certificate bundle.
    Returns a list of analyzed certificate objects (supporting bundles).
    """
    if isinstance(content, str):
        content_bytes = content.encode('utf-8')
    else:
        content_bytes = content

    results: List[Dict[str, Any]] = []

    # 1. Try parsing as PEM (single certificate or bundle)
    try:
        certs = x509.load_pem_x509_certificates(content_bytes)
        if certs:
            for idx, c in enumerate(certs):
                sub_path = f"{file_path}#cert_{idx+1}" if len(certs) > 1 else file_path
                results.append(analyze_certificate_object(c, sub_path))
            return results
    except Exception:
        pass

    # 2. Try parsing as single PEM certificate
    try:
        cert = x509.load_pem_x509_certificate(content_bytes)
        results.append(analyze_certificate_object(cert, file_path))
        return results
    except Exception:
        pass

    # 3. Try parsing as binary DER certificate
    try:
        cert = x509.load_der_x509_certificate(content_bytes)
        results.append(analyze_certificate_object(cert, file_path))
        return results
    except Exception:
        pass

    return results


# ==================== KEY ANALYZER (SAFE METADATA EXTRACTION) ====================

def analyze_key_metadata(
    content: Union[bytes, str],
    file_path: str = "key.pem",
    password: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Analyze Public or Private Key file.
    CRITICAL PRIVACY RULE:
    - Never persists or displays private key contents.
    - Inspects public parameters in volatile memory, then deletes private key reference.
    - Reports safe metadata only.
    """
    if isinstance(content, str):
        content_bytes = content.encode('utf-8')
    else:
        content_bytes = content

    # 1. Check if it is a Private Key
    is_private = False
    if (b"BEGIN RSA PRIVATE KEY" in content_bytes or
        b"BEGIN PRIVATE KEY" in content_bytes or
        b"BEGIN EC PRIVATE KEY" in content_bytes or
        b"BEGIN ENCRYPTED PRIVATE KEY" in content_bytes or
        b"BEGIN OPENSSH PRIVATE KEY" in content_bytes):
        is_private = True

    if is_private:
        # Check if encrypted with passphrase
        if b"ENCRYPTED" in content_bytes and not password:
            return {
                "key_type": "Private Key (Encrypted)",
                "file_path": file_path,
                "status": "ENCRYPTED_PASSPHRASE_REQUIRED",
                "message": "Key is encrypted with a passphrase. Password required to inspect metadata.",
                "private_key_redacted": True,
                "content_persisted": False
            }

        try:
            priv_key = serialization.load_pem_private_key(content_bytes, password=password)
            pub_key = priv_key.public_key()
            algo_name, variant, key_size, curve_name = get_pubkey_details(pub_key)

            # Evaluate classical & quantum risk
            if algo_name == "RSA" and key_size < 2048:
                classical_risk = "CRITICAL"
                classical_reason = f"RSA key size of {key_size} bits is classically weak (minimum recommended: 2048 bits)."
            else:
                classical_risk = "SAFE"
                classical_reason = f"Adequate classical security margin ({key_size}-bit {algo_name})."

            quantum_risk = "VULNERABLE"
            quantum_threat = "Shor's Algorithm (Private Key Recovery via Quantum Period Finding)"
            pqc_alt = "ML-DSA (FIPS 204) for digital signatures, ML-KEM (FIPS 203) for key encapsulation"

            # Immediately delete private key reference
            del priv_key

            return {
                "key_type": "Private Key",
                "file_path": file_path,
                "status": "ANALYZED_SAFE",
                "algorithm": algo_name,
                "variant": variant,
                "key_size": key_size,
                "curve": curve_name,
                "classical_risk": classical_risk,
                "classical_reason": classical_reason,
                "quantum_risk": quantum_risk,
                "quantum_threat": quantum_threat,
                "pqc_alternative": pqc_alt,
                "private_key_redacted": True,
                "content_persisted": False,
                "raw_key_material_discarded": True,
                "privacy_notice": (
                    "Private key material was analyzed strictly in volatile memory and immediately purged. "
                    "Zero private key bytes are stored, logged, or retained on disk."
                )
            }
        except Exception as e:
            return {
                "key_type": "Private Key",
                "file_path": file_path,
                "status": "UNPARSEABLE_PRIVATE_KEY",
                "message": "Unable to parse private key format (unsupported encoding, encrypted, or corrupted).",
                "private_key_redacted": True,
                "content_persisted": False
            }

    # 2. Check if it is a Public Key
    try:
        pub_key = serialization.load_pem_public_key(content_bytes)
        algo_name, variant, key_size, curve_name = get_pubkey_details(pub_key)

        return {
            "key_type": "Public Key",
            "file_path": file_path,
            "status": "ANALYZED_SAFE",
            "algorithm": algo_name,
            "variant": variant,
            "key_size": key_size,
            "curve": curve_name,
            "classical_risk": "SAFE" if (algo_name != "RSA" or key_size >= 2048) else "CRITICAL",
            "classical_reason": f"{key_size}-bit {algo_name} public key.",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Shor's Algorithm",
            "pqc_alternative": "ML-KEM / ML-DSA",
            "private_key_redacted": False,
            "content_persisted": False
        }
    except Exception:
        pass

    # 3. Try DER Public Key
    try:
        pub_key = serialization.load_der_public_key(content_bytes)
        algo_name, variant, key_size, curve_name = get_pubkey_details(pub_key)
        return {
            "key_type": "Public Key (DER)",
            "file_path": file_path,
            "status": "ANALYZED_SAFE",
            "algorithm": algo_name,
            "variant": variant,
            "key_size": key_size,
            "curve": curve_name,
            "classical_risk": "SAFE" if (algo_name != "RSA" or key_size >= 2048) else "CRITICAL",
            "classical_reason": f"{key_size}-bit {algo_name} DER public key.",
            "quantum_risk": "VULNERABLE",
            "quantum_threat": "Shor's Algorithm",
            "pqc_alternative": "ML-KEM / ML-DSA",
            "private_key_redacted": False,
            "content_persisted": False
        }
    except Exception:
        pass

    return {
        "key_type": "Unknown",
        "file_path": file_path,
        "status": "UNRECOGNIZED_FORMAT",
        "message": "File could not be recognized as a valid PEM/DER public or private key."
    }


# ==================== BACKWARD COMPATIBLE SCANNER HOOK ====================

def parse_certificate_or_pubkey(content_str: str, file_path: str) -> Optional[Dict[str, Any]]:
    """
    Backward-compatible parser hook used by Batch 1 / Batch 2 scanner pipeline.
    Maintains existing return schema for CryptographicAsset and CBOM conversion.
    """
    certs = analyze_certificate_bytes(content_str, file_path)
    if certs:
        c = certs[0]
        algo = c["public_key"]["algorithm"]
        key_size = c["public_key"]["key_size"]
        variant = c["public_key"]["variant"]
        return {
            "type": "X.509 Certificate",
            "algorithm": algo,
            "variant": variant,
            "key_size": key_size,
            "curve_or_parameters": c["public_key"].get("curve") or c.get("signature_algorithm", "N/A"),
            "library_or_api": "cryptography.x509",
            "detection_method": "X.509 Certificate Parser",
            "signature_algorithm": c["signature_algorithm"],
            "issuer": c["issuer"],
            "subject": c["subject"],
            "valid_from": c["valid_from"],
            "valid_until": c["valid_until"],
            "usage": "DIGITAL_SIGNATURE" if "RSA" in algo or "ECDSA" in algo else "KEY_EXCHANGE",
            "file_path": file_path,
            "line_number": 1,
            "code_snippet": f"Subject: {c['subject']} | Issuer: {c['issuer']} | Sig: {c['signature_algorithm']}",
            "confidence": 1.0,
            "classical_risk": c["classical_risk"],
            "quantum_risk": c["quantum_risk"],
            "quantum_threat": c["quantum_threat"],
            "source": "X.509 Certificate Parser"
        }

    key_meta = analyze_key_metadata(content_str, file_path)
    if key_meta.get("status") == "ANALYZED_SAFE":
        algo = key_meta["algorithm"]
        key_size = key_meta["key_size"]
        variant = key_meta["variant"]
        return {
            "type": key_meta["key_type"],
            "algorithm": algo,
            "variant": variant,
            "key_size": key_size,
            "curve_or_parameters": key_meta.get("curve") or "N/A",
            "library_or_api": "cryptography.hazmat.primitives.serialization",
            "detection_method": "Key Analyzer",
            "signature_algorithm": "N/A",
            "issuer": "N/A",
            "subject": "N/A",
            "usage": "KEY_EXCHANGE" if "DH" in algo or "ECDH" in algo else "DIGITAL_SIGNATURE",
            "file_path": file_path,
            "line_number": 1,
            "code_snippet": f"{key_meta['key_type']}: {algo}-{key_size} bits (Safe Metadata)",
            "confidence": 1.0,
            "classical_risk": key_meta["classical_risk"],
            "quantum_risk": key_meta["quantum_risk"],
            "quantum_threat": key_meta["quantum_threat"],
            "source": "Key Analyzer"
        }

    return None
