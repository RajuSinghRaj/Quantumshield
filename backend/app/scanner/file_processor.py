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
    # Configs and manifests
    '.json', '.yaml', '.yml', '.conf', '.config', '.ini', '.env',
    '.toml', '.lock', '.xml', '.gradle', '.kts', '.mod', '.sum', '.txt'
}

MANIFEST_NAMES = {
    'requirements.txt', 'pipfile', 'pipfile.lock', 'pyproject.toml', 'poetry.lock',
    'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'pom.xml', 'build.gradle', 'build.gradle.kts',
    'go.mod', 'go.sum',
    'cargo.toml', 'cargo.lock',
    'cmakelists.txt', 'vcpkg.json', 'conanfile.txt', 'conanfile.py', 'dockerfile', 'makefile'
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

# Security extraction bounds
MAX_ZIP_ENTRIES = 2000
MAX_TOTAL_EXTRACTED_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024       # 10 MB

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
        
        total_extracted_bytes = 0
        extracted_files_count = 0

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # 1. Check entry count limit (Zip Bomb Guard)
                if extracted_files_count >= MAX_ZIP_ENTRIES:
                    break

                # 2. Check total decompressed size limit (Zip Bomb Guard)
                if total_extracted_bytes + member.file_size > MAX_TOTAL_EXTRACTED_BYTES:
                    break

                # 3. Check individual file size limit
                if member.file_size > MAX_SINGLE_FILE_BYTES:
                    continue

                # 4. Check for POSIX symlinks (Symlink Guard)
                is_symlink = ((member.external_attr >> 16) & 0o120000) == 0o120000
                if is_symlink:
                    continue

                # 5. Security check against zip slip (Path Traversal Guard)
                filename = member.filename
                if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
                    continue
                target_file = os.path.join(extract_dir, filename)
                try:
                    sanitize_file_path(extract_dir, target_file)
                    zip_ref.extract(member, extract_dir)
                    total_extracted_bytes += member.file_size
                    extracted_files_count += 1
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
                if ext in ALLOWED_EXTENSIONS or file.lower() in MANIFEST_NAMES or file.lower().startswith('requirements'):
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
