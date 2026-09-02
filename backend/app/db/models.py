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
