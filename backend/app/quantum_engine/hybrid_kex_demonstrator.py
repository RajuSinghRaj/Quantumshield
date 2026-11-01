"""
QuantumShield 2.0 - Hybrid Cryptography Demonstrator.
Executable demonstration of X25519 + ML-KEM-768 dual key establishment,
HKDF-SHA-256 secret combination, AES-256-GCM authenticated encryption,
and cryptographic tamper detection.
"""

import time
import os
import base64
from typing import Dict, Any, Optional

# Standard classical cryptography
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

# Standardized NIST FIPS 203 ML-KEM
try:
    import mlkem
    MLKEM_AVAILABLE = True
    MLKEM_VERSION = getattr(mlkem, "__version__", "0.2.0")
except ImportError:
    mlkem = None
    MLKEM_AVAILABLE = False
    MLKEM_VERSION = None

# Domain separation constants for Hybrid KDF
HYBRID_SALT = b"QuantumShield-v2-Hybrid-KEX-Salt"
HYBRID_INFO = b"X25519+ML-KEM-768-Hybrid-AES-256-GCM"

def is_mlkem_available() -> bool:
    """Check if genuine standardized ML-KEM is installed."""
    return MLKEM_AVAILABLE

def get_crypto_environment_metadata() -> Dict[str, Any]:
    """Inspect and return verified versions of installed cryptographic backends."""
    import cryptography
    return {
        "mlkem_available": MLKEM_AVAILABLE,
        "mlkem_version": MLKEM_VERSION,
        "mlkem_standard": "NIST FIPS 203 (ML-KEM-768)",
        "cryptography_version": cryptography.__version__,
        "supported_modes": ["classical_x25519", "pqc_mlkem768", "hybrid_x25519_mlkem768"]
    }

def run_hybrid_key_exchange_demo(
    plaintext_message: str = "Confidential financial transaction authorized for post-quantum transmission.",
    associated_data: str = "QuantumShield-Session-Audit-Context-2026",
    simulate_tamper: bool = True
) -> Dict[str, Any]:
    """
    Execute full end-to-end executable demonstration of X25519 + ML-KEM-768 hybrid key establishment.
    """
    if not MLKEM_AVAILABLE:
        return {
            "success": False,
            "error": "ML-KEM dependency is not installed on this system.",
            "dependency_requirement": "Install standardized ML-KEM package: pip install mlkem",
            "environment": get_crypto_environment_metadata()
        }

    overall_start = time.perf_counter()
    timings = {}

    # ---------------------------------------------------------
    # Step 1: Classical Key Exchange (X25519 ECDH)
    # ---------------------------------------------------------
    t0 = time.perf_counter()
    alice_x25519_priv = x25519.X25519PrivateKey.generate()
    alice_x25519_pub = alice_x25519_priv.public_key()

    bob_x25519_priv = x25519.X25519PrivateKey.generate()
    bob_x25519_pub = bob_x25519_priv.public_key()

    # Diffie-Hellman Shared Secret Agreement
    alice_ss_classical = alice_x25519_priv.exchange(bob_x25519_pub)
    bob_ss_classical = bob_x25519_priv.exchange(alice_x25519_pub)
    timings["x25519_ms"] = round((time.perf_counter() - t0) * 1000, 3)

    assert alice_ss_classical == bob_ss_classical, "X25519 shared secrets must match exactly"
    ss_classical = alice_ss_classical

    # ---------------------------------------------------------
    # Step 2: Post-Quantum Key Encapsulation (NIST FIPS 203 ML-KEM-768)
    # ---------------------------------------------------------
    t1 = time.perf_counter()
    kem = mlkem.ML_KEM(mlkem.ParameterSet.ML_KEM_768)

    # Bob acts as receiver: generates (EK, DK)
    bob_mlkem_ek, bob_mlkem_dk = kem.key_gen()

    # Alice acts as initiator: encapsulates shared secret against Bob's EK
    alice_ss_pqc, mlkem_ciphertext = kem.encaps(bob_mlkem_ek)

    # Bob decapsulates shared secret using DK and received ciphertext
    bob_ss_pqc = kem.decaps(bob_mlkem_dk, mlkem_ciphertext)
    timings["mlkem768_ms"] = round((time.perf_counter() - t1) * 1000, 3)

    assert alice_ss_pqc == bob_ss_pqc, "ML-KEM-768 shared secrets must match exactly"
    ss_pqc = alice_ss_pqc

    # ---------------------------------------------------------
    # Step 3: Domain-Separated HKDF Hybrid Secret Combination
    # ---------------------------------------------------------
    t2 = time.perf_counter()
    # Concatenate classical and PQC secrets: IKM = SS_classical || SS_pqc (64 bytes)
    combined_ikm = ss_classical + ss_pqc

    # Derive 256-bit AES key via HKDF-SHA-256
    hkdf_alice = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=HYBRID_SALT,
        info=HYBRID_INFO,
    )
    derived_aes_key = hkdf_alice.derive(combined_ikm)

    hkdf_bob = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=HYBRID_SALT,
        info=HYBRID_INFO,
    )
    derived_aes_key_bob = hkdf_bob.derive(bob_ss_classical + bob_ss_pqc)
    timings["hkdf_ms"] = round((time.perf_counter() - t2) * 1000, 3)

    assert derived_aes_key == derived_aes_key_bob, "Both parties must derive identical symmetric keys"

    # ---------------------------------------------------------
    # Step 4: Authenticated Encryption (AES-256-GCM)
    # ---------------------------------------------------------
    t3 = time.perf_counter()
    aesgcm = AESGCM(derived_aes_key)
    nonce = os.urandom(12) # 96-bit standard GCM nonce
    aad_bytes = associated_data.encode("utf-8")
    plaintext_bytes = plaintext_message.encode("utf-8")

    # Alice encrypts message with derived key, nonce and AAD
    ciphertext_and_tag = aesgcm.encrypt(nonce, plaintext_bytes, aad_bytes)
    timings["aes_encrypt_ms"] = round((time.perf_counter() - t3) * 1000, 3)

    # ---------------------------------------------------------
    # Step 5: Successful Decryption Verification
    # ---------------------------------------------------------
    t4 = time.perf_counter()
    aesgcm_bob = AESGCM(derived_aes_key_bob)
    decrypted_bytes = aesgcm_bob.decrypt(nonce, ciphertext_and_tag, aad_bytes)
    timings["aes_decrypt_ms"] = round((time.perf_counter() - t4) * 1000, 3)
    decrypted_text = decrypted_bytes.decode("utf-8")

    assert decrypted_text == plaintext_message, "Decrypted message must match original plaintext"

    # ---------------------------------------------------------
    # Step 6: Cryptographic Tamper Detection Test
    # ---------------------------------------------------------
    tamper_result = {}
    if simulate_tamper:
        # Flip bits in ciphertext
        tampered_ciphertext = bytearray(ciphertext_and_tag)
        tampered_ciphertext[0] ^= 0xFF
        tamper_detected = False
        tamper_exception_msg = ""
        try:
            aesgcm_bob.decrypt(nonce, bytes(tampered_ciphertext), aad_bytes)
        except InvalidTag as e:
            tamper_detected = True
            tamper_exception_msg = "InvalidTag: Authenticated GCM tag verification failed (ciphertext tampered)"

        tamper_result = {
            "tamper_simulated": True,
            "tamper_detected": tamper_detected,
            "status": "PASS: Cryptographic integrity violation successfully prevented" if tamper_detected else "FAIL: Tamper not detected",
            "exception": tamper_exception_msg
        }

    total_time_ms = round((time.perf_counter() - overall_start) * 1000, 3)

    return {
        "success": True,
        "demonstration": "X25519 + ML-KEM-768 Hybrid Key Exchange & Authenticated Encryption",
        "construction": {
            "classical_kex": "X25519 (Curve25519 ECDH, 128-bit classical security)",
            "post_quantum_kem": "ML-KEM-768 (NIST FIPS 203 Module-LWE, Category 3 / 192-bit security)",
            "key_derivation": "HKDF-SHA-256 (RFC 5869) with domain-separated salt & info",
            "authenticated_cipher": "AES-256-GCM (NIST SP 800-38D with 96-bit nonce and 128-bit auth tag)"
        },
        "quantum_security_guarantee": (
            "Dual-Security Principle: The hybrid key derivation combines X25519 and ML-KEM-768. "
            "If an adversary records ciphertext today and later runs Shor's algorithm on a quantum computer, "
            "ML-KEM-768 protects the session key. If a classical mathematical weakness were ever discovered in lattice assumptions, "
            "X25519 maintains classical protection. The session is compromise-resistant unless BOTH assumptions fail simultaneously."
        ),
        "sizes_bytes": {
            "x25519_public_key_alice": len(alice_x25519_pub.public_bytes_raw()),
            "x25519_public_key_bob": len(bob_x25519_pub.public_bytes_raw()),
            "x25519_shared_secret": len(ss_classical),
            "mlkem_encapsulation_key": len(bytes(bob_mlkem_ek)),
            "mlkem_decapsulation_key": len(bytes(bob_mlkem_dk)),
            "mlkem_ciphertext": len(bytes(mlkem_ciphertext)),
            "mlkem_shared_secret": len(ss_pqc),
            "derived_symmetric_key": len(derived_aes_key),
            "gcm_nonce": len(nonce),
            "ciphertext_and_tag": len(ciphertext_and_tag),
            "plaintext": len(plaintext_bytes)
        },
        "previews": {
            "plaintext": plaintext_message,
            "associated_data": associated_data,
            "derived_key_preview": f"{derived_aes_key[:4].hex()}...{derived_aes_key[-4:].hex()} (32 bytes / 256 bits)",
            "nonce_hex": nonce.hex(),
            "ciphertext_preview_b64": base64.b64encode(ciphertext_and_tag[:32]).decode('utf-8') + "...",
            "decrypted_plaintext": decrypted_text
        },
        "timings_ms": {
            "x25519_time": timings.get("x25519_ms", 0),
            "mlkem_time": timings.get("mlkem768_ms", 0),
            "hkdf_time": timings.get("hkdf_ms", 0),
            "aes_encryption_time": timings.get("aes_encrypt_ms", 0),
            "aes_decryption_time": timings.get("aes_decrypt_ms", 0),
            "total_execution_time": total_time_ms
        },
        "tamper_verification": tamper_result,
        "environment": get_crypto_environment_metadata()
    }

def compare_kex_modes() -> Dict[str, Any]:
    """
    Run educational benchmark comparing Classical (X25519), PQC (ML-KEM-768), and Hybrid side-by-side.
    """
    results = {}

    # 1. Classical Mode (X25519)
    t0 = time.perf_counter()
    k_a = x25519.X25519PrivateKey.generate()
    k_b = x25519.X25519PrivateKey.generate()
    ss_c = k_a.exchange(k_b.public_key())
    aes_c = AESGCM(ss_c)
    ct_c = aes_c.encrypt(os.urandom(12), b"Benchmark payload", None)
    t_classical = round((time.perf_counter() - t0) * 1000, 3)

    results["classical_x25519"] = {
        "name": "X25519 Classical ECDH",
        "standard": "RFC 7748 / Curve25519",
        "security_assumption": "Computational Diffie-Hellman (CDH) over Montgomery elliptic curve",
        "quantum_status": "VULNERABLE (Broken by Shor's algorithm via discrete logarithm polynomial solving)",
        "public_key_size_bytes": 32,
        "ciphertext_overhead_bytes": 0,
        "shared_secret_size_bytes": 32,
        "measured_time_ms": t_classical,
        "recommendation": "Migrate to Hybrid or ML-KEM to eliminate HNDL exposure."
    }

    # 2. PQC Mode (ML-KEM-768)
    if MLKEM_AVAILABLE:
        t1 = time.perf_counter()
        kem = mlkem.ML_KEM(mlkem.ParameterSet.ML_KEM_768)
        ek, dk = kem.key_gen()
        ss_p, ct_p = kem.encaps(ek)
        aes_p = AESGCM(ss_p)
        ct_enc = aes_p.encrypt(os.urandom(12), b"Benchmark payload", None)
        t_pqc = round((time.perf_counter() - t1) * 1000, 3)

        results["pqc_mlkem768"] = {
            "name": "ML-KEM-768 Pure Post-Quantum",
            "standard": "NIST FIPS 203 (Module Learning with Errors - MLWE)",
            "security_assumption": "Hardness of high-dimensional lattice Module-LWE shortest vector problems",
            "quantum_status": "SAFE (Intractable for both classical supercomputers and quantum algorithms)",
            "public_key_size_bytes": 1184,
            "ciphertext_overhead_bytes": 1088,
            "shared_secret_size_bytes": 32,
            "measured_time_ms": t_pqc,
            "recommendation": "Target standard for pure post-quantum PKI and key exchange."
        }

        # 3. Hybrid Mode (X25519 + ML-KEM-768)
        demo = run_hybrid_key_exchange_demo(simulate_tamper=False)
        results["hybrid_x25519_mlkem768"] = {
            "name": "X25519 + ML-KEM-768 Dual Hybrid",
            "standard": "IETF Draft-Hybrid KEX / NIST FIPS 203 & RFC 7748",
            "security_assumption": "Dual Assumption: CDH over Curve25519 + Lattice Module-LWE via HKDF-SHA-256",
            "quantum_status": "POST-QUANTUM RESILIENT (Combines classical compliance with quantum HNDL immunity)",
            "public_key_size_bytes": 1184 + 32,
            "ciphertext_overhead_bytes": 1088,
            "shared_secret_size_bytes": 32,
            "measured_time_ms": demo.get("timings_ms", {}).get("total_execution_time", 0),
            "recommendation": "Recommended immediate migration standard for TLS 1.3 and enterprise APIs."
        }
    else:
        results["pqc_mlkem768"] = {
            "name": "ML-KEM-768 (Unavailable)",
            "status": "UNAVAILABLE",
            "error": "ML-KEM library not installed. Install via: pip install mlkem"
        }
        results["hybrid_x25519_mlkem768"] = {
            "name": "Hybrid X25519 + ML-KEM-768 (Unavailable)",
            "status": "UNAVAILABLE",
            "error": "ML-KEM library not installed. Install via: pip install mlkem"
        }

    return results
