"""
QuantumShield 2.0 - PQC Vulnerability Remediation & Code Suggestion Engine.
Analyzes vulnerable cryptographic assets, determines NIST FIPS 203/204/205 targets,
and generates context-aware unified diff patches and migration templates.
"""

import re
import difflib
from typing import List, Dict, Any, Optional, Tuple

# Exact NIST-Standardized Mappings
PQC_MAPPINGS = {
    # Key Establishment -> NIST FIPS 203 (ML-KEM)
    "KEY_ESTABLISHMENT": {
        "RSA": {
            "standard_target": "ML-KEM-768 (NIST FIPS 203)",
            "hybrid_target": "X25519 + ML-KEM-768 Dual Hybrid",
            "standard": "FIPS 203",
            "type": "KEM",
            "dependency": "mlkem >= 0.2.0 or OpenSSL 3.5+",
            "rationale": "RSA key transport is polynomial-time factorable by Shor's algorithm. Replace with Module-LWE Key Encapsulation."
        },
        "ECDH": {
            "standard_target": "ML-KEM-768 (NIST FIPS 203)",
            "hybrid_target": "X25519 + ML-KEM-768 Dual Hybrid",
            "standard": "FIPS 203",
            "type": "KEM",
            "dependency": "mlkem >= 0.2.0 or liboqs-python",
            "rationale": "Elliptic Curve Diffie-Hellman discrete logarithms are solved by Shor's algorithm. Deploy hybrid or pure ML-KEM."
        },
        "X25519": {
            "standard_target": "ML-KEM-768 (NIST FIPS 203)",
            "hybrid_target": "X25519 + ML-KEM-768 Dual Hybrid",
            "standard": "FIPS 203 / IETF Hybrid Draft",
            "type": "KEM",
            "dependency": "mlkem >= 0.2.0 and cryptography >= 42.0",
            "rationale": "Curve25519 is vulnerable to Shor's algorithm. Upgrade to dual-hybrid X25519+ML-KEM-768 to maintain classical compatibility while securing against HNDL."
        },
        "DH": {
            "standard_target": "ML-KEM-768 (NIST FIPS 203)",
            "hybrid_target": "X25519 + ML-KEM-768 Dual Hybrid",
            "standard": "FIPS 203",
            "type": "KEM",
            "dependency": "mlkem >= 0.2.0",
            "rationale": "Classical Diffie-Hellman over finite fields is vulnerable to Shor's algorithm. Migrate to lattice-based KEM."
        }
    },
    # Digital Signatures -> NIST FIPS 204 (ML-DSA) & FIPS 205 (SLH-DSA)
    "DIGITAL_SIGNATURE": {
        "RSA": {
            "standard_target": "ML-DSA-65 (NIST FIPS 204)",
            "alternative_target": "SLH-DSA-128f (NIST FIPS 205)",
            "standard": "FIPS 204 / FIPS 205",
            "type": "SIGNATURE",
            "dependency": "liboqs / OpenSSL 3.5+ PQC provider",
            "rationale": "RSA signatures are forgeable under Shor's algorithm. Transition PKI roots and signing to Module-Lattice DSA."
        },
        "ECDSA": {
            "standard_target": "ML-DSA-65 (NIST FIPS 204)",
            "alternative_target": "SLH-DSA-128f (NIST FIPS 205)",
            "standard": "FIPS 204",
            "type": "SIGNATURE",
            "dependency": "liboqs / OpenSSL 3.5+",
            "rationale": "ECDSA private keys can be derived from public keys via Shor's algorithm. Migrate to lattice-based ML-DSA."
        },
        "ED25519": {
            "standard_target": "ML-DSA-65 (NIST FIPS 204)",
            "alternative_target": "SLH-DSA-128f (NIST FIPS 205)",
            "standard": "FIPS 204",
            "type": "SIGNATURE",
            "dependency": "liboqs / OpenSSL 3.5+",
            "rationale": "Ed25519 signatures are quantum-vulnerable under Shor's algorithm. Migrate authentication keys to ML-DSA."
        },
        "DSA": {
            "standard_target": "ML-DSA-65 (NIST FIPS 204)",
            "standard": "FIPS 204",
            "type": "SIGNATURE",
            "dependency": "liboqs / OpenSSL 3.5+",
            "rationale": "Legacy DSA is classically deprecated and broken by Shor's algorithm."
        }
    },
    # Symmetric Ciphers
    "SYMMETRIC": {
        "AES-128": {
            "standard_target": "AES-256-GCM",
            "standard": "NIST SP 800-38D",
            "type": "SYMMETRIC",
            "dependency": "Standard cryptography / pycryptodome",
            "rationale": "AES-128 effective key security is reduced to ~64 bits under Grover's search. Upgrade to 256-bit key space to maintain 128-bit quantum security margin."
        },
        "DES": {
            "standard_target": "AES-256-GCM",
            "standard": "NIST SP 800-38D",
            "type": "SYMMETRIC",
            "dependency": "Standard cryptography / pycryptodome",
            "rationale": "Single-DES is classically broken with a 56-bit key space. Replace immediately with modern authenticated AES-256-GCM."
        },
        "3DES": {
            "standard_target": "AES-256-GCM",
            "standard": "NIST SP 800-38D",
            "type": "SYMMETRIC",
            "dependency": "Standard cryptography / pycryptodome",
            "rationale": "Triple-DES is retired by NIST due to Sweet32 collision attacks and Grover search vulnerability. Migrate to AES-256-GCM."
        },
        "AES-ECB": {
            "standard_target": "AES-256-GCM",
            "standard": "NIST SP 800-38D",
            "type": "SYMMETRIC",
            "dependency": "Standard cryptography / pycryptodome",
            "rationale": "ECB mode leaks plaintext structure. Replace with authenticated GCM mode."
        }
    },
    # Hash Functions
    "HASHING": {
        "MD5": {
            "standard_target": "SHA-256 / SHA-384",
            "standard": "FIPS 180-4",
            "type": "HASH",
            "dependency": "Standard hashlib / java.security",
            "rationale": "MD5 suffers from practical collision attacks. Replace with SHA-256 for integrity or SHA-384 for quantum resilience."
        },
        "SHA-1": {
            "standard_target": "SHA-256 / SHA-384",
            "standard": "FIPS 180-4",
            "type": "HASH",
            "dependency": "Standard hashlib / java.security",
            "rationale": "SHA-1 collision resistance is broken (SHAttered attack). Migrate to SHA-256 or SHA-512."
        }
    }
}

def get_remediation_target(algorithm: str, usage: str, variant: str = "") -> Dict[str, Any]:
    """
    Look up accurate, standardized PQC remediation targets for an asset without conflating
    signature and key encapsulation algorithms.
    """
    algo_u = algorithm.upper().strip()
    usage_u = usage.upper().strip()
    var_u = variant.upper().strip()

    # Hashing
    if algo_u in {"MD5", "SHA-1", "SHA1"}:
        return PQC_MAPPINGS["HASHING"].get(algo_u, PQC_MAPPINGS["HASHING"]["MD5"])

    # Symmetric
    if algo_u in {"DES", "3DES"} or "ECB" in var_u or (algo_u == "AES" and "128" in var_u):
        if "ECB" in var_u:
            return PQC_MAPPINGS["SYMMETRIC"]["AES-ECB"]
        if algo_u in {"DES", "3DES"}:
            return PQC_MAPPINGS["SYMMETRIC"].get(algo_u, PQC_MAPPINGS["SYMMETRIC"]["DES"])
        return PQC_MAPPINGS["SYMMETRIC"]["AES-128"]

    # Digital Signature
    if usage_u in {"DIGITAL_SIGNATURE", "SIGNING"} or algo_u in {"ECDSA", "ED25519", "DSA"}:
        return PQC_MAPPINGS["DIGITAL_SIGNATURE"].get(algo_u, PQC_MAPPINGS["DIGITAL_SIGNATURE"]["RSA"])

    # Key Establishment / Encryption / General
    if usage_u in {"KEY_EXCHANGE", "ENCRYPTION", "KEY_GEN"} or algo_u in {"ECDH", "X25519", "DH", "DIFFIE-HELLMAN"}:
        return PQC_MAPPINGS["KEY_ESTABLISHMENT"].get(algo_u, PQC_MAPPINGS["KEY_ESTABLISHMENT"]["RSA"])

    # Fallback based on algorithm category
    if algo_u == "RSA":
        return PQC_MAPPINGS["KEY_ESTABLISHMENT"]["RSA"] if "KEY" in usage_u else PQC_MAPPINGS["DIGITAL_SIGNATURE"]["RSA"]

    return {
        "standard_target": "NIST PQC Standards (ML-KEM / ML-DSA)",
        "standard": "FIPS 203 / FIPS 204",
        "type": "GENERAL",
        "dependency": "Audit usage context",
        "rationale": f"Algorithm {algorithm} requires audit against NIST Post-Quantum migration roadmaps."
    }

def generate_code_patch(
    source_content: str,
    file_path: str,
    line_number: Optional[int],
    finding: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate unified diff, before/after code snippets, and migration instructions for a finding.
    Performs safe, line-targeted transformations rather than blind global replacements.
    """
    algo = finding.get("algorithm", "").upper()
    variant = finding.get("variant", algo).upper()
    usage = finding.get("usage", "UNKNOWN").upper()
    target_info = get_remediation_target(algo, usage, variant)

    lines = source_content.splitlines(keepends=True)
    total_lines = len(lines)
    target_line_idx = (line_number - 1) if (line_number and 1 <= line_number <= total_lines) else None

    # Context window: 3 lines before, 3 lines after
    ctx_start = max(0, (target_line_idx - 3) if target_line_idx is not None else 0)
    ctx_end = min(total_lines, (target_line_idx + 4) if target_line_idx is not None else min(7, total_lines))
    original_snippet = "".join(lines[ctx_start:ctx_end])

    proposed_lines = list(lines)
    can_auto_patch = False
    patch_type = "MANUAL_TEMPLATE"
    manual_engineering_required = True

    # -------------------------------------------------------------
    # Pattern 1: Python Hashlib (MD5 / SHA-1 -> SHA-256)
    # -------------------------------------------------------------
    if file_path.endswith((".py", ".pyw")):
        if algo in {"MD5", "SHA-1", "SHA1"} and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if "hashlib.md5(" in old_line:
                new_line = old_line.replace("hashlib.md5(", "hashlib.sha256(")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False
            elif "hashlib.sha1(" in old_line:
                new_line = old_line.replace("hashlib.sha1(", "hashlib.sha256(")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False
            elif "MD5.new(" in old_line:
                new_line = old_line.replace("MD5.new(", "SHA256.new(")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False

        elif "ECB" in variant and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if "AES.MODE_ECB" in old_line:
                new_line = old_line.replace("AES.MODE_ECB", "AES.MODE_GCM")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = True # GCM needs nonce/tag handling

        elif algo in {"DES", "3DES"} and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if "DES.new(" in old_line or "DES3.new(" in old_line:
                new_line = re.sub(r'DES3?\.new\(', 'AES.new(', old_line)
                if "MODE_CBC" in new_line or "MODE_ECB" in new_line:
                    new_line = re.sub(r'MODE_(CBC|ECB)', 'MODE_GCM', new_line)
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = True

    # -------------------------------------------------------------
    # Pattern 2: JavaScript / TypeScript (Node crypto)
    # -------------------------------------------------------------
    elif file_path.endswith((".js", ".jsx", ".ts", ".tsx")):
        if algo in {"MD5", "SHA-1", "SHA1"} and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if "createHash('md5')" in old_line or 'createHash("md5")' in old_line:
                new_line = old_line.replace("md5", "sha256")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False
            elif "createHash('sha1')" in old_line or 'createHash("sha1")' in old_line:
                new_line = old_line.replace("sha1", "sha256")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False

    # -------------------------------------------------------------
    # Pattern 3: Java (java.security / javax.crypto)
    # -------------------------------------------------------------
    elif file_path.endswith((".java", ".kt")):
        if algo in {"MD5", "SHA-1", "SHA1"} and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if 'getInstance("MD5")' in old_line:
                new_line = old_line.replace('"MD5"', '"SHA-256"')
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False
            elif 'getInstance("SHA-1")' in old_line:
                new_line = old_line.replace('"SHA-1"', '"SHA-256"')
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False

    # -------------------------------------------------------------
    # Pattern 4: Go (crypto/md5, crypto/des)
    # -------------------------------------------------------------
    elif file_path.endswith(".go"):
        if algo in {"MD5", "SHA-1", "SHA1"} and target_line_idx is not None:
            old_line = proposed_lines[target_line_idx]
            if "md5.New()" in old_line:
                new_line = old_line.replace("md5.New()", "sha256.New()")
                proposed_lines[target_line_idx] = new_line
                can_auto_patch = True
                patch_type = "AUTOMATED_PATCH"
                manual_engineering_required = False

    # If automated line replacement was not possible, generate migration template
    if not can_auto_patch:
        patch_type = "MIGRATION_TEMPLATE"
        manual_engineering_required = True
        template_code = _generate_pqc_template(algo, usage, variant, file_path)
    else:
        template_code = None

    proposed_snippet = "".join(proposed_lines[ctx_start:ctx_end]) if can_auto_patch else template_code

    # Generate unified diff
    diff_generator = difflib.unified_diff(
        lines,
        proposed_lines if can_auto_patch else lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        lineterm=""
    )
    unified_diff_str = "\n".join(diff_generator)

    return {
        "finding_id": finding.get("id"),
        "file_path": file_path,
        "line_number": line_number,
        "vulnerable_primitive": variant,
        "algorithm": algo,
        "usage": usage,
        "target_pqc": target_info.get("standard_target"),
        "target_standard": target_info.get("standard"),
        "dependency_changes": target_info.get("dependency"),
        "rationale": target_info.get("rationale"),
        "patch_type": patch_type,
        "can_auto_apply": can_auto_patch,
        "manual_engineering_required": manual_engineering_required,
        "original_code": original_snippet,
        "proposed_code": proposed_snippet,
        "unified_diff": unified_diff_str,
        "status": "PROPOSED", # PROPOSED, ACCEPTED, REJECTED
        "disclaimer": (
            "NOTICE: Code patches are generated as migration proposals. "
            "Always inspect and run automated unit tests before production deployment."
        )
    }

def _generate_pqc_template(algo: str, usage: str, variant: str, file_path: str) -> str:
    """Generate architectural code template for post-quantum migration."""
    if algo == "RSA" and ("KEY" in usage or "ENC" in usage):
        return (
            "# === PQC MIGRATION TEMPLATE: NIST FIPS 203 (ML-KEM-768) ===\n"
            "# Replace vulnerable RSA key transport with ML-KEM-768 key encapsulation:\n"
            "import mlkem\n\n"
            "# 1. Receiver generates ML-KEM keypair:\n"
            "kem = mlkem.ML_KEM(mlkem.ParameterSet.ML_KEM_768)\n"
            "encaps_key, decaps_key = kem.key_gen()\n\n"
            "# 2. Initiator encapsulates shared secret against encaps_key:\n"
            "shared_secret, ciphertext = kem.encaps(encaps_key)\n\n"
            "# 3. Receiver decapsulates shared secret using decaps_key:\n"
            "recovered_secret = kem.decaps(decaps_key, ciphertext)\n"
        )
    elif algo in {"RSA", "ECDSA", "ED25519"} and "SIGN" in usage:
        return (
            "# === PQC MIGRATION TEMPLATE: NIST FIPS 204 (ML-DSA-65) ===\n"
            "# Replace quantum-vulnerable signature scheme with Module-Lattice DSA:\n"
            "# Note: Requires OpenSSL 3.5+ PQC provider or liboqs-python wrapper.\n"
            "# Signature size: ~2.4 KB (vs ECDSA 64 bytes, ensure protocol buffers accommodate size)\n"
            "from oqs import Signature\n\n"
            "with Signature('ML-DSA-65') as signer:\n"
            "    public_key = signer.generate_keypair()\n"
            "    signature = signer.sign(message_bytes)\n"
        )
    elif algo in {"ECDH", "X25519"}:
        return (
            "# === PQC MIGRATION TEMPLATE: HYBRID X25519 + ML-KEM-768 ===\n"
            "# Combine classical Curve25519 ECDH with NIST FIPS 203 ML-KEM-768:\n"
            "from cryptography.hazmat.primitives.asymmetric import x25519\n"
            "from cryptography.hazmat.primitives.kdf.hkdf import HKDF\n"
            "from cryptography.hazmat.primitives import hashes\n"
            "import mlkem\n\n"
            "# Combine shared secrets via HKDF-SHA-256:\n"
            "# combined_ikm = ss_classical + ss_pqc\n"
            "# aes_key = HKDF(hashes.SHA256(), length=32, salt=b'QuantumShield-Salt', info=b'Hybrid-KEX').derive(combined_ikm)\n"
        )
    return f"# PQC Migration Template for {variant} ({usage}): Review NIST SP 800-227 migration guidelines."

def generate_remediation_roadmap_for_scan(
    findings: List[Dict[str, Any]],
    file_sources: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Generate complete remediation proposals across all detected findings in a scan.
    """
    proposals = []
    sources = file_sources or {}

    for f in findings:
        file_path = f.get("file_path", "")
        line_no = f.get("line_number")
        src_content = sources.get(file_path, "")
        
        # If full source not available, use snippet
        if not src_content and f.get("code_snippet"):
            src_content = f.get("code_snippet", "")

        patch = generate_code_patch(
            source_content=src_content,
            file_path=file_path,
            line_number=line_no,
            finding=f
        )
        proposals.append(patch)

    return proposals
