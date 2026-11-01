"""
Comprehensive Test Suite for Batch 1:
- Cryptographic Discovery Engine Enhancements
- Polyglot Source-Code Analysis (Python AST, JS/TS, Java, Go, C/C++)
- Accurate Vulnerability Classification (Classical vs Quantum)
- False-Positive and Comment Filtering
- Private-Key Redaction & ZIP Ingestion
- CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) Generation & Export
"""

import os
import sys
import json
import zipfile
import io
import pytest

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.crypto_engine.detector import CryptoDetector
from app.crypto_engine.python_ast_parser import analyze_python_ast
from app.crypto_engine.javascript_parser import analyze_javascript
from app.crypto_engine.java_parser import analyze_java
from app.crypto_engine.go_parser import analyze_go
from app.crypto_engine.c_parser import analyze_c_cpp
from app.crypto_engine.regex_patterns import scan_text_with_regex
from app.quantum_engine.quantum_risk import map_quantum_risk
from app.crypto_engine.cbom import generate_cbom, validate_cbom_structure
from app.scanner.file_processor import FileProcessor
from app.quantum_engine.threat_analyzer import analyze_all_findings
from app.risk_engine.scoring import calculate_quantum_scores

# ----------------- 1. TEST PYTHON AST PARSER -----------------

def test_python_ast_detection():
    py_code = """
import hashlib
from cryptography.hazmat.primitives.asymmetric import rsa, ec, x25519, ed25519, dh
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, hmac

# 1. RSA
rsa_key = rsa.generate_private_key(public_exponent=65537, key_size=4096)

# 2. ECC & ECDH
ecc_key = ec.generate_private_key(ec.SECP384R1())

# 3. X25519 & Ed25519
x_key = x25519.X25519PrivateKey.generate()
ed_key = ed25519.Ed25519PrivateKey.generate()

# 4. Diffie-Hellman
dh_params = dh.generate_parameters(generator=2, key_size=2048)

# 5. AES-256-GCM & AES-128-CBC
cipher1 = Cipher(algorithms.AES(b"01234567890123456789012345678901"), modes.GCM(b"123456789012"))
cipher2 = Cipher(algorithms.AES(b"0123456789012345"), modes.CBC(b"1234567890123456"))

# 6. Hashes & HMAC
h1 = hashlib.sha256(b"data").digest()
h2 = hashlib.md5(b"legacy").hexdigest()
h_mac = hmac.HMAC(b"key", hashes.SHA512())
"""
    findings = analyze_python_ast(py_code, "test_app/crypto.py")
    algos = {f["algorithm"]: f for f in findings}

    assert "RSA" in algos
    assert algos["RSA"]["key_size"] == 4096
    assert algos["RSA"]["variant"] == "RSA-4096"

    assert "ECDSA" in algos
    assert algos["ECDSA"]["key_size"] == 384

    assert "X25519" in algos
    assert algos["X25519"]["usage"] == "KEY_EXCHANGE"

    assert "Ed25519" in algos
    assert algos["Ed25519"]["usage"] == "DIGITAL_SIGNATURE"

    assert "Diffie-Hellman" in algos
    assert algos["Diffie-Hellman"]["key_size"] == 2048

    assert "AES" in algos
    assert "MD5" in algos
    assert "HMAC" in algos
    assert algos["HMAC"]["variant"] == "HMAC-SHA512"


# ----------------- 2. TEST JAVASCRIPT / TYPESCRIPT PARSER -----------------

def test_javascript_parser():
    js_code = """
const crypto = require('crypto');

// This is a comment mentioning RSA-4096 and AES-256 which should NOT be detected!
/* Multi-line comment
   discussing DES and MD5
*/

const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
const hash = crypto.createHash('sha256').update(data).digest('hex');
const hmac = crypto.createHmac('sha512', secret).update(data).digest();
crypto.generateKeyPair('rsa', { modulusLength: 2048 }, (err, pub, priv) => {});
crypto.generateKeyPair('ec', { namedCurve: 'prime256v1' }, (err, pub, priv) => {});
const ecdh = crypto.createECDH('prime256v1');
"""
    findings = analyze_javascript(js_code, "src/auth/service.ts")
    algos = {f["algorithm"]: f for f in findings}

    assert "AES" in algos
    assert algos["AES"]["variant"] == "AES-128-GCM"
    assert algos["AES"]["key_size"] == 128

    assert "SHA-256" in algos
    assert "HMAC" in algos
    assert algos["HMAC"]["variant"] == "HMAC-SHA512"

    assert "RSA" in algos
    assert algos["RSA"]["key_size"] == 2048

    assert "ECDSA" in algos
    assert "ECDH" in algos

    # Ensure comments mentioning DES/MD5 did NOT trigger findings
    assert "DES" not in algos
    assert "MD5" not in algos


# ----------------- 3. TEST JAVA PARSER -----------------

def test_java_parser():
    java_code = """
package com.bank.security;

import javax.crypto.Cipher;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import javax.crypto.Mac;

public class CryptoService {
    // Note: Do not use DES or MD5 in future
    public void init() throws Exception {
        Cipher c1 = Cipher.getInstance("AES/GCM/NoPadding");
        Cipher c2 = Cipher.getInstance("DESede/CBC/PKCS5Padding");
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        Mac mac = Mac.getInstance("HmacSHA256");
    }
}
"""
    findings = analyze_java(java_code, "src/main/java/CryptoService.java")
    algos = {f["algorithm"]: f for f in findings}

    assert "AES" in algos
    assert algos["AES"]["variant"] == "AES-256-GCM"

    assert "3DES" in algos
    assert "RSA" in algos
    assert "SHA-512" in algos
    assert "HMAC" in algos
    assert "DES" not in algos # Comment DES ignored


# ----------------- 4. TEST GO PARSER -----------------

def test_go_parser():
    go_code = """
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rsa"
    "crypto/sha256"
    "crypto/hmac"
    "crypto/rand"
)

// Comment about MD5
func setupCrypto() {
    key, _ := rsa.GenerateKey(rand.Reader, 2048)
    block, _ := aes.NewCipher([]byte("passphrasewhichneedstobe32bytes!"))
    gcm, _ := cipher.NewGCM(block)
    h := sha256.New()
    mac := hmac.New(sha256.New, []byte("key"))
}
"""
    findings = analyze_go(go_code, "cmd/server/main.go")
    algos = {f["algorithm"]: f for f in findings}

    assert "RSA" in algos
    assert algos["RSA"]["key_size"] == 2048

    assert "AES" in algos
    assert "GCM" in algos["AES"]["curve_or_parameters"]

    assert "SHA-256" in algos
    assert "HMAC" in algos
    assert "MD5" not in algos


# ----------------- 5. TEST C/C++ PARSER -----------------

def test_c_parser():
    c_code = """
#include <openssl/evp.h>
#include <openssl/rsa.h>

// Note: Removed DES and MD5 support
int encrypt_payload() {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(mdctx, EVP_sha256(), NULL);
    RSA_generate_key_ex(NULL, 2048, NULL, NULL);
    return 0;
}
"""
    findings = analyze_c_cpp(c_code, "src/native/crypto.c")
    algos = {f["algorithm"]: f for f in findings}

    assert "AES" in algos
    assert algos["AES"]["variant"] == "AES-256-GCM"

    assert "SHA-256" in algos
    assert "RSA" in algos
    assert "DES" not in algos


# ----------------- 6. TEST PQC ALGORITHM DETECTION -----------------

def test_pqc_detection():
    sample_code = """
import oqs
from pqcrypto.kem import kyber768
from pqcrypto.sign import dilithium3

kem = oqs.KeyEncapsulation("ML-KEM-768")
sig = oqs.Signature("ML-DSA-65")
slh = oqs.Signature("SLH-DSA-128f")
"""
    findings = analyze_python_ast(sample_code, "pqc/vault.py")
    algos = {f["algorithm"]: f for f in findings}

    assert "ML-KEM" in algos
    assert algos["ML-KEM"]["variant"] == "ML-KEM-768"
    assert algos["ML-KEM"]["key_size"] == 768

    assert "ML-DSA" in algos
    assert algos["ML-DSA"]["variant"] == "ML-DSA-65"

    assert "SLH-DSA" in algos
    assert algos["SLH-DSA"]["variant"] == "SLH-DSA-128f"


# ----------------- 7. TEST FALSE-POSITIVE AND COMMENT FILTERING -----------------

def test_false_positive_filtering():
    code_with_comments = """
// We previously deprecated RSA-1024 and MD5
# Do not reintroduce SHA-1 or DES
/* Here is a discussion of AES-128 vs AES-256 in documentation */
let canvasHeight = 100;
let userAddress = "123 Main St";
let messages = [];
let classes = [];
"""
    # Regex scanner should NOT match pure comments
    findings = scan_text_with_regex(code_with_comments.splitlines(), "docs/notes.txt")
    assert len(findings) == 0, f"Expected 0 findings in comments, got {len(findings)}"


# ----------------- 8. TEST AES-128 vs AES-256 DIFFERENTIATION & GROVER RISK -----------------

def test_aes_differentiation_and_quantum_risk():
    aes128_risk = map_quantum_risk({"algorithm": "AES", "variant": "AES-128-GCM", "key_size": 128})
    aes256_risk = map_quantum_risk({"algorithm": "AES", "variant": "AES-256-GCM", "key_size": 256})

    assert aes128_risk["quantum_risk"] == "DEGRADED"
    assert aes128_risk["quantum_security_bits"] == 64
    assert "Grover" in aes128_risk["quantum_threat"]

    assert aes256_risk["quantum_risk"] == "SAFE"
    assert aes256_risk["quantum_security_bits"] == 128


# ----------------- 9. TEST CLASSICAL vs QUANTUM CLASSIFICATION -----------------

def test_classical_vs_quantum_classification():
    # 1. MD5: Classically broken, severe risk
    md5_info = map_quantum_risk({"algorithm": "MD5", "variant": "MD5", "key_size": 128})
    assert md5_info["severity"] == "CRITICAL"

    # 2. RSA-2048: Classically safe today, but quantum vulnerable
    rsa_info = map_quantum_risk({"algorithm": "RSA", "variant": "RSA-2048", "key_size": 2048})
    assert rsa_info["quantum_risk"] == "VULNERABLE"
    assert "future fault-tolerant quantum computer" in rsa_info["explanation"]
    assert "Shor" in rsa_info["quantum_threat"]

    # 3. ML-KEM-768: Post-quantum safe
    pqc_info = map_quantum_risk({"algorithm": "ML-KEM", "variant": "ML-KEM-768", "key_size": 768})
    assert pqc_info["quantum_risk"] == "POST_QUANTUM"
    assert pqc_info["quantum_security_bits"] >= 192


# ----------------- 10. TEST PRIVATE-KEY REDACTION -----------------

def test_private_key_redaction():
    private_key_pem = b"""-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y5...[FAKE_PRIVATE_KEY_BYTES]...
-----END RSA PRIVATE KEY-----
"""
    processed = FileProcessor.process_single_file("private.pem", private_key_pem)
    assert processed["has_private_key"] is True
    assert "REDACTED" in processed["content"]
    assert "FAKE_PRIVATE_KEY_BYTES" not in processed["content"]


# ----------------- 11. TEST ZIP SCANNING -----------------

def test_zip_scanning():
    # Create in-memory ZIP with a Python crypto file and a JS crypto file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("app/auth.py", "from cryptography.hazmat.primitives.asymmetric import rsa\nk = rsa.generate_private_key(65537, 2048)\n")
        zf.writestr("web/client.js", "const crypto = require('crypto'); const h = crypto.createHash('sha256');\n")

    zip_bytes = zip_buffer.getvalue()
    temp_dir, files_data = FileProcessor.process_zip(zip_bytes)
    try:
        assert len(files_data) == 2
        findings = CryptoDetector.detect_in_files(files_data)
        algos = {f["algorithm"] for f in findings}
        assert "RSA" in algos
        assert "SHA-256" in algos
    finally:
        FileProcessor.cleanup_temp(temp_dir)


# ----------------- 12. TEST CBOM GENERATION & CYCLONEDX 1.6 SCHEMA VALIDATION -----------------

def test_cbom_generation_and_schema():
    raw_files = [
        {
            "rel_path": "backend/auth.py",
            "extension": ".py",
            "content": "from cryptography.hazmat.primitives.asymmetric import rsa, x25519\nk1 = rsa.generate_private_key(65537, 2048)\nk2 = x25519.X25519PrivateKey.generate()\n",
            "lines": [
                "from cryptography.hazmat.primitives.asymmetric import rsa, x25519",
                "k1 = rsa.generate_private_key(65537, 2048)",
                "k2 = x25519.X25519PrivateKey.generate()"
            ]
        }
    ]
    raw_assets = CryptoDetector.detect_in_files(raw_files)
    enriched = analyze_all_findings(raw_assets)
    scores, _ = calculate_quantum_scores(enriched)

    cbom = generate_cbom(
        scan_id="scan-test-1234",
        project_name="Test Banking Suite",
        scan_type="upload",
        findings=enriched,
        scores=scores
    )

    assert validate_cbom_structure(cbom) is True
    assert cbom["bomFormat"] == "CycloneDX"
    assert cbom["specVersion"] == "1.6"
    assert cbom["serialNumber"].startswith("urn:uuid:")
    assert len(cbom["components"]) >= 2

    # Check component structure
    comp = cbom["components"][0]
    assert comp["type"] == "cryptographic-asset"
    assert "cryptoProperties" in comp
    assert "algorithmProperties" in comp["cryptoProperties"]
    assert "primitive" in comp["cryptoProperties"]["algorithmProperties"]
    assert "occurrences" in comp["evidence"]
    assert comp["evidence"]["occurrences"][0]["location"] == "backend/auth.py"

    # Export to JSON and verify valid JSON string
    cbom_json_str = json.dumps(cbom)
    parsed_back = json.loads(cbom_json_str)
    assert parsed_back["bomFormat"] == "CycloneDX"


# ----------------- 13. TEST EMPTY SCAN HANDLING -----------------

def test_empty_scan():
    empty_findings = CryptoDetector.detect_in_files([])
    assert len(empty_findings) == 0

    scores, breakdown = calculate_quantum_scores([])
    assert scores["classical_score"] == 100.0
    assert scores["quantum_score"] == 100.0

    cbom = generate_cbom("empty-id", "Empty Project", "upload", [], scores)
    assert cbom["bomFormat"] == "CycloneDX"
    assert len(cbom["components"]) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
