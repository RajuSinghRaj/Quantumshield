"""
Security Policy Evaluation Engine for QuantumShield 2.0 DevSecOps.
Evaluates classical cryptography, quantum safety, supply-chain dependency,
and CBOM artifact compliance against configured project policies.
"""

import logging
from typing import Dict, Any, List, Optional, Set, Tuple

from .schemas import (
    PolicyCategory,
    PolicySeverity,
    PolicyEnforcement,
    PolicyViolationItem,
    PolicyDefinition
)
from .builtin_policies import BUILTIN_POLICIES_MAP
from .config_parser import ProjectPolicyConfig

logger = logging.getLogger(__name__)


class SecurityPolicyEngine:
    """Core evaluation engine that applies policies against scan findings and artifacts."""

    def __init__(self, config: Optional[ProjectPolicyConfig] = None):
        self.config = config or ProjectPolicyConfig()

    def evaluate(
        self,
        findings: List[Dict[str, Any]],
        cbom: Optional[Dict[str, Any]] = None,
        dependencies: Optional[List[Dict[str, Any]]] = None,
        certificates: Optional[List[Dict[str, Any]]] = None,
        risk_analysis: Optional[Dict[str, Any]] = None,
        scores: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[PolicyViolationItem], List[PolicyViolationItem], List[PolicyViolationItem], List[PolicyViolationItem]]:
        """
        Evaluate all policies against provided scan data.

        Returns:
            Tuple of:
            - blocking_violations: List[PolicyViolationItem]
            - advisory_warnings: List[PolicyViolationItem]
            - manual_reviews: List[PolicyViolationItem]
            - exceptions_applied: List[PolicyViolationItem]
        """
        findings = findings or []
        cbom = cbom or {}
        dependencies = dependencies or []
        certificates = certificates or []
        risk_analysis = risk_analysis or {}
        scores = scores or {}

        blocking_violations: List[PolicyViolationItem] = []
        advisory_warnings: List[PolicyViolationItem] = []
        manual_reviews: List[PolicyViolationItem] = []
        exceptions_applied: List[PolicyViolationItem] = []

        def add_item(
            rule_id: str,
            message: str,
            algorithm: Optional[str] = None,
            file_path: Optional[str] = None,
            line_number: Optional[int] = None,
            evidence: Optional[str] = None,
            remediation: Optional[str] = None
        ):
            if not self.config.is_rule_enabled(rule_id):
                return

            if self.config.is_path_excluded(file_path):
                return

            builtin = BUILTIN_POLICIES_MAP.get(rule_id)
            rule_name = builtin.name if builtin else rule_id
            category = builtin.category if builtin else PolicyCategory.CUSTOM
            severity = self.config.get_rule_severity(rule_id)
            enforcement = self.config.get_rule_enforcement(rule_id)

            # Check if documented exception applies
            exc = self.config.find_exception(rule_id=rule_id, file_path=file_path, algorithm=algorithm)
            if exc:
                item = PolicyViolationItem(
                    rule_id=rule_id,
                    rule_name=rule_name,
                    category=category,
                    severity=severity,
                    enforcement=enforcement,
                    algorithm=algorithm,
                    file_path=file_path,
                    line_number=line_number,
                    message=message,
                    evidence=evidence,
                    remediation=remediation,
                    exception_applied=True,
                    exception_reason=exc.reason
                )
                exceptions_applied.append(item)
                return

            item = PolicyViolationItem(
                rule_id=rule_id,
                rule_name=rule_name,
                category=category,
                severity=severity,
                enforcement=enforcement,
                algorithm=algorithm,
                file_path=file_path,
                line_number=line_number,
                message=message,
                evidence=evidence,
                remediation=remediation,
                exception_applied=False
            )

            if enforcement == PolicyEnforcement.BLOCKING_FAILURE:
                blocking_violations.append(item)
            elif enforcement == PolicyEnforcement.MANUAL_REVIEW_REQUIRED:
                manual_reviews.append(item)
            else:
                advisory_warnings.append(item)

        # -------------------------------------------------------------
        # 1. EVALUATE CLASSICAL CRYPTOGRAPHY POLICIES
        # -------------------------------------------------------------
        for f in findings:
            algo = (f.get("algorithm") or "").upper().strip()
            variant = (f.get("variant") or "").upper().strip()
            file_path = f.get("file_path")
            line_no = f.get("line_number")
            code_snippet = f.get("code_snippet") or ""
            key_size = f.get("key_size")

            # 1.1 MD5 Rejection
            if algo == "MD5" or "MD5" in variant:
                add_item(
                    rule_id="rule_reject_md5",
                    message=f"Insecure MD5 hash function used at {file_path}:{line_no}.",
                    algorithm="MD5",
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Migrate to SHA-256 (SHA-2) or SHA3-256 for integrity hashing, or Argon2id for password hashing."
                )

            # 1.2 DES / 3DES Rejection
            if algo in {"DES", "3DES", "TRIPLEDES", "DES3"} or any(k in variant for k in ["DES-EDE", "3DES", "DES_EDE"]):
                add_item(
                    rule_id="rule_reject_des_3des",
                    message=f"Deprecated legacy cipher {algo} ({variant}) detected at {file_path}:{line_no}.",
                    algorithm=algo,
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Migrate immediately to AES-256-GCM (NIST SP 800-38D)."
                )

            # 1.3 Weak RSA Key Sizes (< 2048)
            if algo == "RSA":
                min_rsa = self.config.get_rule_config("rule_reject_weak_rsa").get("min_rsa_key_size", 2048)
                if key_size and key_size < min_rsa:
                    add_item(
                        rule_id="rule_reject_weak_rsa",
                        message=f"Weak RSA key size of {key_size} bits (minimum required: {min_rsa} bits) at {file_path}:{line_no}.",
                        algorithm="RSA",
                        file_path=file_path,
                        line_number=line_no,
                        evidence=f"key_size={key_size} in {code_snippet}",
                        remediation=f"Increase RSA modulus to at least {min_rsa} bits, or transition to ML-KEM-768 for post-quantum security."
                    )

            # 1.4 Flag SHA-1
            if algo in {"SHA1", "SHA-1"} or "SHA1" in variant or "SHA-1" in variant:
                add_item(
                    rule_id="rule_flag_sha1",
                    message=f"Deprecated SHA-1 hash function detected at {file_path}:{line_no}.",
                    algorithm="SHA-1",
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Migrate to SHA-256 or SHA-384. Practical collisions exist for SHA-1."
                )

            # 1.5 Flag Insecure AES Modes (ECB)
            params = (f.get("curve_or_parameters") or "").upper()
            if "ECB" in params or "ECB" in variant or "MODE_ECB" in code_snippet.upper() or ".ECB" in code_snippet.upper():
                add_item(
                    rule_id="rule_flag_insecure_aes_ecb",
                    message=f"Insecure AES Electronic Codebook (ECB) mode used at {file_path}:{line_no}.",
                    algorithm="AES-ECB",
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Replace AES-ECB with an authenticated mode such as AES-256-GCM."
                )

        # Also inspect certificates for weak RSA keys
        for cert in certificates:
            pub_alg = (cert.get("public_key_algorithm") or "").upper()
            cert_key_size = cert.get("key_size_bits")
            cert_subject = cert.get("subject", "Unknown Subject")
            cert_file = cert.get("file_path", "certificate.pem")
            if "RSA" in pub_alg and cert_key_size and cert_key_size < 2048:
                add_item(
                    rule_id="rule_reject_weak_rsa",
                    message=f"X.509 Certificate '{cert_subject}' contains weak RSA public key ({cert_key_size} bits < 2048).",
                    algorithm="RSA",
                    file_path=cert_file,
                    evidence=f"Subject: {cert_subject}, KeySize: {cert_key_size}",
                    remediation="Re-issue certificate with at least 2048-bit RSA key, or migrate to ECDSA P-384 / ML-DSA-65."
                )

        # -------------------------------------------------------------
        # 2. EVALUATE QUANTUM SECURITY POLICIES
        # -------------------------------------------------------------
        has_verified_pqc = False

        for f in findings:
            algo = (f.get("algorithm") or "").upper().strip()
            variant = (f.get("variant") or "").upper().strip()
            file_path = f.get("file_path")
            line_no = f.get("line_number")
            code_snippet = f.get("code_snippet") or ""
            q_risk = (f.get("quantum_risk") or "").upper()
            usage = (f.get("usage") or "").upper()

            # Track presence of verified PQC
            if algo in {"ML-KEM", "ML-DSA", "SLH-DSA"} or "ML-KEM" in variant or "ML-DSA" in variant or "HYBRID" in variant:
                has_verified_pqc = True

            # 2.1 Shor-vulnerable asymmetric algorithms
            shor_asymmetric_algs = {"RSA", "ECC", "ECDSA", "ECDH", "DH", "DSA", "ED25519", "X25519", "ELGAMAL"}
            if algo in shor_asymmetric_algs or any(a in variant for a in shor_asymmetric_algs):
                add_item(
                    rule_id="rule_flag_shor_asymmetric",
                    message=f"Shor-vulnerable asymmetric algorithm ({algo}) detected at {file_path}:{line_no}.",
                    algorithm=algo,
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Plan migration to NIST standardized PQC: ML-KEM-768 for key exchange, ML-DSA-65 for signatures."
                )

            # 2.2 Classical key exchange subject to HNDL
            if usage in {"KEY_EXCHANGE", "KEY_AGREEMENT"} and algo in {"ECDH", "DH", "RSA", "X25519"}:
                add_item(
                    rule_id="rule_flag_classical_kex_hndl",
                    message=f"Classical key exchange ({algo}) vulnerable to Harvest-Now-Decrypt-Later (HNDL) at {file_path}:{line_no}.",
                    algorithm=algo,
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Transition to Hybrid Key Exchange (X25519 + ML-KEM-768) to protect against retroactive decryption."
                )

            # 2.3 Experimental / Non-Standardized PQC implementations
            if "SIKE" in algo or "SIKE" in variant or "RAINBOW" in algo or "NTRU" in algo or "FRODOKEM" in algo:
                add_item(
                    rule_id="rule_flag_experimental_pqc",
                    message=f"Experimental or unstandardized PQC algorithm ({algo}) detected at {file_path}:{line_no}.",
                    algorithm=algo,
                    file_path=file_path,
                    line_number=line_no,
                    evidence=code_snippet,
                    remediation="Standardize on NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), or FIPS 205 (SLH-DSA)."
                )

        # 2.4 Require PQC or Hybrid for strict environments
        if self.config.is_rule_enabled("rule_require_pqc_or_hybrid") and not has_verified_pqc:
            add_item(
                rule_id="rule_require_pqc_or_hybrid",
                message="High-security compliance requirement: No verified PQC or hybrid key exchange detected in project.",
                algorithm="NONE",
                file_path="project_root",
                remediation="Adopt NIST FIPS 203 ML-KEM-768 or hybrid X25519+ML-KEM-768 key encapsulation."
            )

        # -------------------------------------------------------------
        # 3. EVALUATE DEPENDENCY & SUPPLY-CHAIN POLICIES
        # -------------------------------------------------------------
        for dep in dependencies:
            dep_name = dep.get("name", "Unknown Package")
            manifest = dep.get("manifest_file", "manifest")
            version = dep.get("version", "unknown")
            is_active = dep.get("is_active", True)
            pqc_supported = dep.get("pqc_supported", False)
            pqc_status = dep.get("pqc_status", "UNKNOWN")
            vulns = dep.get("vulnerabilities", [])

            # 3.1 Vulnerable Dependencies
            if vulns or dep.get("is_deprecated"):
                vuln_desc = ", ".join([v.get("id", "VULN") for v in vulns]) if vulns else "Deprecated library"
                add_item(
                    rule_id="rule_flag_vulnerable_crypto_dependencies",
                    message=f"Cryptographic dependency '{dep_name}' ({version}) in {manifest} has known vulnerabilities: {vuln_desc}.",
                    algorithm=dep_name,
                    file_path=manifest,
                    evidence=f"Package: {dep_name}@{version}",
                    remediation=f"Upgrade '{dep_name}' to the latest patched secure release."
                )

            # 3.2 Dependencies with Unverified PQC Compatibility
            if is_active and not pqc_supported and pqc_status in {"NO_SUPPORT", "UNVERIFIED"}:
                add_item(
                    rule_id="rule_flag_unverified_pqc_dependencies",
                    message=f"Active cryptographic library '{dep_name}' ({version}) lacks verified PQC support.",
                    algorithm=dep_name,
                    file_path=manifest,
                    evidence=f"PQC Status: {pqc_status}",
                    remediation=f"Check vendor roadmap for NIST FIPS 203 support or evaluate PQC-compatible alternatives."
                )

            # 3.3 Declared-Only Cryptographic Packages
            if not is_active and dep.get("is_declared_only", True) and not dep.get("source_references"):
                add_item(
                    rule_id="rule_flag_declared_only_crypto",
                    message=f"Cryptographic package '{dep_name}' is declared in {manifest} but has 0 source code references.",
                    algorithm=dep_name,
                    file_path=manifest,
                    evidence=f"Declared package: {dep_name}",
                    remediation="Remove unused cryptographic dependency from project manifest to minimize attack surface."
                )

        # -------------------------------------------------------------
        # 4. EVALUATE CBOM ARTIFACT POLICIES
        # -------------------------------------------------------------
        # 4.1 Require CBOM Artifact
        if cbom is None or not isinstance(cbom, dict) or "components" not in cbom:
            add_item(
                rule_id="rule_require_cbom_artifact",
                message="CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) artifact is missing or invalid.",
                algorithm="CBOM",
                file_path="cbom.json",
                remediation="Generate a CycloneDX 1.6 compliant CBOM using QuantumShield scanner."
            )
        else:
            # 4.2 Validate Required CBOM Metadata
            bom_format = cbom.get("bomFormat")
            spec_version = cbom.get("specVersion")
            serial_number = cbom.get("serialNumber")
            metadata = cbom.get("metadata")
            if bom_format != "CycloneDX" or spec_version != "1.6" or not serial_number or not metadata:
                add_item(
                    rule_id="rule_validate_cbom_metadata",
                    message=f"CBOM metadata invalid: bomFormat={bom_format}, specVersion={spec_version}, serialNumber={'present' if serial_number else 'missing'}.",
                    algorithm="CBOM",
                    file_path="cbom.json",
                    evidence=f"specVersion={spec_version}, serial={serial_number}",
                    remediation="Ensure CBOM generator outputs standard CycloneDX 1.6 metadata fields."
                )

            # 4.3 Require concrete evidence for detected assets
            components = cbom.get("components", [])
            for c in components:
                c_name = c.get("name", "Unknown")
                evidence_dict = c.get("evidence", {})
                occurrences = evidence_dict.get("occurrences", [])
                if not occurrences:
                    add_item(
                        rule_id="rule_require_asset_evidence",
                        message=f"CBOM component '{c_name}' does not have concrete file location occurrences evidence.",
                        algorithm=c_name,
                        file_path="cbom.json",
                        remediation="Ensure all detected cryptographic assets record file_path and line_number evidence."
                    )

        return blocking_violations, advisory_warnings, manual_reviews, exceptions_applied
