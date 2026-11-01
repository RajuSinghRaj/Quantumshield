import re
from typing import List, Dict, Any

def mask_secrets(snippet: str) -> str:
    """Mask obvious passwords, tokens and secrets in Go snippets."""
    snippet = re.sub(r'(["\'])(?:(?:password|secret|token|apiKey|privateKey)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])',
                     r'\1[REDACTED_SECRET]\3', snippet, flags=re.IGNORECASE)
    snippet = re.sub(r'\[\]byte\{[^}]{20,}\}', '[]byte{[REDACTED_KEY_BYTES]}', snippet)
    return snippet

def strip_go_comments(code: str) -> List[tuple[int, str]]:
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

def analyze_go(code_content: str, file_path: str) -> List[Dict[str, Any]]:
    """Inspect Go source files for standard crypto package usage."""
    cleaned_lines = strip_go_comments(code_content)
    raw_lines = code_content.splitlines()
    findings: List[Dict[str, Any]] = []

    for line_no, line in cleaned_lines:
        if not line:
            continue

        raw_snippet = raw_lines[line_no - 1].strip() if 1 <= line_no <= len(raw_lines) else line
        snippet = mask_secrets(raw_snippet)

        # 1. RSA
        if "rsa.GenerateKey" in line or "rsa.GenerateMultiPrimeKey" in line or "rsa.EncryptOAEP" in line or "rsa.SignPSS" in line:
            key_size = 2048
            if "4096" in line:
                key_size = 4096
            elif "1024" in line:
                key_size = 1024

            usage = "KEY_GEN"
            if "Encrypt" in line:
                usage = "ENCRYPTION"
            elif "Sign" in line:
                usage = "DIGITAL_SIGNATURE"

            findings.append({
                "algorithm": "RSA",
                "variant": f"RSA-{key_size}",
                "key_size": key_size,
                "curve_or_parameters": f"{key_size}-bit modulus",
                "usage": usage,
                "library_or_api": "crypto/rsa",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        # 2. ECDSA & ECDH
        elif "ecdsa.GenerateKey" in line or "elliptic.P256()" in line or "elliptic.P384()" in line or "elliptic.P521()" in line:
            curve_name = "P-256 (secp256r1)"
            variant = "ECDSA P-256"
            key_size = 256
            if "P384" in line:
                curve_name = "P-384"
                variant = "ECDSA P-384"
                key_size = 384
            elif "P521" in line:
                curve_name = "P-521"
                variant = "ECDSA P-521"
                key_size = 521

            findings.append({
                "algorithm": "ECDSA",
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": curve_name,
                "usage": "DIGITAL_SIGNATURE" if "Sign" in line else "KEY_GEN",
                "library_or_api": "crypto/ecdsa",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "ecdh.P256" in line or "ecdh.X25519" in line:
            is_x25519 = "X25519" in line
            findings.append({
                "algorithm": "X25519" if is_x25519 else "ECDH",
                "variant": "X25519" if is_x25519 else "ECDH P-256",
                "key_size": 256,
                "curve_or_parameters": "Curve25519" if is_x25519 else "P-256",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "crypto/ecdh",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "ed25519.GenerateKey" in line or "ed25519.Sign" in line:
            findings.append({
                "algorithm": "Ed25519",
                "variant": "Ed25519",
                "key_size": 256,
                "curve_or_parameters": "edwards25519",
                "usage": "DIGITAL_SIGNATURE",
                "library_or_api": "crypto/ed25519",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        # 3. Symmetric Ciphers: AES, DES, 3DES, ChaCha20
        elif "aes.NewCipher" in line or "cipher.NewGCM" in line:
            variant = "AES-256-GCM" if "NewGCM" in line else "AES-256"
            key_size = 256
            if "128" in line:
                variant = variant.replace("256", "128")
                key_size = 128

            findings.append({
                "algorithm": "AES",
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": "GCM" if "NewGCM" in line else "Block Cipher",
                "usage": "ENCRYPTION",
                "library_or_api": "crypto/aes",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "des.NewTripleDESCipher" in line:
            findings.append({
                "algorithm": "3DES",
                "variant": "3DES",
                "key_size": 168,
                "curve_or_parameters": "EDE3",
                "usage": "ENCRYPTION",
                "library_or_api": "crypto/des",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "des.NewCipher" in line and "Triple" not in line:
            findings.append({
                "algorithm": "DES",
                "variant": "DES",
                "key_size": 56,
                "curve_or_parameters": "56-bit DES",
                "usage": "ENCRYPTION",
                "library_or_api": "crypto/des",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "chacha20poly1305.New" in line:
            findings.append({
                "algorithm": "ChaCha20",
                "variant": "ChaCha20-Poly1305",
                "key_size": 256,
                "curve_or_parameters": "Poly1305 Authenticator",
                "usage": "ENCRYPTION",
                "library_or_api": "golang.org/x/crypto/chacha20poly1305",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        # 4. Hashes and HMAC
        elif "hmac.New" in line:
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
                "library_or_api": "crypto/hmac",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "sha256.New" in line or "sha256.Sum256" in line:
            findings.append({
                "algorithm": "SHA-256",
                "variant": "SHA-256",
                "key_size": 256,
                "curve_or_parameters": "256-bit digest",
                "usage": "HASHING",
                "library_or_api": "crypto/sha256",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "sha512.New" in line or "sha512.Sum512" in line:
            findings.append({
                "algorithm": "SHA-512",
                "variant": "SHA-512",
                "key_size": 512,
                "curve_or_parameters": "512-bit digest",
                "usage": "HASHING",
                "library_or_api": "crypto/sha512",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "sha1.New" in line:
            findings.append({
                "algorithm": "SHA-1",
                "variant": "SHA-1",
                "key_size": 160,
                "curve_or_parameters": "160-bit digest",
                "usage": "HASHING",
                "library_or_api": "crypto/sha1",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        elif "md5.New" in line:
            findings.append({
                "algorithm": "MD5",
                "variant": "MD5",
                "key_size": 128,
                "curve_or_parameters": "128-bit digest",
                "usage": "HASHING",
                "library_or_api": "crypto/md5",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

        # 5. Post-Quantum Go (Cloudflare CIRCL / ML-KEM)
        elif any(pqc in line for pqc in ["circl/kem", "circl/sign", "kyber768", "dilithium3", "mlkem", "mldsa"]):
            algo = "ML-KEM"
            variant = "ML-KEM-768"
            k_size = 768
            usage = "KEY_EXCHANGE"

            if any(s in line for s in ["sign", "dilithium", "mldsa"]):
                algo = "ML-DSA"
                variant = "ML-DSA-65"
                k_size = 65
                usage = "DIGITAL_SIGNATURE"

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": k_size,
                "curve_or_parameters": "Module-LWE Lattice",
                "usage": usage,
                "library_or_api": "circl / Go PQC",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Go Source Parser",
                "source": "Go Parser"
            })

    return findings
