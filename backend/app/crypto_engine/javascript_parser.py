import re
from typing import List, Dict, Any

def mask_secrets(snippet: str) -> str:
    """Mask credentials, passwords, and private keys in code snippets."""
    snippet = re.sub(r'(["\'])(?:(?:password|secret|token|api_?key|private_?key)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])',
                     r'\1[REDACTED_SECRET]\3', snippet, flags=re.IGNORECASE)
    snippet = re.sub(r'["\'][0-9a-fA-F]{32,}["\']', '"[REDACTED_SECRET_HEX]"', snippet)
    return snippet

def strip_js_comments(code: str) -> List[tuple[int, str]]:
    """
    Return list of (line_number, stripped_code_line) without comments or docstrings.
    Handles single line // and multi-line /* ... */ properly.
    """
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

def analyze_javascript(code_content: str, file_path: str) -> List[Dict[str, Any]]:
    """Inspect JavaScript/TypeScript files for cryptographic primitives and APIs."""
    cleaned_lines = strip_js_comments(code_content)
    raw_lines = code_content.splitlines()
    findings: List[Dict[str, Any]] = []

    for line_no, line in cleaned_lines:
        if not line:
            continue

        raw_snippet = raw_lines[line_no - 1].strip() if 1 <= line_no <= len(raw_lines) else line
        snippet = mask_secrets(raw_snippet)

        # 1. Node.js createCipheriv & WebCrypto AES
        if "createCipheriv" in line or ("subtle.encrypt" in line and "AES" in line) or ("generateKey" in line and "AES" in line):
            variant = "AES-256-GCM"
            key_size = 256
            usage = "ENCRYPTION"

            if "aes-128-gcm" in line.lower():
                variant = "AES-128-GCM"
                key_size = 128
            elif "aes-128-cbc" in line.lower():
                variant = "AES-128-CBC"
                key_size = 128
            elif "aes-256-cbc" in line.lower():
                variant = "AES-256-CBC"
                key_size = 256
            elif "des-ede3-cbc" in line.lower() or "3des" in line.lower():
                variant = "3DES"
                key_size = 168
            elif "chacha20-poly1305" in line.lower():
                variant = "ChaCha20-Poly1305"
                key_size = 256

            algo = "AES"
            if "3DES" in variant:
                algo = "3DES"
            elif "ChaCha20" in variant:
                algo = "ChaCha20"

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": variant.split("-")[-1] if "-" in variant else "GCM",
                "usage": usage,
                "library_or_api": "Node.js crypto / WebCrypto API",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.96,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })

        # 2. Node.js createHash & subtle.digest
        elif "createHash" in line or "subtle.digest" in line or "crypto.subtle.digest" in line:
            line_lower = line.lower()
            if "sha256" in line_lower or "sha-256" in line_lower:
                findings.append({
                    "algorithm": "SHA-256",
                    "variant": "SHA-256",
                    "key_size": 256,
                    "curve_or_parameters": "256-bit hash digest",
                    "usage": "HASHING",
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "sha512" in line_lower or "sha-512" in line_lower:
                findings.append({
                    "algorithm": "SHA-512",
                    "variant": "SHA-512",
                    "key_size": 512,
                    "curve_or_parameters": "512-bit hash digest",
                    "usage": "HASHING",
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "sha384" in line_lower or "sha-384" in line_lower:
                findings.append({
                    "algorithm": "SHA-384",
                    "variant": "SHA-384",
                    "key_size": 384,
                    "curve_or_parameters": "384-bit hash digest",
                    "usage": "HASHING",
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "sha1" in line_lower or "sha-1" in line_lower:
                findings.append({
                    "algorithm": "SHA-1",
                    "variant": "SHA-1",
                    "key_size": 160,
                    "curve_or_parameters": "160-bit hash digest",
                    "usage": "HASHING",
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "md5" in line_lower:
                findings.append({
                    "algorithm": "MD5",
                    "variant": "MD5",
                    "key_size": 128,
                    "curve_or_parameters": "128-bit hash digest",
                    "usage": "HASHING",
                    "library_or_api": "Node.js crypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })

        # 3. Node.js createHmac
        elif "createHmac" in line:
            var_name = "HMAC-SHA256"
            k_size = 256
            if "sha512" in line.lower():
                var_name = "HMAC-SHA512"
                k_size = 512
            elif "sha384" in line.lower():
                var_name = "HMAC-SHA384"
                k_size = 384
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
                "library_or_api": "Node.js crypto",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })

        # 4. Asymmetric Key Pair Generation (RSA, EC, Ed25519, X25519)
        elif "generateKeyPair" in line or ("subtle.generateKey" in line and any(k in line for k in ["RSA", "ECDSA", "ECDH"])):
            if "rsa" in line.lower() or "RSA" in line:
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
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "ec" in line.lower() or "ecdsa" in line.lower() or "prime256v1" in line.lower() or "p-256" in line.lower():
                findings.append({
                    "algorithm": "ECDSA",
                    "variant": "ECDSA P-256",
                    "key_size": 256,
                    "curve_or_parameters": "P-256 (prime256v1)",
                    "usage": "KEY_GEN",
                    "library_or_api": "Node.js crypto / WebCrypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "ed25519" in line.lower():
                findings.append({
                    "algorithm": "Ed25519",
                    "variant": "Ed25519",
                    "key_size": 256,
                    "curve_or_parameters": "edwards25519",
                    "usage": "DIGITAL_SIGNATURE",
                    "library_or_api": "Node.js crypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })
            elif "x25519" in line.lower():
                findings.append({
                    "algorithm": "X25519",
                    "variant": "X25519",
                    "key_size": 256,
                    "curve_or_parameters": "Curve25519",
                    "usage": "KEY_EXCHANGE",
                    "library_or_api": "Node.js crypto",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "JavaScript / TypeScript Parser",
                    "source": "JavaScript Parser"
                })

        # 5. Key Agreement: createECDH & Diffie-Hellman
        elif "createECDH" in line:
            findings.append({
                "algorithm": "ECDH",
                "variant": "ECDH P-256",
                "key_size": 256,
                "curve_or_parameters": "prime256v1",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "Node.js crypto.createECDH",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })
        elif "createDiffieHellman" in line or "diffieHellman" in line:
            findings.append({
                "algorithm": "Diffie-Hellman",
                "variant": "DH-2048",
                "key_size": 2048,
                "curve_or_parameters": "MODP-2048",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "Node.js crypto.createDiffieHellman",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })

        # 6. CryptoJS Library
        elif "CryptoJS.AES" in line:
            findings.append({
                "algorithm": "AES",
                "variant": "AES-256-CBC",
                "key_size": 256,
                "curve_or_parameters": "CBC (CryptoJS default)",
                "usage": "ENCRYPTION",
                "library_or_api": "crypto-js",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })
        elif "CryptoJS.DES" in line or "CryptoJS.TripleDES" in line:
            is_3des = "TripleDES" in line
            findings.append({
                "algorithm": "3DES" if is_3des else "DES",
                "variant": "3DES" if is_3des else "DES",
                "key_size": 168 if is_3des else 56,
                "curve_or_parameters": "DES block cipher",
                "usage": "ENCRYPTION",
                "library_or_api": "crypto-js",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })
        elif "CryptoJS.HmacSHA256" in line:
            findings.append({
                "algorithm": "HMAC",
                "variant": "HMAC-SHA256",
                "key_size": 256,
                "curve_or_parameters": "SHA-256",
                "usage": "MESSAGE_AUTHENTICATION",
                "library_or_api": "crypto-js",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })

        # 7. Post-Quantum JavaScript Libraries
        elif any(pqc in line for pqc in ["ML-KEM", "ML-DSA", "SLH-DSA", "crystals-kyber", "mlkem", "mldsa", "liboqs-node"]):
            algo = "ML-KEM"
            variant = "ML-KEM-768"
            k_size = 768
            usage = "KEY_EXCHANGE"

            if any(s in line for s in ["ML-DSA", "mldsa", "dilithium"]):
                algo = "ML-DSA"
                variant = "ML-DSA-65"
                k_size = 65
                usage = "DIGITAL_SIGNATURE"
            elif any(s in line for s in ["SLH-DSA", "sphincs"]):
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
                "library_or_api": "PQC JS / liboqs-node",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "JavaScript / TypeScript Parser",
                "source": "JavaScript Parser"
            })

    return findings
