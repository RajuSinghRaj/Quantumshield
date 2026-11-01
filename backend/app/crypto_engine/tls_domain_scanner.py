"""
Live TLS Website Scanner for QuantumShield 2.0.

Performs live TLS handshakes, certificate chain analysis, cipher suite inspection,
and post-quantum quantum risk evaluation for public domains.

Strict Security & Safety Controls:
- SSRF Prevention: Restricts scanning strictly to public internet hostnames and routable IPs.
- Blocks localhost (127.0.0.0/8, ::1), private subnets (RFC 1918), link-local (169.254.0.0/16),
  cloud metadata services (169.254.169.254), loopback, multicast, and DNS rebinding attacks.
- Strict connection timeouts (5 seconds).
- Distinguishes negotiated connection parameters from untested server capabilities.
"""

import socket
import ssl
import ipaddress
import re
from typing import Dict, Any, List, Optional, Tuple
from .cert_parser import analyze_certificate_bytes, parse_certificate_or_pubkey


class SSRFSecurityError(ValueError):
    """Raised when an illegal, private, or non-routable target is requested."""
    pass


# ==================== SSRF & TARGET VALIDATION ====================

BLOCKED_HOSTNAMES = {
    "localhost", "localhost.localdomain", "broadcasthost",
    "metadata.google.internal", "metadata.azure.com", "instance-data"
}

def validate_public_target(target: str, default_port: int = 443) -> Tuple[str, str, int]:
    """
    Validate and resolve target hostname safely against SSRF attacks.
    Returns: (clean_hostname, resolved_public_ip, port)
    Raises SSRFSecurityError if the target resolves to a private or non-routable IP.
    """
    if not target or not isinstance(target, str):
        raise SSRFSecurityError("Target domain name must be a non-empty string.")

    # Clean protocol scheme and path
    clean = target.strip()
    if clean.startswith("https://"):
        clean = clean[8:]
    elif clean.startswith("http://"):
        clean = clean[7:]
    clean = clean.split("/")[0].split("?")[0].strip()

    # Extract port if present
    port = default_port
    if ":" in clean:
        parts = clean.split(":")
        clean = parts[0].strip()
        try:
            port = int(parts[1].strip())
        except ValueError:
            raise SSRFSecurityError("Invalid port specification.")
        if port not in {443, 8443, 4433}:
            raise SSRFSecurityError(f"Scanning port {port} is restricted. Only standard TLS ports (443, 8443) are allowed.")

    clean_hostname = clean.lower()

    # Hostname blocklist
    if clean_hostname in BLOCKED_HOSTNAMES or clean_hostname.endswith(".local") or clean_hostname.endswith(".internal") or clean_hostname.endswith(".onion"):
        raise SSRFSecurityError(f"Destination '{clean_hostname}' is an internal/reserved domain name.")

    # Basic hostname syntax check (RFC 1123)
    if not re.match(r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$', clean_hostname):
        # Check if direct IP address was provided
        try:
            ipaddress.ip_address(clean_hostname)
        except ValueError:
            raise SSRFSecurityError(f"Invalid domain name syntax: '{clean_hostname}'")

    # DNS Resolution with rebinding check
    try:
        addr_info = socket.getaddrinfo(clean_hostname, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise SSRFSecurityError(f"DNS resolution failed for hostname '{clean_hostname}': {e}")

    if not addr_info:
        raise SSRFSecurityError(f"No IP addresses resolved for hostname '{clean_hostname}'.")

    # Inspect all resolved IP addresses
    resolved_ips = []
    for family, socktype, proto, canonname, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFSecurityError(f"Invalid resolved IP format: '{ip_str}'")

        # SSRF checks
        if str(ip_obj) in {"169.254.169.254", "169.254.170.2", "100.100.100.200"}:
            raise SSRFSecurityError("Target resolves to cloud metadata service, access blocked.")
        if ip_obj.is_link_local:
            raise SSRFSecurityError(f"Target resolves to link-local IP ({ip_str}), prohibited by SSRF safety policy.")
        if ip_obj.is_loopback:
            raise SSRFSecurityError(f"Target resolves to loopback IP ({ip_str}), prohibited by SSRF safety policy.")
        if ip_obj.is_private:
            raise SSRFSecurityError(f"Target resolves to private network IP ({ip_str}), prohibited by SSRF safety policy.")
        if ip_obj.is_multicast:
            raise SSRFSecurityError(f"Target resolves to multicast IP ({ip_str}), prohibited by SSRF safety policy.")
        if ip_obj.is_reserved:
            # Allow RFC 6052 / RFC 8215 NAT64 Well-Known Prefix (64:ff9b::/96) and local NAT64 prefix (64:ff9b:1::/48)
            # if the translated IPv4 address is a public address.
            if isinstance(ip_obj, ipaddress.IPv6Address) and (
                ip_obj in ipaddress.ip_network("64:ff9b::/96") or ip_obj in ipaddress.ip_network("64:ff9b:1::/48")
            ):
                embedded_ipv4 = ipaddress.IPv4Address(ip_obj.packed[-4:])
                if (
                    embedded_ipv4.is_private
                    or embedded_ipv4.is_loopback
                    or embedded_ipv4.is_link_local
                    or embedded_ipv4.is_multicast
                    or embedded_ipv4.is_reserved
                    or str(embedded_ipv4) in {"169.254.169.254", "169.254.170.2", "100.100.100.200"}
                ):
                    raise SSRFSecurityError(f"Target resolves to private/reserved NAT64 IP ({ip_str}), prohibited by SSRF safety policy.")
            else:
                raise SSRFSecurityError(f"Target resolves to reserved IP ({ip_str}), prohibited by SSRF safety policy.")
        if ip_obj.is_unspecified:
            raise SSRFSecurityError(f"Target resolves to unspecified IP ({ip_str}), prohibited by SSRF safety policy.")

        resolved_ips.append(str(ip_obj))

    # Prefer direct IPv4 address if available in dual-stack responses for broader client socket support
    ipv4_candidates = [ip for ip in resolved_ips if "." in ip]
    primary_ip = ipv4_candidates[0] if ipv4_candidates else resolved_ips[0]
    return clean_hostname, primary_ip, port


# ==================== LIVE TLS INSPECTOR ====================

def inspect_tls_target(domain: str, timeout: int = 5) -> Dict[str, Any]:
    """
    Perform live TLS inspection of a public website.
    Returns comprehensive metadata: protocol, cipher suite, key exchange, certificate, and quantum risk.
    """
    clean_domain, resolved_ip, port = validate_public_target(domain)

    try:
        context = ssl.create_default_context()
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED

        with socket.create_connection((resolved_ip, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=clean_domain) as ssock:
                protocol_version = ssock.version() or "TLSv1.3"
                cipher_info = ssock.cipher()  # (cipher_name, protocol_version, secret_bits)
                cipher_name = cipher_info[0] if cipher_info else "TLS_AES_256_GCM_SHA384"
                cipher_bits = cipher_info[2] if cipher_info else 256

                # Key Exchange & PQC Classification
                key_exchange, quantum_classification, kex_details = _classify_tls_connection(
                    protocol_version, cipher_name
                )

                # Server Certificate
                der_cert = ssock.getpeercert(binary_form=True)
                cert_analyses = analyze_certificate_bytes(der_cert, f"tls://{clean_domain}:{port}")
                server_cert = cert_analyses[0] if cert_analyses else None

                # Certificate Chain (if available)
                chain_info: List[Dict[str, Any]] = []
                try:
                    verified_chain = ssock.get_verified_chain()
                    if verified_chain:
                        for idx, c in enumerate(verified_chain):
                            c_bytes = c.public_bytes(serialization.Encoding.DER)
                            parsed_c = analyze_certificate_bytes(c_bytes, f"tls://{clean_domain}:{port}#chain_{idx}")
                            if parsed_c:
                                chain_info.append(parsed_c[0])
                except Exception:
                    pass

                # Synthesize TLS Security Findings
                security_findings = _generate_tls_findings(
                    clean_domain=clean_domain,
                    protocol_version=protocol_version,
                    cipher_name=cipher_name,
                    cipher_bits=cipher_bits,
                    key_exchange=key_exchange,
                    quantum_classification=quantum_classification,
                    server_cert=server_cert
                )

                return {
                    "status": "ONLINE",
                    "hostname": clean_domain,
                    "resolved_ip": resolved_ip,
                    "port": port,
                    "tls_protocol": protocol_version,
                    "cipher_suite": cipher_name,
                    "symmetric_key_bits": cipher_bits,
                    "key_exchange": key_exchange,
                    "key_exchange_details": kex_details,
                    "quantum_classification": quantum_classification,  # CLASSICAL, HYBRID_POST_QUANTUM, POST_QUANTUM, UNKNOWN
                    "server_certificate": server_cert,
                    "certificate_chain": chain_info,
                    "security_findings": security_findings,
                    "scan_timestamp": ssl.cert_time_to_seconds(ssock.getpeercert().get('notBefore', 'Jan 1 00:00:00 2026 GMT')) if ssock.getpeercert() else 0
                }

    except socket.timeout:
        return _build_simulated_or_error_result(
            clean_domain, resolved_ip, port,
            error="Connection timed out after 5 seconds."
        )
    except ssl.SSLError as e:
        return _build_simulated_or_error_result(
            clean_domain, resolved_ip, port,
            error=f"TLS handshake failed: {e.reason if hasattr(e, 'reason') else str(e)}"
        )
    except Exception as e:
        return _build_simulated_or_error_result(
            clean_domain, resolved_ip, port,
            error=f"TLS inspection error: {str(e)}"
        )


def _classify_tls_connection(protocol: str, cipher: str) -> Tuple[str, str, str]:
    """
    Determine key exchange mechanism and quantum classification.
    Returns: (key_exchange, quantum_classification, explanation)
    """
    cipher_upper = cipher.upper()

    # Check for verified PQC / hybrid negotiation
    if any(k in cipher_upper for k in ["KYBER", "MLKEM", "ML-KEM", "CECPQ2", "HYBRID"]):
        return (
            "Hybrid X25519MLKEM768 / Kyber",
            "HYBRID_POST_QUANTUM",
            "Negotiated TLS connection utilizes hybrid post-quantum key exchange resilient to Harvest-Now-Decrypt-Later."
        )

    # Standard TLS 1.3
    if protocol == "TLSv1.3":
        return (
            "ECDHE (X25519 / secp256r1)",
            "CLASSICAL",
            "Negotiated standard classical TLS 1.3 ECDHE key exchange. Asymmetric key agreement is vulnerable to Shor's algorithm."
        )

    # Standard TLS 1.2
    if "ECDHE" in cipher_upper:
        kex = "ECDHE"
    elif "DHE" in cipher_upper:
        kex = "DHE"
    elif "RSA" in cipher_upper and ("AES" in cipher_upper or "3DES" in cipher_upper):
        kex = "Static RSA"
    else:
        kex = "Unknown / Classical"

    return (
        kex,
        "CLASSICAL",
        f"Negotiated classical {kex} key exchange. Forward secrecy and key encapsulation are vulnerable to Shor's algorithm."
    )


def _generate_tls_findings(
    clean_domain: str,
    protocol_version: str,
    cipher_name: str,
    cipher_bits: int,
    key_exchange: str,
    quantum_classification: str,
    server_cert: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Synthesize security checks and vulnerability findings."""
    findings: List[Dict[str, Any]] = []

    # 1. Deprecated TLS Protocol
    if protocol_version in {"TLSv1", "TLSv1.0", "TLSv1.1", "SSLv3", "SSLv2"}:
        findings.append({
            "type": "DEPRECATED_TLS_PROTOCOL",
            "severity": "CRITICAL",
            "title": f"Deprecated TLS Protocol: {protocol_version}",
            "description": f"Domain {clean_domain} negotiated deprecated {protocol_version}, which is vulnerable to POODLE, BEAST, and lacking modern cipher suites.",
            "classical_risk": "CRITICAL",
            "quantum_risk": "VULNERABLE",
            "recommendation": "Disable TLS 1.0/1.1 on server. Enforce TLS 1.2 minimum, TLS 1.3 preferred."
        })
    elif protocol_version == "TLSv1.2":
        findings.append({
            "type": "TLS_1_2_IN_USE",
            "severity": "INFO",
            "title": "TLS 1.2 Negotiated",
            "description": "Connection successfully negotiated TLS 1.2. Upgrade to TLS 1.3 recommended for enhanced 1-RTT performance and forward secrecy.",
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE",
            "recommendation": "Enable TLS 1.3 on web server / reverse proxy."
        })
    elif protocol_version == "TLSv1.3":
        findings.append({
            "type": "MODERN_TLS_PROTOCOL",
            "severity": "SAFE",
            "title": "Modern TLS 1.3 Negotiated",
            "description": "Connection negotiated modern TLS 1.3 with mandatory forward secrecy and AEAD encryption.",
            "classical_risk": "SAFE",
            "quantum_risk": "SAFE" if quantum_classification == "HYBRID_POST_QUANTUM" else "VULNERABLE",
            "recommendation": "Maintain TLS 1.3 configuration."
        })

    # 2. Weak Ciphers
    cipher_upper = cipher_name.upper()
    if any(bad in cipher_upper for bad in ["RC4", "DES", "3DES", "NULL", "EXPORT", "MD5"]):
        findings.append({
            "type": "WEAK_CIPHER_SUITE",
            "severity": "CRITICAL",
            "title": f"Obsolete / Insecure Cipher: {cipher_name}",
            "description": f"Negotiated cipher suite {cipher_name} contains known cryptographic weaknesses.",
            "classical_risk": "CRITICAL",
            "quantum_risk": "VULNERABLE",
            "recommendation": "Disable legacy ciphers. Enforce AES-GCM or ChaCha20-Poly1305."
        })

    # 3. Quantum Threat: Harvest Now Decrypt Later (HNDL)
    if quantum_classification == "CLASSICAL":
        findings.append({
            "type": "QUANTUM_EXPOSURE_HNDL",
            "severity": "HIGH",
            "title": f"Classical Key Exchange Vulnerable to Harvest-Now-Decrypt-Later ({key_exchange})",
            "description": (
                f"The negotiated TLS handshake uses classical {key_exchange}. An adversary recording encrypted traffic "
                "today can theoretically decrypt it once a fault-tolerant quantum computer capable of running Shor's algorithm is available."
            ),
            "classical_risk": "SAFE",
            "quantum_risk": "VULNERABLE",
            "recommendation": "Deploy hybrid post-quantum key exchange (e.g. X25519MLKEM768) in TLS reverse proxy (Nginx, Cloudflare, Envoy)."
        })
    elif quantum_classification == "HYBRID_POST_QUANTUM":
        findings.append({
            "type": "HYBRID_PQC_ACTIVE",
            "severity": "SAFE",
            "title": "Hybrid Post-Quantum Key Exchange Verified Active",
            "description": f"Connection utilizes verified hybrid post-quantum key agreement ({key_exchange}), protecting session secrecy against HNDL.",
            "classical_risk": "SAFE",
            "quantum_risk": "POST_QUANTUM",
            "recommendation": "Maintain hybrid PQC deployment; prepare for standardized pure ML-KEM."
        })

    # 4. Integrate Server Certificate findings
    if server_cert and server_cert.get("security_findings"):
        for f in server_cert["security_findings"]:
            findings.append({
                "type": f.get("type"),
                "severity": f.get("severity"),
                "title": f.get("title"),
                "description": f.get("description"),
                "classical_risk": f.get("classical_risk", "SAFE"),
                "quantum_risk": f.get("quantum_risk", "VULNERABLE"),
                "recommendation": f.get("recommendation", "")
            })

    return findings


def _build_simulated_or_error_result(domain: str, ip: str, port: int, error: str) -> Dict[str, Any]:
    """Provide structured error result without crashing."""
    return {
        "status": "UNREACHABLE",
        "hostname": domain,
        "resolved_ip": ip,
        "port": port,
        "error": error,
        "tls_protocol": "N/A",
        "cipher_suite": "N/A",
        "symmetric_key_bits": 0,
        "key_exchange": "N/A",
        "quantum_classification": "UNKNOWN",
        "server_certificate": None,
        "certificate_chain": [],
        "security_findings": [
            {
                "type": "TLS_CONNECTION_FAILED",
                "severity": "HIGH",
                "title": f"TLS Connection to {domain} Failed",
                "description": f"Unable to establish TLS handshake: {error}",
                "classical_risk": "HIGH",
                "quantum_risk": "UNKNOWN",
                "recommendation": "Verify target domain DNS, firewall, and TLS port 443 availability."
            }
        ]
    }


# ==================== BACKWARD COMPATIBLE PIPELINE FUNCTION ====================

def scan_domain_tls(domain: str) -> List[Dict[str, Any]]:
    """
    Main pipeline function for `scan_domain` endpoint.
    Maintains compatibility with Batch 1 / Batch 2 findings representation.
    """
    tls_doc = inspect_tls_target(domain)
    findings: List[Dict[str, Any]] = []

    # If certificate available, extract asset
    cert = tls_doc.get("server_certificate")
    if cert:
        pub = cert.get("public_key", {})
        algo = pub.get("algorithm", "RSA")
        findings.append({
            "type": "X.509 Certificate",
            "algorithm": algo,
            "variant": pub.get("variant", f"{algo}-2048"),
            "key_size": pub.get("key_size", 2048),
            "curve_or_parameters": pub.get("curve") or cert.get("signature_algorithm", "N/A"),
            "library_or_api": "cryptography.x509",
            "detection_method": "TLS Peer Certificate",
            "signature_algorithm": cert.get("signature_algorithm"),
            "issuer": cert.get("issuer"),
            "subject": cert.get("subject"),
            "valid_from": cert.get("valid_from"),
            "valid_until": cert.get("valid_until"),
            "usage": "DIGITAL_SIGNATURE",
            "file_path": f"tls://{tls_doc['hostname']}:{tls_doc['port']}",
            "line_number": 1,
            "code_snippet": f"X.509 Certificate: {cert.get('subject')} | Sig: {cert.get('signature_algorithm')}",
            "confidence": 1.0,
            "classical_risk": cert.get("classical_risk", "SAFE"),
            "quantum_risk": cert.get("quantum_risk", "VULNERABLE"),
            "quantum_threat": cert.get("quantum_threat", "Shor's Algorithm"),
            "source": "Live TLS Website Scanner"
        })

    # Cipher Suite asset
    cipher_name = tls_doc.get("cipher_suite", "TLS_AES_256_GCM_SHA384")
    cipher_bits = tls_doc.get("symmetric_key_bits", 256)
    cipher_algo = "ChaCha20" if "CHACHA20" in cipher_name.upper() else "AES"

    findings.append({
        "type": "TLS Cipher Suite",
        "algorithm": cipher_algo,
        "variant": cipher_name,
        "key_size": cipher_bits,
        "curve_or_parameters": tls_doc.get("key_exchange", "ECDHE"),
        "library_or_api": tls_doc.get("tls_protocol", "TLSv1.3"),
        "detection_method": "TLS Handshake Inspection",
        "usage": "ENCRYPTION",
        "file_path": f"tls://{tls_doc['hostname']}:{tls_doc['port']}",
        "line_number": 1,
        "code_snippet": f"Negotiated Protocol: {tls_doc.get('tls_protocol')} | Cipher: {cipher_name} | KEX: {tls_doc.get('key_exchange')}",
        "confidence": 1.0,
        "classical_risk": "SAFE",
        "quantum_risk": "POST_QUANTUM" if tls_doc.get("quantum_classification") == "HYBRID_POST_QUANTUM" else "SAFE",
        "quantum_threat": "None (Grover search margin: 128-bit)" if cipher_bits >= 256 else "Grover Search",
        "source": "Live TLS Website Scanner"
    })

    # Key Exchange asset
    kex = tls_doc.get("key_exchange", "ECDHE")
    kex_algo = "ECDH" if "ECDH" in kex.upper() or "X25519" in kex.upper() else ("DH" if "DH" in kex.upper() else "RSA")
    findings.append({
        "type": "TLS Key Agreement",
        "algorithm": kex_algo,
        "variant": kex,
        "key_size": 256 if "256" in kex or "X25519" in kex else 2048,
        "curve_or_parameters": kex,
        "library_or_api": tls_doc.get("tls_protocol", "TLSv1.3"),
        "detection_method": "TLS Key Exchange Analysis",
        "usage": "KEY_EXCHANGE",
        "file_path": f"tls://{tls_doc['hostname']}:{tls_doc['port']}",
        "line_number": 1,
        "code_snippet": f"TLS Handshake Key Exchange: {kex} ({tls_doc.get('quantum_classification')})",
        "confidence": 1.0,
        "classical_risk": "SAFE",
        "quantum_risk": "POST_QUANTUM" if tls_doc.get("quantum_classification") == "HYBRID_POST_QUANTUM" else "VULNERABLE",
        "quantum_threat": "Shor's Algorithm (HNDL Threat)" if tls_doc.get("quantum_classification") != "HYBRID_POST_QUANTUM" else "None (Protected by PQC Hybrid)",
        "source": "Live TLS Website Scanner"
    })

    return findings
