
import hashlib
def legacy_commit_hash(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()
