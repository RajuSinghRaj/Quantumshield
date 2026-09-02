# QUANTUMSHIELD 🛡️⚛️
### Quantum Cryptographic Vulnerability & Post-Quantum Readiness Scanner

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescript.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![NIST PQC](https://img.shields.io/badge/NIST%20PQC-FIPS%20203%20%7C%20204%20%7C%20205-purple.svg)](https://csrc.nist.gov/projects/post-quantum-cryptography)

> **"How secure is my cryptography today, and how prepared is it for the quantum era?"**

QuantumShield is a production-grade cybersecurity tool engineered to audit source code, X.509 certificates, TLS domain configurations, public keys, and project ZIP archives. It evaluates classical security and quantum-era vulnerability against Shor's and Grover's quantum algorithms, generating actionable NIST-aligned remediation plans and PDF audit reports.

---

## 🌟 Key Features

- ⚛️ **Quantum Vulnerability Engine**: Detects 100+ cryptographic algorithms and identifies primitives broken by Shor's algorithm (RSA, ECC, ECDSA, ECDH) or degraded by Grover's search (AES-128, SHA-256).
- 🛡️ **NIST PQC Migration Advisor**: Provides automated migration pathways to official NIST standards:
  - **FIPS 203**: ML-KEM (Module-Lattice-Based Key Encapsulation)
  - **FIPS 204**: ML-DSA (Module-Lattice-Based Digital Signatures)
  - **FIPS 205**: SLH-DSA (Stateless Hash-Based Digital Signatures)
- 📊 **Dynamic Readiness Scoring**: Transparent 0–100 scoring model evaluating Classical Security, Quantum Resistance, and PQC Adoption percentage.
- 🎨 **Futuristic Full-Bleed UI**: React 19 + TypeScript + Tailwind CSS v4 dashboard featuring interactive 3D vector graphics, continuous spinning hologram animations, and light/dark theme modes.
- 📄 **Automated PDF Audit Reports**: One-click ReportLab PDF generation with executive summaries, risk breakdowns, line-level code highlights, and migration roadmaps.
- 🔒 **Zero-Private-Key Retention Policy**: Mandated redaction pipeline ensuring private key structures are scrubbed before storage.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18.0+ / npm 9+

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the API server
python run.py
```
The FastAPI backend will start running locally at: `http://localhost:8000`

### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend dashboard will open at: `http://localhost:5173` (or active dev port).

---

## 🏗️ Project Architecture

```
QUANTUMSHIELD/
├── backend/
│   ├── app/
│   │   ├── crypto_engine/       # AST, Regex, X.509, & TLS inspection modules
│   │   ├── quantum_engine/      # Shor's & Grover's threat evaluators
│   │   ├── risk_engine/         # 0-100 Scoring & deduction logic
│   │   ├── recommendation_engine/# PQC Migration Advisor (FIPS 203/204/205)
│   │   ├── report_engine/       # ReportLab PDF Generator
│   │   ├── db/                  # SQLite & SQLAlchemy models
│   │   └── main.py              # FastAPI endpoints & orchestration
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Hero, Navbar, 3D Assets, Gauges, Cards
│   │   ├── pages/               # LandingPage, DashboardPage
│   │   ├── services/            # Axios API Client
│   │   ├── types/               # TypeScript interfaces
│   │   └── index.css            # Tailwind CSS v4 glassmorphic theme & animations
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 📄 License

This project is open-source under the MIT License.
