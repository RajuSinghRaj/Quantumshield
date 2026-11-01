"""
Automated Test Suite for QuantumShield 2.0 Batch 3:
Live TLS Website Scanner, Certificate & Key Analyzer, and SSRF Network Safety Controls.
"""

import datetime
import pytest
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519

from app.crypto_engine.cert_parser import (
    analyze_certificate_bytes,
    analyze_key_metadata,
    parse_certificate_or_pubkey
)
from app.crypto_engine.tls_domain_scanner import (
    validate_public_target,
    inspect_tls_target,
    _classify_tls_connection,
    _generate_tls_findings,
    SSRFSecurityError
)
from app.db.database import SessionLocal
from app.main import (
    _run_scan_pipeline,
    get_scan_result,
    get_scan_tls,
    get_scan_certificates
)


# ==================== FIXTURES (LOCAL IN-MEMORY CRYPTOGRAPHY) ====================

@pytest.fixture
def rsa_2048_cert_pem():
    """Generate a self-signed RSA-2048 X.509 certificate in PEM format."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "QuantumShield Security"),
        x509.NameAttribute(NameOID.COMMON_NAME, "quantumshield.local"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        1001
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName("quantumshield.local"), x509.DNSName("api.quantumshield.local")]),
        critical=False,
    ).sign(key, hashes.SHA256())

    return cert.public_bytes(serialization.Encoding.PEM)


@pytest.fixture
def ecdsa_p256_cert_pem():
    """Generate a self-signed ECDSA P-256 X.509 certificate in PEM format."""
    key = ec.generate_private_key(ec.SECP256R1())
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "ecdsa.quantumshield.local"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        2002
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)
    ).sign(key, hashes.SHA256())

    return cert.public_bytes(serialization.Encoding.PEM)


@pytest.fixture
def expired_cert_pem():
    """Generate an expired RSA certificate."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "expired.example.com")])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        3003
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=400)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=35)
    ).sign(key, hashes.SHA256())

    return cert.public_bytes(serialization.Encoding.PEM)


@pytest.fixture
def near_expiry_cert_pem():
    """Generate a certificate expiring in 10 days."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "nearexpiry.example.com")])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        4004
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=80)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10)
    ).sign(key, hashes.SHA256())

    return cert.public_bytes(serialization.Encoding.PEM)


# ==================== CERTIFICATE TESTS ====================

def test_valid_pem_and_der_certificate_parsing(rsa_2048_cert_pem, ecdsa_p256_cert_pem):
    """Test parsing of PEM and DER X.509 certificates."""
    # 1. PEM RSA Parsing
    results_rsa = analyze_certificate_bytes(rsa_2048_cert_pem, "server.pem")
    assert len(results_rsa) == 1
    c_rsa = results_rsa[0]
    assert c_rsa["public_key"]["algorithm"] == "RSA"
    assert c_rsa["public_key"]["key_size"] == 2048
    assert c_rsa["validity_status"] == "VALID"
    assert "quantumshield.local" in c_rsa["subject"]
    assert "quantumshield.local" in c_rsa["subject_alt_names"]
    assert c_rsa["quantum_risk"] == "VULNERABLE"
    assert "sha256" in c_rsa["signature_algorithm"].lower()

    # 2. PEM ECDSA Parsing
    results_ec = analyze_certificate_bytes(ecdsa_p256_cert_pem, "ecdsa.pem")
    assert len(results_ec) == 1
    c_ec = results_ec[0]
    assert c_ec["public_key"]["algorithm"] == "ECDSA"
    assert c_ec["public_key"]["key_size"] == 256
    assert c_ec["public_key"]["curve"] == "secp256r1"
    assert c_ec["quantum_risk"] == "VULNERABLE"

    # 3. DER Parsing (binary X.509)
    cert_obj = x509.load_pem_x509_certificate(rsa_2048_cert_pem)
    der_bytes = cert_obj.public_bytes(serialization.Encoding.DER)
    results_der = analyze_certificate_bytes(der_bytes, "cert.der")
    assert len(results_der) == 1
    assert results_der[0]["public_key"]["algorithm"] == "RSA"
    assert results_der[0]["fingerprint_sha256"] == c_rsa["fingerprint_sha256"]


def test_certificate_bundle_parsing(rsa_2048_cert_pem, ecdsa_p256_cert_pem):
    """Test parsing a concatenated certificate bundle containing multiple certificates."""
    bundle_pem = rsa_2048_cert_pem + b"\n" + ecdsa_p256_cert_pem
    results = analyze_certificate_bytes(bundle_pem, "bundle.pem")
    assert len(results) == 2
    assert results[0]["public_key"]["algorithm"] == "RSA"
    assert results[1]["public_key"]["algorithm"] == "ECDSA"


def test_expired_and_near_expiry_classification(expired_cert_pem, near_expiry_cert_pem):
    """Test classification of expired certificates and certificates approaching expiry."""
    # Expired
    exp_res = analyze_certificate_bytes(expired_cert_pem, "expired.pem")[0]
    assert exp_res["is_expired"] is True
    assert exp_res["validity_status"] == "EXPIRED"
    assert exp_res["classical_risk"] == "CRITICAL"
    assert any(f["type"] == "EXPIRED_CERTIFICATE" for f in exp_res["security_findings"])

    # Near Expiry
    near_res = analyze_certificate_bytes(near_expiry_cert_pem, "near.pem")[0]
    assert near_res["is_expired"] is False
    assert near_res["validity_status"] == "EXPIRING_SOON"
    assert near_res["classical_risk"] == "HIGH"
    assert any(f["type"] == "EXPIRING_CERTIFICATE" for f in near_res["security_findings"])


# ==================== KEY ANALYZER & ZERO-KNOWLEDGE TESTS ====================

def test_public_key_extraction():
    """Test public key metadata extraction for RSA, ECDSA, and Ed25519."""
    # RSA Public Key
    priv_rsa = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pub_rsa_pem = priv_rsa.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    res_pub = analyze_key_metadata(pub_rsa_pem, "rsa.pub")
    assert res_pub["key_type"] == "Public Key"
    assert res_pub["algorithm"] == "RSA"
    assert res_pub["key_size"] == 2048
    assert res_pub["quantum_risk"] == "VULNERABLE"

    # Ed25519 Public Key
    priv_ed = ed25519.Ed25519PrivateKey.generate()
    pub_ed_pem = priv_ed.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    res_ed = analyze_key_metadata(pub_ed_pem, "ed25519.pub")
    assert res_ed["algorithm"] == "Ed25519"
    assert res_ed["key_size"] == 256


def test_private_key_redaction_and_zero_knowledge():
    """Verify that private keys are analyzed in volatile memory and purged without byte leakage."""
    priv_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = priv_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    # Analyze private key
    res = analyze_key_metadata(priv_pem, "server.key")

    assert res["key_type"] == "Private Key"
    assert res["algorithm"] == "RSA"
    assert res["key_size"] == 2048
    assert res["quantum_risk"] == "VULNERABLE"

    # CRITICAL ZERO-KNOWLEDGE VERIFICATIONS
    assert res["private_key_redacted"] is True
    assert res["content_persisted"] is False
    assert res["raw_key_material_discarded"] is True

    # Ensure no private exponents (d), primes (p, q), or private PEM bytes are in the output dictionary
    res_str = str(res)
    assert "-----BEGIN PRIVATE KEY-----" not in res_str
    assert str(priv_key.private_numbers().d) not in res_str
    assert str(priv_key.private_numbers().p) not in res_str


def test_malformed_and_unsupported_keys():
    """Verify robust handling of malformed and unrecognized key files without crashes."""
    res_bad = analyze_key_metadata(b"MALFORMED NOT A KEY", "corrupt.key")
    assert res_bad["status"] == "UNRECOGNIZED_FORMAT"

    res_empty_cert = analyze_certificate_bytes(b"NOT A CERTIFICATE", "corrupt.pem")
    assert len(res_empty_cert) == 0


# ==================== SSRF & NETWORK SAFETY CONTROLS ====================

def test_ssrf_blocking_localhost_and_private_ips():
    """Verify strict SSRF prevention for localhost, loopback, and private network addresses."""
    # Localhost
    with pytest.raises(SSRFSecurityError, match="loopback|internal"):
        validate_public_target("localhost")

    with pytest.raises(SSRFSecurityError, match="loopback"):
        validate_public_target("127.0.0.1")

    with pytest.raises(SSRFSecurityError, match="loopback"):
        validate_public_target("127.0.1.5")

    # Private Subnets (RFC 1918)
    with pytest.raises(SSRFSecurityError, match="private"):
        validate_public_target("10.0.0.1")

    with pytest.raises(SSRFSecurityError, match="private"):
        validate_public_target("192.168.1.100")

    with pytest.raises(SSRFSecurityError, match="private"):
        validate_public_target("172.16.0.5")

    # Cloud Metadata Service
    with pytest.raises(SSRFSecurityError, match="link-local|metadata"):
        validate_public_target("169.254.169.254")

    # Invalid syntax
    with pytest.raises(SSRFSecurityError, match="Invalid"):
        validate_public_target("http://invalid target name with spaces/")


def test_ssrf_port_restrictions():
    """Verify non-standard/arbitrary ports are blocked."""
    with pytest.raises(SSRFSecurityError, match="restricted"):
        validate_public_target("example.com:22")

    with pytest.raises(SSRFSecurityError, match="restricted"):
        validate_public_target("example.com:8080")


# ==================== TLS CLASSIFICATION & FINDINGS ====================

def test_tls_connection_and_quantum_classification():
    """Verify TLS connection classification for classical and hybrid PQC handshakes."""
    # Classical TLS 1.3
    kex, q_class, _ = _classify_tls_connection("TLSv1.3", "TLS_AES_256_GCM_SHA384")
    assert q_class == "CLASSICAL"
    assert "ECDHE" in kex

    # Hybrid Post-Quantum (e.g. X25519MLKEM768 or Kyber)
    kex_pqc, q_class_pqc, _ = _classify_tls_connection("TLSv1.3", "TLS_AES_256_GCM_SHA384_KYBER")
    assert q_class_pqc == "HYBRID_POST_QUANTUM"
    assert "Kyber" in kex_pqc or "MLKEM" in kex_pqc


def test_tls_security_findings_generation():
    """Verify security analysis flags deprecated protocols, weak ciphers, and quantum risk."""
    findings = _generate_tls_findings(
        clean_domain="legacy.example.com",
        protocol_version="TLSv1.0",
        cipher_name="DES-CBC3-SHA",
        cipher_bits=112,
        key_exchange="Static RSA",
        quantum_classification="CLASSICAL",
        server_cert=None
    )

    finding_types = {f["type"] for f in findings}
    assert "DEPRECATED_TLS_PROTOCOL" in finding_types
    assert "WEAK_CIPHER_SUITE" in finding_types
    assert "QUANTUM_EXPOSURE_HNDL" in finding_types


# ==================== DATABASE PERSISTENCE & PIPELINE INTEGRATION ====================

def test_database_persistence_and_api_retrieval(rsa_2048_cert_pem):
    """Verify scan pipeline persists tls_data and certificate_data in SQLite."""
    db = SessionLocal()
    files_data = [
        {
            "rel_path": "certs/server.pem",
            "content": rsa_2048_cert_pem.decode('utf-8')
        }
    ]

    res = _run_scan_pipeline("Batch 3 Cert Audit", "code", files_data, db)
    scan_id = res["scan_id"]

    # Verify certificate was parsed and included
    assert "certificate_data" in res
    assert len(res["certificate_data"]) == 1
    assert res["certificate_data"][0]["public_key"]["algorithm"] == "RSA"

    # Verify retrieval from database
    scan_record = get_scan_result(scan_id, db)
    assert len(scan_record["certificate_data"]) == 1
    assert scan_record["certificate_data"][0]["validity_status"] == "VALID"

    # Verify TLS and certificate endpoints
    tls_info = get_scan_tls(scan_id, db)
    assert isinstance(tls_info, dict)

    cert_info = get_scan_certificates(scan_id, db)
    assert len(cert_info) == 1

    db.close()
