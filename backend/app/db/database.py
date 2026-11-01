import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "quantumshield.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_migrations():
    """Safely check and add any missing columns in existing SQLite DB tables without dropping data."""
    if not os.path.exists(DB_PATH):
        return
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check scan_records columns
        cursor.execute("PRAGMA table_info(scan_records);")
        scan_cols = [c[1] for c in cursor.fetchall()]
        if scan_cols:
            if "cbom_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN cbom_data JSON;")
            if "dependency_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN dependency_data JSON;")
            if "tls_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN tls_data JSON;")
            if "certificate_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN certificate_data JSON;")
            if "hndl_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN hndl_data JSON;")
            if "risk_analysis_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN risk_analysis_data JSON;")
            if "remediation_data" not in scan_cols:
                cursor.execute("ALTER TABLE scan_records ADD COLUMN remediation_data JSON;")

        # Check cryptographic_assets columns
        cursor.execute("PRAGMA table_info(cryptographic_assets);")
        asset_cols = [c[1] for c in cursor.fetchall()]
        if asset_cols:
            if "curve_or_parameters" not in asset_cols:
                cursor.execute("ALTER TABLE cryptographic_assets ADD COLUMN curve_or_parameters TEXT;")
            if "library_or_api" not in asset_cols:
                cursor.execute("ALTER TABLE cryptographic_assets ADD COLUMN library_or_api TEXT;")
            if "detection_method" not in asset_cols:
                cursor.execute("ALTER TABLE cryptographic_assets ADD COLUMN detection_method TEXT;")

        conn.commit()
        conn.close()
    except Exception:
        pass

ensure_schema_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
