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

- ⚛️ **Quantum Vulnerability & Simulation Engine (Qiskit)**: Live educational Qiskit circuits running on local `AerSimulator`:
  - **BBM92 Quantum Key Distribution (QKD) Lab**: Entanglement-based quantum key establishment (Bennett-Brassard-Mermin 1992) using $|\Phi^+\rangle = (|00\rangle + |11\rangle)/\sqrt{2}$ Bell pairs. Features independent random $Z/X$ basis measurements, classical basis sifting, test-sample parameter estimation, QBER calculation, and Eve intercept-resend attack perturbation.
  - **Shor's Algorithm Simulation**: Demonstrates polynomial-time order finding and prime factorization ($N=15 \to 3 \times 5$) on an 8-qubit Quantum Phase Estimation circuit.
  - **Grover's Algorithm Simulation**: Demonstrates amplitude amplification (>94% probability peak) over 3 qubits for symmetric key search space, illustrating classical $O(N)$ vs quantum $O(\sqrt{N})$ complexity margins.
  - **Quantum Risk Mapping Layer**: Evaluates RSA/ECC/ECDSA/ECDH/DH/DSA $\to$ Shor Vulnerable, AES-128 $\to$ Grover Degraded (64-bit effective margin), and AES-256 $\to$ Safe (128-bit quantum security margin).
  - **Dedicated Quantum Lab Dashboard**: Interactive hub featuring Alice-Source-Eve-Bob topology diagrams, circuit specifications, gate breakdown, ASCII circuit rendering, Recharts probability histograms, and Quirk reference links.
- 🛡️ **NIST PQC Migration Advisor**: Provides automated migration pathways to official NIST standards:
  - **FIPS 203**: ML-KEM (Module-Lattice-Based Key Encapsulation)
  - **FIPS 204**: ML-DSA (Module-Lattice-Based Digital Signatures)
  - **FIPS 205**: SLH-DSA (Stateless Hash-Based Digital Signatures)
- 📊 **Dynamic Readiness Scoring**: Transparent 0–100 scoring model evaluating Classical Security, Quantum Resistance, and PQC Adoption percentage.
- 🎨 **Futuristic Full-Bleed UI**: React 19 + TypeScript + Tailwind CSS v4 dashboard featuring interactive 3D vector graphics, continuous spinning hologram animations, and light/dark theme modes.
- 📄 **Automated PDF Audit Reports**: One-click ReportLab PDF generation with executive summaries, risk breakdowns, line-level code highlights, and migration roadmaps.
- 🔒 **Zero-Private-Key Retention Policy**: Mandated redaction pipeline ensuring private key structures are scrubbed before storage.

---

## 🔌 API Endpoints

- `POST /api/scan/upload` — Audit uploaded source files, certificates, or ZIP archives.
- `POST /api/scan/domain` — Inspect public TLS certificate and cipher suite.
- `POST /api/scan/demo` — Run instant scan on pre-loaded demo target.
- `POST /api/quantum/bbm92/run` — Execute live Qiskit BBM92 entanglement-based QKD simulation (Ideal, Eve Intercept-Resend, Noisy Channel).
- `POST /api/quantum/shor` — Execute live Qiskit Shor simulation ($N=15, a=7$).
- `POST /api/quantum/grover` — Execute live Qiskit Grover search simulation (Target state `101`).
- `GET /api/quantum/analysis/{scan_id}` — Fetch quantum threat targets and simulation parameters.
- `GET /api/scan/{scan_id}/report.pdf` — Download PDF security report.

---

## 🏗️ Project Architecture

```
QUANTUMSHIELD/
├── backend/
│   ├── app/
│   │   ├── crypto_engine/       # AST, Regex, X.509, & TLS inspection modules
│   │   ├── quantum_engine/      # Qiskit Shor & Grover simulators, Risk Mapping, Circuit Utils
│   │   ├── risk_engine/         # 0-100 Scoring & deduction logic
│   │   ├── recommendation_engine/# PQC Migration Advisor (FIPS 203/204/205)
│   │   ├── report_engine/       # ReportLab PDF Generator
│   │   ├── db/                  # SQLite & SQLAlchemy models
│   │   └── main.py              # FastAPI endpoints & orchestration
│   ├── requirements.txt
│   ├── run.py
│   └── test_quantum_engine.py   # Quantum engine verification suite
│
├── frontend/
│   ├── src/
│   │   ├── components/          # QuantumAnalysisCard, Hero, Gauges, Cards
│   │   ├── pages/               # QuantumLabPage, DashboardPage, LandingPage
│   │   ├── services/            # Axios API Client (Quantum & Scanner)
│   │   ├── types/               # QuantumSimulationResult & Scan interfaces
│   │   └── index.css            # Tailwind CSS v4 glassmorphic theme
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 📄 License

This project is open-source under the MIT License.
