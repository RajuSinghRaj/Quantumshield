
import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def secure_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def secure_encrypt(key: bytes, plaintext: bytes) -> bytes:
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    return nonce + aesgcm.encrypt(nonce, plaintext, None)
