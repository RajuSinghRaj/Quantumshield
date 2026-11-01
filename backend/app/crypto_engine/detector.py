import os
from typing import List, Dict, Any
from .python_ast_parser import analyze_python_ast
from .javascript_parser import analyze_javascript
from .java_parser import analyze_java
from .go_parser import analyze_go
from .c_parser import analyze_c_cpp
from .cert_parser import parse_certificate_or_pubkey
from .regex_patterns import scan_text_with_regex

class CryptoDetector:
    @staticmethod
    def detect_in_files(files_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run multi-layer, multi-language cryptographic detection across all files."""
        all_findings = []

        for file_info in files_data:
            rel_path = file_info["rel_path"]
            ext = (file_info.get("extension") or os.path.splitext(rel_path)[1]).lower()
            content = file_info.get("content", "")
            lines = file_info.get("lines") if "lines" in file_info else content.splitlines()

            # 1. Certificate / Public Key files
            if ext in {'.pem', '.crt', '.cer', '.csr', '.pub'}:
                cert_result = parse_certificate_or_pubkey(content, rel_path)
                if cert_result:
                    cert_result["detection_method"] = "X.509 Certificate Parser"
                    cert_result["library_or_api"] = "cryptography.x509"
                    cert_result["curve_or_parameters"] = cert_result.get("signature_algorithm", "N/A")
                    all_findings.append(cert_result)
                    continue

            # 2. Language-Specific Parsers (AST & Semantic Analysis)
            lang_findings = []

            if ext == '.py':
                lang_findings = analyze_python_ast(content, rel_path)
            elif ext in {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'}:
                lang_findings = analyze_javascript(content, rel_path)
            elif ext == '.java':
                lang_findings = analyze_java(content, rel_path)
            elif ext == '.go':
                lang_findings = analyze_go(content, rel_path)
            elif ext in {'.c', '.cpp', '.h', '.hpp', '.cc'}:
                lang_findings = analyze_c_cpp(content, rel_path)

            all_findings.extend(lang_findings)

            # 3. Fallback / Regex scanning (configs, scripts, or supplementary detection)
            # If the specialized parser already found assets on specific lines, regex won't duplicate them
            covered_lines = {f.get("line_number") for f in lang_findings if f.get("line_number")}
            uncovered_lines = [l for idx, l in enumerate(lines) if (idx + 1) not in covered_lines]

            if ext in {'.json', '.yaml', '.yml', '.conf', '.config', '.ini', '.env', '.sh', '.bash', '.cs', '.php', '.rb'} or not lang_findings:
                regex_findings = scan_text_with_regex(lines, rel_path)
                all_findings.extend(regex_findings)

        # Deduplicate findings on same file, line, and algorithm, keeping highest confidence
        deduped = {}
        for item in all_findings:
            key = f"{item['file_path']}:{item.get('line_number', 1)}:{item['algorithm']}:{item['usage']}"
            if key not in deduped or item.get('confidence', 0) > deduped[key].get('confidence', 0):
                deduped[key] = item

        return list(deduped.values())
