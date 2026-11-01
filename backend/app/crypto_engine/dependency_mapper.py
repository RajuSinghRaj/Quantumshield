"""
Cryptographic Dependency Mapper for QuantumShield 2.0.

Discovers software manifests and lockfiles across multiple ecosystems,
identifies cryptographic libraries (direct vs. transitive),
correlates dependencies with detected source-code cryptographic assets,
builds a dependency relationship graph, and generates migration impact assessments.

Supported Manifests:
- Python: requirements.txt, pyproject.toml, Pipfile, poetry.lock
- JavaScript/TypeScript: package.json, package-lock.json, yarn.lock, pnpm-lock.yaml
- Java: pom.xml, build.gradle, build.gradle.kts
- Go: go.mod, go.sum
- Rust: Cargo.toml, Cargo.lock
- C/C++: CMakeLists.txt, vcpkg.json, conanfile.txt
"""

import os
import re
import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional, Tuple, Set

try:
    import tomllib  # Python 3.11+ built-in
except ImportError:
    try:
        import tomli as tomllib  # fallback
    except ImportError:
        tomllib = None


# ==================== CRYPTOGRAPHIC PACKAGE REGISTRY ====================

KNOWN_CRYPTO_LIBRARIES: Dict[str, Dict[str, Any]] = {
    # --- Python ---
    "cryptography": {
        "ecosystem": "python",
        "description": "Comprehensive cryptographic recipes and primitives for Python",
        "default_primitives": ["RSA", "ECC", "ECDSA", "ECDH", "AES", "ChaCha20", "SHA", "HMAC", "Ed25519", "X25519"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "EXPERIMENTAL" if version and any(version.startswith(f"{v}.") for v in ["42", "43", "44", "45"]) else "UNSUPPORTED",
            "pqc_details": "Python cryptography 42.0+ provides experimental X25519MLKEM768 hybrid key exchange; pure ML-KEM/ML-DSA requires upcoming standard releases or liboqs-python.",
            "recommended_upgrade": "cryptography >= 43.0.0 (or integrate liboqs-python for pure ML-KEM/ML-DSA)"
        }
    },
    "pycryptodome": {
        "ecosystem": "python",
        "description": "Self-contained Python cryptography library (fork of PyCrypto)",
        "default_primitives": ["RSA", "AES", "DES", "3DES", "ECC", "ChaCha20", "SHA", "MD5", "HMAC"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "PyCryptodome does not support NIST standardized PQC algorithms (ML-KEM, ML-DSA).",
            "recommended_upgrade": "Replace public-key and key-exchange modules with liboqs-python or cryptography (hybrid)"
        }
    },
    "pycrypto": {
        "ecosystem": "python",
        "description": "Deprecated legacy Python cryptography library",
        "default_primitives": ["RSA", "AES", "DES", "3DES", "MD5", "SHA-1"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "PyCrypto is abandoned and vulnerable to multiple classical and quantum attacks.",
            "recommended_upgrade": "Immediately migrate to cryptography >= 42.0.0 or liboqs-python"
        }
    },
    "pynacl": {
        "ecosystem": "python",
        "description": "Python binding to libsodium (Networking and Cryptography library)",
        "default_primitives": ["Ed25519", "X25519", "ChaCha20-Poly1305", "SHA-512"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "NaCl/libsodium algorithms (Ed25519, X25519) are vulnerable to Shor's algorithm. Symmetric ChaCha20 is safe.",
            "recommended_upgrade": "Transition asymmetric keys to ML-DSA/ML-KEM"
        }
    },
    "rsa": {
        "ecosystem": "python",
        "description": "Pure-Python RSA implementation",
        "default_primitives": ["RSA"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Pure RSA implementation vulnerable to Shor's algorithm on fault-tolerant quantum computers.",
            "recommended_upgrade": "Migrate to ML-KEM / ML-DSA via liboqs-python"
        }
    },
    "ecdsa": {
        "ecosystem": "python",
        "description": "Pure-Python ECDSA implementation",
        "default_primitives": ["ECDSA", "ECC"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Elliptic curve digital signatures are vulnerable to Shor's algorithm.",
            "recommended_upgrade": "Migrate signatures to ML-DSA or SLH-DSA"
        }
    },
    "paramiko": {
        "ecosystem": "python",
        "description": "Python SSHv2 protocol library",
        "default_primitives": ["RSA", "ECDSA", "Ed25519", "Diffie-Hellman", "AES", "ChaCha20"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Paramiko currently uses classical SSH key exchange (DH/ECDH/RSA).",
            "recommended_upgrade": "Monitor Paramiko PQC roadmap for hybrid sntrup761x25519-sha512 support"
        }
    },
    "pyopenssl": {
        "ecosystem": "python",
        "description": "Python wrapper module around OpenSSL",
        "default_primitives": ["RSA", "ECC", "AES", "TLS", "SHA", "X.509"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNVERIFIED",
            "pqc_details": "Relies on underlying OpenSSL build. Requires OpenSSL 3.x with oqsprovider for PQC.",
            "recommended_upgrade": "Ensure underlying OpenSSL 3.x is compiled with oqsprovider"
        }
    },
    "oqs": {
        "ecosystem": "python",
        "description": "Open Quantum Safe liboqs Python bindings",
        "default_primitives": ["ML-KEM", "ML-DSA", "SLH-DSA", "Kyber", "Dilithium", "SPHINCS+"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Native Post-Quantum Cryptography library implementing NIST standardized algorithms.",
            "recommended_upgrade": "Already post-quantum ready (keep updated with latest liboqs release)"
        }
    },
    "pqcrypto": {
        "ecosystem": "python",
        "description": "NIST Post-Quantum Cryptography Python library",
        "default_primitives": ["ML-KEM", "ML-DSA", "Kyber", "Dilithium", "SPHINCS+"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Post-quantum cryptographic library for Python.",
            "recommended_upgrade": "Already post-quantum ready"
        }
    },

    # --- JavaScript / TypeScript (npm) ---
    "crypto-js": {
        "ecosystem": "npm",
        "description": "Standard JavaScript cryptographic library",
        "default_primitives": ["AES", "DES", "3DES", "MD5", "SHA-1", "SHA-256", "HMAC"],
        "default_quantum_risk": "DEGRADED",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Classical JS crypto library. Does not support PQC algorithms.",
            "recommended_upgrade": "Migrate to WebCrypto API for symmetric operations; use liboqs-js / noble for PQC"
        }
    },
    "node-forge": {
        "ecosystem": "npm",
        "description": "JavaScript implementation of TLS and cryptographic tools",
        "default_primitives": ["RSA", "AES", "DES", "SHA-1", "SHA-256", "X.509"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Pure classical JS cryptography (RSA/AES/TLS 1.2).",
            "recommended_upgrade": "Replace RSA operations with WebCrypto or PQC JS implementations"
        }
    },
    "elliptic": {
        "ecosystem": "npm",
        "description": "Fast elliptic curve cryptography in plain JavaScript",
        "default_primitives": ["ECDSA", "ECDH", "secp256k1", "P-256", "Ed25519"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "All elliptic curve primitives are quantum-vulnerable under Shor's algorithm.",
            "recommended_upgrade": "Migrate to ML-DSA (signatures) and ML-KEM (key exchange)"
        }
    },
    "bcrypt": {
        "ecosystem": "npm",
        "description": "Password hashing algorithm",
        "default_primitives": ["bcrypt", "Blowfish"],
        "default_quantum_risk": "SAFE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Password hashing / symmetric memory-hard function not threatened by Shor's algorithm.",
            "recommended_upgrade": "Retain bcrypt (cost >= 12) or adopt Argon2id"
        }
    },
    "argon2": {
        "ecosystem": "npm",
        "description": "Password hashing algorithm (winner of Password Hashing Competition)",
        "default_primitives": ["Argon2id", "Argon2i", "Argon2d"],
        "default_quantum_risk": "SAFE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Memory-hard function resilient against classical and quantum acceleration.",
            "recommended_upgrade": "Already quantum-safe"
        }
    },
    "libsodium-wrappers": {
        "ecosystem": "npm",
        "description": "Compiled WebAssembly/JavaScript wrappers for libsodium",
        "default_primitives": ["Ed25519", "X25519", "ChaCha20-Poly1305"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Asymmetric components (Ed25519, X25519) are vulnerable to Shor's algorithm.",
            "recommended_upgrade": "Transition to post-quantum hybrid KEM/Signatures"
        }
    },
    "tweetnacl": {
        "ecosystem": "npm",
        "description": "Port of TweetNaCl cryptographic library to JavaScript",
        "default_primitives": ["Ed25519", "X25519", "Salsa20", "Poly1305"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "Public key algorithms are vulnerable to Shor's algorithm.",
            "recommended_upgrade": "Migrate public key pairs to ML-DSA/ML-KEM"
        }
    },
    "@noble/curves": {
        "ecosystem": "npm",
        "description": "Audited minimal zero-dependency JS elliptic curves",
        "default_primitives": ["ECDSA", "Ed25519", "X25519", "secp256k1"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "EXPERIMENTAL",
            "pqc_details": "Provides modern curves. Check Noble post-quantum modules for ML-KEM/ML-DSA.",
            "recommended_upgrade": "Use @noble/post-quantum when available"
        }
    },
    "@noble/ciphers": {
        "ecosystem": "npm",
        "description": "Audited zero-dependency symmetric ciphers",
        "default_primitives": ["AES-256-GCM", "ChaCha20-Poly1305"],
        "default_quantum_risk": "SAFE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "256-bit symmetric ciphers retain 128-bit security under Grover's algorithm.",
            "recommended_upgrade": "Ensure 256-bit keys are utilized"
        }
    },
    "kyber-crystals": {
        "ecosystem": "npm",
        "description": "JavaScript implementation of CRYSTALS-Kyber (ML-KEM)",
        "default_primitives": ["ML-KEM", "Kyber-512", "Kyber-768", "Kyber-1024"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "NIST standardized post-quantum key encapsulation mechanism.",
            "recommended_upgrade": "Already post-quantum ready"
        }
    },

    # --- Java (Maven / Gradle) ---
    "org.bouncycastle:bcprov-jdk18on": {
        "ecosystem": "maven",
        "description": "Bouncy Castle Cryptography Provider for Java 8+",
        "default_primitives": ["RSA", "ECC", "ECDSA", "ECDH", "AES", "ML-KEM", "ML-DSA", "SLH-DSA"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: _assess_bouncycastle_version(version)
    },
    "org.bouncycastle:bcprov-jdk15to18": {
        "ecosystem": "maven",
        "description": "Bouncy Castle Cryptography Provider (legacy JDK)",
        "default_primitives": ["RSA", "ECC", "ECDSA", "AES"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: _assess_bouncycastle_version(version)
    },
    "org.bouncycastle:bcpkix-jdk18on": {
        "ecosystem": "maven",
        "description": "Bouncy Castle PKIX, CMS, EAC, and TSP packages",
        "default_primitives": ["X.509", "CMS", "PKCS#12", "ML-DSA"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: _assess_bouncycastle_version(version)
    },
    "com.google.crypto.tink:tink": {
        "ecosystem": "maven",
        "description": "Google Tink multi-language cryptographic library",
        "default_primitives": ["AES-GCM", "ChaCha20-Poly1305", "ECDSA", "ED25519", "HMAC"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "EXPERIMENTAL",
            "pqc_details": "Google Tink has experimental hybrid PQC key exchange support in latest releases.",
            "recommended_upgrade": "Upgrade to Tink >= 1.12.0 and enable post-quantum key templates"
        }
    },

    # --- Go ---
    "golang.org/x/crypto": {
        "ecosystem": "go",
        "description": "Go supplementary cryptography libraries",
        "default_primitives": ["bcrypt", "argon2", "chacha20poly1305", "ed25519", "curve25519", "sha3"],
        "default_quantum_risk": "DEGRADED",
        "pqc_assessment": lambda version: {
            "status": "EXPERIMENTAL",
            "pqc_details": "Go standard library (1.24+) and x/crypto have introduced X25519MLKEM768 hybrid key exchange.",
            "recommended_upgrade": "Update Go toolchain to >= 1.24 and x/crypto to latest"
        }
    },
    "github.com/cloudflare/circl": {
        "ecosystem": "go",
        "description": "Cloudflare Interoperable Reusable Cryptographic Library",
        "default_primitives": ["ML-KEM", "ML-DSA", "Kyber", "Dilithium", "SPHINCS+", "SIDH"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "CIRCL natively provides NIST PQC algorithms (Kyber / ML-KEM, Dilithium / ML-DSA).",
            "recommended_upgrade": "Already post-quantum ready"
        }
    },
    "github.com/open-quantum-safe/liboqs-go": {
        "ecosystem": "go",
        "description": "Open Quantum Safe liboqs Go bindings",
        "default_primitives": ["ML-KEM", "ML-DSA", "SLH-DSA"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Native Post-Quantum Cryptography bindings for Go.",
            "recommended_upgrade": "Already post-quantum ready"
        }
    },

    # --- Rust (Cargo) ---
    "ring": {
        "ecosystem": "cargo",
        "description": "Safe, fast, small crypto using Rust",
        "default_primitives": ["RSA", "ECDSA", "AES-GCM", "ChaCha20-Poly1305", "HMAC", "SHA-256"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "EXPERIMENTAL",
            "pqc_details": "ring is developing ML-KEM hybrid support in cooperation with AWS-LC.",
            "recommended_upgrade": "Consider aws-lc-rs or pqcrypto crate for pure/hybrid PQC"
        }
    },
    "rustls": {
        "ecosystem": "cargo",
        "description": "Modern TLS library written in Rust",
        "default_primitives": ["TLS 1.3", "ECDSA", "RSA", "AES-GCM", "ChaCha20-Poly1305"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED" if version and any(version.startswith(f"0.{v}") for v in range(23, 30)) else "EXPERIMENTAL",
            "pqc_details": "Rustls 0.23+ supports hybrid post-quantum key exchange (X25519Kyber768Draft00) with aws-lc-rs provider.",
            "recommended_upgrade": "rustls >= 0.23.12 with aws-lc-rs cryptographic provider"
        }
    },
    "aes-gcm": {
        "ecosystem": "cargo",
        "description": "Pure Rust implementation of AES-GCM",
        "default_primitives": ["AES-128-GCM", "AES-256-GCM"],
        "default_quantum_risk": "SAFE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "AES-256-GCM is quantum-safe against Grover's algorithm.",
            "recommended_upgrade": "Ensure 256-bit key variants are instantiated"
        }
    },
    "pqcrypto": {
        "ecosystem": "cargo",
        "description": "Rust post-quantum cryptography crates (Kyber, Dilithium, SPHINCS+)",
        "default_primitives": ["ML-KEM", "ML-DSA", "SLH-DSA"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Rust bindings for NIST post-quantum cryptographic primitives.",
            "recommended_upgrade": "Already post-quantum ready"
        }
    },

    # --- C / C++ (CMake, vcpkg, Conan) ---
    "openssl": {
        "ecosystem": "native",
        "description": "Commercial-grade toolkit for TLS and general-purpose cryptography",
        "default_primitives": ["RSA", "ECC", "ECDSA", "ECDH", "AES", "ChaCha20", "SHA", "HMAC"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: _assess_openssl_version(version)
    },
    "libsodium": {
        "ecosystem": "native",
        "description": "Modern, easy-to-use software library for encryption, decryption, signatures",
        "default_primitives": ["Ed25519", "X25519", "ChaCha20-Poly1305"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "UNSUPPORTED",
            "pqc_details": "libsodium public key algorithms are quantum-vulnerable.",
            "recommended_upgrade": "Combine with liboqs for hybrid post-quantum key encapsulation"
        }
    },
    "liboqs": {
        "ecosystem": "native",
        "description": "Open Quantum Safe C library for quantum-resistant cryptographic algorithms",
        "default_primitives": ["ML-KEM", "ML-DSA", "SLH-DSA", "Falcon", "Kyber", "Dilithium"],
        "default_quantum_risk": "POST_QUANTUM",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "Reference implementation for NIST PQC standardized algorithms.",
            "recommended_upgrade": "Already post-quantum ready (keep updated to latest release)"
        }
    },
    "boringssl": {
        "ecosystem": "native",
        "description": "Google's fork of OpenSSL used in Chrome and Android",
        "default_primitives": ["TLS", "RSA", "ECC", "AES", "ChaCha20", "X25519Kyber768"],
        "default_quantum_risk": "DEGRADED",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED",
            "pqc_details": "BoringSSL implements hybrid post-quantum key exchange for TLS 1.3.",
            "recommended_upgrade": "Enable CECPQ2 / X25519Kyber768 key exchange in TLS client config"
        }
    },
    "botan": {
        "ecosystem": "native",
        "description": "Crypto and TLS library for C++",
        "default_primitives": ["RSA", "ECC", "AES", "Kyber", "Dilithium", "XMSS"],
        "default_quantum_risk": "VULNERABLE",
        "pqc_assessment": lambda version: {
            "status": "SUPPORTED" if version and (version.startswith("3.") or version.startswith("2.19")) else "EXPERIMENTAL",
            "pqc_details": "Botan 3.x natively includes Kyber (ML-KEM) and Dilithium (ML-DSA).",
            "recommended_upgrade": "Upgrade to Botan >= 3.2.0"
        }
    }
}


def _assess_bouncycastle_version(version: Optional[str]) -> Dict[str, str]:
    """Check Bouncy Castle version against NIST PQC introduction (1.73+)."""
    if not version:
        return {
            "status": "UNVERIFIED",
            "pqc_details": "Version unverified. Bouncy Castle 1.73+ is required for ML-KEM and ML-DSA support.",
            "recommended_upgrade": "Upgrade to bcprov-jdk18on >= 1.78"
        }
    try:
        # e.g., 1.78, 1.73, 1.70, 1.68
        match = re.search(r'(\d+)\.(\d+)', version)
        if match:
            major, minor = int(match.group(1)), int(match.group(2))
            if major > 1 or (major == 1 and minor >= 73):
                return {
                    "status": "SUPPORTED",
                    "pqc_details": f"Bouncy Castle {version} includes NIST standardized PQC algorithms (ML-KEM, ML-DSA, SLH-DSA).",
                    "recommended_upgrade": "Ensure application code instantiates ML-KEM/ML-DSA keypair generators"
                }
            else:
                return {
                    "status": "REQUIRES_UPGRADE",
                    "pqc_details": f"Bouncy Castle {version} lacks NIST standardized PQC algorithms. Upgrade required.",
                    "recommended_upgrade": "Upgrade to bcprov-jdk18on >= 1.78"
                }
    except Exception:
        pass
    return {
        "status": "UNVERIFIED",
        "pqc_details": f"Unable to verify PQC support for version {version}.",
        "recommended_upgrade": "Upgrade to bcprov-jdk18on >= 1.78"
    }


def _assess_openssl_version(version: Optional[str]) -> Dict[str, str]:
    """Check OpenSSL version against PQC / TLS 1.3 capabilities."""
    if not version:
        return {
            "status": "UNVERIFIED",
            "pqc_details": "Version unverified. OpenSSL 3.x + oqsprovider required for post-quantum algorithms.",
            "recommended_upgrade": "Ensure OpenSSL >= 3.2.0 with oqsprovider plugin"
        }
    if version.startswith("1.0") or version.startswith("1.1.0"):
        return {
            "status": "UNSUPPORTED",
            "pqc_details": f"OpenSSL {version} is End of Life and fundamentally lacks PQC support.",
            "recommended_upgrade": "Migrate to OpenSSL 3.x and install oqsprovider"
        }
    if version.startswith("1.1.1"):
        return {
            "status": "UNSUPPORTED",
            "pqc_details": f"OpenSSL {version} is End of Life. No official oqsprovider support.",
            "recommended_upgrade": "Upgrade to OpenSSL 3.x"
        }
    return {
        "status": "EXPERIMENTAL",
        "pqc_details": f"OpenSSL {version} requires the Open Quantum Safe 'oqsprovider' plugin to enable ML-KEM/ML-DSA.",
        "recommended_upgrade": "Deploy oqsprovider with OpenSSL 3.x"
    }


def normalize_package_name(name: str) -> str:
    """Normalize package names across formats and case."""
    clean = name.strip().lower()
    # Normalize Python dashes/underscores
    clean = clean.replace("_", "-")
    return clean


def is_crypto_package(name: str) -> bool:
    """Determine whether a package is a known cryptographic library."""
    norm = normalize_package_name(name)
    for known in KNOWN_CRYPTO_LIBRARIES.keys():
        known_norm = normalize_package_name(known)
        if norm == known_norm or norm.startswith(known_norm + ":") or norm.endswith("/" + known_norm):
            return True
        # Check Java group:artifact
        if ":" in known_norm and norm == known_norm.split(":")[-1]:
            return True
        if known_norm in norm and any(k in norm for k in ["crypto", "bouncy", "oqs", "circl", "nacl", "sodium", "pq"]):
            return True
    return False


# ==================== MANIFEST PARSERS ====================

class ManifestParser:
    """Extract declared and resolved dependencies from project manifests and lockfiles."""

    @staticmethod
    def parse_requirements_txt(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Python requirements.txt."""
        dependencies = []
        for line_no, raw_line in enumerate(content.splitlines(), start=1):
            line = raw_line.strip()
            if not line or line.startswith("#") or line.startswith("-"):
                continue
            # Remove inline comments
            line = re.split(r'\s+#', line)[0].strip()
            # Split name and version specs: pkg>=1.0.0, pkg==2.0, pkg~=1.1
            match = re.match(r'^([a-zA-Z0-9_\-\.]+)(?:([=><~!^]+)(.*))?$', line)
            if match:
                pkg_name = match.group(1).strip()
                version = match.group(3).strip() if match.group(3) else None
                dependencies.append({
                    "name": pkg_name,
                    "version": version or "any",
                    "manifest_path": rel_path,
                    "line_number": line_no,
                    "ecosystem": "python",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_pyproject_toml(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse pyproject.toml dependencies (PEP 621 / Poetry / Flit)."""
        dependencies = []
        if tomllib:
            try:
                data = tomllib.loads(content)
                # PEP 621: [project.dependencies]
                proj_deps = data.get("project", {}).get("dependencies", [])
                for item in proj_deps:
                    match = re.match(r'^([a-zA-Z0-9_\-\.]+)(?:([=><~!^]+)(.*))?$', str(item).strip())
                    if match:
                        dependencies.append({
                            "name": match.group(1).strip(),
                            "version": match.group(3).strip() if match.group(3) else "any",
                            "manifest_path": rel_path,
                            "ecosystem": "python",
                            "direct": True,
                            "transitive": False
                        })
                # Poetry: [tool.poetry.dependencies]
                poetry_deps = data.get("tool", {}).get("poetry", {}).get("dependencies", {})
                for pkg_name, ver in poetry_deps.items():
                    if pkg_name.lower() != "python":
                        dependencies.append({
                            "name": str(pkg_name),
                            "version": str(ver) if not isinstance(ver, dict) else str(ver.get("version", "any")),
                            "manifest_path": rel_path,
                            "ecosystem": "python",
                            "direct": True,
                            "transitive": False
                        })
                return dependencies
            except Exception:
                pass

        # Regex fallback for pyproject.toml
        for match in re.finditer(r'["\']([a-zA-Z0-9_\-\.]+)["\']\s*=\s*["\']([^"\']+)["\']', content):
            name, ver = match.group(1), match.group(2)
            if name.lower() not in {"python", "name", "version", "description"}:
                dependencies.append({
                    "name": name,
                    "version": ver,
                    "manifest_path": rel_path,
                    "ecosystem": "python",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_pipfile(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Pipfile."""
        dependencies = []
        in_packages = False
        for line in content.splitlines():
            line = line.strip()
            if line.startswith("[packages]") or line.startswith("[dev-packages]"):
                in_packages = True
                continue
            if line.startswith("[") and not (line.startswith("[packages]") or line.startswith("[dev-packages]")):
                in_packages = False
                continue
            if in_packages and "=" in line:
                parts = line.split("=", 1)
                name = parts[0].strip().strip('"\'')
                ver = parts[1].strip().strip('"\'')
                dependencies.append({
                    "name": name,
                    "version": ver if ver != "*" else "any",
                    "manifest_path": rel_path,
                    "ecosystem": "python",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_poetry_lock(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse poetry.lock for direct and transitive packages."""
        dependencies = []
        if tomllib:
            try:
                data = tomllib.loads(content)
                for pkg in data.get("package", []):
                    name = pkg.get("name")
                    ver = pkg.get("version")
                    if name:
                        dependencies.append({
                            "name": str(name),
                            "version": str(ver or "any"),
                            "manifest_path": rel_path,
                            "ecosystem": "python",
                            "direct": False,  # refined against direct manifests later
                            "transitive": True
                        })
                return dependencies
            except Exception:
                pass

        # Regex fallback
        for match in re.finditer(r'name\s*=\s*["\']([^"\']+)["\']\s*\n\s*version\s*=\s*["\']([^"\']+)["\']', content):
            dependencies.append({
                "name": match.group(1),
                "version": match.group(2),
                "manifest_path": rel_path,
                "ecosystem": "python",
                "direct": False,
                "transitive": True
            })
        return dependencies

    @staticmethod
    def parse_package_json(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse JavaScript package.json."""
        dependencies = []
        try:
            data = json.loads(content)
            for section in ["dependencies", "devDependencies", "peerDependencies"]:
                sec_dict = data.get(section, {})
                if isinstance(sec_dict, dict):
                    for name, ver in sec_dict.items():
                        dependencies.append({
                            "name": name,
                            "version": str(ver),
                            "manifest_path": rel_path,
                            "ecosystem": "npm",
                            "direct": True,
                            "transitive": False,
                            "scope": section
                        })
        except Exception:
            pass
        return dependencies

    @staticmethod
    def parse_package_lock_json(content: str, rel_path: str, direct_names: Set[str]) -> List[Dict[str, Any]]:
        """Parse package-lock.json for resolved versions and transitive dependencies."""
        dependencies = []
        try:
            data = json.loads(content)
            # npm lockfile v2/v3: 'packages'
            packages = data.get("packages", {})
            if isinstance(packages, dict):
                for pkg_key, info in packages.items():
                    if not pkg_key:  # root
                        continue
                    clean_name = pkg_key.replace("node_modules/", "")
                    if clean_name and isinstance(info, dict):
                        ver = info.get("version", "unknown")
                        is_direct = clean_name in direct_names
                        dependencies.append({
                            "name": clean_name,
                            "version": str(ver),
                            "manifest_path": rel_path,
                            "ecosystem": "npm",
                            "direct": is_direct,
                            "transitive": not is_direct
                        })
            # npm lockfile v1: 'dependencies'
            deps = data.get("dependencies", {})
            if isinstance(deps, dict) and not dependencies:
                for name, info in deps.items():
                    if isinstance(info, dict):
                        ver = info.get("version", "unknown")
                        is_direct = name in direct_names
                        dependencies.append({
                            "name": name,
                            "version": str(ver),
                            "manifest_path": rel_path,
                            "ecosystem": "npm",
                            "direct": is_direct,
                            "transitive": not is_direct
                        })
        except Exception:
            pass
        return dependencies

    @staticmethod
    def parse_yarn_lock(content: str, rel_path: str, direct_names: Set[str]) -> List[Dict[str, Any]]:
        """Parse yarn.lock."""
        dependencies = []
        current_name = None
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.endswith(":") and "@" in line:
                # e.g., "crypto-js@^4.1.1:" or "@noble/curves@^1.0.0:"
                header = line[:-1].strip('"\'')
                # extract package name before the last @
                parts = header.split(",")
                first_part = parts[0].strip().strip('"\'')
                if first_part.startswith("@"):
                    at_idx = first_part[1:].find("@")
                    current_name = first_part[:at_idx + 1] if at_idx != -1 else first_part
                else:
                    current_name = first_part.split("@")[0]
            elif current_name and line.startswith("version "):
                ver_match = re.search(r'version\s+["\']?([^"\'\s]+)["\']?', line)
                if ver_match:
                    ver = ver_match.group(1)
                    is_direct = current_name in direct_names
                    dependencies.append({
                        "name": current_name,
                        "version": ver,
                        "manifest_path": rel_path,
                        "ecosystem": "npm",
                        "direct": is_direct,
                        "transitive": not is_direct
                    })
                current_name = None
        return dependencies

    @staticmethod
    def parse_pom_xml(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Java Maven pom.xml."""
        dependencies = []
        try:
            # Strip XML namespaces for simpler tag navigation
            clean_xml = re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', content, count=1)
            root = ET.fromstring(clean_xml)
            for dep in root.findall(".//dependency"):
                group_id = dep.findtext("groupId", "").strip()
                artifact_id = dep.findtext("artifactId", "").strip()
                version = dep.findtext("version", "any").strip()
                if artifact_id:
                    full_name = f"{group_id}:{artifact_id}" if group_id else artifact_id
                    dependencies.append({
                        "name": full_name,
                        "version": version,
                        "manifest_path": rel_path,
                        "ecosystem": "maven",
                        "direct": True,
                        "transitive": False
                    })
        except Exception:
            # Regex fallback
            for match in re.finditer(r'<dependency>[\s\S]*?<groupId>([^<]+)</groupId>[\s\S]*?<artifactId>([^<]+)</artifactId>(?:[\s\S]*?<version>([^<]+)</version>)?[\s\S]*?</dependency>', content):
                grp, art, ver = match.group(1).strip(), match.group(2).strip(), match.group(3)
                full_name = f"{grp}:{art}"
                dependencies.append({
                    "name": full_name,
                    "version": ver.strip() if ver else "any",
                    "manifest_path": rel_path,
                    "ecosystem": "maven",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_build_gradle(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Java Gradle build.gradle / build.gradle.kts."""
        dependencies = []
        # Match implementation 'group:artifact:version' or implementation("group:artifact:version")
        patterns = [
            r'(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s*[\(\s]["\']([^:"\'\s]+):([^:"\'\s]+)(?::([^:"\'\s]+))?["\']',
            r'group\s*:\s*["\']([^"\']+)["\'],\s*name\s*:\s*["\']([^"\']+)["\'](?:,\s*version\s*:\s*["\']([^"\']+)["\'])?'
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, content):
                grp = match.group(1).strip()
                art = match.group(2).strip()
                ver = match.group(3).strip() if match.group(3) else "any"
                dependencies.append({
                    "name": f"{grp}:{art}",
                    "version": ver,
                    "manifest_path": rel_path,
                    "ecosystem": "maven",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_go_mod(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Go go.mod."""
        dependencies = []
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            is_indirect = "// indirect" in line
            clean = line.replace("// indirect", "").strip()
            if clean.startswith("require "):
                clean = clean[len("require "):].strip()
            # Match module path and version
            parts = clean.split()
            if len(parts) >= 2 and not parts[0].startswith("(") and not parts[0].startswith(")"):
                mod_name = parts[0].strip()
                ver = parts[1].strip()
                if mod_name not in {"module", "go"}:
                    dependencies.append({
                        "name": mod_name,
                        "version": ver,
                        "manifest_path": rel_path,
                        "ecosystem": "go",
                        "direct": not is_indirect,
                        "transitive": is_indirect
                    })
        return dependencies

    @staticmethod
    def parse_cargo_toml(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse Rust Cargo.toml."""
        dependencies = []
        if tomllib:
            try:
                data = tomllib.loads(content)
                for sec in ["dependencies", "dev-dependencies", "build-dependencies"]:
                    deps = data.get(sec, {})
                    if isinstance(deps, dict):
                        for name, val in deps.items():
                            ver = val if isinstance(val, str) else (val.get("version", "any") if isinstance(val, dict) else "any")
                            dependencies.append({
                                "name": name,
                                "version": str(ver),
                                "manifest_path": rel_path,
                                "ecosystem": "cargo",
                                "direct": True,
                                "transitive": False
                            })
                return dependencies
            except Exception:
                pass

        # Regex fallback
        in_deps = False
        for line in content.splitlines():
            line = line.strip()
            if line.startswith("[dependencies]") or line.startswith("[dev-dependencies]"):
                in_deps = True
                continue
            if line.startswith("["):
                in_deps = False
                continue
            if in_deps and "=" in line:
                parts = line.split("=", 1)
                name = parts[0].strip().strip('"\'')
                ver_match = re.search(r'["\']([^"\']+)["\']', parts[1])
                ver = ver_match.group(1) if ver_match else "any"
                dependencies.append({
                    "name": name,
                    "version": ver,
                    "manifest_path": rel_path,
                    "ecosystem": "cargo",
                    "direct": True,
                    "transitive": False
                })
        return dependencies

    @staticmethod
    def parse_cargo_lock(content: str, rel_path: str, direct_names: Set[str]) -> List[Dict[str, Any]]:
        """Parse Rust Cargo.lock."""
        dependencies = []
        if tomllib:
            try:
                data = tomllib.loads(content)
                for pkg in data.get("package", []):
                    name = pkg.get("name")
                    ver = pkg.get("version")
                    if name:
                        is_direct = name in direct_names
                        dependencies.append({
                            "name": str(name),
                            "version": str(ver or "any"),
                            "manifest_path": rel_path,
                            "ecosystem": "cargo",
                            "direct": is_direct,
                            "transitive": not is_direct
                        })
                return dependencies
            except Exception:
                pass

        # Regex fallback
        for match in re.finditer(r'\[\[package\]\][\s\S]*?name\s*=\s*["\']([^"\']+)["\'][\s\S]*?version\s*=\s*["\']([^"\']+)["\']', content):
            name = match.group(1)
            ver = match.group(2)
            is_direct = name in direct_names
            dependencies.append({
                "name": name,
                "version": ver,
                "manifest_path": rel_path,
                "ecosystem": "cargo",
                "direct": is_direct,
                "transitive": not is_direct
            })
        return dependencies

    @staticmethod
    def parse_cmake_lists(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse C/C++ CMakeLists.txt."""
        dependencies = []
        # find_package(OpenSSL REQUIRED)
        for match in re.finditer(r'find_package\s*\(\s*([a-zA-Z0-9_\-]+)(?:\s+([0-9\.]+))?[^\)]*\)', content, re.IGNORECASE):
            pkg = match.group(1).strip()
            ver = match.group(2).strip() if match.group(2) else "any"
            dependencies.append({
                "name": pkg.lower(),
                "version": ver,
                "manifest_path": rel_path,
                "ecosystem": "native",
                "direct": True,
                "transitive": False
            })
        # FetchContent_Declare(liboqs ...)
        for match in re.finditer(r'FetchContent_Declare\s*\(\s*([a-zA-Z0-9_\-]+)[^\)]*GIT_TAG\s+([^\s\)]+)', content, re.IGNORECASE):
            pkg = match.group(1).strip()
            ver = match.group(2).strip()
            dependencies.append({
                "name": pkg.lower(),
                "version": ver,
                "manifest_path": rel_path,
                "ecosystem": "native",
                "direct": True,
                "transitive": False
            })
        return dependencies

    @staticmethod
    def parse_vcpkg_json(content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parse C/C++ vcpkg.json."""
        dependencies = []
        try:
            data = json.loads(content)
            for dep in data.get("dependencies", []):
                name = dep if isinstance(dep, str) else dep.get("name")
                ver = dep.get("version>=") if isinstance(dep, dict) else "any"
                if name:
                    dependencies.append({
                        "name": str(name).lower(),
                        "version": str(ver or "any"),
                        "manifest_path": rel_path,
                        "ecosystem": "native",
                        "direct": True,
                        "transitive": False
                    })
        except Exception:
            pass
        return dependencies


# ==================== MAIN DEPENDENCY MAPPER ====================

class CryptographicDependencyMapper:
    """Discovers dependencies from files_data, filters crypto libraries, maps to findings, and computes impact."""

    @classmethod
    def discover_all_dependencies(cls, files_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Scan all files for recognized dependency manifests and lockfiles."""
        all_deps: List[Dict[str, Any]] = []
        direct_names_by_eco: Dict[str, Set[str]] = {
            "python": set(),
            "npm": set(),
            "maven": set(),
            "go": set(),
            "cargo": set(),
            "native": set()
        }

        # Step 1: Collect direct manifests first
        for file in files_data:
            rel_path = file.get("rel_path", "")
            fname = os.path.basename(rel_path).lower()
            content = file.get("content", "")
            if not content:
                continue

            if fname == "requirements.txt" or (fname.startswith("requirements") and fname.endswith(".txt")):
                deps = ManifestParser.parse_requirements_txt(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["python"].update(d["name"].lower() for d in deps)

            elif fname == "pyproject.toml":
                deps = ManifestParser.parse_pyproject_toml(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["python"].update(d["name"].lower() for d in deps)

            elif fname == "pipfile":
                deps = ManifestParser.parse_pipfile(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["python"].update(d["name"].lower() for d in deps)

            elif fname == "package.json":
                deps = ManifestParser.parse_package_json(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["npm"].update(d["name"].lower() for d in deps)

            elif fname == "pom.xml":
                deps = ManifestParser.parse_pom_xml(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["maven"].update(d["name"].lower() for d in deps)

            elif fname in {"build.gradle", "build.gradle.kts"}:
                deps = ManifestParser.parse_build_gradle(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["maven"].update(d["name"].lower() for d in deps)

            elif fname == "go.mod":
                deps = ManifestParser.parse_go_mod(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["go"].update(d["name"].lower() for d in deps if d.get("direct"))

            elif fname == "cargo.toml":
                deps = ManifestParser.parse_cargo_toml(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["cargo"].update(d["name"].lower() for d in deps)

            elif fname in {"cmakelists.txt", "vcpkg.json"}:
                if fname == "cmakelists.txt":
                    deps = ManifestParser.parse_cmake_lists(content, rel_path)
                else:
                    deps = ManifestParser.parse_vcpkg_json(content, rel_path)
                all_deps.extend(deps)
                direct_names_by_eco["native"].update(d["name"].lower() for d in deps)

        # Step 2: Parse lockfiles with knowledge of direct dependencies
        for file in files_data:
            rel_path = file.get("rel_path", "")
            fname = os.path.basename(rel_path).lower()
            content = file.get("content", "")
            if not content:
                continue

            if fname == "poetry.lock":
                lock_deps = ManifestParser.parse_poetry_lock(content, rel_path)
                for d in lock_deps:
                    d["direct"] = d["name"].lower() in direct_names_by_eco["python"]
                    d["transitive"] = not d["direct"]
                all_deps.extend(lock_deps)

            elif fname == "package-lock.json":
                lock_deps = ManifestParser.parse_package_lock_json(content, rel_path, direct_names_by_eco["npm"])
                all_deps.extend(lock_deps)

            elif fname == "yarn.lock":
                lock_deps = ManifestParser.parse_yarn_lock(content, rel_path, direct_names_by_eco["npm"])
                all_deps.extend(lock_deps)

            elif fname == "cargo.lock":
                lock_deps = ManifestParser.parse_cargo_lock(content, rel_path, direct_names_by_eco["cargo"])
                all_deps.extend(lock_deps)

        # Step 3: Deduplicate identical package + version + manifest entries
        seen: Set[Tuple[str, str, str]] = set()
        deduped: List[Dict[str, Any]] = []
        for d in all_deps:
            key = (d["name"].lower(), d["version"], d["manifest_path"])
            if key not in seen:
                seen.add(key)
                deduped.append(d)

        return deduped

    @classmethod
    def match_known_crypto_library(cls, pkg_name: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        """Check if package name matches our cryptographic registry."""
        norm = normalize_package_name(pkg_name)
        for known_key, meta in KNOWN_CRYPTO_LIBRARIES.items():
            known_norm = normalize_package_name(known_key)
            if norm == known_norm:
                return known_key, meta
            if ":" in known_norm and norm == known_norm.split(":")[-1]:
                return known_key, meta
            if known_norm in norm and any(k in norm for k in ["crypto", "bouncy", "oqs", "circl", "nacl", "sodium", "pq"]):
                return known_key, meta
        return None

    @classmethod
    def analyze_cryptographic_dependencies(
        cls,
        files_data: List[Dict[str, Any]],
        scanner_findings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform end-to-end cryptographic dependency discovery, mapping, graphing, and impact analysis."""
        all_raw_dependencies = cls.discover_all_dependencies(files_data)

        # 1. Filter and classify cryptographic dependencies
        crypto_dependencies: List[Dict[str, Any]] = []
        non_crypto_count = 0

        for dep in all_raw_dependencies:
            pkg_name = dep["name"]
            matched = cls.match_known_crypto_library(pkg_name)
            if not matched:
                non_crypto_count += 1
                continue

            known_key, meta = matched
            version = dep.get("version", "any")
            pqc_func = meta.get("pqc_assessment")
            pqc_info = pqc_func(version if version != "any" else None) if pqc_func else {
                "status": "UNVERIFIED",
                "pqc_details": "PQC support unverified.",
                "recommended_upgrade": "Assess post-quantum compatibility."
            }

            crypto_dep = {
                "package_name": pkg_name,
                "canonical_name": known_key,
                "version": version,
                "manifest_path": dep.get("manifest_path", "unknown"),
                "ecosystem": dep.get("ecosystem", meta.get("ecosystem", "unknown")),
                "direct": dep.get("direct", True),
                "transitive": dep.get("transitive", False),
                "description": meta.get("description", "Cryptographic library"),
                "default_primitives": meta.get("default_primitives", []),
                "pqc_support_status": pqc_info.get("status", "UNVERIFIED"),
                "pqc_details": pqc_info.get("pqc_details", ""),
                "recommended_upgrade": pqc_info.get("recommended_upgrade", ""),
                "associated_algorithms": [],
                "associated_findings": [],
                "related_files": [],
                "active_in_code": False,
                "classical_risk": "SAFE",
                "quantum_risk": meta.get("default_quantum_risk", "UNKNOWN"),
                "confidence": 0.95 if dep.get("direct") else 0.85
            }
            crypto_dependencies.append(crypto_dep)

        # 2. Correlate with Batch 1 source-code cryptographic findings
        cls._correlate_with_source_findings(crypto_dependencies, scanner_findings, files_data)

        # 3. Construct Dependency Relationship Graph
        graph = cls._build_dependency_graph(crypto_dependencies, scanner_findings)

        # 4. Generate Migration Impact Analysis
        migration_impacts = cls._generate_migration_impact(crypto_dependencies)

        # Summary statistics
        total_deps = len(all_raw_dependencies)
        crypto_count = len(crypto_dependencies)
        direct_count = sum(1 for d in crypto_dependencies if d.get("direct"))
        transitive_count = sum(1 for d in crypto_dependencies if d.get("transitive"))
        active_in_code_count = sum(1 for d in crypto_dependencies if d.get("active_in_code"))
        quantum_vulnerable_count = sum(1 for d in crypto_dependencies if d.get("quantum_risk") == "VULNERABLE")
        pqc_ready_count = sum(1 for d in crypto_dependencies if d.get("pqc_support_status") == "SUPPORTED")

        return {
            "summary": {
                "total_dependencies": total_deps,
                "cryptographic_dependencies": crypto_count,
                "non_cryptographic_dependencies": non_crypto_count,
                "direct_crypto_dependencies": direct_count,
                "transitive_crypto_dependencies": transitive_count,
                "active_in_source_code": active_in_code_count,
                "declared_only": crypto_count - active_in_code_count,
                "quantum_vulnerable_count": quantum_vulnerable_count,
                "pqc_ready_count": pqc_ready_count
            },
            "dependencies": crypto_dependencies,
            "dependency_graph": graph,
            "migration_impact": migration_impacts
        }

    @classmethod
    def _correlate_with_source_findings(
        cls,
        crypto_dependencies: List[Dict[str, Any]],
        scanner_findings: List[Dict[str, Any]],
        files_data: List[Dict[str, Any]]
    ):
        """Cross-reference discovered manifest dependencies with actual scanner findings."""
        # Map findings by ecosystem / file extension
        findings_by_ext: Dict[str, List[Dict[str, Any]]] = {}
        for f in scanner_findings:
            fpath = f.get("file_path", "")
            ext = os.path.splitext(fpath)[1].lower()
            findings_by_ext.setdefault(ext, []).append(f)

        for dep in crypto_dependencies:
            eco = dep.get("ecosystem", "")
            canon = dep.get("canonical_name", "").lower()
            pkg = dep.get("package_name", "").lower()
            matched_findings = []
            matched_files = set()
            matched_algos = set()

            # Find matching source findings by library_or_api or language context
            target_exts = {
                "python": {".py"},
                "npm": {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"},
                "maven": {".java"},
                "go": {".go"},
                "cargo": {".rs"},
                "native": {".c", ".cpp", ".h", ".hpp"}
            }.get(eco, set())

            candidate_findings: List[Dict[str, Any]] = []
            for ext in target_exts:
                candidate_findings.extend(findings_by_ext.get(ext, []))

            for f in candidate_findings:
                lib_api = (f.get("library_or_api") or "").lower()
                algo = f.get("algorithm", "UNKNOWN")
                finding_id = f.get("title") or f"{algo} in {f.get('file_path')}:{f.get('line_number')}"

                # Match by explicit library name or algorithm affinity
                is_match = False
                if canon in lib_api or pkg in lib_api:
                    is_match = True
                elif eco == "python" and canon == "cryptography" and ("cryptography" in lib_api or "hazmat" in lib_api):
                    is_match = True
                elif eco == "python" and canon == "pycryptodome" and "pycryptodome" in lib_api:
                    is_match = True
                elif eco == "maven" and "bouncycastle" in canon and ("bouncycastle" in lib_api or "jce" in lib_api or "bc" in lib_api):
                    is_match = True
                elif eco == "npm" and canon == "crypto-js" and "cryptojs" in lib_api:
                    is_match = True
                elif eco == "go" and "circl" in canon and "circl" in lib_api:
                    is_match = True
                elif eco == "native" and canon == "openssl" and ("openssl" in lib_api or "evp" in lib_api):
                    is_match = True
                # If only one crypto library for this ecosystem in the project, correlate related findings
                elif len([d for d in crypto_dependencies if d.get("ecosystem") == eco]) == 1 and algo in dep.get("default_primitives", []):
                    is_match = True

                if is_match:
                    matched_findings.append({
                        "id": finding_id,
                        "algorithm": algo,
                        "variant": f.get("variant"),
                        "file_path": f.get("file_path"),
                        "line_number": f.get("line_number"),
                        "quantum_risk": f.get("quantum_risk"),
                        "classical_risk": f.get("classical_risk")
                    })
                    matched_files.add(f.get("file_path"))
                    matched_algos.add(algo)

            if matched_findings:
                dep["active_in_code"] = True
                dep["associated_algorithms"] = sorted(list(matched_algos))
                dep["related_files"] = sorted(list(matched_files))
                dep["associated_findings"] = matched_findings

                # Dynamically calculate risks based on active findings
                if any(f.get("quantum_risk") == "VULNERABLE" for f in matched_findings):
                    dep["quantum_risk"] = "VULNERABLE"
                elif any(f.get("quantum_risk") == "DEGRADED" for f in matched_findings):
                    dep["quantum_risk"] = "DEGRADED"
                elif all(f.get("quantum_risk") == "POST_QUANTUM" for f in matched_findings):
                    dep["quantum_risk"] = "POST_QUANTUM"
                elif all(f.get("quantum_risk") == "SAFE" for f in matched_findings):
                    dep["quantum_risk"] = "SAFE"

                if any(f.get("classical_risk") == "CRITICAL" for f in matched_findings):
                    dep["classical_risk"] = "CRITICAL"
                elif any(f.get("classical_risk") == "HIGH" for f in matched_findings):
                    dep["classical_risk"] = "HIGH"
                elif any(f.get("classical_risk") == "MEDIUM" for f in matched_findings):
                    dep["classical_risk"] = "MEDIUM"
            else:
                dep["active_in_code"] = False
                dep["associated_algorithms"] = []
                dep["related_files"] = []
                dep["associated_findings"] = []

    @classmethod
    def _build_dependency_graph(
        cls,
        crypto_dependencies: List[Dict[str, Any]],
        scanner_findings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Build an interactive dependency relationship graph model:
        Project → Package → Algorithm → Finding
        """
        nodes: List[Dict[str, Any]] = []
        links: List[Dict[str, Any]] = []
        node_ids: Set[str] = set()

        def add_node(node_id: str, label: str, node_type: str, **kwargs):
            if node_id not in node_ids:
                node_ids.add(node_id)
                nodes.append({
                    "id": node_id,
                    "label": label,
                    "type": node_type,
                    **kwargs
                })

        def add_link(source: str, target: str, relationship: str, **kwargs):
            links.append({
                "source": source,
                "target": target,
                "relationship": relationship,
                **kwargs
            })

        # 1. Project Root Node
        root_id = "project:root"
        add_node(
            node_id=root_id,
            label="Root Project",
            node_type="project",
            quantum_risk="SAFE"
        )

        # 2. Package Nodes
        for dep in crypto_dependencies:
            pkg_name = dep["package_name"]
            pkg_id = f"pkg:{dep['ecosystem']}:{pkg_name}"
            ver_label = f"{pkg_name}@{dep['version']}" if dep['version'] != "any" else pkg_name

            add_node(
                node_id=pkg_id,
                label=ver_label,
                node_type="package",
                ecosystem=dep["ecosystem"],
                direct=dep["direct"],
                transitive=dep["transitive"],
                active=dep["active_in_code"],
                pqc_status=dep["pqc_support_status"],
                quantum_risk=dep["quantum_risk"],
                classical_risk=dep["classical_risk"]
            )
            add_link(
                source=root_id,
                target=pkg_id,
                relationship="declares" if dep["direct"] else "resolves_transitive",
                quantum_risk=dep["quantum_risk"]
            )

            # 3. Algorithm Nodes (for active dependencies)
            for algo in dep.get("associated_algorithms", []):
                algo_id = f"algo:{dep['ecosystem']}:{pkg_name}:{algo}"
                # Determine quantum risk of algorithm
                algo_risk = "VULNERABLE" if algo.upper() in {"RSA", "ECC", "ECDSA", "ECDH", "DH", "DSA"} else (
                    "DEGRADED" if algo.upper() in {"AES", "AES-128", "SHA-1"} else (
                        "POST_QUANTUM" if algo.upper() in {"ML-KEM", "ML-DSA", "SLH-DSA"} else "SAFE"
                    )
                )

                add_node(
                    node_id=algo_id,
                    label=algo,
                    node_type="algorithm",
                    parent_package=pkg_name,
                    quantum_risk=algo_risk
                )
                add_link(
                    source=pkg_id,
                    target=algo_id,
                    relationship="implements",
                    quantum_risk=algo_risk
                )

                # 4. Finding Nodes
                for finding in dep.get("associated_findings", []):
                    if finding.get("algorithm") == algo:
                        finding_id = f"finding:{finding.get('file_path')}:{finding.get('line_number')}:{algo}"
                        short_file = os.path.basename(finding.get('file_path', ''))
                        finding_label = f"{finding.get('variant') or algo} ({short_file}:{finding.get('line_number')})"

                        add_node(
                            node_id=finding_id,
                            label=finding_label,
                            node_type="finding",
                            file_path=finding.get("file_path"),
                            line_number=finding.get("line_number"),
                            quantum_risk=finding.get("quantum_risk"),
                            classical_risk=finding.get("classical_risk")
                        )
                        add_link(
                            source=algo_id,
                            target=finding_id,
                            relationship="manifests_in",
                            quantum_risk=finding.get("quantum_risk")
                        )

        return {
            "nodes": nodes,
            "links": links,
            "total_nodes": len(nodes),
            "total_links": len(links)
        }

    @classmethod
    def _generate_migration_impact(cls, crypto_dependencies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate dependency-level migration impact analysis."""
        impacts: List[Dict[str, Any]] = []

        for dep in crypto_dependencies:
            pkg_name = dep["package_name"]
            ver = dep.get("version", "any")
            active = dep.get("active_in_code", False)
            pqc_status = dep.get("pqc_support_status", "UNVERIFIED")
            q_risk = dep.get("quantum_risk", "UNKNOWN")
            algos = dep.get("associated_algorithms", [])
            files = dep.get("related_files", [])

            # Assess migration complexity
            if not active:
                complexity = "LOW"
                reason = "Dependency is declared in manifest but not actively referenced in audited source code."
                upgrade_or_replace = "Audit whether dependency is needed; remove if unused or pin to PQC-compatible version."
            elif q_risk == "POST_QUANTUM":
                complexity = "LOW"
                reason = f"Library '{pkg_name}' already provides quantum-safe primitives. Maintain library version updates."
                upgrade_or_replace = "Keep updated to ensure adherence to finalized NIST FIPS standards."
            elif q_risk == "SAFE":
                complexity = "LOW"
                reason = f"Used exclusively for quantum-resilient symmetric ciphers or hashes ({', '.join(algos)})."
                upgrade_or_replace = "Ensure 256-bit key sizes (e.g. AES-256) are enforced across configurations."
            elif pqc_status == "SUPPORTED":
                complexity = "MEDIUM"
                reason = f"Library '{pkg_name}' supports post-quantum algorithms in version {ver}, but application code currently invokes classical algorithms ({', '.join(algos)})."
                upgrade_or_replace = f"Refactor key generation and handshake routines across {len(files)} file(s) to utilize PQC primitives provided by {pkg_name}."
            elif pqc_status in {"REQUIRES_UPGRADE", "EXPERIMENTAL"}:
                complexity = "MEDIUM"
                reason = f"Current version ({ver}) lacks production PQC support. Library offers a viable upgrade path to enable PQC."
                upgrade_or_replace = dep.get("recommended_upgrade", "Upgrade to latest version with PQC capabilities.")
            else:
                complexity = "HIGH"
                reason = f"Library '{pkg_name}' does not support NIST PQC algorithms and is actively used for quantum-vulnerable cryptography ({', '.join(algos)}) across {len(files)} source file(s)."
                upgrade_or_replace = dep.get("recommended_upgrade", f"Replace {pkg_name} with a post-quantum cryptographic provider.")

            impacts.append({
                "package_name": pkg_name,
                "ecosystem": dep.get("ecosystem"),
                "current_version": ver,
                "manifest_path": dep.get("manifest_path"),
                "active_in_code": active,
                "dependent_assets": algos,
                "affected_files": files,
                "affected_files_count": len(files),
                "pqc_support_status": pqc_status,
                "quantum_risk": q_risk,
                "migration_complexity": complexity,  # LOW, MEDIUM, HIGH
                "complexity_reason": reason,
                "recommended_action": upgrade_or_replace
            })

        return impacts
