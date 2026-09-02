import re
from typing import List, Dict, Any

# Pattern definitions: (Regex, Algorithm, Variant, KeySize, Usage, Confidence)
CRYPTO_PATTERNS = [
    # ------------------ POST-QUANTUM ALGORITHMS ------------------
    (r'\bML-KEM(?:-512|-768|-1024)?\b|\bKyber(?:512|768|1024)?\b', "ML-KEM", "ML-KEM-768", 768, "KEY_EXCHANGE", 1.0),
    (r'\bML-DSA(?:-44|-65|-87)?\b|\bDilithium(?:2|3|5)?\b', "ML-DSA", "ML-DSA-65", 65, "DIGITAL_SIGNATURE", 1.0),
    (r'\bSLH-DSA(?:-SHA2|-SHAKE)?\b|\bSPHINCS\+\b', "SLH-DSA", "SLH-DSA-128f", 128, "DIGITAL_SIGNATURE", 1.0),
    
    # ------------------ JAVA API PATTERNS ------------------
    (r'Cipher\.getInstance\s*\(\s*["\']RSA/([^"\']+)["\']\s*\)', "RSA", "RSA", 2048, "ENCRYPTION", 0.95),
    (r'Cipher\.getInstance\s*\(\s*["\']AES/([^"\']+)["\']\s*\)', "AES", "AES", 256, "ENCRYPTION", 0.95),
    (r'Cipher\.getInstance\s*\(\s*["\']DES/([^"\']+)["\']\s*\)', "DES", "DES", 56, "ENCRYPTION", 0.95),
    (r'Cipher\.getInstance\s*\(\s*["\']DESede/([^"\']+)["\']\s*\)', "3DES", "3DES", 168, "ENCRYPTION", 0.95),
    (r'KeyPairGenerator\.getInstance\s*\(\s*["\']RSA["\']\s*\)', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.95),
    (r'KeyPairGenerator\.getInstance\s*\(\s*["\']EC["\']\s*\)', "ECDSA", "ECDSA P-256", 256, "KEY_GEN", 0.95),
    (r'KeyPairGenerator\.getInstance\s*\(\s*["\']DSA["\']\s*\)', "DSA", "DSA-2048", 2048, "KEY_GEN", 0.95),
    (r'Signature\.getInstance\s*\(\s*["\']([^"\']*RSA[^"\']*)["\']\s*\)', "RSA", "RSA-Signature", 2048, "DIGITAL_SIGNATURE", 0.9),
    (r'Signature\.getInstance\s*\(\s*["\']([^"\']*ECDSA[^"\']*)["\']\s*\)', "ECDSA", "ECDSA P-256", 256, "DIGITAL_SIGNATURE", 0.9),
    (r'MessageDigest\.getInstance\s*\(\s*["\']MD5["\']\s*\)', "MD5", "MD5", 0, "HASHING", 0.95),
    (r'MessageDigest\.getInstance\s*\(\s*["\']SHA-1["\']\s*\)', "SHA-1", "SHA-1", 160, "HASHING", 0.95),
    (r'MessageDigest\.getInstance\s*\(\s*["\']SHA-256["\']\s*\)', "SHA-256", "SHA-256", 256, "HASHING", 0.95),
    (r'KeyAgreement\.getInstance\s*\(\s*["\']ECDH["\']\s*\)', "ECDH", "ECDH P-256", 256, "KEY_EXCHANGE", 0.95),

    # ------------------ NODE.JS API PATTERNS ------------------
    (r'crypto\.createCipheriv\s*\(\s*["\']aes-128-cbc["\']', "AES", "AES-128-CBC", 128, "ENCRYPTION", 0.95),
    (r'crypto\.createCipheriv\s*\(\s*["\']aes-256-gcm["\']', "AES", "AES-256-GCM", 256, "ENCRYPTION", 0.95),
    (r'crypto\.createCipheriv\s*\(\s*["\']aes-256-cbc["\']', "AES", "AES-256-CBC", 256, "ENCRYPTION", 0.95),
    (r'crypto\.createCipheriv\s*\(\s*["\']des-ecb["\']', "DES", "DES", 56, "ENCRYPTION", 0.95),
    (r'crypto\.createHash\s*\(\s*["\']md5["\']', "MD5", "MD5", 0, "HASHING", 0.95),
    (r'crypto\.createHash\s*\(\s*["\']sha1["\']', "SHA-1", "SHA-1", 160, "HASHING", 0.95),
    (r'crypto\.createHash\s*\(\s*["\']sha256["\']', "SHA-256", "SHA-256", 256, "HASHING", 0.95),
    (r'crypto\.generateKeyPair\s*\(\s*["\']rsa["\']', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.95),
    (r'crypto\.generateKeyPair\s*\(\s*["\']ec["\']', "ECDSA", "ECDSA P-256", 256, "KEY_GEN", 0.95),

    # ------------------ GO API PATTERNS ------------------
    (r'rsa\.GenerateKey\s*\(', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.95),
    (r'ecdsa\.GenerateKey\s*\(', "ECDSA", "ECDSA P-256", 256, "KEY_GEN", 0.95),
    (r'aes\.NewCipher\s*\(', "AES", "AES-256", 256, "ENCRYPTION", 0.9),
    (r'sha256\.New\s*\(', "SHA-256", "SHA-256", 256, "HASHING", 0.95),
    (r'md5\.New\s*\(', "MD5", "MD5", 0, "HASHING", 0.95),
    (r'sha1\.New\s*\(', "SHA-1", "SHA-1", 160, "HASHING", 0.95),

    # ------------------ C / C++ OPENSSL PATTERNS ------------------
    (r'\bEVP_aes_256_gcm\s*\(', "AES", "AES-256-GCM", 256, "ENCRYPTION", 0.95),
    (r'\bEVP_aes_128_cbc\s*\(', "AES", "AES-128-CBC", 128, "ENCRYPTION", 0.95),
    (r'\bEVP_des_ede3_cbc\s*\(', "3DES", "3DES", 168, "ENCRYPTION", 0.95),
    (r'\bRSA_generate_key_ex\s*\(', "RSA", "RSA-2048", 2048, "KEY_GEN", 0.95),
    (r'\bEVP_md5\s*\(', "MD5", "MD5", 0, "HASHING", 0.95),
    (r'\bEVP_sha1\s*\(', "SHA-1", "SHA-1", 160, "HASHING", 0.95),
    (r'\bEVP_sha256\s*\(', "SHA-256", "SHA-256", 256, "HASHING", 0.95),

    # ------------------ GENERIC / KEYWORD DETECTIONS ------------------
    (r'\bRSA-4096\b|\bRSA_4096\b', "RSA", "RSA-4096", 4096, "UNKNOWN", 0.85),
    (r'\bRSA-2048\b|\bRSA_2048\b', "RSA", "RSA-2048", 2048, "UNKNOWN", 0.85),
    (r'\bRSA-1024\b|\bRSA_1024\b', "RSA", "RSA-1024", 1024, "UNKNOWN", 0.85),
    (r'\bRSA-512\b|\bRSA_512\b', "RSA", "RSA-512", 512, "UNKNOWN", 0.85),
    (r'\bECDSA\b|\bsecp256r1\b|\bP-256\b', "ECDSA", "ECDSA P-256", 256, "UNKNOWN", 0.8),
    (r'\bECDH\b|\bX25519\b', "ECDH", "ECDH P-256", 256, "KEY_EXCHANGE", 0.85),
    (r'\bChaCha20-Poly1305\b|\bChaCha20\b', "ChaCha20", "ChaCha20-Poly1305", 256, "ENCRYPTION", 0.85),
    (r'\bAES-256-GCM\b|\bAES_256_GCM\b', "AES", "AES-256-GCM", 256, "ENCRYPTION", 0.9),
    (r'\bAES-128-GCM\b|\bAES_128_GCM\b', "AES", "AES-128-GCM", 128, "ENCRYPTION", 0.9),
    (r'\bAES-256-CBC\b|\bAES_256_CBC\b', "AES", "AES-256-CBC", 256, "ENCRYPTION", 0.9),
    (r'\b3DES\b|\bTripleDES\b|\bDES-EDE3\b', "3DES", "3DES", 168, "ENCRYPTION", 0.85),
    (r'\bDES\b', "DES", "DES", 56, "ENCRYPTION", 0.75),
    (r'\bMD5\b', "MD5", "MD5", 0, "HASHING", 0.8),
    (r'\bSHA-1\b|\bSHA1\b', "SHA-1", "SHA-1", 160, "HASHING", 0.8),
    (r'\bSHA-256\b|\bSHA256\b', "SHA-256", "SHA-256", 256, "HASHING", 0.8),
    (r'\bSHA-512\b|\bSHA512\b', "SHA-512", "SHA-512", 512, "HASHING", 0.8),
    (r'\bPBKDF2\b', "PBKDF2", "PBKDF2", 256, "PASSWORD_HASHING", 0.85),
    (r'\bbcrypt\b', "bcrypt", "bcrypt", 256, "PASSWORD_HASHING", 0.85),
    (r'\bArgon2\b|\bArgon2id\b', "Argon2", "Argon2", 256, "PASSWORD_HASHING", 0.85),
    (r'\bscrypt\b', "scrypt", "scrypt", 256, "PASSWORD_HASHING", 0.85),
]

def refine_usage_from_context(code_snippet: str, default_usage: str) -> str:
    """Determine contextual usage from code text surrounding the match."""
    snippet_lower = code_snippet.lower()
    
    if "encrypt" in snippet_lower or "cipher" in snippet_lower or "seal" in snippet_lower:
        return "ENCRYPTION"
    if "decrypt" in snippet_lower or "unseal" in snippet_lower or "open" in snippet_lower:
        return "DECRYPTION"
    if "sign" in snippet_lower or "signature" in snippet_lower:
        return "DIGITAL_SIGNATURE"
    if "verify" in snippet_lower:
        return "DIGITAL_SIGNATURE"
    if "keyexchange" in snippet_lower or "handshake" in snippet_lower or "ecdh" in snippet_lower or "dh" in snippet_lower or "agree" in snippet_lower:
        return "KEY_EXCHANGE"
    if "digest" in snippet_lower or "hash" in snippet_lower:
        return "HASHING"
    if "password" in snippet_lower or "pwd" in snippet_lower or "auth" in snippet_lower:
        return "PASSWORD_HASHING"
    if "generate" in snippet_lower or "keygen" in snippet_lower or "newkey" in snippet_lower:
        return "KEY_GEN"
        
    if default_usage and default_usage != "UNKNOWN":
        return default_usage
        
    return "Usage could not be determined."

def scan_text_with_regex(lines: List[str], file_path: str) -> List[Dict[str, Any]]:
    """Scan line-by-line using compiled regex patterns."""
    findings = []
    
    for idx, line in enumerate(lines):
        line_no = idx + 1
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("//") or line_clean.startswith("#") or line_clean.startswith("/*"):
            # Skip pure comments if they are not mentioning PQC / specific algorithms
            if not any(pqc in line_clean for pqc in ["ML-KEM", "ML-DSA", "SLH-DSA", "RSA", "AES"]):
                continue

        for pattern, algo, variant, default_key_size, default_usage, confidence in CRYPTO_PATTERNS:
            match = re.search(pattern, line_clean, re.IGNORECASE)
            if match:
                # Refine key size from match if present e.g. RSA-2048 vs RSA-4096
                key_size = default_key_size
                if algo == "RSA":
                    if "4096" in line_clean:
                        key_size = 4096
                        variant = "RSA-4096"
                    elif "1024" in line_clean:
                        key_size = 1024
                        variant = "RSA-1024"
                    elif "512" in line_clean:
                        key_size = 512
                        variant = "RSA-512"
                    elif "2048" in line_clean:
                        key_size = 2048
                        variant = "RSA-2048"

                usage = refine_usage_from_context(line_clean, default_usage)

                findings.append({
                    "algorithm": algo,
                    "variant": variant,
                    "key_size": key_size,
                    "usage": usage,
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": line_clean,
                    "confidence": confidence,
                    "source": "Regex Engine"
                })
                break # Avoid duplicate hits on the same line for the same algorithm

    return findings
