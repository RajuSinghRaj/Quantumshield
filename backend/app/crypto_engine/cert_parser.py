from typing import Dict, Any, Optional
import datetime
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa, ed25519, ed448

def parse_certificate_or_pubkey(content_str: str, file_path: str) -> Optional[Dict[str, Any]]:
    """Parse PEM/DER X.509 certificate or public key file."""
    content_bytes = content_str.encode('utf-8')
    
    # 1. Try parsing as X.509 Certificate
    try:
        cert = x509.load_pem_x509_certificate(content_bytes)
        pub_key = cert.public_key()
        
        algo_name, key_size = get_pubkey_details(pub_key)
        sig_algo = cert.signature_algorithm_oid._name if hasattr(cert.signature_algorithm_oid, '_name') else "Unknown"

        try:
            not_before = cert.not_valid_before_utc.isoformat()
            not_after = cert.not_valid_after_utc.isoformat()
        except Exception:
            not_before = str(cert.not_valid_before)
            not_after = str(cert.not_valid_after)

        issuer = cert.issuer.rfc4514_string()
        subject = cert.subject.rfc4514_string()

        return {
            "type": "X.509 Certificate",
            "algorithm": algo_name,
            "variant": f"{algo_name}-{key_size}",
            "key_size": key_size,
            "signature_algorithm": sig_algo,
            "issuer": issuer,
            "subject": subject,
            "valid_from": not_before,
            "valid_until": not_after,
            "usage": "DIGITAL_SIGNATURE" if "RSA" in algo_name or "ECDSA" in algo_name else "KEY_EXCHANGE",
            "file_path": file_path,
            "line_number": 1,
            "code_snippet": f"Subject: {subject} | Issuer: {issuer} | Sig: {sig_algo}",
            "confidence": 1.0,
            "source": "X.509 Certificate Parser"
        }
    except Exception:
        pass

    # 2. Try parsing as Public Key (.pub, .pem)
    try:
        pub_key = serialization.load_pem_public_key(content_bytes)
        algo_name, key_size = get_pubkey_details(pub_key)
        return {
            "type": "Public Key",
            "algorithm": algo_name,
            "variant": f"{algo_name}-{key_size}",
            "key_size": key_size,
            "signature_algorithm": "N/A",
            "issuer": "N/A",
            "subject": "N/A",
            "usage": "KEY_EXCHANGE" if "ECDH" in algo_name else "DIGITAL_SIGNATURE",
            "file_path": file_path,
            "line_number": 1,
            "code_snippet": f"PEM Public Key: {algo_name}-{key_size} bits",
            "confidence": 1.0,
            "source": "Public Key Parser"
        }
    except Exception:
        pass

    return None

def get_pubkey_details(pub_key) -> tuple[str, int]:
    """Extract public key algorithm name and bit length."""
    if isinstance(pub_key, rsa.RSAPublicKey):
        return "RSA", pub_key.key_size
    elif isinstance(pub_key, ec.EllipticCurvePublicKey):
        curve_name = pub_key.curve.name
        key_size = pub_key.key_size
        return f"ECDSA ({curve_name})", key_size
    elif isinstance(pub_key, dsa.DSAPublicKey):
        return "DSA", pub_key.key_size
    elif isinstance(pub_key, ed25519.Ed25519PublicKey):
        return "Ed25519", 256
    elif isinstance(pub_key, ed448.Ed448PublicKey):
        return "Ed448", 448
    return "Asymmetric Key", 2048
