import os
import zipfile
import tempfile
import shutil
import re
from typing import List, Dict, Any, Tuple

ALLOWED_EXTENSIONS = {
    # Source code
    '.py', '.java', '.js', '.ts', '.jsx', '.tsx', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.cs', '.php', '.rb',
    # Crypto/certs
    '.pem', '.crt', '.cer', '.csr', '.pub',
    # Configs
    '.json', '.yaml', '.yml', '.conf', '.config', '.ini', '.env'
}

IGNORE_DIRS = {
    'node_modules', '.git', '__pycache__', '.idea', '.vscode', 'dist', 'build', 'venv', '.venv'
}

def is_private_key_content(content: str) -> bool:
    """Check if file contains private key markers."""
    private_key_patterns = [
        r'-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----',
        r'PRIVATE KEY-----'
    ]
    for pattern in private_key_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False

def sanitize_file_path(base_dir: str, target_path: str) -> str:
    """Prevent path traversal vulnerabilities."""
    abs_base = os.path.abspath(base_dir)
    abs_target = os.path.abspath(target_path)
    if not abs_target.startswith(abs_base):
        raise ValueError("Path traversal attempt detected!")
    return abs_target

class FileProcessor:
    @staticmethod
    def process_zip(zip_bytes: bytes) -> Tuple[str, List[Dict[str, Any]]]:
        """Extract ZIP bytes to temp directory and process all files safely."""
        temp_dir = tempfile.mkdtemp(prefix="qs_scan_")
        zip_path = os.path.join(temp_dir, "upload.zip")
        
        with open(zip_path, "wb") as f:
            f.write(zip_bytes)
            
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # Security check against zip slip
                filename = member.filename
                if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
                    continue
                target_file = os.path.join(extract_dir, filename)
                try:
                    sanitize_file_path(extract_dir, target_file)
                    zip_ref.extract(member, extract_dir)
                except Exception:
                    continue
                    
        files_data = FileProcessor.process_directory(extract_dir)
        return temp_dir, files_data

    @staticmethod
    def process_directory(dir_path: str) -> List[Dict[str, Any]]:
        """Recursively inspect a directory for relevant source and config files."""
        processed_files = []
        
        for root, dirs, files in os.walk(dir_path):
            # Exclude ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in ALLOWED_EXTENSIONS or file.lower() in {'dockerfile', 'makefile'}:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, dir_path)
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        has_private_key = is_private_key_content(content)
                        if has_private_key:
                            # Sanitize content to remove private key bytes, notify scanner
                            content = "# [REDACTED BY QUANTUMSHIELD: PRIVATE KEY MATERIAL DETECTED AND STRIPPED FOR SECURITY]\n"
                            
                        processed_files.append({
                            "rel_path": rel_path.replace("\\", "/"),
                            "full_path": full_path,
                            "extension": ext,
                            "content": content,
                            "lines": content.splitlines(),
                            "has_private_key": has_private_key
                        })
                    except Exception:
                        continue
                        
        return processed_files

    @staticmethod
    def process_single_file(filename: str, content_bytes: bytes) -> Dict[str, Any]:
        """Process a single uploaded file."""
        ext = os.path.splitext(filename)[1].lower()
        try:
            content = content_bytes.decode('utf-8', errors='ignore')
        except Exception:
            content = ""
            
        has_private_key = is_private_key_content(content)
        if has_private_key:
            content = "# [REDACTED BY QUANTUMSHIELD: PRIVATE KEY MATERIAL DETECTED AND STRIPPED FOR SECURITY]\n"

        return {
            "rel_path": filename,
            "full_path": filename,
            "extension": ext,
            "content": content,
            "lines": content.splitlines(),
            "has_private_key": has_private_key
        }

    @staticmethod
    def cleanup_temp(temp_dir: str):
        """Clean up temporary directory."""
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass
