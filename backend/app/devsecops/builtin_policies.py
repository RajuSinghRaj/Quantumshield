"""
Built-in Security Policy Catalog for QuantumShield 2.0 DevSecOps.
Defines standardized rules for classical cryptography, quantum safety,
dependency supply-chain security, and CBOM artifact requirements.
"""

from typing import List, Dict, Any
from .schemas import PolicyCategory, PolicySeverity, PolicyEnforcement, PolicyDefinition

BUILTIN_POLICIES: List[PolicyDefinition] = [
    # ==================== 1. CLASSICAL CRYPTOGRAPHY POLICIES ====================
    PolicyDefinition(
        id="rule_reject_md5",
        name="Reject MD5 Cryptographic Hash",
        category=PolicyCategory.CLASSICAL,
        description="Rejects any usage of the MD5 hash function for security purposes due to practical collision and preimage vulnerabilities (RFC 6151).",
        default_severity=PolicySeverity.CRITICAL,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"prohibited_algorithms": ["MD5"]}
    ),
    PolicyDefinition(
        id="rule_reject_des_3des",
        name="Reject Legacy DES and Triple-DES Ciphers",
        category=PolicyCategory.CLASSICAL,
        description="Rejects DES (56-bit key) and 3DES (Sweet32 vulnerability) which have inadequate block sizes and security margins (NIST SP 800-131A Rev 2).",
        default_severity=PolicySeverity.CRITICAL,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"prohibited_algorithms": ["DES", "3DES", "TRIPLEDES", "DES3"]}
    ),
    PolicyDefinition(
        id="rule_reject_weak_rsa",
        name="Reject Weak RSA Key Sizes (< 2048 bits)",
        category=PolicyCategory.CLASSICAL,
        description="Enforces a minimum RSA modulus size of 2048 bits. Keys under 2048 bits (e.g. 1024 or 512 bits) are vulnerable to classical factorization attacks.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"min_rsa_key_size": 2048}
    ),
    PolicyDefinition(
        id="rule_flag_sha1",
        name="Flag Insecure SHA-1 Hash Usage",
        category=PolicyCategory.CLASSICAL,
        description="Flags SHA-1 usage due to practical chosen-prefix collision attacks (SHAttered, Shambles). Requires migration to SHA-256 or SHA-3.",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"flagged_algorithms": ["SHA1", "SHA-1"]}
    ),
    PolicyDefinition(
        id="rule_flag_insecure_aes_ecb",
        name="Flag Insecure AES Electronic Codebook (ECB) Mode",
        category=PolicyCategory.CLASSICAL,
        description="Blocks AES-ECB mode because identical plaintext blocks encrypt to identical ciphertext blocks, preserving data patterns.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"prohibited_modes": ["ECB"]}
    ),

    # ==================== 2. QUANTUM SECURITY POLICIES ====================
    PolicyDefinition(
        id="rule_flag_shor_asymmetric",
        name="Flag Shor-Vulnerable Asymmetric Cryptography",
        category=PolicyCategory.QUANTUM,
        description="Identifies conventional public-key algorithms (RSA, ECC, ECDSA, DH, DSA) vulnerable to polynomial-time breakage by Shor's algorithm on cryptanalytically relevant quantum computers.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING, # Advisory by default so organizations can plan migration without breaking builds prematurely
        enabled=True,
        is_builtin=True,
        config={"vulnerable_algorithms": ["RSA", "ECC", "ECDSA", "ECDH", "DH", "DSA", "ED25519", "X25519"]}
    ),
    PolicyDefinition(
        id="rule_flag_classical_kex_hndl",
        name="Flag Classical Key Exchange for Long-Lived Sensitive Data (HNDL)",
        category=PolicyCategory.QUANTUM,
        description="Flags classical key agreements (ECDH, RSA Key Encapsulation) when used on long-lived data subjected to Harvest-Now-Decrypt-Later (HNDL) adversaries.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"hndl_sensitive_usages": ["KEY_EXCHANGE", "ENCRYPTION"]}
    ),
    PolicyDefinition(
        id="rule_require_pqc_or_hybrid",
        name="Require Verified PQC or Hybrid Key Exchange for High-Security Targets",
        category=PolicyCategory.QUANTUM,
        description="Demands verified FIPS 203 ML-KEM or hybrid key exchange (e.g. X25519+ML-KEM-768) for repositories or modules tagged high security.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.MANUAL_REVIEW_REQUIRED,
        enabled=False, # Disabled by default; enabled for strict environments
        is_builtin=True,
        config={"approved_pqc_algs": ["ML-KEM", "ML-KEM-768", "ML-KEM-1024", "X25519+ML-KEM-768", "HYBRID-X25519-MLKEM768"]}
    ),
    PolicyDefinition(
        id="rule_flag_experimental_pqc",
        name="Flag Unverified Experimental PQC Implementations",
        category=PolicyCategory.QUANTUM,
        description="Identifies non-standardized or experimental post-quantum cryptography libraries that have not received NIST FIPS standardization (FIPS 203, 204, 205).",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"standardized_pqc": ["ML-KEM", "ML-DSA", "SLH-DSA"]}
    ),

    # ==================== 3. DEPENDENCY & SUPPLY-CHAIN POLICIES ====================
    PolicyDefinition(
        id="rule_flag_vulnerable_crypto_dependencies",
        name="Flag Vulnerable Cryptographic Dependencies",
        category=PolicyCategory.DEPENDENCY,
        description="Flags direct or transitive dependencies known to maintain critical or high classical vulnerabilities or deprecated cryptographic APIs.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"check_vulnerabilities": True}
    ),
    PolicyDefinition(
        id="rule_flag_unverified_pqc_dependencies",
        name="Flag Dependencies with Unverified PQC Compatibility",
        category=PolicyCategory.DEPENDENCY,
        description="Flags active cryptographic dependencies that lack documented post-quantum roadmap or NIST FIPS 203/204 support.",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"check_pqc_support": True}
    ),
    PolicyDefinition(
        id="rule_flag_declared_only_crypto",
        name="Detect Declared-Only Unused Cryptographic Packages",
        category=PolicyCategory.DEPENDENCY,
        description="Detects cryptographic libraries declared in manifests (e.g. package.json, requirements.txt) that have zero references in project source code, reducing unnecessary attack surface.",
        default_severity=PolicySeverity.LOW,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"check_usage": True}
    ),
    PolicyDefinition(
        id="rule_flag_outdated_dependencies",
        name="Flag Outdated Cryptographic Dependencies",
        category=PolicyCategory.DEPENDENCY,
        description="Flags cryptographic packages running outdated or unsupported major versions where version evidence is available.",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"flag_deprecated_majors": True}
    ),

    # ==================== 4. CBOM POLICIES ====================
    PolicyDefinition(
        id="rule_require_cbom_artifact",
        name="Require Valid CBOM Artifact Generation",
        category=PolicyCategory.CBOM,
        description="Enforces that a compliant CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) is generated for the build pipeline.",
        default_severity=PolicySeverity.HIGH,
        default_enforcement=PolicyEnforcement.BLOCKING_FAILURE,
        enabled=True,
        is_builtin=True,
        config={"spec_version": "1.6"}
    ),
    PolicyDefinition(
        id="rule_require_asset_evidence",
        name="Require Concrete Evidence for Detected Cryptographic Assets",
        category=PolicyCategory.CBOM,
        description="Validates that detected cryptographic components have tangible file and code location evidence rather than speculative guesses.",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"require_file_path": True}
    ),
    PolicyDefinition(
        id="rule_validate_cbom_metadata",
        name="Validate Required CBOM CycloneDX 1.6 Metadata",
        category=PolicyCategory.CBOM,
        description="Validates that the CBOM artifact includes mandatory CycloneDX 1.6 metadata (serialNumber, version, timestamp, tools, and component count).",
        default_severity=PolicySeverity.MEDIUM,
        default_enforcement=PolicyEnforcement.ADVISORY_WARNING,
        enabled=True,
        is_builtin=True,
        config={"required_fields": ["bomFormat", "specVersion", "serialNumber", "components"]}
    )
]

BUILTIN_POLICIES_MAP: Dict[str, PolicyDefinition] = {p.id: p for p in BUILTIN_POLICIES}

