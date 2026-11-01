import re
from typing import List, Dict, Any

def mask_secrets(snippet: str) -> str:
    """Mask obvious passwords, tokens and secrets in Java snippets."""
    snippet = re.sub(r'(["\'])(?:(?:password|secret|token|apiKey|privateKey)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])',
                     r'\1[REDACTED_SECRET]\3', snippet, flags=re.IGNORECASE)
    snippet = re.sub(r'new\s+SecretKeySpec\s*\(\s*new\s+byte\[\]\s*\{[^}]+\}', 'new SecretKeySpec([REDACTED_KEY_BYTES])', snippet)
    return snippet

def strip_java_comments(code: str) -> List[tuple[int, str]]:
    """Return list of (line_number, stripped_code_line) without comments or docstrings."""
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

def analyze_java(code_content: str, file_path: str) -> List[Dict[str, Any]]:
    """Inspect Java files for standard JCA/JCE and BouncyCastle cryptographic usage."""
    cleaned_lines = strip_java_comments(code_content)
    raw_lines = code_content.splitlines()
    findings: List[Dict[str, Any]] = []

    for line_no, line in cleaned_lines:
        if not line:
            continue

        raw_snippet = raw_lines[line_no - 1].strip() if 1 <= line_no <= len(raw_lines) else line
        snippet = mask_secrets(raw_snippet)

        # 1. Cipher.getInstance(...)
        cipher_match = re.search(r'Cipher\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if cipher_match:
            transformation = cipher_match.group(1).upper()
            algo = "AES"
            variant = "AES-256-GCM"
            key_size = 256
            usage = "ENCRYPTION"

            if "RSA" in transformation:
                algo = "RSA"
                variant = "RSA-2048"
                key_size = 2048
            elif "DESEDE" in transformation or "3DES" in transformation:
                algo = "3DES"
                variant = "3DES"
                key_size = 168
            elif "DES" in transformation:
                algo = "DES"
                variant = "DES"
                key_size = 56
            elif "AES" in transformation:
                algo = "AES"
                if "GCM" in transformation:
                    variant = "AES-256-GCM"
                    key_size = 256
                elif "CBC" in transformation:
                    variant = "AES-256-CBC"
                    key_size = 256
                elif "ECB" in transformation:
                    variant = "AES-256-ECB"
                    key_size = 256
                elif "CTR" in transformation:
                    variant = "AES-256-CTR"
                    key_size = 256

            if "DECRYPT" in line:
                usage = "DECRYPTION"

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": transformation,
                "usage": usage,
                "library_or_api": "javax.crypto.Cipher",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

        # 2. KeyPairGenerator.getInstance(...)
        kpg_match = re.search(r'KeyPairGenerator\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if kpg_match:
            kpg_algo = kpg_match.group(1).upper()
            algo = "RSA"
            variant = "RSA-2048"
            key_size = 2048
            usage = "KEY_GEN"
            curve_param = "2048-bit modulus"

            if "EC" in kpg_algo or "ECDSA" in kpg_algo:
                algo = "ECDSA"
                variant = "ECDSA P-256"
                key_size = 256
                curve_param = "secp256r1 (P-256)"
            elif "DIFFIEHELLMAN" in kpg_algo or "DH" in kpg_algo:
                algo = "Diffie-Hellman"
                variant = "DH-2048"
                key_size = 2048
                usage = "KEY_EXCHANGE"
                curve_param = "FFDHE-2048"
            elif "DSA" in kpg_algo:
                algo = "DSA"
                variant = "DSA-2048"
                key_size = 2048
                curve_param = "2048-bit L"
            elif "ED25519" in kpg_algo:
                algo = "Ed25519"
                variant = "Ed25519"
                key_size = 256
                curve_param = "edwards25519"
            elif "X25519" in kpg_algo:
                algo = "X25519"
                variant = "X25519"
                key_size = 256
                usage = "KEY_EXCHANGE"
                curve_param = "Curve25519"

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": curve_param,
                "usage": usage,
                "library_or_api": "java.security.KeyPairGenerator",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

        # 3. KeyAgreement.getInstance(...)
        ka_match = re.search(r'KeyAgreement\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if ka_match:
            ka_algo = ka_match.group(1).upper()
            algo = "ECDH" if "ECDH" in ka_algo else "Diffie-Hellman"
            variant = "ECDH P-256" if "ECDH" in ka_algo else "DH-2048"
            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": 256 if algo == "ECDH" else 2048,
                "curve_or_parameters": "P-256" if algo == "ECDH" else "FFDHE-2048",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "javax.crypto.KeyAgreement",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

        # 4. Signature.getInstance(...)
        sig_match = re.search(r'Signature\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if sig_match:
            sig_name = sig_match.group(1).upper()
            algo = "RSA"
            variant = "RSA-Signature"
            key_size = 2048
            if "ECDSA" in sig_name:
                algo = "ECDSA"
                variant = "ECDSA P-256"
                key_size = 256
            elif "ED25519" in sig_name:
                algo = "Ed25519"
                variant = "Ed25519"
                key_size = 256
            elif "DSA" in sig_name:
                algo = "DSA"
                variant = "DSA-2048"
                key_size = 2048

            findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": sig_name,
                "usage": "DIGITAL_SIGNATURE",
                "library_or_api": "java.security.Signature",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

        # 5. MessageDigest.getInstance(...)
        md_match = re.search(r'MessageDigest\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if md_match:
            md_name = md_match.group(1).upper()
            algo_map = {
                "SHA-256": ("SHA-256", "SHA-256", 256),
                "SHA-512": ("SHA-512", "SHA-512", 512),
                "SHA-384": ("SHA-384", "SHA-384", 384),
                "SHA-1": ("SHA-1", "SHA-1", 160),
                "SHA1": ("SHA-1", "SHA-1", 160),
                "MD5": ("MD5", "MD5", 128),
            }
            if md_name in algo_map:
                algo, variant, k_size = algo_map[md_name]
                findings.append({
                    "algorithm": algo,
                    "variant": variant,
                    "key_size": k_size,
                    "curve_or_parameters": f"{k_size}-bit digest",
                    "usage": "HASHING",
                    "library_or_api": "java.security.MessageDigest",
                    "file_path": file_path,
                    "line_number": line_no,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "Java API Inspector",
                    "source": "Java Parser"
                })

        # 6. Mac.getInstance(...)
        mac_match = re.search(r'Mac\.getInstance\s*\(\s*["\']([^"\']+)["\']', line)
        if mac_match:
            mac_name = mac_match.group(1).upper()
            k_size = 256
            if "512" in mac_name:
                k_size = 512
            elif "384" in mac_name:
                k_size = 384
            elif "1" in mac_name or "SHA1" in mac_name:
                k_size = 160
            elif "MD5" in mac_name:
                k_size = 128

            findings.append({
                "algorithm": "HMAC",
                "variant": f"HMAC-{mac_name.replace('HMAC', '').replace('SHA', 'SHA-')}",
                "key_size": k_size,
                "curve_or_parameters": mac_name,
                "usage": "MESSAGE_AUTHENTICATION",
                "library_or_api": "javax.crypto.Mac",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

        # 7. Post-Quantum Java / BouncyCastle PQC
        if any(pqc in line for pqc in ["ML-KEM", "ML-DSA", "SLH-DSA", "Kyber", "Dilithium", "SPHINCSPlus", "BCECGOST"]):
            algo = "ML-KEM"
            variant = "ML-KEM-768"
            k_size = 768
            usage = "KEY_EXCHANGE"

            if any(s in line for s in ["ML-DSA", "Dilithium"]):
                algo = "ML-DSA"
                variant = "ML-DSA-65"
                k_size = 65
                usage = "DIGITAL_SIGNATURE"
            elif any(s in line for s in ["SLH-DSA", "SPHINCS"]):
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
                "library_or_api": "BouncyCastle PQC",
                "file_path": file_path,
                "line_number": line_no,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Java API Inspector",
                "source": "Java Parser"
            })

    return findings
