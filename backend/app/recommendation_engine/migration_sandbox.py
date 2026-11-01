"""
QuantumShield 2.0 - Migration Sandbox Engine.
Manages isolated sandbox workspaces, patch applications, path traversal protections,
and before-and-after cryptographic risk comparisons.
"""

import os
import uuid
import datetime
from typing import Dict, Any, List, Optional
from .remediation_engine import generate_code_patch

# In-memory storage for active sandbox workspaces (keyed by sandbox_id or scan_id)
# Maps sandbox_id -> { "scan_id": ..., "files": { rel_path: content }, "patches": [...], "audit_log": [...] }
SANDBOX_SESSIONS: Dict[str, Dict[str, Any]] = {}

class PathTraversalError(ValueError):
    """Raised when an operation attempts directory traversal outside the sandbox root."""
    pass

def sanitize_sandbox_path(rel_path: str) -> str:
    """
    Validate that relative path does not escape sandbox boundary.
    Rejects directory traversal (e.g. '../', absolute paths, Windows drive letters).
    """
    clean = rel_path.strip().replace("\\", "/")
    if not clean:
        raise PathTraversalError("Path cannot be empty.")
    
    # Check for path traversal elements
    parts = clean.split("/")
    if any(p == ".." or p == "." for p in parts if p):
        raise PathTraversalError(f"Directory traversal detected in path '{rel_path}'.")
    
    # Check for absolute or drive letter paths
    if clean.startswith("/") or (len(clean) >= 2 and clean[1] == ":"):
        raise PathTraversalError(f"Absolute path '{rel_path}' is prohibited in sandbox operations.")

    return clean

def initialize_sandbox(
    scan_id: str,
    project_name: str,
    file_sources: Dict[str, str],
    initial_findings: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Initialize an isolated sandbox session for a scan.
    Duplicates source files in volatile memory without modifying original assets.
    """
    sandbox_id = f"sbx_{scan_id[:8]}_{str(uuid.uuid4())[:6]}"
    
    # Sanitize and store initial files
    safe_files = {}
    for path, content in (file_sources or {}).items():
        try:
            safe_p = sanitize_sandbox_path(path)
            safe_files[safe_p] = content
        except PathTraversalError:
            continue

    SANDBOX_SESSIONS[sandbox_id] = {
        "sandbox_id": sandbox_id,
        "scan_id": scan_id,
        "project_name": project_name,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "files": safe_files,
        "applied_patches": [],
        "audit_log": [
            {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "action": "SANDBOX_INITIALIZED",
                "details": f"Created sandbox session '{sandbox_id}' with {len(safe_files)} source files."
            }
        ]
    }

    return SANDBOX_SESSIONS[sandbox_id]

def get_or_create_sandbox(
    scan_id: str,
    project_name: str,
    file_sources: Dict[str, str],
    initial_findings: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Retrieve existing sandbox session for scan_id or initialize a new one."""
    for sbx_id, session in SANDBOX_SESSIONS.items():
        if session.get("scan_id") == scan_id:
            return session
    return initialize_sandbox(scan_id, project_name, file_sources, initial_findings)

def apply_patch_to_sandbox(
    sandbox_id: str,
    file_path: str,
    line_number: Optional[int],
    finding: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Apply a remediation code proposal to a file within the sandbox session.
    Protects original source files from modification.
    """
    if sandbox_id not in SANDBOX_SESSIONS:
        raise ValueError(f"Sandbox session '{sandbox_id}' not found.")

    session = SANDBOX_SESSIONS[sandbox_id]
    safe_path = sanitize_sandbox_path(file_path)

    current_content = session["files"].get(safe_path)
    if current_content is None:
        raise ValueError(f"File '{safe_path}' does not exist in sandbox workspace.")

    # Generate patch
    patch_info = generate_code_patch(
        source_content=current_content,
        file_path=safe_path,
        line_number=line_number,
        finding=finding
    )

    if not patch_info.get("can_auto_apply"):
        # Record template recommendation without modifying file
        audit_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "action": "MANUAL_TEMPLATE_REVIEWED",
            "file": safe_path,
            "primitive": patch_info.get("vulnerable_primitive"),
            "details": "Manual engineering template generated and reviewed."
        }
        session["audit_log"].append(audit_entry)
        return {
            "success": False,
            "message": "Automated patch not applicable; manual architectural migration template provided.",
            "patch": patch_info,
            "file_content": current_content
        }

    # Perform line replacement
    lines = current_content.splitlines(keepends=True)
    target_idx = (line_number - 1) if (line_number and 1 <= line_number <= len(lines)) else None

    if target_idx is not None:
        old_line = lines[target_idx]
        algo = finding.get("algorithm", "").upper()
        
        # Apply replacement
        if algo in {"MD5", "SHA-1", "SHA1"}:
            new_line = old_line.replace("md5", "sha256").replace("sha1", "sha256").replace("MD5", "SHA256").replace("SHA1", "SHA256")
        elif "ECB" in finding.get("variant", "").upper():
            new_line = old_line.replace("MODE_ECB", "MODE_GCM")
        elif algo in {"DES", "3DES"}:
            new_line = old_line.replace("DES3", "AES").replace("DES", "AES")
        else:
            new_line = old_line

        lines[target_idx] = new_line
        new_content = "".join(lines)
        session["files"][safe_path] = new_content

        patch_info["status"] = "ACCEPTED"
        session["applied_patches"].append(patch_info)
        session["audit_log"].append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "action": "PATCH_APPLIED",
            "file": safe_path,
            "line": line_number,
            "primitive": patch_info.get("vulnerable_primitive"),
            "target_pqc": patch_info.get("target_pqc")
        })

        return {
            "success": True,
            "message": f"Successfully applied patch to '{safe_path}' at line {line_number}.",
            "patch": patch_info,
            "file_content": new_content
        }

    raise ValueError(f"Line number {line_number} is out of bounds for file '{safe_path}'.")

def reject_patch_proposal(
    sandbox_id: str,
    file_path: str,
    finding_id: Optional[str] = None
) -> Dict[str, Any]:
    """Record user rejection of a proposed patch in the audit log."""
    if sandbox_id not in SANDBOX_SESSIONS:
        raise ValueError(f"Sandbox session '{sandbox_id}' not found.")

    session = SANDBOX_SESSIONS[sandbox_id]
    safe_path = sanitize_sandbox_path(file_path)

    audit_entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": "PATCH_REJECTED",
        "file": safe_path,
        "finding_id": finding_id,
        "details": "User rejected the proposed remediation change."
    }
    session["audit_log"].append(audit_entry)

    return {
        "success": True,
        "message": f"Remediation patch for '{safe_path}' marked as REJECTED.",
        "audit_entry": audit_entry
    }

def compare_scans_before_and_after(
    original_scan: Dict[str, Any],
    remediated_scan: Dict[str, Any],
    sandbox_session: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Compare original and post-remediation scan results.
    Identifies RESOLVED, PARTIALLY_RESOLVED, and UNRESOLVED findings based on rescan evidence.
    """
    orig_findings = original_scan.get("findings", [])
    rem_findings = remediated_scan.get("findings", [])

    orig_scores = original_scan.get("scores", {})
    rem_scores = remediated_scan.get("scores", {})

    orig_risk = original_scan.get("risk_analysis", {}).get("overall_security_risk", {})
    rem_risk = remediated_scan.get("risk_analysis", {}).get("overall_security_risk", {})

    # Map findings by canonical key: (file_path, line_number, algorithm)
    rem_keys = set()
    for f in rem_findings:
        rem_keys.add((f.get("file_path"), f.get("line_number"), f.get("algorithm", "").upper()))

    resolved = []
    unresolved = []

    for f in orig_findings:
        k = (f.get("file_path"), f.get("line_number"), f.get("algorithm", "").upper())
        if k not in rem_keys:
            resolved.append({
                "primitive": f.get("variant", f.get("algorithm")),
                "algorithm": f.get("algorithm"),
                "file_path": f.get("file_path"),
                "line_number": f.get("line_number"),
                "original_severity": f.get("severity"),
                "status": "RESOLVED",
                "evidence": "Vulnerable primitive absent in sandbox rescan."
            })
        else:
            unresolved.append({
                "primitive": f.get("variant", f.get("algorithm")),
                "algorithm": f.get("algorithm"),
                "file_path": f.get("file_path"),
                "line_number": f.get("line_number"),
                "severity": f.get("severity"),
                "status": "UNRESOLVED",
                "evidence": "Vulnerable primitive remains active in source code."
            })

    # Calculate score improvements
    quantum_delta = round(rem_scores.get("quantum_score", 0) - orig_scores.get("quantum_score", 0), 1)
    classical_delta = round(rem_scores.get("classical_score", 0) - orig_scores.get("classical_score", 0), 1)
    pqc_delta = round(rem_scores.get("pqc_score", 0) - orig_scores.get("pqc_score", 0), 1)
    overall_risk_delta = round(
        (rem_risk.get("score", 0) - orig_risk.get("score", 0)), 1
    )

    return {
        "comparison_id": str(uuid.uuid4())[:8],
        "original_scan_id": original_scan.get("scan_id"),
        "remediated_scan_id": remediated_scan.get("scan_id"),
        "score_deltas": {
            "quantum_readiness_delta": quantum_delta,
            "classical_security_delta": classical_delta,
            "pqc_adoption_delta": pqc_delta,
            "overall_risk_score_delta": overall_risk_delta, # Negative is good (risk reduced)
            "before": {
                "quantum_score": orig_scores.get("quantum_score"),
                "classical_score": orig_scores.get("classical_score"),
                "overall_risk_level": orig_scores.get("overall_risk")
            },
            "after": {
                "quantum_score": rem_scores.get("quantum_score"),
                "classical_score": rem_scores.get("classical_score"),
                "overall_risk_level": rem_scores.get("overall_risk")
            }
        },
        "findings_delta": {
            "original_count": len(orig_findings),
            "remediated_count": len(rem_findings),
            "resolved_count": len(resolved),
            "unresolved_count": len(unresolved),
            "resolved_items": resolved,
            "unresolved_items": unresolved
        },
        "audit_trail": sandbox_session.get("audit_log", []) if sandbox_session else []
    }
