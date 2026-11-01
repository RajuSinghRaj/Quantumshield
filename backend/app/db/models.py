import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(String, primary_key=True, index=True)
    project_name = Column(String, index=True)
    scan_type = Column(String)  # zip, cert, code, config, domain, demo
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Scores
    classical_score = Column(Float, default=0.0)
    quantum_score = Column(Float, default=0.0)
    pqc_score = Column(Float, default=0.0)
    overall_risk = Column(String, default="LOW") # CRITICAL, HIGH, MEDIUM, LOW
    
    # Summary JSONs
    score_breakdown = Column(JSON, nullable=True)
    asset_counts = Column(JSON, nullable=True)
    file_list = Column(JSON, nullable=True)
    cbom_data = Column(JSON, nullable=True) # CycloneDX 1.6 Cryptographic Bill of Materials
    dependency_data = Column(JSON, nullable=True) # Cryptographic Dependency Mapping & Graph
    tls_data = Column(JSON, nullable=True) # Live TLS Handshake & Domain Security Analysis
    certificate_data = Column(JSON, nullable=True) # Analyzed X.509 Certificates & Chains
    hndl_data = Column(JSON, nullable=True) # Harvest-Now-Decrypt-Later Risk Analysis & User Assessments
    risk_analysis_data = Column(JSON, nullable=True) # Unified Quantum Risk Intelligence Analysis & Priorities
    remediation_data = Column(JSON, nullable=True) # Migration Sandbox Proposals, Applied Patches & Audit Trail
    
    # Relationships
    assets = relationship("CryptographicAsset", back_populates="scan", cascade="all, delete-orphan")
    findings = relationship("FindingRecord", back_populates="scan", cascade="all, delete-orphan")


class CryptographicAsset(Base):
    __tablename__ = "cryptographic_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scan_records.id"))
    
    algorithm = Column(String, index=True)      # RSA, AES, ECDSA, ML-KEM, etc.
    variant = Column(String, nullable=True)     # AES-256-GCM, RSA-2048, P-256
    key_size = Column(Integer, nullable=True)   # 2048, 256, 128, 768
    usage = Column(String)                     # ENCRYPTION, DIGITAL_SIGNATURE, KEY_EXCHANGE, HASHING, PASSWORD_HASHING, KEY_GEN, UNKNOWN
    
    curve_or_parameters = Column(String, nullable=True) # secp256r1, FFDHE-2048, GCM, etc.
    library_or_api = Column(String, nullable=True)      # cryptography, Node crypto, java.security, etc.
    detection_method = Column(String, nullable=True)    # Python AST, JavaScript Parser, Java API, etc.

    file_path = Column(String)
    line_number = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    
    classical_risk = Column(String)            # CRITICAL, HIGH, MEDIUM, LOW, SAFE
    quantum_risk = Column(String)              # VULNERABLE, DEGRADED, SAFE, POST_QUANTUM
    quantum_threat = Column(String)            # Shor's Algorithm, Grover Search, None
    
    scan = relationship("ScanRecord", back_populates="assets")


class FindingRecord(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scan_records.id"))
    
    title = Column(String)
    severity = Column(String)                  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    algorithm = Column(String)
    file_path = Column(String)
    line_number = Column(Integer, nullable=True)
    usage = Column(String)
    
    classical_status = Column(String)
    quantum_status = Column(String)
    quantum_threat = Column(String)
    
    explanation = Column(Text)
    why_problem = Column(Text)                 # "WHY IS THIS A PROBLEM?" educational content
    recommendation = Column(Text)              # "WHAT SHOULD I DO?" recommendation
    pqc_alternative = Column(String, nullable=True) # e.g. ML-KEM, ML-DSA
    
    scan = relationship("ScanRecord", back_populates="findings")


class SecurityPolicyModel(Base):
    __tablename__ = "security_policies"

    id = Column(String, primary_key=True, index=True) # e.g. "rule_reject_md5"
    name = Column(String, index=True)
    category = Column(String, index=True)             # CLASSICAL, QUANTUM, DEPENDENCY, CBOM
    description = Column(Text)
    default_severity = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW, INFO
    default_enforcement = Column(String, default="BLOCKING_FAILURE") # BLOCKING_FAILURE, ADVISORY_WARNING, MANUAL_REVIEW_REQUIRED
    enabled = Column(Integer, default=1)              # 1 for True, 0 for False (SQLite friendly)
    is_builtin = Column(Integer, default=1)           # 1 for Builtin, 0 for Custom
    config_json = Column(JSON, nullable=True)         # Specific parameters (e.g. min_rsa_bits: 2048)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class DevSecOpsAssessmentModel(Base):
    __tablename__ = "devsecops_assessments"

    id = Column(String, primary_key=True, index=True) # UUID
    scan_id = Column(String, ForeignKey("scan_records.id"), nullable=True, index=True)
    project_name = Column(String, index=True)
    pipeline_status = Column(String, index=True)      # PASS, PASS_WITH_WARNINGS, FAIL, MANUAL_REVIEW_REQUIRED
    
    blocking_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    
    gate_summary = Column(Text)
    policy_results_json = Column(JSON, nullable=True)
    thresholds_json = Column(JSON, nullable=True)
    assessment_json = Column(JSON, nullable=True)
    exceptions_applied_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

