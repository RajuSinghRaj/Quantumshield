import os
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db.database import engine, get_db, Base
from .db.models import ScanRecord, CryptographicAsset, FindingRecord
from .scanner.file_processor import FileProcessor
from .crypto_engine.detector import CryptoDetector
from .crypto_engine.tls_domain_scanner import scan_domain_tls
from .quantum_engine.threat_analyzer import analyze_all_findings
from .risk_engine.scoring import calculate_quantum_scores
from .recommendation_engine.pqc_advisor import generate_migration_roadmap
from .report_engine.pdf_generator import generate_pdf_report
from .demo_data.sample_projects import DEMO_PROJECTS

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QuantumShield Security Scanner API",
    description="Quantum Cryptographic Vulnerability & Post-Quantum Readiness Engine",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QuantumShield Engine",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/demo-projects")
def list_demo_projects():
    """List available demo projects for quick scanning."""
    return [
        {
            "id": key,
            "name": val["name"],
            "description": val["description"],
            "category": val["category"]
        } for key, val in DEMO_PROJECTS.items()
    ]

def _run_scan_pipeline(project_name: str, scan_type: str, files_data: List[dict], db: Session) -> dict:
    """Core execution pipeline for scanning files data."""
    scan_id = str(uuid.uuid4())
    
    # 1. Multi-layer Cryptographic Detection
    raw_assets = CryptoDetector.detect_in_files(files_data)
    
    # 2. Security & Quantum Threat Analysis
    enriched_findings = analyze_all_findings(raw_assets)
    
    # 3. Risk & Quantum Readiness Scoring
    scores, breakdown = calculate_quantum_scores(enriched_findings)
    
    # 4. PQC Migration Roadmap
    migration_plan = generate_migration_roadmap(enriched_findings)
    
    # 5. Extract unique file list
    file_list = list({f["file_path"]: True for f in enriched_findings}.keys())
    if not file_list and files_data:
        file_list = [fd["rel_path"] for fd in files_data]

    # Asset counts by algorithm
    asset_counts = {}
    for f in enriched_findings:
        algo = f.get("algorithm", "UNKNOWN")
        asset_counts[algo] = asset_counts.get(algo, 0) + 1

    # Save to SQLite Database
    scan_rec = ScanRecord(
        id=scan_id,
        project_name=project_name,
        scan_type=scan_type,
        created_at=datetime.datetime.utcnow(),
        classical_score=scores["classical_score"],
        quantum_score=scores["quantum_score"],
        pqc_score=scores["pqc_score"],
        overall_risk=scores["overall_risk"],
        score_breakdown=breakdown,
        asset_counts=asset_counts,
        file_list=file_list
    )
    db.add(scan_rec)
    
    for f in enriched_findings:
        asset_obj = CryptographicAsset(
            scan_id=scan_id,
            algorithm=f.get("algorithm"),
            variant=f.get("variant"),
            key_size=f.get("key_size"),
            usage=f.get("usage"),
            file_path=f.get("file_path"),
            line_number=f.get("line_number"),
            code_snippet=f.get("code_snippet"),
            confidence=f.get("confidence", 1.0),
            classical_risk=f.get("classical_risk"),
            quantum_risk=f.get("quantum_risk"),
            quantum_threat=f.get("quantum_threat")
        )
        db.add(asset_obj)

        finding_obj = FindingRecord(
            scan_id=scan_id,
            title=f.get("title"),
            severity=f.get("severity"),
            algorithm=f.get("algorithm"),
            file_path=f.get("file_path"),
            line_number=f.get("line_number"),
            usage=f.get("usage"),
            classical_status=f.get("classical_risk"),
            quantum_status=f.get("quantum_risk"),
            quantum_threat=f.get("quantum_threat"),
            explanation=f.get("explanation"),
            why_problem=f.get("why_problem"),
            recommendation=f.get("recommendation"),
            pqc_alternative=f.get("pqc_alternative")
        )
        db.add(finding_obj)

    db.commit()

    # Build response payload
    return {
        "scan_id": scan_id,
        "project_name": project_name,
        "scan_type": scan_type,
        "created_at": scan_rec.created_at.isoformat(),
        "scores": scores,
        "breakdown": breakdown,
        "findings": enriched_findings,
        "migration_plan": migration_plan,
        "file_sources": {fd["rel_path"]: fd["content"] for fd in files_data},
        "asset_counts": asset_counts
    }

@app.post("/api/scan/upload")
async def scan_uploaded_files(
    files: List[UploadFile] = File(...),
    project_name: Optional[str] = Form("Uploaded Cryptography Audit"),
    db: Session = Depends(get_db)
):
    """Scan uploaded source files, certificates, configs, or ZIP packages."""
    files_data = []
    temp_dirs_to_clean = []

    try:
        for file in files:
            content_bytes = await file.read()
            filename = file.filename
            
            if filename.endswith(".zip"):
                temp_dir, zip_files = FileProcessor.process_zip(content_bytes)
                temp_dirs_to_clean.append(temp_dir)
                files_data.extend(zip_files)
            else:
                single_file = FileProcessor.process_single_file(filename, content_bytes)
                files_data.append(single_file)

        if not files_data:
            raise HTTPException(status_code=400, detail="No readable source code or certificate files found.")

        result = _run_scan_pipeline(project_name, "upload", files_data, db)
        return result
    finally:
        for temp_dir in temp_dirs_to_clean:
            FileProcessor.cleanup_temp(temp_dir)

@app.post("/api/scan/domain")
def scan_domain(domain: str = Form(...), db: Session = Depends(get_db)):
    """Inspect public domain TLS certificate and handshake ciphers."""
    clean_domain = domain.strip()
    raw_findings = scan_domain_tls(clean_domain)
    
    files_data = [
        {
            "rel_path": f"tls://{clean_domain}:443",
            "extension": ".pem",
            "content": f"# Public TLS Inspection Target: {clean_domain}\n# Protocol: TLS 1.3\n",
            "lines": [f"# Public TLS Inspection Target: {clean_domain}", "# Protocol: TLS 1.3"]
        }
    ]
    
    scan_id = str(uuid.uuid4())
    enriched_findings = analyze_all_findings(raw_findings)
    scores, breakdown = calculate_quantum_scores(enriched_findings)
    migration_plan = generate_migration_roadmap(enriched_findings)

    # Asset counts by algorithm
    asset_counts = {}
    for f in enriched_findings:
        algo = f.get("algorithm", "UNKNOWN")
        asset_counts[algo] = asset_counts.get(algo, 0) + 1

    scan_rec = ScanRecord(
        id=scan_id,
        project_name=f"TLS Audit: {clean_domain}",
        scan_type="domain",
        created_at=datetime.datetime.utcnow(),
        classical_score=scores["classical_score"],
        quantum_score=scores["quantum_score"],
        pqc_score=scores["pqc_score"],
        overall_risk=scores["overall_risk"],
        score_breakdown=breakdown,
        asset_counts=asset_counts,
        file_list=[f"tls://{clean_domain}:443"]
    )
    db.add(scan_rec)
    db.commit()

    return {
        "scan_id": scan_id,
        "project_name": f"TLS Audit: {clean_domain}",
        "scan_type": "domain",
        "created_at": scan_rec.created_at.isoformat(),
        "scores": scores,
        "breakdown": breakdown,
        "findings": enriched_findings,
        "migration_plan": migration_plan,
        "file_sources": {fd["rel_path"]: fd["content"] for fd in files_data},
        "asset_counts": asset_counts
    }

@app.post("/api/scan/demo")
def scan_demo_project(project_id: str = Form(...), db: Session = Depends(get_db)):
    """Run instant scan on pre-loaded demo project."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Demo project not found.")

    demo = DEMO_PROJECTS[project_id]
    files_data = demo["files"]
    return _run_scan_pipeline(demo["name"], "demo", files_data, db)

@app.get("/api/scan/{scan_id}")
def get_scan_result(scan_id: str, db: Session = Depends(get_db)):
    """Retrieve scan result by ID from SQLite DB."""
    rec = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    assets = db.query(CryptographicAsset).filter(CryptographicAsset.scan_id == scan_id).all()
    findings = db.query(FindingRecord).filter(FindingRecord.scan_id == scan_id).all()

    findings_list = []
    for f in findings:
        findings_list.append({
            "title": f.title,
            "severity": f.severity,
            "algorithm": f.algorithm,
            "variant": f.algorithm, # Fallback
            "file_path": f.file_path,
            "line_number": f.line_number,
            "usage": f.usage,
            "classical_risk": f.classical_status,
            "quantum_risk": f.quantum_status,
            "quantum_threat": f.quantum_threat,
            "explanation": f.explanation,
            "why_problem": f.why_problem,
            "recommendation": f.recommendation,
            "pqc_alternative": f.pqc_alternative
        })

    migration_plan = generate_migration_roadmap(findings_list)

    return {
        "scan_id": rec.id,
        "project_name": rec.project_name,
        "scan_type": rec.scan_type,
        "created_at": rec.created_at.isoformat(),
        "scores": {
            "classical_score": rec.classical_score,
            "quantum_score": rec.quantum_score,
            "pqc_score": rec.pqc_score,
            "overall_risk": rec.overall_risk
        },
        "breakdown": rec.score_breakdown,
        "findings": findings_list,
        "migration_plan": migration_plan,
        "asset_counts": rec.asset_counts or {}
    }

@app.get("/api/scan/{scan_id}/report.pdf")
def download_pdf_report(scan_id: str, db: Session = Depends(get_db)):
    """Generate and download PDF security report."""
    scan_data = get_scan_result(scan_id, db)
    pdf_bytes = generate_pdf_report(
        scan_record_data=scan_data,
        findings=scan_data["findings"],
        migration_plan=scan_data["migration_plan"]
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=QuantumShield_Audit_{scan_id[:8]}.pdf"}
    )

@app.get("/api/history")
def get_scan_history(db: Session = Depends(get_db)):
    """List recent scan records."""
    records = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).all()
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "project_name": r.project_name,
            "scan_type": r.scan_type,
            "created_at": r.created_at.isoformat(),
            "quantum_score": r.quantum_score,
            "classical_score": r.classical_score,
            "overall_risk": r.overall_risk,
            "asset_counts": r.asset_counts or {}
        })
    return history

@app.delete("/api/history/{scan_id}")
def delete_scan_record(scan_id: str, db: Session = Depends(get_db)):
    """Delete a scan record from DB."""
    rec = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    db.delete(rec)
    db.commit()
    return {"message": f"Scan {scan_id} deleted successfully."}
