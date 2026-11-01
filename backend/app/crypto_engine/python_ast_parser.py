import ast
import re
from typing import List, Dict, Any, Optional

def mask_secrets(snippet: str) -> str:
    """Mask obvious private keys, passwords, and secret tokens in code snippets."""
    snippet = re.sub(r'(["\'])(?:(?:password|secret|token|api_?key|private_?key)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])',
                     r'\1[REDACTED_SECRET]\3', snippet, flags=re.IGNORECASE)
    snippet = re.sub(r'b?["\'][0-9a-fA-F]{32,}["\']', '"[REDACTED_SECRET_BYTES]"', snippet)
    return snippet

class PythonCryptoASTVisitor(ast.NodeVisitor):
    def __init__(self, code_lines: List[str], file_path: str):
        self.code_lines = code_lines
        self.file_path = file_path
        self.findings: List[Dict[str, Any]] = []

    def _get_line_snippet(self, lineno: int) -> str:
        if 1 <= lineno <= len(self.code_lines):
            raw = self.code_lines[lineno - 1].strip()
            return mask_secrets(raw)
        return ""

    def _extract_int_value(self, node: ast.AST) -> Optional[int]:
        if isinstance(node, ast.Constant) and isinstance(node.value, int):
            return node.value
        elif isinstance(node, ast.Num):
            return node.n
        return None

    def _extract_str_value(self, node: ast.AST) -> Optional[str]:
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        elif isinstance(node, ast.Str):
            return node.s
        return None

    def visit_Call(self, node: ast.Call):
        func_name = ""
        full_attr = ""

        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            full_attr = func_name
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
            curr = node.func
            chain = []
            while isinstance(curr, ast.Attribute):
                chain.append(curr.attr)
                curr = curr.value
            if isinstance(curr, ast.Name):
                chain.append(curr.id)
            chain.reverse()
            full_attr = ".".join(chain)

        lineno = getattr(node, 'lineno', 1)
        snippet = self._get_line_snippet(lineno)

        # ---------------- 1. RSA GENERATION & OPERATIONS ----------------
        if full_attr.endswith("RSA.generate") or full_attr.endswith("rsa.generate_private_key"):
            key_size = 2048
            # Check positional args
            if node.args:
                val = self._extract_int_value(node.args[0])
                if val:
                    key_size = val
            # Check keyword args (e.g. key_size=4096)
            for kw in node.keywords:
                if kw.arg == "key_size":
                    val = self._extract_int_value(kw.value)
                    if val:
                        key_size = val

            self.findings.append({
                "algorithm": "RSA",
                "variant": f"RSA-{key_size}",
                "key_size": key_size,
                "curve_or_parameters": f"{key_size}-bit modulus",
                "usage": "KEY_GEN",
                "library_or_api": "cryptography.hazmat" if "hazmat" in full_attr or "generate_private_key" in full_attr else "PyCryptodome",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 2. ECC / ECDSA / ECDH ----------------
        elif full_attr.endswith("ec.generate_private_key") or any(curve in snippet for curve in ["SECP256R1", "SECP384R1", "SECP521R1", "secp256k1", "BrainpoolP256R1"]):
            variant = "ECDSA P-256"
            curve_name = "P-256 (secp256r1)"
            key_size = 256
            if "384" in snippet:
                variant = "ECDSA P-384"
                curve_name = "P-384 (secp384r1)"
                key_size = 384
            elif "521" in snippet:
                variant = "ECDSA P-521"
                curve_name = "P-521 (secp521r1)"
                key_size = 521
            elif "256k1" in snippet:
                variant = "ECDSA secp256k1"
                curve_name = "secp256k1"
                key_size = 256

            usage = "KEY_GEN"
            if "exchange" in snippet or "ECDH" in snippet:
                usage = "KEY_EXCHANGE"
            elif "sign" in snippet:
                usage = "DIGITAL_SIGNATURE"

            self.findings.append({
                "algorithm": "ECDH" if usage == "KEY_EXCHANGE" else "ECDSA",
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": curve_name,
                "usage": usage,
                "library_or_api": "cryptography.hazmat.primitives.asymmetric.ec",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 3. X25519 & Ed25519 ----------------
        elif "X25519" in full_attr or "x25519.X25519PrivateKey" in snippet or "X25519PublicKey" in snippet:
            self.findings.append({
                "algorithm": "X25519",
                "variant": "X25519",
                "key_size": 256,
                "curve_or_parameters": "Curve25519 (Montgomery)",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "cryptography.hazmat.primitives.asymmetric.x25519",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "Ed25519" in full_attr or "ed25519.Ed25519PrivateKey" in snippet or "Ed25519PublicKey" in snippet:
            self.findings.append({
                "algorithm": "Ed25519",
                "variant": "Ed25519",
                "key_size": 256,
                "curve_or_parameters": "edwards25519",
                "usage": "DIGITAL_SIGNATURE",
                "library_or_api": "cryptography.hazmat.primitives.asymmetric.ed25519",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 4. DIFFIE-HELLMAN & DSA ----------------
        elif "dh.generate_parameters" in full_attr or "DHParameterNumbers" in snippet:
            key_size = 2048
            if node.args and self._extract_int_value(node.args[0]):
                key_size = self._extract_int_value(node.args[0]) or 2048
            for kw in node.keywords:
                if kw.arg == "key_size":
                    key_size = self._extract_int_value(kw.value) or key_size

            self.findings.append({
                "algorithm": "Diffie-Hellman",
                "variant": f"DH-{key_size}",
                "key_size": key_size,
                "curve_or_parameters": f"FFDHE-{key_size}",
                "usage": "KEY_EXCHANGE",
                "library_or_api": "cryptography.hazmat.primitives.asymmetric.dh",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "dsa.generate_private_key" in full_attr:
            key_size = 2048
            for kw in node.keywords:
                if kw.arg == "key_size":
                    key_size = self._extract_int_value(kw.value) or key_size

            self.findings.append({
                "algorithm": "DSA",
                "variant": f"DSA-{key_size}",
                "key_size": key_size,
                "curve_or_parameters": f"{key_size}-bit L, 256-bit N",
                "usage": "DIGITAL_SIGNATURE",
                "library_or_api": "cryptography.hazmat.primitives.asymmetric.dsa",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 5. SYMMETRIC CIPHERS (AES, DES, 3DES, ChaCha20) ----------------
        elif full_attr.endswith("AES.new") or "algorithms.AES" in snippet or "AESGCM" in snippet or "AESCCM" in snippet or ("Cipher(" in snippet and "AES" in snippet):
            variant = "AES-256-GCM"
            key_size = 256
            if "MODE_CBC" in snippet or "modes.CBC" in snippet:
                variant = "AES-256-CBC"
            elif "MODE_ECB" in snippet or "modes.ECB" in snippet:
                variant = "AES-256-ECB"
            elif "MODE_CTR" in snippet or "modes.CTR" in snippet:
                variant = "AES-256-CTR"
            elif "AESGCM" in snippet or "modes.GCM" in snippet or "MODE_GCM" in snippet:
                variant = "AES-256-GCM"

            # Check 128 vs 192 vs 256 bits
            if "128" in snippet or "16" in snippet:
                if "128" in snippet:
                    key_size = 128
                    variant = variant.replace("256", "128")
            elif "192" in snippet or "24" in snippet:
                if "192" in snippet:
                    key_size = 192
                    variant = variant.replace("256", "192")

            usage = "ENCRYPTION"
            if "decrypt" in snippet.lower():
                usage = "DECRYPTION"

            self.findings.append({
                "algorithm": "AES",
                "variant": variant,
                "key_size": key_size,
                "curve_or_parameters": variant.split("-")[-1] if "-" in variant else "GCM",
                "usage": usage,
                "library_or_api": "cryptography.hazmat.primitives.ciphers" if "hazmat" in snippet or "Cipher(" in snippet else "PyCryptodome",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "TripleDES" in snippet or "DES3.new" in snippet or "algorithms.TripleDES" in snippet:
            self.findings.append({
                "algorithm": "3DES",
                "variant": "3DES",
                "key_size": 168,
                "curve_or_parameters": "EDE3 (3-key Triple DES)",
                "usage": "ENCRYPTION",
                "library_or_api": "cryptography / PyCryptodome",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "DES.new" in snippet and "DES3" not in snippet:
            self.findings.append({
                "algorithm": "DES",
                "variant": "DES",
                "key_size": 56,
                "curve_or_parameters": "56-bit single DES",
                "usage": "ENCRYPTION",
                "library_or_api": "PyCryptodome",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "ChaCha20Poly1305" in snippet or "ChaCha20_Poly1305" in snippet:
            self.findings.append({
                "algorithm": "ChaCha20",
                "variant": "ChaCha20-Poly1305",
                "key_size": 256,
                "curve_or_parameters": "Poly1305 AEAD authenticator",
                "usage": "ENCRYPTION",
                "library_or_api": "cryptography.hazmat.primitives.ciphers.aead",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif "algorithms.ChaCha20" in snippet or "ChaCha20.new" in snippet:
            self.findings.append({
                "algorithm": "ChaCha20",
                "variant": "ChaCha20",
                "key_size": 256,
                "curve_or_parameters": "Stream cipher (RFC 7539)",
                "usage": "ENCRYPTION",
                "library_or_api": "cryptography / PyCryptodome",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 6. HASHING & HMAC ----------------
        elif full_attr.startswith("hmac.") or "hmac.HMAC" in snippet or "hmac.new" in snippet:
            algo_var = "HMAC-SHA256"
            k_size = 256
            if "sha512" in snippet.lower():
                algo_var = "HMAC-SHA512"
                k_size = 512
            elif "sha384" in snippet.lower():
                algo_var = "HMAC-SHA384"
                k_size = 384
            elif "sha1" in snippet.lower():
                algo_var = "HMAC-SHA1"
                k_size = 160
            elif "md5" in snippet.lower():
                algo_var = "HMAC-MD5"
                k_size = 128

            self.findings.append({
                "algorithm": "HMAC",
                "variant": algo_var,
                "key_size": k_size,
                "curve_or_parameters": algo_var.split("-")[-1],
                "usage": "MESSAGE_AUTHENTICATION",
                "library_or_api": "hmac / cryptography.hazmat.primitives.hmac",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        elif full_attr.startswith("hashlib.") or full_attr.startswith("hashes.") or func_name in {"md5", "sha1", "sha256", "sha384", "sha512", "SHA256", "SHA384", "SHA512", "SHA1", "MD5"}:
            algo_map = {
                "md5": ("MD5", "MD5", 0, "HASHING"),
                "sha1": ("SHA-1", "SHA-1", 160, "HASHING"),
                "sha256": ("SHA-256", "SHA-256", 256, "HASHING"),
                "sha384": ("SHA-384", "SHA-384", 384, "HASHING"),
                "sha512": ("SHA-512", "SHA-512", 512, "HASHING"),
            }
            target_key = func_name.lower().replace("hashlib.", "").replace("hashes.", "")
            if target_key in algo_map:
                algo_name, variant_name, k_size, usage = algo_map[target_key]
                self.findings.append({
                    "algorithm": algo_name,
                    "variant": variant_name,
                    "key_size": k_size,
                    "curve_or_parameters": f"{k_size}-bit digest",
                    "usage": usage,
                    "library_or_api": "hashlib" if "hashlib" in full_attr else "cryptography.hazmat.primitives.hashes",
                    "file_path": self.file_path,
                    "line_number": lineno,
                    "code_snippet": snippet,
                    "confidence": 0.98,
                    "detection_method": "Python AST",
                    "source": "Python AST"
                })

        # ---------------- 7. POST-QUANTUM CRYPTOGRAPHY (oqs, liboqs, mlkem, mldsa) ----------------
        elif any(pqc in snippet for pqc in ["ML-KEM", "ML-DSA", "SLH-DSA", "Kyber", "Dilithium", "SPHINCS+"]):
            algo = "ML-KEM"
            variant = "ML-KEM-768"
            k_size = 768
            usage = "KEY_EXCHANGE"

            if any(s in snippet for s in ["ML-DSA", "Dilithium"]):
                algo = "ML-DSA"
                variant = "ML-DSA-65"
                k_size = 65
                usage = "DIGITAL_SIGNATURE"
            elif any(s in snippet for s in ["SLH-DSA", "SPHINCS"]):
                algo = "SLH-DSA"
                variant = "SLH-DSA-128f"
                k_size = 128
                usage = "DIGITAL_SIGNATURE"
            elif "1024" in snippet:
                variant = "ML-KEM-1024"
                k_size = 1024
            elif "512" in snippet:
                variant = "ML-KEM-512"
                k_size = 512

            self.findings.append({
                "algorithm": algo,
                "variant": variant,
                "key_size": k_size,
                "curve_or_parameters": "Module-LWE Lattice" if "DSA" not in algo else "Module-LWE Signature",
                "usage": usage,
                "library_or_api": "liboqs / oqs-python",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.98,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # ---------------- 8. PASSWORD HASHING KDFs ----------------
        elif any(pw_kw in snippet.lower() for pw_kw in ["pbkdf2", "bcrypt", "argon2", "scrypt"]):
            algo = "PBKDF2"
            if "bcrypt" in snippet.lower():
                algo = "bcrypt"
            elif "argon2" in snippet.lower():
                algo = "Argon2"
            elif "scrypt" in snippet.lower():
                algo = "scrypt"

            self.findings.append({
                "algorithm": algo,
                "variant": algo,
                "key_size": 256,
                "curve_or_parameters": "Memory-hard / Key Derivation",
                "usage": "PASSWORD_HASHING",
                "library_or_api": "hashlib / passlib / argon2",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "detection_method": "Python AST",
                "source": "Python AST"
            })

        # Continue traversing AST
        self.generic_visit(node)

def analyze_python_ast(code_content: str, file_path: str) -> List[Dict[str, Any]]:
    """Parse Python source code with AST and return detected cryptographic usages."""
    try:
        tree = ast.parse(code_content)
        lines = code_content.splitlines()
        visitor = PythonCryptoASTVisitor(lines, file_path)
        visitor.visit(tree)
        return visitor.findings
    except SyntaxError:
        return []
    except Exception:
        return []
