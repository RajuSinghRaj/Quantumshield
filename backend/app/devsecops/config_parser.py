"""
Parser and Schema Validator for QuantumShield Project Policy Configuration (`quantumshield.yml`).
Enforces schema validity, validates enforcement modes, and ensures documented
justification exists for all security exceptions.
"""

import os
import json
import logging
import datetime
from typing import Dict, Any, List, Optional, Tuple
import yaml

from .schemas import (
    GateThresholds,
    PolicyException,
    PolicySeverity,
    PolicyEnforcement,
    PolicyCategory
)
from .builtin_policies import BUILTIN_POLICIES_MAP

logger = logging.getLogger(__name__)

VALID_SEVERITIES = {s.value for s in PolicySeverity}
VALID_ENFORCEMENTS = {e.value for e in PolicyEnforcement}


class PolicyConfigValidationError(Exception):
    """Raised when quantumshield.yml contains invalid schema, enforcement, or missing justifications."""
    pass


class ProjectPolicyConfig:
    """Parsed and validated policy configuration object."""

    def __init__(
        self,
        version: str = "2.0",
        project_name: Optional[str] = None,
        thresholds: Optional[GateThresholds] = None,
        policies: Optional[Dict[str, Dict[str, Any]]] = None,
        exceptions: Optional[List[PolicyException]] = None,
        exclude_paths: Optional[List[str]] = None,
        raw_config: Optional[Dict[str, Any]] = None
    ):
        self.version = version
        self.project_name = project_name
        self.thresholds = thresholds or GateThresholds()
        self.policies = policies or {}
        self.exceptions = exceptions or []
        self.exclude_paths = exclude_paths or []
        self.raw_config = raw_config or {}

    def is_rule_enabled(self, rule_id: str) -> bool:
        if rule_id in self.policies:
            return bool(self.policies[rule_id].get("enabled", True))
        if rule_id in BUILTIN_POLICIES_MAP:
            return BUILTIN_POLICIES_MAP[rule_id].enabled
        return True

    def get_rule_enforcement(self, rule_id: str) -> PolicyEnforcement:
        if rule_id in self.policies and "enforcement" in self.policies[rule_id]:
            val = str(self.policies[rule_id]["enforcement"]).upper()
            if val in VALID_ENFORCEMENTS:
                return PolicyEnforcement(val)
        if rule_id in BUILTIN_POLICIES_MAP:
            return BUILTIN_POLICIES_MAP[rule_id].default_enforcement
        return PolicyEnforcement.BLOCKING_FAILURE

    def get_rule_severity(self, rule_id: str) -> PolicySeverity:
        if rule_id in self.policies and "severity" in self.policies[rule_id]:
            val = str(self.policies[rule_id]["severity"]).upper()
            if val in VALID_SEVERITIES:
                return PolicySeverity(val)
        if rule_id in BUILTIN_POLICIES_MAP:
            return BUILTIN_POLICIES_MAP[rule_id].default_severity
        return PolicySeverity.HIGH

    def get_rule_config(self, rule_id: str) -> Dict[str, Any]:
        merged = {}
        if rule_id in BUILTIN_POLICIES_MAP:
            merged.update(BUILTIN_POLICIES_MAP[rule_id].config)
        if rule_id in self.policies and "config" in self.policies[rule_id]:
            merged.update(self.policies[rule_id]["config"])
        return merged

    def find_exception(
        self,
        rule_id: str,
        file_path: Optional[str] = None,
        algorithm: Optional[str] = None
    ) -> Optional[PolicyException]:
        """Check if a documented exception applies to this rule and context."""
        for exc in self.exceptions:
            if exc.rule_id != rule_id and exc.rule_id != "*":
                continue

            # Match file path if specified
            if exc.file_path and file_path:
                norm_exc = exc.file_path.replace("\\", "/").lower()
                norm_file = file_path.replace("\\", "/").lower()
                if norm_exc not in norm_file and not norm_file.endswith(norm_exc):
                    continue

            # Match algorithm if specified
            if exc.algorithm and algorithm:
                if exc.algorithm.upper() != algorithm.upper():
                    continue

            # Validate expiration date if specified
            if exc.expires_at:
                try:
                    exp_clean = exc.expires_at.strip()
                    if "T" in exp_clean:
                        exp_dt = datetime.datetime.fromisoformat(exp_clean.replace("Z", "+00:00"))
                        now_dt = datetime.datetime.now(exp_dt.tzinfo)
                        if now_dt > exp_dt:
                            logger.info(f"Policy exception for rule '{rule_id}' expired at {exp_clean}; ignoring.")
                            continue
                    else:
                        exp_date = datetime.date.fromisoformat(exp_clean)
                        if datetime.date.today() > exp_date:
                            logger.info(f"Policy exception for rule '{rule_id}' expired on {exp_clean}; ignoring.")
                            continue
                except Exception as ex:
                    logger.warning(f"Could not parse exception expiry date '{exc.expires_at}': {ex}")

            return exc
        return None

    def is_path_excluded(self, file_path: Optional[str]) -> bool:
        """Check if file path matches any exclusion glob."""
        if not file_path or not self.exclude_paths:
            return False
        import fnmatch
        norm_path = file_path.replace("\\", "/").lower()
        for pattern in self.exclude_paths:
            norm_pattern = pattern.replace("\\", "/").lower()
            if fnmatch.fnmatch(norm_path, norm_pattern) or norm_pattern in norm_path:
                return True
        return False


def parse_policy_config_content(content: str, source_name: str = "quantumshield.yml") -> ProjectPolicyConfig:
    """Parse and validate YAML or JSON configuration string."""
    if not content or not content.strip():
        raise PolicyConfigValidationError(f"Configuration file '{source_name}' is empty.")

    try:
        data = yaml.safe_load(content)
    except Exception as e:
        raise PolicyConfigValidationError(f"Failed to parse YAML/JSON from '{source_name}': {str(e)}")

    if not isinstance(data, dict):
        raise PolicyConfigValidationError(f"Configuration root in '{source_name}' must be a mapping dictionary.")

    return validate_and_build_config(data, source_name)


def parse_policy_config_file(file_path: str) -> ProjectPolicyConfig:
    """Load, parse, and validate quantumshield.yml from disk."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Configuration file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return parse_policy_config_content(content, source_name=file_path)


def validate_and_build_config(data: Dict[str, Any], source_name: str = "configuration") -> ProjectPolicyConfig:
    """Strict schema validation."""
    version = str(data.get("version", "2.0"))
    if version not in ["1.0", "2.0"]:
        raise PolicyConfigValidationError(f"Invalid schema version '{version}'. Supported versions: '1.0', '2.0'.")

    project_name = data.get("project_name")

    # Gate & Thresholds
    gate_data = data.get("gate", {})
    if not isinstance(gate_data, dict):
        raise PolicyConfigValidationError(f"'gate' must be a mapping dictionary in {source_name}.")

    thresholds_data = gate_data.get("thresholds", {})
    if not isinstance(thresholds_data, dict):
        raise PolicyConfigValidationError(f"'gate.thresholds' must be a dictionary in {source_name}.")

    thresholds = GateThresholds(
        max_critical_findings=int(thresholds_data.get("max_critical_findings", 0)),
        max_high_findings=int(thresholds_data.get("max_high_findings", 3)),
        max_classical_risk_score=float(thresholds_data.get("max_classical_risk_score", 75.0)),
        max_quantum_risk_score=float(thresholds_data.get("max_quantum_risk_score", 85.0)),
        min_quantum_readiness_score=float(thresholds_data.get("min_quantum_readiness_score", 15.0)),
        require_cbom=bool(thresholds_data.get("require_cbom", True)),
        fail_on_blocking=bool(gate_data.get("fail_on_blocking", True)),
        fail_on_manual_review=bool(gate_data.get("fail_on_manual_review", False))
    )

    # Policies mapping
    policies_data = data.get("policies", {})
    if not isinstance(policies_data, dict):
        raise PolicyConfigValidationError(f"'policies' must be a mapping of rule IDs in {source_name}.")

    validated_policies: Dict[str, Dict[str, Any]] = {}
    for rule_id, rule_conf in policies_data.items():
        if not isinstance(rule_conf, dict):
            raise PolicyConfigValidationError(f"Configuration for rule '{rule_id}' must be a dictionary.")

        # Validate enforcement mode if provided
        if "enforcement" in rule_conf:
            enf = str(rule_conf["enforcement"]).upper()
            if enf not in VALID_ENFORCEMENTS:
                raise PolicyConfigValidationError(
                    f"Invalid enforcement '{enf}' for rule '{rule_id}'. "
                    f"Must be one of: {', '.join(sorted(VALID_ENFORCEMENTS))}."
                )

        # Validate severity if provided
        if "severity" in rule_conf:
            sev = str(rule_conf["severity"]).upper()
            if sev not in VALID_SEVERITIES:
                raise PolicyConfigValidationError(
                    f"Invalid severity '{sev}' for rule '{rule_id}'. "
                    f"Must be one of: {', '.join(sorted(VALID_SEVERITIES))}."
                )

        validated_policies[rule_id] = rule_conf

    # Exceptions validation - MUST have documented justification
    exceptions_list = data.get("exceptions", [])
    if not isinstance(exceptions_list, list):
        raise PolicyConfigValidationError(f"'exceptions' must be a list of items in {source_name}.")

    validated_exceptions: List[PolicyException] = []
    for idx, exc_item in enumerate(exceptions_list):
        if not isinstance(exc_item, dict):
            raise PolicyConfigValidationError(f"Exception #{idx + 1} must be a dictionary.")

        rule_id = exc_item.get("rule_id")
        if not rule_id or not str(rule_id).strip():
            raise PolicyConfigValidationError(f"Exception #{idx + 1} missing required 'rule_id'.")

        reason = exc_item.get("reason")
        if not reason or not str(reason).strip() or len(str(reason).strip()) < 5:
            raise PolicyConfigValidationError(
                f"Exception for rule '{rule_id}' lacks documented justification. "
                "A clear security reason (minimum 5 characters) is mandatory."
            )

        validated_exceptions.append(PolicyException(
            rule_id=str(rule_id).strip(),
            file_path=exc_item.get("file_path"),
            algorithm=exc_item.get("algorithm"),
            reason=str(reason).strip(),
            approved_by=exc_item.get("approved_by", "Security Administrator"),
            expires_at=exc_item.get("expires_at")
        ))

    # Exclude paths
    exclude_paths = data.get("exclude_paths", [])
    if not isinstance(exclude_paths, list):
        raise PolicyConfigValidationError(f"'exclude_paths' must be a list of path strings in {source_name}.")

    return ProjectPolicyConfig(
        version=version,
        project_name=project_name,
        thresholds=thresholds,
        policies=validated_policies,
        exceptions=validated_exceptions,
        exclude_paths=[str(p) for p in exclude_paths],
        raw_config=data
    )

