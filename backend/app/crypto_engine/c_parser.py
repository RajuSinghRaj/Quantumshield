import re
from typing import List, Dict, Any

def mask_secrets(snippet: str) -> str:
    """Mask obvious passwords, tokens and secrets in C/C++ snippets."""
    snippet = re.sub(r'(["\'])(?:(?:password|secret|token|apiKey|privateKey)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])',
                     r'\1[REDACTED_SECRET]\3', snippet, flags=re.IGNORECASE)
    return snippet

def strip_c_comments(code: str) -> List[tuple[int, str]]:
    """Return list of (line_number, stripped_code_line) without comments."""
    lines = code.splitlines()
    cleaned_lines = []
    in_multiline_comment = False

    for idx, line in enumerate(lines):
        line_num = idx + 1
        processed = ""
        i = 0
        n = len(line)

        while i < n:
            if in_multiline_comment:
                end_idx = line.find("*/", i)
                if end_idx != -1:
                    in_multiline_comment = False
                    i = end_idx + 2
                else:
                    break
            else:
                if line[i:i+2] == "//":
                    break
                elif line[i:i+2] == "/*":
                    end_idx = line.find("*/", i + 2)
                    if end_idx != -1:
                        i = end_idx + 2
                    else:
                        in_multiline_comment = True
                        break
                else:
                    processed += line[i]
                    i += 1

        cleaned_lines.append((line_num, processed.strip()))

    return cleaned_lines

def analyze_c_cpp(code_content: str, file_path: str) -> List[Dict[str, Any]]:
    """Inspect C and C++ source code for OpenSSL, libsodium, and liboqs cryptographic APIs."""
    cleaned_lines = strip_c_comments(code_content)
    raw_lines = code_content.splitlines()
    findings: List[Dict[str, Any]] = []

    for line_no, line in cleaned_lines:
        if not line:
            continue

        raw_snippet = raw_lines[line_no - 1].strip() if 1 <= line_no <= len(raw_lines) else line
        snippet = mask_secrets(raw_snippet)

        # 1. OpenSSL Ciphers (EVP_aes_..., EVP_des_..., EVP_chacha20_...)
        if "EVP_aes_" in line:
            variant = "AES-256-GCM"
            key_size = 256
            if "128_gcm" in line:
                variant = "AES-128-GCM"
                key_size = 128
            elif "128_cbc" in line:
                variant = "AES-128-CBC"
                key_size = 128
            elif "256_cbc" in line:
                variant = "AES-256-CBC"
                key_size = 256
            elif "192" in line:
                variant = "AES-192-GCM"
                key_size = 192

            findings.append({
                "algorithm": "AES",
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": variant.split("-")[-1],
                "usage": "ENCRYPTION",
                "library_or_api": "OpenSSL libcrypto (EVP)",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_des_ede3" in line or "EVP_des_ede" in line:
            findings.append({
                "algorithm": "3DES",
                "variant": "3DES",
                "key_size": 168,
                "curve_or_parameters": "EDE3",
                "usage": "ENCRYPTION",
                "library_or_api": "OpenSSL libcrypto (EVP)",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_des_cbc" in line or "EVP_des_ecb" in line:
            findings.append({
                "algorithm": "DES",
                "variant": "DES",
                "key_size": 56,
                "curve_or_parameters": "56-bit DES",
                "usage": "ENCRYPTION",
                "library_or_api": "OpenSSL libcrypto (EVP)",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_chacha20_poly1305" in line:
            findings.append({
                "algorithm": "ChaCha20",
                "variant": "ChaCha20-Poly1305",
                "key_size": 256,
                "curve_or_parameters": "Poly1305 AEAD",
                "usage": "ENCRYPTION",
                "library_or_api": "OpenSSL libcrypto (EVP)",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        # 2. OpenSSL Asymmetric (RSA, EC, X25519, Ed25519, DH)
        elif "RSA_generate_key" in line or 'EVP_PKEY_Q_keygen(NULL, NULL, "RSA"' in line or ("EVP_PKEY_RSA" in line and "keygen" in line.lower()):
            key_size = 2048
            if "4096" in line:
                key_size = 4096
            elif "1024" in line:
                key_size = 1024

            findings.append({
                "algorithm": "RSA",
                "variant": f"RSA-{key_size}",
                "key_size": key_size,
                "curve_or_parameters": f"{key_size}-bit modulus",
                "usage": "KEY_GEN",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EC_KEY_new_by_curve_name" in line or "EVP_PKEY_EC" in line:
            findings.append({
                "algorithm": "ECDSA",
                "variant": "ECDSA P-256",
                "key_size": 256,
                "curve_or_parameters": "NID_X9_62_prime256v1",
                "usage": "KEY_GEN",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_PKEY_X25519" in line:
            findings.append({
                "algorithm": "X25519",
                "variant": "X25519",
                "key_size": 256,
                "curve_or_parameters": "Curve25519",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_PKEY_ED25519" in line:
            findings.append({
                "algorithm": "Ed25519",
                "variant": "Ed25519",
                "key_size": 256,
                "curve_or_parameters": "edwards25519",
                "usage": "DIGITAL_SIGNATURE",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_PKEY_DH" in line or "DH_generate_parameters" in line:
            findings.append({
                "algorithm": "Diffie-Hellman",
                "variant": "DH-2048",
                "key_size": 2048,
                "curve_or_parameters": "DH 2048-bit MODP",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        # 3. Hashes and HMAC
        elif "HMAC(" in line or "HMAC_Init" in line or "EVP_MAC_init" in line:
            var_name = "HMAC-SHA256"
            k_size = 256
            if "sha512" in line.lower():
                var_name = "HMAC-SHA512"
                k_size = 512
            elif "sha1" in line.lower():
                var_name = "HMAC-SHA1"
                k_size = 160
            elif "md5" in line.lower():
                var_name = "HMAC-MD5"
                k_size = 128

            findings.append({
                "algorithm": "HMAC",
                "variant": var_name,
                "key_size": k_size,
                "curve_or_parameters": var_name.split("-")[-1],
                "usage": "MESSAGE_AUTHENTICATION",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_sha256(" in line or "SHA256(" in line:
            findings.append({
                "algorithm": "SHA-256",
                "variant": "SHA-256",
                "key_size": 256,
                "curve_or_parameters": "256-bit digest",
                "usage": "HASHING",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_sha512(" in line or "SHA512(" in line:
            findings.append({
                "algorithm": "SHA-512",
                "variant": "SHA-512",
                "key_size": 512,
                "curve_or_parameters": "512-bit digest",
                "usage": "HASHING",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_sha1(" in line or "SHA1(" in line:
            findings.append({
                "algorithm": "SHA-1",
                "variant": "SHA-1",
                "key_size": 160,
                "curve_or_parameters": "160-bit digest",
                "usage": "HASHING",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        elif "EVP_md5(" in line or "MD5(" in line:
            findings.append({
                "algorithm": "MD5",
                "variant": "MD5",
                "key_size": 128,
                "curve_or_parameters": "128-bit digest",
                "usage": "HASHING",
                "library_or_api": "OpenSSL libcrypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

        # 4. Post-Quantum (liboqs C API)
        elif "OQS_KEM_new" in line or "OQS_SIG_new" in line or any(pqc in line for pqc in ["ML_KEM", "ML_DSA", "SLH_DSA", "ml_kem", "ml_dsa", "kyber", "dilithium"]):
            algo = "ML-KEM"
            variant = "ML-KEM-768"
            k_size = 768
            usage = "KEY_EXCHANGE"

            if any(s in line for s in ["SIG", "DSA", "dilithium"]):
                algo = "ML-DSA"
                variant = "ML-DSA-65"
                k_size = 65
                usage = "DIGITAL_SIGNATURE"
            elif any(s in line for s in ["SLH", "sphincs"]):
                algo = "SLH-DSA"
                variant = "SLH-DSA-128f"
                k_size = 128
                usage = "DIGITAL_SIGNATURE"

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": k_size,
                "curve_or_parameters": "Module-LWE Lattice",
                "usage": usage,
                "library_or_api": "Open Quantum Safe (liboqs)",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "C/C++ Source Parser",
                "source": "C/C++ Parser"
            })

    return findings
