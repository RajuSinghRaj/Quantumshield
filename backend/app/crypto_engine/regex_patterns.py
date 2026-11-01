import re
from typing import List, Dict, Any

# Pattern definitions: (Regex, Algorithm, Variant, KeySize, Usage, Confidence, Library)
CRYPTO_PATTERNS = [
    # ------------------ POST-QUANTUM ALGORITHMS ------------------
    (r'\bML-KEM(?:-512|-768|-1024)?\b|\bKyber(?:512|768|1024)?\b', "ML-KEM", "ML-KEM-768", 768, "KEY_EXCHANGE", 0.95, "NIST PQC (FIPS 203)"),
    (r'\bML-DSA(?:-44|-65|-87)?\b|\bDilithium(?:2|3|5)?\b', "ML-DSA", "ML-DSA-65", 65, "DIGITAL_SIGNATURE", 0.95, "NIST PQC (FIPS 204)"),
    (r'\bSLH-DSA(?:-SHA2|-SHAKE)?\b|\bSPHINCS\+\b', "SLH-DSA", "SLH-DSA-128f", 128, "DIGITAL_SIGNATURE", 0.95, "NIST PQC (FIPS 205)"),

    # ------------------ ASYMMETRIC / PUBLIC KEY PATTERNS ------------------
    (r'\bRSA-(?:512|1024|2048|3072|4096)\b|\bRSA_(?:512|1024|2048|3072|4096)\b', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.95, "Standard RSA"),
    (r'\b(?:algorithm|cipher|signature|kpg|key_gen|public_key)\s*[:=]\s*["\']?RSA["\']?', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.9, "Generic RSA Config"),
    (r'\bSHA(?:1|256|384|512)withRSA\b', "RSA", "RSA-2048", 2048, "DIGITAL_SIGNATURE", 0.95, "Java / X.509 RSA Signature"),
    (r'\bECDSA\b|\bsecp256r1\b|\bP-256\b|\bprime256v1\b', "ECDSA", "ECDSA P-256", 256, "DIGITAL_SIGNATURE", 0.9, "NIST P-256 (secp256r1)"),
    (r'\bsecp384r1\b|\bP-384\b', "ECDSA", "ECDSA P-384", 384, "DIGITAL_SIGNATURE", 0.95, "NIST P-384 (secp384r1)"),
    (r'\bsecp521r1\b|\bP-521\b', "ECDSA", "ECDSA P-521", 521, "DIGITAL_SIGNATURE", 0.95, "NIST P-521 (secp521r1)"),
    (r'\bsecp256k1\b', "ECDSA", "ECDSA secp256k1", 256, "DIGITAL_SIGNATURE", 0.95, "Koblitz secp256k1"),
    (r'\bECDH\b', "ECDH", "ECDH P-256", 256, "KEY_EXCHANGE", 0.9, "Elliptic Curve Diffie-Hellman"),
    (r'\bX25519\b|\bCurve25519\b', "X25519", "X25519", 256, "KEY_EXCHANGE", 0.95, "RFC 7748 X25519"),
    (r'\bEd25519\b', "Ed25519", "Ed25519", 256, "DIGITAL_SIGNATURE", 0.95, "RFC 8032 Ed25519"),
    (r'\bDiffie-Hellman\b|\bDiffieHellman\b|\bDHE\b|\bFFDHE-(?:2048|3072|4096)\b', "Diffie-Hellman", "DH-2048", 2048, "KEY_EXCHANGE", 0.9, "Finite Field Diffie-Hellman"),
    (r'\b(?:algorithm|sig_alg)\s*[:=]\s*["\']?DSA["\']?|\bDSA-(?:1024|2048)\b', "DSA", "DSA-2048", 2048, "DIGITAL_SIGNATURE", 0.9, "Digital Signature Algorithm"),

    # ------------------ SYMMETRIC CIPHERS ------------------
    (r'\bAES-(?:128|192|256)-(?:GCM|CBC|CTR|ECB)\b|\bAES_(?:128|192|256)_(?:GCM|CBC|CTR|ECB)\b', "AES", "AES-256-GCM", 256, "ENCRYPTION", 0.95, "AES Block Cipher"),
    (r'\b(?:cipher|encryption)\s*[:=]\s*["\']?AES["\']?', "AES", "AES-256-GCM", 256, "ENCRYPTION", 0.85, "AES Config"),
    (r'\bChaCha20-Poly1305\b|\bChaCha20_Poly1305\b', "ChaCha20", "ChaCha20-Poly1305", 256, "ENCRYPTION", 0.95, "RFC 8439 ChaCha20-Poly1305"),
    (r'\bChaCha20\b', "ChaCha20", "ChaCha20", 256, "ENCRYPTION", 0.85, "ChaCha20 Stream Cipher"),
    (r'\b3DES\b|\bTripleDES\b|\bDES-EDE3\b|\bDES_EDE3\b', "3DES", "3DES", 168, "ENCRYPTION", 0.9, "Triple DES (EDE3)"),
    (r'\bDES-CBC\b|\bDES-ECB\b|\bDES_CBC\b|\bcipher\s*[:=]\s*["\']?DES["\']?', "DES", "DES", 56, "ENCRYPTION", 0.85, "DES Block Cipher"),

    # ------------------ HASHES & HMAC ------------------
    (r'\bHMAC-SHA(?:256|384|512|1)\b|\bHmacSHA(?:256|384|512|1)\b|\bHMAC-MD5\b', "HMAC", "HMAC-SHA256", 256, "MESSAGE_AUTHENTICATION", 0.95, "HMAC Authenticator"),
    (r'\bSHA-256\b|\bSHA256\b', "SHA-256", "SHA-256", 256, "HASHING", 0.9, "SHA-2 Family"),
    (r'\bSHA-384\b|\bSHA384\b', "SHA-384", "SHA-384", 384, "HASHING", 0.9, "SHA-2 Family"),
    (r'\bSHA-512\b|\bSHA512\b', "SHA-512", "SHA-512", 512, "HASHING", 0.9, "SHA-2 Family"),
    (r'\bSHA-1\b|\bSHA1\b', "SHA-1", "SHA-1", 160, "HASHING", 0.85, "SHA-1 (Deprecated)"),
    (r'\bMD5\b', "MD5", "MD5", 128, "HASHING", 0.85, "MD5 (Broken)"),

    # ------------------ PASSWORD HASHING / KDF ------------------
    (r'\bPBKDF2\b', "PBKDF2", "PBKDF2", 256, "PASSWORD_HASHING", 0.9, "PBKDF2 Key Derivation"),
    (r'\bbcrypt\b', "bcrypt", "bcrypt", 256, "PASSWORD_HASHING", 0.9, "bcrypt Password Hash"),
    (r'\bArgon2id\b|\bArgon2\b', "Argon2", "Argon2", 256, "PASSWORD_HASHING", 0.9, "Argon2 Password Hash"),
    (r'\bscrypt\b', "scrypt", "scrypt", 256, "PASSWORD_HASHING", 0.9, "scrypt Password Hash"),
]

def refine_usage_from_context(code_snippet: str, default_usage: str) -> str:
    """Determine contextual usage from code text surrounding the match."""
    snippet_lower = code_snippet.lower()

    if "encrypt" in snippet_lower or "cipher" in snippet_lower or "seal" in snippet_lower:
        return "ENCRYPTION"
    if "decrypt" in snippet_lower or "unseal" in snippet_lower or "open" in snippet_lower:
        return "DECRYPTION"
    if "sign" in snippet_lower or "signature" in snippet_lower or "verify" in snippet_lower:
        return "DIGITAL_SIGNATURE"
    if "keyexchange" in snippet_lower or "handshake" in snippet_lower or "ecdh" in snippet_lower or "dh" in snippet_lower or "agree" in snippet_lower or "x25519" in snippet_lower:
        return "KEY_EXCHANGE"
    if "hmac" in snippet_lower or "mac" in snippet_lower:
        return "MESSAGE_AUTHENTICATION"
    if "digest" in snippet_lower or "hash" in snippet_lower:
        return "HASHING"
    if "password" in snippet_lower or "pwd" in snippet_lower or "auth" in snippet_lower:
        return "PASSWORD_HASHING"
    if "generate" in snippet_lower or "keygen" in snippet_lower or "newkey" in snippet_lower:
        return "KEY_GEN"

    if default_usage and default_usage != "UNKNOWN":
        return default_usage

    return "Usage could not be determined."

def is_comment_line(line: str) -> bool:
    """Check if the entire line is a comment or documentation."""
    line_clean = line.strip()
    if not line_clean:
        return True
    if line_clean.startswith("//") or line_clean.startswith("#") or line_clean.startswith(";") or line_clean.startswith("*") or line_clean.startswith("/*"):
        return True
    if line_clean.startswith('"""') or line_clean.startswith("'''"):
        return True
    return False

def scan_text_with_regex(lines: List[str], file_path: str) -> List[Dict[str, Any]]:
    """Scan line-by-line using compiled regex patterns with comment & secret filtering."""
    findings = []

    for idx, line in enumerate(lines):
        line_no = idx + 1
        line_clean = line.strip()

        # Strictly ignore comment lines to avoid false positives
        if is_comment_line(line_clean):
            continue

        for pattern, algo, variant, default_key_size, default_usage, confidence, library in CRYPTO_PATTERNS:
            match = re.search(pattern, line_clean, re.IGNORECASE)
            if match:
                # Refine variant and key size from exact match
                matched_str = match.group(0).upper()
                key_size = default_key_size
                final_variant = variant

                if algo == "RSA":
                    for size in [4096, 3072, 2048, 1024, 512]:
                        if str(size) in line_clean:
                            key_size = size
                            final_variant = f"RSA-{size}"
                            break

                elif algo == "AES":
                    if "128" in line_clean:
                        key_size = 128
                        final_variant = "AES-128-GCM" if "GCM" in line_clean else ("AES-128-CBC" if "CBC" in line_clean else "AES-128")
                    elif "192" in line_clean:
                        key_size = 192
                        final_variant = "AES-192-GCM" if "GCM" in line_clean else "AES-192"
                    elif "256" in line_clean:
                        key_size = 256
                        final_variant = "AES-256-GCM" if "GCM" in line_clean else ("AES-256-CBC" if "CBC" in line_clean else "AES-256")

                elif algo == "HMAC":
                    if "512" in line_clean:
                        final_variant = "HMAC-SHA512"
                        key_size = 512
                    elif "384" in line_clean:
                        final_variant = "HMAC-SHA384"
                        key_size = 384
                    elif "1" in line_clean and "SHA1" in line_clean.upper():
                        final_variant = "HMAC-SHA1"
                        key_size = 160
                    elif "MD5" in line_clean.upper():
                        final_variant = "HMAC-MD5"
                        key_size = 128

                usage = refine_usage_from_context(line_clean, default_usage)

                findings.append({
                    "algorithm": algo,
                    "variant": final_variant,
                    "key_size": key_size,
                    "curve_or_parameters": final_variant.split("-")[-1] if "-" in final_variant else str(key_size),
                    "usage": usage,
                    "library_or_api": library,
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": line_clean,
                    "confidence": confidence,
                    "detection_method": "Regex Pattern Matching",
                    "source": "Regex Engine"
                })
                break # Avoid duplicate hits on same line for same algorithm

    return findings
