import ast
from typing import List, Dict, Any

class PythonCryptoASTVisitor(ast.NodeVisitor):
    def __init__(self, code_lines: List[str], file_path: str):
        self.code_lines = code_lines
        self.file_path = file_path
        self.findings = []

    def _get_line_snippet(self, lineno: int) -> str:
        if 1 <= lineno <= len(self.code_lines):
            return self.code_lines[lineno - 1].strip()
        return ""

    def visit_Call(self, node: ast.Call):
        # Examine function calls
        func_name = ""
        full_attr = ""

        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
            # Reconstruct attribute chain e.g. RSA.generate or hashlib.sha256 or AES.new
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

        # 1. Check RSA generation e.g., RSA.generate(2048) or KeyPairGenerator
        if full_attr.endswith("RSA.generate") or full_attr.endswith("rsa.generate_private_key"):
            key_size = 2048
            if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, int):
                key_size = node.args[0].value
            elif node.args and isinstance(node.args[0], ast.Num):
                key_size = node.args[0].n
            
            self.findings.append({
                "algorithm": "RSA",
                "variant": f"RSA-{key_size}",
                "key_size": key_size,
                "usage": "KEY_GEN",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "source": "Python AST"
            })

        # 2. Check ECC generation e.g. ec.generate_private_key(ec.SECP256R1())
        elif full_attr.endswith("ec.generate_private_key") or "SECP256R1" in snippet or "SECP384R1" in snippet or "secp256k1" in snippet:
            variant = "ECDSA P-256"
            key_size = 256
            if "384" in snippet:
                variant = "ECDSA P-384"
                key_size = 384
            elif "521" in snippet:
                variant = "ECDSA P-521"
                key_size = 521
            elif "256k1" in snippet:
                variant = "ECDSA secp256k1"
                key_size = 256

            self.findings.append({
                "algorithm": "ECDSA",
                "variant": variant,
                "key_size": key_size,
                "usage": "KEY_GEN",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "source": "Python AST"
            })

        # 3. Check AES initialization e.g. AES.new(key, AES.MODE_GCM) or Cipher(algorithms.AES(key), modes.CBC())
        elif full_attr.endswith("AES.new") or "algorithms.AES" in snippet or "Cipher(" in snippet:
            variant = "AES-256-GCM"
            key_size = 256
            if "MODE_CBC" in snippet or "CBC" in snippet:
                variant = "AES-256-CBC"
            elif "MODE_ECB" in snippet or "ECB" in snippet:
                variant = "AES-256-ECB"
            elif "MODE_CTR" in snippet or "CTR" in snippet:
                variant = "AES-256-CTR"
            
            if "128" in snippet:
                key_size = 128
                variant = variant.replace("256", "128")

            usage = "ENCRYPTION"
            if "decrypt" in snippet.lower():
                usage = "DECRYPTION"

            self.findings.append({
                "algorithm": "AES",
                "variant": variant,
                "key_size": key_size,
                "usage": usage,
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.95,
                "source": "Python AST"
            })

        # 4. Check hashlib calls e.g. hashlib.sha256(), hashlib.md5(), hashlib.sha1()
        elif full_attr.startswith("hashlib.") or func_name in {"md5", "sha1", "sha256", "sha384", "sha512"}:
            algo_map = {
                "md5": ("MD5", 0, "HASHING"),
                "sha1": ("SHA-1", 160, "HASHING"),
                "sha256": ("SHA-256", 256, "HASHING"),
                "sha384": ("SHA-384", 384, "HASHING"),
                "sha512": ("SHA-512", 512, "HASHING"),
            }
            target_key = func_name.lower().replace("hashlib.", "")
            if target_key in algo_map:
                algo_name, k_size, usage = algo_map[target_key]
                self.findings.append({
                    "algorithm": algo_name,
                    "variant": algo_name,
                    "key_size": k_size,
                    "usage": usage,
                    "file_path": self.file_path,
                    "line_number": lineno,
                    "code_snippet": snippet,
                    "confidence": 0.95,
                    "source": "Python AST"
                })

        # 5. Check password hashing calls e.g. pbkdf2, bcrypt, argon2
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
                "usage": "PASSWORD_HASHING",
                "file_path": self.file_path,
                "line_number": lineno,
                "code_snippet": snippet,
                "confidence": 0.9,
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
