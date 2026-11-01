"""
QuantumShield 2.0 Command-Line Interface (CLI).
Provides developer tooling for scanning local repositories, exporting CBOM,
evaluating security policies, and gating CI/CD pipelines without executing scanned code.
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any, Optional

# Ensure utf-8 encoding on Windows consoles
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from .devsecops.config_parser import (
    ProjectPolicyConfig,
    parse_policy_config_file,
    PolicyConfigValidationError
)
from .devsecops.engine import DevSecOpsEngine
from .devsecops.schemas import GateStatus
from .scanner.file_processor import FileProcessor

SUPPORTED_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.c', '.cpp', '.h', '.hpp',
    '.rs', '.cs', '.php', '.rb', '.pem', '.crt', '.cer', '.der', '.key',
    '.json', '.yml', '.yaml', '.xml', '.toml', '.gradle', '.mod', '.sum', '.lock'
}

IGNORED_DIRS = {
    '.git', '.svn', '.hg', 'node_modules', '__pycache__', '.pytest_cache',
    'venv', '.venv', 'env', 'dist', 'build', '.idea', '.vscode'
}


def collect_local_files(target_path: str, max_files: int = 1000) -> List[Dict[str, Any]]:
    """Safely traverse and read local directory or file without executing any code."""
    target_path = os.path.abspath(target_path)
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Path does not exist: {target_path}")

    files_data = []

    if os.path.isfile(target_path):
        if target_path.endswith(".zip"):
            with open(target_path, "rb") as f:
                content_bytes = f.read()
            _, zip_files = FileProcessor.process_zip(content_bytes)
            return zip_files
        else:
            with open(target_path, "rb") as f:
                content_bytes = f.read()
            return [FileProcessor.process_single_file(os.path.basename(target_path), content_bytes)]

    # Directory walk
    for root, dirs, files in os.walk(target_path):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]

        for file_name in files:
            if len(files_data) >= max_files:
                break

            ext = os.path.splitext(file_name)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS and file_name not in {"requirements.txt", "Pipfile", "Dockerfile", "pom.xml"}:
                continue

            full_path = os.path.join(root, file_name)
            rel_path = os.path.relpath(full_path, target_path)

            try:
                # Max 2MB per file to avoid memory overload
                if os.path.getsize(full_path) > 2 * 1024 * 1024:
                    continue

                with open(full_path, "rb") as f:
                    content_bytes = f.read()

                files_data.append(FileProcessor.process_single_file(rel_path, content_bytes))
            except Exception:
                continue

    return files_data


def get_default_policy_config(policy_path: Optional[str]) -> ProjectPolicyConfig:
    """Load policy config from specified file, local quantumshield.yml, or built-in defaults."""
    if policy_path and os.path.exists(policy_path):
        return parse_policy_config_file(policy_path)
    if os.path.exists("quantumshield.yml"):
        return parse_policy_config_file("quantumshield.yml")
    if os.path.exists("quantumshield.yaml"):
        return parse_policy_config_file("quantumshield.yaml")
    return ProjectPolicyConfig()


def cmd_scan(args: argparse.Namespace) -> int:
    """Run cryptographic discovery and print summary."""
    try:
        files = collect_local_files(args.path)
    except Exception as e:
        sys.stderr.write(f"Error reading target path: {e}\n")
        return 3

    policy_conf = get_default_policy_config(args.policy)
    engine = DevSecOpsEngine(policy_conf)
    project_name = os.path.basename(os.path.abspath(args.path)) or "Local Project"
    assessment, raw_scan = engine.evaluate_source_files(project_name, files)

    if args.json:
        print(json.dumps({
            "project_name": project_name,
            "total_assets": assessment.total_cryptographic_assets,
            "findings_by_severity": assessment.findings_by_severity,
            "classical_risk_score": assessment.classical_risk_score,
            "quantum_risk_score": assessment.quantum_risk_score,
            "quantum_readiness": assessment.quantum_readiness_score,
            "findings": raw_scan.get("findings", [])
        }, indent=2))
    else:
        print(f"\n[QuantumShield 2.0] Cryptographic Discovery Scan")
        print(f"Target: {args.path} ({len(files)} files inspected)")
        print(f"Discovered Assets: {assessment.total_cryptographic_assets}")
        print(f"Severity Breakdown: Critical={assessment.findings_by_severity.get('CRITICAL', 0)}, "
              f"High={assessment.findings_by_severity.get('HIGH', 0)}, "
              f"Medium={assessment.findings_by_severity.get('MEDIUM', 0)}, "
              f"Low={assessment.findings_by_severity.get('LOW', 0)}")
        print(f"Classical Hardening: {100.0 - assessment.classical_risk_score:.1f}/100")
        print(f"Quantum Readiness: {assessment.quantum_readiness_score:.1f}%")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(raw_scan.get("findings", []), f, indent=2)

    return 0


def cmd_cbom_export(args: argparse.Namespace) -> int:
    """Export CycloneDX 1.6 Cryptographic Bill of Materials."""
    try:
        files = collect_local_files(args.path)
    except Exception as e:
        sys.stderr.write(f"Error reading target path: {e}\n")
        return 3

    policy_conf = get_default_policy_config(None)
    engine = DevSecOpsEngine(policy_conf)
    project_name = os.path.basename(os.path.abspath(args.path)) or "Local Project"
    _, raw_scan = engine.evaluate_source_files(project_name, files)
    cbom = raw_scan.get("cbom", {})

    cbom_str = json.dumps(cbom, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(cbom_str)
        print(f"[OK] CBOM exported successfully to {args.output} ({len(cbom.get('components', []))} components)")
    else:
        print(cbom_str)

    return 0


def cmd_risk(args: argparse.Namespace) -> int:
    """Display quantum and classical risk posture."""
    try:
        files = collect_local_files(args.path)
    except Exception as e:
        sys.stderr.write(f"Error reading target path: {e}\n")
        return 3

    policy_conf = get_default_policy_config(args.policy)
    engine = DevSecOpsEngine(policy_conf)
    project_name = os.path.basename(os.path.abspath(args.path)) or "Local Project"
    assessment, raw_scan = engine.evaluate_source_files(project_name, files)

    if args.json:
        print(json.dumps({
            "classical_risk_score": assessment.classical_risk_score,
            "classical_risk_level": assessment.classical_risk_level,
            "quantum_risk_score": assessment.quantum_risk_score,
            "quantum_risk_level": assessment.quantum_risk_level,
            "quantum_readiness_score": assessment.quantum_readiness_score,
            "hndl_findings": assessment.hndl_findings,
            "dependency_risks": assessment.dependency_risks
        }, indent=2))
    else:
        print(f"\n[QuantumShield 2.0] Risk Intelligence Summary")
        print(f"Project: {project_name}")
        print(f"Classical Risk: {assessment.classical_risk_score:.1f}/100 ({assessment.classical_risk_level})")
        print(f"Quantum Risk:   {assessment.quantum_risk_score:.1f}/100 ({assessment.quantum_risk_level})")
        print(f"Quantum Ready:  {assessment.quantum_readiness_score:.1f}%")
        print(f"Dependencies:   {assessment.dependency_risks.get('total_dependencies', 0)} total, {assessment.dependency_risks.get('vulnerable_count', 0)} vulnerable")

    return 0


def cmd_policy_check(args: argparse.Namespace) -> int:
    """Validate quantumshield.yml policy configuration syntax and rules."""
    policy_path = args.policy or "quantumshield.yml"
    if not os.path.exists(policy_path):
        sys.stderr.write(f"Policy file not found: {policy_path}\n")
        return 3

    try:
        config = parse_policy_config_file(policy_path)
    except PolicyConfigValidationError as pe:
        sys.stderr.write(f"[ERROR] Policy configuration validation failed: {pe}\n")
        return 3
    except Exception as e:
        sys.stderr.write(f"[ERROR] Failed to read policy file: {e}\n")
        return 3

    if args.json:
        print(json.dumps({
            "valid": True,
            "version": config.version,
            "project_name": config.project_name,
            "thresholds": config.thresholds.model_dump(),
            "configured_policies_count": len(config.policies),
            "exceptions_count": len(config.exceptions),
            "excluded_paths": config.exclude_paths
        }, indent=2))
    else:
        print(f"[OK] Policy configuration '{policy_path}' is VALID (Schema Version {config.version})")
        print(f"Configured Rules: {len(config.policies)}")
        print(f"Documented Exceptions: {len(config.exceptions)}")
        for exc in config.exceptions:
            print(f"  - [{exc.rule_id}] on {exc.file_path or 'all'}: '{exc.reason}' (approved by {exc.approved_by})")
        print(f"Gate Thresholds:")
        print(f"  Max Critical Findings: {config.thresholds.max_critical_findings}")
        print(f"  Max Classical Risk:    {config.thresholds.max_classical_risk_score}")
        print(f"  Max Quantum Risk:      {config.thresholds.max_quantum_risk_score}")
        print(f"  Min Quantum Readiness: {config.thresholds.min_quantum_readiness_score}%")
        print(f"  Require CBOM Artifact: {config.thresholds.require_cbom}")

    return 0


def cmd_devsecops_evaluate(args: argparse.Namespace) -> int:
    """Run full CI/CD gate evaluation and enforce blocking security policies."""
    try:
        files = collect_local_files(args.path)
    except Exception as e:
        sys.stderr.write(f"Error reading target path: {e}\n")
        return 3

    try:
        policy_conf = get_default_policy_config(args.policy)
    except PolicyConfigValidationError as pe:
        sys.stderr.write(f"[ERROR] Invalid policy configuration: {pe}\n")
        return 3

    engine = DevSecOpsEngine(policy_conf)
    project_name = os.path.basename(os.path.abspath(args.path)) or "Local Project"
    assessment, raw_scan = engine.evaluate_source_files(project_name, files)
    gate_result = assessment.gate_result

    # Format output
    if args.json:
        print(json.dumps(assessment.model_dump(), indent=2))
    else:
        report_md = engine.security_gate.generate_markdown_report(project_name, gate_result, assessment.scan_id)
        print("\n" + report_md + "\n")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            if args.output.endswith(".json"):
                json.dump(assessment.model_dump(), f, indent=2)
            else:
                f.write(engine.security_gate.generate_markdown_report(project_name, gate_result, assessment.scan_id))
        if not args.json:
            print(f"[OK] Assessment report saved to: {args.output}")

    if getattr(args, "cbom_out", None):
        cbom = raw_scan.get("cbom", {})
        with open(args.cbom_out, "w", encoding="utf-8") as f:
            json.dump(cbom, f, indent=2)
        if not args.json:
            print(f"[OK] CycloneDX 1.6 CBOM saved to: {args.cbom_out}")

    # Determine exit code
    if gate_result.pipeline_status == GateStatus.FAIL:
        return 1
    elif gate_result.pipeline_status == GateStatus.MANUAL_REVIEW_REQUIRED:
        return 2
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Construct argument parser for CLI commands."""
    parser = argparse.ArgumentParser(
        prog="quantumshield",
        description="QuantumShield 2.0 DevSecOps & CI/CD Cryptographic Security Gate CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # scan
    p_scan = subparsers.add_parser("scan", help="Run cryptographic discovery scan on target directory or file")
    p_scan.add_argument("path", nargs="?", default=".", help="Directory or file to scan (default: current directory)")
    p_scan.add_argument("--policy", help="Path to quantumshield.yml configuration")
    p_scan.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    p_scan.add_argument("-o", "--output", "--out", help="Write scan findings JSON to output file")

    # cbom export
    p_cbom = subparsers.add_parser("cbom", help="Export CycloneDX 1.6 Cryptographic Bill of Materials (CBOM)")
    cbom_sub = p_cbom.add_subparsers(dest="cbom_action", help="CBOM actions")
    p_cbom_export = cbom_sub.add_parser("export", help="Export CBOM")
    p_cbom_export.add_argument("path", nargs="?", default=".", help="Directory to scan for CBOM generation")
    p_cbom_export.add_argument("--format", default="cyclonedx-json", choices=["cyclonedx-json"], help="Output specification format")
    p_cbom_export.add_argument("-o", "--output", "--out", help="Write CBOM to file")

    # risk
    p_risk = subparsers.add_parser("risk", help="Analyze classical and post-quantum cryptographic risk posture")
    p_risk.add_argument("path", nargs="?", default=".", help="Directory or file to analyze")
    p_risk.add_argument("--policy", help="Path to quantumshield.yml configuration")
    p_risk.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # policy check
    p_policy = subparsers.add_parser("policy", help="Security policy configuration commands")
    policy_sub = p_policy.add_subparsers(dest="policy_action", help="Policy actions")
    p_policy_check = policy_sub.add_parser("check", help="Validate policy configuration syntax and rules")
    p_policy_check.add_argument("--policy", default="quantumshield.yml", help="Path to policy configuration file")
    p_policy_check.add_argument("--json", action="store_true", help="Output validation result as JSON")

    # devsecops evaluate
    p_devsecops = subparsers.add_parser("devsecops", help="DevSecOps CI/CD security gate commands")
    devsecops_sub = p_devsecops.add_subparsers(dest="devsecops_action", help="DevSecOps actions")
    p_devsecops_eval = devsecops_sub.add_parser("evaluate", help="Evaluate CI/CD gate against project security policies")
    p_devsecops_eval.add_argument("path", nargs="?", default=".", help="Directory or file to evaluate")
    p_devsecops_eval.add_argument("--policy", help="Path to quantumshield.yml configuration")
    p_devsecops_eval.add_argument("--json", action="store_true", help="Output machine-readable JSON assessment")
    p_devsecops_eval.add_argument("-o", "--output", "--out", help="Write evaluation report or JSON to file")
    p_devsecops_eval.add_argument("--cbom-out", help="Write generated CycloneDX 1.6 CBOM to file")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "scan":
        sys.exit(cmd_scan(args))
    elif args.command == "cbom":
        if getattr(args, "cbom_action", None) == "export":
            sys.exit(cmd_cbom_export(args))
        parser.print_help()
        sys.exit(0)
    elif args.command == "risk":
        sys.exit(cmd_risk(args))
    elif args.command == "policy":
        if getattr(args, "policy_action", None) == "check":
            sys.exit(cmd_policy_check(args))
        parser.print_help()
        sys.exit(0)
    elif args.command == "devsecops":
        if getattr(args, "devsecops_action", None) == "evaluate":
            sys.exit(cmd_devsecops_evaluate(args))
        parser.print_help()
        sys.exit(0)
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()

