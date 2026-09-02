from typing import List, Dict, Any

DEMO_PROJECTS = {
    "legacy_bank": {
        "id": "legacy_bank",
        "name": "Vulnerable Legacy Banking API",
        "description": "Legacy financial API relying on RSA-2048 signatures, SHA-1 password hashes, and DES configuration files.",
        "category": "Vulnerable Legacy App",
        "files": [
            {
                "rel_path": "auth/rsa_verifier.py",
                "extension": ".py",
                "content": """import hashlib
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA1

def initialize_auth():
    # Legacy keypair generation
    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    return key

def sign_transaction(private_key, message):
    h = SHA1.new(message)
    signature = pkcs1_15.new(private_key).sign(h)
    return signature

def hash_user_password(password):
    # Insecure MD5 hashing
    return hashlib.md5(password.encode()).hexdigest()
""",
                "lines": [
                    "import hashlib",
                    "from Crypto.PublicKey import RSA",
                    "from Crypto.Signature import pkcs1_15",
                    "from Crypto.Hash import SHA1",
                    "",
                    "def initialize_auth():",
                    "    # Legacy keypair generation",
                    "    key = RSA.generate(2048)",
                    "    private_key = key.export_key()",
                    "    public_key = key.publickey().export_key()",
                    "    return key",
                    "",
                    "def sign_transaction(private_key, message):",
                    "    h = SHA1.new(message)",
                    "    signature = pkcs1_15.new(private_key).sign(h)",
                    "    return signature",
                    "",
                    "def hash_user_password(password):",
                    "    # Insecure MD5 hashing",
                    "    return hashlib.md5(password.encode()).hexdigest()"
                ]
            },
            {
                "rel_path": "config/security.yaml",
                "extension": ".yaml",
                "content": """security:
  cipher_suite: DES-EDE3-CBC
  signature_algorithm: SHA1withRSA
  key_length: 2048
  hashing_algorithm: MD5
""",
                "lines": [
                    "security:",
                    "  cipher_suite: DES-EDE3-CBC",
                    "  signature_algorithm: SHA1withRSA",
                    "  key_length: 2048",
                    "  hashing_algorithm: MD5"
                ]
            }
        ]
    },

    "cloud_microservice": {
        "id": "cloud_microservice",
        "name": "Modern Cloud Microservice",
        "description": "Standard production service using ECDSA P-256 and AES-128-GCM.",
        "category": "Modern Classical App",
        "files": [
            {
                "rel_path": "service/crypto.ts",
                "extension": ".ts",
                "content": """import crypto from 'crypto';

export function encryptPayload(data: string, secretKey: Buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-128-gcm', secretKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
}

export function generateSigningKey() {
    return crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256r1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
}
""",
                "lines": [
                    "import crypto from 'crypto';",
                    "",
                    "export function encryptPayload(data: string, secretKey: Buffer) {",
                    "    const iv = crypto.randomBytes(12);",
                    "    const cipher = crypto.createCipheriv('aes-128-gcm', secretKey, iv);",
                    "    let encrypted = cipher.update(data, 'utf8', 'hex');",
                    "    encrypted += cipher.final('hex');",
                    "    return { encrypted, iv: iv.toString('hex') };",
                    "}",
                    "",
                    "export function generateSigningKey() {",
                    "    return crypto.generateKeyPairSync('ec', {",
                    "        namedCurve: 'secp256r1',",
                    "        publicKeyEncoding: { type: 'spki', format: 'pem' },",
                    "        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }",
                    "    });",
                    "}"
                ]
            }
        ]
    },

    "pqc_hybrid": {
        "id": "pqc_hybrid",
        "name": "Post-Quantum Ready Hybrid Service",
        "description": "State-of-the-art service integrating NIST ML-KEM-768 for key agreement and ML-DSA-65 signatures alongside AES-256-GCM.",
        "category": "Post-Quantum Ready App",
        "files": [
            {
                "rel_path": "pqc/hybrid_vault.py",
                "extension": ".py",
                "content": """from cryptography.hazmat.primitives.ciphers.aead import AESGCM
# OpenSSL 3.4 PQC standard wrappers
from oqs import KeyEncapsulation, Signature

def establish_quantum_channel():
    # NIST FIPS 203 Post-Quantum Key Encapsulation
    kem = KeyEncapsulation("ML-KEM-768")
    public_key = kem.generate_keypair()
    ciphertext, shared_secret = kem.encap_secret(public_key)
    return shared_secret

def sign_manifest(manifest_bytes):
    # NIST FIPS 204 Post-Quantum Digital Signature
    sig = Signature("ML-DSA-65")
    pub_key = sig.generate_keypair()
    signature = sig.sign(manifest_bytes)
    return signature

def encrypt_data(data_bytes, key_bytes):
    # AES-256-GCM (Quantum Resistant Symmetric Mode)
    aesgcm = AESGCM(key_bytes)
    nonce = b'012345678912'
    return aesgcm.encrypt(nonce, data_bytes, None)
""",
                "lines": [
                    "from cryptography.hazmat.primitives.ciphers.aead import AESGCM",
                    "# OpenSSL 3.4 PQC standard wrappers",
                    "from oqs import KeyEncapsulation, Signature",
                    "",
                    "def establish_quantum_channel():",
                    "    # NIST FIPS 203 Post-Quantum Key Encapsulation",
                    "    kem = KeyEncapsulation('ML-KEM-768')",
                    "    public_key = kem.generate_keypair()",
                    "    ciphertext, shared_secret = kem.encap_secret(public_key)",
                    "    return shared_secret",
                    "",
                    "def sign_manifest(manifest_bytes):",
                    "    # NIST FIPS 204 Post-Quantum Digital Signature",
                    "    sig = Signature('ML-DSA-65')",
                    "    pub_key = sig.generate_keypair()",
                    "    signature = sig.sign(manifest_bytes)",
                    "    return signature",
                    "",
                    "def encrypt_data(data_bytes, key_bytes):",
                    "    # AES-256-GCM (Quantum Resistant Symmetric Mode)",
                    "    aesgcm = AESGCM(key_bytes)",
                    "    nonce = b'012345678912'",
                    "    return aesgcm.encrypt(nonce, data_bytes, None)"
                ]
            }
        ]
    },

    "insecure_auth": {
        "id": "insecure_auth",
        "name": "Insecure Legacy Auth Gateway",
        "description": "Critical severity target utilizing RSA-1024, 3DES, and MD5 message digests.",
        "category": "Critical Legacy Target",
        "files": [
            {
                "rel_path": "com/bank/auth/LegacyGateway.java",
                "extension": ".java",
                "content": """package com.bank.auth;

import javax.crypto.Cipher;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;

public class LegacyGateway {
    public void setupSecurity() throws Exception {
        // Critical: Small RSA key length
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(1024);

        // Deprecated 3DES cipher
        Cipher cipher = Cipher.getInstance("DESede/CBC/PKCS5Padding");
        
        // Broken MD5 digest
        MessageDigest md5 = MessageDigest.getInstance("MD5");
    }
}
""",
                "lines": [
                    "package com.bank.auth;",
                    "",
                    "import javax.crypto.Cipher;",
                    "import java.security.KeyPairGenerator;",
                    "import java.security.MessageDigest;",
                    "",
                    "public class LegacyGateway {",
                    "    public void setupSecurity() throws Exception {",
                    "        // Critical: Small RSA key length",
                    "        KeyPairGenerator kpg = KeyPairGenerator.getInstance(\"RSA\");",
                    "        kpg.initialize(1024);",
                    "",
                    "        // Deprecated 3DES cipher",
                    "        Cipher cipher = Cipher.getInstance(\"DESede/CBC/PKCS5Padding\");",
                    "        ",
                    "        // Broken MD5 digest",
                    "        MessageDigest md5 = MessageDigest.getInstance(\"MD5\");",
                    "    }",
                    "}"
                ]
            }
        ]
    }
}
