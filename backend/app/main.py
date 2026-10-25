import os
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db.database import engine, get_db, Base
from .db.models import ScanRecord, CryptographicAsset, FindingRecord
from .scanner.file_processor import FileProcessor
from .crypto_engine.detector import CryptoDetector
from .crypto_engine.tls_domain_scanner import scan_domain_tls
from .quantum_engine.threat_analyzer import analyze_all_findings
from .quantum_engine.shor_simulator import run_shor_simulation
from .quantum_engine.grover_simulator import run_grover_simulation
from .quantum_engine.bbm92_simulator import run_bbm92_simulation
from .quantum_engine.schemas import BBM92SimulationRequest, BBM92SimulationResponse
from .quantum_engine.circuit_utils import is_qiskit_available
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

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "QuantumShield Security Engine API",
        "health": "/api/health",
        "docs": "/docs"
    }

@app.get("/api/health")
@app.get("/health")
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

# ==================== QUANTUM SIMULATION MODULE ENDPOINTS ====================

@app.post("/api/quantum/shor")
def trigger_shor_simulation(
    target_number: Optional[int] = Form(15),
    coprime_a: Optional[int] = Form(7),
    shots: Optional[int] = Form(1024)
):
    """Execute live Qiskit Shor's algorithm simulation for toy RSA target (N=15)."""
    return run_shor_simulation(N=target_number or 15, a=coprime_a or 7, shots=shots or 1024)

@app.post("/api/quantum/grover")
def trigger_grover_simulation(
    target_state: Optional[str] = Form("101"),
    shots: Optional[int] = Form(1024)
):
    """Execute live Qiskit Grover's algorithm simulation for symmetric key space search."""
    return run_grover_simulation(target_state=target_state or "101", shots=shots or 1024)

@app.post("/api/quantum/bbm92/run")
@app.post("/quantum/bbm92/run")
async def trigger_bbm92_simulation(request: Request):
    """
    Execute live BBM92 entanglement-based Quantum Key Distribution (QKD) simulation using Qiskit Aer.
    Accepts JSON body, form data, or query parameters.
    """
    pair_count = 50
    scenario = "ideal"
    noise_rate = 0.08
    eve_intercept_prob = 1.0
    test_fraction = 0.35

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = await request.json()
            if isinstance(data, dict):
                if "pair_count" in data and data["pair_count"] is not None:
                    pair_count = int(data["pair_count"])
                if "scenario" in data and data["scenario"] is not None:
                    scenario = str(data["scenario"])
                if "noise_rate" in data and data["noise_rate"] is not None:
                    noise_rate = float(data["noise_rate"])
                if "eve_intercept_prob" in data and data["eve_intercept_prob"] is not None:
                    eve_intercept_prob = float(data["eve_intercept_prob"])
                if "test_fraction" in data and data["test_fraction"] is not None:
                    test_fraction = float(data["test_fraction"])
        except Exception:
            pass
    elif "form" in content_type:
        try:
            form = await request.form()
            if "pair_count" in form and form["pair_count"]:
                pair_count = int(form["pair_count"])
            if "scenario" in form and form["scenario"]:
                scenario = str(form["scenario"])
            if "noise_rate" in form and form["noise_rate"]:
                noise_rate = float(form["noise_rate"])
            if "eve_intercept_prob" in form and form["eve_intercept_prob"]:
                eve_intercept_prob = float(form["eve_intercept_prob"])
            if "test_fraction" in form and form["test_fraction"]:
                test_fraction = float(form["test_fraction"])
        except Exception:
            pass
    else:
        params = request.query_params
        if "pair_count" in params and params["pair_count"]:
            pair_count = int(params["pair_count"])
        if "scenario" in params and params["scenario"]:
            scenario = str(params["scenario"])
        if "noise_rate" in params and params["noise_rate"]:
            noise_rate = float(params["noise_rate"])
        if "eve_intercept_prob" in params and params["eve_intercept_prob"]:
            eve_intercept_prob = float(params["eve_intercept_prob"])
        if "test_fraction" in params and params["test_fraction"]:
            test_fraction = float(params["test_fraction"])

    return run_bbm92_simulation(
        pair_count=pair_count,
        scenario=scenario,
        noise_rate=noise_rate,
        eve_intercept_prob=eve_intercept_prob,
        test_fraction=test_fraction
    )


@app.get("/api/quantum/analysis/{scan_id}")
def get_quantum_analysis(scan_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed quantum risk analysis and available Qiskit simulation parameters for a scan."""
    scan_data = get_scan_result(scan_id, db)
    findings = scan_data.get("findings", [])

    shor_targets = []
    grover_targets = []

    for f in findings:
        algo = f.get("algorithm", "").upper()
        if algo in {"RSA", "ECC", "ECDSA", "ECDH", "DH", "DSA"}:
            shor_targets.append({
                "algorithm": algo,
                "variant": f.get("variant"),
                "file_path": f.get("file_path"),
                "suggested_n": 15,
                "suggested_a": 7
            })
        elif algo in {"AES", "SHA-256", "DES", "3DES"}:
            grover_targets.append({
                "algorithm": algo,
                "variant": f.get("variant"),
                "file_path": f.get("file_path"),
                "suggested_target_state": "101"
            })

    return {
        "scan_id": scan_id,
        "qiskit_available": is_qiskit_available(),
        "shor_applicable_count": len(shor_targets),
        "grover_applicable_count": len(grover_targets),
        "shor_targets": shor_targets,
        "grover_targets": grover_targets,
        "overall_quantum_score": scan_data.get("scores", {}).get("quantum_score", 0)
    }

