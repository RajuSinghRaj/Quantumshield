
import hashlib
from Crypto.Cipher import DES, AES
from Crypto.PublicKey import RSA

def weak_hash(data: bytes):
    m = hashlib.md5(data).hexdigest()
    s = hashlib.sha1(data).hexdigest()
    return m, s

def weak_ciphers(key: bytes, pt: bytes):
    c1 = DES.new(key[:8], DES.MODE_ECB)
    c2 = AES.new(key[:16], AES.MODE_ECB)
    return c1.encrypt(pt[:8]), c2.encrypt(pt[:16])

def weak_rsa():
    return RSA.generate(1024)
