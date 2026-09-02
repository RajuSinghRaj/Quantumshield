from typing import List, Dict, Any
from .python_ast_parser import analyze_python_ast
from .regex_patterns import scan_text_with_regex
from .cert_parser import parse_certificate_or_pubkey

class CryptoDetector:
    @staticmethod
    def detect_in_files(files_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Run multi-layer cryptographic detection across all files."""
        all_findings = []
        
        for file_info in files_data:
            rel_path = file_info["rel_path"]
            ext = file_info["extension"]
            content = file_info["content"]
            lines = file_info["lines"]

            # 1. Certificate / Public Key files
            if ext in {'.pem', '.crt', '.cer', '.csr', '.pub'}:
                cert_result = parse_certificate_or_pubkey(content, rel_path)
                if cert_result:
                    all_findings.append(cert_result)
                    continue # Skip text regex for clean cert files if parsed successfully

            # 2. Python AST Analysis (Layer 3)
            if ext == '.py':
                ast_findings = analyze_python_ast(content, rel_path)
                all_findings.extend(ast_findings)

            # 3. Layer 1 & 2 Regex / API Detection
            regex_findings = scan_text_with_regex(lines, rel_path)
            all_findings.extend(regex_findings)

        # Deduplicate findings on same file, line, and algorithm
        deduped = {}
        for item in all_findings:
            key = f"{item['file_path']}:{item.get('line_number', 1)}:{item['algorithm']}:{item['usage']}"
            if key not in deduped or item.get('confidence', 0) > deduped[key].get('confidence', 0):
                deduped[key] = item

        return list(deduped.values())
